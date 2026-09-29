export type WeekdayId = 'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat';

export interface RawClassSlot {
  start: string; // e.g. "08:00"
  end: string; // e.g. "09:40"
  class: string; // e.g. "Sistem Operasi B"
}

export type DayScheduleMap = Record<string, RawClassSlot[]>;

export interface AllDaysScheduleResponse {
  schedule: Record<WeekdayId, DayScheduleMap>;
  fetchedAt: number;
}

export interface FreeTimeSlot {
  start: string;
  end: string;
  durationMinutes: number;
}

export interface RoomInfo {
  name: string;
  code: string; // 4 to 6 characters, e.g. "A1.09", "1101"
  building: string;
  isLab: boolean;
  isAuditorium: boolean;
}

export interface RoomDayStatus {
  room: RoomInfo;
  classes: RawClassSlot[];
  freeSlots: FreeTimeSlot[];
  totalFreeMinutes: number;
  totalClassMinutes: number;
  isCompletelyFree: boolean;
}

export const WEEKDAYS: {
  id: WeekdayId;
  label: string;
  englishName: string;
  indonesianName: string;
  dayIndex: number;
}[] = [
  { id: 'senin', label: 'Monday', englishName: 'Monday', indonesianName: 'Senin', dayIndex: 1 },
  { id: 'selasa', label: 'Tuesday', englishName: 'Tuesday', indonesianName: 'Selasa', dayIndex: 2 },
  { id: 'rabu', label: 'Wednesday', englishName: 'Wednesday', indonesianName: 'Rabu', dayIndex: 3 },
  { id: 'kamis', label: 'Thursday', englishName: 'Thursday', indonesianName: 'Kamis', dayIndex: 4 },
  { id: 'jumat', label: 'Friday', englishName: 'Friday', indonesianName: 'Jumat', dayIndex: 5 },
];

/**
 * Extracts a concise 4-6 character room code identifier from full room title.
 */
export function extractRoomCode(name: string): string {
  if (name.includes('Auditorium Ged Baru-1')) return 'A2.01A';
  if (name.includes('Auditorium Ged baru')) return 'A2.01';
  if (name.includes('Lab A1.01+Lab A1.02')) return 'A1.01+';
  if (name.includes('Lab A1.04+Lab A3.02')) return 'A1.04+';
  if (name.includes('Lab.1101/1103') || name.includes('1101/1103')) return '1101';
  if (name.includes('Lab.1105') || name.includes('1105')) return '1105';
  if (name.includes('Lab.1107/1109') || name.includes('1107/1109')) return '1107';

  const matchA = name.match(/([A-Z]\d+\.\d+)/);
  if (matchA) return matchA[1];

  const matchLab = name.match(/Lab\.?(\d{4})/i);
  if (matchLab) return matchLab[1];

  return name.slice(0, 6).trim();
}

/**
 * Parses full room string into structured metadata.
 */
export function parseRoomInfo(name: string): RoomInfo {
  let building = 'Gedung Baru';
  if (/g(d|ed)\.?\s*lama/i.test(name)) {
    building = 'Gedung Lama';
  } else if (/g(d|ed)\.?\s*baru/i.test(name)) {
    building = 'Gedung Baru';
  } else {
    const parenMatch = name.match(/\(([^)]+)\)/);
    if (parenMatch) {
      building = parenMatch[1].trim();
    }
  }
  const isLab = name.toLowerCase().includes('lab');
  const isAuditorium = name.toLowerCase().includes('auditorium');
  const code = extractRoomCode(name);

  return {
    name,
    code,
    building,
    isLab,
    isAuditorium,
  };
}

/**
 * Converts HH:MM string to number of minutes from midnight.
 */
export function timeStringToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Converts minute integer to HH:MM format.
 */
export function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Calculates open/free intervals between 08:00 and 18:00 from scheduled classes.
 */
export function calculateFreeSlots(
  classes: RawClassSlot[],
  dayStart = '08:00',
  dayEnd = '18:00',
): FreeTimeSlot[] {
  const startMin = timeStringToMinutes(dayStart);
  const endMin = timeStringToMinutes(dayEnd);

  // Sort classes by their start time ascending
  const sorted = [...classes].sort(
    (a, b) => timeStringToMinutes(a.start) - timeStringToMinutes(b.start),
  );

  const free: FreeTimeSlot[] = [];
  let cur = startMin;

  for (const c of sorted) {
    const cStart = Math.max(startMin, timeStringToMinutes(c.start));
    const cEnd = Math.min(endMin, timeStringToMinutes(c.end));

    if (cStart > cur) {
      free.push({
        start: minutesToTimeString(cur),
        end: minutesToTimeString(cStart),
        durationMinutes: cStart - cur,
      });
    }
    cur = Math.max(cur, cEnd);
  }

  if (cur < endMin) {
    free.push({
      start: minutesToTimeString(cur),
      end: minutesToTimeString(endMin),
      durationMinutes: endMin - cur,
    });
  }

  return free;
}

