import { ChevronRight, LogOut } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { Logo } from '@/components/shared/logo';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import type { Area, NavItem } from './nav-items';
import { AREA_LABELS } from './nav-items';
import { MobileSidebar } from './mobile-sidebar';

const ROLE_LABELS: Record<Area, string> = {
  engenharia: 'Engenheiro',
  cartorio: 'Cartório',
};

interface TopbarProps {
  area: Area;
  items: NavItem[];
}

function userInitials(name: string | null, email: string | undefined): string {
  const src = name || email || '?';
  return src
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join('');
}

export function Topbar({ area, items }: TopbarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const current = items.find((item) => location.pathname.startsWith(item.to));
  const areaLabel = AREA_LABELS[area];
  const initials = userInitials(user?.name ?? null, user?.email);

  return (
    <header
      className={cn(
        'sticky top-0 z-20 h-14 shrink-0',
        'border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60',
      )}
    >
      <div className="h-full flex items-center gap-2 px-3 sm:px-4">
        <MobileSidebar items={items} areaLabel={areaLabel} />

        <a href="/" className="md:hidden flex items-center min-w-0" aria-label="Maprix">
          <Logo wordmarkClassName="text-base truncate" />
        </a>

        <nav
          aria-label="Trilha"
          className="hidden md:flex items-center gap-1.5 text-sm min-w-0"
        >
          <span className="text-muted-foreground">{areaLabel}</span>
          {current && (
            <>
              <ChevronRight
                className="h-4 w-4 text-muted-foreground shrink-0"
                strokeWidth={1.5}
              />
              <span className="font-medium text-foreground truncate">{current.label}</span>
            </>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {area !== 'cartorio' && <ThemeToggle />}
          <div className="mx-1 hidden h-6 w-px bg-border sm:block" aria-hidden />
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <span className="max-w-[12rem] truncate text-sm font-medium">
              {user?.name ?? user?.email ?? '—'}
            </span>
            <span className="text-xs text-muted-foreground">{ROLE_LABELS[area]}</span>
          </div>
          <Avatar className="h-8 w-8" title={user?.name ?? user?.email ?? undefined}>
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => void logout()}
            aria-label="Sair"
            title="Sair"
          >
            <LogOut />
          </Button>
        </div>
      </div>
    </header>
  );
}
