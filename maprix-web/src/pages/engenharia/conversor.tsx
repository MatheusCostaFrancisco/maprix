import { useState } from 'react';
import { ArrowLeftRight, FileText, Ruler, Target } from 'lucide-react';
import { toast } from 'sonner';
import type { ConferenciaResult, Polygon, Segment } from '@maprix/types';
import { Badge } from '@/components/ui/badge';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  type ConferenciaResponse,
  type ConvertResponse,
  conferirPolygon,
  convertPolygon,
} from '@/api';
import { cn } from '@/lib/utils';

type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; data: T }
  | { status: 'error'; message: string };

export default function ConversorPage() {
  const input = useInputState();
  const forcedUnauthorized = useForcedUnauthorized();

  const [convert, setConvert] = useState<AsyncState<ConvertResponse>>({ status: 'idle' });
  const [conferencia, setConferencia] = useState<AsyncState<ConferenciaResponse>>({
    status: 'idle',
  });
  const [tab, setTab] = useState<'coords' | 'segmentos' | 'conferencia'>('coords');

  async function runConvert(poly: Polygon) {
    setConvert({ status: 'loading' });
    try {
      const data = await convertPolygon(poly, input.targetSystem);
      setConvert({ status: 'ok', data });
      setTab('coords');
    } catch (err) {
      setConvert({ status: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }

  async function runConferencia(poly: Polygon) {
    setConferencia({ status: 'loading' });
    try {
      const data = await conferirPolygon(poly, input.targetSystem, input.tolerancia);
      setConferencia({ status: 'ok', data });
      setTab('conferencia');
      toast[data.conferencia.aprovado ? 'success' : 'error'](
        data.conferencia.aprovado
          ? 'Conferência aprovada'
          : 'Conferência reprovada — revisar pontos fora da tolerância',
      );
    } catch (err) {
      setConferencia({
        status: 'error',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async function onConverter() {
    if (!input.polygon) return;
    await runConvert(input.polygon);
    await runConferencia(input.polygon);
  }

  const canRun = !!input.polygon;

  return (
    <>
      <PageHeader
        title="Conversor"
        description="Converta coordenadas entre sistemas e valide a conferência bilateral ponto a ponto."
        actions={
          <Button onClick={onConverter} disabled={!canRun} size="sm">
            <ArrowLeftRight />
            Converter & conferir
          </Button>
        }
      />

      {forcedUnauthorized ? (
        <UnauthorizedState />
      ) : (
        <div className="space-y-6">
          <PointsInputCard input={input} showTolerance />

          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">Resultado</h2>

            {convert.status === 'idle' && (
              <ResultIdle
                icon={Target}
                title="Sem conversão ainda"
                description='Ajuste pontos e sistemas acima, depois clique em "Converter & conferir".'
              />
            )}

            {convert.status === 'loading' && <ResultSkeleton />}

            {convert.status === 'error' && (
              <ResultError
                message={convert.message}
                onRetry={() => input.polygon && runConvert(input.polygon)}
              />
            )}

            {convert.status === 'ok' && (
              <ConvertResult
                data={convert.data}
                conferencia={conferencia}
                tab={tab}
                onTabChange={setTab}
                onRetryConferencia={() =>
                  input.polygon && runConferencia(input.polygon)
                }
              />
            )}
          </section>
        </div>
      )}
    </>
  );
}

function ConvertResult({
  data,
  conferencia,
  tab,
  onTabChange,
  onRetryConferencia,
}: {
  data: ConvertResponse;
  conferencia: AsyncState<ConferenciaResponse>;
  tab: 'coords' | 'segmentos' | 'conferencia';
  onTabChange: (v: 'coords' | 'segmentos' | 'conferencia') => void;
  onRetryConferencia: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Área" value={`${data.area_m2.toFixed(2)} m²`} icon={Ruler} />
        <StatCard label="Perímetro" value={`${data.perimetro_m.toFixed(2)} m`} icon={Ruler} />
        <StatCard label="Vértices" value={data.polygon.points.length} icon={FileText} />
      </div>

      <Tabs value={tab} onValueChange={(v) => onTabChange(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="coords">Coordenadas</TabsTrigger>
          <TabsTrigger value="segmentos">Segmentos</TabsTrigger>
          <TabsTrigger value="conferencia">Conferência</TabsTrigger>
        </TabsList>

        <TabsContent value="coords">
          <Card>
            <CardContent className="p-0">
              <CoordsTable polygon={data.polygon} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segmentos">
          <Card>
            <CardContent className="p-0">
              <SegmentsTable segments={data.segments} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conferencia">
          {conferencia.status === 'loading' && <ResultSkeleton />}
          {conferencia.status === 'error' && (
            <ResultError message={conferencia.message} onRetry={onRetryConferencia} />
          )}
          {conferencia.status === 'idle' && (
            <ResultIdle
              icon={Target}
              title="Conferência não executada"
              description="Clique em Converter & conferir para rodar a validação bilateral."
            />
          )}
          {conferencia.status === 'ok' && <ConferenciaCard data={conferencia.data.conferencia} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CoordsTable({ polygon }: { polygon: ConvertResponse['polygon'] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>X / Longitude</TableHead>
          <TableHead>Y / Latitude</TableHead>
          <TableHead>Z</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {polygon.points.map((p) => (
          <TableRow key={p.id}>
            <TableCell className="font-medium">{p.id}</TableCell>
            <TableCell className="font-mono text-xs">{p.x.toFixed(6)}</TableCell>
            <TableCell className="font-mono text-xs">{p.y.toFixed(6)}</TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {p.z?.toFixed(3) ?? '—'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function SegmentsTable({ segments }: { segments: Segment[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>De → Para</TableHead>
          <TableHead>Azimute (DMS)</TableHead>
          <TableHead className="text-right">Azimute (°)</TableHead>
          <TableHead className="text-right">Distância (m)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {segments.map((s, i) => (
          <TableRow key={`${s.from.id}-${s.to.id}-${i}`}>
            <TableCell className="font-medium">
              {s.from.id} → {s.to.id}
            </TableCell>
            <TableCell className="font-mono text-xs">{s.azimute_dms}</TableCell>
            <TableCell className="font-mono text-xs text-right">
              {s.azimute_decimal.toFixed(4)}
            </TableCell>
            <TableCell className="font-mono text-xs text-right">{s.distancia_m.toFixed(3)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ConferenciaCard({ data }: { data: ConferenciaResult }) {
  const approved = data.aprovado;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Conferência bilateral</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Divergência máxima: {data.divergenciaMaxima_m.toFixed(4)} m (tolerância{' '}
              {data.toleranciaConfig_m.toFixed(2)} m)
            </p>
          </div>
          <Badge variant={approved ? 'default' : 'destructive'} className="shrink-0">
            {approved ? 'Aprovada' : 'Reprovada'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ponto</TableHead>
              <TableHead className="text-right">Δ (m)</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.divergenciasPorPonto.map((d) => {
              const ok = d.delta_m <= data.toleranciaConfig_m;
              return (
                <TableRow key={d.pontoId}>
                  <TableCell className="font-medium">{d.pontoId}</TableCell>
                  <TableCell
                    className={cn(
                      'font-mono text-xs text-right',
                      ok ? 'text-muted-foreground' : 'text-destructive',
                    )}
                  >
                    {d.delta_m.toFixed(6)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={ok ? 'secondary' : 'destructive'}>
                      {ok ? 'dentro' : 'fora'}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
