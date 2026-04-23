import { useState } from 'react';
import { Archive, Download, FileText, Loader2, Ruler, Wand2 } from 'lucide-react';
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
        <div className="space-y-6">
          <PointsInputCard input={input} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Exportar</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={onBaixarDxf} disabled={!canRun || dxfLoading}>
                {dxfLoading ? <Loader2 className="animate-spin" /> : <Download />}
                Baixar DXF
              </Button>
              <Button
                variant="outline"
                onClick={onBaixarShapefile}
                disabled={!canRun || shapefileLoading}
              >
                {shapefileLoading ? <Loader2 className="animate-spin" /> : <Archive />}
                Baixar shapefile SIG-RI
              </Button>
            </CardContent>
          </Card>

          <section className="space-y-3">
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
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Vértices" value={data.resumo.num_vertices} icon={FileText} />
        <StatCard label="Área" value={`${data.resumo.area_m2.toFixed(2)} m²`} icon={Ruler} />
        <StatCard label="Perímetro" value={`${data.resumo.perimetro_m.toFixed(2)} m`} icon={Ruler} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Forma cursiva</CardTitle>
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
    </div>
  );
}
