import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Logo, LogoMark } from '@/components/shared/logo';
import { cn } from '@/lib/utils';
import { AREA_LABELS, type Area, type NavItem } from './nav-items';

interface SidebarProps {
  area: Area;
  items: NavItem[];
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ area, items, collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        'hidden md:flex shrink-0 flex-col border-r border-border bg-card',
        'transition-[width] duration-200 ease-out',
        collapsed ? 'w-16' : 'w-64',
      )}
      aria-label="Navegação lateral"
    >
      <div
        className={cn(
          'flex items-center border-b border-border h-14 shrink-0',
          collapsed ? 'justify-center px-0' : 'px-4',
        )}
      >
        {collapsed ? (
          <LogoMark className="h-7 w-7" />
        ) : (
          <Logo className="min-w-0" wordmarkClassName="text-base truncate" />
        )}
      </div>

      <nav className={cn('flex-1 overflow-y-auto p-2 space-y-1', collapsed && 'px-1')}>
        {!collapsed && (
          <p className="px-3 pb-1 pt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {AREA_LABELS[area]}
          </p>
        )}
        {items.map((item) => (
          <SidebarLink key={item.to} item={item} collapsed={collapsed} />
        ))}
        {items.length === 0 && !collapsed && (
          <p className="px-3 py-4 text-sm text-muted-foreground">
            Sem telas disponíveis nesta área ainda.
          </p>
        )}
      </nav>

      <div
        className={cn('border-t border-border p-2', collapsed ? 'flex justify-center' : '')}
      >
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onToggle}
              className={cn(
                'inline-flex items-center gap-2 rounded-md text-sm text-muted-foreground',
                'transition-colors hover:text-foreground hover:bg-secondary',
                collapsed ? 'h-9 w-9 justify-center' : 'h-9 px-3 w-full justify-start',
              )}
              aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
              aria-expanded={!collapsed}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <>
                  <PanelLeftClose className="h-4 w-4" />
                  <span>Recolher</span>
                </>
              )}
            </button>
          </TooltipTrigger>
          {collapsed && <TooltipContent side="right">Expandir menu</TooltipContent>}
        </Tooltip>
      </div>
    </aside>
  );
}

function SidebarLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const Icon = item.icon;

  const link = (
    <NavLink
      to={item.to}
      end={false}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-md text-sm font-medium transition-colors',
          collapsed ? 'h-9 w-9 justify-center mx-auto' : 'h-9 px-3',
          isActive
            ? 'bg-accent/10 text-accent'
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && !collapsed && (
            <span
              aria-hidden
              className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-accent"
            />
          )}
          <Icon className="h-4 w-4 shrink-0" strokeWidth={isActive ? 2 : 1.75} />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </>
      )}
    </NavLink>
  );

  if (!collapsed) return link;

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}
