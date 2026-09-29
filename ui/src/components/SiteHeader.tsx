import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Calendar, Layers3, LogOut, Menu, Shield, User, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Container } from './Container';
import { Button } from './Button';
import styles from './SiteHeader.module.css';

export function SiteHeader() {
  const { user, loading, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Close the mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const isFeedActive = location.pathname === '/';
  const isCoursesActive = location.pathname.startsWith('/courses');
  const isCalendarActive = location.pathname.startsWith('/calendar');
  const isAdminActive = location.pathname.startsWith('/admin');

  const desktopNavLinkClass = (isActive: boolean) =>
    `inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition ${
      isActive
        ? 'border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-200 font-semibold shadow-xs'
        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-teal-500 dark:hover:border-teal-500 hover:text-teal-700 dark:hover:text-teal-300'
    }`;

  const mobileNavLinkClass = (isActive: boolean) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
      isActive
        ? 'border-l-4 border-teal-700 bg-teal-50 dark:bg-teal-950 font-semibold text-teal-800 dark:text-teal-200'
        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-teal-700 dark:hover:text-teal-300'
    }`;

  return (
    <header className="border-b border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800">
      <Container className="flex min-h-20 items-center justify-between gap-4">
        <Link
          to="/"
          className="flex items-center gap-2.5 text-lg font-bold tracking-tight"
        >
          <span className="inline-flex rounded-xl bg-teal-700 p-2 text-white">
            <Layers3 size={23} />
          </span>
          <span className="whitespace-nowrap">SCELE Tracker</span>
          <span className={styles.brandTag}>Made with ❤️ by #CSUI2026</span>
        </Link>
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            <div className="h-2 w-2 rounded-full bg-teal-600 dark:bg-teal-400 animate-pulse" />
            <span className="hidden sm:inline">Checking session…</span>
          </div>
        ) : user ? (
          <>
            {/* Desktop navigation matching drawer layout & active tab indicators */}
            <div className="hidden sm:flex sm:items-center sm:gap-2 md:gap-3">
              <nav
                aria-label="Main navigation"
                className="flex items-center gap-1.5 md:gap-2"
              >
                <Link
                  to="/"
                  aria-current={isFeedActive ? 'page' : undefined}
                  className={desktopNavLinkClass(isFeedActive)}
                >
                  <Layers3
                    size={16}
                    className={
                      isFeedActive
                        ? 'text-teal-700 dark:text-teal-300'
                        : 'text-slate-400 dark:text-slate-400'
                    }
                  />
                  <span className="hidden md:inline">Activity Feed</span>
                  <span className="md:hidden">Feed</span>
                </Link>

                <Link
                  to="/courses"
                  aria-current={isCoursesActive ? 'page' : undefined}
                  className={desktopNavLinkClass(isCoursesActive)}
                >
                  <BookOpen
                    size={16}
                    className={
                      isCoursesActive
                        ? 'text-teal-700 dark:text-teal-300'
                        : 'text-slate-400 dark:text-slate-400'
                    }
                  />
                  <span>Courses</span>
                </Link>

                <Link
                  to="/calendar"
                  aria-current={isCalendarActive ? 'page' : undefined}
                  className={desktopNavLinkClass(isCalendarActive)}
                >
                  <Calendar
                    size={16}
                    className={
                      isCalendarActive
                        ? 'text-teal-700 dark:text-teal-300'
                        : 'text-slate-400 dark:text-slate-400'
                    }
                  />
                  <span>Calendar</span>
                </Link>

                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    aria-current={isAdminActive ? 'page' : undefined}
                    className={desktopNavLinkClass(isAdminActive)}
                  >
                    <Shield
                      size={16}
                      className={
                        isAdminActive
                          ? 'text-teal-700 dark:text-teal-300'
                          : 'text-slate-400 dark:text-slate-400'
                      }
                    />
                    <span>Admin</span>
                  </Link>
                )}
              </nav>

              <div className="h-6 w-px bg-slate-200/80 dark:bg-slate-700/80" />

              {/* Desktop user profile (chipless) */}
              <div
                className="flex items-center gap-2 text-slate-600 dark:text-slate-300"
                title={`${user.fullname} (${user.role})`}
              >
                <User size={16} className="text-slate-400 dark:text-slate-400" />
                <span className="hidden text-sm font-medium text-slate-600 dark:text-slate-300 lg:inline">
                  {user.fullname}
                </span>
              </div>

              <Button onClick={logout} aria-label="Sign out" className="!px-3">
                <LogOut size={16} />
                <span className="hidden xl:inline">Sign out</span>
              </Button>
            </div>

            {/* Mobile hamburger toggle button */}
            <div className="flex items-center sm:hidden">
              <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={isOpen}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition hover:border-teal-500 dark:hover:border-teal-500 hover:text-teal-700 dark:hover:text-teal-300"
              >
                {isOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
            >
              Sign In
            </Link>
          </div>
        )}
      </Container>

      {/* Mobile dropdown navigation menu */}
      {user && isOpen && (
        <div className="border-t border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 px-5 py-4 sm:hidden">
          <div className="mb-4 flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 pb-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-teal-200/70 dark:border-teal-800/70 bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
              <User size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                {user.fullname}
              </p>
              <p className="text-xs capitalize text-slate-400 dark:text-slate-400">
                {user.role}
              </p>
            </div>
          </div>
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            <Link
              to="/"
              aria-current={isFeedActive ? 'page' : undefined}
              onClick={() => setIsOpen(false)}
              className={mobileNavLinkClass(isFeedActive)}
            >
              <Layers3
                size={18}
                className={
                  isFeedActive
                    ? 'text-teal-700 dark:text-teal-300'
                    : 'text-slate-400 dark:text-slate-400'
                }
              />
              Activity Feed
            </Link>
            <Link
              to="/courses"
              aria-current={isCoursesActive ? 'page' : undefined}
              onClick={() => setIsOpen(false)}
              className={mobileNavLinkClass(isCoursesActive)}
            >
              <BookOpen
                size={18}
                className={
                  isCoursesActive
                    ? 'text-teal-700 dark:text-teal-300'
                    : 'text-slate-400 dark:text-slate-400'
                }
              />
              Courses
            </Link>
            <Link
              to="/calendar"
              aria-current={isCalendarActive ? 'page' : undefined}
              onClick={() => setIsOpen(false)}
              className={mobileNavLinkClass(isCalendarActive)}
            >
              <Calendar
                size={18}
                className={
                  isCalendarActive
                    ? 'text-teal-700 dark:text-teal-300'
                    : 'text-slate-400 dark:text-slate-400'
                }
              />
              Calendar
            </Link>
            {user.role === 'admin' && (
              <Link
                to="/admin"
                aria-current={isAdminActive ? 'page' : undefined}
                onClick={() => setIsOpen(false)}
                className={mobileNavLinkClass(isAdminActive)}
              >
                <Shield
                  size={18}
                  className={
                    isAdminActive
                      ? 'text-teal-700 dark:text-teal-300'
                      : 'text-slate-400 dark:text-slate-400'
                  }
                />
                Administration
              </Link>
            )}
            <div className="my-2 border-t border-slate-100 dark:border-slate-700" />
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-rose-600 dark:text-rose-300 transition hover:bg-rose-50 dark:hover:bg-rose-950"
            >
              <LogOut size={18} className="text-rose-500 dark:text-rose-400" />
              Sign out
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
