import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
type User = { username: string; fullname: string; role: 'admin' | 'user' };
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
  useEffect(() => {
    fetch('/api/auth/me')
      .then((response) => {
        if (!response.ok) throw new Error('Unable to check your session. Please reload.');
        return response.json();
      })
      .then((data) => setUser(data.user))
      .catch((error) => setError(error.message))
      .finally(() => setLoading(false));
  }, []);
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
