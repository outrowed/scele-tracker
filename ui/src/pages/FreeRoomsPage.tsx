import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  Ghost,
  Info,
  Loader2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Container } from '../components/Container';
import { Button } from '../components/Button';
import { MessageBox } from '../components/MessageBox';
import { PageHeader, SectionTitle } from '../components/Typography';
import {
  computeDayRoomStatuses,
  getCurrentOccupancy,
  getWeekdayIdFromDate,
  isSlotActiveNow,
  WEEKDAYS,
  type AllDaysScheduleResponse,
  type DayScheduleMap,
  type WeekdayId,
} from '../rooms';

/**
 * Returns current local time in Asia/Jakarta (WIB) timezone, including seconds and formatted date.
 */
interface JakartaTimeState {
  timeString: string; // "HH:MM"
  timeWithSeconds: string; // "HH:MM:SS"
  dateString: string; // "Wed, 30 Sep"
  weekdayId: WeekdayId | null;
  isWeekend: boolean;
}

const JAKARTA_TIME_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Jakarta',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

const JAKARTA_DATE_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Jakarta',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

const JAKARTA_DAY_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Jakarta',
  weekday: 'short',
});

function getJakartaTime(): JakartaTimeState {
  const now = new Date();
  const timeWithSeconds = JAKARTA_TIME_FORMATTER.format(now);
  const timeString = timeWithSeconds.slice(0, 5);
  const dateString = JAKARTA_DATE_FORMATTER.format(now);

  const dayName = JAKARTA_DAY_FORMATTER.format(now).toLowerCase();
  let weekdayId: WeekdayId | null = null;
  if (dayName.startsWith('mon')) weekdayId = 'senin';
  else if (dayName.startsWith('tue')) weekdayId = 'selasa';
  else if (dayName.startsWith('wed')) weekdayId = 'rabu';
  else if (dayName.startsWith('thu')) weekdayId = 'kamis';
  else if (dayName.startsWith('fri')) weekdayId = 'jumat';

  return {
    timeString,
    timeWithSeconds,
    dateString,
    weekdayId,
    isWeekend: weekdayId === null,
  };
}

