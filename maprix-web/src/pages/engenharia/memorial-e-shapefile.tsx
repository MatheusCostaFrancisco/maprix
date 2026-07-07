import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Check,
  ChevronRight,
  Copy,
  FileText,
  Layers,
  Loader2,
  Ruler,
  Wand2,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Polygon } from '@maprix/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { PointsInputCard } from '@/components/engenharia/points-input-card';
import {
  ResultError,
  ResultIdle,
  ResultSkeleton,
  UnauthorizedState,
  useForcedUnauthorized,
} from '@/components/engenharia/result-states';
import { useInputState } from '@/hooks/use-input-state';
import {
  type MemorialResponse,
  downloadMemorialDxf,
  downloadShapefile,
  gerarMemorial,
} from '@/api';
import { triggerBlobDownload } from '@/lib/download';
import { cn } from '@/lib/utils';

type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; data: T }
  | { status: 'error'; message: string };

export default function MemorialEShapefilePage() {
  const input = useInputState();
  const forcedUnauthorized = useForcedUnauthorized();

  const [memorial, setMemorial] = useState<AsyncState<MemorialResponse>>({ status: 'idle' });
  const [dxfLoading, setDxfLoading] = useState(false);
  const [shapefileLoading, setShapefileLoading] = useState(false);

  async function runMemorial(poly: Polygon) {
    setMemorial({ status: 'loading' });
    try {
      const data = await gerarMemorial(poly);
      setMemorial({ status: 'ok', data });
    } catch (err) {
      setMemorial({
        status: 'error',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async function onBaixarDxf() {
    if (!input.polygon) return;
    setDxfLoading(true);
    try {
      const blob = await downloadMemorialDxf(input.polygon);
      triggerBlobDownload(blob, 'memorial-maprix.dxf');
      toast.success('DXF baixado');
    } catch (err) {
      toast.error('Falha ao gerar DXF', {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setDxfLoading(false);
    }
  }

  async function onBaixarShapefile() {
    if (!input.polygon) return;
    setShapefileLoading(true);
    try {
      const blob = await downloadShapefile(input.polygon);
      triggerBlobDownload(blob, `maprix-sigri-${Date.now()}.zip`);
      toast.success('Shapefile SIG-RI baixado');
    } catch (err) {
      toast.error('Falha ao gerar shapefile', {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setShapefileLoading(false);
    }
  }

  const canRun = !!input.polygon;

  return (
    <>
      <PageHeader
        title="Memorial & Shapefile"
        description="Gere o memorial descritivo e o pacote SIG-RI do imóvel a partir dos mesmos pontos do Conversor."
        actions={
          <Button
            onClick={() => input.polygon && runMemorial(input.polygon)}
            disabled={!canRun || memorial.status === 'loading'}
            size="sm"
          >
            {memorial.status === 'loading' ? <Loader2 className="animate-spin" /> : <Wand2 />}
            Gerar memorial
          </Button>
        }
      />

      {forcedUnauthorized ? (
        <UnauthorizedState />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
          <div className="space-y-6 lg:sticky lg:top-20">
            <PointsInputCard input={input} />

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Exportar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <ExportButton
                  icon={FileText}
                  title="Memorial DXF"
                  description="Desenho vetorial para CAD / DWG"
                  loading={dxfLoading}
                  disabled={!canRun}
                  onClick={onBaixarDxf}
                />
                <ExportButton
                  icon={Layers}
                  title="Shapefile SIG-RI"
                  description=".shp · .shx · .dbf · .prj — CNJ 195/2025"
                  loading={shapefileLoading}
                  disabled={!canRun}
                  onClick={onBaixarShapefile}
                />
                {!canRun && (
                  <p className="pt-1 text-xs text-muted-foreground">
                    Informe ao menos 3 pontos válidos para habilitar a exportação.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <section className="min-w-0 space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">Memorial descritivo</h2>

            {memorial.status === 'idle' && (
              <ResultIdle
                icon={FileText}
                title="Sem memorial ainda"
                description='Ajuste pontos acima e clique em "Gerar memorial".'
              />
            )}

            {memorial.status === 'loading' && <ResultSkeleton />}

            {memorial.status === 'error' && (
              <ResultError
                message={memorial.message}
                onRetry={() => input.polygon && runMemorial(input.polygon)}
              />
            )}

            {memorial.status === 'ok' && <MemorialResult data={memorial.data} />}
          </section>
        </div>
      )}
    </>
  );
}

function MemorialResult({ data }: { data: MemorialResponse }) {
  const reduce = useReducedMotion();
  const [copied, setCopied] = useState(false);

  async function copyCursivo() {
    try {
      await navigator.clipboard.writeText(data.cursivo);
      setCopied(true);
      toast.success('Memorial cursivo copiado');
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('Não foi possível copiar');
    }
  }

  return (
    <motion.div
      className="space-y-4"
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Vértices" value={data.resumo.num_vertices} icon={FileText} />
        <StatCard label="Área" value={`${data.resumo.area_m2.toFixed(2)} m²`} icon={Ruler} />
        <StatCard label="Perímetro" value={`${data.resumo.perimetro_m.toFixed(2)} m`} icon={Ruler} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-base">Forma cursiva</CardTitle>
          <Button type="button" variant="ghost" size="sm" onClick={copyCursivo}>
            {copied ? <Check /> : <Copy />}
            {copied ? 'Copiado' : 'Copiar'}
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
            {data.cursivo}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Forma tabelada</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>De</TableHead>
                <TableHead>Para</TableHead>
                <TableHead>Azimute (DMS)</TableHead>
                <TableHead className="text-right">Distância (m)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.tabelado.map((r, i) => (
                <TableRow key={`${r.de}-${r.para}-${i}`}>
                  <TableCell className="font-medium">{r.de}</TableCell>
                  <TableCell className="font-medium">{r.para}</TableCell>
                  <TableCell className="font-mono text-xs">{r.azimute_dms}</TableCell>
                  <TableCell className="font-mono text-xs text-right">
                    {r.distancia_m.toFixed(3)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ExportButton({
  icon: Icon,
  title,
  description,
  loading,
  disabled,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'group flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left',
        'transition-colors hover:border-primary/50 hover:bg-secondary',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:hover:bg-card',
      )}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-secondary text-foreground">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" strokeWidth={1.75} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{description}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}
