import { useEffect, useState } from 'react';
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  Clock3,
  Layers3,
  RefreshCw,
  Search,
  Timer,
} from 'lucide-react';
import { ActivityCard } from '../components/ActivityCard';
import { api, status, type Snapshot } from '../model';

export default function DashboardPage() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('upcoming');
  const [kind, setKind] = useState('all');
  const [query, setQuery] = useState('');
  const [course, setCourse] = useState('all');
  const [now, setNow] = useState(Date.now() / 1000);

  // Fetch the shared snapshot (which may trigger server sync) and update this page’s feed.
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
    <main className="page-width py-10 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <span className="section-kicker">YOUR ACADEMIC RADAR</span>
          <h1 className="page-title">Keep your next deadline in sight.</h1>
          <p className="mt-3 text-slate-500">
            A shared overview of assignments and quizzes. Less tab-hopping, more breathing
            room.
          </p>
        </div>
        <button className="secondary-button" onClick={refresh} disabled={busy}>
          <RefreshCw size={16} className={busy ? 'animate-spin' : ''} />
          {busy ? 'Syncing…' : 'Refresh'}
        </button>
      </div>
      <section className="stats-grid" aria-label="Activity summary">
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
            <button key={title} className="stat-card" onClick={() => setFilter(tab)}>
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
      {error && (
        <p role="alert" className="notice mb-6">
          {error}
        </p>
      )}
      {(data?.incomplete || data?.stale) && (
        <p role="alert" className="notice mb-6">
          Some course information is temporarily unavailable. Please check SCeLE for the
          latest details.
        </p>
      )}
      {data?.preparing && (
        <p className="notice mb-6">
          Preparing course data. This page will update automatically.
        </p>
      )}
      <div className="dashboard-grid">
        <section className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Your activity feed</h2>
            <span className="text-xs text-slate-500">{visible.length} activities</span>
          </div>
          <div className="filter-tabs" aria-label="Deadline filter">
            {[
              ['upcoming', 'Upcoming'],
              ['past', 'Past due'],
              ['undated', 'No date'],
              ['all', 'All'],
            ].map(([value, label]) => (
              <button
                key={value}
                aria-pressed={filter === value}
                className={filter === value ? 'selected' : ''}
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="search-row">
            <label className="search-box">
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
              <div className="empty-state">Loading your activities…</div>
            ) : visible.length ? (
              visible.map((item) => <ActivityCard item={item} key={item.id} />)
            ) : (
              <div className="empty-state">
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
        <aside className="space-y-5">
          <section className="side-card bg-teal-950! text-white">
            <Layers3 size={23} className="text-teal-300" />
            <h2 className="mt-4 font-semibold">A planner, not a gradebook.</h2>
            <p className="mt-3 text-sm leading-6 text-teal-100/80">
              “Past due” means the date has passed. It does not tell you whether you
              submitted. Always confirm details in SCeLE.
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}
