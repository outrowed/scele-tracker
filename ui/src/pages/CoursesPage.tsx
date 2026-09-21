import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Layers3,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  Timer,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MessageBox } from '../components/MessageBox';
import { Container } from '../components/Container';
import { Button } from '../components/Button';
import { PageHeader } from '../components/Typography';
import { useDismissible } from '../hooks/useDismissible';
import { api, dateLabel, remaining, status, type Snapshot } from '../model';
import { deadlineTimeState } from '../planner';
import styles from './DashboardPage.module.css';

export default function CoursesPage() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('upcoming');
  const [kind, setKind] = useState('all');
  const [query, setQuery] = useState('');
  const [course, setCourse] = useState('all');
  const [now, setNow] = useState(Date.now() / 1000);

  const [sloganDismissed, dismissSlogan] = useDismissible('courses_slogan');
  const [guideDismissed, dismissGuide] = useDismissible('courses_guide');

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
    async function poll() {
      if (document.visibilityState !== 'visible' || inFlight) return;
      inFlight = true;
      try {
        const snapshot = await api<Snapshot>('/api/activities');
        if (active) {
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
    const timer = setInterval(poll, 60_000);
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
        (filter === 'all' || status(item, now) === filter) &&
        (kind === 'all' || item.kind === kind) &&
        (course === 'all' || String(item.courseId) === course) &&
        `${item.name} ${item.courseName}`.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      filter === 'past'
        ? (b.dueAt || 0) - (a.dueAt || 0)
        : (a.dueAt || Infinity) - (b.dueAt || Infinity),
    );

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
        aria-label="Notices and guides"
      >
        {error && (
          <MessageBox
            role="alert"
            variant="error"
            icon={AlertCircle}
            title="Connection issue"
          >
            {error}
          </MessageBox>
        )}

        {(data?.incomplete || data?.stale) && (
          <MessageBox
            role="alert"
            variant="warning"
            icon={AlertCircle}
            title="Source synchronization warning"
          >
            Some course information is temporarily unavailable or stale. Please check
            SCeLE directly for the latest updates.
          </MessageBox>
        )}

        {data?.preparing && (
          <MessageBox
            variant="info"
            icon={Loader2}
            iconClassName="animate-spin"
            title="Preparing course data"
          >
            Synchronizing latest course data from SCeLE. This view will update
            automatically.
          </MessageBox>
        )}

        {!sloganDismissed && (
          <MessageBox
            variant="info"
            icon={Sparkles}
            title="Course activity overview"
            onDismiss={dismissSlogan}
            dismissLabel="Dismiss slogan"
          >
            An organized overview of all enrolled course tasks, assignments, and quizzes.
          </MessageBox>
        )}

        {!guideDismissed && (
          <MessageBox
            variant="info"
            icon={Layers3}
            title="Course verification reminder"
            onDismiss={dismissGuide}
            dismissLabel="Dismiss guide"
          >
            Always check quiz submissions and assignment uploads directly on SCeLE.
          </MessageBox>
        )}
      </div>

      {/* Activity summary on top */}
      <section
        className="my-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5"
        aria-label="Course activity summary"
      >
        {[
          { icon: Clock3, title: 'Upcoming', count: counts.upcoming, tab: 'upcoming' },
          { icon: Timer, title: 'Past due', count: counts.past, tab: 'past' },
          { icon: BookOpen, title: 'Courses', count: courses.length, tab: 'all' },
          {
            icon: CalendarDays,
            title: 'Without dates',
            count: counts.undated,
            tab: 'undated',
          },
        ].map(({ icon: Icon, title, count, tab }) => {
          const isSelected = filter === tab;
          return (
            <button
              key={title}
              className={`rounded-xl border p-5 text-left transition ${
                isSelected
                  ? 'border-teal-500 bg-teal-50/40 ring-2 ring-teal-600/20 shadow-2xs'
                  : 'border-slate-200 bg-white hover:border-teal-400'
              }`}
              onClick={() => setFilter(tab)}
            >
              <span className="flex items-center justify-between text-sm text-slate-500">
                <span>{title}</span>
                <Icon size={18} className={isSelected ? 'text-teal-700' : ''} />
              </span>
              <span
                className={`mt-4 block text-3xl font-semibold tracking-tight ${
                  isSelected ? 'text-teal-950 font-bold' : 'text-slate-900'
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
          <select
            aria-label="Activity type"
            value={kind}
            onChange={(event) => setKind(event.target.value)}
          >
            <option value="all">All types</option>
            <option value="assignment">Assignments</option>
            <option value="quiz">Quizzes</option>
          </select>
          <select
            aria-label="Course"
            value={course}
            onChange={(event) => setCourse(event.target.value)}
          >
            <option value="all">All courses</option>
            {courses.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Activities grouped by course */}
        <div className="flex flex-col gap-6" aria-live="polite">
          {busy && !data ? (
            <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-14 text-center text-slate-500">
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
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs"
                >
                  {/* Course Group Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/75 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl border border-teal-200/80 bg-teal-50 p-2 text-teal-700 shadow-2xs">
                        <BookOpen size={18} />
                      </div>
                      <h3 className="font-bold text-base sm:text-lg text-slate-900 tracking-tight">
                        {courseName}
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {quizzesCount > 0 && (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200/60">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                          {quizzesCount} {quizzesCount === 1 ? 'quiz' : 'quizzes'}
                        </span>
                      )}
                      {assignmentsCount > 0 && (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/60">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                          {assignmentsCount}{' '}
                          {assignmentsCount === 1 ? 'assignment' : 'assignments'}
                        </span>
                      )}
                      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-600 shadow-2xs">
                        {activities.length} total
                      </span>
                    </div>
                  </div>

                  {/* Course Activities Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/50 text-xs uppercase tracking-wider text-slate-500 font-semibold">
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
                      <tbody className="divide-y divide-slate-100">
                        {activities.map((item) => {
                          const timeState = deadlineTimeState(item, now);
                          const isQuiz = item.kind === 'quiz';

                          let statusBadge = (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                              Undated
                            </span>
                          );

                          if (timeState === 'today') {
                            statusBadge = (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 animate-pulse border border-amber-200">
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

                          const rowBg =
                            timeState === 'today'
                              ? 'bg-amber-50/30 hover:bg-amber-50/60'
                              : 'hover:bg-slate-50/75';

                          return (
                            <tr key={item.id} className={`transition ${rowBg}`}>
                              <td className="py-3.5 pl-4 pr-3 sm:pl-6 max-w-md">
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
                              <td className="whitespace-nowrap px-3.5 py-3.5 text-xs text-slate-600 font-medium min-w-[140px]">
                                <span className="inline-flex items-center gap-1.5">
                                  <Clock3 size={13} className="shrink-0 text-slate-400" />
                                  <span>{dateLabel(item.dueAt)}</span>
                                </span>
                              </td>
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
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-14 text-center text-slate-500">
              <div className="mx-auto mb-4 w-fit rounded-full bg-teal-50 p-4 text-teal-700">
                <ClipboardList size={26} />
              </div>
              <h3 className="font-semibold text-slate-800">
                {error ? 'Feed unavailable' : 'No activities in this view'}
              </h3>
              <p className="mt-2 text-sm">
                {error
                  ? 'Try refreshing when the connection is available.'
                  : 'Try another filter or check back later.'}
              </p>
            </div>
          )}
        </div>
      </section>
    </Container>
  );
}
