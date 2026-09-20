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

it('uses WIB boundaries and handles leap months and year navigation', () => {
  expect(dayKey(item.opensAt!)).toBe('2026-09-20');
  expect(monthDays('2024-02')).toContain('2024-02-29');
  expect(monthDays('2026-09')[0]).toBe('2026-08-31');
  expect(shiftMonth('2026-12', 1)).toBe('2027-01');
  expect(shiftMonth('2027-01', -1)).toBe('2026-12');
});

it('plots availability, milestones, missing dates and reversed ranges safely', () => {
  expect(activityOnDay(item, '2026-09-20')).toBe('Opens');
  expect(activityOnDay(item, '2026-09-21')).toBe('Available');
  expect(activityOnDay(item, '2026-09-23')).toBe('Due');
  expect(activityOnDay(item, '2026-09-25')).toBe('Cut-off');
  expect(activityOnDay(item, '2026-09-24')).toBeNull();
  expect(
    activityOnDay({ ...item, opensAt: null, dueAt: null, cutoffAt: null }, '2026-09-21'),
  ).toBeNull();
  expect(activityOnDay({ ...item, opensAt: item.cutoffAt }, '2026-09-24')).toBeNull();
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
  fireEvent.click(await screen.findByRole('button', { name: /Due · Logic quiz/i }));
  expect(screen.getByRole('region', { name: 'Selected activity' })).toBeTruthy();
  expect(
    screen.getByRole('link', { name: 'View activity details' }).getAttribute('href'),
  ).toBe('/activities/quiz-1');
  fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
  expect(screen.getByText('October 2026')).toBeTruthy();
});