/**
 * Checks if a specific room is currently free at a given HH:MM time on that day.
 */
export function isRoomFreeAtTime(freeSlots: FreeTimeSlot[], timeStr: string): boolean {
  const targetMin = timeStringToMinutes(timeStr);
  return freeSlots.some((slot) => {
    const sMin = timeStringToMinutes(slot.start);
    const eMin = timeStringToMinutes(slot.end);
    return targetMin >= sMin && targetMin < eMin;
  });
}

/**
 * Returns current occupancy status of a room given its scheduled classes and time HH:MM.
 */
export function getCurrentOccupancy(
  classes: RawClassSlot[],
  freeSlots: FreeTimeSlot[],
  timeStr: string,
  dayStart = '08:00',
  dayEnd = '18:00',
): {
  isFreeNow: boolean;
  currentClass?: RawClassSlot;
  currentFreeSlot?: FreeTimeSlot;
  nextEvent?: { type: 'class' | 'free'; time: string; name?: string };
} {
  const targetMin = timeStringToMinutes(timeStr);
  const startMin = timeStringToMinutes(dayStart);
  const endMin = timeStringToMinutes(dayEnd);

  // If outside operating hours
  if (targetMin < startMin || targetMin >= endMin) {
    return { isFreeNow: true };
  }

  // Check if currently occupied by a class
  const activeClass = classes.find((c) => {
    const s = timeStringToMinutes(c.start);
    const e = timeStringToMinutes(c.end);
    return targetMin >= s && targetMin < e;
  });

  if (activeClass) {
    return {
      isFreeNow: false,
      currentClass: activeClass,
      nextEvent: { type: 'free', time: activeClass.end },
    };
  }

  // Currently free
  const activeFreeSlot = freeSlots.find((s) => {
    const sMin = timeStringToMinutes(s.start);
    const eMin = timeStringToMinutes(s.end);
    return targetMin >= sMin && targetMin < eMin;
  });

  // Find next class today if any
  const sortedClasses = [...classes]
    .filter((c) => timeStringToMinutes(c.start) > targetMin)
    .sort((a, b) => timeStringToMinutes(a.start) - timeStringToMinutes(b.start));

  return {
    isFreeNow: true,
    currentFreeSlot: activeFreeSlot,
    nextEvent: sortedClasses[0]
      ? { type: 'class', time: sortedClasses[0].start, name: sortedClasses[0].class }
      : undefined,
  };
}

/**
 * Computes the day status for all rooms given the schedule data for a weekday.
 */
export function computeDayRoomStatuses(
  allRoomNames: string[],
  dayClassesMap: DayScheduleMap = {},
): RoomDayStatus[] {
  return allRoomNames.map((name) => {
    const room = parseRoomInfo(name);
    const classes = dayClassesMap[name] || [];
    const freeSlots = calculateFreeSlots(classes);
    const totalClassMinutes = classes.reduce((sum, c) => {
      const dur = timeStringToMinutes(c.end) - timeStringToMinutes(c.start);
      return sum + (dur > 0 ? dur : 0);
    }, 0);
    const totalFreeMinutes = freeSlots.reduce((sum, f) => sum + f.durationMinutes, 0);

    return {
      room,
      classes,
      freeSlots,
      totalFreeMinutes,
      totalClassMinutes,
      isCompletelyFree: classes.length === 0,
    };
  });
}

/**
 * Maps a JavaScript Date day index (0=Sun, 1=Mon, ..., 6=Sat) to WeekdayId or null if weekend.
 */
export function getWeekdayIdFromDate(date: Date): WeekdayId | null {
  const day = date.getDay();
  switch (day) {
    case 1:
      return 'senin';
    case 2:
      return 'selasa';
    case 3:
      return 'rabu';
    case 4:
      return 'kamis';
    case 5:
      return 'jumat';
    default:
      return null;
  }
}
