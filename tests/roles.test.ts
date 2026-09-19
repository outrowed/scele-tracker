import { afterEach, expect, it } from 'vitest';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../core/src/app';
import { settings } from '../core/src/tracker/config';
import { parseUsers, roleFor } from '../core/src/tracker/roles';
let directory = '';
afterEach(async () => {
  delete process.env.USERS_FILE;
  if (directory) await rm(directory, { recursive: true });
  directory = '';
});
const token = (username: string) =>
  jwt.sign({ username, fullname: username, role: 'admin' }, settings.secret, {
    audience: 'scele-tracker',
    issuer: settings.origin,
  });
it('validates roles and rejects duplicate names', () => {
  expect(parseUsers({ users: [{ username: 'alice', role: 'admin' }] }).get('alice')).toBe(
    'admin',
  );
  expect(() => parseUsers({ users: [{ username: 'alice', role: 'owner' }] })).toThrow();
  expect(() =>
    parseUsers({
      users: [
        { username: 'a', role: 'user' },
        { username: 'a', role: 'admin' },
      ],
    }),
  ).toThrow();
});
it('rechecks file policy, denies forged claims, and hides sources in list and details', async () => {
  directory = await mkdtemp(join(tmpdir(), 'tracker-roles-'));
  process.env.USERS_FILE = join(directory, 'users.json');
  await writeFile(
    process.env.USERS_FILE,
    JSON.stringify({ users: [{ username: 'alice', role: 'admin' }] }),
  );
  const activity = {
    id: 'secret-source-quiz-1',
    source: 'secret-source',
    kind: 'quiz',
    name: 'Quiz',
    courseId: 1,
    courseName: 'Course',
    description: '',
    url: 'https://scele.cs.ui.ac.id/mod/quiz/view.php?id=1',
    opensAt: null,
    dueAt: null,
    cutoffAt: null,
    timeLimit: null,
  };
  const app = createApp({
    get: async () => ({
      activities: [activity],
      sources: [{ id: 'secret-source', state: 'ok', updatedAt: null }],
      configured: true,
      checkedAt: null,
    }),
  } as never);
  expect((await request(app).get('/api/admin/status')).status).toBe(401);
  expect(
    (
      await request(app)
        .get('/api/admin/status')
        .set('Cookie', `scele_session=${token('bob')}`)
    ).status,
  ).toBe(403);
  expect(
    (
      await request(app)
        .get('/api/admin/status')
        .set('Cookie', `scele_session=${token('alice')}`)
    ).status,
  ).toBe(200);
  const list = await request(app)
    .get('/api/activities')
    .set('Cookie', `scele_session=${token('bob')}`);
  expect(JSON.stringify(list.body)).not.toContain('secret-source');
  expect(list.body).not.toHaveProperty('sources');
  const detail = await request(app)
    .get(`/api/activities/${list.body.activities[0].id}`)
    .set('Cookie', `scele_session=${token('bob')}`);
  expect(detail.status).toBe(200);
  expect(JSON.stringify(detail.body)).not.toContain('secret-source');
  await writeFile(process.env.USERS_FILE, '{"users":[]}');
  expect(
    (
      await request(app)
        .get('/api/admin/status')
        .set('Cookie', `scele_session=${token('alice')}`)
    ).status,
  ).toBe(403);
  await writeFile(process.env.USERS_FILE, 'invalid');
  expect(await roleFor('alice')).toBe('user');
});