export default function FreeRoomsPage() {
  const [data, setData] = useState<AllDaysScheduleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter states
  const [selectedDay, setSelectedDay] = useState<WeekdayId>(() => {
    const today = new Date();
    const wk = getWeekdayIdFromDate(today);
    return wk || 'senin';
  });
  const [buildingFilter, setBuildingFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<
    'all' | 'classroom' | 'lab' | 'auditorium'
  >('all');
  const [freeFilter, setFreeFilter] = useState<'all' | 'free-now' | 'free-all-day'>(
    'all',
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  // Active hover popover for room full name
  const [hoveredRoomName, setHoveredRoomName] = useState<string | null>(null);

  // Live Jakarta clock with live second counter
  const [currentTime, setCurrentTime] = useState<JakartaTimeState>(getJakartaTime);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getJakartaTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  async function loadSchedule() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/rooms/schedule');
      if (!res.ok) {
        throw new Error(`Failed to load room schedules (${res.status})`);
      }
      const json: AllDaysScheduleResponse = await res.json();
      setData(json);
    } catch (err) {
      setError((err as Error).message || 'Failed to load room schedule data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSchedule();
  }, []);

  // Extract all unique room names across all days
  const allRoomNames: string[] = useMemo(() => {
    if (!data?.schedule) return [];
    const set = new Set<string>();
    for (const dayKey of Object.keys(data.schedule) as WeekdayId[]) {
      const map = data.schedule[dayKey] || {};
      for (const rName of Object.keys(map)) {
        set.add(rName);
      }
    }
    return Array.from(set).sort();
  }, [data]);

  // Active day's schedule
  const activeDaySchedule: DayScheduleMap = data?.schedule?.[selectedDay] || {};
  const roomStatuses = useMemo(
    () => computeDayRoomStatuses(allRoomNames, activeDaySchedule),
    [allRoomNames, activeDaySchedule],
  );

  // Dynamic set of all buildings discovered in room data
  const dynamicBuildings = useMemo(() => {
    const set = new Set<string>();
    for (const item of roomStatuses) {
      if (item.room.building) set.add(item.room.building);
    }
    return Array.from(set).sort();
  }, [roomStatuses]);

  // Is viewing today's day schedule?
  const isViewingToday = currentTime.weekdayId === selectedDay && !currentTime.isWeekend;

  // Apply filters to room statuses
  const filteredStatuses = useMemo(() => {
    return roomStatuses.filter((item) => {
      if (buildingFilter !== 'all' && item.room.building !== buildingFilter) return false;
      if (typeFilter === 'lab' && !item.room.isLab) return false;
      if (typeFilter === 'auditorium' && !item.room.isAuditorium) return false;
      if (typeFilter === 'classroom' && (item.room.isLab || item.room.isAuditorium))
        return false;

      if (freeFilter === 'free-all-day') {
        if (!item.isCompletelyFree) return false;
      } else if (freeFilter === 'free-now') {
        if (isViewingToday) {
          const occ = getCurrentOccupancy(
            item.classes,
            item.freeSlots,
            currentTime.timeString,
          );
          if (!occ.isFreeNow) return false;
        } else {
          if (!item.isCompletelyFree && item.freeSlots.length === 0) return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.room.name.toLowerCase().includes(q);
        const matchCode = item.room.code.toLowerCase().includes(q);
        const matchBuilding = item.room.building.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchBuilding) return false;
      }
      return true;
    });
  }, [
    roomStatuses,
    buildingFilter,
    typeFilter,
    freeFilter,
    searchQuery,
    isViewingToday,
    currentTime.timeString,
  ]);

  // Active filters count
  const activeFilterCount =
    (buildingFilter !== 'all' ? 1 : 0) +
    (typeFilter !== 'all' ? 1 : 0) +
    (freeFilter !== 'all' ? 1 : 0);

  const hasActiveFilters = activeFilterCount > 0 || Boolean(searchQuery.trim());

  const clearAllFilters = () => {
    setSearchQuery('');
    setBuildingFilter('all');
    setTypeFilter('all');
    setFreeFilter('all');
  };

  const selectedDayInfo = WEEKDAYS.find((d) => d.id === selectedDay);

  return (
    <Container as="main" className="py-10 md:py-14">
      {/* Header */}
      <PageHeader
        title="Backrooms"
        description="Find vacant classrooms, study spaces, and labs across Fasilkom UI. Check live vacancy right now or plan ahead for group discussions and solo study."
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Live Jakarta Clock with live second counter */}
            <div
              className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 shadow-xs"
              title="Current local time (Asia/Jakarta, WIB)"
              aria-label={`Current time: ${currentTime.timeWithSeconds} WIB, ${currentTime.dateString}`}
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Clock size={15} className="text-teal-700 dark:text-teal-400 shrink-0" />
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-sm sm:text-base font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
                  {currentTime.timeWithSeconds}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                  WIB
                </span>
                <span className="hidden sm:inline text-xs text-slate-400 dark:text-slate-500 font-medium">
                  · {currentTime.dateString}
                </span>
              </div>
            </div>

            <Button
              variant="secondary"
              onClick={loadSchedule}
              disabled={loading}
              className="shrink-0"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Refreshing…' : 'Refresh'}
            </Button>
          </div>
        }
      />

      {/* Notifications & Error messages */}
      {error && (
        <MessageBox role="alert" variant="error" className="my-4">
          {error}
        </MessageBox>
      )}

      {/* Unified Search and Filters Toolbar (sitting directly on page background) */}
      <div className="my-6 space-y-3">
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Search bar matching activity filters styling */}
          <label className="flex h-11 flex-1 items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 text-slate-400 dark:text-slate-500 shadow-xs transition focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500">
            <Search size={17} className="shrink-0" />
            <input
              aria-label="Search rooms"
              placeholder="Search by room code, building, or class…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-full w-full min-w-0 bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
            />
            {Boolean(searchQuery) && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearchQuery('')}
                className="rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={15} />
              </button>
            )}
          </label>

          {/* Filters Toggle Button */}
          <button
            type="button"
            aria-expanded={filterPanelOpen}
            aria-controls="room-filter-panel"
            onClick={() => setFilterPanelOpen(!filterPanelOpen)}
            className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border px-4 text-sm font-semibold shadow-xs transition cursor-pointer select-none ${
              filterPanelOpen || activeFilterCount > 0
                ? 'border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-200'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-teal-400 dark:hover:border-teal-600'
            }`}
          >
            <SlidersHorizontal size={16} aria-hidden="true" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-teal-700 dark:bg-teal-600 px-1.5 py-0.5 text-[11px] font-bold text-white leading-none">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown
              size={14}
              aria-hidden="true"
              className={`transition-transform duration-150 ${filterPanelOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* Expandable Multi-Facet Filter Panel Card */}
        {filterPanelOpen && (
          <div
            id="room-filter-panel"
            className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-xs"
          >
            <div className="grid gap-5 sm:grid-cols-3">
              {/* Building filter */}
              <fieldset>
                <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Building
                </legend>
                <div className="space-y-1">
                  <label className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                    <input
                      type="radio"
                      name="buildingFilter"
                      checked={buildingFilter === 'all'}
                      onChange={() => setBuildingFilter('all')}
                      className="h-4 w-4 border-slate-300 dark:border-slate-600 accent-teal-700 cursor-pointer"
                    />
                    <span>All Buildings</span>
                  </label>
                  {dynamicBuildings.map((b) => (
                    <label
                      key={b}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                    >
                      <input
                        type="radio"
                        name="buildingFilter"
                        checked={buildingFilter === b}
                        onChange={() => setBuildingFilter(b)}
                        className="h-4 w-4 border-slate-300 dark:border-slate-600 accent-teal-700 cursor-pointer"
                      />
                      <span>{b}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Room type filter */}
              <fieldset>
                <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Room Type
                </legend>
                <div className="space-y-1">
                  {[
                    { id: 'all', label: 'All Room Types' },
                    { id: 'classroom', label: 'Classrooms only' },
                    { id: 'lab', label: 'Labs only' },
                    { id: 'auditorium', label: 'Auditoriums only' },
                  ].map((t) => (
                    <label
                      key={t.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                    >
                      <input
                        type="radio"
                        name="typeFilter"
                        checked={typeFilter === t.id}
                        onChange={() => setTypeFilter(t.id as any)}
                        className="h-4 w-4 border-slate-300 dark:border-slate-600 accent-teal-700 cursor-pointer"
                      />
                      <span>{t.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Availability filter */}
              <fieldset>
                <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Availability
                </legend>
                <div className="space-y-1">
                  {[
                    { id: 'all', label: 'All Rooms' },
                    { id: 'free-now', label: 'Free Now (vacant)' },
                    { id: 'free-all-day', label: 'Free All Day (no classes)' },
                  ].map((a) => (
                    <label
                      key={a.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                    >
                      <input
                        type="radio"
                        name="availabilityFilter"
                        checked={freeFilter === a.id}
                        onChange={() => setFreeFilter(a.id as any)}
                        className="h-4 w-4 border-slate-300 dark:border-slate-600 accent-teal-700 cursor-pointer"
                      />
                      <span>{a.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </div>
        )}

        {/* Active Filter Pills Tray */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 mr-0.5">
              Active:
            </span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950 px-2.5 py-1 text-xs font-medium text-teal-900 dark:text-teal-100 hover:bg-teal-100 dark:hover:bg-teal-900 transition cursor-pointer"
              >
                <span className="truncate">Search: {searchQuery}</span>
                <X size={12} className="shrink-0" />
              </button>
            )}
            {buildingFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setBuildingFilter('all')}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950 px-2.5 py-1 text-xs font-medium text-teal-900 dark:text-teal-100 hover:bg-teal-100 dark:hover:bg-teal-900 transition cursor-pointer"
              >
                <span>Building: {buildingFilter}</span>
                <X size={12} className="shrink-0" />
              </button>
            )}
            {typeFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950 px-2.5 py-1 text-xs font-medium text-teal-900 dark:text-teal-100 hover:bg-teal-100 dark:hover:bg-teal-900 transition cursor-pointer"
              >
                <span className="capitalize">Type: {typeFilter}</span>
                <X size={12} className="shrink-0" />
              </button>
            )}
            {freeFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setFreeFilter('all')}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950 px-2.5 py-1 text-xs font-medium text-teal-900 dark:text-teal-100 hover:bg-teal-100 dark:hover:bg-teal-900 transition cursor-pointer"
              >
                <span>{freeFilter === 'free-now' ? 'Free Now' : 'Free All Day'}</span>
                <X size={12} className="shrink-0" />
              </button>
            )}
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs font-medium text-slate-500 dark:text-slate-400 underline hover:text-slate-800 dark:hover:text-slate-100 transition cursor-pointer ml-1"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 py-16 text-center text-slate-500 dark:text-slate-400">
          <Loader2
            size={32}
            className="mx-auto mb-3 animate-spin text-teal-600 dark:text-teal-400"
          />
          <p className="text-sm font-medium">Loading room schedules from Fasilkom API…</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Weekday Selector Tabs (English primary, Indonesian subtitle) */}
          <div
            className="flex flex-wrap gap-2"
            role="tablist"
            aria-label="Select weekday"
          >
            {WEEKDAYS.map((day) => {
              const isActive = selectedDay === day.id;
              const isToday = currentTime.weekdayId === day.id;
              const countScheduled = Object.keys(data?.schedule?.[day.id] || {}).length;
              const freeCount = allRoomNames.length - countScheduled;

              return (
                <button
                  key={day.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setSelectedDay(day.id)}
                  className={`flex flex-1 min-w-[120px] flex-col items-center justify-between rounded-xl border p-3 text-center transition cursor-pointer ${
                    isActive
                      ? 'border-teal-600 dark:border-teal-500 bg-teal-50/80 dark:bg-teal-950/80 ring-2 ring-teal-600 dark:ring-teal-400 ring-offset-1 dark:ring-offset-slate-900 text-teal-950 dark:text-teal-100 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-teal-400 dark:hover:border-teal-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold">{day.label}</span>
                    {isToday && (
                      <span className="rounded-full bg-teal-700 text-white dark:bg-teal-600 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider">
                        Today
                      </span>
                    )}
                  </div>
                  {/* Indonesian subtitle */}
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {day.indonesianName}
                  </span>
                  <span
                    className={`mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      freeCount > 0
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-200/50 dark:border-emerald-800/50'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {freeCount} free all day
                  </span>
                </button>
              );
            })}
          </div>

          {/* Schedule Header */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <SectionTitle className="mb-0">
                  Room Schedule for {selectedDayInfo?.label}{' '}
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                    ({selectedDayInfo?.indonesianName})
                  </span>{' '}
                  <span className="font-normal text-slate-400 dark:text-slate-500 text-sm">
                    (08:00 – 18:00)
                  </span>
                </SectionTitle>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Showing {filteredStatuses.length} of {allRoomNames.length} rooms
              </span>
            </div>

            {/* Room cards grid */}
            {filteredStatuses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 px-6 py-14 text-center text-slate-500 dark:text-slate-400">
                <Ghost
                  size={36}
                  className="mx-auto mb-3 text-slate-400 dark:text-slate-500 opacity-60"
                />
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  No rooms match your filter criteria
                </h4>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Try clearing the search query or adjusting your building and
                  availability filters.
                </p>
                <Button variant="secondary" className="mt-4" onClick={clearAllFilters}>
                  Reset all filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredStatuses.map(
                  ({ room, classes, freeSlots, timeline, isCompletelyFree }) => {
                    const occupancy = isViewingToday
                      ? getCurrentOccupancy(classes, freeSlots, currentTime.timeString)
                      : null;

                    const isPopoverOpen = hoveredRoomName === room.name;

                    return (
                      <div
                        key={room.name}
                        className="flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-xs transition hover:border-slate-300 dark:hover:border-slate-600"
                      >
                        <div>
                          {/* Header: Room Code, Pop-up Trigger, Building Name, Room Type (all on one single row) */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {/* Prominent Room Code */}
                              <span
                                className={`inline-flex items-center rounded-xl px-2.5 py-1 text-xs font-mono font-bold tracking-wider shrink-0 ${
                                  isCompletelyFree
                                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                                    : 'bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800'
                                }`}
                              >
                                {room.code}
                              </span>

                              {/* Trigger for Room Full Name Pop-up */}
                              <div className="relative inline-block shrink-0">
                                <button
                                  type="button"
                                  onMouseEnter={() => setHoveredRoomName(room.name)}
                                  onMouseLeave={() => setHoveredRoomName(null)}
                                  onClick={() =>
                                    setHoveredRoomName(
                                      hoveredRoomName === room.name ? null : room.name,
                                    )
                                  }
                                  className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 dark:text-slate-500 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                                  aria-label={`View full details for room ${room.code}`}
                                  title="Hover to view full room name"
                                >
                                  <Info size={14} />
                                </button>

                                {/* Pop-up Menu / Tooltip for full room name */}
                                {isPopoverOpen && (
                                  <div
                                    onMouseEnter={() => setHoveredRoomName(room.name)}
                                    onMouseLeave={() => setHoveredRoomName(null)}
                                    className="absolute left-0 bottom-full z-30 mb-2 w-max max-w-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-left shadow-xl"
                                  >
                                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-snug break-words">
                                      {room.name}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Secondary Building info beside code */}
                              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                                {room.building}
                              </span>
                            </div>

                            {/* Room Type Pill with truncate to never overflow */}
                            <div className="shrink-0">
                              {room.isLab ? (
                                <span
                                  className="block max-w-[85px] sm:max-w-[100px] truncate rounded-full bg-blue-50 dark:bg-blue-950 px-2 py-0.5 text-center text-[10px] font-semibold text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60"
                                  title="Laboratory"
                                >
                                  Lab
                                </span>
                              ) : room.isAuditorium ? (
                                <span
                                  className="block max-w-[85px] sm:max-w-[100px] truncate rounded-full bg-purple-50 dark:bg-purple-950 px-2 py-0.5 text-center text-[10px] font-semibold text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60"
                                  title="Auditorium"
                                >
                                  Auditorium
                                </span>
                              ) : (
                                <span
                                  className="block max-w-[85px] sm:max-w-[100px] truncate rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-center text-[10px] font-semibold text-slate-600 dark:text-slate-300"
                                  title="Classroom"
                                >
                                  Classroom
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Live Occupancy Status Strip (if viewing today) */}
                          {occupancy && (
                            <div className="mt-3">
                              {occupancy.isFreeNow ? (
                                <div className="flex items-center justify-between rounded-lg bg-emerald-50/90 dark:bg-emerald-950/80 px-2.5 py-1.5 text-xs text-emerald-900 dark:text-emerald-100 border border-emerald-200 dark:border-emerald-800">
                                  <span className="flex items-center gap-1.5 font-semibold shrink-0">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    Vacant right now
                                  </span>
                                  {isCompletelyFree ? (
                                    <span
                                      className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium truncate ml-2"
                                      title="Completely vacant (no classes scheduled today)"
                                    >
                                      Completely vacant
                                    </span>
                                  ) : occupancy.nextEvent ? (
                                    <span
                                      className="text-[11px] text-emerald-700 dark:text-emerald-300 truncate ml-2"
                                      title={
                                        occupancy.nextEvent.time >= '16:00'
                                          ? `Vacant for day only (night schedule at ${occupancy.nextEvent.time})`
                                          : `Class at ${occupancy.nextEvent.time}`
                                      }
                                    >
                                      {occupancy.nextEvent.time >= '16:00'
                                        ? `Vacant for day only (night schedule at ${occupancy.nextEvent.time})`
                                        : `Class at ${occupancy.nextEvent.time}`}
                                    </span>
                                  ) : (
                                    <span className="text-[11px] text-emerald-700 dark:text-emerald-300 truncate ml-2">
                                      Free rest of day
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center justify-between rounded-lg bg-rose-50/90 dark:bg-rose-950/80 px-2.5 py-1.5 text-xs text-rose-900 dark:text-rose-100 border border-rose-200 dark:border-rose-800">
                                  <span
                                    className="flex items-center gap-1.5 font-semibold truncate max-w-[170px]"
                                    title={occupancy.currentClass?.class}
                                  >
                                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                                    Occupied: {occupancy.currentClass?.class}
                                  </span>
                                  <span className="text-[11px] text-rose-700 dark:text-rose-300 whitespace-nowrap">
                                    Free at {occupancy.nextEvent?.time}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Card Body: if completely free, fill the rest of the space below and center VACANT */}
                        {isCompletelyFree ? (
                          <div className="flex flex-1 items-center justify-center min-h-[100px] py-6">
                            <span className="text-xs md:text-sm font-bold tracking-widest text-teal-800/20 dark:text-teal-200/20 uppercase select-none">
                              VACANT
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-1 flex-col justify-between">
                            {/* Unified Schedule Timeline (combining vacant slots and scheduled classes chronologically) */}
                            <div className="mt-3.5">
                              {/* Chronological list of vacant and scheduled class slots */}
                              <div className="flex flex-col gap-1 text-[11px]">
                                {timeline.map((slot, idx) => {
                                  const isActive =
                                    isViewingToday &&
                                    isSlotActiveNow(slot, currentTime.timeString);
                                  const isVacant = slot.type === 'vacant';

                                  return (
                                    <div
                                      key={idx}
                                      className={`flex items-center justify-between rounded-lg px-2 py-1 transition-colors ${
                                        isActive
                                          ? isVacant
                                            ? 'bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 shadow-xs'
                                            : 'bg-rose-50/90 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-700 shadow-xs'
                                          : 'border-b border-slate-100 dark:border-slate-700/50 last:border-b-0'
                                      }`}
                                    >
                                      <div className="flex items-center gap-1.5 min-w-0 pr-2">
                                        {isActive && (
                                          <span
                                            className={`h-2 w-2 rounded-full shrink-0 animate-pulse ${
                                              isVacant ? 'bg-emerald-500' : 'bg-rose-500'
                                            }`}
                                          />
                                        )}
                                        <span
                                          className={`truncate ${
                                            isActive
                                              ? isVacant
                                                ? 'text-emerald-900 dark:text-emerald-100 font-semibold'
                                                : 'text-rose-900 dark:text-rose-100 font-semibold'
                                              : isVacant
                                                ? 'font-medium text-emerald-700 dark:text-emerald-400'
                                                : 'font-medium text-slate-800 dark:text-slate-100'
                                          }`}
                                          title={
                                            isVacant
                                              ? slot.label
                                              : slot.rawClass?.class || slot.label
                                          }
                                        >
                                          {slot.label}
                                        </span>
                                        {isActive && (
                                          <span
                                            className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider shrink-0 leading-none ${
                                              isVacant
                                                ? 'bg-emerald-600 text-white dark:bg-emerald-500'
                                                : 'bg-rose-600 text-white dark:bg-rose-500'
                                            }`}
                                          >
                                            Now
                                          </span>
                                        )}
                                      </div>
                                      <span
                                        className={`font-mono whitespace-nowrap shrink-0 ${
                                          isActive
                                            ? isVacant
                                              ? 'text-emerald-800 dark:text-emerald-200 font-bold'
                                              : 'text-rose-800 dark:text-rose-200 font-bold'
                                            : 'text-slate-500 dark:text-slate-400'
                                        }`}
                                      >
                                        {slot.start} – {slot.end}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Container>
  );
}
