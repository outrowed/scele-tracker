import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowUpRight, ChevronLeft } from 'lucide-react';
import { api, dateLabel, type Activity } from '../model';

export default function ActivityDetailsPage() {
  const { id } = useParams();
  const [item, setItem] = useState<Activity | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setItem(null);
    setError('');
    api<{ activity: Activity }>(`/api/activities/${encodeURIComponent(id || '')}`)
      .then((data) => {
        if (active) setItem(data.activity);
      })
      .catch((error) => {
        if (active) setError(error.message);
      });
    return () => {
      active = false;
    };
  }, [id]);
  return (
    <main className="page-width py-10">
      <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-slate-500">
        <ChevronLeft size={16} /> Back to activity feed
      </Link>
      {error ? (
        <p role="alert" className="notice">
          {error}
        </p>
      ) : !item ? (
        <p>Loading activity…</p>
      ) : (
        <>
          <div className="max-w-4xl">
            <span className="section-kicker">
              {item.courseName} · {item.kind}
            </span>
            <h1 className="page-title">{item.name}</h1>
            <p className="mt-3 text-sm text-slate-500">
              Check SCeLE to confirm the dates that apply to your class.
            </p>
          </div>
          <div className="detail-grid mt-8">
            <section className="side-card">
              <h2 className="mb-5 text-xl font-semibold">Activity details</h2>
              <div className="whitespace-pre-wrap break-words leading-8 text-slate-600">
                {item.description ||
                  'No description is available. View the activity in SCeLE for full instructions.'}
              </div>
            </section>
            <aside className="side-card">
              <h2 className="mb-5 font-semibold">Key dates</h2>
              <dl className="space-y-5">
                {[
                  ['Opens', dateLabel(item.opensAt)],
                  [item.kind === 'quiz' ? 'Closes' : 'Due', dateLabel(item.dueAt)],
                  ['Cut-off', dateLabel(item.cutoffAt)],
                  [
                    'Time limit',
                    item.timeLimit
                      ? `${Math.round(item.timeLimit / 60)} minutes`
                      : 'Not available',
                  ],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-slate-500">{label}</dt>
                    <dd className="mt-1 text-sm font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
              <a
                className="primary-button mt-7 w-full"
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in SCeLE <ArrowUpRight size={17} />
              </a>
              <p className="mt-4 text-xs leading-5 text-slate-500">
                Opens using your own SCeLE session. You still need access to this course.
                No quiz is started by this tracker.
              </p>
            </aside>
          </div>
        </>
      )}
    </main>
  );
}
