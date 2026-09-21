import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Activity } from '../model';
import { activityOnDay, monthDays, shiftMonth } from '../calendar';
import { Container } from '../components/Container';
import { Button } from '../components/Button';
import { MessageBox } from '../components/MessageBox';
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
  const today = new Date().toISOString().slice(0, 10);
  const filtered = activities.filter(
    (item) => course === 'all' || String(item.courseId) === course,
  );
  const courses = [
    ...new Map(activities.map((item) => [item.courseId, item.courseName])).entries(),
  ];
  const undated = filtered.filter(
    (item) => item.opensAt == null && item.dueAt == null && item.cutoffAt == null,
  ).length;
  const title = new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${month}-01T00:00:00Z`));

  return (
    <Container as="main" className="py-10">
      <PageHeader
        title="Course calendar"
        description="Assignment and quiz dates in your local time. Availability spans opening to due date; cut-off dates are marked separately."
      />

      {error && (
        <MessageBox role="alert" variant="error" className="mt-4">
          {error}
        </MessageBox>
      )}
      {(snapshot?.incomplete || snapshot?.stale || snapshot?.preparing) && (
        <MessageBox variant="warning" className="mt-4">
          Course data may be incomplete, stale, or still preparing. Check SCeLE to confirm
          dates.
        </MessageBox>
      )}
      <div className="my-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            aria-label="Previous month"
            onClick={() => setMonth(shiftMonth(month, -1))}
          >
            ←
          </Button>
          <h2 className="text-xl font-semibold" aria-live="polite">
            {title}
          </h2>
          <Button aria-label="Next month" onClick={() => setMonth(shiftMonth(month, 1))}>
            →
          </Button>
          <Button onClick={() => setMonth(today.slice(0, 7))}>Today</Button>
        </div>
        <label className="text-sm">
          Course{' '}
          <select
            className="max-w-full rounded-lg border border-slate-200 bg-white p-2"
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
            <p className="mb-3 text-xs text-slate-500">
              Teal: available/opening · Amber: due · Violet: cut-off. Select any entry for
              details.
            </p>
            <div
              className="overflow-x-auto rounded-xl border border-slate-200"
              role="region"
              aria-label="Monthly calendar"
              tabIndex={0}
            >
              <div className="grid min-w-[840px] grid-cols-7 bg-white">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <div
                    key={day}
                    className="border-b border-slate-200 p-3 text-center text-sm font-semibold"
                  >
                    {day}
                  </div>
                ))}
                {monthDays(month).map((day) => (
                  <section
                    key={day}
                    aria-label={day}
                    className={`min-h-32 border-b border-r border-slate-100 p-2 ${day.startsWith(month) ? '' : 'bg-slate-50'}`}
                  >
                    <time
                      dateTime={day}
                      aria-current={day === today ? 'date' : undefined}
                      className={`mb-2 inline-block rounded-full px-2 text-sm ${day === today ? 'bg-teal-700 text-white' : 'text-slate-600'}`}
                    >
                      {Number(day.slice(-2))}
                    </time>
                    <div className="flex flex-col gap-1">
                      {filtered.map((item) => {
                        const state = activityOnDay(item, day);
                        if (!state) return null;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            aria-pressed={selected?.id === item.id}
                            onClick={() => setSelected(item)}
                            className={`rounded border-l-4 p-1.5 text-left text-xs ${state === 'Due' ? 'border-amber-500 bg-amber-50 text-amber-900' : state === 'Cut-off' ? 'border-violet-500 bg-violet-50 text-violet-900' : 'border-teal-500 bg-teal-50 text-teal-900'} ${selected?.id === item.id ? 'ring-2 ring-teal-700' : ''}`}
                          >
                            <span className="block font-semibold">
                              {state} · {item.name}
                            </span>
                            <span className="block">{item.courseName}</span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </div>
            {filtered.length === 0 && (
              <SectionDescription className="mt-4">
                No activities available for this course selection.
              </SectionDescription>
            )}
            {undated > 0 && (
              <p className="mt-4 text-xs text-slate-500">
                {undated} {undated === 1 ? 'activity has' : 'activities have'} no open,
                due, or cut-off date and cannot be plotted.
              </p>
            )}
          </>
        )
      )}
      {selected && (
        <div
          role="region"
          aria-label="Selected activity"
          className="mt-6 rounded-xl border border-teal-200 bg-teal-50/40 p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                {selected.courseName}
              </p>
              <SectionTitle className="mt-1">{selected.name}</SectionTitle>
            </div>
            <Link
              to={`/activities/${encodeURIComponent(selected.id)}`}
              className="text-sm font-semibold text-teal-700 hover:underline"
            >
              View activity details
            </Link>
          </div>
          {selected.description && (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {selected.description}
            </p>
          )}
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              ['Opens', selected.opensAt],
              ['Due', selected.dueAt],
              ['Cut-off', selected.cutoffAt],
            ].map(([label, ts]) => (
              <div key={label} className="rounded-lg bg-white p-3 border border-teal-100">
                <dt className="text-xs font-medium text-slate-500">{label}</dt>
                <dd className="mt-0.5 text-sm font-semibold text-slate-800">
                  {ts
                    ? new Intl.DateTimeFormat('en-GB', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                        timeZone: 'Asia/Jakarta',
                      }).format(new Date((ts as number) * 1000))
                    : 'Not set'}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </Container>
  );
}
