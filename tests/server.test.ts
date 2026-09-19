import { describe, expect, it, vi, afterEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../core/src/app';
import { settings } from '../core/src/tracker/config';
import { parseIdentity, sessionUser } from '../core/src/tracker/auth';
import { parseAccounts } from '../core/src/tracker/accounts';
import {
  mergeCalendar,
  plainText,
  timestamp,
  MoodleSession,
  TokenClient,
} from '../core/src/tracker/moodle';
import type { Activity } from '../core/src/tracker/types';

afterEach(() => vi.unstubAllGlobals());
const user = { username: 'student', fullname: 'Student' };
const token = () =>
  jwt.sign(user, settings.secret, { audience: 'scele-tracker', issuer: settings.origin });
describe('authentication boundary', () => {
  it('protects both list and details without syncing', async () => {
    const get = vi.fn();
    const app = createApp({ get });
    expect((await request(app).get('/api/activities')).status).toBe(401);
    expect((await request(app).get('/api/activities/source-1-quiz-1')).status).toBe(401);
    expect(get).not.toHaveBeenCalled();
  });
  it('accepts valid SSO sessions and does not cache private responses', async () => {
    const get = vi
      .fn()
      .mockResolvedValue({ activities: [], sources: [], configured: false });
    const response = await request(createApp({ get }))
      .get('/api/activities')
      .set('Cookie', `scele_session=${token()}`);
    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store');
  });
  it('rejects forged and wrong-audience JWTs', () => {
    expect(sessionUser('invalid')).toBeNull();
    expect(
      sessionUser(jwt.sign(user, settings.secret, { audience: 'another-app' })),
    ).toBeNull();
  });
  it('rejects unbound CAS callbacks without contacting CAS', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const response = await request(createApp()).get(
      '/api/auth/cas/callback?ticket=ST-test&state=bad',
    );
    expect(response.headers.location).toContain('login_expired');
    expect(fetch).not.toHaveBeenCalled();
  });
  it('requires same-origin logout', async () => {
    expect(
      (
        await request(createApp())
          .post('/api/auth/logout')
          .set('Origin', 'https://evil.example')
      ).status,
    ).toBe(403);
    expect(
      (await request(createApp()).post('/api/auth/logout').set('Origin', settings.origin))
        .status,
    ).toBe(200);
  });
  it('parses CAS namespaces and rejects failures or entities', () => {
    expect(
      parseIdentity(
        '<cas:serviceResponse><cas:authenticationSuccess><cas:user>student</cas:user><cas:attributes><cas:nama>Student</cas:nama></cas:attributes></cas:authenticationSuccess></cas:serviceResponse>',
      ),
    ).toEqual(user);
    expect(() =>
      parseIdentity(
        '<serviceResponse><authenticationFailure>no</authenticationFailure></serviceResponse>',
      ),
    ).toThrow();
    expect(() => parseIdentity('<!DOCTYPE foo><serviceResponse/>')).toThrow();
  });
});
describe('accounts and metadata', () => {
  it('validates unique public aliases and never returns unknown configuration fields', () => {
    const account = { id: 'source-1', mode: 'token', token: 'secret', extra: 'discard' };
    expect(parseAccounts({ accounts: [account] })[0]).not.toHaveProperty('extra');
    expect(() => parseAccounts({ accounts: [account, account] })).toThrow();
    expect(() => parseAccounts({ accounts: [{ id: 'bad', mode: 'session' }] })).toThrow();
  });
  it('strips active markup and normalizes missing timestamps', () => {
    expect(
      plainText('<p>Hello</p><script>alert(1)</script><img src=x onerror=evil()>'),
    ).toBe('Hello');
    expect(timestamp(0)).toBeNull();
    expect(timestamp(-1)).toBeNull();
    expect(timestamp(Infinity)).toBeNull();
    expect(timestamp(123)).toBe(123);
  });
  it('merges calendar open and due events but preserves account-specific variants', () => {
    const items: Activity[] = [];
    const event = {
      modulename: 'quiz',
      instance: 42,
      activityname: 'Quiz 1',
      name: 'Quiz closes',
      eventtype: 'close',
      timestart: 200,
      course: { id: 2, fullname: 'Logic' },
    };
    mergeCalendar(items, [event, { ...event, eventtype: 'open', timestart: 100 }], {
      id: 'one',
      mode: 'token',
    });
    mergeCalendar(items, [event], { id: 'two', mode: 'token' });
    expect(items).toHaveLength(2);
    expect(items[0].opensAt).toBe(100);
    expect(items[0].dueAt).toBe(200);
    expect(items[0].url).toBe('https://scele.cs.ui.ac.id/mod/quiz/view.php?id=42');
  });
  it('refuses off-site session redirects', async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { location: 'https://evil.example/' },
      }),
    );
    vi.stubGlobal('fetch', fetch);
    await expect(new MoodleSession().request('/login/index.php')).rejects.toThrow(
      'External',
    );
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

it('sends API tokens only in POST bodies with timeout and no redirects', async () => {
  const fetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ userid: 1 }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  );
  vi.stubGlobal('fetch', fetch);
  await new TokenClient('private-token').call('core_webservice_get_site_info');
  const [url, options] = fetch.mock.calls[0];
  expect(url).not.toContain('private-token');
  expect(options.body.get('wstoken')).toBe('private-token');
  expect(options.redirect).toBe('error');
  expect(options.signal).toBeInstanceOf(AbortSignal);
});
