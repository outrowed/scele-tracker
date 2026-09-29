import { useEffect, useState } from 'react';

type Theme = 'system' | 'light' | 'dark';
const key = 'scele-theme';

function savedTheme(): Theme {
  try {
    const value = localStorage.getItem(key);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}

export function ThemeSelect() {
  const [theme, setTheme] = useState<Theme>(savedTheme);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () =>
      document.documentElement.classList.toggle(
        'dark',
        theme === 'dark' || (theme === 'system' && media.matches),
      );
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);

  return (
    <select
      aria-label="Color theme"
      value={theme}
      onChange={(event) => {
        const next = event.target.value as Theme;
        setTheme(next);
        try {
          if (next === 'system') localStorage.removeItem(key);
          else localStorage.setItem(key, next);
        } catch {
          // Theme selection still works for this page when storage is unavailable.
        }
      }}
      className="min-h-10 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
    >
      <option value="system">System theme</option>
      <option value="light">Light theme</option>
      <option value="dark">Dark theme</option>
    </select>
  );
}
