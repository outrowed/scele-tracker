import { DataStatusNotice } from '../components/DataStatusNotice';
import { useEffect, useState } from 'react';
import { ClipboardList, Layers3, RefreshCw, Search, Sparkles } from 'lucide-react';
import { MessageBox } from '../components/MessageBox';
import { Container } from '../components/Container';
import { Button } from '../components/Button';
import { PageHeader, SectionTitle } from '../components/Typography';
import { WeekBar } from '../components/WeekBar';
import { TabularActivityList } from '../components/TabularActivityList';
import { useDismissible } from '../hooks/useDismissible';
import { api, type Snapshot } from '../model';
import { activityRange, compareNewestFirst, getWeekDays } from '../planner';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [kind, setKind] = useState('all');
  const [query, setQuery] = useState('');
  const [course, setCourse] = useState('all');
  const [now, setNow] = useState(Date.now() / 1000);

  // Week planner state
  const [dayOffset, setDayOffset] = useState(0);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

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
  // Multiple activity variants share a course; list each course only once in the filter.
  const courses = [
    ...new Map(items.map((item) => [item.courseId, item.courseName])).entries(),
  ];

  // Week days with quizzes and assignments grouped
  const weekInfo = getWeekDays(now, dayOffset, items);

  const visible = items
    .filter(
      (item) =>
        // Kind filter
        (kind === 'all' || item.kind === kind) &&
        // Course filter
        (course === 'all' || String(item.courseId) === course) &&
        // Day selection from week bar filter
        (!selectedDayKey ||
          (() => {
            const range = activityRange(item);
            return range && range.start <= selectedDayKey && range.end >= selectedDayKey;
          })()) &&
        // Search query
        `${item.name} ${item.courseName}`.toLowerCase().includes(query.toLowerCase()),
    )
    // Sort items by newest first (newest deadlines first, quizzes prioritized on same deadline, undated last)
    .sort(compareNewestFirst);

  return (
    <Container as="main" className="py-10 md:py-14">
      {/* Unified page header */}
      <PageHeader
        title="Activity feed"
        description="Plan your quizzes, assignments, and deadlines with the weekly schedule and activity table."
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

      {/* Consistent notification and guide message stack */}
      <div
        className={`${styles.noticeStack} flex flex-col gap-3`}
        aria-label="Notices and guides"
      >
        <DataStatusNotice
          error={error}
          loading={!data || Boolean(data.incomplete || data.stale || data.preparing)}
        />

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

      {/* Top weekly schedule bar */}
      <section className="my-8" aria-label="Weekly planner">
        <WeekBar
          activities={items}
          days={weekInfo.days}
          weekLabel={weekInfo.weekLabel}
          dayOffset={dayOffset}
          selectedDayKey={selectedDayKey}
          onSelectDay={(key) => setSelectedDayKey(key)}
          onPrevDay={() => setDayOffset((prev) => prev - 1)}
          onNextDay={() => setDayOffset((prev) => prev + 1)}
          onToday={() => setDayOffset(0)}
        />
      </section>

      {/* Main activities section with table layout */}
      <section className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle>Activities</SectionTitle>
          {selectedDayKey && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-800 border border-teal-200">
                Day: {selectedDayKey}
              </span>
            </div>
          )}
        </div>

        <div className={`${styles.searchRow} mt-4`}>
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
            <option value="assignment">Assignments (Green)</option>
            <option value="quiz">Quizzes (Blue)</option>
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

        <div aria-live="polite">
          {busy && !data ? (
            <div className="rounded-xl border border-dashed border-slate-300 px-6 py-14 text-center text-slate-500">
              Loading your activities…
            </div>
          ) : visible.length ? (
            <TabularActivityList items={visible} now={now} />
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
