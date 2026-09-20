import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../model';

export default function AdminPage() {
  const [data, setData] = useState<{
    sources: { id: string; state: string }[];
    configured: boolean;
    checkedAt: string | null;
  } | null>(null);
  const [error, setError] = useState('');
  // Request protected diagnostics when this page mounts; the API enforces the admin role.
  useEffect(() => {
    api<NonNullable<typeof data>>('/api/admin/status')
      .then(setData)
      .catch((error) => setError(error.message));
  }, []);
  return (
    <main className="page-width py-10">
      <Link to="/">← Activity feed</Link>
      <h1 className="page-title">Administration</h1>
      <p className="mt-3 text-slate-500">
        Roles are managed by exact UI SSO username in the server’s users.json file.
      </p>
      {error && (
        <p role="alert" className="notice mt-6">
          {error}
        </p>
      )}
      <section className="side-card mt-6">
        <h2 className="font-semibold">Source diagnostics</h2>
        {!data ? (
          <p>Loading…</p>
        ) : (
          <>
            <p className="my-3">
              {data.configured ? 'Accounts configured' : 'No accounts configured'}
            </p>
            {data.sources.map((source) => (
              <p key={source.id} className="my-2">
                {source.id} · {source.state}
              </p>
            ))}
            <p className="mt-4 text-sm text-slate-500">
              Last checked: {data.checkedAt || 'Not yet'} · Shared cache refreshes after
              ten minutes of staleness while in use.
            </p>
          </>
        )}
      </section>
    </main>
  );
}
