import { Link, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';
import { Container } from './Container';
import SignInPage from '../pages/SignInPage';
import DashboardPage from '../pages/DashboardPage';
import ActivityDetailsPage from '../pages/ActivityDetailsPage';
import AdminPage from '../pages/AdminPage';

export function AppLayout() {
  const { user, loading, error } = useAuth();
  return (
    <div className="min-h-screen">
      <SiteHeader />
      {error && (
        <Container
          as="p"
          role="alert"
          className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900"
        >
          {error}
        </Container>
      )}
      {loading ? (
        <Container as="main" className="py-20">
          Checking your session…
        </Container>
      ) : !user ? (
        <SignInPage />
      ) : (
        <Routes>
          <Route path="/" element={<DashboardPage />} />
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
