import {
  ActivityFilters,
  emptyFilters,
  matchesFilters,
} from '../components/ActivityFilters';
import { DataStatusNotice } from '../components/DataStatusNotice';
import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Clock3,
  RefreshCw,
  Search,
  Timer,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Container } from '../components/Container';
import { Button } from '../components/Button';
import { PageHeader } from '../components/Typography';
import { api, dateLabel, scheduleAt, status, type Snapshot } from '../model';
import { deadlineTimeState } from '../planner';
import { ActivityStatus } from '../components/ActivityStatus';
import styles from './DashboardPage.module.css';

export default function CoursesPage() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [filters, setFilters] = useState(emptyFilters);
  const [query, setQuery] = useState('');

  const [now, setNow] = useState(Date.now() / 1000);

  async function refresh() {
    setBusy(true);
    setError('');
    try {
      setData(await api<Snapshot>('/api/activities'));
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    let active = true;
    let inFlight = false;
    let preparing = true;
    async function poll() {
      if (document.visibilityState !== 'visible' || inFlight) return;
      inFlight = true;
      try {
        const snapshot = await api<Snapshot>('/api/activities');
        if (active) {
          preparing = Boolean(snapshot.preparing);
          setData(snapshot);
          setError('');
          setNow(Date.now() / 1000);
        }
      } catch (error) {
        if (active) setError((error as Error).message);
      } finally {
        inFlight = false;
      }
    }
    void poll();
    const timer = setInterval(() => {
      if (preparing) void poll();
    }, 5_000);
    document.addEventListener('visibilitychange', poll);
    return () => {
      active = false;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', poll);
    };
  }, []);

  const items = data?.activities || [];
  const counts = {
    upcoming: items.filter((item) => status(item, now) === 'upcoming').length,
    past: items.filter((item) => status(item, now) === 'past').length,
    undated: items.filter((item) => status(item, now) === 'undated').length,
  };

  const courses = [
    ...new Map(items.map((item) => [item.courseId, item.courseName])).entries(),
  ].sort((a, b) => a[1].localeCompare(b[1]));

  const visible = items
    .filter(
      (item) =>
        matchesFilters(item, filters, now) &&
        `${item.name} ${item.courseName}`.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) => (scheduleAt(a) ?? Infinity) - (scheduleAt(b) ?? Infinity));

  const groupedCourses = courses
    .map(([courseId, courseName]) => ({
      courseId,
      courseName,
      activities: visible.filter((item) => item.courseId === courseId),
    }))
    .filter((group) => group.activities.length > 0);

  return (
    <Container as="main" className="py-10 md:py-14">
      <PageHeader
        title="Courses"
        description="View and browse all enrolled courses, assignments, and quizzes."
        action={
          <Button
            variant="secondary"
            className="shrink-0"
            onClick={refresh}
            disabled={busy}
          >
            <RefreshCw size={16} className={busy ? 'animate-spin' : ''} />
            {busy ? 'Syncing…' : 'Refresh'}
          </Button>
        }
      />

      <div
        className={`${styles.noticeStack} flex flex-col gap-3`}
        aria-label="Data status"
      >
        <DataStatusNotice
          error={error}
          loading={!data || Boolean(data.incomplete || data.stale || data.preparing)}
        />
      </div>

      {/* Activity summary on top */}
      <section
        className="my-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5"
        aria-label="Course activity summary"
      >
        {[
          { icon: Clock3, title: 'Upcoming', count: counts.upcoming, tab: 'upcoming' },
          { icon: Timer, title: 'Deadlines passed', count: counts.past, tab: 'past' },
          { icon: BookOpen, title: 'Courses', count: courses.length, tab: 'all' },
          {
            icon: CalendarDays,
            title: 'Without dates',
            count: counts.undated,
            tab: 'undated',
          },
        ].map(({ icon: Icon, title, count, tab }) => {
          const isSelected = tab !== 'all' && filters.deadline.includes(tab);
          return (
            <button
              key={title}
              className={`rounded-xl border p-5 text-left transition ${
                isSelected
                  ? 'border-teal-500 dark:border-teal-500 bg-teal-50/40 dark:bg-teal-950/40 ring-2 ring-teal-600/20 shadow-2xs'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-teal-400 dark:hover:border-teal-600'
              }`}
              aria-pressed={isSelected}
              onClick={() =>
                setFilters({
                  ...filters,
                  deadline:
                    tab === 'all'
                      ? []
                      : isSelected
                        ? filters.deadline.filter((value) => value !== tab)
                        : [...filters.deadline, tab],
                })
              }
            >
              <span className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                <span>{title}</span>
                <Icon
                  size={18}
                  className={isSelected ? 'text-teal-700 dark:text-teal-300' : ''}
                />
              </span>
              <span
                className={`mt-4 block text-3xl font-semibold tracking-tight ${
                  isSelected
                    ? 'text-teal-950 dark:text-teal-100 font-bold'
                    : 'text-slate-900 dark:text-slate-100'
                }`}
              >
                {busy && !data ? '—' : count}
              </span>
            </button>
          );
        })}
      </section>

      {/* Grouped courses and filter controls */}
      <section className="min-w-0">
        {/* Search and kind/course filters */}
        <div className={styles.searchRow}>
          <label className={styles.searchBox}>
            <Search size={17} />
            <input
              aria-label="Search activities"
              placeholder="Search activities or courses…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>

        <ActivityFilters items={items} value={filters} onChange={setFilters} />

        {/* Activities grouped by course */}
        <div className="flex flex-col gap-6" aria-live="polite">
          {busy && !data ? (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 px-6 py-14 text-center text-slate-500 dark:text-slate-400">
              Loading your course activities…
            </div>
          ) : groupedCourses.length ? (
            groupedCourses.map(({ courseId, courseName, activities }) => {
              const quizzesCount = activities.filter((a) => a.kind === 'quiz').length;
              const assignmentsCount = activities.filter(
                (a) => a.kind === 'assignment',
              ).length;

              return (
                <div
                  key={courseId}
                  className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs"
                >
                  {/* Course Group Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-600 bg-slate-50/75 dark:bg-slate-700 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl border border-teal-200/80 dark:border-teal-800/80 bg-teal-50 dark:bg-teal-950 p-2 text-teal-700 dark:text-teal-300 shadow-2xs">
                        <BookOpen size={18} />
                      </div>
                      <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100 tracking-tight">
                        {courseName}
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {quizzesCount > 0 && (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 dark:bg-blue-950 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                          {quizzesCount} {quizzesCount === 1 ? 'quiz' : 'quizzes'}
                        </span>
                      )}
                      {assignmentsCount > 0 && (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                          {assignmentsCount}{' '}
                          {assignmentsCount === 1 ? 'assignment' : 'assignments'}
                        </span>
                      )}
                      <span className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300 shadow-2xs">
                        {activities.length} total
                      </span>
                    </div>
                  </div>

                  {/* Course Activities Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                          <th
                            scope="col"
                            className="py-3.5 pl-4 pr-3 sm:pl-6 min-w-[200px]"
                          >
                            Activity Name
                          </th>
                          <th scope="col" className="whitespace-nowrap px-3.5 py-3.5">
                            Type
                          </th>
                          <th
                            scope="col"
                            className="whitespace-nowrap px-3.5 py-3.5 min-w-[140px]"
                          >
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
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {activities.map((item) => {
                          const timeState = deadlineTimeState(item, now);
                          const isQuiz = item.kind === 'quiz';

                          const rowBg =
                            timeState === 'today'
                              ? 'bg-amber-50/30 dark:bg-amber-950/30 hover:bg-amber-50/60 dark:hover:bg-amber-950/60'
                              : 'hover:bg-slate-50/75 dark:hover:bg-slate-800/75';

                          return (
                            <tr key={item.id} className={`transition ${rowBg}`}>
                              <td className="py-3.5 pl-4 pr-3 sm:pl-6 max-w-md">
                                <div className="flex items-start gap-2">
                                  <Link
                                    to={`/activities/${item.id}`}
                                    className="font-semibold text-slate-800 dark:text-slate-100 transition hover:text-teal-700 dark:hover:text-teal-300 inline-flex items-center gap-1 group"
                                  >
                                    <span className="line-clamp-2">{item.name}</span>
                                    <ArrowUpRight
                                      size={14}
                                      className="shrink-0 text-slate-400 dark:text-slate-400 group-hover:text-teal-700 transition"
                                    />
                                  </Link>
                                </div>
                                {item.description && (
                                  <p className="mt-0.5 line-clamp-1 text-xs text-slate-400 dark:text-slate-400">
                                    {item.description}
                                  </p>
                                )}
                              </td>
                              <td className="whitespace-nowrap px-3.5 py-3.5">
                                {isQuiz ? (
                                  <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 dark:bg-blue-950 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/70">
                                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                                    Quiz
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/70">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                                    Assignment
                                  </span>
                                )}
                              </td>
                              <td className="whitespace-nowrap px-3.5 py-3.5 text-xs text-slate-600 dark:text-slate-300 font-medium min-w-[140px]">
                                <span className="inline-flex items-center gap-1.5">
                                  <Clock3
                                    size={13}
                                    className="shrink-0 text-slate-400 dark:text-slate-400"
                                  />
                                  <span>{dateLabel(scheduleAt(item))}</span>
                                </span>
                              </td>
                              <td className="whitespace-nowrap py-3.5 pl-3.5 pr-4 text-right sm:pr-6">
                                <ActivityStatus item={item} now={now} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 px-6 py-14 text-center text-slate-500 dark:text-slate-400">
              <div className="mx-auto mb-4 w-fit rounded-full bg-teal-50 dark:bg-teal-950 p-4 text-teal-700 dark:text-teal-300">
                <ClipboardList size={26} />
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                {error
                  ? 'Feed unavailable'
                  : data?.preparing
                    ? 'Still loading activities'
                    : 'No activities in this view'}
              </h3>
              <p className="mt-2 text-sm">
                {error
                  ? 'Try refreshing when the connection is available.'
                  : data?.preparing
                    ? 'SCELE is still returning your course dates and activities.'
                    : 'Try another filter or check back later.'}
              </p>
            </div>
          )}
        </div>
      </section>
    </Container>
  );
}
