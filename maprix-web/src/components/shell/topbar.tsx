import { ChevronRight } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { cn } from '@/lib/utils';
import type { Area, NavItem } from './nav-items';
import { AREA_LABELS } from './nav-items';
import { MobileSidebar } from './mobile-sidebar';

interface TopbarProps {
  area: Area;
  items: NavItem[];
}

export function Topbar({ area, items }: TopbarProps) {
  const location = useLocation();
  const current = items.find((item) => location.pathname.startsWith(item.to));
  const areaLabel = AREA_LABELS[area];

  return (
    <header
      className={cn(
        'sticky top-0 z-20 h-14 shrink-0',
        'border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60',
      )}
    >
      <div className="h-full flex items-center gap-2 px-3 sm:px-4">
        <MobileSidebar items={items} areaLabel={areaLabel} />

        <a href="/" className="md:hidden flex items-center gap-2 min-w-0" aria-label="Maprix">
          <img src="/logo-mark.svg" alt="" aria-hidden className="h-6 w-6 shrink-0" />
          <span className="text-base font-semibold tracking-tight truncate">Maprix</span>
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
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">MC</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
