import { randomBytes, timingSafeEqual } from 'node:crypto';
import express, { Router, type RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { XMLParser } from 'fast-xml-parser';
import { roleFor } from './roles.js';
import { settings, SESSION_MAX_AGE_MS } from './config.js';
import { casFormLogin } from './cas.js';
import { formatAcademicInfo, deriveProdi, deriveClassYear } from './student.js';
import { getSessionStore } from './sessions.js';
import {
  setUserMoodleSession,
  loginMoodleUser,
  clearUserMoodleSession,
  getUserMoodleSession,
  MoodleSessionExpired,
} from './moodle.js';

const cookie = 'scele_session';
const options = {
  httpOnly: true,
  secure: settings.secure,
  sameSite: 'lax' as const,
  path: '/',
};

export type SessionUserResult = {
  username: string;
  fullname: string;
  prodi: string;
  angkatan: string;
  kd_org?: string;
  academicInfo: string;
  sessionId?: string;
};

/**
 * Validates session credentials or token from request cookie.
 * Supports both:
 * 1. Opaque SQLite session ID (from long-lived login with encrypted credentials)
 * 2. Legacy/stateless JWT token (for backward compatibility and test mock tokens)
 */
export function sessionUser(token: unknown): SessionUserResult | null {
  if (typeof token !== 'string' || !token) return null;

  // 1. Check if token is an opaque SQLite session ID (64-char hex string)
  if (/^[a-f0-9]{64}$/.test(token)) {
    try {
      const store = getSessionStore();
      const rec = store.get(token);
      if (rec && !store.isLocked(rec)) {
        return {
          username: rec.username,
          fullname: rec.fullname,
          prodi: rec.prodi,
          angkatan: rec.angkatan,
          kd_org: rec.kd_org || undefined,
          academicInfo: rec.academicInfo,
          sessionId: rec.id,
        };
      }
    } catch {
      // Store unavailable or errored; fall through
    }
  }

  // 2. Fall back to JWT validation (supports test tokens & stateless fallback)
  try {
    const value = jwt.verify(token, settings.secret, {
      algorithms: ['HS256'],
      audience: 'scele-tracker',
      issuer: settings.origin,
    });
    if (
      typeof value === 'string' ||
      typeof value.username !== 'string' ||
      typeof value.fullname !== 'string'
    )
      return null;
    const prodi = typeof (value as any).prodi === 'string' ? (value as any).prodi : undefined;
    const angkatan = typeof (value as any).angkatan === 'string' ? (value as any).angkatan : undefined;
    const kd_org = typeof (value as any).kd_org === 'string' ? (value as any).kd_org : undefined;
    const academicInfo = typeof (value as any).academicInfo === 'string'
      ? (value as any).academicInfo
      : formatAcademicInfo({ username: value.username, prodi, angkatan, kd_org });
    return {
      username: value.username,
      fullname: value.fullname,
      prodi: prodi || 'Ilmu Komputer',
      angkatan: angkatan || deriveClassYear(value.username) || '2026',
      kd_org,
      academicInfo,
      sessionId: typeof (value as any).sid === 'string' ? (value as any).sid : undefined,
    };
  } catch {
    return null;
  }
}

export const requireSession: RequestHandler = (req, res, next) => {
  if (!sessionUser(req.cookies[cookie])) {
    res.status(401).json({ error: 'Sign in with UI SSO to continue.' });
    return;
  }
  next();
};

export const sameOrigin: RequestHandler = (req, res, next) => {
  if (req.get('origin') !== settings.origin) {
    res.status(403).json({ error: 'Invalid request origin.' });
    return;
  }
  next();
};

export function parseIdentity(xml: string) {
  if (xml.length > 100_000 || /<!DOCTYPE|<!ENTITY/i.test(xml))
    throw new Error('Invalid CAS response');
  const parsed = new XMLParser({ removeNSPrefix: true, parseTagValue: false }).parse(xml);
  const success = parsed?.serviceResponse?.authenticationSuccess;
  if (!success || typeof success.user !== 'string' || !success.user.trim())
    throw new Error('CAS authentication failed');
  const fullname = success.attributes?.nama || success.attributes?.cn || success.user;

  const npm = typeof success.attributes?.npm === 'string' ? success.attributes.npm : undefined;
  const kd_org = typeof success.attributes?.kd_org === 'string' ? success.attributes.kd_org : undefined;
  const jurusan = typeof success.attributes?.jurusan === 'string' ? success.attributes.jurusan : undefined;
  const prodiAttr = typeof success.attributes?.prodi === 'string' ? success.attributes.prodi : undefined;
  const angkatanAttr = typeof success.attributes?.angkatan === 'string' ? success.attributes.angkatan : undefined;

  const academicInfo = formatAcademicInfo({
    npm,
    kd_org,
    jurusan,
    prodi: prodiAttr,
    angkatan: angkatanAttr,
    username: success.user,
  });
  const prodi = deriveProdi(kd_org, jurusan, prodiAttr);
  const angkatan = angkatanAttr || deriveClassYear(npm) || deriveClassYear(success.user) || '2026';

  return {
    username: success.user,
    fullname: typeof fullname === 'string' ? fullname : success.user,
    npm,
    kd_org,
    prodi,
    angkatan,
    academicInfo,
  };
}

export const auth = Router();

auth.get('/me', async (req, res) => {
  const user = sessionUser(req.cookies[cookie]);
  if (!user) {
    res.json({ user: null });
    return;
  }

  // Obtain or renew the user's active SCELE Moodle session
  let moodle = getUserMoodleSession(user.username);
  if (!moodle) {
    // If we have an opaque session with encrypted credentials, auto-renew on demand
    const sessionId = user.sessionId || (typeof req.cookies[cookie] === 'string' && /^[a-f0-9]{64}$/.test(req.cookies[cookie]) ? req.cookies[cookie] : undefined);
    if (sessionId) {
      try {
        const store = getSessionStore();
        const creds = store.getCredentials(sessionId);
        if (creds) {
          moodle = await loginMoodleUser(creds.username, creds.password);
          setUserMoodleSession(creds.username, moodle);
          store.clearAuthFailures(sessionId);
        }
      } catch {
        // Renewal failed or upstream unavailable
      }
    }
  }

  if (!moodle) {
    res.clearCookie(cookie, options);
    res.json({ user: null });
    return;
  }

  try {
    await moodle.checkValid();
    res.json({ user: { ...user, role: await roleFor(user.username) } });
  } catch (error) {
    if (error instanceof MoodleSessionExpired) {
      clearUserMoodleSession(user.username);
      // Try one re-login if credentials are stored
      const sessionId = user.sessionId || (typeof req.cookies[cookie] === 'string' && /^[a-f0-9]{64}$/.test(req.cookies[cookie]) ? req.cookies[cookie] : undefined);
      if (sessionId) {
        try {
          const store = getSessionStore();
          const creds = store.getCredentials(sessionId);
          if (creds) {
            const freshSession = await loginMoodleUser(creds.username, creds.password);
            setUserMoodleSession(creds.username, freshSession);
            store.clearAuthFailures(sessionId);
            res.json({ user: { ...user, role: await roleFor(user.username) } });
            return;
          }
        } catch (renewErr) {
          if (renewErr instanceof Error && /auth|password|credentials/i.test(renewErr.message)) {
            const store = getSessionStore();
            store.recordAuthFailure(sessionId);
          }
        }
      }
      res.clearCookie(cookie, options);
      res.json({ user: null });
      return;
    }
    res
      .status(503)
      .json({ error: 'Cannot verify your SCELE session right now. Please try again.' });
  }
});

// Single-form login proxy: authenticates with both UI SSO CAS and SCELE Moodle,
// and saves encrypted credentials in server-side storage to enable 30-day session renewal.
auth.post('/login', sameOrigin, express.json(), async (req, res) => {
  const { username, password } = req.body || {};
  if (
    typeof username !== 'string' ||
    typeof password !== 'string' ||
    !username.trim() ||
    !password ||
    username.length > 200 ||
    password.length > 2000
  ) {
    res.status(400).json({ error: 'Username and password are required.' });
    return;
  }

  const cleanUser = username.trim().toLowerCase();

  try {
    // 1. Authenticate with UI SSO CAS (proves user identity)
    const identity = await casFormLogin(cleanUser, password);

    // 2. Authenticate with SCELE Moodle using the same credentials
    const moodleSession = await loginMoodleUser(cleanUser, password);
    setUserMoodleSession(identity.username, moodleSession);

    // 3. Store encrypted credentials in server-side SQLite session store for long-lived renewal (30 days)
    const store = getSessionStore();
    const sessionId = store.create(identity, password);

    // 4. Issue session cookie set to 30-day lifetime
    res.cookie(cookie, sessionId, { ...options, maxAge: SESSION_MAX_AGE_MS });
    res.json({
      user: {
        ...identity,
        role: await roleFor(identity.username),
      },
    });
  } catch (err) {
    console.warn(
      JSON.stringify({
        event: 'form_login_failed',
        user: cleanUser,
        reason: (err as Error).message,
      }),
    );
    res.status(401).json({
      error: 'Authentication failed. Please verify your UI username and password.',
    });
  }
});

// Backward-compatible redirect flow
auth.get('/login', (_req, res) => {
  const state = randomBytes(32).toString('hex');
  res.cookie('scele_login', state, { ...options, maxAge: 10 * 60_000 });
  const service = `${settings.origin}/api/auth/cas/callback?state=${state}`;
  res.redirect(`${settings.cas}/login?${new URLSearchParams({ service })}`);
});

auth.get('/cas/callback', async (req, res) => {
  const { state, ticket } = req.query;
  const expected = req.cookies.scele_login;
  res.clearCookie('scele_login', options);
  if (
    typeof state !== 'string' ||
    !/^[a-f0-9]{64}$/.test(state) ||
    typeof expected !== 'string' ||
    expected.length !== state.length ||
    !timingSafeEqual(Buffer.from(state), Buffer.from(expected)) ||
    typeof ticket !== 'string' ||
    ticket.length > 2048
  ) {
    res.redirect('/?error=login_expired');
    return;
  }
  try {
    const service = `${settings.origin}/api/auth/cas/callback?state=${state}`;
    const response = await fetch(
      `${settings.cas}/serviceValidate?${new URLSearchParams({ service, ticket })}`,
      { signal: AbortSignal.timeout(15_000), redirect: 'error' },
    );
    if (!response.ok) throw new Error('CAS unavailable');
    const user = parseIdentity(await response.text());
    // For CAS redirect callback without password, use fallback JWT token
    const token = jwt.sign(user, settings.secret, {
      algorithm: 'HS256',
      expiresIn: '8h',
      audience: 'scele-tracker',
      issuer: settings.origin,
    });
    res.cookie(cookie, token, { ...options, maxAge: 8 * 60 * 60_000 });
    res.redirect('/');
  } catch {
    console.warn(JSON.stringify({ event: 'cas_validation_failed' }));
    res.redirect('/?error=sso_failed');
  }
});

auth.post('/logout', sameOrigin, (req, res) => {
  const tokenVal = req.cookies[cookie];
  const user = sessionUser(tokenVal);
  if (user) {
    clearUserMoodleSession(user.username);
  }
  // If this was a stored session, permanently delete it and its encrypted credentials
  if (typeof tokenVal === 'string' && /^[a-f0-9]{64}$/.test(tokenVal)) {
    try {
      getSessionStore().delete(tokenVal);
    } catch {
      // Ignore cleanup error on logout
    }
  } else if (user?.sessionId) {
    try {
      getSessionStore().delete(user.sessionId);
    } catch {
      // Ignore
    }
  }
  res.clearCookie(cookie, options);
  res.json({ ok: true });
});
