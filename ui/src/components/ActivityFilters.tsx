import { useState } from 'react';
import { ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react';
import type { Activity } from '../model';
import { personalStatus, status } from '../model';

export type Filters = {
  kind: string[];
  course: string[];
  progress: string[];
  deadline: string[];
};
export const emptyFilters: Filters = { kind: [], course: [], progress: [], deadline: [] };
export function matchesFilters(item: Activity, filters: Filters, now: number) {
  return Object.entries({
    kind: item.kind,
    course: String(item.courseId),
    progress: personalStatus(item, now),
    deadline: status(item, now),
  }).every(
    ([key, value]) =>
      !filters[key as keyof Filters].length ||
      filters[key as keyof Filters].includes(value),
  );
}

export interface ActivityFiltersProps {
  items: Activity[];
  value: Filters;
  onChange: (value: Filters) => void;
  search?: string;
  onSearchChange?: (query: string) => void;
  selectedDayKey?: string | null;
  onClearDay?: () => void;
  className?: string;
}

export function ActivityFilters({
  items,
  value,
  onChange,
  search,
  onSearchChange,
  selectedDayKey,
  onClearDay,
  className = '',
}: ActivityFiltersProps) {
  const [open, setOpen] = useState(false);
  const options: Record<keyof Filters, [string, string][]> = {
    kind: [
      ['assignment', 'Assignment'],
      ['quiz', 'Quiz'],
    ],
    course: [
      ...new Map(items.map((item) => [String(item.courseId), item.courseName])).entries(),
    ],
    progress: [
      ['completed', 'Completed'],
      ['pending', 'Available / to do'],
      ['missed', 'Overdue'],
      ['closed', 'Closed'],
      ['unknown', 'Loading / unverified'],
    ],
    deadline: [
      ['upcoming', 'Upcoming'],
      ['past', 'Passed'],
      ['undated', 'Undated'],
    ],
  };
  const labels: Record<keyof Filters, string> = {
    kind: 'Type',
    course: 'Course',
    progress: 'Progress',
    deadline: 'Deadline',
  };
  const keys = Object.keys(options) as (keyof Filters)[];
  const count = keys.reduce((sum, key) => sum + value[key].length, 0);
  const hasActiveFilters = count > 0 || Boolean(selectedDayKey);

  const toggle = (key: keyof Filters, option: string) =>
    onChange({
      ...value,
      [key]: value[key].includes(option)
        ? value[key].filter((id) => id !== option)
        : [...value[key], option],
    });

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Top toolbar row sitting directly on page background */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {onSearchChange !== undefined && (
          <label className="flex h-11 flex-1 items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 text-slate-400 dark:text-slate-500 shadow-xs transition focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500">
            <Search size={17} className="shrink-0" />
            <input
              aria-label="Search activities"
              placeholder="Search activities or courses…"
              value={search ?? ''}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-full w-full min-w-0 bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
            />
            {Boolean(search) && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => onSearchChange('')}
                className="rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={15} />
              </button>
            )}
          </label>
        )}

        <button
          type="button"
          aria-expanded={open}
          aria-controls="activity-filter-panel"
          onClick={() => setOpen(!open)}
          className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border px-4 text-sm font-semibold shadow-xs transition cursor-pointer select-none ${
            open || count > 0
              ? 'border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-200'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-teal-400 dark:hover:border-teal-600'
          }`}
        >
          <SlidersHorizontal size={16} aria-hidden="true" />
          <span>Filters</span>
          {count > 0 && (
            <span className="rounded-full bg-teal-700 dark:bg-teal-600 px-1.5 py-0.5 text-[11px] font-bold text-white leading-none">
              {count}
            </span>
          )}
          <ChevronDown
            size={14}
            aria-hidden="true"
            className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Expandable multi-facet filter panel sitting directly on background as its own card */}
      {open && (
        <div
          id="activity-filter-panel"
          className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-xs"
        >
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {keys.map((key) => (
              <fieldset key={key} className="min-w-0">
                <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {labels[key]}
                </legend>
                <div className="max-h-44 space-y-1 overflow-y-auto pr-1">
                  {options[key].map(([id, label]) => (
                    <label
                      key={id}
                      className="flex cursor-pointer items-start gap-2 rounded-md px-1.5 py-1 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                    >
                      <input
                        type="checkbox"
                        checked={value[key].includes(id)}
                        onChange={() => toggle(key, id)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-600 accent-teal-700 cursor-pointer"
                      />
                      <span className="min-w-0 break-words leading-tight">{label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        </div>
      )}

      {/* Active filter pills tray directly on background */}
      {hasActiveFilters && (
        <div
          className="flex flex-wrap items-center gap-2 pt-0.5"
          aria-label="Selected filters"
        >
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 mr-0.5">
            Active:
          </span>
          {selectedDayKey && onClearDay && (
            <button
              type="button"
              aria-label={`Remove Date: ${selectedDayKey}`}
              onClick={onClearDay}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950 px-2.5 py-1 text-xs font-medium text-teal-900 dark:text-teal-100 hover:bg-teal-100 dark:hover:bg-teal-900 transition cursor-pointer"
            >
              <span className="truncate">Date: {selectedDayKey}</span>
              <X size={12} aria-hidden="true" />
            </button>
          )}
          {keys.flatMap((key) =>
            value[key].map((id) => (
              <button
                key={`${key}-${id}`}
                type="button"
                aria-label={`Remove ${labels[key]}: ${options[key].find((option) => option[0] === id)?.[1] || id}`}
                onClick={() => toggle(key, id)}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950 px-2.5 py-1 text-xs font-medium text-teal-900 dark:text-teal-100 hover:bg-teal-100 dark:hover:bg-teal-900 transition cursor-pointer"
              >
                <span className="truncate">
                  {labels[key]}:{' '}
                  {options[key].find((option) => option[0] === id)?.[1] || id}
                </span>
                <X size={12} aria-hidden="true" />
              </button>
            )),
          )}
          <button
            type="button"
            className="text-xs font-medium text-slate-500 dark:text-slate-400 underline hover:text-slate-800 dark:hover:text-slate-100 transition cursor-pointer"
            onClick={() => {
              onChange(emptyFilters);
              onClearDay?.();
            }}
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
