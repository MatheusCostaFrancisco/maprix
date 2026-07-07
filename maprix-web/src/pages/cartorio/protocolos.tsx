import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Inbox, Loader2, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import type {
  Matricula,
  Protocolo,
  ProtocoloStatus,
  ProtocoloTipo,
} from '@maprix/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { PROTOCOLO_STATUS, PROTOCOLO_TIPO } from '@/components/cartorio/status';
import { cartorioApi, type ProtocoloInput } from '@/lib/cartorio-api';
import { fadeUp } from '@/lib/animations';

type Async<T> =
  | { status: 'loading' }
  | { status: 'ok'; data: T }
  | { status: 'error'; message: string };

const STATUS_ORDER: ProtocoloStatus[] = [
  'recebido',
  'em_analise',
  'exigencia',
  'aprovado',
  'rejeitado',
];
const TIPO_ORDER: ProtocoloTipo[] = [
  'georreferenciamento',
  'retificacao',
  'desmembramento',
  'unificacao',
];

function msg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

export default function ProtocolosPage() {
  const [list, setList] = useState<Async<Protocolo[]>>({ status: 'loading' });
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProtocoloStatus | 'all'>('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    setList({ status: 'loading' });
    try {
      const { protocolos } = await cartorioApi.listProtocolos({
        q: q || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setList({ status: 'ok', data: protocolos });
    } catch (err) {
      setList({ status: 'error', message: msg(err) });
    }
  }, [q, statusFilter]);

  useEffect(() => {
    const t = setTimeout(() => void loadList(), 250);
    return () => clearTimeout(t);
  }, [loadList]);

  async function changeStatus(p: Protocolo, status: ProtocoloStatus) {
    if (status === p.status) return;
    setSavingId(p.id);
    // Atualização otimista.
    setList((prev) =>
      prev.status === 'ok'
        ? { status: 'ok', data: prev.data.map((x) => (x.id === p.id ? { ...x, status } : x)) }
        : prev,
    );
    try {
      await cartorioApi.updateProtocolo(p.id, { status });
      toast.success(`Protocolo ${p.numero} → ${PROTOCOLO_STATUS[status].label}`);
    } catch (err) {
      toast.error('Não foi possível atualizar', { description: msg(err) });
      void loadList();
    } finally {
      setSavingId(null);
    }
  }

  return (
    <>
      <PageHeader
        variant="cartorio"
        title="Protocolos"
        description="Acompanhe e tramite os protocolos recebidos no cartório."
        actions={
          <Button onClick={() => setSheetOpen(true)}>
            <Plus />
            Novo protocolo
          </Button>
        }
      />

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por número ou requerente…"
              className="pl-9"
              aria-label="Buscar protocolos"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as ProtocoloStatus | 'all')}
          >
            <SelectTrigger className="sm:w-52" aria-label="Filtrar por status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {STATUS_ORDER.map((s) => (
                <SelectItem key={s} value={s}>
                  {PROTOCOLO_STATUS[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ProtocolosTable
          state={list}
          savingId={savingId}
          onRetry={() => void loadList()}
          onNew={() => setSheetOpen(true)}
          onChangeStatus={changeStatus}
          hasFilters={q !== '' || statusFilter !== 'all'}
        />
      </div>

      <NovoProtocoloSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onCreated={() => void loadList()}
      />
    </>
  );
}

function ProtocolosTable({
  state,
  savingId,
  onRetry,
  onNew,
  onChangeStatus,
  hasFilters,
}: {
  state: Async<Protocolo[]>;
  savingId: string | null;
  onRetry: () => void;
  onNew: () => void;
  onChangeStatus: (p: Protocolo, s: ProtocoloStatus) => void;
  hasFilters: boolean;
}) {
  if (state.status === 'loading') {
    return (
      <Card className="space-y-3 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </Card>
    );
  }

  if (state.status === 'error') {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>Falha ao carregar protocolos</AlertTitle>
        <AlertDescription className="flex items-center justify-between gap-4">
          <span>{state.message}</span>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Tentar novamente
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (state.data.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Inbox}
          title={hasFilters ? 'Nenhum protocolo encontrado' : 'Nenhum protocolo ainda'}
          description={
            hasFilters
              ? 'Ajuste a busca ou o filtro de status para ver outros resultados.'
              : 'Autue o primeiro protocolo recebido para iniciar a tramitação.'
          }
          action={hasFilters ? undefined : { label: 'Novo protocolo', onClick: onNew }}
        />
      </Card>
    );
  }

  return (
    <motion.div {...fadeUp}>
      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Protocolo</TableHead>
              <TableHead>Requerente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Entrada</TableHead>
              <TableHead className="w-44">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.data.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.numero}</TableCell>
                <TableCell>{p.requerente}</TableCell>
                <TableCell className="text-muted-foreground">{PROTOCOLO_TIPO[p.tipo]}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(p.createdAt)}</TableCell>
                <TableCell>
                  <Select
                    value={p.status}
                    onValueChange={(v) => onChangeStatus(p, v as ProtocoloStatus)}
                    disabled={savingId === p.id}
                  >
                    <SelectTrigger className="h-8 w-40" aria-label={`Status do protocolo ${p.numero}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_ORDER.map((s) => (
                        <SelectItem key={s} value={s}>
                          {PROTOCOLO_STATUS[s].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </motion.div>
  );
}

function NovoProtocoloSheet({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const empty: ProtocoloInput = { numero: '', requerente: '', tipo: 'georreferenciamento' };
  const [form, setForm] = useState<ProtocoloInput>(empty);
  const [submitting, setSubmitting] = useState(false);
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setForm(empty);
    setTimeout(() => firstFieldRef.current?.focus(), 60);
    cartorioApi
      .listMatriculas()
      .then((r) => setMatriculas(r.matriculas))
      .catch(() => setMatriculas([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = <K extends keyof ProtocoloInput>(k: K, v: ProtocoloInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.numero.trim() || !form.requerente.trim()) return;
    setSubmitting(true);
    try {
      await cartorioApi.createProtocolo({
        numero: form.numero.trim(),
        requerente: form.requerente.trim(),
        tipo: form.tipo,
        matriculaId: form.matriculaId || undefined,
        observacao: form.observacao?.trim() || undefined,
      });
      toast.success('Protocolo autuado');
      onOpenChange(false);
      onCreated();
    } catch (err) {
      toast.error('Não foi possível autuar', { description: msg(err) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Novo protocolo</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Field label="Número do protocolo" required>
            <Input
              ref={firstFieldRef}
              value={form.numero}
              onChange={(e) => set('numero', e.target.value)}
              placeholder="Ex.: PROT-2026-0004"
              required
            />
          </Field>
          <Field label="Requerente" required>
            <Input
              value={form.requerente}
              onChange={(e) => set('requerente', e.target.value)}
              placeholder="Nome do requerente / responsável técnico"
              required
            />
          </Field>
          <Field label="Tipo">
            <Select value={form.tipo} onValueChange={(v) => set('tipo', v as ProtocoloTipo)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPO_ORDER.map((t) => (
                  <SelectItem key={t} value={t}>
                    {PROTOCOLO_TIPO[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Matrícula vinculada">
            <Select
              value={form.matriculaId ?? 'none'}
              onValueChange={(v) => set('matriculaId', v === 'none' ? undefined : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Nenhuma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                {matriculas.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.numero} — {m.proprietario}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Observação">
            <Textarea
              value={form.observacao ?? ''}
              onChange={(e) => set('observacao', e.target.value)}
              rows={3}
              placeholder="Notas de tramitação (opcional)"
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="animate-spin" />}
              Autuar
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}
