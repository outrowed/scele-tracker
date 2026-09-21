import { ArrowUpRight, Calendar, CheckCircle2, Clock3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { dateLabel, remaining, type Activity } from '../model';
import { deadlineTimeState, formatMonthHeading, monthKey } from '../planner';

interface TabularActivityListProps {
  items: Activity[];
  now?: number;
}

export function TabularActivityList({
  items,
  now = Date.now() / 1000,
}: TabularActivityListProps) {
  // Group activities by month (YYYY-MM)
  const grouped = items.reduce<Record<string, Activity[]>>((acc, item) => {
    const key = item.dueAt ? monthKey(item.dueAt) : 'undated';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  // Sort months chronologically, putting 'undated' at the very end
  const sortedMonthKeys = Object.keys(grouped).sort((a, b) => {
    if (a === 'undated') return 1;
    if (b === 'undated') return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="flex flex-col gap-8">
      {sortedMonthKeys.map((mKey) => {
        const monthItems = grouped[mKey];
        const monthTitle = formatMonthHeading(mKey);

        return (
          <div key={mKey} className="flex flex-col gap-3">
            {/* Month Header separator line */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-teal-700" />
                <h3 className="text-base font-bold tracking-tight text-slate-900 md:text-lg">
                  {monthTitle}
                </h3>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                {monthItems.length} {monthItems.length === 1 ? 'task' : 'tasks'}
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Tabular layout */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                      <th scope="col" className="py-3.5 pl-4 pr-3 sm:pl-6">
                        Activity Name
                      </th>
                      <th scope="col" className="px-3 py-3.5">
                        Type
                      </th>
                      <th scope="col" className="px-3 py-3.5">
                        Course
                      </th>
                      <th scope="col" className="px-3 py-3.5">
                        Due Date
                      </th>
                      <th scope="col" className="py-3.5 pl-3 pr-4 sm:pr-6 text-right">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {monthItems.map((item) => {
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
                          <td className="py-3.5 pl-4 pr-3 sm:pl-6 max-w-xs md:max-w-md">
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
                          <td className="whitespace-nowrap px-3 py-3.5">
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

                          {/* Column 3: Course */}
                          <td className="px-3 py-3.5 max-w-[200px]">
                            <span
                              className="inline-block truncate text-xs font-medium text-slate-600"
                              title={item.courseName}
                            >
                              {item.courseName}
                            </span>
                          </td>

                          {/* Column 4: Due Date */}
                          <td className="whitespace-nowrap px-3 py-3.5 text-xs text-slate-600 font-medium">
                            <span className="inline-flex items-center gap-1.5">
                              <Clock3 size={13} className="text-slate-400" />
                              {dateLabel(item.dueAt)}
                            </span>
                          </td>

                          {/* Column 5: Status */}
                          <td className="whitespace-nowrap py-3.5 pl-3 pr-4 text-right sm:pr-6">
                            {statusBadge}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
