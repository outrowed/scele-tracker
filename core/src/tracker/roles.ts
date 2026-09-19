import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
export type Role = 'admin' | 'user';
export function parseUsers(value: unknown): Map<string, Role> {
  if (!value || typeof value !== 'object' || !('users' in value) || !Array.isArray(value.users)) throw new Error('Invalid users configuration');
  const users = new Map<string, Role>();
  for (const entry of value.users) {
    if (!entry || typeof entry.username !== 'string' || !entry.username.trim() || entry.username !== entry.username.trim() || users.has(entry.username) || !['admin', 'user'].includes(entry.role)) throw new Error('Invalid user role');
    users.set(entry.username, entry.role);
  }
  return users;
}
export async function roleFor(username: string): Promise<Role> {
  try {
    const path = process.env.USERS_FILE || resolve(import.meta.dirname, '../../../config/users.json');
    return parseUsers(JSON.parse(await readFile(path, 'utf8'))).get(username) || 'user';
  } catch {
    // Missing or invalid policy fails closed, including previously granted admins.
    return 'user';
  }
}
