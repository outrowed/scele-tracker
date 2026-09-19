import { randomBytes, timingSafeEqual } from 'node:crypto';
import { Router, type RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { XMLParser } from 'fast-xml-parser';
import { roleFor } from './roles.js';
import { settings } from './config.js';

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
auth.get('/login', (_req, res) => {
  const state = randomBytes(32).toString('hex');
  res.cookie('scele_login', state, { ...options, maxAge: 10 * 60_000 });
  const service = `${settings.origin}/api/auth/cas/callback?state=${state}`;
  res.redirect(`${settings.cas}/login?${new URLSearchParams({ service })}`);
});
auth.get('/cas/callback', async (req, res) => {
  // Bind the CAS callback to the browser that initiated login to prevent login CSRF.
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
auth.post('/logout', sameOrigin, (_req, res) => {
  res.clearCookie(cookie, options);
  res.json({ ok: true });
});
