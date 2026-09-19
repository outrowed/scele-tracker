import { Link, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';
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
        <p role="alert" className="notice page-width mt-6">
          {error}
        </p>
      )}
      {loading ? (
        <main className="page-width py-20">Checking your session…</main>
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
                <main className="page-width py-20">Administrator access required.</main>
              )
            }
          />
          <Route path="/activities/:id" element={<ActivityDetailsPage />} />
          <Route
            path="*"
            element={
              <main className="page-width py-20">
                <h1>Page not found</h1>
                <Link to="/">Return to the feed</Link>
              </main>
            }
          />
        </Routes>
      )}
      <SiteFooter />
    </div>
  );
}
