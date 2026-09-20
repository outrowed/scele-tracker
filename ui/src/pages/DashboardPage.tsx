import { useEffect, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Clock3,
  Layers3,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  Timer,
} from 'lucide-react';
import { ActivityCard } from '../components/ActivityCard';
import { MessageBox } from '../components/MessageBox';
import { Container } from '../components/Container';
import { Button } from '../components/Button';
import { PageTitle } from '../components/Typography';
import { useDismissible } from '../hooks/useDismissible';
import { api, status, type Snapshot } from '../model';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('upcoming');
  const [kind, setKind] = useState('all');
  const [query, setQuery] = useState('');
  const [course, setCourse] = useState('all');
  const [now, setNow] = useState(Date.now() / 1000);

  const [sloganDismissed, dismissSlogan] = useDismissible('dashboard_slogan');
  const [guideDismissed, dismissGuide] = useDismissible('dashboard_guide');

  // Fetch the shared snapshot (which may trigger server sync) and update this page's feed.
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

  // Poll only while visible; remove the listener and timer when leaving the dashboard.
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

  // Multiple activity variants share a course; list each course only once in the filter.
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
    // Most recent missed deadlines first; upcoming deadlines ascending, undated last.
    .sort((a, b) =>
      filter === 'past'
        ? (b.dueAt || 0) - (a.dueAt || 0)
        : (a.dueAt || Infinity) - (b.dueAt || Infinity),
    );

  return (
    <Container as="main" className="py-10 md:py-14">
      {/* Header section with normal heading */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageTitle className="mt-0">Your activity feed</PageTitle>
        <Button
          variant="secondary"
          className="shrink-0"
          onClick={refresh}
          disabled={busy}
        >
          <RefreshCw size={16} className={busy ? 'animate-spin' : ''} />
          {busy ? 'Syncing…' : 'Refresh'}
        </Button>
      </div>

      {/* Consistent notification and guide message stack; zero spacing when empty via CSS :not(:has(*)) */}
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
            title="Keep your next deadline in sight."
            onDismiss={dismissSlogan}
            dismissLabel="Dismiss slogan"
          >
            A shared overview of assignments and quizzes. Less tab-hopping, more breathing
            room.
          </MessageBox>
        )}

        {!guideDismissed && (
          <MessageBox
            variant="info"
            icon={Layers3}
            title="A planner, not a gradebook."
            onDismiss={dismissGuide}
            dismissLabel="Dismiss guide"
          >
            "Past due" means the deadline has passed. It does not reflect personal
            submission status. Always verify quiz submissions and assignment uploads on
            SCeLE.
          </MessageBox>
        )}
      </div>

      {/* Quick stats grid */}
      <section
        className="my-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5"
        aria-label="Activity summary"
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
          return (
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
          );
        })}
      </section>

      {/* Main activities feed */}
      <section className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-800">Deadlines &amp; Tasks</h2>
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
