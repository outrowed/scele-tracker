// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SiteHeader } from '../ui/src/components/SiteHeader';
import { SiteFooter } from '../ui/src/components/SiteFooter';
import * as AuthContextModule from '../ui/src/context/AuthContext';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
  document.documentElement.classList.remove('dark');
});

describe('SiteHeader mobile hamburger navigation', () => {
  it('persists a manual theme and follows system changes in automatic mode', async () => {
    const listeners = new Set<() => void>();
    const media = {
      matches: false,
      addEventListener: (_event: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_event: string, listener: () => void) =>
        listeners.delete(listener),
    };
    vi.stubGlobal('matchMedia', () => media);
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      loading: false,
      error: '',
      logout: vi.fn(),
    });
    render(
      <MemoryRouter>
        <SiteHeader />
        <SiteFooter />
      </MemoryRouter>,
    );
    const theme = within(screen.getByRole('contentinfo')).getByRole('combobox', {
      name: /color theme/i,
    });
    expect(within(screen.getByRole('banner')).queryByRole('combobox')).toBeNull();
    fireEvent.change(theme, { target: { value: 'dark' } });
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('scele-theme')).toBe('dark');
    fireEvent.change(theme, { target: { value: 'system' } });
    expect(localStorage.getItem('scele-theme')).toBeNull();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    media.matches = true;
    for (const listener of listeners) listener();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('toggles mobile menu and displays user details and navigation links', async () => {
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
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

  it('renders desktop profile popup menu with admin link, theme selector, and prodi info', async () => {
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    const logoutMock = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        username: '2606123456',
        fullname: 'Taruna Prasetya',
        role: 'admin',
        prodi: 'Ilmu Komputer',
        angkatan: '2026',
        kd_org: '01.00.12.01',
        academicInfo: 'Ilmu Komputer (01.00.12.01)',
      },
      loading: false,
      error: '',
      logout: logoutMock,
    });

    render(
      <MemoryRouter>
        <SiteHeader />
      </MemoryRouter>,
    );

    // Profile menu trigger button
    const accountBtn = screen.getByRole('button', { name: /account menu/i });
    expect(accountBtn).toBeTruthy();
    expect(screen.queryByRole('menu', { name: /profile popup menu/i })).toBeNull();

    // Click to open profile popup menu
    await act(async () => {
      fireEvent.click(accountBtn);
    });

    const menu = screen.getByRole('menu', { name: /profile popup menu/i });
    expect(menu).toBeTruthy();
    const menuScope = within(menu);

    // Displays name, username (without @), administrator role badge, prodi with code, and class year
    expect(menuScope.getByText('Taruna Prasetya')).toBeTruthy();
    expect(menuScope.getByText(/2606/)).toBeTruthy();
    expect(menuScope.queryByText(/@2606/)).toBeNull();
    expect(menuScope.getByText('Administrator')).toBeTruthy();
    expect(menuScope.getByText('Ilmu Komputer (01.00.12.01)')).toBeTruthy();
    expect(menuScope.getByText('Class of 2026')).toBeTruthy();

    // Contains Admin Page link (for admin role)
    const adminLink = menuScope.getByRole('menuitem', { name: /admin page/i });
    expect(adminLink.getAttribute('href')).toBe('/admin');

    // Contains Theme selector combobox
    expect(menuScope.getByRole('combobox', { name: /color theme/i })).toBeTruthy();

    // Contains Sign out button
    const signOutBtn = menuScope.getByRole('menuitem', { name: /sign out/i });
    await act(async () => {
      fireEvent.click(signOutBtn);
    });

    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu', { name: /profile popup menu/i })).toBeNull();
  });
});
