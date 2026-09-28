import { afterEach, expect, it, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../core/src/app';
import { settings } from '../core/src/tracker/config';
import {
  completionFromMarkup,
  completionFromActivityPage,
  submittedLateFromActivityPage,
  personalSnapshot,
} from '../core/src/tracker/personal';
import {
  setUserMoodleSession,
  clearUserMoodleSession,
  MoodleSession,
  MoodleSessionExpired,
} from '../core/src/tracker/moodle';
import { activityState, personalStatus, type Activity } from '../ui/src/model';
import { matchesFilters, emptyFilters } from '../ui/src/components/ActivityFilters';

const token = (username: string) =>
  jwt.sign({ username, fullname: username }, settings.secret, {
    audience: 'scele-tracker',
    issuer: settings.origin,
  });
// Poll the same per-session snapshot until its background enrichment publishes.
async function enriched(username: string) {
  for (let attempt = 0; attempt < 100; attempt++) {
    const data = await personalSnapshot(username);
    if (!data.preparing) return data;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  throw new Error('Personal enrichment did not complete');
}

const sample = (completion: Activity['completion'], dueAt: number | null): Activity => ({
  id: 'item',
  kind: 'assignment',
  name: 'Item',
  courseId: 7,
  courseName: 'Course',
  description: '',
  url: 'https://scele.cs.ui.ac.id/mod/assign/view.php?id=11',
  opensAt: null,
  dueAt,
  cutoffAt: null,
  timeLimit: null,
  completion,
});

afterEach(() => {
  clearUserMoodleSession('alice');
  clearUserMoodleSession('bob');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('uses explicit Moodle completion evidence and avoids guesses', () => {
  expect(completionFromMarkup('<div data-completionstate="1"></div>')).toBe('completed');
  expect(completionFromMarkup('<div data-completionstate="0"></div>')).toBe('pending');
  expect(
    completionFromMarkup('<div data-region="completion-info">Done: View</div>'),
  ).toBe('completed');
  expect(completionFromMarkup('<div>Completion tracking unavailable</div>')).toBe(
    'unknown',
  );
  expect(personalStatus(sample('pending', 100), 101)).toBe('missed');
  expect(personalStatus(sample('completed', 100), 101)).toBe('completed');
  expect(personalStatus(sample('unknown', 100), 101)).toBe('unknown');
  expect(activityState(sample('unknown', 100), 101)).toBe('unverified');
  expect(activityState(sample('completed', 100), 101)).toBe('completed');
  expect(activityState(sample('completed', 200), 101)).toBe('completed');
  expect(activityState(sample('pending', 100), 101)).toBe('overdue');
  expect(activityState({ ...sample('pending', 100), cutoffAt: 100 }, 101)).toBe('closed');
  expect(activityState({ ...sample('unknown', 100), closeAt: 100 }, 101)).toBe('closed');
  expect(activityState({ ...sample('completed', 100), closeAt: 100 }, 101)).toBe(
    'completed',
  );
  expect(activityState({ ...sample('pending', 100), closeAt: 200 }, 101)).toBe('overdue');
  expect(personalStatus({ ...sample('pending', 100), closeAt: 100 }, 101)).toBe('closed');
  expect(activityState(sample('unknown', 200_000), 101)).toBe('available');
  expect(activityState({ ...sample('unknown', 200), opensAt: 120 }, 101)).toBe('notOpen');
  expect(activityState(sample('unknown', null), 101)).toBe('undated');
  const today = Date.parse('2026-09-28T10:00:00Z') / 1000;
  const laterToday = Date.parse('2026-09-28T13:00:00Z') / 1000;
  const closeOnlyQuiz = {
    ...sample('unknown', null),
    kind: 'quiz' as const,
    closeAt: laterToday,
  };
  expect(activityState(closeOnlyQuiz, today)).toBe('dueToday');
  expect(activityState(closeOnlyQuiz, laterToday)).toBe('closed');
  expect(activityState({ ...sample('unknown', laterToday) }, today)).toBe('dueToday');
  expect(
    matchesFilters(
      sample('completed', 100),
      { ...emptyFilters, progress: ['completed'] },
      101,
    ),
  ).toBe(true);
  expect(
    matchesFilters(
      sample('unknown', 100),
      { ...emptyFilters, progress: ['missed'] },
      101,
    ),
  ).toBe(false);
});

it('isolates per-user activity snapshots and detail links', async () => {
  const sessionA = new MoodleSession();
  const sessionB = new MoodleSession();
  for (const [session, name, cmid] of [
    [sessionA, 'Alice', 11],
    [sessionB, 'Bob', 22],
  ] as const) {
    vi.spyOn(session, 'call').mockImplementation(async (method: string) => {
      if (method.includes('enrolled_courses'))
        return { courses: [{ id: 7, fullname: name }] } as never;
      return { weeks: [] } as never;
    });
    vi.spyOn(session, 'request').mockResolvedValue(
      `<li class="activity"><div data-completionstate="1"><a href="/mod/assign/view.php?id=${cmid}"><span class="instancename">${name} task</span></a></div></li>`,
    );
  }
  setUserMoodleSession('alice', sessionA);
  setUserMoodleSession('bob', sessionB);
  const a = await personalSnapshot('alice');
  const b = await personalSnapshot('bob');
  expect(a.activities[0].name).toBe('Alice task');
  expect(b.activities[0].name).toBe('Bob task');
  expect(a.activities[0].completion).toBe('completed');
  const app = createApp();
  const list = await request(app)
    .get('/api/activities')
    .set('Cookie', `scele_session=${token('alice')}`);
  expect(list.status).toBe(200);
  expect(list.body.activities).toHaveLength(1);
  const id = list.body.activities[0].id;
  expect(
    (
      await request(app)
        .get(`/api/activities/${id}`)
        .set('Cookie', `scele_session=${token('bob')}`)
    ).status,
  ).toBe(404);
});

it('returns discovered activities before calendar/status enrichment finishes, then publishes dates', async () => {
  const session = new MoodleSession();
  let releaseCalendar!: (value: unknown) => void;
  const calendar = new Promise<unknown>((resolve) => {
    releaseCalendar = resolve;
  });
  vi.spyOn(session, 'call').mockImplementation(async (method: string) => {
    if (method.includes('enrolled_courses'))
      return { courses: [{ id: 7, fullname: 'Course' }] } as never;
    return calendar as never;
  });
  vi.spyOn(session, 'request').mockImplementation(async (path: string) =>
    path.startsWith('/course/')
      ? '<li class="activity"><a href="/mod/assign/view.php?id=11">Task</a></li>'
      : '<div class="submissionstatustable"><table class="generaltable"><tr><th>Submission status</th><td>Submitted for grading</td></tr></table></div>',
  );
  setUserMoodleSession('alice', session);
  const first = await personalSnapshot('alice');
  expect(first).toMatchObject({
    preparing: true,
    activities: [{ name: 'Task', dueAt: null }],
  });
  const again = await personalSnapshot('alice');
  expect(again.preparing).toBe(true);
  expect(again.activities).toHaveLength(1);
  const due = Math.floor(Date.now() / 1000) + 3600;
  releaseCalendar({
    weeks: [
      {
        days: [
          {
            events: [
              {
                url: '/mod/assign/view.php?id=11',
                course: { id: 7 },
                eventtype: 'due',
                timestart: due,
              },
            ],
          },
        ],
      },
    ],
  });
  const done = await enriched('alice');
  expect(done).toMatchObject({
    preparing: false,
    incomplete: false,
    activities: [{ dueAt: due, completion: 'completed' }],
  });
  expect(first.activities[0].dueAt).toBeNull();
});

it('checks the Moodle session and distinguishes expiry from transient failure', async () => {
  const session = new MoodleSession();
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      status: 302,
      headers: { get: () => '/login/index.php', getSetCookie: () => [] },
    })
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { getSetCookie: () => [] },
      text: async () => '<input name="password">',
    });
  vi.stubGlobal('fetch', fetchMock);
  await expect(session.checkValid()).rejects.toBeInstanceOf(MoodleSessionExpired);
  vi.unstubAllGlobals();
  vi.spyOn(session, 'request').mockRejectedValueOnce(new Error('Network unavailable'));
  await expect(session.checkValid()).rejects.toThrow('Network unavailable');
});

