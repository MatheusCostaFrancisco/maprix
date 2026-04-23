import { FileText, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';

export default function MatriculasPage() {
  const handleNova = () => {
    toast.info('Cadastro de matrícula', {
      description: 'A criação de matrículas será habilitada em uma próxima versão.',
    });
  };

  return (
    <div>
      <PageHeader
        variant="cartorio"
        title="Matrículas"
        description="Gestão de matrículas imobiliárias do cartório."
        actions={
          <Button onClick={handleNova}>
            <Plus className="mr-2 h-4 w-4" strokeWidth={2} />
            Nova matrícula
          </Button>
        }
      />

      <EmptyState
        icon={FileText}
        title="Nenhuma matrícula registrada"
        description="Quando matrículas forem cadastradas, elas aparecerão aqui para consulta, averbação e registro de atos."
      />
    </div>
  );
}
