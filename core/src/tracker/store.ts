import { loadAccounts } from './accounts.js';
import { syncSession, syncToken, retainSessions } from './moodle.js';
import type { Activity, SourceStatus } from './types.js';

export function createTracker() {
  let snapshot: {
    activities: Activity[];
    sources: SourceStatus[];
    configured: boolean;
    checkedAt: string | null;
  } = { activities: [], sources: [], configured: false, checkedAt: null };
  let pending: Promise<typeof snapshot> | null = null;
  let checked = 0;
  async function sync() {
    const accounts = await loadAccounts();
    retainSessions(
      accounts
        .filter((account) => account.mode === 'session')
        .map((account) => account.id),
    );
    const activities: Activity[] = [];
    const sources: SourceStatus[] = [];
    for (const account of accounts) {
      try {
        const result = await (account.mode === 'session'
          ? syncSession(account)
          : syncToken(account));
        activities.push(...result.activities);
        sources.push({
          id: account.id,
          state: result.complete ? 'ok' : 'partial',
          updatedAt: new Date().toISOString(),
        });
      } catch {
        // Never log upstream responses, passwords, cookies, or token-bearing URLs.
        console.warn(JSON.stringify({ event: 'moodle_sync_failed', source: account.id }));
        sources.push({ id: account.id, state: 'error', updatedAt: null });
      }
    }
    snapshot = {
      activities,
      sources,
      configured: accounts.length > 0,
      checkedAt: new Date().toISOString(),
    };
    checked = Date.now();
    return snapshot;
  }
  return {
    async get() {
      // Share one in-flight sync so concurrent page loads do not multiply Moodle requests.
      if (pending) return pending;
      if (checked && Date.now() - checked < 5 * 60_000) return snapshot;
      pending = sync().finally(() => {
        pending = null;
      });
      return pending;
    },
  };
}
