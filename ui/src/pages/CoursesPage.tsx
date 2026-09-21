import { useEffect, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  ClipboardList,
  Layers3,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  Timer,
  Clock3,
  CalendarDays,
} from 'lucide-react';
import { ActivityCard } from '../components/ActivityCard';
import { MessageBox } from '../components/MessageBox';
import { Container } from '../components/Container';
import { Button } from '../components/Button';
import { PageHeader, SectionTitle } from '../components/Typography';
import { useDismissible } from '../hooks/useDismissible';
import { api, status, type Snapshot } from '../model';
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
  ];

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
        ].map(({ icon: Icon, title, count, tab }) => (
          <button
            key={title}
            className="rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:border-teal-400"
            onClick={() => setFilter(tab)}
          >
            <span className="flex items-center justify-between text-sm text-slate-500">
              {title}
              <Icon size={18} />
            </span>
            <span className="mt-4 block text-3xl font-semibold tracking-tight">
              {busy && !data ? '—' : count}
            </span>
          </button>
        ))}
      </section>

      <section className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle>All Course Activities</SectionTitle>
          <span className="text-xs text-slate-500">{visible.length} activities</span>
        </div>
        <div className={styles.filterTabs} aria-label="Deadline filter">
          {[
            ['upcoming', 'Upcoming'],
            ['past', 'Past due'],
            ['undated', 'No date'],
            ['all', 'All'],
          ].map(([value, label]) => (
            <button
              key={value}
              aria-pressed={filter === value}
              className={filter === value ? styles.filterSelected : ''}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
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
        <div className="flex flex-col gap-3" aria-live="polite">
          {busy && !data ? (
            <div className="rounded-xl border border-dashed border-slate-300 px-6 py-14 text-center text-slate-500">
              Loading your activities…
            </div>
          ) : visible.length ? (
            visible.map((item) => <ActivityCard item={item} key={item.id} />)
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 px-6 py-14 text-center text-slate-500">
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
