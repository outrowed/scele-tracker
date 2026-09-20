import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Activity, SourceStatus } from './types.js';

export type CachedSnapshot = {
  activities: Activity[];
  sources: SourceStatus[];
  configured: boolean;
  checkedAt: string | null;
  nextAttempt: number;
  failures: number;
};

export function openCache(path: string) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  // One atomic snapshot keeps readers from observing half-published source updates.
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS snapshot (id INTEGER PRIMARY KEY CHECK(id=1), data TEXT NOT NULL)`);
  return {
    read(): CachedSnapshot | null {
      const row = db.prepare('SELECT data FROM snapshot WHERE id=1').get();
      return row ? JSON.parse(String(row.data)) : null;
    },
    write(snapshot: CachedSnapshot) {
      db.prepare(
        'INSERT INTO snapshot VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET data=excluded.data',
      ).run(JSON.stringify(snapshot));
    },
    close: () => db.close(),
  };
}
