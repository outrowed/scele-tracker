// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SiteHeader } from '../ui/src/components/SiteHeader';
import * as AuthContextModule from '../ui/src/context/AuthContext';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('SiteHeader mobile hamburger navigation', () => {
  it('toggles mobile menu and displays user details and navigation links', async () => {
    const logoutMock = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { username: 'testuser', fullname: 'Test Student', role: 'admin' },
      loading: false,
      error: '',
      logout: logoutMock,
    });

    render(
      <MemoryRouter>
        <SiteHeader />
      </MemoryRouter>,
    );

    // Hamburger button should exist on the screen
    const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
    expect(menuButton).toBeTruthy();
    expect(screen.queryByRole('navigation', { name: /mobile navigation/i })).toBeNull();

    // Click hamburger button to open menu
    await act(async () => {
      fireEvent.click(menuButton);
    });

    // Mobile nav should now be open
    expect(screen.getByRole('button', { name: /close navigation menu/i })).toBeTruthy();
    const nav = screen.getByRole('navigation', { name: /mobile navigation/i });
    expect(nav).toBeTruthy();

    // Verify links inside mobile navigation drawer
    const navScope = within(nav);
    expect(
      navScope.getByRole('link', { name: /activity feed/i }).getAttribute('href'),
    ).toBe('/');
    expect(navScope.getByRole('link', { name: /courses/i }).getAttribute('href')).toBe(
      '/courses',
    );
    expect(navScope.getByRole('link', { name: /calendar/i }).getAttribute('href')).toBe(
      '/calendar',
    );
    expect(
      navScope.getByRole('link', { name: /administration/i }).getAttribute('href'),
    ).toBe('/admin');
    expect(screen.getAllByText('Test Student').length).toBeGreaterThanOrEqual(1);

    // Click sign out inside the mobile menu
    const signOutBtn = navScope.getByRole('button', { name: /sign out/i });
    await act(async () => {
      fireEvent.click(signOutBtn);
    });

    expect(logoutMock).toHaveBeenCalledTimes(1);
    // Menu should close on sign out
    expect(screen.queryByRole('navigation', { name: /mobile navigation/i })).toBeNull();
  });
});
