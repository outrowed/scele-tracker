import { load, type CheerioAPI } from 'cheerio';
import { resolve } from 'node:path';
import { openCache } from './cache.js';
import {
  getUserMoodleSession,
  plainText,
  MoodleSessionExpired,
  type MoodleSession,
} from './moodle.js';
import type { Activity } from './types.js';

// Only explicit Moodle completion evidence is interpreted; missing markup is unknown.
export function completionFromMarkup(html: string): 'completed' | 'pending' | 'unknown' {
  const $ = load(html);
  // Only a matching activity node is passed here; avoid reading child activity state.
  const state = $('[data-completionstate]').first().attr('data-completionstate');
  if (state === '1' || state === '2' || state === '3') return 'completed';
  if (state === '0') return 'pending';
  const text = $(
    '[data-region="completion-info"], .automatic-completion-conditions, .completion-info',
  )
    .first()
    .text();
  if (/\bto do:/i.test(text)) return 'pending';
  if (/\bdone:/i.test(text)) return 'completed';
  return 'unknown';
}

// Only explicit timing text from the signed-in submission summary can assert lateness.
export function submittedLateFromActivityPage(html: string): boolean | undefined {
  const $ = load(html);
  const row = $('.submissionstatustable table.generaltable tr')
    .filter((_i, el) => /^time remaining$/i.test($(el).find('th').first().text().trim()))
    .first();
  const cell = row.find('td').first();
  const text = cell.text().replace(/\s+/g, ' ').trim();
  if (/\bsubmitted\b.*\blate\b/i.test(text)) return true;
  if (/\bsubmitted\b.*\bearly\b/i.test(text)) return false;
  return undefined;
}

// This is "done" in the tracker, not Moodle's configurable completion flag.
export function completionFromActivityPage(
  html: string,
  kind: Activity['kind'],
): 'completed' | 'pending' | 'unknown' {
  const $ = load(html);
  if (kind === 'assignment') {
    // SCELE wraps the actual generaltable in a submissionstatustable div.
    const table = $('.submissionstatustable table.generaltable');
    const row = table
      .find('tr')
      .filter((_i, el) =>
        /^submission status$/i.test($(el).find('th').first().text().trim()),
      )
      .first();
    const status = row.find('td').first().text().replace(/\s+/g, ' ').trim();
    if (/^submitted for grading$/i.test(status)) return 'completed';
    // SCELE uses "No attempt" for assignments with no submission yet.
    if (/^(draft.*|no submission|not submitted|no attempt)$/i.test(status))
      return 'pending';
    return 'unknown';
  }
  const summary = $('table.quizattemptsummary');
  if (
    summary
      .find('tbody tr a[href]')
      .toArray()
      .some((el) => {
        const href = $(el).attr('href') || '';
        const url = new URL(href, 'https://scele.cs.ui.ac.id');
        return (
          url.origin === 'https://scele.cs.ui.ac.id' &&
          url.pathname === '/mod/quiz/review.php'
        );
      })
  )
    return 'completed';
  return 'unknown';
}

type PersonalData = { activities: Activity[]; incomplete: boolean; preparing: boolean };

let cache: ReturnType<typeof openCache> | undefined;
function personalCache() {
  return (cache ??= openCache(process.env.CACHE_DB_PATH || resolve('data/cache.sqlite')));
}

export function closePersonalCache() {
  cache?.close();
  cache = undefined;
}

const snapshots = new WeakMap<
  MoodleSession,
  {
    at: number;
    data?: PersonalData;
    pending?: Promise<PersonalData>;
    enriching?: Promise<void>;
    failedAt?: number;
    expired?: boolean;
    courses?: { id: number; fullname: string }[];
  }
