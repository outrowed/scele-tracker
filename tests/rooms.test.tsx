// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  calculateFreeSlots,
  calculateUnifiedTimeline,
  computeDayRoomStatuses,
  extractRoomCode,
  getCurrentOccupancy,
  getWeekdayIdFromDate,
  isSlotActiveNow,
  minutesToTimeString,
  parseRoomInfo,
  timeStringToMinutes,
  WEEKDAYS,
  type RawClassSlot,
} from '../ui/src/rooms';
import FreeRoomsPage from '../ui/src/pages/FreeRoomsPage';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Room schedule helper utilities', () => {
  it('extracts concise 4-6 character room codes properly', () => {
    expect(extractRoomCode('A1.09 (Ged Baru)')).toBe('A1.09');
    expect(extractRoomCode('A2.01 (Auditorium Ged Baru-1)')).toBe('A2.01A');
    expect(extractRoomCode('A2.01 (Auditorium Ged baru)')).toBe('A2.01');
    expect(extractRoomCode('Lab A1.01+Lab A1.02 - Gabungan (Gd Baru)')).toBe('A1.01+');
    expect(extractRoomCode('Lab A1.04+Lab A3.02 -Gabungan (Gd. Baru)')).toBe('A1.04+');
    expect(extractRoomCode('Lab A3.02 (Gd. Baru) --- PC 45')).toBe('A3.02');
    expect(extractRoomCode('Lab.1101/1103 --- PC 46 (Gd Lama)')).toBe('1101');
    expect(extractRoomCode('Lab.1105 --- PC 24 (Gd Lama)')).toBe('1105');
    expect(extractRoomCode('Lab.1107/1109 --- PC 34 (Gd Lama)')).toBe('1107');
    expect(extractRoomCode('A6.12 (Ged Baru)')).toBe('A6.12');
  });

  it('parses room metadata correctly including building and type', () => {
    const r1 = parseRoomInfo('A1.09 (Ged Baru)');
    expect(r1.code).toBe('A1.09');
    expect(r1.building).toBe('Gedung Baru');
    expect(r1.isLab).toBe(false);
    expect(r1.isAuditorium).toBe(false);

    const r2 = parseRoomInfo('Lab.1101/1103 --- PC 46 (Gd Lama)');
    expect(r2.code).toBe('1101');
    expect(r2.building).toBe('Gedung Lama');
    expect(r2.isLab).toBe(true);

    const r3 = parseRoomInfo('A2.01 (Auditorium Ged baru)');
    expect(r3.isAuditorium).toBe(true);
  });

  it('converts time strings and minute offsets accurately', () => {
    expect(timeStringToMinutes('08:00')).toBe(480);
    expect(timeStringToMinutes('11:40')).toBe(700);
    expect(timeStringToMinutes('18:00')).toBe(1080);
    expect(minutesToTimeString(480)).toBe('08:00');
    expect(minutesToTimeString(700)).toBe('11:40');
  });

  it('calculates open and free slots between classes within 08:00 to 18:00', () => {
    const classes: RawClassSlot[] = [
      { start: '10:00', end: '11:40', class: 'Sistem Operasi B' },
      { start: '13:00', end: '14:40', class: 'Digital Forensics' },
      { start: '15:00', end: '16:40', class: 'Knowledge Graph' },
    ];

    const freeSlots = calculateFreeSlots(classes, '08:00', '18:00');
    expect(freeSlots).toEqual([
      { start: '08:00', end: '10:00', durationMinutes: 120 },
      { start: '11:40', end: '13:00', durationMinutes: 80 },
      { start: '14:40', end: '15:00', durationMinutes: 20 },
      { start: '16:40', end: '18:00', durationMinutes: 80 },
    ]);
  });

  it('handles completely free room without any classes scheduled', () => {
    const freeSlots = calculateFreeSlots([], '08:00', '18:00');
    expect(freeSlots).toEqual([{ start: '08:00', end: '18:00', durationMinutes: 600 }]);
  });

  it('maps Date objects to WeekdayId or null for weekend', () => {
    // 2026-09-21 is Monday (Senin)
    const monday = new Date(2026, 8, 21);
    expect(getWeekdayIdFromDate(monday)).toBe('senin');

    // 2026-09-25 is Friday (Jumat)
    const friday = new Date(2026, 8, 25);
    expect(getWeekdayIdFromDate(friday)).toBe('jumat');

    // 2026-09-26 is Saturday
    const saturday = new Date(2026, 8, 26);
    expect(getWeekdayIdFromDate(saturday)).toBeNull();
  });

  it('computes statuses for all rooms', () => {
    const allRooms = ['A1.09 (Ged Baru)', 'Lab.1105 --- PC 24 (Gd Lama)'];
    const map = {
      'A1.09 (Ged Baru)': [{ start: '10:00', end: '12:00', class: 'OS' }],
    };
    const statuses = computeDayRoomStatuses(allRooms, map);
    expect(statuses).toHaveLength(2);

    const a1 = statuses.find((s) => s.room.code === 'A1.09');
    expect(a1?.isCompletelyFree).toBe(false);
    expect(a1?.classes).toHaveLength(1);

    const lab = statuses.find((s) => s.room.code === '1105');
    expect(lab?.isCompletelyFree).toBe(true);
    expect(lab?.classes).toHaveLength(0);
  });

  it('determines current occupancy correctly', () => {
    const classes: RawClassSlot[] = [
      { start: '10:00', end: '11:40', class: 'Sistem Operasi B' },
      { start: '14:00', end: '15:40', class: 'Jarkom' },
    ];
    const freeSlots = calculateFreeSlots(classes, '08:00', '18:00');

    // At 09:00: free now, next event is OS at 10:00
    const occ9 = getCurrentOccupancy(classes, freeSlots, '09:00');
    expect(occ9.isFreeNow).toBe(true);
    expect(occ9.nextEvent?.type).toBe('class');
    expect(occ9.nextEvent?.time).toBe('10:00');

    // At 10:30: busy with OS, next event free at 11:40
    const occ1030 = getCurrentOccupancy(classes, freeSlots, '10:30');
    expect(occ1030.isFreeNow).toBe(false);
    expect(occ1030.currentClass?.class).toBe('Sistem Operasi B');
    expect(occ1030.nextEvent?.type).toBe('free');
    expect(occ1030.nextEvent?.time).toBe('11:40');

    // At 12:00: free now, next event is Jarkom at 14:00
    const occ12 = getCurrentOccupancy(classes, freeSlots, '12:00');
    expect(occ12.isFreeNow).toBe(true);
    expect(occ12.nextEvent?.time).toBe('14:00');

    // At 16:00: free now, no more classes today
    const occ16 = getCurrentOccupancy(classes, freeSlots, '16:00');
    expect(occ16.isFreeNow).toBe(true);
    expect(occ16.nextEvent).toBeUndefined();
  });

  it('calculates a chronologically unified timeline alternating between vacant and class slots', () => {
    const classes: RawClassSlot[] = [
      { start: '10:00', end: '10:50', class: 'PBM' },
      { start: '14:00', end: '14:50', class: 'RPL B' },
      { start: '15:00', end: '16:40', class: 'MPPI B' },
    ];

    const timeline = calculateUnifiedTimeline(classes, '08:00', '18:00');
    expect(timeline).toEqual([
      {
        type: 'vacant',
        start: '08:00',
        end: '10:00',
        durationMinutes: 120,
        label: 'Vacant (120 minutes)',
      },
      {
        type: 'class',
        start: '10:00',
        end: '10:50',
        durationMinutes: 50,
        label: 'PBM',
        rawClass: classes[0],
      },
      {
        type: 'vacant',
        start: '10:50',
        end: '14:00',
        durationMinutes: 190,
        label: 'Vacant (190 minutes)',
      },
      {
        type: 'class',
        start: '14:00',
        end: '14:50',
        durationMinutes: 50,
        label: 'RPL B',
        rawClass: classes[1],
      },
      {
        type: 'vacant',
        start: '14:50',
        end: '15:00',
        durationMinutes: 10,
        label: 'Vacant (10 minutes)',
      },
      {
        type: 'class',
        start: '15:00',
        end: '16:40',
        durationMinutes: 100,
        label: 'MPPI B',
        rawClass: classes[2],
      },
      {
        type: 'vacant',
        start: '16:40',
        end: '18:00',
        durationMinutes: 80,
        label: 'Vacant (80 minutes)',
      },
    ]);
  });

  it('determines if a timeline slot is active now', () => {
    const slot = { start: '10:00', end: '10:50' };
    expect(isSlotActiveNow(slot, '09:59')).toBe(false);
    expect(isSlotActiveNow(slot, '10:00')).toBe(true);
    expect(isSlotActiveNow(slot, '10:25')).toBe(true);
    expect(isSlotActiveNow(slot, '10:50')).toBe(false);
    expect(isSlotActiveNow(slot, '11:00')).toBe(false);
  });
});

