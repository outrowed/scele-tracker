import { readFile, stat } from 'node:fs/promises';
import type { Account } from './types.js';
import { settings } from './config.js';

export function parseAccounts(value: unknown): Account[] {
  if (!value || typeof value !== 'object' || !('accounts' in value) || !Array.isArray(value.accounts)) throw new Error('Invalid accounts configuration');
  if (value.accounts.length > 20) throw new Error('At most 20 accounts are supported');
  const ids = new Set<string>();
  return value.accounts.map((account: Account) => {
    if (!account || typeof account.id !== 'string' || !/^[a-z0-9-]{1,40}$/.test(account.id) || ids.has(account.id)) throw new Error('Account IDs must be unique public aliases');
    ids.add(account.id);
    if (account.mode === 'session') {
      if (typeof account.username !== 'string' || !account.username || typeof account.password !== 'string' || !account.password) throw new Error('Session credentials required');
      return { id: account.id, mode: account.mode, username: account.username, password: account.password };
    }
    if (account.mode === 'token' && typeof account.token === 'string' && account.token) return { id: account.id, mode: account.mode, token: account.token };
    throw new Error('Unsupported account mode');
  });
}
export async function loadAccounts(): Promise<Account[]> {
  try {
    const info = await stat(settings.accountsPath);
    if ((info.mode & 0o077) !== 0) throw new Error('Accounts file must have mode 0600');
    return parseAccounts(JSON.parse(await readFile(settings.accountsPath, 'utf8')));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}
