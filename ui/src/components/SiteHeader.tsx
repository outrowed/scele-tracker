import { Link } from 'react-router-dom';
import { Layers3, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function SiteHeader() {
  const { user, logout } = useAuth();
  return (
    <header className="site-header">
      <div className="page-width flex min-h-20 items-center justify-between gap-4">
        <Link to="/" className="brand">
          <span className="brand-icon">
            <Layers3 size={23} />
          </span>
          SCELE Tracker<span className="brand-tag">CS UI</span>
        </Link>
        {user ? (
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-slate-500 sm:block">
              {user.fullname}
            </span>
            {user.role === 'admin' && (
              <Link className="secondary-button" to="/admin">
                Admin
              </Link>
            )}
            <button onClick={logout} className="secondary-button" aria-label="Sign out">
              <LogOut size={16} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        ) : (
          <span className="hidden text-xs text-slate-500 sm:block">
            Built for a clearer semester
          </span>
        )}
      </div>
    </header>
  );
}
