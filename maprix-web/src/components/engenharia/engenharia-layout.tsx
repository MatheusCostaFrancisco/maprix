import { NavLink, Outlet } from 'react-router-dom';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { cn } from '@/lib/utils';

const links = [
  { to: '/engenharia/conversor', label: 'Conversor' },
  { to: '/engenharia/memorial-e-shapefile', label: 'Memorial & Shapefile' },
];

export function EngenhariaLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 min-w-0">
            <NavLink to="/engenharia/conversor" className="flex items-center gap-2 shrink-0">
              <img src="/logo-mark.svg" alt="" aria-hidden className="h-6 w-6" />
              <span className="text-base font-semibold tracking-tight">Maprix</span>
              <span className="hidden sm:inline text-xs text-muted-foreground">
                · Engenharia
              </span>
            </NavLink>
            <nav aria-label="Navegação principal" className="flex items-center gap-1 overflow-x-auto">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    cn(
                      'rounded-md px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap',
                      isActive
                        ? 'bg-secondary text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60',
                    )
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
