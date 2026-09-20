import { Link } from 'react-router-dom';
import { Layers3, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Container } from './Container';
import { Button, ButtonLink } from './Button';
import styles from './SiteHeader.module.css';

export function SiteHeader() {
  const { user, logout } = useAuth();
  return (
    <header className="border-b border-slate-200/80 bg-white">
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
        {user ? (
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-slate-500 sm:block">
              {user.fullname}
            </span>
            {user.role === 'admin' && (
              <ButtonLink variant="secondary" to="/admin">
                Admin
              </ButtonLink>
            )}
            <Button onClick={logout} aria-label="Sign out">
              <LogOut size={16} />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        ) : (
          <span className="hidden text-xs text-slate-500 sm:block">
            Built for a clearer semester
          </span>
        )}
      </Container>
    </header>
  );
}
