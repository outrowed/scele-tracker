import { ArrowUpRight, Calendar, CheckCircle2, Clock3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { dateLabel, remaining, status, type Activity } from '../model';
import {
  compareNewestFirst,
  deadlineTimeState,
  formatMonthHeading,
  monthKey,
} from '../planner';

interface TabularActivityListProps {
  items: Activity[];
  now?: number;
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div
      className="my-6 flex items-center gap-4 text-center"
      role="separator"
      aria-label={label}
    >
      <div className="h-px flex-1 bg-slate-200" />
      <span className="rounded-full border border-slate-200 bg-white px-4 py-1 text-xs font-semibold text-slate-600 shadow-xs">
        {label}
      </span>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

function renderTable(tableItems: Activity[], now: number) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-xs uppercase tracking-wider text-slate-500 font-semibold">
              <th scope="col" className="py-3.5 pl-4 pr-3.5 sm:pl-6 min-w-[180px]">
                Activity Name
              </th>
              <th scope="col" className="whitespace-nowrap px-3.5 py-3.5">
                Type
              </th>
              <th scope="col" className="px-3.5 py-3.5 min-w-[160px] max-w-[260px]">
                Course
              </th>
              <th scope="col" className="whitespace-nowrap px-3.5 py-3.5 min-w-[140px]">
                Due Date
              </th>
              <th
                scope="col"
                className="whitespace-nowrap py-3.5 pl-3.5 pr-4 sm:pr-6 text-right"
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tableItems.map((item) => {
              const timeState = deadlineTimeState(item, now);
              const isQuiz = item.kind === 'quiz';

              // Status styles
              let statusBadge = (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  Undated
                </span>
              );

              if (timeState === 'today') {
                statusBadge = (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 animate-pulse">
                    <Clock3 size={13} />
                    Due Today
                  </span>
                );
              } else if (timeState === 'past') {
                statusBadge = (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-200/60">
                    {remaining(item.dueAt, now)}
                  </span>
                );
              } else if (timeState === 'upcoming') {
                statusBadge = (
                  <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800 border border-teal-200/60">
                    <CheckCircle2 size={13} />
                    {remaining(item.dueAt, now)}
                  </span>
                );
              }

              // Row background highlight for today
              const rowBg =
                timeState === 'today'
                  ? 'bg-amber-50/40 hover:bg-amber-50/70'
                  : 'hover:bg-slate-50/75';

              return (
                <tr key={item.id} className={`transition ${rowBg}`}>
                  {/* Column 1: Name */}
                  <td className="py-3.5 pl-4 pr-3.5 sm:pl-6 max-w-xs md:max-w-md">
                    <div className="flex items-start gap-2">
                      <Link
                        to={`/activities/${item.id}`}
                        className="font-semibold text-slate-800 transition hover:text-teal-700 inline-flex items-center gap-1 group"
                      >
                        <span className="line-clamp-2">{item.name}</span>
                        <ArrowUpRight
                          size={14}
                          className="shrink-0 text-slate-400 group-hover:text-teal-700 transition"
                        />
                      </Link>
                    </div>
                    {item.description && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">
                        {item.description}
                      </p>
                    )}
                  </td>

                  {/* Column 2: Type (Blue for Quiz, Green for Assignment) */}
                  <td className="whitespace-nowrap px-3.5 py-3.5">
                    {isQuiz ? (
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200/70">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                        Quiz
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/70">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                        Assignment
                      </span>
                    )}
                  </td>

                  {/* Column 3: Course - wrapped to prevent overlapping with Due Date */}
                  <td className="px-3.5 py-3.5 min-w-[160px] max-w-[260px]">
                    <span
                      className="block whitespace-normal break-words text-xs font-medium leading-relaxed text-slate-600"
                      title={item.courseName}
                    >
                      {item.courseName}
                    </span>
                  </td>

                  {/* Column 4: Due Date */}
                  <td className="whitespace-nowrap px-3.5 py-3.5 text-xs text-slate-600 font-medium min-w-[140px]">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 size={13} className="shrink-0 text-slate-400" />
                      <span>{dateLabel(item.dueAt)}</span>
                    </span>
                  </td>

                  {/* Column 5: Status */}
                  <td className="whitespace-nowrap py-3.5 pl-3.5 pr-4 text-right sm:pr-6">
                    {statusBadge}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatTaskSummary(activeCount: number, pastCount: number) {
  const parts: string[] = [];
  if (activeCount > 0) {
    parts.push(`${activeCount} ${activeCount === 1 ? 'active task' : 'active tasks'}`);
  }
  if (pastCount > 0) {
    parts.push(`${pastCount} ${pastCount === 1 ? 'past due task' : 'past due tasks'}`);
  }
  return parts.join(' · ');
}

export function TabularActivityList({
  items,
  now = Date.now() / 1000,
}: TabularActivityListProps) {
  const datedItems = items.filter((item) => item.dueAt != null);
  const undatedItems = items.filter((item) => item.dueAt == null);

  // Group dated activities by month (YYYY-MM), separating active and past due
  const monthGroups = datedItems.reduce<
    Record<string, { active: Activity[]; past: Activity[] }>
  >((acc, item) => {
    const mKey = monthKey(item.dueAt!);
    if (!acc[mKey]) {
      acc[mKey] = { active: [], past: [] };
    }
    if (status(item, now) === 'upcoming') {
      acc[mKey].active.push(item);
    } else {
      acc[mKey].past.push(item);
    }
    return acc;
  }, {});

  // Sort months newest-first
  const sortedMonthKeys = Object.keys(monthGroups).sort((a, b) => b.localeCompare(a));
  for (const mKey of sortedMonthKeys) {
    monthGroups[mKey].active.sort(compareNewestFirst);
    monthGroups[mKey].past.sort(compareNewestFirst);
  }

  // Track whether the "Past due" section divider has been rendered
  let pastDueDividerRendered = false;

  return (
    <div className="flex flex-col gap-8">
      {sortedMonthKeys.map((mKey) => {
        const { active, past } = monthGroups[mKey];
        const monthTitle = formatMonthHeading(mKey);
        const summaryLabel = formatTaskSummary(active.length, past.length);

        // Determine if the divider should appear BEFORE this month's header
        // (happens when this month has ONLY past due items and divider hasn't rendered yet)
        const showDividerBeforeMonth =
          active.length === 0 && past.length > 0 && !pastDueDividerRendered;
        if (showDividerBeforeMonth) {
          pastDueDividerRendered = true;
        }

        // Determine if the divider should appear INSIDE this month
        // (happens when this month has active items followed by past due items)
        const showDividerInsideMonth =
          active.length > 0 && past.length > 0 && !pastDueDividerRendered;
        if (showDividerInsideMonth) {
          pastDueDividerRendered = true;
        }

        return (
          <div key={mKey} className="flex flex-col gap-4">
            {showDividerBeforeMonth && <SectionDivider label="Past due" />}

            {/* Single Month Header */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-teal-700" />
                <h3 className="text-base font-bold tracking-tight text-slate-900 md:text-lg">
                  {monthTitle}
                </h3>
              </div>
              {summaryLabel && (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                  {summaryLabel}
                </span>
              )}
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* 1. Active tasks for this month */}
            {active.length > 0 && renderTable(active, now)}

            {/* Divider between active and past due tasks within this same month */}
            {showDividerInsideMonth && <SectionDivider label="Past due" />}

            {/* 2. Past due tasks for this month */}
            {past.length > 0 && renderTable(past, now)}
          </div>
        );
      })}

      {/* 3. No date activities at the bottom */}
      {undatedItems.length > 0 && (
        <div className="flex flex-col gap-6">
          <SectionDivider label="No date" />
          {renderTable([...undatedItems].sort(compareNewestFirst), now)}
        </div>
      )}
    </div>
  );
}
