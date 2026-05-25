import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import type { Area } from '@/components/shell/nav-items';
import { useAuth } from '@/contexts/auth-context';
import { ROLE_AREA, ROLE_HOME } from '@/lib/roles';

interface RequireAuthProps {
  area: Area;
  children: ReactNode;
}

/**
 * Protege uma área: exige sessão válida e que a role do usuário corresponda
 * à área. Sem sessão → /login. Role de outra área → redireciona pra própria.
 */
export function RequireAuth({ area, children }: RequireAuthProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <span
          className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (ROLE_AREA[user.role] !== area) return <Navigate to={ROLE_HOME[user.role]} replace />;

  return <>{children}</>;
}
