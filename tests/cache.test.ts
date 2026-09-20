import { it, expect } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createTracker, FRESH_MS } from '../core/src/tracker/store';

it('shares refreshes, idles without readers, retains failures, and persists across restart', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'tracker-cache-'));
  const path = join(directory, 'cache.sqlite');
  let time = 1_000_000;
  let calls = 0;
  let fail = false;
  const options = {
    path,
    now: () => time,
    accounts: async () => [
      { id: 'one', mode: 'token' as const, token: 'never-persist-me' },
    ],
    sync: async () => {
      calls++;
      if (fail) throw Error('offline');
      return { activities: [], complete: true };
    },
  };
  let tracker = createTracker(options);
  try {
    expect((await tracker.get()).preparing).toBe(true);
    await Promise.all([tracker.get(), tracker.get()]);
    await tracker.settled();
    expect(calls).toBe(1);
    time += FRESH_MS - 1;
    await tracker.get();
    expect(calls).toBe(1);
    await tracker.close();
    tracker = createTracker(options);
    expect((await tracker.get()).sources[0].state).toBe('ok');
    expect(calls).toBe(1);
    time += 2 * FRESH_MS;
    expect(calls).toBe(1); // Advancing time alone cannot initiate any network work.
    fail = true;
    expect((await tracker.get()).stale).toBe(true);
    await tracker.settled();
    const failed = await tracker.get();
    expect(failed.sources[0].updatedAt).not.toBeNull();
    expect(failed.sources[0].state).toBe('error');
    expect(calls).toBe(2);
    await tracker.get();
    expect(calls).toBe(2);
  } finally {
    await tracker.close();
    await rm(directory, { recursive: true });
  }
});

it('retains old activities on partial/failing sources and removes retired sources', async () => {
  let time = 1_000_000;
  let mode = 'ok';
  let enabled = true;
  const activity = {
    id: 'one-quiz-1',
    source: 'one',
    kind: 'quiz' as const,
    name: 'Quiz',
    courseId: 1,
    courseName: 'Course',
    description: '',
    url: 'https://scele.cs.ui.ac.id/mod/quiz/view.php?id=1',
    opensAt: null,
    dueAt: null,
    cutoffAt: null,
    timeLimit: null,
  };
  const tracker = createTracker({
    path: ':memory:',
    now: () => time,
    accounts: async () => (enabled ? [{ id: 'one', mode: 'token' as const }] : []),
    sync: async () => {
      if (mode === 'error') throw Error('offline');
      return { activities: mode === 'ok' ? [activity] : [], complete: mode === 'ok' };
    },
  });
  try {
    await tracker.get();
    await tracker.settled();
    for (const state of ['partial', 'error']) {
      mode = state;
      time += FRESH_MS;
      expect((await tracker.get()).activities).toEqual([activity]);
      await tracker.settled();
      expect((await tracker.get()).activities).toEqual([activity]);
    }
    enabled = false;
    time += FRESH_MS;
    await tracker.get();
    await tracker.settled();
    expect((await tracker.get()).activities).toEqual([]);
  } finally {
    await tracker.close();
  }
});
