import { resolve } from 'node:path';
import { openCache, type CachedRoomSchedule } from './cache.js';

export const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
export const DAYS = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'] as const;

export function extractRoomCode(name: string): string {
  if (name.includes('Auditorium Ged Baru-1')) return 'A2.01A';
  if (name.includes('Auditorium Ged baru')) return 'A2.01';
  if (name.includes('Lab A1.01+Lab A1.02')) return 'A1.01+';
  if (name.includes('Lab A1.04+Lab A3.02')) return 'A1.04+';
  if (name.includes('Lab.1101/1103') || name.includes('1101/1103')) return '1101';
  if (name.includes('Lab.1105') || name.includes('1105')) return '1105';
  if (name.includes('Lab.1107/1109') || name.includes('1107/1109')) return '1107';

  const matchA = name.match(/([A-Z]\d+\.\d+)/);
  if (matchA) return matchA[1];

  const matchLab = name.match(/Lab\.?(\d{4})/i);
  if (matchLab) return matchLab[1];

  return name.slice(0, 6).trim();
}

export function parseRoomMetadata(name: string) {
  let building = 'Gedung Baru';
  if (/g(d|ed)\.?\s*lama/i.test(name)) {
    building = 'Gedung Lama';
  } else if (/g(d|ed)\.?\s*baru/i.test(name)) {
    building = 'Gedung Baru';
  } else {
    const parenMatch = name.match(/\(([^)]+)\)/);
    if (parenMatch) {
      building = parenMatch[1].trim();
    }
  }
  const isLab = name.toLowerCase().includes('lab');
  const isAuditorium = name.toLowerCase().includes('auditorium');
  const roomType: 'classroom' | 'lab' | 'auditorium' = isAuditorium
    ? 'auditorium'
    : isLab
      ? 'lab'
      : 'classroom';
  const code = extractRoomCode(name);

  return {
    building,
    code,
    roomType,
    isLab,
    isAuditorium,
  };
}

export async function fetchUpstreamSchedules(): Promise<
  Record<string, Record<string, any>>
> {
  const results = await Promise.all(
    DAYS.map(async (day) => {
      const resp = await fetch(`https://csui.cesilia.dev/ruangan/schedule/${day}.json`);
      if (!resp.ok) {
        throw new Error(`Failed to fetch schedule for ${day}: HTTP ${resp.status}`);
      }
      return { day, data: (await resp.json()) as Record<string, any> };
    }),
  );
  const schedule: Record<string, Record<string, any>> = {};
  for (const { day, data } of results) {
    schedule[day] = data;
  }
  return schedule;
}

export interface RoomTrackerOptions {
  path?: string;
  now?: () => number;
  fetchSchedule?: () => Promise<Record<string, Record<string, any>>>;
  intervalMs?: number;
  checkIntervalMs?: number;
}

export function createRoomTracker(options: RoomTrackerOptions = {}) {
  const now = options.now || Date.now;
  const intervalMs = options.intervalMs || THREE_DAYS_MS;
  const checkIntervalMs = options.checkIntervalMs || 60 * 60 * 1000; // Check hourly
  const fetchSchedule = options.fetchSchedule || fetchUpstreamSchedules;

  let cache: ReturnType<typeof openCache> | undefined;
  let inFlightRefresh: Promise<CachedRoomSchedule> | null = null;
  let timer: NodeJS.Timeout | null = null;

  function getCache() {
    return (cache ??= openCache(
      options.path || process.env.CACHE_DB_PATH || resolve('data/cache.sqlite'),
    ));
  }

  async function refresh(): Promise<CachedRoomSchedule> {
    if (inFlightRefresh) return inFlightRefresh;

    inFlightRefresh = (async () => {
      const db = getCache();
      const current = db.getRoomSchedule();
      const currentTime = now();

      try {
        const schedule = await fetchSchedule();
        db.setRoomSchedule(schedule, currentTime, parseRoomMetadata);
        return { schedule, fetchedAt: currentTime };
      } catch (err) {
        console.warn(
          JSON.stringify({
            event: 'room_schedule_refresh_failed',
            error: (err as Error).message,
            retainedCached: Boolean(current),
          }),
        );
        if (current) {
          // Preserve last-known good snapshot on upstream failure
          return current;
        }
        throw err;
      } finally {
        inFlightRefresh = null;
      }
    })();

    return inFlightRefresh;
  }

  async function getSchedule(): Promise<CachedRoomSchedule> {
    const db = getCache();
    const cached = db.getRoomSchedule();
    if (cached) {
      // User request serves directly from cache without hitting external API
      return cached;
    }
    // Cold start fallback: only fetch if cache is completely empty
    return refresh();
  }

  function getRooms(day?: string | number) {
    const db = getCache();
    return db.getRooms(day);
  }

  function isDue(): boolean {
    const db = getCache();
    const sync = db.getRoomSyncStatus();
    if (!sync) return true;
    return now() - sync.updatedAt >= intervalMs;
  }

  function startScheduledSync() {
    if (timer) return;

    // Check if initial population or refresh is due on startup
    if (isDue()) {
      void refresh().catch(() => {});
    }

    timer = setInterval(() => {
      if (isDue()) {
        void refresh().catch(() => {});
      }
    }, checkIntervalMs);

    // Unref timer so it does not block node process shutdown
    timer.unref();
  }

  function stopScheduledSync() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function close() {
    stopScheduledSync();
    cache?.close();
    cache = undefined;
  }

  return {
    getSchedule,
    getRooms,
    refresh,
    isDue,
    startScheduledSync,
    stopScheduledSync,
    close,
  };
}

export const defaultRoomTracker = createRoomTracker();
