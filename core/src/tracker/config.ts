import { createHash, randomBytes } from 'node:crypto';
import { resolve } from 'node:path';

const production = process.env.NODE_ENV === 'production';
const secret = process.env.JWT_SECRET;
if (production && (!secret || secret.length < 32))
  throw new Error('Set JWT_SECRET to at least 32 characters');
const origin = new URL(process.env.APP_URL || 'http://localhost:5173').origin;
if (production && !origin.startsWith('https://'))
  throw new Error('Production APP_URL must use HTTPS');

// Credential encryption key: a dedicated 32-byte AES-256 key, independent of
// the JWT secret.  In production, set CREDENTIAL_KEY to a 64-character hex
// string.  In development/test, derive one deterministically from JWT_SECRET
// so tests remain reproducible without an extra env var.
const credKeyHex = process.env.CREDENTIAL_KEY;
if (production && (!credKeyHex || credKeyHex.length !== 64))
  throw new Error('Set CREDENTIAL_KEY to a 64-character hex string (32 bytes)');
const credentialKey: Buffer = credKeyHex
  ? Buffer.from(credKeyHex, 'hex')
  : createHash('sha256')
      .update(`credential-key:${secret || 'dev'}`)
      .digest();

export const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60_000; // 30 days

export const settings = {
  origin,
  secret: secret || randomBytes(48).toString('hex'),
  credentialKey,
  secure: production || origin.startsWith('https://'),
  cas: 'https://sso.ui.ac.id/cas2',
  accountsPath:
    process.env.MOODLE_ACCOUNTS_FILE ||
    resolve(import.meta.dirname, '../../../config/accounts.json'),
};
