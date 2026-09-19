export type Activity = {
  id: string;
  kind: 'assignment' | 'quiz';
  name: string;
  courseId: number;
  courseName: string;
  description: string;
  url: string;
  opensAt: number | null;
  dueAt: number | null;
  cutoffAt: number | null;
  timeLimit: number | null;
  source?: string;
};
export type Snapshot = {
  activities: Activity[];
  incomplete: boolean;
};
export function status(item: Activity, now = Date.now() / 1000) {
  if (item.dueAt && item.dueAt <= now) return 'past';
  if (item.dueAt) return 'upcoming';
  return 'undated';
}
export function dateLabel(value: number | null) {
  return value
    ? new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Jakarta',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(value * 1000) + ' WIB'
    : 'Not available';
}
export function remaining(value: number | null, now = Date.now() / 1000) {
  if (!value) return 'No deadline available';
  const hours = Math.ceil(Math.abs(value - now) / 3600);
  const amount = hours < 24 ? `${hours}h` : `${Math.ceil(hours / 24)}d`;
  return value <= now ? `${amount} past due` : `Due in ${amount}`;
}
// Make a same-origin request with the browser session cookie; callers own UI state updates.
export async function api<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (response.status === 401)
    throw new Error('Your session expired. Reload to sign in again.');
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Could not load the tracker.');
  return body;
}
