import { Menu } from 'lucide-react';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { NavItem } from './nav-items';

interface MobileSidebarProps {
  items: NavItem[];
  areaLabel: string;
}

export function MobileSidebar({ items, areaLabel }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b border-border px-4 py-3">
          <SheetTitle className="flex items-center gap-2 text-base font-semibold tracking-tight">
            <img src="/logo-mark.svg" alt="" aria-hidden className="h-6 w-6" />
            Maprix
            <span className="text-xs text-muted-foreground font-normal">· {areaLabel}</span>
          </SheetTitle>
        </SheetHeader>
        <nav className="p-2 space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md h-10 px-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-accent/10 text-accent border-l-2 border-accent pl-[10px]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
          {items.length === 0 && (
            <p className="px-3 py-4 text-sm text-muted-foreground">
              Sem telas disponíveis nesta área ainda.
            </p>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
