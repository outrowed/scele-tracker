import { useEffect, useState } from 'react';
import {
  Building2,
  Calendar as CalendarIcon,
  CalendarDays,
  CheckCircle2,
  Clock,
  DoorOpen,
  Filter,
  Layers3,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { Container } from '../components/Container';
import { Button } from '../components/Button';
import { MessageBox } from '../components/MessageBox';
import { PageHeader, SectionTitle } from '../components/Typography';
import { monthDays, shiftMonth } from '../calendar';
import {
  calculateFreeSlots,
  computeDayRoomStatuses,
  extractRoomCode,
  getWeekdayIdFromDate,
  parseRoomInfo,
  WEEKDAYS,
  type AllDaysScheduleResponse,
  type DayScheduleMap,
  type RoomDayStatus,
  type WeekdayId,
} from '../rooms';

export default function FreeRoomsPage() {
  const [data, setData] = useState<AllDaysScheduleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');

  // Filter states
  const [selectedDay, setSelectedDay] = useState<WeekdayId>(() => {
    const today = new Date();
    const wk = getWeekdayIdFromDate(today);
    return wk || 'senin';
  });
  const [buildingFilter, setBuildingFilter] = useState<
    'all' | 'Gedung Baru' | 'Gedung Lama'
  >('all');
  const [typeFilter, setTypeFilter] = useState<
    'all' | 'classroom' | 'lab' | 'auditorium'
  >('all');
  const [freeOnly, setFreeOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Monthly calendar state
  const [currentMonth, setCurrentMonth] = useState(() =>
    new Date().toISOString().slice(0, 7),
  );
  const [selectedDate, setSelectedDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );

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
  const allRoomNames: string[] = (() => {
    if (!data?.schedule) return [];
    const set = new Set<string>();
    for (const dayKey of Object.keys(data.schedule) as WeekdayId[]) {
      const map = data.schedule[dayKey] || {};
      for (const rName of Object.keys(map)) {
        set.add(rName);
      }
    }
    return Array.from(set).sort();
  })();

  // Active day's schedule
  const activeDaySchedule: DayScheduleMap = data?.schedule?.[selectedDay] || {};
  const roomStatuses = computeDayRoomStatuses(allRoomNames, activeDaySchedule);

  // Apply filters to room statuses
  const filteredStatuses = roomStatuses.filter((item) => {
    if (buildingFilter !== 'all' && item.room.building !== buildingFilter) return false;
    if (typeFilter === 'lab' && !item.room.isLab) return false;
    if (typeFilter === 'auditorium' && !item.room.isAuditorium) return false;
    if (typeFilter === 'classroom' && (item.room.isLab || item.room.isAuditorium))
      return false;
    if (freeOnly && !item.isCompletelyFree && item.freeSlots.length === 0) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = item.room.name.toLowerCase().includes(q);
      const matchCode = item.room.code.toLowerCase().includes(q);
      if (!matchName && !matchCode) return false;
    }
    return true;
  });

  // Calculate monthly stats for the calendar days
  const calendarDaysList = monthDays(currentMonth);
  const selectedDateObj = new Date(`${selectedDate}T00:00:00Z`);
  const selectedDateWeekday = getWeekdayIdFromDate(
    new Date(
      Number(selectedDate.slice(0, 4)),
      Number(selectedDate.slice(5, 7)) - 1,
      Number(selectedDate.slice(8, 10)),
    ),
  );

  return (
    <Container as="main" className="py-10 md:py-14">
      {/* Header */}
      <PageHeader
        title="Free Rooms · Ruang Kosong"
        description="Find vacant classrooms and labs in Fasilkom UI for group study, self-study, or events without course activities."
        action={
          <Button
            variant="secondary"
            onClick={loadSchedule}
            disabled={loading}
            className="shrink-0"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        }
      />

      {/* Notifications & Error messages */}
      {error && (
        <MessageBox role="alert" variant="error" className="my-4">
          {error}
        </MessageBox>
      )}

      {/* View Switcher: Weekly vs Monthly */}
      <div className="my-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-700">View mode:</span>
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
            <button
              type="button"
              onClick={() => setViewMode('weekly')}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                viewMode === 'weekly'
                  ? 'bg-white text-teal-800 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays size={15} />
              Weekly View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('monthly')}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                viewMode === 'monthly'
                  ? 'bg-white text-teal-800 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon size={15} />
              Monthly View
            </button>
          </div>
        </div>

        {/* Global Summary Badge */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Building2 size={15} className="text-slate-400" />
          <span>{allRoomNames.length} Fasilkom rooms tracked</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
        {/* Search */}
        <div className="relative min-w-[200px] flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search by room name or code (e.g. A1.09, 1101)…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-9 pr-3 text-xs font-medium text-slate-800 placeholder-slate-400 transition focus:border-teal-500 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Building Filter */}
        <select
          value={buildingFilter}
          onChange={(e) => setBuildingFilter(e.target.value as any)}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition focus:border-teal-500 focus:outline-none"
          aria-label="Filter by building"
        >
          <option value="all">All Buildings</option>
          <option value="Gedung Baru">Gedung Baru</option>
          <option value="Gedung Lama">Gedung Lama</option>
        </select>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition focus:border-teal-500 focus:outline-none"
          aria-label="Filter by room type"
        >
          <option value="all">All Room Types</option>
          <option value="classroom">Classrooms only</option>
          <option value="lab">Labs only</option>
          <option value="auditorium">Auditoriums only</option>
        </select>

        {/* Only completely free rooms */}
        <label className="flex cursor-pointer select-none items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100">
          <input
            type="checkbox"
            checked={freeOnly}
            onChange={(e) => setFreeOnly(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
          />
          <span>Free all day only</span>
        </label>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-500">
          <Loader2 size={32} className="mx-auto mb-3 animate-spin text-teal-600" />
          <p className="text-sm font-medium">Loading room schedules from CS UI API…</p>
        </div>
      ) : viewMode === 'weekly' ? (
        /* ========================================================================= */
        /* WEEKLY VIEW                                                               */
        /* ========================================================================= */
        <div className="flex flex-col gap-6">
          {/* Weekday Selector Tabs */}
          <div
            className="flex flex-wrap gap-2"
            role="tablist"
            aria-label="Select weekday"
          >
            {WEEKDAYS.map((day) => {
              const isActive = selectedDay === day.id;
              const countScheduled = Object.keys(data?.schedule?.[day.id] || {}).length;
              const freeCount = allRoomNames.length - countScheduled;

              return (
                <button
                  key={day.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setSelectedDay(day.id)}
                  className={`flex flex-1 min-w-[120px] flex-col items-center justify-between rounded-xl border p-3 text-center transition ${
                    isActive
                      ? 'border-teal-600 bg-teal-50/80 ring-2 ring-teal-600 ring-offset-1 text-teal-900 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-teal-400 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-sm font-bold">{day.label}</span>
                  <span className="text-[11px] text-slate-500">{day.englishName}</span>
                  <span
                    className={`mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      freeCount > 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {freeCount} free all day
                  </span>
                </button>
              );
            })}
          </div>

          {/* Weekly Schedule Grid for Selected Day */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <SectionTitle>
                Rooms Schedule for {WEEKDAYS.find((d) => d.id === selectedDay)?.label}{' '}
                (08:00 – 18:00)
              </SectionTitle>
              <span className="text-xs text-slate-500">
                Showing {filteredStatuses.length} of {allRoomNames.length} rooms
              </span>
            </div>

            {/* Room cards grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredStatuses.map(({ room, classes, freeSlots, isCompletelyFree }) => (
                <div
                  key={room.name}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-slate-300"
                >
                  <div>
                    {/* Header: Room Code Indicator and Title */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {/* Prominent short room code indicator */}
                        <span
                          className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-mono font-bold tracking-wider ${
                            isCompletelyFree
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-teal-50 text-teal-800 border border-teal-200'
                          }`}
                          title={`Room code: ${room.code}`}
                        >
                          {room.code}
                        </span>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 leading-tight">
                            {room.name}
                          </h4>
                          <span className="text-[11px] text-slate-500">
                            {room.building}
                          </span>
                        </div>
                      </div>

                      {/* Room tag badge */}
                      {room.isLab ? (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-200/60">
                          Lab
                        </span>
                      ) : room.isAuditorium ? (
                        <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 border border-purple-200/60">
                          Auditorium
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          Classroom
                        </span>
                      )}
                    </div>

                    {/* Status overview */}
                    <div className="mt-3.5">
                      {isCompletelyFree ? (
                        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 border border-emerald-200/70">
                          <CheckCircle2 size={15} className="text-emerald-600" />
                          <span>Free all day! (No matkul)</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                            <span className="flex items-center gap-1.5">
                              <Clock size={13} className="text-teal-700" />
                              Vacant time slots:
                            </span>
                            <span className="font-semibold text-emerald-700">
                              {freeSlots.length} free slot
                              {freeSlots.length > 1 ? 's' : ''}
                            </span>
                          </div>

                          {/* Free slots pills */}
                          <div className="flex flex-wrap gap-1.5">
                            {freeSlots.map((slot, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800 border border-emerald-200/70"
                              >
                                {slot.start} – {slot.end} ({slot.durationMinutes}m)
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Scheduled classes list footer if any */}
                  {classes.length > 0 && (
                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <details className="text-xs group">
                        <summary className="cursor-pointer font-medium text-slate-500 hover:text-slate-800 transition flex items-center justify-between">
                          <span>
                            {classes.length} scheduled class
                            {classes.length > 1 ? 'es' : ''}
                          </span>
                          <span className="text-[10px] text-teal-700 group-open:rotate-180 transition-transform">
                            ▼
                          </span>
                        </summary>
                        <div className="mt-2 flex flex-col gap-1.5 pl-1 text-[11px] text-slate-600">
                          {classes.map((c, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between border-b border-slate-50 pb-1"
                            >
                              <span
                                className="font-medium text-slate-800 truncate max-w-[180px]"
                                title={c.class}
                              >
                                {c.class}
                              </span>
                              <span className="font-mono text-slate-500 whitespace-nowrap">
                                {c.start} – {c.end}
                              </span>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* MONTHLY VIEW                                                              */
        /* ========================================================================= */
        <div className="flex flex-col gap-6">
          {/* Month navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button
                aria-label="Previous month"
                variant="secondary"
                onClick={() => setCurrentMonth(shiftMonth(currentMonth, -1))}
              >
                ←
              </Button>
              <h3 className="text-lg font-bold text-slate-800">
                {new Intl.DateTimeFormat('en-GB', {
                  month: 'long',
                  year: 'numeric',
                  timeZone: 'UTC',
                }).format(new Date(`${currentMonth}-01T00:00:00Z`))}
              </h3>
              <Button
                aria-label="Next month"
                variant="secondary"
                onClick={() => setCurrentMonth(shiftMonth(currentMonth, 1))}
              >
                →
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  const nowStr = new Date().toISOString().slice(0, 7);
                  setCurrentMonth(nowStr);
                  setSelectedDate(new Date().toISOString().slice(0, 10));
                }}
              >
                Current Month
              </Button>
            </div>
            <span className="text-xs text-slate-500">
              Select any weekday in the calendar to view its room availability breakdown.
            </span>
          </div>

          {/* Monthly calendar grid */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xs md:p-6">
            <div className="grid grid-cols-7 gap-1 text-center sm:gap-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div
                  key={day}
                  className="py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider"
                >
                  {day}
                </div>
              ))}

              {calendarDaysList.map((dayStr) => {
                const isSelected = selectedDate === dayStr;
                const isCurrentMonth = dayStr.startsWith(currentMonth);
                const isToday = dayStr === new Date().toISOString().slice(0, 10);

                const d = new Date(
                  Number(dayStr.slice(0, 4)),
                  Number(dayStr.slice(5, 7)) - 1,
                  Number(dayStr.slice(8, 10)),
                );
                const wk = getWeekdayIdFromDate(d);
                const isWeekend = wk === null;

                const daySchedule = wk && data?.schedule?.[wk] ? data.schedule[wk] : {};
                const busyRoomCount = Object.keys(daySchedule).length;
                const freeAllDayCount = isWeekend
                  ? allRoomNames.length
                  : allRoomNames.length - busyRoomCount;

                return (
                  <button
                    type="button"
                    key={dayStr}
                    onClick={() => {
                      setSelectedDate(dayStr);
                      if (wk) setSelectedDay(wk);
                    }}
                    className={`flex min-h-[76px] flex-col justify-between rounded-xl border p-2 text-left transition ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/80 ring-2 ring-teal-600 ring-offset-1'
                        : isToday
                          ? 'border-teal-300 bg-teal-50/30 hover:border-teal-400'
                          : isCurrentMonth
                            ? 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                            : 'border-slate-100/50 bg-slate-50/40 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                          isToday ? 'bg-teal-700 text-white' : 'text-slate-700'
                        }`}
                      >
                        {Number(dayStr.slice(8, 10))}
                      </span>
                      {isToday && (
                        <span className="text-[9px] font-bold uppercase text-teal-700">
                          Today
                        </span>
                      )}
                    </div>

                    <div className="mt-1">
                      {isWeekend ? (
                        <span className="rounded bg-slate-100 px-1 py-0.5 text-[9px] font-medium text-slate-500">
                          Weekend
                        </span>
                      ) : (
                        <span className="rounded bg-emerald-50 px-1 py-0.5 text-[9px] font-semibold text-emerald-700 border border-emerald-200/50">
                          {freeAllDayCount} free
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected day rooms detail */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Room Availability for {selectedDate} (
                  {selectedDateWeekday
                    ? WEEKDAYS.find((w) => w.id === selectedDateWeekday)?.label
                    : 'Weekend'}
                  )
                </h4>
                <p className="text-xs text-slate-500">
                  {selectedDateWeekday
                    ? `Displaying Fasilkom lecture rooms and labs for ${WEEKDAYS.find((w) => w.id === selectedDateWeekday)?.label}.`
                    : 'Weekend: No academic courses scheduled. Rooms are typically free or accessible by faculty reservation.'}
                </p>
              </div>
            </div>

            {selectedDateWeekday ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {filteredStatuses.map(({ room, freeSlots, isCompletelyFree }) => (
                  <div
                    key={room.name}
                    className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {room.code}
                      </span>
                      <span
                        className="text-[10px] text-slate-500 truncate max-w-[120px]"
                        title={room.name}
                      >
                        {room.name}
                      </span>
                    </div>

                    <div className="mt-2.5">
                      {isCompletelyFree ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                          <CheckCircle2 size={13} /> Free all day
                        </span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] font-medium text-slate-600">
                            {freeSlots.length} open slot{freeSlots.length > 1 ? 's' : ''}:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {freeSlots.slice(0, 2).map((s, i) => (
                              <span
                                key={i}
                                className="rounded bg-emerald-100/70 px-1 py-0.5 text-[10px] font-mono text-emerald-800"
                              >
                                {s.start}-{s.end}
                              </span>
                            ))}
                            {freeSlots.length > 2 && (
                              <span className="text-[10px] text-slate-400">
                                +{freeSlots.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 py-8 text-center text-slate-500 text-sm">
                No classes scheduled on weekends. All Fasilkom rooms are free from regular
                coursework.
              </div>
            )}
          </div>
        </div>
      )}
    </Container>
  );
}