>();
export async function personalSnapshot(username: string) {
  const session = getUserMoodleSession(username);
  if (!session) throw new MoodleSessionExpired();
  const cached = snapshots.get(session);
  if (cached?.expired) throw new MoodleSessionExpired();
  if (cached?.data) {
    if (
      !cached.enriching &&
      !cached.data.preparing &&
      Date.now() - cached.at >= 60_000 &&
      (!cached.failedAt || Date.now() - cached.failedAt >= 60_000)
    ) {
      startEnrichment(cached, session, username);
    }
    return copyData(cached.data);
  }
  if (cached?.pending) return copyData(await cached.pending);
  const entry: NonNullable<ReturnType<typeof snapshots.get>> = { at: Date.now() };
  snapshots.set(session, entry);
  entry.pending = (async () => {
    const db = personalCache();
    const { courses } = await session.call<{
      courses: { id: number; fullname: string }[];
    }>('core_course_get_enrolled_courses_by_timeline_classification', {
      classification: 'all',
      limit: 0,
      offset: 0,
    });
    if (!Array.isArray(courses)) throw new Error('Invalid Moodle courses');
    db.setUserCourses(username, courses, Date.now());
    const shared = db.getCourseSyncStatus(courses.map((course) => course.id));
    const ready =
      shared.length === courses.length &&
      shared.every((state) => Date.now() - state.updatedAt < 60 * 60_000);
    // Enrollment was just verified. Serve cached definitions, dates and this user's
    // completion evidence together, even when a course needs revalidation.
    const cachedActivities = db.getActivitiesForUser(username);
    if (ready || cachedActivities.length) {
      const data: PersonalData = {
        activities: cachedActivities,
        incomplete: false,
        preparing: false,
      };
      entry.data = data;
      entry.courses = courses;
      entry.at = 0;
      startEnrichment(entry, session, username);
      return data;
    }
    let incomplete = false;
    const discovered = await mapLimited(courses, 3, async (course) => {
      try {
        const $ = load(await session.request(`/course/view.php?id=${course.id}`));
        if ($('input[name="password"]').length) throw new MoodleSessionExpired();
        return {
          courseId: course.id,
          items: parseCourseActivities($, course),
          failed: false,
        };
      } catch (error) {
        if (error instanceof MoodleSessionExpired) throw error;
        incomplete = true;
        return { courseId: course.id, items: [] as Activity[], failed: true };
      }
    });
    // Definitions are shared; completion evidence from course markup is user-owned.
    // A course with a failed scrape is never replaced with a partial empty result.
    for (const res of discovered) {
      if (!res.failed) {
        const found = res.items;
        const sync = db.getCourseSyncStatus([res.courseId])[0];
        if (!sync || Date.now() - sync.updatedAt >= 60 * 60_000) {
          if (found.length) {
            db.replaceCourseActivities(res.courseId, found, Date.now());
          } else {
            db.setCourseSyncStatus(res.courseId, Date.now());
          }
        }
        if (found.length) {
          db.updateUserActivityState(
            username,
            found
              .filter((item) => item.completion && item.completion !== 'unknown')
              .map((item) => ({
                activityId: item.id,
                completion: item.completion!,
              })),
            Date.now(),
          );
        }
      }
    }
    // Include calendar-only activities from the cache and preserve their dates
    // and personal evidence while discovery/enrichment is still running.
    const data: PersonalData = {
      activities: db.getActivitiesForUser(username).map((item) => ({
        ...item,
        datesPending: item.dueAt == null && item.closeAt == null,
      })),
      incomplete,
      preparing: true,
    };
    entry.data = data;
    entry.courses = courses;
    entry.at = Date.now();
    startEnrichment(entry, session, username);
    return data;
  })();
  try {
    return copyData(await entry.pending);
  } finally {
    entry.pending = undefined;
    if (!entry.data) snapshots.delete(session);
  }
}

function parseCourseActivities(
  $: CheerioAPI,
  course: { id: number; fullname: string },
): Activity[] {
  const found: Activity[] = [];
  $('a[href]').each((_i, element) => {
    const url = new URL($(element).attr('href') || '', 'https://scele.cs.ui.ac.id');
    const match = url.pathname.match(/^\/mod\/(assign|quiz)\/view\.php$/);
    const cmid = Number(url.searchParams.get('id'));
    if (
      url.origin !== 'https://scele.cs.ui.ac.id' ||
      !match ||
      !Number.isSafeInteger(cmid) ||
      cmid <= 0
    )
      return;
    const kind = match[1] === 'assign' ? 'assignment' : 'quiz';
    const id = `personal-${kind}-${cmid}`;
    if (found.some((item) => item.id === id)) return;
    const node = $(element).closest('li.activity, .activity');
    const name = $(element).find('.instancename').clone();
    name.find('.accesshide').remove();
    found.push({
      id,
      kind,
      courseId: course.id,
      courseName: plainText(course.fullname),
      name: plainText(name.text() || $(element).text()),
      description: plainText(
        node.find('.contentafterlink, .activity-description').first().html(),
      ),
      url: url.href,
      opensAt: null,
      dueAt: null,
      cutoffAt: null,
      timeLimit: null,
      source: 'personal',
      completion: completionFromMarkup($.html(node)),
    });
  });
  return found;
}

