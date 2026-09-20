import { ArrowUpRight, ClipboardList, Timer, Clock3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { dateLabel, remaining, status, type Activity } from '../model';
import styles from './ActivityCard.module.css';

export function ActivityCard({ item }: { item: Activity }) {
  const past = status(item) === 'past';
  const Icon = item.kind === 'quiz' ? Timer : ClipboardList;
  return (
    <article className={`${styles.card} group`}>
      <div
        className={`rounded-xl p-3 ${item.kind === 'quiz' ? 'bg-violet-50 text-violet-600' : 'bg-teal-50 text-teal-700'} ${styles.icon}`}
      >
        <Icon size={22} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {item.courseName}
          </span>
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] capitalize text-slate-500">
            {item.kind}
          </span>
        </div>
        <h3 className="mt-2 text-lg font-semibold">
          <Link
            to={`/activities/${item.id}`}
            className="inline-flex items-start gap-2 break-words transition hover:text-teal-700 [overflow-wrap:anywhere] [&_svg]:mt-1 [&_svg]:shrink-0"
          >
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
      <span
        className={`${styles.deadline} rounded-full px-2.5 py-1 text-[10px] font-semibold ${past ? 'bg-amber-50 text-amber-800' : 'bg-teal-50 text-teal-800'}`}
      >
        {remaining(item.dueAt)}
      </span>
    </article>
  );
}
