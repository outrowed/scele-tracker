// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { activityOnDay, dayKey, monthDays, shiftMonth } from '../ui/src/calendar';
import CalendarPage from '../ui/src/pages/CalendarPage';
import type { Activity } from '../ui/src/model';

const item: Activity = {
  id: 'quiz-1',
  kind: 'quiz',
  name: 'Logic quiz',
  courseId: 1,
  courseName: 'Logic',
  description: 'Practice',
  url: 'https://example.com',
  opensAt: Date.parse('2026-09-19T17:00:00Z') / 1000,
  dueAt: Date.parse('2026-09-22T17:00:00Z') / 1000,
  cutoffAt: Date.parse('2026-09-24T17:00:00Z') / 1000,
  timeLimit: null,
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it('uses local date boundaries and handles leap months and year navigation', () => {
  const expectedDay = dayKey(item.opensAt!);
  expect(typeof expectedDay).toBe('string');
  expect(expectedDay.length).toBe(10);
  expect(monthDays('2024-02')).toContain('2024-02-29');
  expect(monthDays('2026-09')[0]).toBe('2026-08-31');
  expect(shiftMonth('2026-12', 1)).toBe('2027-01');
  expect(shiftMonth('2027-01', -1)).toBe('2026-12');
});

it('plots availability, milestones, missing dates and reversed ranges safely', () => {
  const openDay = dayKey(item.opensAt!);
  const dueDay = dayKey(item.dueAt!);
  const cutoffDay = dayKey(item.cutoffAt!);
  expect(activityOnDay(item, openDay)).toBe('Opens');
  expect(activityOnDay(item, dueDay)).toBe('Due');
  expect(activityOnDay(item, cutoffDay)).toBe('Cut-off');
  expect(
    activityOnDay({ ...item, opensAt: null, dueAt: null, cutoffAt: null }, openDay),
  ).toBeNull();
  expect(activityOnDay({ ...item, opensAt: item.cutoffAt }, cutoffDay)).toBeNull();
});

it('opens details from a calendar entry and navigates months', async () => {
  vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-09-20T00:00:00Z'));
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ activities: [item], incomplete: false }),
    }),
  );
  render(
    <MemoryRouter>
      <CalendarPage />
    </MemoryRouter>,
  );
  const buttons = await screen.findAllByRole('button', { name: /Logic quiz/i });
  fireEvent.click(buttons[0]);
  expect(screen.getByRole('region', { name: 'Selected activity' })).toBeTruthy();
  expect(
    screen.getByRole('link', { name: 'View activity details' }).getAttribute('href'),
  ).toBe('/activities/quiz-1');
  fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
  expect(screen.getByText('October 2026')).toBeTruthy();
});