it('invalidates a signed-in user with no Moodle session but not on an upstream outage', async () => {
  const app = createApp();
  const missing = await request(app)
    .get('/api/auth/me')
    .set('Cookie', `scele_session=${token('alice')}`);
  expect(missing.body.user).toBeNull();
  expect(missing.headers['set-cookie']).toBeDefined();
  const session = new MoodleSession();
  vi.spyOn(session, 'checkValid')
    .mockRejectedValueOnce(new Error('Network unavailable'))
    .mockRejectedValueOnce(new MoodleSessionExpired());
  setUserMoodleSession('alice', session);
  const outage = await request(app)
    .get('/api/auth/me')
    .set('Cookie', `scele_session=${token('alice')}`);
  expect(outage.status).toBe(503);
  expect(outage.headers['set-cookie']).toBeUndefined();
  const expired = await request(app)
    .get('/api/auth/me')
    .set('Cookie', `scele_session=${token('alice')}`);
  expect(expired.body.user).toBeNull();
  expect(expired.headers['set-cookie']).toBeDefined();
});

it('returns 401 for missing or expired Moodle credentials on activity requests', async () => {
  const app = createApp();
  const missing = await request(app)
    .get('/api/activities')
    .set('Cookie', `scele_session=${token('alice')}`);
  expect(missing.status).toBe(401);
  const session = new MoodleSession();
  vi.spyOn(session, 'call').mockRejectedValueOnce(new MoodleSessionExpired());
  setUserMoodleSession('alice', session);
  const expired = await request(app)
    .get('/api/activities')
    .set('Cookie', `scele_session=${token('alice')}`);
  expect(expired.status).toBe(401);
  expect(expired.body.error).toMatch(/sign in again/i);
  expect(
    (
      await request(app)
        .get('/api/auth/me')
        .set('Cookie', `scele_session=${token('alice')}`)
    ).body.user,
  ).toBeNull();
});

