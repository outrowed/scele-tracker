// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ActivityCard } from '../ui/src/components/ActivityCard';
import AdminPage from '../ui/src/pages/AdminPage';
import DashboardPage from '../ui/src/pages/DashboardPage';
import { status, remaining, type Activity } from '../ui/src/model';

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
  it('separates upcoming, passed, and missing deadlines', () => {
    expect(status(item, 199)).toBe('upcoming');
    expect(status(item, 200)).toBe('past');
    expect(status({ ...item, dueAt: null }, 200)).toBe('undated');
    expect(remaining(null)).toBe('No deadline available');
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

describe('dashboard dismissible message boxes', () => {
  it('allows dismissing the slogan banner and remembers dismissal', async () => {
    localStorage.clear();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ activities: [item], incomplete: false }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Keep your next deadline in sight.')).toBeTruthy();
    const dismissBanner = screen.getByRole('button', { name: /dismiss slogan/i });
    await act(async () => {
      fireEvent.click(dismissBanner);
    });

    expect(screen.queryByText('Keep your next deadline in sight.')).toBeNull();
    expect(localStorage.getItem('scele_dismiss_dashboard_slogan')).toBe('true');

    cleanup();
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );
    expect(screen.queryByText('Keep your next deadline in sight.')).toBeNull();
  });

  it('allows dismissing the planner guide notice and remembers dismissal', async () => {
    localStorage.clear();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ activities: [item], incomplete: false }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('A planner, not a gradebook.')).toBeTruthy();
    const dismissGuide = screen.getByRole('button', { name: /dismiss guide/i });
    await act(async () => {
      fireEvent.click(dismissGuide);
    });

    expect(screen.queryByText('A planner, not a gradebook.')).toBeNull();
    expect(localStorage.getItem('scele_dismiss_dashboard_guide')).toBe('true');

    cleanup();
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );
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

    const resetButton = screen.getByRole('button', { name: /reset local storage/i });
    await act(async () => {
      fireEvent.click(resetButton);
    });

    expect(localStorage.getItem('scele_dismiss_dashboard_slogan')).toBeNull();
    expect(localStorage.getItem('scele_dismiss_dashboard_guide')).toBeNull();
    expect(screen.getByText(/have been reset/i)).toBeTruthy();
  });
});
