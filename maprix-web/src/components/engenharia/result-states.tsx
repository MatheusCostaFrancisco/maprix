import { AlertCircle, Lock, type LucideIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';

/** Skeleton padrão pra aguardar resposta de API (tabela + métricas). */
export function ResultSkeleton() {
  return (
    <Card className="p-6 space-y-4">
      <div className="flex gap-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-24" />
      </div>
      <Skeleton className="h-9 w-full" />
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </Card>
  );
}

/** Alert destructive padrão com CTA de retry. */
export function ResultError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertTitle>Falha ao processar</AlertTitle>
      <AlertDescription className="flex items-center justify-between gap-4">
        <span>{message}</span>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Tentar novamente
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

/** Estado vazio inicial (antes do usuário disparar a ação). */
export function ResultIdle({
  icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <EmptyState icon={icon} title={title} description={description} />
    </Card>
  );
}

/**
 * Estado "sem permissão" — usado como stub até a camada de auth existir.
 * Ative via query param ?state=unauthorized em qualquer tela de engenharia.
 */
export function UnauthorizedState() {
  return (
    <Card>
      <EmptyState
        icon={Lock}
        title="Acesso restrito"
        description="Esta área é exclusiva para responsáveis técnicos habilitados. Entre em contato com o administrador do projeto."
      />
    </Card>
  );
}

/** Helper: lê `?state=unauthorized` e retorna a flag. */
export function useForcedUnauthorized(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('state') === 'unauthorized';
}
