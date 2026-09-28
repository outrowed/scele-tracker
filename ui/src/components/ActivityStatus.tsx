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
    completed: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    overdue: 'border-rose-200 bg-rose-50 text-rose-800',
    submittedLate: 'border-amber-200 bg-amber-50 text-amber-800',
    closed: 'border-slate-200 bg-slate-100 text-slate-700',
    unverified: 'border-amber-200 bg-amber-50 text-amber-800',
    dueToday: 'border-amber-200 bg-amber-50 text-amber-800',
    available: 'border-teal-200 bg-teal-50 text-teal-800',
    notOpen: 'border-slate-200 bg-slate-50 text-slate-600',
    undated: 'border-slate-200 bg-slate-50 text-slate-600',
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
      {labels[state]}
    </span>
  );
}
