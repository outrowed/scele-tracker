import { ArrowRight, Check } from 'lucide-react';
import uiLogo from '../assets/ui-logo.svg';
import { SectionKicker } from '../components/Typography';
import { ButtonLink } from '../components/Button';

export default function SignInPage() {
  // Read CAS error parameter directly from the browser window URL to display sign-in failures.
  const failed = new URLSearchParams(window.location.search).has('error');
  return (
    <main
      className="mx-auto grid w-full max-w-[1280px] items-center gap-12 px-5 py-16 md:px-10 lg:grid-cols-[1.15fr_1fr]"
      style={{ minHeight: '76vh' }}
    >
      <section>
        <SectionKicker>A LITTLE LESS DEADLINE CHAOS</SectionKicker>
        <h1 className="mb-7 mt-5 text-5xl font-semibold leading-[1.1] tracking-[-0.045em] md:text-6xl">
          Your courses.
          <br />
          One clear view<span className="text-teal-600">.</span>
        </h1>
        <p className="max-w-lg text-lg leading-8 text-slate-500">
          Assignments and quizzes from SCeLE, brought together so you can focus on what's
          next.
        </p>
        <div className="mt-8 flex flex-wrap gap-5 text-sm text-slate-600">
          <span className="flex items-center gap-2">
            <Check size={17} /> Courses in one place
          </span>
          <span className="flex items-center gap-2">
            <Check size={17} /> Deadlines in your local time
          </span>
        </div>
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/40 md:p-10">
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
          <p
            role="alert"
            className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900"
          >
            Sign-in could not be completed. Please try again.
          </p>
        )}
        {/* Navigates the top-level window to the backend CAS flow, establishing the login state cookie. */}
        <ButtonLink href="/api/auth/login" className="mt-8 w-full">
          Continue with UI SSO <ArrowRight size={18} />
        </ButtonLink>
        <p className="mt-5 text-center text-xs leading-6 text-slate-500">
          Your UI password is entered only on the university SSO page.
        </p>
      </section>
    </main>
  );
}
