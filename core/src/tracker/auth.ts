import { randomBytes, timingSafeEqual } from 'node:crypto';
import express, { Router, type RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { XMLParser } from 'fast-xml-parser';
import { roleFor } from './roles.js';
import { settings } from './config.js';
import { casFormLogin } from './cas.js';
import {
  setUserMoodleSession,
  loginMoodleUser,
  clearUserMoodleSession,
} from './moodle.js';

const cookie = 'scele_session';
const options = {
  httpOnly: true,
  secure: settings.secure,
  sameSite: 'lax' as const,
  path: '/',
};

export function sessionUser(token: unknown) {
  if (typeof token !== 'string') return null;
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
    return { username: value.username, fullname: value.fullname };
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
  return {
    username: success.user,
    fullname: typeof fullname === 'string' ? fullname : success.user,
  };
}

export const auth = Router();

auth.get('/me', async (req, res) => {
  const user = sessionUser(req.cookies[cookie]);
  res.json({ user: user ? { ...user, role: await roleFor(user.username) } : null });
});

// Single-form login proxy: authenticates with both UI SSO CAS and SCELE/Moodle
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
    // Acquires session cookie or token so user has personalized access
    const moodleSession = await loginMoodleUser(cleanUser, password);
    setUserMoodleSession(identity.username, moodleSession);

    // 3. Issue session token (credentials are not retained in memory or disk)
    const token = jwt.sign(identity, settings.secret, {
      algorithm: 'HS256',
      expiresIn: '8h',
      audience: 'scele-tracker',
      issuer: settings.origin,
    });
    res.cookie(cookie, token, { ...options, maxAge: 8 * 60 * 60_000 });
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
  const user = sessionUser(req.cookies[cookie]);
  if (user) {
    clearUserMoodleSession(user.username);
  }
  res.clearCookie(cookie, options);
  res.json({ ok: true });
});
