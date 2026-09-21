import type { Activity } from './model';

/**
 * Returns date-only string in YYYY-MM-DD representing the timestamp in user's local time.
 */
export function dayKey(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns month key in YYYY-MM representing the timestamp in user's local time.
 */
export function monthKey(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Formats a month key (YYYY-MM) into a human readable label, e.g. "September 2026".
 */
export function formatMonthHeading(ym: string): string {
  if (!ym || ym === 'undated') return 'No Deadline / Undated';
  const parts = ym.split('-');
  if (parts.length < 2) return ym;
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
  return new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export interface PlannerDay {
  dateKey: string; // YYYY-MM-DD
  dayName: string; // Mon, Tue, ...
  dayNumber: number; // 21, 22, ...
  monthName: string; // Sep, Oct, ...
  isToday: boolean;
  quizzes: Activity[];
  assignments: Activity[];
}

/**
 * Generates the 7 days of the week containing (or offset by day from) the reference timestamp in user's local time.
 * Monday is the baseline start of the current week.
 */
export function getWeekDays(
  referenceTimestamp = Date.now() / 1000,
  dayOffset = 0,
  activities: Activity[] = [],
): {
  days: PlannerDay[];
  weekLabel: string;
  startDayKey: string;
  endDayKey: string;
} {
  const currentLocalDayKey = dayKey(Date.now() / 1000);

  // Date object representing reference time in local time
  const refDate = new Date(referenceTimestamp * 1000);

  // Day of week: 0 is Sunday, 1 is Monday ... 6 is Saturday
  // Convert to Monday = 0, Sunday = 6
  const dayOfWeek = (refDate.getDay() + 6) % 7;

  // Baseline start: Monday of the reference week shifted by dayOffset days
  const startDate = new Date(refDate);
  startDate.setDate(refDate.getDate() - dayOfWeek + dayOffset);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const days: PlannerDay[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const dateKeyStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    // Group activities matching this dateKey
    const dayActivities = activities.filter((act) => {
      if (!act.dueAt) return false;
      return dayKey(act.dueAt) === dateKeyStr;
    });

    const quizzes = dayActivities.filter((act) => act.kind === 'quiz');
    const assignments = dayActivities.filter((act) => act.kind === 'assignment');

    return {
      dateKey: dateKeyStr,
      dayName: dayNames[d.getDay()],
      dayNumber: d.getDate(),
      monthName: d.toLocaleDateString('en-GB', { month: 'short' }),
      isToday: dateKeyStr === currentLocalDayKey,
      quizzes,
      assignments,
    };
  });

  const startDay = days[0];
  const endDay = days[6];
  const weekLabel = `${startDay.dayNumber} ${startDay.monthName} – ${endDay.dayNumber} ${endDay.monthName} ${endDay.dateKey.slice(0, 4)}`;

  return {
    days,
    weekLabel,
    startDayKey: startDay.dateKey,
    endDayKey: endDay.dateKey,
  };
}

/**
 * Categorizes an activity into:
 * - 'today': due today in local time
 * - 'upcoming': due after today or later today
 * - 'past': deadline passed before today
 * - 'undated': no due date
 */
export function deadlineTimeState(
  item: Activity,
  now = Date.now() / 1000,
): 'today' | 'upcoming' | 'past' | 'undated' {
  if (!item.dueAt) return 'undated';
  const todayKey = dayKey(now);
  const itemKey = dayKey(item.dueAt);
  if (todayKey === itemKey) return 'today';
  if (item.dueAt < now) return 'past';
  return 'upcoming';
}

/**
 * Comparator to sort activities by newest first:
 * - Higher dueAt (or opensAt if undated) timestamp comes first (newest date first).
 * - If deadlines are identical, quizzes are prioritized before assignments.
 * - Undated activities are placed at the end.
 */
/**
 * Comparator to sort activities by newest first:
 * - Higher dueAt (or opensAt if undated) timestamp comes first (newest date first).
 * - If deadlines are identical, quizzes are prioritized before assignments.
 * - Undated activities are placed at the end.
 */
export function compareNewestFirst(a: Activity, b: Activity): number {
  const timeA = a.dueAt ?? a.opensAt;
  const timeB = b.dueAt ?? b.opensAt;
  if (timeA == null && timeB != null) return 1;
  if (timeB == null && timeA != null) return -1;
  if (timeA != null && timeB != null && timeB !== timeA) {
    return timeB - timeA;
  }
  if (a.kind !== b.kind) {
    return a.kind === 'quiz' ? -1 : 1;
  }
  return a.name.localeCompare(b.name);
}

/** Inclusive local-date range; a single known endpoint is shown on that day. */
export function activityRange(item: Activity) {
  const start = item.opensAt ?? item.dueAt;
  const end = item.dueAt ?? item.opensAt;
  if (start == null || end == null) return null;
  const endKey = dayKey(end);
  return { start: start > end ? endKey : dayKey(start), end: endKey };
}

export function weekRanges(items: Activity[], days: PlannerDay[]) {
  if (!days.length) return [];
  const ranges = items
    .flatMap((item) => {
      const range = activityRange(item);
      if (
        !range ||
        range.end < days[0].dateKey ||
        range.start > days[days.length - 1].dateKey
      )
        return [];
      const start = days.findIndex((day) => day.dateKey >= range.start);
      const end = days.reduce(
        (last, day, index) => (day.dateKey <= range.end ? index : last),
        -1,
      );
      return [
        {
          item,
          start: Math.max(0, start),
          end,
          continuesBefore: range.start < days[0].dateKey,
          continuesAfter: range.end > days[days.length - 1].dateKey,
        },
      ];
    })
    .sort(
      (a, b) => a.start - b.start || b.end - a.end || a.item.id.localeCompare(b.item.id),
    );
  const laneEnds: number[] = [];
  return ranges.map((range) => {
    let lane = laneEnds.findIndex((end) => end < range.start);
    if (lane < 0) lane = laneEnds.length;
    laneEnds[lane] = range.end;
    return { ...range, lane };
  });
}
