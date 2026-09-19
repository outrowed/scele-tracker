// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ActivityCard } from '../ui/src/ActivityCard';
import { status, remaining, type Activity } from '../ui/src/model';
afterEach(cleanup);
const item: Activity = { id: 'source-quiz-1', name: 'Logic quiz', kind: 'quiz', courseId: 1, courseName: 'Discrete Mathematics', description: 'Practice logic.', dueAt: 200, opensAt: 100, cutoffAt: null, timeLimit: 600, source: 'source', url: 'https://scele.cs.ui.ac.id/mod/quiz/view.php?id=1' };
describe('activity feed', () => {
  it('separates upcoming, passed, and missing deadlines', () => {
    expect(status(item, 199)).toBe('upcoming'); expect(status(item, 200)).toBe('past'); expect(status({ ...item, dueAt: null }, 200)).toBe('undated');
    expect(remaining(null)).toBe('No deadline available');
  });
  it('links cards to details and renders Moodle markup as text', () => {
    render(<MemoryRouter><ActivityCard item={{ ...item, name: '<img src=x onerror=alert(1)>' }} /></MemoryRouter>);
    expect(screen.getByRole('link').getAttribute('href')).toBe('/activities/source-quiz-1');
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('Discrete Mathematics')).toBeTruthy();
  });
});
