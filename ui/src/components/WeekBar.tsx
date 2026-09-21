import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Activity } from '../model';
import { weekRanges, type PlannerDay } from '../planner';
import { dateLabel } from '../model';

interface WeekBarProps {
  days: PlannerDay[];
  activities?: Activity[];
  weekLabel: string;
  dayOffset: number;
  selectedDayKey: string | null;
  onSelectDay: (dateKey: string | null) => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
  onSelectActivity?: (item: Activity) => void;
}

export function WeekBar({
  days,
  activities,
  onSelectActivity,
  weekLabel,
  dayOffset,
  selectedDayKey,
  onSelectDay,
  onPrevDay,
  onNextDay,
  onToday,
}: WeekBarProps) {
  const items = activities ?? [
    ...new Map(
      days
        .flatMap((day) => [...day.quizzes, ...day.assignments])
        .map((item) => [item.id, item]),
    ).values(),
  ];
  const ranges = weekRanges(items, days);
  const lanes = Math.max(3, ...ranges.map((range) => range.lane + 1));
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs md:p-5">
      {/* Header controls for week navigation */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-slate-800 md:text-lg">
            Weekly Schedule
          </h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            {weekLabel}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {dayOffset !== 0 && (
            <button
              type="button"
              onClick={onToday}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-teal-400 hover:text-teal-700"
            >
              Today
            </button>
          )}
          <button
            type="button"
            onClick={onPrevDay}
            aria-label="Previous day"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-teal-400 hover:text-teal-700"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={onNextDay}
            aria-label="Next day"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-teal-400 hover:text-teal-700"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <p className="mb-3 text-xs text-slate-500">
        Bars span opening to closing/due date, inclusive. Arrows indicate continuation
        outside this week. A single known date is shown on that day; cut-off dates do not
        extend the bar.
      </p>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-7 divide-x divide-slate-200 border-b border-slate-200">
            {days.map((day) => (
              <button
                key={day.dateKey}
                type="button"
                aria-label={`Filter activities on ${day.dateKey}`}
                aria-pressed={selectedDayKey === day.dateKey}
                onClick={() =>
                  onSelectDay(selectedDayKey === day.dateKey ? null : day.dateKey)
                }
                className={`relative flex items-center justify-between px-3 py-3 text-sm transition ${
                  selectedDayKey === day.dateKey
                    ? 'bg-teal-100 text-teal-900'
                    : day.isToday
                      ? 'bg-teal-50 text-teal-800'
                      : 'bg-slate-50 text-slate-600 hover:bg-teal-50'
                }`}
              >
                {/* Top accent bar for today */}
                {day.isToday && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-1 bg-teal-600"
                  />
                )}
                <span>{day.dayName}</span>
                <span className="font-semibold">
                  {day.dayNumber} {day.monthName}
                </span>
              </button>
            ))}
          </div>
          <div className="relative">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 grid grid-cols-7 divide-x divide-slate-200 select-none"
            >
              {days.map((day) => (
                <div
                  key={day.dateKey}
                  className={`flex items-center justify-center ${
                    selectedDayKey === day.dateKey
                      ? 'bg-teal-100/40'
                      : day.isToday
                        ? 'bg-teal-50/40'
                        : ''
                  }`}
                >
                  {day.isToday && (
                    <span className="text-xs md:text-sm font-bold tracking-widest text-teal-800/20 uppercase">
                      TODAY
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div
              className="relative grid grid-cols-7 gap-y-2 py-3"
              style={{ gridTemplateRows: `repeat(${lanes}, 36px)` }}
            >
              {ranges.map(
                ({ item, start, end, lane, continuesBefore, continuesAfter }) => {
                  const label = `${item.name} · ${item.courseName} · Opens: ${dateLabel(item.opensAt)} · Closes/due: ${dateLabel(item.dueAt)}`;
                  const className = `mx-1 flex min-w-0 items-center gap-1 rounded-md border px-2 text-left text-xs font-medium ${item.kind === 'quiz' ? 'border-blue-300 bg-blue-100 text-blue-900 hover:bg-blue-200' : 'border-emerald-300 bg-emerald-100 text-emerald-900 hover:bg-emerald-200'}`;
                  const style = {
                    gridColumn: `${start + 1} / ${end + 2}`,
                    gridRow: lane + 1,
                  };
                  const content = (
                    <>
                      {continuesBefore && <span aria-hidden="true">←</span>}
                      <span className="truncate">{item.name}</span>
                      {continuesAfter && (
                        <span className="ml-auto" aria-hidden="true">
                          →
                        </span>
                      )}
                    </>
                  );
                  return onSelectActivity ? (
                    <button
                      key={item.id}
                      type="button"
                      title={label}
                      aria-label={label}
                      className={className}
                      style={style}
                      onClick={() => onSelectActivity(item)}
                    >
                      {content}
                    </button>
                  ) : (
                    <a
                      key={item.id}
                      href={`/activities/${encodeURIComponent(item.id)}`}
                      title={label}
                      aria-label={label}
                      className={className}
                      style={style}
                    >
                      {content}
                    </a>
                  );
                },
              )}
              {!ranges.length && (
                <p className="col-span-7 px-4 text-sm text-slate-500">
                  No activity ranges this week.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Legend & Filter indicator */}
      <div className="mt-3 flex flex-wrap items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
            <span className="font-medium text-slate-700">Quiz</span> (Blue)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
            <span className="font-medium text-slate-700">Assignment</span> (Green)
          </span>
        </div>
        {selectedDayKey && (
          <div className="flex items-center gap-2">
            <span>
              Filtering by: <strong className="text-slate-800">{selectedDayKey}</strong>
            </span>
            <button
              type="button"
              onClick={() => onSelectDay(null)}
              className="text-teal-700 hover:underline font-medium"
            >
              Clear filter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
