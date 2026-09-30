import { Clock, ExternalLink, Info } from 'lucide-react';

export function LandingShowcases() {
  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-24 px-5 md:px-10">
      {/* 1. Activity Feed & Weekly Schedule Showcase */}
      <section
        className="grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr]"
        aria-labelledby="weekly-heading"
      >
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-teal-700 dark:text-teal-300">
            Activity Feed · Weekly Schedule
          </span>
          <h2
            id="weekly-heading"
            className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-4xl"
          >
            Know what your week is asking of you.
          </h2>
          <p className="mt-4 leading-relaxed text-slate-600 dark:text-slate-300">
            See assignments, quizzes, and deadlines from all your enrolled SCELE courses
            in one place. The weekly planner plots opening dates and deadlines across
            horizontal time lanes so you can anticipate busy stretches before they arrive.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1">
              Visual Time Lanes
            </span>
            <span className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1">
              Urgency Badges
            </span>
            <span className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1">
              Direct SCELE Links
            </span>
          </div>
        </div>

        {/* Real UI Replica: Activity Feed Preview */}
        <div
          className="rounded-2xl border border-slate-200/90 dark:border-slate-700/90 bg-slate-50/70 dark:bg-slate-900/60 p-4 md:p-6 shadow-xl shadow-slate-900/5"
          aria-label="Weekly activity feed preview"
        >
          {/* Weekday grid timeline with authentic lanes and selected day top accent */}
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs">
            <div className="grid grid-cols-7 divide-x divide-slate-100 dark:divide-slate-700 border-b border-slate-200 dark:border-slate-700 text-center text-xs">
              {[
                { day: 'Mon', date: '28' },
                { day: 'Tue', date: '29' },
                { day: 'Wed', date: '30' },
                { day: 'Thu', date: '1' },
                { day: 'Fri', date: '2', isSelected: true },
                { day: 'Sat', date: '3' },
                { day: 'Sun', date: '4' },
              ].map(({ day, date, isSelected }) => (
                <div
                  key={day}
                  className={`relative py-2.5 px-1 ${
                    isSelected
                      ? 'bg-teal-100/90 dark:bg-teal-900/90 text-teal-950 dark:text-teal-100 font-bold'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {isSelected && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 top-0 h-1 bg-teal-600"
                    />
                  )}
                  <div className="text-[10px] uppercase tracking-wider">{day}</div>
                  <div className="text-xs mt-0.5 font-semibold">{date}</div>
                </div>
              ))}
            </div>

            <div className="relative">
              {/* Background vertical column guides with selected day wash */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 grid grid-cols-7 divide-x divide-slate-100 dark:divide-slate-700/50 select-none"
              >
                <div />
                <div />
                <div />
                <div />
                <div className="bg-teal-100/20 dark:bg-teal-900/20" />
                <div />
                <div />
              </div>

              <div
                className="relative grid grid-cols-7 gap-y-2 py-3 px-1"
                style={{ gridTemplateRows: 'repeat(3, 30px)' }}
              >
                {/* Activity Bar 1: Quiz */}
                <div
                  className="flex min-w-0 items-center gap-1.5 rounded-md border border-blue-300 dark:border-blue-700 bg-blue-100 dark:bg-blue-900/80 px-2 text-left text-xs font-medium text-blue-900 dark:text-blue-100 mx-1 shadow-xs"
                  style={{ gridColumn: '2 / 5', gridRow: 1 }}
                >
                  <span className="truncate font-semibold">
                    Kuis 04: Process Scheduling
                  </span>
                  <span className="hidden sm:inline text-[10px] opacity-75 truncate">
                    · Sistem Operasi
                  </span>
                </div>

                {/* Activity Bar 2: Assignment continuing across week */}
                <div
                  className="flex min-w-0 items-center gap-1.5 rounded-md border border-emerald-300 dark:border-emerald-700 bg-emerald-100 dark:bg-emerald-900/80 px-2 text-left text-xs font-medium text-emerald-900 dark:text-emerald-100 ml-1 shadow-xs"
                  style={{ gridColumn: '1 / 6', gridRow: 2 }}
                >
                  <span className="truncate font-semibold">
                    Tugas Pemrograman 1: Tree Traversal
                  </span>
                  <span className="hidden sm:inline text-[10px] opacity-75 truncate">
                    · SDA
                  </span>
                </div>

                {/* Activity Bar 3: Assignment due Sunday */}
                <div
                  className="flex min-w-0 items-center gap-1.5 rounded-md border border-amber-300 dark:border-amber-700 bg-amber-100 dark:bg-amber-900/80 px-2 text-left text-xs font-medium text-amber-900 dark:text-amber-100 mx-1 shadow-xs"
                  style={{ gridColumn: '4 / 8', gridRow: 3 }}
                >
                  <span className="truncate font-semibold">Lab 03: Logic & Proofs</span>
                  <span className="hidden sm:inline text-[10px] opacity-75 truncate">
                    · Matematika Diskret 1
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Table snippet replicating TabularActivityList.tsx */}
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-700/60 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                    <th scope="col" className="py-2.5 pl-3 pr-2">
                      Activity Name
                    </th>
                    <th scope="col" className="px-2 py-2.5">
                      Course
                    </th>
                    <th scope="col" className="px-2 py-2.5">
                      Due Date
                    </th>
                    <th scope="col" className="py-2.5 pl-2 pr-3 text-right">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  <tr>
                    <td className="py-2.5 pl-3 pr-2 font-semibold text-slate-800 dark:text-slate-100">
                      Lab 03: Logic & Proofs
                    </td>
                    <td className="px-2 py-2.5 text-slate-600 dark:text-slate-300">
                      Matematika Diskret 1
                    </td>
                    <td className="px-2 py-2.5 text-slate-600 dark:text-slate-300">
                      4 Oct 2026, 23:59
                    </td>
                    <td className="py-2.5 pl-2 pr-3 text-right">
                      <span className="inline-flex items-center rounded-full bg-teal-50 dark:bg-teal-950 px-2 py-0.5 text-[10px] font-semibold text-teal-800 dark:text-teal-200 border border-teal-200/60 dark:border-teal-800/60">
                        Due in 2d
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pl-3 pr-2 font-semibold text-slate-800 dark:text-slate-100">
                      Kuis 04: Process Scheduling
                    </td>
                    <td className="px-2 py-2.5 text-slate-600 dark:text-slate-300">
                      Sistem Operasi
                    </td>
                    <td className="px-2 py-2.5 text-slate-600 dark:text-slate-300">
                      1 Oct 2026, 17:00
                    </td>
                    <td className="py-2.5 pl-2 pr-3 text-right">
                      <span className="inline-flex items-center rounded-full bg-teal-50 dark:bg-teal-950 px-2 py-0.5 text-[10px] font-semibold text-teal-800 dark:text-teal-200 border border-teal-200/60 dark:border-teal-800/60">
                        Due in 1d
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Courses & Calendar Showcase (Faithful to CalendarPage.tsx multi-day range-bar UI) */}
      <section
        className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]"
        aria-labelledby="calendar-heading"
      >
        {/* Real UI Replica: Calendar Month View with Detail Popover */}
        <div
          className="order-2 rounded-2xl border border-slate-200/90 dark:border-slate-700/90 bg-slate-50/70 dark:bg-slate-900/60 p-4 md:p-6 shadow-xl shadow-slate-900/5 lg:order-1"
          aria-label="Course calendar preview"
        >
          {/* Legend Strip matching CalendarPage.tsx */}
          <div className="mb-3 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  Quiz
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  Assignment
                </span>
              </span>
            </div>
          </div>

          {/* Calendar Grid Replica matching CalendarPage structure */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs">
            <div className="min-w-[620px]">
              {/* Weekday headers: Mon - Sun */}
              <div className="grid grid-cols-7 divide-x divide-slate-200 dark:divide-slate-700 border-b border-slate-200 dark:border-slate-600 bg-slate-50/75 dark:bg-slate-700 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 py-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <div key={day}>{day}</div>
                ))}
              </div>

              {/* Multi-day Weeks */}
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {/* Week 1 */}
                <div>
                  <div className="grid grid-cols-7 divide-x divide-slate-200 dark:divide-slate-700 border-b border-slate-100 dark:border-slate-600 bg-slate-50/40 dark:bg-slate-700/60 text-xs">
                    {[21, 22, 23, 24, 25, 26, 27].map((num) => (
                      <div
                        key={num}
                        className="px-2 py-1 text-right text-slate-400 font-medium"
                      >
                        {num}
                      </div>
                    ))}
                  </div>
                  <div className="relative min-h-[46px] py-1.5">
                    {/* Vertical background day column dividers */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 grid grid-cols-7 divide-x divide-slate-100 dark:divide-slate-700/50 select-none"
                    >
                      <div />
                      <div />
                      <div />
                      <div />
                      <div />
                      <div />
                      <div />
                    </div>
                    <div className="relative grid grid-cols-7 gap-y-1">
                      <div
                        className="flex min-w-0 items-center gap-1 rounded-md border border-emerald-300 dark:border-emerald-700 bg-emerald-100 dark:bg-emerald-900/80 px-2 text-xs font-medium text-emerald-900 dark:text-emerald-100 mx-1 shadow-xs"
                        style={{ gridColumn: '2 / 6', gridRow: 1 }}
                      >
                        <span className="truncate">Lab 02: Recurrence Relations</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Week 2 (Current week with active selection and popover anchor) */}
                <div>
                  <div className="grid grid-cols-7 divide-x divide-slate-200 dark:divide-slate-700 border-b border-slate-100 dark:border-slate-600 bg-slate-50/40 dark:bg-slate-700/60 text-xs">
                    {[
                      { num: 28 },
                      { num: 29 },
                      { num: 30, isSelected: true },
                      { num: 1 },
                      { num: 2 },
                      { num: 3 },
                      { num: 4 },
                    ].map(({ num, isSelected }) => (
                      <div
                        key={num}
                        className={`relative px-2 py-1 text-right font-medium ${
                          isSelected
                            ? 'bg-teal-100/90 dark:bg-teal-900/90 text-teal-950 dark:text-teal-100 font-bold'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {isSelected && (
                          <span
                            aria-hidden="true"
                            className="absolute inset-x-0 top-0 h-1 bg-teal-600"
                          />
                        )}
                        {num}
                      </div>
                    ))}
                  </div>
                  <div className="relative min-h-[68px] py-1.5">
                    {/* Vertical background day column dividers with selected column wash */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 grid grid-cols-7 divide-x divide-slate-100 dark:divide-slate-700/50 select-none"
                    >
                      <div />
                      <div />
                      <div className="bg-teal-100/20 dark:bg-teal-900/20" />
                      <div />
                      <div />
                      <div />
                      <div />
                    </div>
                    <div
                      className="relative grid grid-cols-7 gap-y-1.5"
                      style={{ gridTemplateRows: 'repeat(2, 28px)' }}
                    >
                      {/* Range Bar 1: Multi-day assignment continuing across week */}
                      <div
                        className="flex min-w-0 items-center gap-1 rounded-md border border-emerald-300 dark:border-emerald-700 bg-emerald-100 dark:bg-emerald-900/80 px-2 text-xs font-medium text-emerald-900 dark:text-emerald-100 mx-1 shadow-xs"
                        style={{ gridColumn: '1 / 6', gridRow: 1 }}
                      >
                        <span className="truncate">
                          Tugas Pemrograman 1: Tree Traversal
                        </span>
                      </div>
                      {/* Range Bar 2: Single-day Quiz focused/selected on Wed 30 */}
                      <div
                        className="flex min-w-0 items-center gap-1 rounded-md border border-blue-400 dark:border-blue-600 bg-blue-100 dark:bg-blue-900 px-2 text-xs font-semibold text-blue-900 dark:text-blue-100 mx-1 shadow-xs ring-2 ring-teal-600 ring-offset-1 dark:ring-offset-slate-800"
                        style={{ gridColumn: '3 / 4', gridRow: 2 }}
                      >
                        <span className="truncate">Kuis Mingguan 04</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Realistic Floating Activity Inspect Popover (matching CalendarPage detail drawer) */}
            <div className="m-3 overflow-hidden rounded-xl border border-teal-200 dark:border-teal-800 bg-white dark:bg-slate-900 shadow-xl shadow-teal-900/10">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Wed, 30 Sep 2026
                  </span>
                  <span className="rounded-full bg-blue-50 dark:bg-blue-950 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                    Quiz
                  </span>
                </div>
                <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
                  Closes at 17:00 WIB
                </span>
              </div>
              <div className="p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    Kuis Mingguan 04: Process Scheduling
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                    Sistem Operasi · 45 min duration
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 dark:bg-teal-950 px-3 py-1.5 text-xs font-semibold text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800 shadow-2xs">
                  Open in SCELE <ExternalLink size={12} />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Copy */}
        <div className="order-1 lg:order-2">
          <span className="text-xs font-bold uppercase tracking-widest text-teal-700 dark:text-teal-300">
            Courses · Calendar
          </span>
          <h2
            id="calendar-heading"
            className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-4xl"
          >
            Zoom out before deadlines sneak up.
          </h2>
          <p className="mt-4 leading-relaxed text-slate-600 dark:text-slate-300">
            Browse activities by course or look across the whole month in the calendar.
            Spot clusters of deadlines, plan study sessions around your heaviest weeks,
            and click any item to see submission guidelines and direct SCELE links.
          </p>
        </div>
      </section>

      {/* 3. Beyond Deadlines · Backrooms Showcase (Faithful to FreeRoomsPage.tsx) */}
      <section
        className="overflow-hidden rounded-3xl border border-teal-200/80 bg-teal-50/70 p-6 dark:border-teal-900/80 dark:bg-teal-950/40 md:p-10"
        aria-labelledby="backrooms-heading"
      >
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-teal-700 dark:text-teal-300">
              Beyond Deadlines · Backrooms
            </span>
            <h2
              id="backrooms-heading"
              className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-4xl"
            >
              Find a room between classes.
            </h2>
            <p className="mt-4 leading-relaxed text-slate-600 dark:text-slate-300">
              Backrooms turns the room timetable into a practical finder. Check scheduled
              classes, see which rooms are free right now or later today, and filter by
              building, room type, or vacancy before walking across campus.
            </p>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Availability is based on timetable data; always verify room availability in
              person before settling in.
            </p>
          </div>

          {/* Real UI Replica: Backrooms Room Cards matching FreeRoomsPage.tsx */}
          <div
            className="space-y-3"
            aria-label="Illustrative Backrooms room status preview"
          >
            {/* Room Card 1: Vacant Classroom */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="inline-flex items-center rounded-xl bg-teal-50 dark:bg-teal-950 px-2.5 py-1 text-xs font-mono font-bold tracking-wider text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800">
                    A1.09
                  </span>
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400">
                    <Info size={13} />
                  </span>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                    Gedung A
                  </span>
                </div>
                <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                  Classroom
                </span>
              </div>

              {/* Vacancy status strip */}
              <div className="mt-3 flex items-center justify-between rounded-lg bg-emerald-50/90 dark:bg-emerald-950/80 px-2.5 py-1.5 text-xs text-emerald-900 dark:text-emerald-100 border border-emerald-200 dark:border-emerald-800">
                <span className="flex items-center gap-1.5 font-semibold">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Vacant right now
                </span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                  Free until 14:00
                </span>
              </div>

              {/* Schedule slot timeline */}
              <div className="mt-2.5 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <Clock size={12} />
                <span>Next class at 14:00 · Arsitektur Komputer</span>
              </div>
            </div>

            {/* Room Card 2: Occupied Lab */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="inline-flex items-center rounded-xl bg-teal-50 dark:bg-teal-950 px-2.5 py-1 text-xs font-mono font-bold tracking-wider text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800">
                    Lab 1201
                  </span>
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400">
                    <Info size={13} />
                  </span>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                    Gedung B
                  </span>
                </div>
                <span className="rounded-full bg-blue-50 dark:bg-blue-950 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                  Lab
                </span>
              </div>

              {/* Occupied status strip */}
              <div className="mt-3 flex items-center justify-between rounded-lg bg-amber-50/80 dark:bg-amber-950/70 px-2.5 py-1.5 text-xs text-amber-900 dark:text-amber-100 border border-amber-200 dark:border-amber-800">
                <span className="font-semibold">Occupied: Jaringan Komputer</span>
                <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                  Free at 13:30
                </span>
              </div>

              <div className="mt-2.5 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <Clock size={12} />
                <span>Vacant window: 13:30 – 17:00</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
