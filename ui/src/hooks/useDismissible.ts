import { useState } from 'react';

/**
 * Hook to manage persistent dismissal state in localStorage.
 * Falls back gracefully if localStorage is unavailable or throws.
 */
export function useDismissible(key: string): [boolean, () => void, () => void] {
  const storageKey = `scele_dismiss_${key}`;
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return (
        typeof window !== 'undefined' &&
        window.localStorage.getItem(storageKey) === 'true'
      );
    } catch {
      return false;
    }
  });

  const dismiss = () => {
    setIsDismissed(true);
    try {
      window.localStorage.setItem(storageKey, 'true');
    } catch {
      // Ignore write errors (e.g. private browsing storage restrictions)
    }
  };

  const reset = () => {
    setIsDismissed(false);
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // Ignore storage errors
    }
  };

  return [isDismissed, dismiss, reset];
}

/**
 * Helper to clear all local tracker preferences and dismissals from localStorage.
 */
export function resetLocalPreferences() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  } catch {
    // Ignore storage errors
  }
}
