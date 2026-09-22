import { useEffect, useState } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, dateLabel, type Activity } from '../model';
import { dayKey, monthDays, shiftMonth } from '../calendar';
import { weekRanges } from '../planner';
import { Container } from '../components/Container';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { DataStatusNotice } from '../components/DataStatusNotice';
import styles from './DashboardPage.module.css';
import { PageHeader, SectionDescription, SectionTitle } from '../components/Typography';

export default function CalendarPage() {
  const [snapshot, setSnapshot] = useState<{
    activities: Activity[];
    incomplete?: boolean;
    stale?: boolean;
    preparing?: boolean;
  } | null>(null);
  const [error, setError] = useState('');
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [course, setCourse] = useState('all');
  const [selected, setSelected] = useState<Activity | null>(null);

  useEffect(() => {
    let active = true;
    api<{
      activities: Activity[];
      incomplete?: boolean;
      stale?: boolean;
      preparing?: boolean;
    }>('/api/activities')
      .then((data) => {
        if (active) setSnapshot(data);
      })
      .catch((err) => {
        if (active) setError((err as Error).message);
      });
    return () => {
      active = false;
    };
  }, []);

  const activities = snapshot?.activities || [];
  const today = dayKey(Date.now() / 1000);
  const filtered = activities.filter(
    (item) => course === 'all' || String(item.courseId) === course,
  );
  const courses = [
    ...new Map(activities.map((item) => [item.courseId, item.courseName])).entries(),
  ];
  const title = new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${month}-01T00:00:00Z`));

  // Break month into 7-day week chunks
  const allDays = monthDays(month);
  const weeks: string[][] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }

  return (
    <Container as="main" className="py-10 md:py-14">
      <PageHeader
        title="Course calendar"
        description="Track deadlines, view activity schedules, and plan coursework across the month."
      />

      <div
        className={`${styles.noticeStack} flex flex-col gap-3`}
        aria-label="Notices and guides"
      >
        <DataStatusNotice
          error={error}
          loading={
            !snapshot ||
            Boolean(snapshot.incomplete || snapshot.stale || snapshot.preparing)
          }
        />
      </div>

      {/* Navigation and course filters */}
      <div className="my-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button
            aria-label="Previous month"
            onClick={() => {
              setMonth(shiftMonth(month, -1));
              setSelected(null);
            }}
          >
            <ChevronLeft size={16} />
          </Button>
          <h2
            className="text-lg sm:text-xl font-bold tracking-tight text-slate-900"
            aria-live="polite"
          >
            {title}
          </h2>
          <Button
            aria-label="Next month"
            onClick={() => {
              setMonth(shiftMonth(month, 1));
              setSelected(null);
            }}
          >
            <ChevronRight size={16} />
          </Button>
          <Button
            onClick={() => {
              setMonth(today.slice(0, 7));
              setSelected(null);
            }}
          >
            Today
          </Button>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <span>Course</span>
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-normal text-slate-800 shadow-xs focus:border-teal-500 focus:outline-hidden"
            value={course}
            onChange={(event) => {
              setCourse(event.target.value);
              setSelected(null);
            }}
          >
            <option value="all">All courses</option>
            {courses.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!snapshot && !error ? (
        <SectionDescription role="status">Loading calendar…</SectionDescription>
      ) : (
        snapshot && (
          <>
            {/* Selected activity details on top of the calendar */}
            {selected && (
              <Card
                role="region"
                aria-label="Selected activity"
                className="mb-6 shadow-xs"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold ${
                          selected.kind === 'quiz'
                            ? 'border border-blue-200/80 bg-blue-50 text-blue-700'
                            : 'border border-emerald-200/80 bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            selected.kind === 'quiz' ? 'bg-blue-600' : 'bg-emerald-600'
                          }`}
                        />
                        {selected.kind === 'quiz' ? 'Quiz' : 'Assignment'}
                      </span>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {selected.courseName}
                      </p>
                    </div>
                    <SectionTitle className="mt-1.5">{selected.name}</SectionTitle>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/activities/${encodeURIComponent(selected.id)}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-800 hover:underline"
                    >
                      <span>View activity details</span>
                      <ArrowUpRight size={14} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setSelected(null)}
                      aria-label="Close selection"
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
                {selected.description && (
                  <div className="mt-3 whitespace-pre-wrap break-words leading-relaxed text-sm text-slate-600">
                    {selected.description}
                  </div>
                )}
                <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    ['Opens', selected.opensAt],
                    [selected.kind === 'quiz' ? 'Closes' : 'Due', selected.dueAt],
                    ['Cut-off', selected.cutoffAt],
                  ].map(([label, ts]) => (
                    <div
                      key={label}
                      className="rounded-lg border border-slate-100 bg-slate-50/75 p-3"
                    >
                      <dt className="text-xs font-medium text-slate-500">{label}</dt>
                      <dd className="mt-0.5 text-sm font-semibold text-slate-800">
                        {ts ? dateLabel(ts as number) : 'Not set'}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Card>
            )}

            {/* Legend and range explanation */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                  <span className="font-medium text-slate-700">Quiz</span> (Blue)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                  <span className="font-medium text-slate-700">Assignment</span> (Green)
                </span>
              </div>
              <p>
                Bars span opening to closing/due date, inclusive. Select any activity for
                details.
              </p>
            </div>

            {/* Monthly range-bar calendar */}
            <div
              className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs"
              role="region"
              aria-label="Monthly calendar"
              tabIndex={0}
            >
              <div className="min-w-[800px]">
                {/* Weekday headers: Mon - Sun */}
                <div className="grid grid-cols-7 divide-x divide-slate-200 border-b border-slate-200 bg-slate-50/75">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName) => (
                    <div
                      key={dayName}
                      className="py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500"
                    >
                      {dayName}
                    </div>
                  ))}
                </div>

                {/* Weeks */}
                <div className="divide-y divide-slate-200">
                  {weeks.map((week, weekIdx) => {
                    const weekDays = week.map((d) => ({ dateKey: d }));
                    const ranges = weekRanges(filtered, weekDays);
                    const lanes = Math.max(4, ...ranges.map((r) => r.lane + 1));

                    return (
                      <div key={week[0]} className="flex flex-col">
                        {/* Top row: Day numbers across the 7 days */}
                        <div className="grid grid-cols-7 divide-x divide-slate-200 border-b border-slate-100 bg-slate-50/40">
                          {week.map((day) => {
                            const isCurrentMonth = day.startsWith(month);
                            const isToday = day === today;
                            return (
                              <div
                                key={day}
                                className={`relative flex items-center justify-between px-2.5 py-1.5 text-xs transition ${
                                  isToday
                                    ? 'bg-teal-50/80 font-medium'
                                    : isCurrentMonth
                                      ? 'bg-white'
                                      : 'bg-slate-50/60'
                                }`}
                              >
                                {/* Top accent bar for today */}
                                {isToday && (
                                  <span
                                    aria-hidden="true"
                                    className="absolute inset-x-0 top-0 h-1 bg-teal-600"
                                  />
                                )}
                                <span
                                  className={`font-semibold ${
                                    isToday
                                      ? 'text-teal-900'
                                      : isCurrentMonth
                                        ? 'text-slate-700'
                                        : 'text-slate-400'
                                  }`}
                                >
                                  {isToday ? 'Today' : ''}
                                </span>
                                <span
                                  className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
                                    isToday
                                      ? 'bg-teal-700 text-white shadow-2xs'
                                      : isCurrentMonth
                                        ? 'text-slate-700'
                                        : 'text-slate-400'
                                  }`}
                                >
                                  {Number(day.slice(-2))}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Bottom area: Activity range bars with vertical column guides and centered TODAY watermark */}
                        <div className="relative min-h-[142px]">
                          {/* Background vertical day lines and TODAY watermark */}
                          <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 grid grid-cols-7 divide-x divide-slate-200 select-none"
                          >
                            {week.map((day) => {
                              const isToday = day === today;
                              const isCurrentMonth = day.startsWith(month);
                              return (
                                <div
                                  key={day}
                                  className={`flex items-center justify-center ${
                                    isToday
                                      ? 'bg-teal-50/40'
                                      : isCurrentMonth
                                        ? 'bg-white'
                                        : 'bg-slate-50/40'
                                  }`}
                                >
                                  {isToday && (
                                    <span className="text-xs font-bold tracking-widest text-teal-800/20 uppercase select-none">
                                      TODAY
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Range bars grid */}
                          <div
                            className="relative grid grid-cols-7 gap-y-1.5 p-1.5"
                            style={{ gridTemplateRows: `repeat(${lanes}, 28px)` }}
                          >
                            {ranges.map(
                              ({
                                item,
                                start,
                                end,
                                lane,
                                continuesBefore,
                                continuesAfter,
                              }) => {
                                const isSelected = selected?.id === item.id;
                                const isQuiz = item.kind === 'quiz';
                                const label = `${item.name} · ${item.courseName} · Opens: ${dateLabel(item.opensAt)} · Closes/due: ${dateLabel(item.dueAt)}`;
                                const className = `mx-1 flex min-w-0 items-center gap-1.5 rounded-md border px-2 text-left text-xs font-medium transition cursor-pointer ${
                                  isQuiz
                                    ? 'border-blue-300 bg-blue-100 text-blue-900 hover:bg-blue-200'
                                    : 'border-emerald-300 bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                                } ${
                                  isSelected
                                    ? 'ring-2 ring-teal-700 ring-offset-1 font-bold shadow-xs'
                                    : ''
                                }`;
                                const style = {
                                  gridColumn: `${start + 1} / ${end + 2}`,
                                  gridRow: lane + 1,
                                };
                                return (
                                  <button
                                    key={`${item.id}-${weekIdx}-${start}`}
                                    type="button"
                                    title={label}
                                    aria-label={label}
                                    aria-pressed={isSelected}
                                    className={className}
                                    style={style}
                                    onClick={() => setSelected(isSelected ? null : item)}
                                  >
                                    {continuesBefore && (
                                      <span
                                        aria-hidden="true"
                                        className="shrink-0 font-bold"
                                      >
                                        ←
                                      </span>
                                    )}
                                    <span className="truncate">{item.name}</span>
                                    <span className="hidden xl:inline text-[10px] opacity-75 truncate">
                                      · {item.courseName}
                                    </span>
                                    {continuesAfter && (
                                      <span
                                        aria-hidden="true"
                                        className="ml-auto shrink-0 font-bold"
                                      >
                                        →
                                      </span>
                                    )}
                                  </button>
                                );
                              },
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {filtered.length === 0 && (
              <SectionDescription className="mt-4">
                No activities available for this course selection.
              </SectionDescription>
            )}
          </>
        )
      )}
    </Container>
  );
}
