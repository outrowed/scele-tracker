import { getSessionStore } from './sessions.js';
import {
  getUserMoodleSession,
  setUserMoodleSession,
  clearUserMoodleSession,
  loginMoodleUser,
  type MoodleSession,
} from './moodle.js';
import type { SessionUserResult } from './auth.js';

/**
 * Ensures an active MoodleSession exists for the given user.
 * If none is in memory and the session has stored encrypted credentials,
 * it performs a re-authentication to renew the session transparently.
 */
export async function ensureUserMoodleSession(
  user: SessionUserResult,
): Promise<MoodleSession | null> {
  let session = getUserMoodleSession(user.username);
  if (session) return session;

  if (!user.sessionId) return null;

  try {
    const store = getSessionStore();
    const creds = store.getCredentials(user.sessionId);
    if (!creds) return null;

    session = await loginMoodleUser(creds.username, creds.password);
    setUserMoodleSession(creds.username, session);
    store.clearAuthFailures(user.sessionId);
    return session;
  } catch (err) {
    if (err instanceof Error && /auth|password|credentials/i.test(err.message)) {
      try {
        getSessionStore().recordAuthFailure(user.sessionId);
      } catch {
        // Ignore store errors
      }
    }
    return null;
  }
}

/**
 * Forcibly re-authenticates the user against SCELE using stored credentials.
 * Used when an in-memory session was found to be expired during a request.
 */
export async function renewUserMoodleSession(
  sessionId: string,
): Promise<MoodleSession | null> {
  try {
    const store = getSessionStore();
    const creds = store.getCredentials(sessionId);
    if (!creds) return null;

    clearUserMoodleSession(creds.username);
    const session = await loginMoodleUser(creds.username, creds.password);
    setUserMoodleSession(creds.username, session);
    store.clearAuthFailures(sessionId);
    return session;
  } catch (err) {
    if (err instanceof Error && /auth|password|credentials/i.test(err.message)) {
      try {
        getSessionStore().recordAuthFailure(sessionId);
      } catch {
        // Ignore store errors
      }
    }
    return null;
  }
}
