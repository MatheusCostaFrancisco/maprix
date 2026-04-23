import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  /**
   * Variante `cartorio` usa tipografia e espaçamento generosos (Mercury vibes).
   * Default é `engenharia` (Mapbox vibes — compacto).
   */
  variant?: 'engenharia' | 'cartorio';
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  variant = 'engenharia',
  className,
}: PageHeaderProps) {
  const cartorio = variant === 'cartorio';
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 border-b border-border',
        cartorio ? 'pb-8 mb-8' : 'pb-6 mb-6',
        className,
      )}
    >
      <div>
        <h1
          className={cn(
            'font-semibold tracking-tight text-foreground',
            cartorio ? 'text-3xl' : 'text-2xl',
          )}
        >
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
