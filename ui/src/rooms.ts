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
  building: 'Gedung Baru' | 'Gedung Lama';
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
  dayIndex: number;
}[] = [
  { id: 'senin', label: 'Senin', englishName: 'Monday', dayIndex: 1 },
  { id: 'selasa', label: 'Selasa', englishName: 'Selasa', dayIndex: 2 },
  { id: 'rabu', label: 'Rabu', englishName: 'Wednesday', dayIndex: 3 },
  { id: 'kamis', label: 'Kamis', englishName: 'Thursday', dayIndex: 4 },
  { id: 'jumat', label: 'Jumat', englishName: 'Friday', dayIndex: 5 },
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
  const building =
    name.includes('Gd Lama') || name.includes('Ged Lama') ? 'Gedung Lama' : 'Gedung Baru';
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
