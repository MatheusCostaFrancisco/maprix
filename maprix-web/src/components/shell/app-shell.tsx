import { Suspense, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useSidebarState } from '@/hooks/use-sidebar-state';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { getNav, type Area } from './nav-items';

interface AppShellProps {
  area: Area;
}

/**
 * Moldura compartilhada entre engenharia e cartório.
 * Cartório força tema light enquanto a área está montada e restaura
 * a preferência do usuário ao desmontar.
 */
export function AppShell({ area }: AppShellProps) {
  const items = getNav(area);
  const { collapsed, toggle } = useSidebarState();
  const location = useLocation();
  const reduce = useReducedMotion();

  useForcedLightTheme(area === 'cartorio');

  return (
    <div className="min-h-[100dvh] flex bg-background text-foreground">
      <Sidebar area={area} items={items} collapsed={collapsed} onToggle={toggle} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar area={area} items={items} />
        <main className="flex-1 w-full">
          <motion.div
            key={location.pathname}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8"
          >
            <Suspense
              fallback={
                <div className="flex justify-center py-24">
                  <Loader2
                    className="h-6 w-6 animate-spin text-muted-foreground"
                    aria-label="Carregando"
                  />
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </motion.div>
        </main>
      </div>
    </div>
  );
}

function useForcedLightTheme(enabled: boolean) {
  const { theme, setTheme } = useTheme();
  const previousRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!enabled) return;
    previousRef.current = theme;
    setTheme('light');
    return () => {
      const prev = previousRef.current;
      if (prev && prev !== 'light') setTheme(prev);
    };
    // theme é lido apenas no mount — não queremos re-disparar em toggles internos
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, setTheme]);
}
