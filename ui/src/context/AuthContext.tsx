import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
export type User = {
  username: string;
  fullname: string;
  role: 'admin' | 'user';
  prodi?: string;
  angkatan?: string;
  kd_org?: string;
  academicInfo?: string;
};
const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
  error: string;
  logout: () => Promise<void>;
}>({ user: null, loading: true, error: '', logout: async () => {} });
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Verify both the app cookie and Moodle session on mount and when a tab resumes.
  useEffect(() => {
    let active = true;
    let inFlight = false;
    async function check(force = false) {
      if ((!force && document.visibilityState !== 'visible') || inFlight) return;
      inFlight = true;
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) throw new Error('Unable to check your session. Please reload.');
        const data = await response.json();
        if (active) {
          setUser(data.user);
          setError('');
        }
      } catch (error) {
        if (active) setError((error as Error).message);
      } finally {
        inFlight = false;
        if (active) setLoading(false);
      }
    }
    void check(true);
    const onVisible = () => {
      void check();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      active = false;
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
  // Activity requests can discover expiry before the next session check.
  useEffect(() => {
    function expired() {
      setUser(null);
      setError('Your SCELE session expired. Sign in again to reconnect.');
    }
    window.addEventListener('scele-session-expired', expired);
    return () => window.removeEventListener('scele-session-expired', expired);
  }, []);
  // Clear the server cookie first; only a successful logout signs out all context consumers.
  async function logout() {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error('Could not sign out. Please try again.');
      setUser(null);
    } catch (error) {
      setError((error as Error).message);
    }
  }
  return (
    <AuthContext.Provider value={{ user, loading, error, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
