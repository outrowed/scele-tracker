import {
  ActivityFilters,
  emptyFilters,
  matchesFilters,
} from '../components/ActivityFilters';
import { DataStatusNotice } from '../components/DataStatusNotice';
import { useEffect, useState } from 'react';
import { ClipboardList, RefreshCw, Search, X } from 'lucide-react';
import { Container } from '../components/Container';
import { Button } from '../components/Button';
import { PageHeader, SectionTitle } from '../components/Typography';
import { WeekBar } from '../components/WeekBar';
import { TabularActivityList } from '../components/TabularActivityList';
import { api, type Snapshot } from '../model';
import { activityRange, compareNewestFirst, getWeekDays } from '../planner';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [filters, setFilters] = useState(emptyFilters);
  const [query, setQuery] = useState('');

  const [now, setNow] = useState(Date.now() / 1000);

  // Week planner state
  const [dayOffset, setDayOffset] = useState(0);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  // Fetch this user's Moodle snapshot and update this page's feed.
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
  // Multiple activity variants share a course; list each course only once in the filter.

  // Week days with quizzes and assignments grouped
  const weekInfo = getWeekDays(now, dayOffset, items);

  const visible = items
    .filter(
      (item) =>
        matchesFilters(item, filters, now) &&
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

      {/* Retain actionable loading and connection notices. */}
      <div
        className={`${styles.noticeStack} flex flex-col gap-3`}
        aria-label="Data status"
      >
        <DataStatusNotice
          error={error}
          loading={!data || Boolean(data.incomplete || data.stale || data.preparing)}
        />
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
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <SectionTitle>Activities</SectionTitle>
        </div>

        <ActivityFilters
          items={items}
          value={filters}
          onChange={setFilters}
          search={query}
          onSearchChange={setQuery}
          selectedDayKey={selectedDayKey}
          onClearDay={() => setSelectedDayKey(null)}
          className="mb-6"
        />

        <div aria-live="polite">
          {!data ? (
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 px-6 py-14 text-center text-slate-500 dark:text-slate-400">
              Loading your activities…
            </div>
          ) : visible.length ? (
            <TabularActivityList items={visible} now={now} />
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 px-6 py-14 text-center text-slate-500 dark:text-slate-400">
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
