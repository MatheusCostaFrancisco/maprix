import { Outlet } from 'react-router-dom';
import { useSidebarState } from '@/hooks/use-sidebar-state';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { getNav, type Area } from './nav-items';

interface AppShellProps {
  area: Area;
}

/**
 * Moldura de aplicação compartilhada entre as áreas de engenharia e cartório.
 * Combina:
 *   - Sidebar desktop colapsável (w-64 ↔ w-16) com persistência em localStorage
 *   - Sheet drawer em mobile (<768px)
 *   - Topbar sticky com breadcrumb, ThemeToggle e Avatar
 *   - Container centrado com max-w-5xl para o conteúdo de cada rota
 */
export function AppShell({ area }: AppShellProps) {
  const items = getNav(area);
  const { collapsed, toggle } = useSidebarState();

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <Sidebar items={items} collapsed={collapsed} onToggle={toggle} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar area={area} items={items} />
        <main className="flex-1 w-full">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
