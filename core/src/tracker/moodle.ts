import { load } from 'cheerio';
import { CookieJar } from 'tough-cookie';
import { MoodleClient } from '@didactika/moodle-client';
import type { Account, Activity, SyncResult } from './types.js';

export const MOODLE = 'https://scele.cs.ui.ac.id';
export function plainText(html: unknown): string {
  if (typeof html !== 'string') return '';
  const $ = load(html);
  $('script, style, iframe, form').remove();
  $('br').replaceWith('\n');
  $('p, div, li').append('\n');
  return $.text().replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n\n').trim().slice(0, 30_000);
}
export function timestamp(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}
function activity(account: Account, kind: Activity['kind'], cmid: number, courseId: number, courseName: string, name: string): Activity {
  if (!Number.isSafeInteger(cmid) || cmid <= 0) throw new Error('Invalid activity ID');
  return { id: `${account.id}-${kind}-${cmid}`, kind, courseId, courseName: plainText(courseName), name: plainText(name), description: '', url: `${MOODLE}/mod/${kind === 'assignment' ? 'assign' : 'quiz'}/view.php?id=${cmid}`, opensAt: null, dueAt: null, cutoffAt: null, timeLimit: null, source: account.id };
}

// Each account owns its cookie jar. Redirects never carry credentials off-site.
export class MoodleSession {
  private jar = new CookieJar();
  private sesskey = '';
  async request(path: string, init: RequestInit = {}): Promise<string> {
    let url = new URL(path, MOODLE);
    let options = init;
    for (let redirects = 0; redirects < 6; redirects++) {
      if (url.origin !== MOODLE) throw new Error('External Moodle redirect refused');
      const headers = new Headers(options.headers);
      headers.set('cookie', await this.jar.getCookieString(url.href));
      const response = await fetch(url, { ...options, headers, redirect: 'manual', signal: AbortSignal.timeout(20_000) });
      for (const cookie of response.headers.getSetCookie()) await this.jar.setCookie(cookie, url.href);
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (!location) throw new Error('Invalid redirect');
        url = new URL(location, url);
        if ([301, 302, 303].includes(response.status)) options = {};
        continue;
      }
      if (!response.ok) throw new Error('Moodle request failed');
      const text = await response.text();
      if (text.length > 8_000_000) throw new Error('Moodle response too large');
      return text;
    }
    throw new Error('Too many Moodle redirects');
  }
  async login(account: Account) {
    const html = await this.request('/login/index.php');
    const logintoken = load(html)('input[name="logintoken"]').val();
    if (typeof logintoken !== 'string') throw new Error('Unsupported Moodle login');
    await this.request('/login/index.php', { method: 'POST', body: new URLSearchParams({ username: account.username!, password: account.password!, logintoken }) });
    const dashboard = await this.request('/my/');
    const key = dashboard.match(/"sesskey"\s*:\s*"([a-zA-Z0-9]+)"/);
    if (!key || load(dashboard)('input[name="password"]').length) throw new Error('Moodle authentication failed');
    this.sesskey = key[1];
  }
  async call<T>(methodname: string, args: object): Promise<T> {
    const text = await this.request(`/lib/ajax/service.php?sesskey=${encodeURIComponent(this.sesskey)}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify([{ index: 0, methodname, args }]) });
    const result = JSON.parse(text);
    if (!Array.isArray(result) || result[0]?.error || !result[0]?.data) throw new Error('Moodle AJAX unavailable');
    return result[0].data;
  }
}
type Course = { id: number; fullname: string };
type CalendarEvent = { modulename?: string; instance?: number; activityname?: string; name: string; description?: string; eventtype: string; timestart: number; course?: Course };
export function mergeCalendar(items: Activity[], events: CalendarEvent[], account: Account) {
  for (const event of events) {
    if (!['assign', 'quiz'].includes(event.modulename || '') || !event.instance || !event.course) continue;
    const kind = event.modulename === 'assign' ? 'assignment' : 'quiz';
    const id = `${account.id}-${kind}-${event.instance}`;
    let item = items.find(value => value.id === id);
    if (!item) {
      item = activity(account, kind, event.instance, event.course.id, event.course.fullname, event.activityname || event.name);
      items.push(item);
    }
    if (!item.description) item.description = plainText(event.description);
    if (event.eventtype === 'open') item.opensAt = timestamp(event.timestart);
    if (event.eventtype === 'due' || event.eventtype === 'close') item.dueAt = timestamp(event.timestart);
  }
}
export async function syncSession(account: Account): Promise<SyncResult> {
  const session = new MoodleSession();
  await session.login(account);
  const items: Activity[] = [];
  let complete = true;
  const courses = await session.call<{ courses: Course[] }>('core_course_get_enrolled_courses_by_timeline_classification', { classification: 'all', limit: 0, offset: 0 });
  if (!Array.isArray(courses.courses)) throw new Error('Invalid course response');
  for (const course of courses.courses) {
    try {
      const $ = load(await session.request(`/course/view.php?id=${course.id}`));
      if ($('input[name="password"]').length) throw new Error('Session expired');
      $('a[href]').each((_index, element) => {
        const url = new URL($(element).attr('href') || '', MOODLE);
        const match = url.pathname.match(/^\/mod\/(assign|quiz)\/view\.php$/);
        const cmid = Number(url.searchParams.get('id'));
        if (url.origin !== MOODLE || !match || !Number.isSafeInteger(cmid) || cmid <= 0) return;
        const node = $(element).closest('li.activity, .activity');
        const name = $(element).find('.instancename').clone();
        name.find('.accesshide').remove();
        const item = activity(account, match[1] === 'assign' ? 'assignment' : 'quiz', cmid, course.id, course.fullname, name.text() || $(element).text());
        item.description = plainText(node.find('.contentafterlink, .activity-description').first().html());
        if (!items.some(existing => existing.id === item.id)) items.push(item);
      });
    } catch { complete = false; }
  }
  // Calendar API supplies structured timestamps without opening/starting activities.
  const now = new Date();
  for (let offset = -3; offset <= 6; offset++) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1));
    try {
      const month = await session.call<{ weeks: { days: { events: CalendarEvent[] }[] }[] }>('core_calendar_get_calendar_monthly_view', { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, courseid: 1, includenavigation: false, mini: false });
      if (!Array.isArray(month.weeks)) throw new Error('Invalid calendar response');
      mergeCalendar(items, month.weeks.flatMap(week => week.days.flatMap(day => day.events || [])), account);
    } catch { complete = false; }
  }
  return { activities: items, complete };
}

type Assignment = { id: number; cmid: number; name: string; intro: string; allowsubmissionsfromdate: number; duedate: number; cutoffdate: number; timelimit?: number };
type Quiz = { id: number; coursemodule: number; course: number; name: string; intro: string; timeopen: number; timeclose: number; timelimit: number };
export async function syncToken(account: Account): Promise<SyncResult> {
  const client = new MoodleClient({ rootURL: MOODLE, token: account.token!, method: 'POST' });
  const site = (await client.call<{ userid: number }>('core_webservice_get_site_info')).data;
  const courses = (await client.call<Course[]>('core_enrol_get_users_courses', { userid: site.userid })).data;
  if (!Array.isArray(courses)) throw new Error('Invalid course response');
  const items: Activity[] = [];
  let complete = true;
  for (const course of courses) {
    try {
      const data = (await client.call<{ courses: { assignments: Assignment[] }[]; warnings?: unknown[] }>('mod_assign_get_assignments', { courseids: [course.id] })).data;
      if (data.warnings?.length) complete = false;
      for (const assignment of data.courses.flatMap(value => value.assignments)) {
        items.push({ ...activity(account, 'assignment', assignment.cmid, course.id, course.fullname, assignment.name), description: plainText(assignment.intro), opensAt: timestamp(assignment.allowsubmissionsfromdate), dueAt: timestamp(assignment.duedate), cutoffAt: timestamp(assignment.cutoffdate), timeLimit: timestamp(assignment.timelimit) });
      }
    } catch { complete = false; }
    try {
      const data = (await client.call<{ quizzes: Quiz[]; warnings?: unknown[] }>('mod_quiz_get_quizzes_by_courses', { courseids: [course.id] })).data;
      if (data.warnings?.length) complete = false;
      for (const quiz of data.quizzes) {
        items.push({ ...activity(account, 'quiz', quiz.coursemodule, course.id, course.fullname, quiz.name), description: plainText(quiz.intro), opensAt: timestamp(quiz.timeopen), dueAt: timestamp(quiz.timeclose), timeLimit: timestamp(quiz.timelimit) });
      }
    } catch { complete = false; }
  }
  return { activities: items, complete };
}
