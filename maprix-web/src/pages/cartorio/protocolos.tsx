import { Inbox } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';

export default function ProtocolosPage() {
  return (
    <div>
      <PageHeader
        variant="cartorio"
        title="Protocolos"
        description="Acompanhamento dos protocolos recebidos e em tramitação no cartório."
      />

      <EmptyState
        icon={Inbox}
        title="Nenhum protocolo em tramitação"
        description="Os protocolos recebidos para análise, registro ou averbação serão listados aqui conforme forem autuados."
      />
    </div>
  );
}