it('recovers an older overdue activity from an enrolled course calendar event', async () => {
  const session = new MoodleSession();
  const past = Math.floor(Date.now() / 1000) - 180 * 86400;
  vi.spyOn(session, 'call').mockImplementation(async (method: string) => {
    if (method.includes('enrolled_courses'))
      return { courses: [{ id: 7, fullname: 'History' }] } as never;
    return {
      weeks: [
        {
          days: [
            {
              events: [
                {
                  url: '/mod/assign/view.php?id=88',
                  modulename: 'assign',
                  course: { id: 7 },
                  eventtype: 'due',
                  timestart: past,
                  activityname: 'Overdue assignment',
                },
                {
                  url: '/mod/assign/view.php?id=99',
                  modulename: 'assign',
                  course: { id: 999 },
                  eventtype: 'due',
                  timestart: past,
                  activityname: 'Other user course',
                },
              ],
            },
          ],
        },
      ],
    } as never;
  });
  vi.spyOn(session, 'request').mockResolvedValue(
    '<main>No activity links on this course page</main>',
  );
  setUserMoodleSession('alice', session);
  const snapshot = await enriched('alice');
  expect(snapshot.activities).toHaveLength(1);
  expect(snapshot.activities[0]).toMatchObject({
    name: 'Overdue assignment',
    courseId: 7,
    dueAt: past,
    completion: 'unknown',
  });
  expect(
    activityState({ ...sample('unknown', past) }, Math.floor(Date.now() / 1000)),
  ).toBe('unverified');
});

it('matches a calendar due date without a course object to an existing module', async () => {
  const session = new MoodleSession();
  const past = Math.floor(Date.now() / 1000) - 86400;
  vi.spyOn(session, 'call').mockImplementation(async (method: string) => {
    if (method.includes('enrolled_courses'))
      return { courses: [{ id: 7, fullname: 'History' }] } as never;
    return {
      weeks: [
        {
          days: [
            {
              events: [
                {
                  url: '/mod/quiz/view.php?id=44',
                  modulename: 'quiz',
                  eventtype: 'close',
                  timestart: past,
                },
              ],
            },
          ],
        },
      ],
    } as never;
  });
  vi.spyOn(session, 'request').mockResolvedValue(
    '<li class="activity"><a href="/mod/quiz/view.php?id=44"><span class="instancename">Old quiz</span></a></li>',
  );
  setUserMoodleSession('bob', session);
  const snapshot = await enriched('bob');
  expect(snapshot.activities).toHaveLength(1);
  expect(snapshot.activities[0].closeAt).toBe(past);
  expect(activityState(snapshot.activities[0], Date.now() / 1000)).toBe('closed');
});

