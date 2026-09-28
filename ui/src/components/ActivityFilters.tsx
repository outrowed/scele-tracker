import { useState } from 'react';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';
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

export function ActivityFilters({
  items,
  value,
  onChange,
}: {
  items: Activity[];
  value: Filters;
  onChange: (value: Filters) => void;
}) {
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
  const toggle = (key: keyof Filters, option: string) =>
    onChange({
      ...value,
      [key]: value[key].includes(option)
        ? value[key].filter((id) => id !== option)
        : [...value[key], option],
    });

  return (
    <div className="my-4">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="activity-filter-panel"
        onClick={() => setOpen(!open)}
        className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition hover:border-teal-400 ${open || count ? 'border-teal-300 bg-teal-50 text-teal-800' : 'border-slate-200 bg-white text-slate-700'}`}
      >
        <SlidersHorizontal size={16} aria-hidden="true" /> Filters{' '}
        {count > 0 && (
          <span className="rounded-full bg-teal-700 px-1.5 text-xs text-white">
            {count}
          </span>
        )}{' '}
        <ChevronDown size={15} aria-hidden="true" className={open ? 'rotate-180' : ''} />
      </button>
      {count > 0 && (
        <div
          className="mt-3 flex flex-wrap items-center gap-2"
          aria-label="Selected filters"
        >
          {keys.flatMap((key) =>
            value[key].map((id) => (
              <button
                key={`${key}-${id}`}
                type="button"
                aria-label={`Remove ${labels[key]}: ${options[key].find((option) => option[0] === id)?.[1] || id}`}
                onClick={() => toggle(key, id)}
                className="inline-flex max-w-full items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-900 hover:bg-teal-100"
              >
                <span className="truncate">
                  {labels[key]}:{' '}
                  {options[key].find((option) => option[0] === id)?.[1] || id}
                </span>
                <X size={13} aria-hidden="true" />
              </button>
            )),
          )}
          <button
            type="button"
            className="px-2 py-1 text-xs font-medium text-slate-500 underline hover:text-slate-800"
            onClick={() => onChange(emptyFilters)}
          >
            Clear all
          </button>
        </div>
      )}
      {open && (
        <div
          id="activity-filter-panel"
          className="mt-3 grid gap-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4"
        >
          {keys.map((key) => (
            <fieldset key={key} className="min-w-0">
              <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {labels[key]}
              </legend>
              <div className="max-h-40 space-y-1 overflow-y-auto">
                {options[key].map(([id, label]) => (
                  <label
                    key={id}
                    className="flex cursor-pointer items-start gap-2 rounded-md px-1 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={value[key].includes(id)}
                      onChange={() => toggle(key, id)}
                      className="mt-0.5 accent-teal-700"
                    />
                    <span className="min-w-0 break-words">{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      )}
    </div>
  );
}