describe('FreeRoomsPage component', () => {
  const mockSchedule = {
    schedule: {
      senin: {
        'A1.09 (Ged Baru)': [{ start: '10:00', end: '11:40', class: 'Sistem Operasi B' }],
      },
      selasa: {},
      rabu: {},
      kamis: {},
      jumat: {},
    },
    fetchedAt: Date.now(),
  };

  it('renders Free Rooms page and displays rooms with short code indicators', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockSchedule,
      }),
    );

    render(
      <MemoryRouter>
        <FreeRoomsPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', { level: 1, name: /Backrooms/i }),
    ).toBeTruthy();
    expect(await screen.findByText('A1.09')).toBeTruthy();
    expect(screen.getByText('Gedung Baru')).toBeTruthy();

    // Verify weekday tabs are rendered
    const mondayTab = screen.getByRole('tab', { name: /Monday/i });
    expect(mondayTab).toBeTruthy();
    expect(screen.getByRole('tab', { name: /Tuesday/i })).toBeTruthy();

    // Click Monday tab to view schedule with classes
    fireEvent.click(mondayTab);

    // Verify unified schedule timeline renders
    expect(screen.getByText('Schedule timeline:')).toBeTruthy();
    expect(screen.getByText('Sistem Operasi B')).toBeTruthy();
    expect(screen.getByText('Vacant (120 minutes)')).toBeTruthy();

    // Verify live Jakarta clock presence in header
    expect(screen.getByText('WIB')).toBeTruthy();
  });
});