// A small shared concurrency cap avoids serial latency without flooding SCELE.
async function mapLimited<T, R>(
  items: T[],
  limit: number,
  run: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const index = next++;
        results[index] = await run(items[index]);
      }
    }),
  );
  return results;
}

function copyData(data: PersonalData): PersonalData {
  return { ...data, activities: data.activities.map((item) => ({ ...item })) };
}

// One enrichment per user session; retain the last published snapshot while
// upstream work runs. A failed refresh never empties already discovered courses.
function startEnrichment(
  entry: {
    at: number;
    data?: PersonalData;
    enriching?: Promise<void>;
    failedAt?: number;
    expired?: boolean;
    courses?: { id: number; fullname: string }[];
  },
  session: MoodleSession,
  username: string,
) {
  if (!entry.data || entry.enriching) return;
  const data = entry.data;
  data.preparing = true;
  entry.enriching = (async () => {
    const db = personalCache();
    let activities = data.activities.map((item) => ({ ...item }));
    let incomplete = data.incomplete;
    const courses = entry.courses ?? [];
    const stale = courses.filter((course) => {
      const sync = db.getCourseSyncStatus([course.id])[0];
      return !sync || Date.now() - sync.updatedAt >= 60 * 60_000;
    });
    await mapLimited(stale, 3, async (course) => {
      try {
        const $ = load(await session.request(`/course/view.php?id=${course.id}`));
        if ($('input[name="password"]').length) throw new MoodleSessionExpired();
        const found = parseCourseActivities($, course);
        if (found.length) db.replaceCourseActivities(course.id, found, Date.now());
        else db.setCourseSyncStatus(course.id, Date.now());
        db.updateUserActivityState(
          username,
          found
            .filter((item) => item.completion && item.completion !== 'unknown')
            .map((item) => ({ activityId: item.id, completion: item.completion! })),
          Date.now(),
        );
      } catch (error) {
        if (error instanceof MoodleSessionExpired) throw error;
        incomplete = true;
      }
    });
    if (stale.length) activities = db.getActivitiesForUser(username);
    const now = new Date();
    await mapLimited(
      Array.from({ length: 19 }, (_, i) => i - 12),
      3,
      async (offset) => {
        const date = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1),
        );
        try {
          const month = await session.call<{
            weeks: {
              days: {
                events: {
                  url?: string;
                  modulename?: string;
                  activityname?: string;
                  name?: string;
                  description?: string;
                  course?: { id: number };
                  eventtype: string;
                  timestart: number;
                }[];
              }[];
            }[];
          }>('core_calendar_get_calendar_monthly_view', {
            year: date.getUTCFullYear(),
            month: date.getUTCMonth() + 1,
            courseid: 1,
            includenavigation: false,
            mini: false,
          });
          if (!Array.isArray(month.weeks)) throw new Error('Invalid calendar response');
          // Calendar instance IDs are not course-module IDs. Match the actual view URL instead.
          const events = month.weeks.flatMap((week) =>
            week.days.flatMap((day) => day.events || []),
          );
          for (const e of events) {
            if (!e.url) continue;
            const url = new URL(e.url, 'https://scele.cs.ui.ac.id');
            const match = url.pathname.match(/^\/mod\/(assign|quiz)\/view\.php$/);
            const cmid = Number(url.searchParams.get('id'));
            if (
              url.origin !== 'https://scele.cs.ui.ac.id' ||
              !match ||
              !Number.isSafeInteger(cmid) ||
              cmid <= 0
            )
              continue;
            if (e.modulename && e.modulename !== match[1]) continue;
            const kind = match[1] === 'assign' ? 'assignment' : 'quiz';
            const matching = activities.filter(
              (a) =>
                a.kind === kind && new URL(a.url).searchParams.get('id') === String(cmid),
            );
            // Some calendar events have no course object. Match an existing unique
            // enrolled activity by its module URL; never expose unverified courses.
            let item =
              matching.find((a) => a.courseId === e.course?.id) ||
              (!e.course && matching.length === 1 ? matching[0] : undefined);
            const course = courses.find((c) => c.id === e.course?.id);
            if (!item && course) {
              item = {
                id: `personal-${kind}-${cmid}`,
                kind,
                courseId: course.id,
                courseName: plainText(course.fullname),
                name: plainText(e.activityname || e.name || `${kind} ${cmid}`),
                description: plainText(e.description),
                url: `${url.origin}${url.pathname}?id=${cmid}`,
                opensAt: null,
                dueAt: null,
                cutoffAt: null,
                timeLimit: null,
                source: 'personal',
                completion: 'unknown',
              };
              activities.push(item);
            }
            if (!item || !Number.isFinite(e.timestart) || e.timestart <= 0) continue;
            if (e.eventtype === 'open') item.opensAt = e.timestart;
            if (e.eventtype === 'due') item.dueAt = e.timestart;
            if (e.eventtype === 'close') item.closeAt = e.timestart;
          }
        } catch (error) {
          if (error instanceof MoodleSessionExpired) throw error;
          incomplete = true;
        }
      },
    );
    // SCELE does not expose mod_assign/mod_quiz list web services to this
    // account. Activity pages are scoped to the signed-in user's cookie jar.
    // A missing or unfamiliar status stays unknown, never inferred from dates.
    // Skip deep HTTP requests for long-past settled activities unless completion is unknown.
    entry.data = {
      activities: activities.map(({ datesPending: _datesPending, ...item }) => item),
      incomplete,
      preparing: true,
    };
    const nowSec = Date.now() / 1000;
    const toCheck = activities.filter((item) => {
      const deadline = item.dueAt ?? item.closeAt;
      const isSettledPast =
        typeof deadline === 'number' &&
        deadline < nowSec - 14 * 86400 &&
        item.completion !== 'unknown';
      return !isSettledPast;
    });
    await mapLimited(toCheck, 3, async (item) => {
      try {
        const url = new URL(item.url);
        if (url.origin !== 'https://scele.cs.ui.ac.id') return;
        const html = await session.request(url.pathname + url.search);
        const $ = load(html);
        if ($('input[name="password"]').length) throw new MoodleSessionExpired();
        const evidence = completionFromActivityPage(html, item.kind);
        if (evidence !== 'unknown') item.completion = evidence;
        if (item.kind === 'assignment' && evidence === 'completed')
          item.submittedLate = submittedLateFromActivityPage(html);
      } catch (error) {
        if (error instanceof MoodleSessionExpired) throw error;
        incomplete = true;
      }
    });
    db.upsertActivities(activities, Date.now());
    // Never persist a guessed status. Failed personal checks retain last evidence.
    db.updateUserActivityState(
      username,
      activities
        .filter((item) => item.completion && item.completion !== 'unknown')
        .map((item) => ({
          activityId: item.id,
          completion: item.completion!,
          submittedLate: item.submittedLate,
        })),
      Date.now(),
    );
    entry.data = {
      activities: activities.map(({ datesPending: _datesPending, ...item }) => item),
      incomplete,
      preparing: false,
    };
    entry.at = Date.now();
    entry.failedAt = incomplete ? Date.now() : undefined;
  })()
    .catch((error) => {
      // Expired or inaccessible upstream sessions are reported on the next
      // authenticated request; do not publish partial credentials or a blank feed.
      entry.data = { ...entry.data!, preparing: false, incomplete: true };
      entry.failedAt = Date.now();
      if (error instanceof MoodleSessionExpired) entry.expired = true;
    })
    .finally(() => {
      entry.enriching = undefined;
    });
}
