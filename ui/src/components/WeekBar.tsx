import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Activity } from '../model';
import type { PlannerDay } from '../planner';

interface WeekBarProps {
  days: PlannerDay[];
  weekLabel: string;
  weekOffset: number;
  selectedDayKey: string | null;
  onSelectDay: (dateKey: string | null) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onCurrentWeek: () => void;
  onSelectActivity?: (item: Activity) => void;
}

export function WeekBar({
  days,
  weekLabel,
  weekOffset,
  selectedDayKey,
  onSelectDay,
  onPrevWeek,
  onNextWeek,
  onCurrentWeek,
}: WeekBarProps) {
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
          {weekOffset !== 0 && (
            <button
              type="button"
              onClick={onCurrentWeek}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-teal-400 hover:text-teal-700"
            >
              Current week
            </button>
          )}
          <button
            type="button"
            onClick={onPrevWeek}
            aria-label="Previous week"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-teal-400 hover:text-teal-700"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={onNextWeek}
            aria-label="Next week"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-teal-400 hover:text-teal-700"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* 7-day grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7 md:gap-3">
        {days.map((day) => {
          const isSelected = selectedDayKey === day.dateKey;
          const totalTasks = day.quizzes.length + day.assignments.length;

          return (
            <div
              key={day.dateKey}
              onClick={() => onSelectDay(isSelected ? null : day.dateKey)}
              className={`flex cursor-pointer flex-col justify-between rounded-xl border p-3 transition ${
                isSelected
                  ? 'border-teal-600 bg-teal-50/70 ring-2 ring-teal-600 ring-offset-1'
                  : day.isToday
                    ? 'border-teal-300 bg-teal-50/30 hover:border-teal-500 hover:bg-teal-50/50'
                    : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {/* Day title & number */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {day.dayName}
                </span>
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    day.isToday
                      ? 'bg-teal-700 text-white'
                      : isSelected
                        ? 'bg-teal-100 text-teal-800'
                        : 'text-slate-700'
                  }`}
                >
                  {day.dayNumber}
                </span>
              </div>

              {/* Badges / indicators for blue quizzes and green assignments */}
              <div className="mt-3 flex min-h-[42px] flex-col gap-1.5">
                {totalTasks === 0 ? (
                  <span className="text-[11px] text-slate-400">No deadlines</span>
                ) : (
                  <>
                    {day.quizzes.length > 0 && (
                      <div
                        className="flex items-center justify-between rounded-md bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700 border border-blue-200/60"
                        title={`${day.quizzes.length} quiz${day.quizzes.length > 1 ? 'zes' : ''}`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                          <span>Quiz</span>
                        </span>
                        <span className="font-bold">{day.quizzes.length}</span>
                      </div>
                    )}
                    {day.assignments.length > 0 && (
                      <div
                        className="flex items-center justify-between rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 border border-emerald-200/60"
                        title={`${day.assignments.length} assignment${day.assignments.length > 1 ? 's' : ''}`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                          <span>Assignment</span>
                        </span>
                        <span className="font-bold">{day.assignments.length}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Status pill or click hint */}
              <div className="mt-2 text-right">
                {day.isToday && (
                  <span className="inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-teal-700 bg-teal-100/80">
                    Today
                  </span>
                )}
              </div>
            </div>
          );
        })}
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
