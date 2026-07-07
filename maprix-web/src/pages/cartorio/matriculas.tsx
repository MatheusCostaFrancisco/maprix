import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  BookText,
  CheckCircle2,
  FileWarning,
  Inbox,
  Loader2,
  Plus,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import type { CartorioOverview, Matricula, MatriculaStatus } from '@maprix/types';
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
import { StatCard } from '@/components/shared/stat-card';
import { MatriculaStatusBadge } from '@/components/cartorio/status';
import { cartorioApi, type MatriculaInput } from '@/lib/cartorio-api';
import { fadeUp } from '@/lib/animations';

type Async<T> =
  | { status: 'loading' }
  | { status: 'ok'; data: T }
  | { status: 'error'; message: string };

function formatArea(m2: number | null): string {
  if (m2 == null) return '—';
  if (m2 >= 10_000)
    return `${(m2 / 10_000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ha`;
  return `${m2.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} m²`;
}

function msg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export default function MatriculasPage() {
  const [overview, setOverview] = useState<Async<CartorioOverview>>({ status: 'loading' });
  const [list, setList] = useState<Async<Matricula[]>>({ status: 'loading' });
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<MatriculaStatus | 'all'>('all');
  const [sheetOpen, setSheetOpen] = useState(false);

  const loadOverview = useCallback(async () => {
    try {
      setOverview({ status: 'ok', data: await cartorioApi.overview() });
    } catch (err) {
      setOverview({ status: 'error', message: msg(err) });
    }
  }, []);

  const loadList = useCallback(async () => {
    setList({ status: 'loading' });
    try {
      const { matriculas } = await cartorioApi.listMatriculas({
        q: q || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setList({ status: 'ok', data: matriculas });
    } catch (err) {
      setList({ status: 'error', message: msg(err) });
    }
  }, [q, statusFilter]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  // Debounce da busca + refetch ao mudar filtro.
  useEffect(() => {
    const t = setTimeout(() => void loadList(), 250);
    return () => clearTimeout(t);
  }, [loadList]);

  return (
    <>
      <PageHeader
        variant="cartorio"
        title="Matrículas"
        description="Registro e acompanhamento das matrículas imobiliárias do cartório."
        actions={
          <Button onClick={() => setSheetOpen(true)}>
            <Plus />
            Nova matrícula
          </Button>
        }
      />

      <div className="space-y-8">
        <OverviewCards state={overview} />

        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por número ou proprietário…"
                className="pl-9"
                aria-label="Buscar matrículas"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as MatriculaStatus | 'all')}
            >
              <SelectTrigger className="sm:w-52" aria-label="Filtrar por status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="ativa">Ativa</SelectItem>
                <SelectItem value="em_analise">Em análise</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <MatriculasTable
            state={list}
            onRetry={() => void loadList()}
            onNew={() => setSheetOpen(true)}
            hasFilters={q !== '' || statusFilter !== 'all'}
          />
        </div>
      </div>

      <NovaMatriculaSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onCreated={() => {
          void loadList();
          void loadOverview();
        }}
      />
    </>
  );
}

function OverviewCards({ state }: { state: Async<CartorioOverview> }) {
  if (state.status === 'loading') {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }
  if (state.status === 'error') return null;
  const o = state.data;
  return (
    <motion.div {...fadeUp} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard label="Matrículas" value={o.matriculas} icon={BookText} />
      <StatCard label="Protocolos abertos" value={o.protocolosAbertos} icon={Inbox} />
      <StatCard label="Em exigência" value={o.protocolosExigencia} icon={FileWarning} />
      <StatCard label="Aprovados" value={o.protocolosAprovados} icon={CheckCircle2} />
    </motion.div>
  );
}

function MatriculasTable({
  state,
  onRetry,
  onNew,
  hasFilters,
}: {
  state: Async<Matricula[]>;
  onRetry: () => void;
  onNew: () => void;
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
        <AlertTitle>Falha ao carregar matrículas</AlertTitle>
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
          icon={BookText}
          title={hasFilters ? 'Nenhuma matrícula encontrada' : 'Nenhuma matrícula ainda'}
          description={
            hasFilters
              ? 'Ajuste a busca ou o filtro de status para ver outros resultados.'
              : 'Cadastre a primeira matrícula para começar o acompanhamento.'
          }
          action={hasFilters ? undefined : { label: 'Nova matrícula', onClick: onNew }}
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
              <TableHead>Matrícula</TableHead>
              <TableHead>Proprietário</TableHead>
              <TableHead>Município</TableHead>
              <TableHead className="text-right">Área</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.data.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">
                  {m.numero}
                  {m.cartorio && (
                    <span className="block text-xs font-normal text-muted-foreground">
                      {m.cartorio}
                    </span>
                  )}
                </TableCell>
                <TableCell>{m.proprietario}</TableCell>
                <TableCell className="text-muted-foreground">
                  {m.municipio ? `${m.municipio}${m.uf ? ` · ${m.uf}` : ''}` : '—'}
                </TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {formatArea(m.areaM2)}
                </TableCell>
                <TableCell>
                  <MatriculaStatusBadge status={m.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </motion.div>
  );
}

function NovaMatriculaSheet({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<MatriculaInput>({ numero: '', proprietario: '' });
  const [submitting, setSubmitting] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setForm({ numero: '', proprietario: '' });
      setTimeout(() => firstFieldRef.current?.focus(), 60);
    }
  }, [open]);

  const set = <K extends keyof MatriculaInput>(k: K, v: MatriculaInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.numero.trim() || !form.proprietario.trim()) return;
    setSubmitting(true);
    try {
      await cartorioApi.createMatricula({
        numero: form.numero.trim(),
        proprietario: form.proprietario.trim(),
        cartorio: form.cartorio?.trim() || undefined,
        municipio: form.municipio?.trim() || undefined,
        uf: form.uf?.trim() ? form.uf.trim().toUpperCase() : undefined,
        areaM2: form.areaM2 ?? undefined,
      });
      toast.success('Matrícula cadastrada');
      onOpenChange(false);
      onCreated();
    } catch (err) {
      toast.error('Não foi possível cadastrar', { description: msg(err) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Nova matrícula</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Field label="Número da matrícula" required>
            <Input
              ref={firstFieldRef}
              value={form.numero}
              onChange={(e) => set('numero', e.target.value)}
              placeholder="Ex.: 12.345"
              required
            />
          </Field>
          <Field label="Proprietário" required>
            <Input
              value={form.proprietario}
              onChange={(e) => set('proprietario', e.target.value)}
              placeholder="Nome do proprietário"
              required
            />
          </Field>
          <Field label="Ofício / Cartório">
            <Input
              value={form.cartorio ?? ''}
              onChange={(e) => set('cartorio', e.target.value)}
              placeholder="Ex.: 1º Ofício de Registro de Imóveis"
            />
          </Field>
          <div className="grid grid-cols-[1fr_5rem] gap-3">
            <Field label="Município">
              <Input
                value={form.municipio ?? ''}
                onChange={(e) => set('municipio', e.target.value)}
                placeholder="Município"
              />
            </Field>
            <Field label="UF">
              <Input
                value={form.uf ?? ''}
                onChange={(e) => set('uf', e.target.value.toUpperCase().slice(0, 2))}
                placeholder="UF"
                maxLength={2}
              />
            </Field>
          </div>
          <Field label="Área (m²)">
            <Input
              type="number"
              min={0}
              step="0.01"
              value={form.areaM2 ?? ''}
              onChange={(e) =>
                set('areaM2', e.target.value === '' ? undefined : Number(e.target.value))
              }
              placeholder="Opcional"
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="animate-spin" />}
              Cadastrar
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
