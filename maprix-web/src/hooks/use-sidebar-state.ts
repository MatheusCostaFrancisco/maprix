import { useEffect, useState } from 'react';

const STORAGE_KEY = 'maprix:sidebar-collapsed';

/**
 * Persiste o estado colapsado da sidebar desktop em localStorage.
 * Default: expandida (false).
 */
export function useSidebarState() {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      /* storage bloqueado — silencia */
    }
  }, [collapsed]);

  return {
    collapsed,
    toggle: () => setCollapsed((v) => !v),
    expand: () => setCollapsed(false),
    collapse: () => setCollapsed(true),
  };
}
