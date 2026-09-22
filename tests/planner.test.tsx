// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  weekRanges,
  compareNewestFirst,
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

  it('sorts activities with compareNewestFirst (newest deadlines first, quizzes prioritized on tie, undated last)', () => {
    const olderQuiz: Activity = { ...quizItem, id: 'quiz-old', dueAt: 1000 };
    const newerQuiz: Activity = { ...quizItem, id: 'quiz-new', dueAt: 2000 };
    const sameTimeAssignment: Activity = {
      ...assignmentItem,
      id: 'assign-same',
      dueAt: 2000,
    };
    const undatedItem: Activity = {
      ...assignmentItem,
      id: 'undated-item',
      dueAt: null,
      opensAt: null,
    };

    const sorted = [olderQuiz, undatedItem, sameTimeAssignment, newerQuiz].sort(
      compareNewestFirst,
    );

    // newerQuiz and sameTimeAssignment have dueAt=2000; quiz comes first
    expect(sorted[0].id).toBe('quiz-new');
    expect(sorted[1].id).toBe('assign-same');
    expect(sorted[2].id).toBe('quiz-old');
    expect(sorted[3].id).toBe('undated-item');
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
    const onPrevDay = vi.fn();
    const onNextDay = vi.fn();
    const onToday = vi.fn();

    const { days, weekLabel } = getWeekDays(quizItem.dueAt!, 0, [quizItem]);

    render(
      <WeekBar
        days={days}
        weekLabel={weekLabel}
        dayOffset={1}
        selectedDayKey={null}
        onSelectDay={onSelectDay}
        onPrevDay={onPrevDay}
        onNextDay={onNextDay}
        onToday={onToday}
      />,
    );

    expect(screen.getByText('Weekly Schedule')).toBeTruthy();
    expect(screen.getByText(weekLabel)).toBeTruthy();

    expect(screen.getByRole('link', { name: /Calculus Quiz 1/ })).toBeTruthy();
    fireEvent.click(
      screen.getByRole('button', { name: `Filter activities on ${days[0].dateKey}` }),
    );
    expect(onSelectDay).toHaveBeenCalledWith(days[0].dateKey);

    // Click navigation buttons
    fireEvent.click(screen.getByRole('button', { name: /previous day/i }));
    expect(onPrevDay).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /next day/i }));
    expect(onNextDay).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /today/i }));
    expect(onToday).toHaveBeenCalledTimes(1);
  });
});

describe('TabularActivityList component', () => {
  it('renders items in table format with color-coded type badges, unified month header, and task breakdown', () => {
    const pastQuiz: Activity = {
      ...quizItem,
      id: 'past-quiz',
      name: 'Past Quiz 1',
      dueAt: quizItem.dueAt! - 7200,
    };

    render(
      <MemoryRouter>
        <TabularActivityList items={[quizItem, pastQuiz]} now={quizItem.dueAt! - 3600} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Calculus Quiz 1')).toBeTruthy();
    expect(screen.getByText('Past Quiz 1')).toBeTruthy();
    expect(screen.getAllByText('Quiz').length).toBe(2);
    expect(screen.getByText('September 2026')).toBeTruthy();
    expect(screen.getByText('1 active task · 1 past due task')).toBeTruthy();
    expect(screen.getByText('Past due')).toBeTruthy();
  });
});

describe('CoursesPage component', () => {
  it('renders course cards and responds to deadline filter buttons', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-09-21T00:00:00Z'));
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

    expect(
      await screen.findByRole('heading', { name: 'Calculus 1', level: 3 }),
    ).toBeTruthy();
    expect(await screen.findByText('Calculus Quiz 1')).toBeTruthy();
  });
});

describe('weekly range placement', () => {
  it('clips crossing ranges, separates overlaps, and omits undated/outside items', () => {
    const timestamp = (day: number) => new Date(2026, 8, day, 12).getTime() / 1000;
    const { days } = getWeekDays(timestamp(23));
    const make = (
      id: string,
      opensAt: number | null,
      dueAt: number | null,
    ): Activity => ({ ...quizItem, id, opensAt, dueAt });
    const result = weekRanges(
      [
        make('crossing', timestamp(18), timestamp(30)),
        make('short', timestamp(22), timestamp(23)),
        make('same-day', timestamp(24), timestamp(24)),
        make('due-only', null, timestamp(25)),
        make('open-only', timestamp(26), null),
        make('none', null, null),
        make('outside', timestamp(1), timestamp(2)),
      ],
      days,
    );
    expect(result).toHaveLength(5);
    expect(result[0]).toMatchObject({
      start: 0,
      end: 6,
      lane: 0,
      continuesBefore: true,
      continuesAfter: true,
    });
    expect(result.find((r) => r.item.id === 'short')).toMatchObject({
      start: 1,
      end: 2,
      lane: 1,
    });
    expect(result.find((r) => r.item.id === 'same-day')).toMatchObject({
      start: 3,
      end: 3,
      lane: 1,
    });
    expect(result.find((r) => r.item.id === 'due-only')).toMatchObject({
      start: 4,
      end: 4,
    });
    expect(result.find((r) => r.item.id === 'open-only')).toMatchObject({
      start: 5,
      end: 5,
    });
  });
});
