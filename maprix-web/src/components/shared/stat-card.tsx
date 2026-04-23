import type { LucideIcon } from 'lucide-react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: { value: number; label: string };
  icon?: LucideIcon;
  className?: string;
}

export function StatCard({ label, value, change, icon: Icon, className }: StatCardProps) {
  const positive = (change?.value ?? 0) >= 0;
  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        {Icon && (
          <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
        )}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {change && (
        <div className="mt-2 flex items-center gap-1 text-xs">
          {positive ? (
            <TrendingUp className="h-3 w-3 text-success" />
          ) : (
            <TrendingDown className="h-3 w-3 text-destructive" />
          )}
          <span className={positive ? 'text-success' : 'text-destructive'}>
            {positive ? '+' : ''}
            {change.value}%
          </span>
          <span className="text-muted-foreground">{change.label}</span>
        </div>
      )}
    </Card>
  );
}
