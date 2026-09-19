import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';

const production = process.env.NODE_ENV === 'production';
const secret = process.env.JWT_SECRET;
if (production && (!secret || secret.length < 32))
  throw new Error('Set JWT_SECRET to at least 32 characters');
const origin = new URL(process.env.APP_URL || 'http://localhost:5173').origin;
if (production && !origin.startsWith('https://'))
  throw new Error('Production APP_URL must use HTTPS');
export const settings = {
  origin,
  secret: secret || randomBytes(48).toString('hex'),
  secure: production || origin.startsWith('https://'),
  cas: 'https://sso.ui.ac.id/cas2',
  accountsPath:
    process.env.MOODLE_ACCOUNTS_FILE ||
    resolve(import.meta.dirname, '../../../config/accounts.json'),
};
