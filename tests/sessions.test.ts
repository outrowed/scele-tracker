import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openSessionStore } from '../core/src/tracker/sessions';
import { createApp } from '../core/src/app';
import { settings, SESSION_MAX_AGE_MS } from '../core/src/tracker/config';
import { encryptCredential, decryptCredential } from '../core/src/tracker/crypto';
import { MoodleSession, MoodleSessionExpired } from '../core/src/tracker/moodle';

describe('encrypted server-side session store', () => {
  let tmpDir: string;
  let dbPath: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'session-store-test-'));
    dbPath = join(tmpDir, 'sessions.sqlite');
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('encrypts credentials and decrypts them with AES-256-GCM', () => {
    const plain = 'super-secret-password-123';
    const encrypted = encryptCredential(plain);
    expect(encrypted).not.toContain(plain);
    expect(encrypted.split('.')).toHaveLength(3);
    const decrypted = decryptCredential(encrypted);
    expect(decrypted).toBe(plain);
  });

  it('creates long-lived sessions with encrypted credentials', () => {
    const store = openSessionStore(dbPath);
    try {
      const sessionId = store.create(
        {
          username: 'student1',
          fullname: 'Student One',
          prodi: 'Sistem Informasi',
          angkatan: '2024',
          kd_org: '06.00.12.01',
          academicInfo: 'Sistem Informasi 2024',
        },
        'hunter2-password',
      );
      expect(typeof sessionId).toBe('string');
      expect(sessionId).toHaveLength(64);

      const session = store.get(sessionId);
      expect(session).not.toBeNull();
      expect(session?.username).toBe('student1');
      expect(session?.fullname).toBe('Student One');
      expect(session?.prodi).toBe('Sistem Informasi');
      expect(session?.angkatan).toBe('2024');
      expect(session?.expiresAt).toBeGreaterThan(Date.now() + 29 * 24 * 60 * 60_000);

      const creds = store.getCredentials(sessionId);
      expect(creds).toEqual({ username: 'student1', password: 'hunter2-password' });
    } finally {
      store.close();
    }
  });

  it('deletes session credentials permanently on logout/delete', () => {
    const store = openSessionStore(dbPath);
    try {
      const sessionId = store.create(
        { username: 'student2', fullname: 'Student Two' },
        'password-to-delete',
      );
      expect(store.get(sessionId)).not.toBeNull();
      expect(store.getCredentials(sessionId)).not.toBeNull();

      store.delete(sessionId);
      expect(store.get(sessionId)).toBeNull();
      expect(store.getCredentials(sessionId)).toBeNull();
    } finally {
      store.close();
    }
  });

  it('locks session after 3 consecutive authentication failures', () => {
    const store = openSessionStore(dbPath);
    try {
      const sessionId = store.create(
        { username: 'student3', fullname: 'Student Three' },
        'mismatched-password',
      );
      expect(store.getCredentials(sessionId)).not.toBeNull();

      store.recordAuthFailure(sessionId);
      store.recordAuthFailure(sessionId);
      expect(store.getCredentials(sessionId)).not.toBeNull();

      store.recordAuthFailure(sessionId); // 3rd failure
      const rec = store.get(sessionId);
      expect(rec).not.toBeNull();
      expect(store.isLocked(rec!)).toBe(true);
      expect(store.getCredentials(sessionId)).toBeNull();
    } finally {
      store.close();
    }
  });
});
