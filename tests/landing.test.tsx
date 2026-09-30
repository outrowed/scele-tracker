// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LandingPage from '../ui/src/pages/LandingPage';

afterEach(cleanup);

it('preserves the hero, showcases real features, and labels illustrative data', () => {
  const { container } = render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  );
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
    'Never miss a SCELE deadline again.',
  );
  expect(container.textContent).not.toMatch(/lorem ipsum/i);
  expect(
    screen.getByRole('heading', { name: 'Know what your week is asking of you.' }),
  ).toBeTruthy();
  expect(
    screen.getByRole('heading', { name: 'Zoom out before deadlines sneak up.' }),
  ).toBeTruthy();
  expect(
    screen.getByRole('heading', { name: 'Find a room between classes.' }),
  ).toBeTruthy();
  expect(screen.getByText(/Sample activities, not live student data/)).toBeTruthy();
  const headings = [...container.querySelectorAll('h2')].map((el) => el.textContent);
  expect(headings.indexOf('Find a room between classes.')).toBeGreaterThan(
    headings.indexOf('Zoom out before deadlines sneak up.'),
  );
});

it('links to existing sign-in and feature anchors and provides comprehensive FAQ disclosures', () => {
  render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  );
  for (const link of screen.getAllByRole('link', { name: /Sign In with UI SSO/i })) {
    expect(link.getAttribute('href')).toBe('/login');
  }
  expect(
    screen.getByRole('link', { name: 'Explore Features' }).getAttribute('href'),
  ).toBe('#features');
  expect(document.getElementById('features')).toBeTruthy();

  // Verify expanded FAQ questions
  const faqQuestions = [
    'Does this replace SCELE?',
    'How does it work behind the scenes?',
    'How is my privacy and personal data protected?',
    'What key features are available?',
    'How often is my coursework data synced?',
    'How does the Backrooms room finder work?',
  ];

  for (const question of faqQuestions) {
    const summary = screen.getByText(question);
    expect(summary).toBeTruthy();
    fireEvent.click(summary);
    expect(summary.closest('details')?.open).toBe(true);
  }
});
