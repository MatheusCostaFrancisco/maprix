import { Construction } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';

/**
 * Placeholder do commit 1 do M3. Implementação real entra no commit 2.
 */
export default function MemorialEShapefilePage() {
  return (
    <>
      <PageHeader
        title="Memorial & Shapefile"
        description="Gere o memorial descritivo e o pacote SIG-RI do imóvel."
      />
      <Card>
        <EmptyState
          icon={Construction}
          title="Em construção"
          description="Esta tela será habilitada no próximo commit da Milestone 3."
        />
      </Card>
    </>
  );
}
