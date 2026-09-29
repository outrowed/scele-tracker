// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ActivityCard } from '../ui/src/components/ActivityCard';
import { ActivityStatus } from '../ui/src/components/ActivityStatus';
import { TabularActivityList } from '../ui/src/components/TabularActivityList';
import AdminPage from '../ui/src/pages/AdminPage';
import DashboardPage from '../ui/src/pages/DashboardPage';
import { status, remaining, scheduleAt, type Activity } from '../ui/src/model';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const item: Activity = {
  id: 'source-quiz-1',
  name: 'Logic quiz',
  kind: 'quiz',
  courseId: 1,
  courseName: 'Discrete Mathematics',
  description: 'Practice logic.',
  dueAt: 200,
  opensAt: 100,
  cutoffAt: null,
  timeLimit: 600,
  source: 'source',
  url: 'https://scele.cs.ui.ac.id/mod/quiz/view.php?id=1',
};

describe('activity feed', () => {
  it('does not label an unchecked deadline as absent', () => {
    const { rerender } = render(
      <ActivityStatus item={{ ...item, dueAt: null, datesPending: true }} now={201} />,
    );
    expect(screen.getByText('Checking dates…')).toBeTruthy();
    expect(screen.queryByText('No deadline')).toBeNull();
    rerender(<ActivityStatus item={{ ...item, dueAt: null }} now={201} />);
    expect(screen.getByText('No deadline')).toBeTruthy();
  });

  it('separates upcoming, passed, and missing deadlines', () => {
    expect(status(item, 199)).toBe('upcoming');
    expect(status(item, 200)).toBe('past');
    expect(status({ ...item, dueAt: null }, 200)).toBe('undated');
    expect(remaining(null)).toBe('No deadline available');
  });

  it('groups a closed quiz by close date rather than under no date', () => {
    const quiz: Activity = {
      ...item,
      dueAt: null,
      closeAt: Date.parse('2026-09-22T10:00:00Z') / 1000,
    };
    expect(scheduleAt(quiz)).toBe(quiz.closeAt);
    expect(status(quiz, Date.parse('2026-09-23T00:00:00Z') / 1000)).toBe('past');
    render(
      <MemoryRouter>
        <TabularActivityList
          items={[quiz]}
          now={Date.parse('2026-09-23T00:00:00Z') / 1000}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('September 2026')).toBeTruthy();
    expect(screen.queryByText('No Deadline / Undated')).toBeNull();
    expect(screen.getByText(/22 Sep.* 2026, 10:00/)).toBeTruthy();
    expect(scheduleAt({ ...quiz, kind: 'assignment' })).toBeNull();
  });

  it('links cards to details and renders Moodle markup as text', () => {
    render(
      <MemoryRouter>
        <ActivityCard item={{ ...item, name: '<img src=x onerror=alert(1)>' }} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link').getAttribute('href')).toBe(
      '/activities/source-quiz-1',
    );
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('Discrete Mathematics')).toBeTruthy();
  });
});

describe('personal activity filters', () => {
  it('combines multiple values in a column and removes pills', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        activities: [
          item,
          { ...item, id: 'assignment-2', name: 'Assignment', kind: 'assignment' },
        ],
        incomplete: false,
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );
    await act(async () => {
      await Promise.resolve();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Filters' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Quiz' }));
    expect(screen.getByRole('button', { name: 'Remove Type: Quiz' })).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Assignment' }));
    expect(screen.getByRole('button', { name: 'Remove Type: Assignment' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Remove Type: Quiz' }));
    expect(screen.queryByRole('button', { name: 'Remove Type: Quiz' })).toBeNull();
    expect(screen.queryByText('Keep your next deadline in sight.')).toBeNull();
    expect(screen.queryByText('A planner, not a gradebook.')).toBeNull();
  });
});

describe('admin controls', () => {
  it('resets local storage via the reset button', async () => {
    localStorage.setItem('scele_dismiss_dashboard_slogan', 'true');
    localStorage.setItem('scele_dismiss_dashboard_guide', 'true');
    expect(localStorage.getItem('scele_dismiss_dashboard_slogan')).toBe('true');

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ configured: true, sources: [], checkedAt: null }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MemoryRouter>
        <AdminPage />
      </MemoryRouter>,
    );

    const resetButton = screen.getByRole('button', { name: /reset local preferences/i });
    await act(async () => {
      fireEvent.click(resetButton);
    });

    expect(localStorage.getItem('scele_dismiss_dashboard_slogan')).toBeNull();
    expect(localStorage.getItem('scele_dismiss_dashboard_guide')).toBeNull();
    expect(screen.getByText(/have been reset/i)).toBeTruthy();
  });
});
