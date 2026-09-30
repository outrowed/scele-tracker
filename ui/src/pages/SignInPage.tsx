import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { LogIn, AlertCircle, Loader2, ArrowLeft, Info } from 'lucide-react';
import uiLogo from '../assets/ui-logo.svg';
import { Button } from '../components/Button';

export default function SignInPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Sign-in failed.');
      window.location.href = '/';
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="mx-auto flex w-full max-w-[480px] flex-col items-center justify-center px-5 py-16"
      style={{ minHeight: '76vh' }}
    >
      <div className="w-full rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-7 shadow-xl shadow-slate-200/40 dark:shadow-black/20 md:p-10">
        <div className="mb-6 flex justify-center">
          <img src={uiLogo} alt="Universitas Indonesia" className="h-20 w-auto" />
        </div>
        <h1 className="text-center text-2xl font-semibold">Sign In</h1>
        <div className="mt-2 text-center text-sm leading-6 text-slate-500 dark:text-slate-400">
          <span>
            Enter your Universitas Indonesia SSO credentials to access your courses and
            deadlines.
          </span>
          <div className="relative inline-block ml-1 align-baseline group">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full text-slate-400 dark:text-slate-400 hover:text-teal-700 dark:hover:text-teal-300 focus:text-teal-700 dark:focus:text-teal-300 focus:outline-none transition p-0.5 align-middle"
              aria-label="Why are SSO credentials needed?"
            >
              <Info size={15} />
            </button>
            <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-72 -translate-x-1/2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-900 px-3.5 py-2.5 text-left text-xs leading-relaxed text-slate-100 shadow-xl opacity-0 transition duration-150 group-hover:opacity-100 group-focus-within:opacity-100 group-hover:pointer-events-auto">
              Your credentials are used to retrieve your profile and courses from
              SCELE, keep your session active across visits, and connect integrated UI
              services. Credentials are encrypted on the server for the duration of
              your session and permanently deleted when you sign out.
              <div className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-slate-200 dark:border-slate-700 bg-slate-900" />
            </div>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 px-5 py-4 text-sm leading-6 text-amber-900 dark:text-amber-100"
          >
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-300"
            />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="signin-username"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Username
            </label>
            <input
              id="signin-username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              placeholder="Username"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm transition focus:border-teal-400 dark:focus:border-teal-600 focus:ring-2 focus:ring-teal-100 dark:focus:ring-teal-900 focus:outline-none disabled:opacity-60"
            />
          </div>
          <div>
            <label
              htmlFor="signin-password"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Password
            </label>
            <input
              id="signin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              placeholder="Password"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm transition focus:border-teal-400 dark:focus:border-teal-600 focus:ring-2 focus:ring-teal-100 dark:focus:ring-teal-900 focus:outline-none disabled:opacity-60"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            className="mt-2 w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Signing in…
              </>
            ) : (
              <>
                Sign In <LogIn size={18} />
              </>
            )}
          </Button>
        </form>

        <p className="mt-5 text-center text-xs leading-6 text-slate-500 dark:text-slate-400">
          Your credentials are encrypted on the server to keep your session active
          and are deleted when you sign out.
        </p>

        <div className="mt-6 border-t border-slate-100 dark:border-slate-700 pt-4 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 transition hover:text-teal-700 dark:hover:text-teal-300"
          >
            <ArrowLeft size={14} /> Back to homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
