import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { api, dateLabel, type Activity } from '../model';
import { Container } from '../components/Container';
import { Card } from '../components/Card';
import { ButtonLink } from '../components/Button';
import {
  PageHeader,
  SectionDescription,
  SectionKicker,
  SectionTitle,
} from '../components/Typography';

export default function ActivityDetailsPage() {
  const { id } = useParams();
  const [item, setItem] = useState<Activity | null>(null);
  const [error, setError] = useState('');

  // Reload for each route ID; ignore stale responses after navigation or unmount.
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
    <Container as="main" className="py-10 md:py-14">
      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900"
        >
          {error}
        </p>
      ) : !item ? (
        <SectionDescription>Loading activity…</SectionDescription>
      ) : (
        <>
          <PageHeader
            backTo="/"
            backLabel="Back to activity feed"
            kicker={
              <SectionKicker>
                {item.courseName} · {item.kind}
              </SectionKicker>
            }
            title={item.name}
            description="Check SCeLE to confirm the dates that apply to your class."
          />

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <Card as="section">
              <SectionTitle className="mb-5 text-xl">Activity details</SectionTitle>
              <div className="whitespace-pre-wrap break-words leading-8 text-slate-600">
                {item.description ||
                  'No description is available. View the activity in SCeLE for full instructions.'}
              </div>
            </Card>
            <Card as="aside">
              <SectionTitle className="mb-5">Key dates</SectionTitle>
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
              {/* Leave this app in a separate tab using the visitor's own SCeLE session. */}
              <ButtonLink
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 w-full"
              >
                Open in SCeLE <ArrowUpRight size={17} />
              </ButtonLink>
              <p className="mt-4 text-xs leading-5 text-slate-500">
                Opens using your own SCeLE session. You still need access to this course.
                No quiz is started by this tracker.
              </p>
            </Card>
          </div>
        </>
      )}
    </Container>
  );
}
