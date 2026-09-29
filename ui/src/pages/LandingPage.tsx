import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock3,
  Layers3,
  Lock,
  Sparkles,
  Timer,
  Zap,
} from 'lucide-react';
import { SectionKicker } from '../components/Typography';
import { ButtonLink } from '../components/Button';

export default function LandingPage() {
  return (
    <div className="flex flex-col gap-20 py-12 md:py-20">
      {/* 1. Hero Section */}
      <section className="mx-auto flex w-full max-w-[1280px] flex-col items-center px-5 text-center md:px-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-teal-200/80 dark:border-teal-800/80 bg-teal-50/80 dark:bg-teal-950/80 px-3.5 py-1 text-xs font-semibold text-teal-800 dark:text-teal-200 backdrop-blur-xs">
          <Sparkles size={14} className="text-teal-600 dark:text-teal-300" />
          <span>Built for CSUI Students</span>
        </div>

        <h1 className="mb-6 mt-6 max-w-4xl text-5xl font-extrabold leading-[1.08] tracking-[-0.04em] text-slate-900 dark:text-slate-100 md:text-6xl lg:text-7xl">
          Never miss a SCELE deadline{' '}
          <span className="text-teal-700 dark:text-teal-300">again.</span>
        </h1>

        <p className="max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-300 md:text-xl">
          Consolidate your courses, assignments, and quizzes from SCELE into a unified,
          real-time planner. Stop digging through nested course pages and stay ahead of
          your semester.
        </p>

        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
          <ButtonLink to="/login" variant="primary" className="h-12 px-8 text-base">
            Sign In with UI SSO <ArrowRight size={18} />
          </ButtonLink>
          <a
            href="#features"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Explore Features
          </a>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={15} className="text-teal-600 dark:text-teal-300" /> Zero
            password storage
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={15} className="text-teal-600 dark:text-teal-300" />{' '}
            Real-time SCELE sync
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={15} className="text-teal-600 dark:text-teal-300" /> Mobile
            & desktop responsive
          </span>
        </div>
      </section>

      {/* 2. Authentic App Preview (Reflecting real WeekBar and TabularActivityList) */}
      <section className="mx-auto w-full max-w-[1100px] px-5 md:px-10">
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/20">
          {/* Header controls matching real WeekBar */}
          <div className="border-b border-slate-200 dark:border-slate-600 bg-slate-50/75 dark:bg-slate-700 px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 md:text-lg">
                  Weekly Schedule
                </h2>
                <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                  21 Sep – 27 Sep 2026
                </span>
              </div>
              <span className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-2xs">
                Today
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Bars span opening to closing/due date, inclusive. Arrows indicate
              continuation outside this week.
            </p>
          </div>

          <div className="p-4 md:p-6 space-y-6">
            {/* Real WeekBar Replica */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs">
              <div className="min-w-[650px]">
                {/* 7 Days Header Grid */}
                <div className="grid grid-cols-7 divide-x divide-slate-200 dark:divide-slate-700 border-b border-slate-200 dark:border-slate-700 text-xs">
                  {[
                    { day: 'Mon', num: '21 Sep' },
                    { day: 'Tue', num: '22 Sep' },
                    { day: 'Wed', num: '23 Sep' },
                    { day: 'Thu', num: '24 Sep' },
                    { day: 'Fri', num: '25 Sep' },
                    { day: 'Sat', num: '26 Sep' },
                    { day: 'Sun', num: '27 Sep', isToday: true },
                  ].map((d) => (
                    <div
                      key={d.day}
                      className={`flex items-center justify-between px-3 py-2.5 font-semibold ${
                        d.isToday
                          ? 'bg-teal-50/80 dark:bg-teal-950/80 text-teal-900 dark:text-teal-100'
                          : 'bg-slate-50/60 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <span
                        className={
                          d.isToday
                            ? 'text-teal-900 dark:text-teal-100 font-bold'
                            : 'text-slate-600 dark:text-slate-300'
                        }
                      >
                        {d.day}
                      </span>
                      <span
                        className={
                          d.isToday
                            ? 'text-teal-800 dark:text-teal-200 font-bold'
                            : 'text-slate-600 dark:text-slate-300'
                        }
                      >
                        {d.num}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Week Lanes Grid */}
                <div
                  className="relative grid grid-cols-7 gap-y-2 py-3 px-1"
                  style={{ gridTemplateRows: 'repeat(3, 34px)' }}
                >
                  {/* Activity Bar 1: Quiz */}
                  <div
                    className="flex min-w-0 items-center gap-1.5 rounded-md border border-blue-300 dark:border-blue-700 bg-blue-100 dark:bg-blue-900 px-2 text-left text-xs font-medium text-blue-900 dark:text-blue-100 mx-1"
                    style={{ gridColumn: '2 / 4', gridRow: 1 }}
                  >
                    <span className="truncate">Kuis Mingguan 04</span>
                    <span className="hidden sm:inline text-[10px] opacity-75 truncate">
                      · Sistem Operasi
                    </span>
                  </div>

                  {/* Activity Bar 2: Assignment continuing across week */}
                  <div
                    className="flex min-w-0 items-center gap-1.5 rounded-l-md border-y border-l border-emerald-300 dark:border-emerald-700 bg-emerald-100 dark:bg-emerald-900 px-2 text-left text-xs font-medium text-emerald-900 dark:text-emerald-100 ml-1"
                    style={{ gridColumn: '1 / 6', gridRow: 2 }}
                  >
                    <span className="truncate">Tugas Pemrograman 1: Tree Traversal</span>
                    <span className="hidden sm:inline text-[10px] opacity-75 truncate">
                      · Struktur Data & Algoritma
                    </span>
                  </div>

                  {/* Activity Bar 3: Assignment due Sunday (Today) */}
                  <div
                    className="flex min-w-0 items-center gap-1.5 rounded-md border border-emerald-300 dark:border-emerald-700 bg-emerald-100 dark:bg-emerald-900 px-2 text-left text-xs font-medium text-emerald-900 dark:text-emerald-100 mx-1"
                    style={{ gridColumn: '5 / 8', gridRow: 3 }}
                  >
                    <span className="truncate">Lab 03: Logic & Proofs</span>
                    <span className="hidden sm:inline text-[10px] opacity-75 truncate">
                      · Matematika Diskret 1
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Real TabularActivityList Replica */}
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-600 bg-slate-50/75 dark:bg-slate-700 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                      <th scope="col" className="py-3 pl-4 pr-3 min-w-[180px]">
                        Activity Name
                      </th>
                      <th scope="col" className="whitespace-nowrap px-3 py-3">
                        Type
                      </th>
                      <th scope="col" className="px-3 py-3 min-w-[140px]">
                        Course
                      </th>
                      <th
                        scope="col"
                        className="whitespace-nowrap px-3 py-3 min-w-[130px]"
                      >
                        Due Date
                      </th>
                      <th
                        scope="col"
                        className="whitespace-nowrap py-3 pl-3 pr-4 text-right"
                      >
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-xs sm:text-sm">
                    {/* Row 1: Due Today */}
                    <tr className="bg-amber-50/40 dark:bg-amber-950/40">
                      <td className="py-3 pl-4 pr-3 font-semibold text-slate-800 dark:text-slate-100">
                        Lab 03: Logic & Proofs
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/70">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                          Assignment
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-600 dark:text-slate-300 font-medium">
                        Matematika Diskret 1
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-600 dark:text-slate-300">
                        27 Sep 2026, 23:59
                      </td>
                      <td className="whitespace-nowrap py-3 pl-3 pr-4 text-right">
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900 px-2.5 py-1 text-xs font-bold text-amber-800 dark:text-amber-200">
                          Due Today
                        </span>
                      </td>
                    </tr>

                    {/* Row 2: Upcoming */}
                    <tr>
                      <td className="py-3 pl-4 pr-3 font-semibold text-slate-800 dark:text-slate-100">
                        Tugas Pemrograman 1: Tree Traversal
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/70">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                          Assignment
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-600 dark:text-slate-300 font-medium">
                        Struktur Data & Algoritma
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-600 dark:text-slate-300">
                        29 Sep 2026, 23:59
                      </td>
                      <td className="whitespace-nowrap py-3 pl-3 pr-4 text-right">
                        <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 dark:bg-teal-950 px-2.5 py-1 text-xs font-semibold text-teal-800 dark:text-teal-200 border border-teal-200/60 dark:border-teal-800/60">
                          Due in 2d
                        </span>
                      </td>
                    </tr>

                    {/* Row 3: Quiz */}
                    <tr>
                      <td className="py-3 pl-4 pr-3 font-semibold text-slate-800 dark:text-slate-100">
                        Kuis Mingguan 04: Process Scheduling
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 dark:bg-blue-950 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/70">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                          Quiz
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-600 dark:text-slate-300 font-medium">
                        Sistem Operasi
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-600 dark:text-slate-300">
                        1 Oct 2026, 17:00
                      </td>
                      <td className="whitespace-nowrap py-3 pl-3 pr-4 text-right">
                        <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 dark:bg-teal-950 px-2.5 py-1 text-xs font-semibold text-teal-800 dark:text-teal-200 border border-teal-200/60 dark:border-teal-800/60">
                          Due in 4d
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Core Features Section */}
      <section id="features" className="mx-auto w-full max-w-[1280px] px-5 md:px-10">
        <div className="text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-4xl">
            Everything you need to navigate your coursework
          </h2>
          <p className="mx-auto max-w-2xl text-base text-slate-600 dark:text-slate-300">
            Designed specifically around how CSUI courses publish assignments and quizzes
            on SCELE.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Feature 1 */}
          <div className="flex flex-col rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 p-6 shadow-xs transition hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-md">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
              <Layers3 size={24} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Lorem ipsum 1
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
              tempor incididunt ut labore et dolore magna aliqua.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 p-6 shadow-xs transition hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-md">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              <Clock3 size={24} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Lorem ipsum 2
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
              tempor incididunt ut labore et dolore magna aliqua.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 p-6 shadow-xs transition hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-md">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              <Calendar size={24} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Lorem ipsum 3
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
              tempor incididunt ut labore et dolore magna aliqua.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="flex flex-col rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 p-6 shadow-xs transition hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-md">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
              <BookOpen size={24} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Lorem ipsum 4
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
              tempor incididunt ut labore et dolore magna aliqua.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="flex flex-col rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 p-6 shadow-xs transition hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-md">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
              <Zap size={24} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Lorem ipsum 5
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
              tempor incididunt ut labore et dolore magna aliqua.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="flex flex-col rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 p-6 shadow-xs transition hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-md">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
              <Lock size={24} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Lorem ipsum 6
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
              tempor incididunt ut labore et dolore magna aliqua.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Bottom CTA Callout */}
      <section className="mx-auto w-full max-w-[1280px] px-5 md:px-10">
        <div className="relative overflow-hidden rounded-3xl border border-teal-200 dark:border-teal-800 bg-gradient-to-br from-teal-700 to-teal-900 px-6 py-12 text-center text-white shadow-xl shadow-teal-900/10 md:px-12 md:py-16">
          <div className="relative z-10 mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Ready to simplify your semester?
            </h2>
            <p className="mt-3 text-base text-teal-100 md:text-lg">
              Sign in with your Universitas Indonesia SSO credentials to access your
              courses, deadlines, and schedule immediately.
            </p>
            <div className="mt-8 flex justify-center">
              <ButtonLink
                to="/login"
                variant="secondary"
                className="h-12 border-0 bg-white px-8 text-base font-bold text-teal-900 hover:bg-teal-50"
              >
                Sign In with UI SSO <ArrowRight size={18} />
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
