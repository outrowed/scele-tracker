export type Activity = {
  completion?: 'completed' | 'pending' | 'unknown';
  submittedLate?: boolean;
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
  closeAt?: number | null;
  timeLimit: number | null;
  source?: string;
};
export type Snapshot = {
  activities: Activity[];
  incomplete: boolean;
  preparing?: boolean;
  stale?: boolean;
  refreshing?: boolean;
};
// Quizzes have a close time rather than a separate due date. Use it for
// chronological placement without pretending it is an assignment deadline.
export function scheduleAt(item: Activity) {
  return item.dueAt ?? (item.kind === 'quiz' ? (item.closeAt ?? null) : null);
}
export function status(item: Activity, now = Date.now() / 1000) {
  const date = scheduleAt(item);
  if (date && date <= now) return 'past';
  if (date) return 'upcoming';
  return 'undated';
}
export function dateLabel(value: number | null) {
  return value
    ? new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(value * 1000)
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
  if (response.status === 401) {
    window.dispatchEvent(new Event('scele-session-expired'));
    throw new Error('Your SCELE session expired. Sign in again to reconnect.');
  }
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Could not load the tracker.');
  return body;
}

// Completion is only asserted when Moodle supplies explicit evidence. A passed
// deadline without that evidence does not prove that the user missed the task.
export function activityState(item: Activity, now = Date.now() / 1000) {
  if (item.completion === 'completed')
    return item.kind === 'assignment' && item.submittedLate === true
      ? ('submittedLate' as const)
      : ('completed' as const);
  // Closure means no further submission is accepted. It is distinct from a
  // passed due date: an unfinished item is overdue only while still open.
  const closeAt = item.closeAt ?? item.cutoffAt;
  if (closeAt && closeAt <= now) return 'closed' as const;
  if (item.dueAt && item.dueAt <= now)
    return item.completion === 'pending' ? ('overdue' as const) : ('unverified' as const);
  if (item.opensAt && item.opensAt > now) return 'notOpen' as const;
  const scheduled = scheduleAt(item);
  if (!scheduled) return 'undated' as const;
  if (new Date(scheduled * 1000).toDateString() === new Date(now * 1000).toDateString())
    return 'dueToday' as const;
  return 'available' as const;
}
export function personalStatus(item: Activity, now = Date.now() / 1000) {
  const state = activityState(item, now);
  return state === 'completed' || state === 'submittedLate'
    ? 'completed'
    : state === 'overdue'
      ? 'missed'
      : state === 'closed'
        ? 'closed'
        : state === 'unverified'
          ? 'unknown'
          : 'pending';
}
