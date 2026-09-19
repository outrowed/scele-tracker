import { ArrowUpRight, ClipboardList, Timer, Clock3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { dateLabel, remaining, status, type Activity } from '../model';
export function ActivityCard({ item }: { item: Activity }) {
  const past = status(item) === 'past';
  const Icon = item.kind === 'quiz' ? Timer : ClipboardList;
  return (
    <article className="activity-card group">
      <div className={`activity-icon ${item.kind}`}>
        <Icon size={22} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="eyebrow">{item.courseName}</span>
          <span className="type-label">{item.kind}</span>
        </div>
        <h3 className="mt-2 text-lg font-semibold">
          <Link to={`/activities/${item.id}`} className="activity-link">
            {item.name}
            <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-slate-500">
          {item.description || 'Open activity details for dates and the SCeLE link.'}
        </p>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 size={13} aria-hidden="true" />
            {dateLabel(item.dueAt)}
          </span>
        </div>
      </div>
      <span className={`deadline ${past ? 'late' : ''}`}>{remaining(item.dueAt)}</span>
    </article>
  );
}
