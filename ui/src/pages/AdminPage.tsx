import { useEffect, useState } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { resetLocalPreferences } from '../hooks/useDismissible';
import { api } from '../model';
import { Container } from '../components/Container';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { PageHeader, SectionDescription, SectionTitle } from '../components/Typography';

export default function AdminPage() {
  const [data, setData] = useState<{
    sources: { id: string; state: string }[];
    configured: boolean;
    checkedAt: string | null;
  } | null>(null);
  const [error, setError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [shared, setShared] = useState<{
    activities: {
      id: string;
      name: string;
      courseName: string;
      dueAt: number | null;
      source?: string;
    }[];
    stale: boolean;
    preparing: boolean;
  } | null>(null);
  const [sharedError, setSharedError] = useState('');

  // Request protected diagnostics when this page mounts; the API enforces the admin role.
  useEffect(() => {
    api<NonNullable<typeof data>>('/api/admin/status')
      .then(setData)
      .catch((error) => setError(error.message));
  }, []);

  async function inspectShared() {
    setSharedError('');
    try {
      setShared(await api<NonNullable<typeof shared>>('/api/admin/shared-activities'));
    } catch (error) {
      setSharedError((error as Error).message);
    }
  }

  function handleResetLocalStorage() {
    resetLocalPreferences();
    setResetMessage('Local preferences have been reset.');
    setTimeout(() => setResetMessage(''), 4000);
  }

  return (
    <Container as="main" className="py-10 md:py-14">
      <PageHeader
        title="Administration"
        description="Roles are managed by exact UI SSO username in the server's users.json file."
      />

      {error && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 px-5 py-4 text-sm leading-6 text-amber-900 dark:text-amber-100"
        >
          {error}
        </p>
      )}

      {/* Admin actions: Local testing and preferences reset */}
      <Card as="section" className="mt-6">
        <SectionTitle>Developer &amp; Admin Controls</SectionTitle>
        <SectionDescription>Reset client-side local preferences.</SectionDescription>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button type="button" onClick={handleResetLocalStorage}>
            <RotateCcw size={15} />
            Reset Local Preferences
          </Button>
          {resetMessage && (
            <span
              role="status"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 dark:text-teal-300"
            >
              <Check size={14} />
              {resetMessage}
            </span>
          )}
        </div>
      </Card>

      <Card as="section" className="mt-6">
        <SectionTitle>Source diagnostics</SectionTitle>
        {!data ? (
          <SectionDescription className="mt-3">Loading…</SectionDescription>
        ) : (
          <>
            <p className="my-3 text-sm">
              Status: {data.configured ? 'Configured' : 'No sources configured'}
            </p>
            {data.sources.map((source) => (
              <p
                key={source.id}
                className="my-2 text-sm text-slate-700 dark:text-slate-200"
              >
                Source: {source.id} · State: {source.state}
              </p>
            ))}
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              Last checked:{' '}
              {data.checkedAt ? new Date(data.checkedAt).toLocaleString() : 'Never'}
            </p>
          </>
        )}
      </Card>

      <Card as="section" className="mt-6">
        <SectionTitle>Shared account snapshot</SectionTitle>
        <SectionDescription>
          Admin-only diagnostic view of the shared sync. It is not mixed into any
          visitor's personal feed.
        </SectionDescription>
        <Button type="button" className="mt-4" onClick={inspectShared}>
          Inspect shared snapshot
        </Button>
        {sharedError && (
          <p role="alert" className="mt-3 text-sm text-amber-800 dark:text-amber-200">
            {sharedError}
          </p>
        )}
        {shared && (
          <>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              {shared.activities.length} activities ·{' '}
              {shared.preparing ? 'Preparing' : shared.stale ? 'Stale' : 'Current'}
            </p>
            <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm text-slate-700 dark:text-slate-200">
              {shared.activities.map((item) => (
                <li
                  key={item.id}
                  className="border-b border-slate-100 dark:border-slate-700 pb-2"
                >
                  {item.courseName} · {item.name} ·{' '}
                  {item.dueAt
                    ? new Date(item.dueAt * 1000).toLocaleString()
                    : 'No deadline'}
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </Container>
  );
}
