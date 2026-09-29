import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';
import { Container } from './Container';
import { PageSkeleton } from './PageSkeleton';
import LandingPage from '../pages/LandingPage';
import SignInPage from '../pages/SignInPage';
import DashboardPage from '../pages/DashboardPage';
import CoursesPage from '../pages/CoursesPage';
import ActivityDetailsPage from '../pages/ActivityDetailsPage';
import AdminPage from '../pages/AdminPage';
import CalendarPage from '../pages/CalendarPage';

export function AppLayout() {
  const { user, loading, error } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      {error && (
        <Container
          as="p"
          role="alert"
          className="mt-6 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 px-5 py-4 text-sm leading-6 text-amber-900 dark:text-amber-100"
        >
          {error}
        </Container>
      )}
      {loading ? (
        location.pathname === '/login' ? (
          <SignInPage />
        ) : (
          <PageSkeleton pathname={location.pathname} />
        )
      ) : !user ? (
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<SignInPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      ) : (
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route
            path="/admin"
            element={
              user.role === 'admin' ? (
                <AdminPage />
              ) : (
                <Container as="main" className="py-20">
                  Administrator access required.
                </Container>
              )
            }
          />
          <Route path="/activities/:id" element={<ActivityDetailsPage />} />
          <Route
            path="*"
            element={
              <Container as="main" className="py-20">
                <h1>Page not found</h1>
                <Link to="/">Return to the feed</Link>
              </Container>
            }
          />
        </Routes>
      )}
      <SiteFooter />
    </div>
  );
}
