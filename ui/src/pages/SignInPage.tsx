import { ArrowRight, Check } from 'lucide-react';
import uiLogo from '../assets/ui-logo.svg';

export default function SignInPage() {
  // Read CAS error parameter directly from the browser window URL to display sign-in failures.
  const failed = new URLSearchParams(window.location.search).has('error');
  return (
    <main className="login-layout">
      <section>
        <span className="section-kicker">A LITTLE LESS DEADLINE CHAOS</span>
        <h1 className="login-title">
          Your courses.
          <br />
          One clear view<span className="text-teal-600">.</span>
        </h1>
        <p className="max-w-lg text-lg leading-8 text-slate-500">
          Assignments and quizzes from SCeLE, brought together so you can focus on what’s
          next.
        </p>
        <div className="mt-8 flex flex-wrap gap-5 text-sm text-slate-600">
          <span className="flex items-center gap-2">
            <Check size={17} /> Courses in one place
          </span>
          <span className="flex items-center gap-2">
            <Check size={17} /> Deadlines in WIB
          </span>
        </div>
      </section>
      <section className="login-card">
        {/* Centered UI Makara logo without background boxing */}
        <div className="mb-6 flex justify-center">
          <img src={uiLogo} alt="Universitas Indonesia" className="h-20 w-auto" />
        </div>
        <h2 className="text-2xl font-semibold">Welcome to SCELE Tracker</h2>
        <p className="mt-3 leading-7 text-slate-500">
          Sign in with your Universitas Indonesia account to view the shared course
          tracker.
        </p>
        {failed && (
          <p role="alert" className="notice mt-5">
            Sign-in could not be completed. Please try again.
          </p>
        )}
        {/* Navigates the top-level window to the backend CAS flow, establishing the login state cookie. */}
        <a className="primary-button mt-8 w-full" href="/api/auth/login">
          Continue with UI SSO <ArrowRight size={18} />
        </a>
        <p className="mt-5 text-center text-xs leading-6 text-slate-500">
          Your UI password is entered only on the university SSO page.
        </p>
      </section>
    </main>
  );
}
