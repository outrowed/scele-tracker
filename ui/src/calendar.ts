import type { Activity } from './model';

// Calendar arithmetic uses local date-only values from timestamps.
export function dayKey(timestamp: number) {
  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function monthDays(month: string) {
  const [yearStr, monthStr] = month.split('-');
  const year = Number(yearStr);
  const monthIdx = Number(monthStr) - 1;
  const first = new Date(year, monthIdx, 1);
  const start = new Date(first);
  start.setDate(1 - ((first.getDay() + 6) % 7));
  const last = new Date(year, monthIdx + 1, 0);
  const count = Math.ceil((((first.getDay() + 6) % 7) + last.getDate()) / 7) * 7;
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
}

export function shiftMonth(month: string, delta: number) {
  const [yearStr, monthStr] = month.split('-');
  const date = new Date(Number(yearStr), Number(monthStr) - 1 + delta, 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function activityOnDay(item: Activity, day: string) {
  if (item.opensAt && item.dueAt && item.opensAt > item.dueAt) return null;
  if (item.opensAt && item.cutoffAt && item.opensAt > item.cutoffAt) return null;
  const opens = item.opensAt == null ? null : dayKey(item.opensAt);
  const due = item.dueAt == null ? null : dayKey(item.dueAt);
  const cutoff = item.cutoffAt == null ? null : dayKey(item.cutoffAt);
  if (day === due) return 'Due';
  if (day === opens) return 'Opens';
  if (day === cutoff) return 'Cut-off';
  if (opens && due && opens < day && day < due) return 'Available';
  return null;
}