it('uses signed-in activity pages for submitted assignments and reviewed quiz attempts', async () => {
  const session = new MoodleSession();
  const dueAt = Math.floor(Date.now() / 1000) - 86400;
  const course =
    '<li class="activity"><a href="/mod/assign/view.php?id=11">Submitted work</a><a href="/mod/assign/view.php?id=12">Draft work</a><a href="/mod/quiz/view.php?id=21">Finished quiz</a><a href="/mod/quiz/view.php?id=22">Unattempted quiz</a></li>';
  const assignment = (status: string, timing = '') =>
    `<div class="submissionstatustable"><table class="generaltable"><tr><th>Submission status</th><td>${status}</td></tr><tr><th>Time remaining</th><td class="latesubmission">${timing}</td></tr></table></div>`;
  const finishedQuiz =
    '<table class="quizattemptsummary"><tbody><tr><td><a href="/mod/quiz/review.php?attempt=5">Review</a></td></tr></tbody></table>';
  vi.spyOn(session, 'request').mockImplementation(async (path: string) => {
    if (path.startsWith('/course/')) return course;
    if (path.includes('assign/view.php?id=11'))
      return assignment(
        'Submitted for grading',
        'Assignment was submitted 31 mins 42 secs late',
      );
    if (path.includes('assign/view.php?id=12'))
      return assignment('Draft (not submitted)');
    if (path.includes('quiz/view.php?id=21')) return finishedQuiz;
    if (path.includes('quiz/view.php?id=22'))
      return '<div class="quizattempt">No attempts</div>';
    throw new Error('Unexpected page');
  });
  vi.spyOn(session, 'call').mockImplementation(async (method: string) => {
    if (method.includes('enrolled_courses'))
      return { courses: [{ id: 7, fullname: 'Course' }] } as never;
    if (method === 'core_calendar_get_calendar_monthly_view')
      return {
        weeks: [
          {
            days: [
              {
                events: [11, 12, 21, 22].map((cmid) => ({
                  url: `/mod/${cmid < 20 ? 'assign' : 'quiz'}/view.php?id=${cmid}`,
                  course: { id: 7 },
                  eventtype: 'due',
                  timestart: dueAt,
                })),
              },
            ],
          },
        ],
      } as never;
    throw new Error(`Unavailable API ${method}`);
  });
  setUserMoodleSession('alice', session);
  const snapshot = await enriched('alice');
  const byCmid = (cmid: number) =>
    snapshot.activities.find(
      (a) => new URL(a.url).searchParams.get('id') === String(cmid),
    );
  expect(snapshot.incomplete).toBe(false);
  expect(byCmid(11)?.completion).toBe('completed');
  expect(byCmid(11)?.submittedLate).toBe(true);
  expect(byCmid(12)?.completion).toBe('pending');
  expect(byCmid(21)?.completion).toBe('completed');
  expect(byCmid(22)?.completion).toBe('unknown');
  expect(activityState(byCmid(11)!, Date.now() / 1000)).toBe('submittedLate');
  expect(personalStatus(byCmid(11)!, Date.now() / 1000)).toBe('completed');
  expect(activityState(byCmid(12)!, Date.now() / 1000)).toBe('overdue');
});

it('distinguishes explicit late and early submission evidence without guessing from the due date', () => {
  const assignment = (timing: string) =>
    `<section><div class="submissionstatustable"><table class="generaltable"><tr><th scope="row">Submission status</th><td>Submitted for grading</td></tr><tr><th scope="row">Time remaining</th><td>${timing}</td></tr></table></div></section>`;
  const late = assignment('Assignment was submitted 31 mins 42 secs late');
  const early = assignment('Assignment was submitted 6 days 22 hours early');
  expect(completionFromActivityPage(late, 'assignment')).toBe('completed');
  expect(submittedLateFromActivityPage(late)).toBe(true);
  expect(submittedLateFromActivityPage(early)).toBe(false);
  expect(submittedLateFromActivityPage(assignment('Not graded'))).toBeUndefined();
  expect(activityState({ ...sample('completed', 100), submittedLate: true }, 101)).toBe(
    'submittedLate',
  );
  expect(activityState({ ...sample('completed', 100), submittedLate: false }, 101)).toBe(
    'completed',
  );
  expect(activityState({ ...sample('completed', 100) }, 101)).toBe('completed');
  expect(
    activityState(
      { ...sample('completed', 100), kind: 'quiz', submittedLate: true },
      101,
    ),
  ).toBe('completed');
});

it('does not infer completion from a due date, an unrelated review link or an unrecognized status', () => {
  expect(completionFromActivityPage('<p>Submitted for grading</p>', 'assignment')).toBe(
    'unknown',
  );
  expect(
    completionFromActivityPage(
      '<div class="submissionstatustable"><table class="generaltable"><tr><th>Submission status</th><td>Not submitted</td></tr></table></div>',
      'assignment',
    ),
  ).toBe('pending');
  const noAttempt =
    '<div class="submissionstatustable"><h3>Submission status</h3><div class="submissionsummarytable"><table class="generaltable"><tr><th scope="row">Submission status</th><td>No attempt</td></tr><tr><th>Time remaining</th><td class="overdue">Assignment is overdue by: 4 days 2 hours</td></tr></table></div></div>';
  expect(completionFromActivityPage(noAttempt, 'assignment')).toBe('pending');
  expect(
    activityState(
      {
        ...sample(completionFromActivityPage(noAttempt, 'assignment'), 100),
        cutoffAt: null,
      },
      101,
    ),
  ).toBe('overdue');
  expect(
    completionFromActivityPage(
      '<div class="submissionstatustable"><table class="generaltable"><tr><th>Submission status</th><td>Unknown state</td></tr></table></div>',
      'assignment',
    ),
  ).toBe('unknown');
  expect(
    completionFromActivityPage(
      '<a href="/mod/quiz/review.php?attempt=5">Review</a>',
      'quiz',
    ),
  ).toBe('unknown');
  expect(
    completionFromActivityPage(
      '<table class="quizattemptsummary"><tbody><tr><td><a href="https://evil.example/mod/quiz/review.php">Review</a></td></tr></tbody></table>',
      'quiz',
    ),
  ).toBe('unknown');
});
