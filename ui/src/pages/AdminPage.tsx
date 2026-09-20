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

  // Request protected diagnostics when this page mounts; the API enforces the admin role.
  useEffect(() => {
    api<NonNullable<typeof data>>('/api/admin/status')
      .then(setData)
      .catch((error) => setError(error.message));
  }, []);

  function handleResetLocalStorage() {
    resetLocalPreferences();
    setResetMessage('Local storage and dismissed notices have been reset.');
    setTimeout(() => setResetMessage(''), 4000);
  }

  return (
    <Container as="main" className="py-10">
      <PageHeader
        title="Administration"
        description="Roles are managed by exact UI SSO username in the server's users.json file."
      />

      {error && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900"
        >
          {error}
        </p>
      )}

      {/* Admin actions: Local testing and preferences reset */}
      <Card as="section" className="mt-6">
        <SectionTitle>Developer &amp; Admin Controls</SectionTitle>
        <SectionDescription>
          Reset client-side stored data such as dismissed notices, slogans, and local
          preferences.
        </SectionDescription>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button type="button" onClick={handleResetLocalStorage}>
            <RotateCcw size={15} />
            Reset Local Storage / Notices
          </Button>
          {resetMessage && (
            <span
              role="status"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700"
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
              <p key={source.id} className="my-2 text-sm text-slate-700">
                Source: {source.id} · State: {source.state}
              </p>
            ))}
            <p className="mt-4 text-xs text-slate-500">
              Last checked:{' '}
              {data.checkedAt ? new Date(data.checkedAt).toLocaleString() : 'Never'}
            </p>
          </>
        )}
      </Card>
    </Container>
  );
}
