import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Layers3,
  ListChecks,
  Search,
  Sparkles,
} from 'lucide-react';
import { LandingShowcases } from '../components/LandingShowcases';
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
            <CheckCircle2 size={15} className="text-teal-600 dark:text-teal-300" />{' '}
            Encrypted session security
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={15} className="text-teal-600 dark:text-teal-300" />{' '}
            Connected to SCELE
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
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 md:text-lg">
                  Weekly Schedule
                </h2>
                <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                  21 Sep – 27 Sep 2026
                </span>
              </div>
              <span className="rounded-full bg-teal-50 dark:bg-teal-950 px-3 py-1 text-xs font-semibold text-teal-800 dark:text-teal-200 border border-teal-200/80 dark:border-teal-800/80">
                Sunday (Today)
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Illustrative preview · Sample activities, not live student data.
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
                      className={`relative flex items-center justify-between px-3 py-2.5 font-semibold ${
                        d.isToday
                          ? 'bg-teal-100/90 dark:bg-teal-900/90 text-teal-950 dark:text-teal-100 font-bold'
                          : 'bg-slate-50/60 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {d.isToday && (
                        <span
                          aria-hidden="true"
                          className="absolute inset-x-0 top-0 h-1 bg-teal-600"
                        />
                      )}
                      <span
                        className={
                          d.isToday
                            ? 'text-teal-950 dark:text-teal-100 font-bold'
                            : 'text-slate-600 dark:text-slate-300'
                        }
                      >
                        {d.day}
                      </span>
                      <span
                        className={
                          d.isToday
                            ? 'text-teal-900 dark:text-teal-100 font-bold'
                            : 'text-slate-600 dark:text-slate-300'
                        }
                      >
                        {d.num}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Week Lanes Grid with Column Dividers and TODAY Wash */}
                <div className="relative">
                  {/* Vertical day columns */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 grid grid-cols-7 divide-x divide-slate-200 dark:divide-slate-700 select-none"
                  >
                    {[21, 22, 23, 24, 25, 26, 27].map((num) => (
                      <div
                        key={num}
                        className={`flex items-center justify-center transition ${
                          num === 27 ? 'bg-teal-100/25 dark:bg-teal-900/25' : ''
                        }`}
                      >
                        {num === 27 && (
                          <span className="text-xs md:text-sm font-bold tracking-widest text-teal-800/20 dark:text-teal-200/20 uppercase select-none">
                            TODAY
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div
                    className="relative grid grid-cols-7 gap-y-2 py-3 px-1"
                    style={{ gridTemplateRows: 'repeat(3, 34px)' }}
                  >
                    {/* Activity Bar 1: Quiz Tue-Wed */}
                    <div
                      className="flex min-w-0 items-center gap-1.5 rounded-md border border-blue-300 dark:border-blue-700 bg-blue-100 dark:bg-blue-900 px-2 text-left text-xs font-medium text-blue-900 dark:text-blue-100 mx-1 shadow-xs"
                      style={{ gridColumn: '2 / 4', gridRow: 1 }}
                    >
                      <span className="truncate font-semibold">Kuis Mingguan 04</span>
                      <span className="hidden sm:inline text-[10px] opacity-75 truncate">
                        · Sistem Operasi
                      </span>
                    </div>

                    {/* Activity Bar 2: Assignment Mon-Fri (fully closed, rounded, and bordered) */}
                    <div
                      className="flex min-w-0 items-center gap-1.5 rounded-md border border-emerald-300 dark:border-emerald-700 bg-emerald-100 dark:bg-emerald-900 px-2 text-left text-xs font-medium text-emerald-900 dark:text-emerald-100 mx-1 shadow-xs"
                      style={{ gridColumn: '1 / 6', gridRow: 2 }}
                    >
                      <span className="truncate font-semibold">
                        Tugas Pemrograman 1: Tree Traversal
                      </span>
                      <span className="hidden sm:inline text-[10px] opacity-75 truncate">
                        · Struktur Data & Algoritma
                      </span>
                    </div>

                    {/* Activity Bar 3: Assignment Fri-Sun due Sunday */}
                    <div
                      className="flex min-w-0 items-center gap-1.5 rounded-md border border-emerald-300 dark:border-emerald-700 bg-emerald-100 dark:bg-emerald-900 px-2 text-left text-xs font-medium text-emerald-900 dark:text-emerald-100 mx-1 shadow-xs"
                      style={{ gridColumn: '5 / 8', gridRow: 3 }}
                    >
                      <span className="truncate font-semibold">
                        Lab 03: Logic & Proofs
                      </span>
                      <span className="hidden sm:inline text-[10px] opacity-75 truncate">
                        · Matematika Diskret 1
                      </span>
                    </div>
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
            Your semester, without the tab shuffle.
          </h2>
          <p className="mx-auto max-w-2xl text-base text-slate-600 dark:text-slate-300">
            Your courses, activities, and deadlines belong together. Get a clear overview
            without opening every course page just to figure out what is next.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Layers3,
              title: 'One feed. All your coursework.',
              description:
                'Assignments and quizzes from your enrolled courses, together in a single activity feed. Spend less time finding the work and more time getting it done.',
            },
            {
              icon: Search,
              title: 'Find your focus',
              description:
                'Search by activity or course, then narrow the view with filters. A crowded semester becomes a manageable list of what matters to you.',
            },
            {
              icon: ListChecks,
              title: 'Keep the details together',
              description:
                'See dates and activity status alongside the course they belong to, with links back to SCELE when you are ready to act.',
            },
          ].map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800"
            >
              <Icon
                size={22}
                className="mb-5 text-teal-700 dark:text-teal-300"
                aria-hidden="true"
              />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {description}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Feature Showcases: Authentic summarized UIs */}
      <LandingShowcases />

      {/* 4. Getting Started Section */}
      <section
        className="mx-auto w-full max-w-[1100px] px-5 md:px-10"
        aria-labelledby="getting-started"
      >
        <h2
          id="getting-started"
          className="text-center text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
        >
          Less setup. More clarity.
        </h2>
        <ol className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            [
              'Sign in with UI SSO',
              'Use your Universitas Indonesia account to get started.',
            ],
            [
              'Let your courses come together',
              'Your enrolled courses and their activities are brought into one place. The first sync may take a moment.',
            ],
            [
              'Make a plan for the week',
              'Check the feed, look ahead in the calendar, and open SCELE when it is time to submit.',
            ],
          ].map(([title, text], index) => (
            <li
              key={title}
              className="border-t border-slate-200 pt-5 dark:border-slate-700"
            >
              <span className="text-sm font-bold text-teal-700 dark:text-teal-300">
                0{index + 1}
              </span>
              <h3 className="mt-3 font-semibold text-slate-900 dark:text-slate-100">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {text}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* 5. Comprehensive Frequently Asked Questions */}
      <section
        className="mx-auto w-full max-w-[1100px] px-5 md:px-10"
        aria-labelledby="faq-heading"
      >
        <div className="text-center">
          <h2
            id="faq-heading"
            className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
          >
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Answers to common questions about features, sync behavior, privacy, and
            security.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <details className="rounded-xl border border-slate-200 p-5 text-sm dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xs">
            <summary className="cursor-pointer font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between gap-3">
              <span>Does this replace SCELE?</span>
              <ChevronDown size={16} className="text-slate-400 shrink-0" />
            </summary>
            <p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-300">
              No. This is your personal planning companion, not an official replacement
              for SCELE. You will still submit assignments, participate in discussion
              forums, and take quizzes directly on SCELE. Each activity card includes
              direct links to the upstream SCELE page so you can verify instructions and
              submit your work.
            </p>
          </details>

          <details className="rounded-xl border border-slate-200 p-5 text-sm dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xs">
            <summary className="cursor-pointer font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between gap-3">
              <span>How does it work behind the scenes?</span>
              <ChevronDown size={16} className="text-slate-400 shrink-0" />
            </summary>
            <p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-300">
              When you sign in using Universitas Indonesia SSO (CAS), the application
              authenticates your Moodle session upstream. It discovers your active course
              enrollments and collects activity schedules, opening windows, and due dates
              across calendar events. A persistent local cache stores these definitions to
              serve subsequent requests instantly using stale-while-revalidate.
            </p>
          </details>

          <details className="rounded-xl border border-slate-200 p-5 text-sm dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xs">
            <summary className="cursor-pointer font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between gap-3">
              <span>How is my privacy and personal data protected?</span>
              <ChevronDown size={16} className="text-slate-400 shrink-0" />
            </summary>
            <p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-300">
              Your UI SSO credentials and passwords are never stored on our servers.
              Authentication produces a secure, HTTP-only session token. While general
              course structures and public assignment dates can be cached, personal
              completion evidence and student submission status are isolated per user
              account and are never visible or shared across other students.
            </p>
          </details>

          <details className="rounded-xl border border-slate-200 p-5 text-sm dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xs">
            <summary className="cursor-pointer font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between gap-3">
              <span>What key features are available?</span>
              <ChevronDown size={16} className="text-slate-400 shrink-0" />
            </summary>
            <p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-300">
              The tracker includes an <strong>Activity Feed</strong> with multi-course
              weekly schedule lanes, a full-month <strong>Course Calendar</strong> with
              activity range overlays, unified search and faceted filtering (by course,
              type, and urgency), automatic system and manual <strong>Dark Mode</strong>,
              and <strong>Backrooms</strong>: a timetable-driven vacant classroom and lab
              finder across Fasilkom buildings.
            </p>
          </details>

          <details className="rounded-xl border border-slate-200 p-5 text-sm dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xs">
            <summary className="cursor-pointer font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between gap-3">
              <span>How often is my coursework data synced?</span>
              <ChevronDown size={16} className="text-slate-400 shrink-0" />
            </summary>
            <p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-300">
              Coursework is checked whenever you open or view the application. If
              coursework data was checked within the past hour, saved cache records are
              served immediately to keep the UI fast. Background revalidation updates any
              newly posted assignments or altered due dates without freezing your browser,
              and you can trigger a manual sync at any time via the Refresh button.
            </p>
          </details>

          <details className="rounded-xl border border-slate-200 p-5 text-sm dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xs">
            <summary className="cursor-pointer font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between gap-3">
              <span>How does the Backrooms room finder work?</span>
              <ChevronDown size={16} className="text-slate-400 shrink-0" />
            </summary>
            <p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-300">
              Backrooms syncs Fasilkom academic room schedules into a persistent database
              every three days. It calculates real-time room vacancy using Asia/Jakarta
              time, showing whether a classroom or computer lab is currently free, when
              the next class begins, and full daily time slots across Gedung Baru and
              Gedung Lama.
            </p>
          </details>
        </div>
      </section>

      {/* 6. Bottom CTA Callout */}
      <section className="mx-auto w-full max-w-[1280px] px-5 md:px-10">
        <div className="relative overflow-hidden rounded-3xl border border-teal-200 dark:border-teal-800 bg-gradient-to-br from-teal-700 to-teal-900 px-6 py-12 text-center text-white shadow-xl shadow-teal-900/10 md:px-12 md:py-16">
          <div className="relative z-10 mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Ready to simplify your semester?
            </h2>
            <p className="mt-3 text-base text-teal-100 md:text-lg">
              Sign in with your Universitas Indonesia SSO credentials to access your
              courses, deadlines, and schedule in one place.
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
