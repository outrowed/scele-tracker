import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, dateLabel, type Activity } from '../model';
import { dayKey, monthDays, shiftMonth } from '../calendar';
import { activityRange, weekRanges } from '../planner';
import { Container } from '../components/Container';
import { DataStatusNotice } from '../components/DataStatusNotice';
import styles from './DashboardPage.module.css';
import { PageHeader, SectionDescription } from '../components/Typography';

function formatPopupDate(dateKeyStr: string) {
  const [y, m, d] = dateKeyStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export default function CalendarPage() {
  const [snapshot, setSnapshot] = useState<{
    activities: Activity[];
    incomplete?: boolean;
    stale?: boolean;
    preparing?: boolean;
  } | null>(null);
  const [error, setError] = useState('');
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [course, setCourse] = useState('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [anchorInfo, setAnchorInfo] = useState<{
    type: 'date' | 'activity';
    key: string;
  } | null>(null);
  const [anchorRect, setAnchorRect] = useState<{
    top: number;
    left: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
  } | null>(null);
  const [popupHeight, setPopupHeight] = useState<number>(0);

  const calendarRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    api<{
      activities: Activity[];
      incomplete?: boolean;
      stale?: boolean;
      preparing?: boolean;
    }>('/api/activities')
      .then((data) => {
        if (active) setSnapshot(data);
      })
      .catch((err) => {
        if (active) setError((err as Error).message);
      });
    return () => {
      active = false;
    };
  }, []);

  // Close popup on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedDate(null);
        setSelectedActivityId(null);
        setAnchorRect(null);
        setAnchorInfo(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Dismiss popup when clicking blank space outside popup and interactive elements
  useEffect(() => {
    if (!selectedDate) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (popupRef.current && popupRef.current.contains(e.target as Node)) {
        return;
      }
      const target = e.target as HTMLElement | null;
      if (target && target.closest('button, a, select, input, [data-calendar-item="true"]')) {
        return;
      }
      setSelectedDate(null);
      setSelectedActivityId(null);
      setAnchorRect(null);
      setAnchorInfo(null);
    };
    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [selectedDate]);

  // Track anchor position on window scroll, calendar container scroll, and resize
  useEffect(() => {
    if (!anchorInfo) return;
    const updatePosition = () => {
      let activeEl: HTMLElement | null = null;
      if (anchorInfo.type === 'date') {
        activeEl = document.querySelector(`[data-day-key="${anchorInfo.key}"]`);
      } else if (anchorInfo.type === 'activity') {
        activeEl = document.querySelector(`[data-activity-key="${anchorInfo.key}"]`);
      }
      if (activeEl) {
        const rect = activeEl.getBoundingClientRect();
        setAnchorRect({
          top: rect.top,
          left: rect.left,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
        });
      }
    };

    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition, { passive: true });
    const calEl = calendarRef.current;
    if (calEl) {
      calEl.addEventListener('scroll', updatePosition, { passive: true });
    }

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
      if (calEl) {
        calEl.removeEventListener('scroll', updatePosition);
      }
    };
  }, [anchorInfo]);

  // Measure popup height to guarantee vertical window containment
  useLayoutEffect(() => {
    if (selectedDate && popupRef.current) {
      const h = popupRef.current.offsetHeight;
      if (h > 0 && h !== popupHeight) {
        setPopupHeight(h);
      }
    } else if (!selectedDate && popupHeight !== 0) {
      setPopupHeight(0);
    }
  }, [selectedDate, selectedActivityId, popupHeight]);

  const activities = snapshot?.activities || [];
  const today = dayKey(Date.now() / 1000);
  const filtered = activities.filter(
    (item) => course === 'all' || String(item.courseId) === course,
  );
  const courses = [
    ...new Map(activities.map((item) => [item.courseId, item.courseName])).entries(),
  ];
  const title = new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${month}-01T00:00:00Z`));

  // Break month into 7-day week chunks
  const allDays = monthDays(month);
  const weeks: string[][] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }

  // Activities on the selected date
  const selectedDateActivities = selectedDate
    ? filtered.filter((act) => {
        const range = activityRange(act);
        return range && range.start <= selectedDate && selectedDate <= range.end;
      })
    : [];

  const focusedActivity = selectedActivityId
    ? activities.find((act) => act.id === selectedActivityId) || null
    : selectedDateActivities[0] || null;

  const handleSelectDay = (day: string, e?: React.MouseEvent) => {
    if (selectedDate === day && anchorInfo?.type === 'date') {
      setSelectedDate(null);
      setSelectedActivityId(null);
      setAnchorRect(null);
      setAnchorInfo(null);
      return;
    }
    setSelectedDate(day);
    setAnchorInfo({ type: 'date', key: day });
    const dayActs = filtered.filter((act) => {
      const range = activityRange(act);
      return range && range.start <= day && day <= range.end;
    });
    setSelectedActivityId(dayActs.length > 0 ? dayActs[0].id : null);
    if (e?.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      setAnchorRect({
        top: rect.top,
        left: rect.left,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      });
    }
  };

  const handleSelectActivity = (
    item: Activity,
    weekDays: { dateKey: string }[],
    activityKey: string,
    e?: React.MouseEvent,
  ) => {
    if (
      selectedActivityId === item.id &&
      anchorInfo?.type === 'activity' &&
      anchorInfo?.key === activityKey
    ) {
      setSelectedDate(null);
      setSelectedActivityId(null);
      setAnchorRect(null);
      setAnchorInfo(null);
      return;
    }

    const weekDayKeys = weekDays.map((d) => d.dateKey);
    const dueKey = item.dueAt ? dayKey(item.dueAt) : null;
    const openKey = item.opensAt ? dayKey(item.opensAt) : null;
    let targetDate = weekDayKeys[0];
    if (dueKey && weekDayKeys.includes(dueKey)) {
      targetDate = dueKey;
    } else if (openKey && weekDayKeys.includes(openKey)) {
      targetDate = openKey;
    } else {
      const match = weekDayKeys.find((d) => {
        const r = activityRange(item);
        return r && r.start <= d && d <= r.end;
      });
      if (match) targetDate = match;
    }

    setSelectedDate(targetDate);
    setSelectedActivityId(item.id);
    setAnchorInfo({ type: 'activity', key: activityKey });

    const anchorEl = e?.currentTarget as HTMLElement | undefined;
    if (anchorEl) {
      const rect = anchorEl.getBoundingClientRect();
      setAnchorRect({
        top: rect.top,
        left: rect.left,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      });
    }
  };

  const getPopupStyle = (): React.CSSProperties => {
    if (typeof window === 'undefined') return {};
    const isMobile = window.innerWidth < 768;
    if (isMobile || !anchorRect || (anchorRect.width === 0 && anchorRect.height === 0)) {
      return {};
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const PADDING = 16;
    const GAP = 10;
    const MIN_POPUP_WIDTH = 280;
    const MAX_POPUP_WIDTH = 540;

    // Determine whether the anchor is on the left or right side of the calendar
    let calendarCenter = viewportWidth / 2;
    if (calendarRef.current) {
      const calRect = calendarRef.current.getBoundingClientRect();
      calendarCenter = calRect.left + calRect.width / 2;
    }

    const anchorCenter = anchorRect.left + anchorRect.width / 2;
    const isLeftSide = anchorCenter < calendarCenter;

    // Clamp anchor horizontal coordinates to viewport bounds
    const clampedAnchorLeft = Math.max(PADDING, Math.min(anchorRect.left, viewportWidth - PADDING));
    const clampedAnchorRight = Math.max(PADDING, Math.min(anchorRect.right, viewportWidth - PADDING));

    const spaceLeft = clampedAnchorLeft - GAP - PADDING;
    const spaceRight = viewportWidth - PADDING - (clampedAnchorRight + GAP);

    const style: React.CSSProperties = {
      position: 'fixed',
      zIndex: 50,
    };

    // Calculate vertical position, strictly contained in [PADDING, viewportHeight - PADDING]
    const measuredHeight = popupHeight || popupRef.current?.offsetHeight || 380;
    let top = Math.max(PADDING, anchorRect.top);
    if (top + measuredHeight > viewportHeight - PADDING) {
      top = Math.max(PADDING, viewportHeight - PADDING - measuredHeight);
    }
    const maxHeight = Math.max(160, viewportHeight - top - PADDING);
    style.top = `${top}px`;
    style.maxHeight = `${maxHeight}px`;

    // Horizontal placement and containment
    if (spaceLeft < MIN_POPUP_WIDTH && spaceRight < MIN_POPUP_WIDTH) {
      // Neither side has enough room for MIN_POPUP_WIDTH: center horizontally within window
      const maxW = Math.min(MAX_POPUP_WIDTH, viewportWidth - PADDING * 2);
      const minW = Math.min(MIN_POPUP_WIDTH, maxW);
      const left = Math.max(PADDING, (viewportWidth - maxW) / 2);
      style.left = `${left}px`;
      style.right = 'auto';
      style.maxWidth = `${maxW}px`;
      style.minWidth = `${minW}px`;
      style.width = 'max-content';
    } else {
      let placeOnLeft = false;
      if (isLeftSide) {
        placeOnLeft = spaceLeft >= MIN_POPUP_WIDTH;
      } else {
        placeOnLeft = spaceRight < MIN_POPUP_WIDTH;
      }

      if (placeOnLeft) {
        // Place to the left of anchor; extends leftwards
        const pinnedRight = Math.min(clampedAnchorLeft - GAP, viewportWidth - PADDING);
        const availWidth = pinnedRight - PADDING;
        const effectiveMaxW = Math.min(MAX_POPUP_WIDTH, availWidth);
        const effectiveMinW = Math.min(MIN_POPUP_WIDTH, effectiveMaxW);

        style.right = `${viewportWidth - pinnedRight}px`;
        style.left = 'auto';
        style.maxWidth = `${effectiveMaxW}px`;
        style.minWidth = `${effectiveMinW}px`;
        style.width = 'max-content';
      } else {
        // Place to the right of anchor; extends rightwards
        const pinnedLeft = Math.max(clampedAnchorRight + GAP, PADDING);
        const availWidth = viewportWidth - PADDING - pinnedLeft;
        const effectiveMaxW = Math.min(MAX_POPUP_WIDTH, availWidth);
        const effectiveMinW = Math.min(MIN_POPUP_WIDTH, effectiveMaxW);

        style.left = `${pinnedLeft}px`;
        style.right = 'auto';
        style.maxWidth = `${effectiveMaxW}px`;
        style.minWidth = `${effectiveMinW}px`;
        style.width = 'max-content';
      }
    }

    return style;
  };

  return (
    <Container as="main" className="py-10 md:py-14">
      <PageHeader
        title="Course calendar"
        description="Track deadlines, view activity schedules, and plan coursework across the month."
      />

      <div
        className={`${styles.noticeStack} flex flex-col gap-3`}
        aria-label="Notices and guides"
      >
        <DataStatusNotice
          error={error}
          loading={
            !snapshot ||
            Boolean(snapshot.incomplete || snapshot.stale || snapshot.preparing)
          }
        />
      </div>

      {/* Navigation and course filters */}
      <div className="my-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => {
              setMonth(shiftMonth(month, -1));
              setSelectedDate(null);
              setSelectedActivityId(null);
              setAnchorRect(null);
              setAnchorInfo(null);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-xs transition-all hover:bg-white hover:text-slate-900 hover:border-slate-400 hover:shadow-md active:scale-95 cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <h2
            className="min-w-[10rem] text-center text-lg sm:text-xl font-bold tracking-tight text-slate-900"
            aria-live="polite"
          >
            {title}
          </h2>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => {
              setMonth(shiftMonth(month, 1));
              setSelectedDate(null);
              setSelectedActivityId(null);
              setAnchorRect(null);
              setAnchorInfo(null);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-xs transition-all hover:bg-white hover:text-slate-900 hover:border-slate-400 hover:shadow-md active:scale-95 cursor-pointer"
          >
            <ArrowRight size={18} />
          </button>
          <button
            type="button"
            onClick={() => {
              setMonth(today.slice(0, 7));
              setSelectedDate(null);
              setSelectedActivityId(null);
              setAnchorRect(null);
              setAnchorInfo(null);
            }}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-teal-400 hover:text-teal-700 cursor-pointer sm:ml-1"
          >
            Today
          </button>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <span>Course</span>
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-normal text-slate-800 shadow-xs focus:border-teal-500 focus:outline-hidden"
            value={course}
            onChange={(event) => {
              setCourse(event.target.value);
              setSelectedDate(null);
              setSelectedActivityId(null);
              setAnchorRect(null);
              setAnchorInfo(null);
            }}
          >
            <option value="all">All courses</option>
            {courses.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!snapshot && !error ? (
        <SectionDescription role="status">Loading calendar…</SectionDescription>
      ) : (
        snapshot && (
          <>
            {/* Legend and range explanation */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
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
              <p>
                Bars span opening to closing/due date, inclusive. Select any date or activity
                for details.
              </p>
            </div>

            {/* Monthly range-bar calendar */}
            <div
              ref={calendarRef}
              className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs"
              role="region"
              aria-label="Monthly calendar"
              tabIndex={0}
            >
              <div className="min-w-[800px]">
                {/* Weekday headers: Mon - Sun */}
                <div className="grid grid-cols-7 divide-x divide-slate-200 border-b border-slate-200 bg-slate-50/75">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName) => (
                    <div
                      key={dayName}
                      className="py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500"
                    >
                      {dayName}
                    </div>
                  ))}
                </div>

                {/* Weeks */}
                <div className="divide-y divide-slate-200">
                  {weeks.map((week, weekIdx) => {
                    const weekDays = week.map((d) => ({ dateKey: d }));
                    const ranges = weekRanges(filtered, weekDays);
                    const lanes = Math.max(4, ...ranges.map((r) => r.lane + 1));

                    return (
                      <div key={week[0]} className="flex flex-col" data-calendar-week="true">
                        {/* Top row: Day numbers across the 7 days */}
                        <div className="grid grid-cols-7 divide-x divide-slate-200 border-b border-slate-100 bg-slate-50/40">
                          {week.map((day) => {
                            const isCurrentMonth = day.startsWith(month);
                            const isToday = day === today;
                            const isDateSelected = selectedDate === day && anchorInfo?.type === 'date';

                            return (
                              <button
                                key={day}
                                type="button"
                                data-calendar-item="true"
                                data-day-key={day}
                                onClick={(e) => handleSelectDay(day, e)}
                                aria-label={`Select date ${day}`}
                                aria-pressed={isDateSelected}
                                className={`relative flex items-center justify-between px-2.5 py-1.5 text-xs transition cursor-pointer text-left ${
                                  isDateSelected
                                    ? 'bg-teal-100/90 text-teal-900 font-medium'
                                    : isToday
                                      ? 'bg-teal-50/80 font-medium'
                                      : isCurrentMonth
                                        ? 'bg-white hover:bg-slate-50'
                                        : 'bg-slate-50/60 hover:bg-slate-100/60'
                                }`}
                              >
                                {/* Top accent bar ONLY appears when selecting a date */}
                                {isDateSelected && (
                                  <span
                                    aria-hidden="true"
                                    className="absolute inset-x-0 top-0 h-1 bg-teal-600"
                                  />
                                )}
                                <span
                                  className={`font-semibold ${
                                    isDateSelected
                                      ? 'text-teal-950 font-bold'
                                      : isToday
                                        ? 'text-teal-900 font-bold'
                                        : isCurrentMonth
                                          ? 'text-slate-700'
                                          : 'text-slate-400'
                                  }`}
                                >
                                  {isToday ? 'Today' : ''}
                                </span>
                                {/* Date number: normal text without background pill on today */}
                                <span
                                  className={`text-xs font-semibold ${
                                    isDateSelected
                                      ? 'text-teal-950 font-bold'
                                      : isToday
                                        ? 'text-teal-800 font-bold'
                                        : isCurrentMonth
                                          ? 'text-slate-700'
                                          : 'text-slate-400'
                                  }`}
                                >
                                  {Number(day.slice(-2))}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Bottom area: Activity range bars with vertical column guides and centered TODAY watermark */}
                        <div className="relative min-h-[142px]">
                          {/* Background vertical day lines and TODAY watermark */}
                          <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 grid grid-cols-7 divide-x divide-slate-200 select-none"
                          >
                            {week.map((day) => {
                              const isToday = day === today;
                              const isCurrentMonth = day.startsWith(month);
                              const isDateSelected = selectedDate === day && anchorInfo?.type === 'date';
                              return (
                                <div
                                  key={day}
                                  className={`flex items-center justify-center transition ${
                                    isDateSelected
                                      ? 'bg-teal-100/30'
                                      : isToday
                                        ? 'bg-teal-50/40'
                                        : isCurrentMonth
                                          ? 'bg-white'
                                          : 'bg-slate-50/40'
                                  }`}
                                >
                                  {isToday && (
                                    <span className="text-xs font-bold tracking-widest text-teal-800/20 uppercase select-none">
                                      TODAY
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Range bars grid */}
                          <div
                            className="relative grid grid-cols-7 gap-y-1.5 py-1.5"
                            style={{ gridTemplateRows: `repeat(${lanes}, 28px)` }}
                          >
                            {ranges.map(
                              ({
                                item,
                                start,
                                end,
                                lane,
                                continuesBefore,
                                continuesAfter,
                              }) => {
                                const activityKey = `${item.id}-${weekIdx}-${start}`;
                                const isFocused = selectedActivityId === item.id;
                                const isQuiz = item.kind === 'quiz';
                                const label = `${item.name} · ${item.courseName} · Opens: ${dateLabel(item.opensAt)} · Closes/due: ${dateLabel(item.dueAt)}`;
                                const roundLeft = !continuesBefore;
                                const roundRight = !continuesAfter;
                                const rounding =
                                  roundLeft && roundRight
                                    ? 'rounded-md'
                                    : roundLeft
                                      ? 'rounded-l-md rounded-r-none'
                                      : roundRight
                                        ? 'rounded-r-md rounded-l-none'
                                        : 'rounded-none';
                                const className = `flex min-w-0 items-center gap-1.5 border-y px-2 text-left text-xs font-medium transition cursor-pointer ${rounding} ${
                                  roundLeft ? 'ml-1 border-l' : 'border-l-0'
                                } ${roundRight ? 'mr-1 border-r' : 'border-r-0'} ${
                                  isQuiz
                                    ? 'border-blue-300 bg-blue-100 text-blue-900 hover:bg-blue-200'
                                    : 'border-emerald-300 bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                                } ${
                                  isFocused
                                    ? 'ring-2 ring-teal-700 ring-offset-1 font-bold shadow-xs'
                                    : ''
                                }`;
                                const style = {
                                  gridColumn: `${start + 1} / ${end + 2}`,
                                  gridRow: lane + 1,
                                };
                                return (
                                  <button
                                    key={activityKey}
                                    type="button"
                                    data-calendar-item="true"
                                    data-activity-key={activityKey}
                                    title={label}
                                    aria-label={label}
                                    aria-pressed={isFocused}
                                    className={className}
                                    style={style}
                                    onClick={(e) =>
                                      handleSelectActivity(item, weekDays, activityKey, e)
                                    }
                                  >
                                    {continuesBefore && (
                                      <span
                                        aria-hidden="true"
                                        className="shrink-0 text-[10px] opacity-60"
                                      >
                                        ◂
                                      </span>
                                    )}
                                    <span className="truncate">{item.name}</span>
                                    <span className="hidden xl:inline text-[10px] opacity-75 truncate">
                                      · {item.courseName}
                                    </span>
                                    {continuesAfter && (
                                      <span
                                        aria-hidden="true"
                                        className="ml-auto shrink-0 text-[10px] opacity-60"
                                      >
                                        ▸
                                      </span>
                                    )}
                                  </button>
                                );
                              },
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {filtered.length === 0 && (
              <SectionDescription className="mt-4">
                No activities available for this course selection.
              </SectionDescription>
            )}

            {/* Mini floating popup beside the date or activity showing tabular activities */}
            {selectedDate && (
              <div
                ref={popupRef}
                role="region"
                aria-label="Selected activity"
                style={getPopupStyle()}
                className={`fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xl md:p-5 ${
                  !anchorRect || (anchorRect.width === 0 && anchorRect.height === 0)
                    ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-[420px]'
                    : 'max-md:inset-x-3 max-md:bottom-3 max-md:top-auto max-md:w-auto max-md:max-h-[80vh] max-md:rounded-2xl'
                }`}
              >
                {/* Popup Header */}
                <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-700">
                        Date Schedule
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        {selectedDateActivities.length}{' '}
                        {selectedDateActivities.length === 1 ? 'activity' : 'activities'}
                      </span>
                    </div>
                    <h3 className="mt-1 text-base font-bold text-slate-900">
                      {formatPopupDate(selectedDate)}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDate(null);
                      setSelectedActivityId(null);
                      setAnchorRect(null);
                      setAnchorInfo(null);
                    }}
                    aria-label="Close selection"
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Tabular Activity List on that date */}
                <div className="mt-3 flex-1 min-h-0 overflow-y-auto pr-1">
                  {selectedDateActivities.length === 0 ? (
                    <p className="py-6 text-center text-xs text-slate-500">
                      No activities scheduled on this date.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      <div className="overflow-hidden rounded-lg border border-slate-200">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                              <th className="py-2 pl-3 pr-2 whitespace-nowrap">Type</th>
                              <th className="py-2 px-2">Activity</th>
                              <th className="py-2 pl-2 pr-3 text-right whitespace-nowrap">Deadline</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedDateActivities.map((act) => {
                              const isItemQuiz = act.kind === 'quiz';
                              const isItemFocused =
                                focusedActivity?.id === act.id;
                              const dueDay = act.dueAt ? dayKey(act.dueAt) : null;
                              const isDueToday = dueDay === selectedDate;
                              return (
                                <tr
                                  key={act.id}
                                  onClick={() => setSelectedActivityId(act.id)}
                                  className={`cursor-pointer transition ${
                                    isItemFocused
                                      ? 'bg-teal-50/90 font-medium'
                                      : 'hover:bg-slate-50/80'
                                  }`}
                                >
                                  <td className="py-2 pl-3 pr-2 whitespace-nowrap align-top">
                                    <span
                                      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                                        isItemQuiz
                                          ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                      }`}
                                    >
                                      <span
                                        className={`h-1.5 w-1.5 rounded-full ${
                                          isItemQuiz
                                            ? 'bg-blue-600'
                                            : 'bg-emerald-600'
                                        }`}
                                      />
                                      {isItemQuiz ? 'Quiz' : 'Assign'}
                                    </span>
                                  </td>
                                  <td className="py-2 px-2 min-w-0 max-w-[320px]">
                                    <div
                                      className="font-semibold text-slate-800 line-clamp-2 leading-snug break-words"
                                      title={act.name}
                                    >
                                      {act.name}
                                    </div>
                                    <div
                                      className="truncate text-[10px] text-slate-500 mt-0.5"
                                      title={act.courseName}
                                    >
                                      {act.courseName}
                                    </div>
                                  </td>
                                  <td className="py-2 pl-2 pr-3 whitespace-nowrap text-right text-[11px] text-slate-600 align-top">
                                    {act.dueAt ? (
                                      <span
                                        className={
                                          isDueToday
                                            ? 'font-bold text-amber-800'
                                            : ''
                                        }
                                      >
                                        {isDueToday
                                          ? 'Due today'
                                          : dateLabel(act.dueAt)}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400">
                                        No date
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Focused activity details inside popup */}
                      {focusedActivity && (
                        <div className="rounded-xl border border-slate-200 bg-slate-50/75 p-3 shrink-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                {focusedActivity.courseName}
                              </span>
                              <h4 className="text-sm font-bold text-slate-900 mt-0.5 leading-snug break-words">
                                {focusedActivity.name}
                              </h4>
                            </div>
                            <Link
                              to={`/activities/${encodeURIComponent(focusedActivity.id)}`}
                              className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline"
                            >
                              <span>View activity details</span>
                              <ArrowUpRight size={13} />
                            </Link>
                          </div>
                          {focusedActivity.description && (
                            <p className="mt-1.5 line-clamp-3 text-xs text-slate-600 leading-relaxed break-words">
                              {focusedActivity.description}
                            </p>
                          )}
                          <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px]">
                            <div className="rounded-md border border-slate-200/80 bg-white p-1.5">
                              <span className="block text-slate-400 text-[10px]">
                                Opens
                              </span>
                              <span className="font-semibold text-slate-700 truncate block">
                                {focusedActivity.opensAt
                                  ? dateLabel(focusedActivity.opensAt)
                                  : 'Not set'}
                              </span>
                            </div>
                            <div className="rounded-md border border-slate-200/80 bg-white p-1.5">
                              <span className="block text-slate-400 text-[10px]">
                                {focusedActivity.kind === 'quiz'
                                  ? 'Closes'
                                  : 'Due'}
                              </span>
                              <span className="font-semibold text-slate-700 truncate block">
                                {focusedActivity.dueAt
                                  ? dateLabel(focusedActivity.dueAt)
                                  : 'Not set'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )
      )}
    </Container>
  );
}
