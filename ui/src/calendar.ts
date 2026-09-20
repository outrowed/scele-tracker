import type { Activity } from './model';

// Calendar arithmetic uses UTC date-only values after converting timestamps to WIB.
export function dayKey(timestamp: number) {
  const date = new Date((timestamp + 7 * 3600) * 1000);
  return date.toISOString().slice(0, 10);
}

export function monthDays(month: string) {
  const first = new Date(`${month}-01T00:00:00Z`);
  const start = new Date(first);
  start.setUTCDate(1 - ((first.getUTCDay() + 6) % 7));
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0));
  const count = Math.ceil((((first.getUTCDay() + 6) % 7) + last.getUTCDate()) / 7) * 7;
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

export function shiftMonth(month: string, delta: number) {
  const date = new Date(`${month}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + delta);
  return date.toISOString().slice(0, 7);
}

export function activityOnDay(item: Activity, day: string) {
  const opens = item.opensAt == null ? null : dayKey(item.opensAt);
  const due = item.dueAt == null ? null : dayKey(item.dueAt);
  const cutoff = item.cutoffAt == null ? null : dayKey(item.cutoffAt);
  if (day === due) return 'Due';
  if (day === opens) return 'Opens';
  if (day === cutoff) return 'Cut-off';
  if (opens && due && opens < day && day < due) return 'Available';
  return null;
}
