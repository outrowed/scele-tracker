import { Check, Clock3, Loader2 } from 'lucide-react';
import { activityState, type Activity } from '../model';

/** One badge combines the verified completion state with deadline availability. */
export function ActivityStatus({
  item,
  now = Date.now() / 1000,
}: {
  item: Activity;
  now?: number;
}) {
  const state = activityState(item, now);
  const datesPending = state === 'unverified' && item.datesPending;
  const labels = {
    completed: 'Completed',
    overdue: 'Overdue',
    submittedLate: 'Submitted late',
    closed: 'Closed',
    unverified: 'Loading…',
    dueToday: 'Due today',
    available: 'Available',
    notOpen: 'Opens later',
    undated: 'No deadline',
  };
  const colors = {
    completed:
      'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200',
    overdue:
      'border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-200',
    submittedLate:
      'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200',
    closed:
      'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200',
    unverified:
      'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200',
    dueToday:
      'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200',
    available:
      'border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-200',
    notOpen:
      'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
    undated:
      'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
  };
  const Icon =
    state === 'completed' || state === 'submittedLate'
      ? Check
      : state === 'unverified'
        ? Loader2
        : Clock3;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${colors[state]}`}
    >
      <Icon
        size={13}
        aria-hidden="true"
        className={state === 'unverified' ? 'animate-spin' : undefined}
      />
      {datesPending ? 'Checking dates…' : labels[state]}
    </span>
  );
}
