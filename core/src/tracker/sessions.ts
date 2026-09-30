import { randomBytes } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { encryptCredential, decryptCredential } from './crypto.js';
import { SESSION_MAX_AGE_MS } from './config.js';

export type SessionRecord = {
  id: string;
  username: string;
  fullname: string;
  prodi: string;
  angkatan: string;
  kd_org: string | null;
  academicInfo: string;
  createdAt: number;
  expiresAt: number;
  /** Number of consecutive credential-rejected failures (wrong password). */
  authFailures: number;
  /** Timestamp of last credential-rejected failure; null if none. */
  lastAuthFailure: number | null;
};

export const MAX_AUTH_FAILURES = 3;

export function openSessionStore(path: string) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      fullname TEXT NOT NULL,
      prodi TEXT NOT NULL DEFAULT 'Ilmu Komputer',
      angkatan TEXT NOT NULL DEFAULT '2026',
      kd_org TEXT,
      academic_info TEXT NOT NULL DEFAULT '',
      encrypted_username TEXT NOT NULL,
      encrypted_password TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      auth_failures INTEGER NOT NULL DEFAULT 0,
      last_auth_failure INTEGER
    );
    CREATE INDEX IF NOT EXISTS sessions_username_idx ON sessions(username);
    CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions(expires_at);`);

  return {
    /**
     * Create a new long-lived session with encrypted credentials.
     * Returns the opaque session ID (used as the cookie value).
     */
    create(
      identity: {
        username: string;
        fullname: string;
        prodi?: string;
        angkatan?: string;
        kd_org?: string;
        academicInfo?: string;
      },
      password: string,
    ): string {
      const id = randomBytes(32).toString('hex');
      const now = Date.now();
      const expiresAt = now + SESSION_MAX_AGE_MS;
      const encUsername = encryptCredential(identity.username);
      const encPassword = encryptCredential(password);
      db.prepare(
        `INSERT INTO sessions (id, username, fullname, prodi, angkatan, kd_org, academic_info,
          encrypted_username, encrypted_password, created_at, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        id,
        identity.username,
        identity.fullname,
        identity.prodi || 'Ilmu Komputer',
        identity.angkatan || '2026',
        identity.kd_org || null,
        identity.academicInfo || '',
        encUsername,
        encPassword,
        now,
        expiresAt,
      );
      return id;
    },

    /** Look up a session by ID. Returns null if expired or not found. */
    get(id: string): SessionRecord | null {
      const row = db
        .prepare(
          `SELECT id, username, fullname, prodi, angkatan, kd_org, academic_info,
            created_at, expires_at, auth_failures, last_auth_failure
          FROM sessions WHERE id=?`,
        )
        .get(id) as Record<string, unknown> | undefined;
      if (!row) return null;
      const expiresAt = Number(row.expires_at);
      if (Date.now() > expiresAt) {
        this.delete(id);
        return null;
      }
      return {
        id: String(row.id),
        username: String(row.username),
        fullname: String(row.fullname),
        prodi: String(row.prodi),
        angkatan: String(row.angkatan),
        kd_org: row.kd_org != null ? String(row.kd_org) : null,
        academicInfo: String(row.academic_info),
        createdAt: Number(row.created_at),
        expiresAt,
        authFailures: Number(row.auth_failures),
        lastAuthFailure:
          row.last_auth_failure != null ? Number(row.last_auth_failure) : null,
      };
    },

    /**
     * Retrieve decrypted credentials for a session.
     * Returns null if session is expired, missing, or credential-locked.
     */
    getCredentials(id: string): { username: string; password: string } | null {
      const row = db
        .prepare(
          `SELECT encrypted_username, encrypted_password, expires_at, auth_failures
          FROM sessions WHERE id=?`,
        )
        .get(id) as Record<string, unknown> | undefined;
      if (!row) return null;
      if (Date.now() > Number(row.expires_at)) {
        this.delete(id);
        return null;
      }
      if (Number(row.auth_failures) >= MAX_AUTH_FAILURES) return null;
      try {
        return {
          username: decryptCredential(String(row.encrypted_username)),
          password: decryptCredential(String(row.encrypted_password)),
        };
      } catch {
        // Corrupted or key-rotated — session is unrecoverable
        this.delete(id);
        return null;
      }
    },

    /** Record a credential-rejected authentication failure. */
    recordAuthFailure(id: string) {
      db.prepare(
        `UPDATE sessions SET auth_failures = auth_failures + 1,
          last_auth_failure = ? WHERE id=?`,
      ).run(Date.now(), id);
    },

    /** Reset failure count after a successful re-authentication. */
    clearAuthFailures(id: string) {
      db.prepare(
        `UPDATE sessions SET auth_failures = 0, last_auth_failure = NULL WHERE id=?`,
      ).run(id);
    },

    /** Whether the session has been locked due to too many auth failures. */
    isLocked(session: SessionRecord): boolean {
      return session.authFailures >= MAX_AUTH_FAILURES;
    },

    /** Delete a session and its stored credentials. */
    delete(id: string) {
      db.prepare('DELETE FROM sessions WHERE id=?').run(id);
    },

    /** Delete all sessions for a given username. */
    deleteAllForUser(username: string) {
      db.prepare('DELETE FROM sessions WHERE username=?').run(username);
    },

    /** Purge all expired sessions. */
    purgeExpired() {
      db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
    },

    close() {
      db.close();
    },
  };
}

export type SessionStore = ReturnType<typeof openSessionStore>;

let defaultStore: SessionStore | undefined;

export function getSessionStore(path?: string): SessionStore {
  if (path) return openSessionStore(path);
  return (defaultStore ??= openSessionStore(
    process.env.CACHE_DB_PATH || resolve('data/cache.sqlite'),
  ));
}

export function setSessionStore(store: SessionStore | undefined) {
  defaultStore = store;
}

export function closeSessionStore() {
  defaultStore?.close();
  defaultStore = undefined;
}
