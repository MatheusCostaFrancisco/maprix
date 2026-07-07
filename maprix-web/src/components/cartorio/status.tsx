import type {
  MatriculaStatus,
  ProtocoloStatus,
  ProtocoloTipo,
} from '@maprix/types';
import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'info' | 'warning' | 'success' | 'danger';

const TONE_CLASS: Record<Tone, string> = {
  neutral: 'bg-secondary text-secondary-foreground',
  info: 'bg-accent/15 text-accent',
  warning: 'bg-warning/15 text-warning',
  success: 'bg-success/15 text-success',
  danger: 'bg-destructive/15 text-destructive',
};

function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        TONE_CLASS[tone],
      )}
    >
      {children}
    </span>
  );
}

export const MATRICULA_STATUS: Record<MatriculaStatus, { label: string; tone: Tone }> = {
  ativa: { label: 'Ativa', tone: 'success' },
  em_analise: { label: 'Em análise', tone: 'warning' },
  cancelada: { label: 'Cancelada', tone: 'danger' },
};

export const PROTOCOLO_STATUS: Record<ProtocoloStatus, { label: string; tone: Tone }> = {
  recebido: { label: 'Recebido', tone: 'neutral' },
  em_analise: { label: 'Em análise', tone: 'info' },
  exigencia: { label: 'Exigência', tone: 'warning' },
  aprovado: { label: 'Aprovado', tone: 'success' },
  rejeitado: { label: 'Rejeitado', tone: 'danger' },
};

export const PROTOCOLO_TIPO: Record<ProtocoloTipo, string> = {
  georreferenciamento: 'Georreferenciamento',
  retificacao: 'Retificação',
  desmembramento: 'Desmembramento',
  unificacao: 'Unificação',
};

export function MatriculaStatusBadge({ status }: { status: MatriculaStatus }) {
  const s = MATRICULA_STATUS[status];
  return <Pill tone={s.tone}>{s.label}</Pill>;
}

export function ProtocoloStatusBadge({ status }: { status: ProtocoloStatus }) {
  const s = PROTOCOLO_STATUS[status];
  return <Pill tone={s.tone}>{s.label}</Pill>;
}
