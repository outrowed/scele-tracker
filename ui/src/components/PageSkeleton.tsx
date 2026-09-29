import {
  BookOpen,
  Calendar,
  CalendarDays,
  Clock3,
  Layers3,
  Loader2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Timer,
} from 'lucide-react';
import { Container } from './Container';
import { PageHeader, SectionTitle } from './Typography';

export function TabularActivitySkeleton() {
  const rows = [
    { nameWidth: 'w-48 sm:w-64', typeWidth: 'w-20', courseWidth: 'w-32', dueWidth: 'w-28' },
    { nameWidth: 'w-40 sm:w-52', typeWidth: 'w-16', courseWidth: 'w-40', dueWidth: 'w-24' },
    { nameWidth: 'w-56 sm:w-72', typeWidth: 'w-20', courseWidth: 'w-28', dueWidth: 'w-32' },
    { nameWidth: 'w-36 sm:w-48', typeWidth: 'w-16', courseWidth: 'w-36', dueWidth: 'w-28' },
    { nameWidth: 'w-44 sm:w-60', typeWidth: 'w-20', courseWidth: 'w-44', dueWidth: 'w-24' },
  ];

  return (
    <div
      className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs"
      aria-label="Loading activities table"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/75 dark:bg-slate-700 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
              <th scope="col" className="py-3.5 pl-4 pr-3.5 sm:pl-6 min-w-[180px]">
                Activity Name
              </th>
              <th scope="col" className="whitespace-nowrap px-3.5 py-3.5">
                Type
              </th>
              <th scope="col" className="px-3.5 py-3.5 min-w-[160px] max-w-[260px]">
                Course
              </th>
              <th scope="col" className="whitespace-nowrap px-3.5 py-3.5 min-w-[140px]">
                Due Date
              </th>
              <th
                scope="col"
                className="whitespace-nowrap py-3.5 pl-3.5 pr-4 sm:pr-6 text-right"
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {rows.map((row, idx) => (
              <tr key={idx} className="animate-pulse">
                <td className="py-3.5 pl-4 pr-3.5 sm:pl-6">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-slate-200 dark:bg-slate-600 shrink-0" />
                    <div
                      className={`h-4 ${row.nameWidth} rounded bg-slate-200 dark:bg-slate-700`}
                    />
                  </div>
                </td>
                <td className="whitespace-nowrap px-3.5 py-3.5">
                  <div
                    className={`h-5 ${row.typeWidth} rounded-md bg-slate-200/80 dark:bg-slate-700/80`}
                  />
                </td>
                <td className="px-3.5 py-3.5">
                  <div
                    className={`h-4 ${row.courseWidth} rounded bg-slate-200 dark:bg-slate-700`}
                  />
                </td>
                <td className="whitespace-nowrap px-3.5 py-3.5">
                  <div
                    className={`h-4 ${row.dueWidth} rounded bg-slate-200 dark:bg-slate-700`}
                  />
                </td>
                <td className="whitespace-nowrap py-3.5 pl-3.5 pr-4 sm:pr-6 text-right">
                  <div className="ml-auto h-6 w-20 rounded-full bg-slate-200/80 dark:bg-slate-700/80" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <Container as="main" className="py-10 md:py-14" aria-busy="true" aria-live="polite">
      {/* Page header */}
      <PageHeader
        title="Activity feed"
        description="Plan your quizzes, assignments, and deadlines with the weekly schedule and activity table."
        action={
          <div className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-400 dark:text-slate-500 shadow-xs cursor-wait">
            <RefreshCw size={16} className="animate-spin text-teal-600 dark:text-teal-400" />
            <span>Connecting…</span>
          </div>
        }
      />

      {/* Subtle status notice */}
      <div className="my-6 flex items-center gap-3 rounded-xl border border-teal-200/80 dark:border-teal-800/80 bg-teal-50/70 dark:bg-teal-950/60 px-4 py-3 text-xs font-medium text-teal-900 dark:text-teal-200 shadow-2xs">
        <Loader2 size={16} className="animate-spin text-teal-600 dark:text-teal-400 shrink-0" />
        <span>Checking your SCELE session and synchronizing courses…</span>
      </div>

      {/* Week planner skeleton */}
      <section className="my-8" aria-label="Weekly planner loading skeleton">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 md:text-lg">
              Weekly Schedule
            </h2>
            <div className="h-5 w-24 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
          </div>
          <div className="h-6 w-14 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
        </div>
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          Bars span opening to closing/due date, inclusive. Arrows indicate continuation outside this week.
        </p>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs">
          <div className="min-w-[700px]">
            <div className="grid grid-cols-7 divide-x divide-slate-200 dark:divide-slate-700 border-b border-slate-200 dark:border-slate-700">
              {days.map((day) => (
                <div key={day} className="flex items-center justify-between px-3 py-3 text-sm">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">{day}</span>
                  <div className="h-4 w-10 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                </div>
              ))}
            </div>
            <div
              className="relative grid grid-cols-7 gap-y-2 py-3 px-1"
              style={{ gridTemplateRows: 'repeat(3, 34px)' }}
            >
              <div
                className="flex items-center gap-2 rounded-md border border-slate-200/80 dark:border-slate-700/80 bg-slate-100/80 dark:bg-slate-700/50 px-2 mx-1 animate-pulse"
                style={{ gridColumn: '2 / 4', gridRow: 1 }}
              >
                <div className="h-3 w-28 rounded bg-slate-200 dark:bg-slate-600" />
              </div>
              <div
                className="flex items-center gap-2 rounded-l-md border-y border-l border-slate-200/80 dark:border-slate-700/80 bg-slate-100/80 dark:bg-slate-700/50 px-2 ml-1 animate-pulse"
                style={{ gridColumn: '1 / 6', gridRow: 2 }}
              >
                <div className="h-3 w-40 rounded bg-slate-200 dark:bg-slate-600" />
              </div>
              <div
                className="flex items-center gap-2 rounded-md border border-slate-200/80 dark:border-slate-700/80 bg-slate-100/80 dark:bg-slate-700/50 px-2 mx-1 animate-pulse"
                style={{ gridColumn: '5 / 8', gridRow: 3 }}
              >
                <div className="h-3 w-32 rounded bg-slate-200 dark:bg-slate-600" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main activities section */}
      <section className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <SectionTitle>Activities</SectionTitle>
        </div>

        {/* Filter toolbar placeholder */}
        <div className="mb-6 flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[220px]">
            <div className="flex h-11 w-full items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 shadow-xs text-slate-400 dark:text-slate-500 text-sm">
              <Search size={17} className="shrink-0 text-slate-400" />
              <div className="h-4 w-44 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            </div>
          </div>
          <div className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 text-sm font-semibold text-slate-400 dark:text-slate-500 shadow-xs">
            <SlidersHorizontal size={15} />
            <span>Filters</span>
          </div>
        </div>

        {/* Table skeleton */}
        <TabularActivitySkeleton />
      </section>
    </Container>
  );
}

export function CoursesSkeleton() {
  return (
    <Container as="main" className="py-10 md:py-14" aria-busy="true" aria-live="polite">
      <PageHeader
        title="Courses"
        description="View and browse all enrolled courses, assignments, and quizzes."
        action={
          <div className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-400 dark:text-slate-500 shadow-xs cursor-wait">
            <RefreshCw size={16} className="animate-spin text-teal-600 dark:text-teal-400" />
            <span>Connecting…</span>
          </div>
        }
      />

      {/* Subtle status notice */}
      <div className="my-6 flex items-center gap-3 rounded-xl border border-teal-200/80 dark:border-teal-800/80 bg-teal-50/70 dark:bg-teal-950/60 px-4 py-3 text-xs font-medium text-teal-900 dark:text-teal-200 shadow-2xs">
        <Loader2 size={16} className="animate-spin text-teal-600 dark:text-teal-400 shrink-0" />
        <span>Loading enrolled courses and course activities…</span>
      </div>

      {/* Activity summary cards skeleton */}
      <section
        className="my-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5"
        aria-label="Course activity summary loading skeleton"
      >
        {[
          { icon: Clock3, title: 'Upcoming' },
          { icon: Timer, title: 'Deadlines passed' },
          { icon: BookOpen, title: 'Courses' },
          { icon: CalendarDays, title: 'Without dates' },
        ].map(({ icon: Icon, title }) => (
          <div
            key={title}
            className="flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-xs animate-pulse"
          >
            <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 text-sm font-medium">
              <Icon size={18} className="text-slate-400" />
              <span>{title}</span>
            </div>
            <div className="mt-4 h-8 w-12 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        ))}
      </section>

      {/* Course group card skeletons */}
      <div className="flex flex-col gap-6">
        {[1, 2].map((idx) => (
          <div
            key={idx}
            className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 bg-slate-50/75 dark:bg-slate-700 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-teal-200/80 dark:border-teal-800/80 bg-teal-50 dark:bg-teal-950 p-2 text-teal-700 dark:text-teal-300">
                  <BookOpen size={18} />
                </div>
                <div className="h-5 w-48 rounded bg-slate-200 dark:bg-slate-600 animate-pulse" />
              </div>
              <div className="h-5 w-20 rounded-full bg-slate-200 dark:bg-slate-600 animate-pulse" />
            </div>
            <div className="p-5">
              <div className="space-y-3">
                <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}

export function CalendarSkeleton() {
  return (
    <Container as="main" className="py-10 md:py-14" aria-busy="true" aria-live="polite">
      <PageHeader
        title="Calendar"
        description="View scheduled deadlines and quiz windows across the month."
      />

      <div className="my-6 flex items-center gap-3 rounded-xl border border-teal-200/80 dark:border-teal-800/80 bg-teal-50/70 dark:bg-teal-950/60 px-4 py-3 text-xs font-medium text-teal-900 dark:text-teal-200 shadow-2xs">
        <Loader2 size={16} className="animate-spin text-teal-600 dark:text-teal-400 shrink-0" />
        <span>Loading calendar activities and deadlines…</span>
      </div>

      <div className="my-6 flex items-center justify-between">
        <div className="h-7 w-36 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="h-9 w-9 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs p-4">
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-xl border border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-750/30 p-2 animate-pulse"
            >
              <div className="h-3 w-5 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}

export function ActivityDetailsSkeleton() {
  return (
    <Container as="main" className="py-10 md:py-14" aria-busy="true" aria-live="polite">
      <div className="mb-4 h-4 w-16 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
      <div className="mb-2 h-8 w-72 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
      <div className="mb-8 h-4 w-96 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-xs animate-pulse">
          <div className="mb-4 h-5 w-32 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="space-y-3">
            <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-5/6 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-4/6 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-xs animate-pulse">
          <div className="mb-4 h-5 w-24 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="space-y-4">
            <div className="h-8 w-full rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-8 w-full rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-8 w-full rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      </div>
    </Container>
  );
}

export function PageSkeleton({ pathname }: { pathname: string }) {
  if (pathname.startsWith('/courses')) {
    return <CoursesSkeleton />;
  }
  if (pathname.startsWith('/calendar')) {
    return <CalendarSkeleton />;
  }
  if (pathname.startsWith('/activities/')) {
    return <ActivityDetailsSkeleton />;
  }
  return <DashboardSkeleton />;
}
