import { resolve } from 'node:path';
import { loadAccounts } from './accounts.js';
import { syncSession, syncToken, retainSessions } from './moodle.js';
import { openCache, type CachedSnapshot } from './cache.js';
import type { Account, SyncResult } from './types.js';

export const FRESH_MS = 10 * 60_000;
export function createTracker(
  options: {
    path?: string;
    now?: () => number;
    accounts?: () => Promise<Account[]>;
    sync?: (account: Account) => Promise<SyncResult>;
  } = {},
) {
  const now = options.now || Date.now;
  const accounts = options.accounts || loadAccounts;
  const syncAccount =
    options.sync ||
    ((account: Account) =>
      account.mode === 'session' ? syncSession(account) : syncToken(account));
  // Open lazily: health checks and unauthenticated requests must not start cache work.
  let cache: ReturnType<typeof openCache> | undefined;
  let snapshot: CachedSnapshot;
  let pending: Promise<void> | null = null;
  function initialize() {
    if (cache) return;
    cache = openCache(
      options.path || process.env.CACHE_DB_PATH || resolve('data/cache.sqlite'),
    );
    snapshot = cache.read() || {
      activities: [],
      sources: [],
      configured: false,
      checkedAt: null,
      nextAttempt: 0,
      failures: 0,
    };
  }
  async function refresh() {
    try {
      const configured = await accounts();
      retainSessions(configured.filter((a) => a.mode === 'session').map((a) => a.id));
      const next: CachedSnapshot = {
        activities: [],
        sources: [],
        configured: configured.length > 0,
        checkedAt: new Date(now()).toISOString(),
        nextAttempt: 0,
        failures: 0,
      };
      for (const account of configured) {
        const old = snapshot.activities.filter((item) => item.source === account.id);
        const previous = snapshot.sources.find((source) => source.id === account.id);
        try {
          const result = await syncAccount(account);
          // Partial results add discoveries but cannot prove old activities were deleted.
          const items = result.complete
            ? new Map()
            : new Map(old.map((item) => [item.id, item]));
          for (const item of result.activities) items.set(item.id, item);
          next.activities.push(...items.values());
          next.sources.push({
            id: account.id,
            state: result.complete ? 'ok' : 'partial',
            updatedAt: result.complete
              ? new Date(now()).toISOString()
              : previous?.updatedAt || null,
          });
        } catch {
          next.activities.push(...old);
          next.sources.push({
            id: account.id,
            state: 'error',
            updatedAt: previous?.updatedAt || null,
          });
        }
      }
      const failed = next.sources.some((source) => source.state !== 'ok');
      next.failures = failed ? snapshot.failures + 1 : 0;
      next.nextAttempt =
        now() +
        (failed
          ? Math.min(FRESH_MS, 60_000 * 2 ** Math.min(next.failures - 1, 4))
          : FRESH_MS);
      cache!.write(next);
      snapshot = next;
    } catch {
      // Never expose credentials or raw upstream errors; retain last-good data on failure.
      snapshot = {
        ...snapshot,
        failures: snapshot.failures + 1,
        nextAttempt: now() + FRESH_MS,
      };
      try {
        cache!.write(snapshot);
      } catch {
        console.warn('Cache persistence unavailable');
      }
    }
  }
  return {
    async get() {
      initialize();
      // No scheduler: only an authenticated request can start work; concurrent readers share it.
      if (!pending && now() >= snapshot.nextAttempt) {
        pending = refresh().finally(() => {
          pending = null;
        });
      }
      return {
        ...snapshot,
        refreshing: Boolean(pending),
        preparing: !snapshot.checkedAt,
        stale:
          snapshot.failures > 0 ||
          snapshot.sources.some(
            (source) =>
              !source.updatedAt || now() - Date.parse(source.updatedAt) >= FRESH_MS,
          ),
      };
    },
    async settled() {
      await pending;
    },
    async close() {
      await pending;
      cache?.close();
    },
  };
}
