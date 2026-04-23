import { FileQuestion } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/shared/empty-state';

export function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <EmptyState
        icon={FileQuestion}
        title="Página não encontrada"
        description="O endereço acessado não existe. Volte para o Conversor para continuar."
        action={{ label: 'Ir para o Conversor', onClick: () => navigate('/engenharia/conversor') }}
      />
    </div>
  );
}
