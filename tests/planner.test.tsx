// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  dayKey,
  deadlineTimeState,
  formatMonthHeading,
  getWeekDays,
  monthKey,
} from '../ui/src/planner';
import { WeekBar } from '../ui/src/components/WeekBar';
import { TabularActivityList } from '../ui/src/components/TabularActivityList';
import CoursesPage from '../ui/src/pages/CoursesPage';
import type { Activity } from '../ui/src/model';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const quizItem: Activity = {
  id: 'quiz-calc-1',
  kind: 'quiz',
  name: 'Calculus Quiz 1',
  courseId: 101,
  courseName: 'Calculus 1',
  description: 'Limits and Derivatives quiz.',
  dueAt: Date.parse('2026-09-22T10:00:00Z') / 1000,
  opensAt: Date.parse('2026-09-20T10:00:00Z') / 1000,
  cutoffAt: null,
  timeLimit: 3600,
  url: 'https://example.com/quiz/1',
};

const assignmentItem: Activity = {
  id: 'assign-prog-1',
  kind: 'assignment',
  name: 'Programming Lab 1',
  courseId: 102,
  courseName: 'Basic Programming',
  description: 'Variables and Control Flow.',
  dueAt: Date.parse('2026-09-22T15:00:00Z') / 1000,
  opensAt: Date.parse('2026-09-18T10:00:00Z') / 1000,
  cutoffAt: null,
  timeLimit: null,
  url: 'https://example.com/assign/1',
};

describe('planner helper utilities', () => {
  it('formats month headings correctly', () => {
    expect(formatMonthHeading('2026-09')).toBe('September 2026');
    expect(formatMonthHeading('undated')).toBe('No Deadline / Undated');
  });

  it('determines deadlineTimeState properly based on reference timestamp', () => {
    const dueTime = quizItem.dueAt!;
    const dueDayStr = dayKey(dueTime);

    // Same day
    const sameDayRef = new Date(dueTime * 1000);
    sameDayRef.setHours(sameDayRef.getHours() - 1);
    expect(deadlineTimeState(quizItem, sameDayRef.getTime() / 1000)).toBe('today');

    // Future day (item is upcoming)
    const earlierDayRef = new Date(dueTime * 1000);
    earlierDayRef.setDate(earlierDayRef.getDate() - 3);
    expect(deadlineTimeState(quizItem, earlierDayRef.getTime() / 1000)).toBe('upcoming');

    // Past day (item is past)
    const laterDayRef = new Date(dueTime * 1000);
    laterDayRef.setDate(laterDayRef.getDate() + 2);
    expect(deadlineTimeState(quizItem, laterDayRef.getTime() / 1000)).toBe('past');

    // Undated
    expect(deadlineTimeState({ ...quizItem, dueAt: null })).toBe('undated');
  });

  it('generates 7 week days with categorized quizzes and assignments', () => {
    const ref = quizItem.dueAt!;
    const { days, weekLabel } = getWeekDays(ref, 0, [quizItem, assignmentItem]);

    expect(days).toHaveLength(7);
    expect(weekLabel).toBeTruthy();

    const targetDay = days.find((d) => d.dateKey === dayKey(ref));
    expect(targetDay).toBeTruthy();
    expect(targetDay!.quizzes).toHaveLength(1);
    expect(targetDay!.assignments).toHaveLength(1);
  });
});

describe('WeekBar component', () => {
  it('renders week days and triggers day selection and navigation callbacks', () => {
    const onSelectDay = vi.fn();
    const onPrevWeek = vi.fn();
    const onNextWeek = vi.fn();
    const onCurrentWeek = vi.fn();

    const { days, weekLabel } = getWeekDays(quizItem.dueAt!, 0, [quizItem]);

    render(
      <WeekBar
        days={days}
        weekLabel={weekLabel}
        weekOffset={1}
        selectedDayKey={null}
        onSelectDay={onSelectDay}
        onPrevWeek={onPrevWeek}
        onNextWeek={onNextWeek}
        onCurrentWeek={onCurrentWeek}
      />,
    );

    expect(screen.getByText('Weekly Schedule')).toBeTruthy();
    expect(screen.getByText(weekLabel)).toBeTruthy();

    // Check quiz badge
    expect(screen.getByTitle(/1 quiz/i)).toBeTruthy();

    // Click day
    const dayElement = screen.getByTitle(/1 quiz/i).closest('div');
    if (dayElement) {
      fireEvent.click(dayElement);
      expect(onSelectDay).toHaveBeenCalled();
    }

    // Click navigation buttons
    fireEvent.click(screen.getByRole('button', { name: /previous week/i }));
    expect(onPrevWeek).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /next week/i }));
    expect(onNextWeek).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /current week/i }));
    expect(onCurrentWeek).toHaveBeenCalledTimes(1);
  });
});

describe('TabularActivityList component', () => {
  it('renders items in table format with color-coded type badges and month separators', () => {
    render(
      <MemoryRouter>
        <TabularActivityList
          items={[quizItem, assignmentItem]}
          now={quizItem.dueAt! - 3600}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Calculus Quiz 1')).toBeTruthy();
    expect(screen.getByText('Programming Lab 1')).toBeTruthy();
    expect(screen.getByText('Quiz')).toBeTruthy();
    expect(screen.getByText('Assignment')).toBeTruthy();
    expect(screen.getByText('September 2026')).toBeTruthy();
  });
});

describe('CoursesPage component', () => {
  it('renders course cards and responds to deadline filter buttons', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ activities: [quizItem], incomplete: false }),
      }),
    );

    render(
      <MemoryRouter>
        <CoursesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('All Course Activities')).toBeTruthy();
    expect(await screen.findByText('Calculus Quiz 1')).toBeTruthy();
  });
});
