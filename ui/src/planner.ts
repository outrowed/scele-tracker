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
 * Generates the 7 days of the week containing (or offset from) the reference timestamp in user's local time.
 * Monday is the start of the week.
 */
export function getWeekDays(
  referenceTimestamp = Date.now() / 1000,
  weekOffset = 0,
  activities: Activity[] = [],
): {
  days: PlannerDay[];
  weekLabel: string;
  startDayKey: string;
  endDayKey: string;
} {
  const currentLocalDayKey = dayKey(Date.now() / 1000);

  // Date object representing reference time in local time
  const refDate = new Date((referenceTimestamp + weekOffset * 7 * 86400) * 1000);

  // Day of week: 0 is Sunday, 1 is Monday ... 6 is Saturday
  // Convert to Monday = 0, Sunday = 6
  const dayOfWeek = (refDate.getDay() + 6) % 7;

  // Monday of this week
  const monday = new Date(refDate);
  monday.setDate(refDate.getDate() - dayOfWeek);

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const days: PlannerDay[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
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
      dayName: dayNames[i],
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
