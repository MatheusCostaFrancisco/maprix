import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeftRight, FileText, Ruler, Target } from 'lucide-react';
import { toast } from 'sonner';
import { convertPolygon as convertPolygonGeo } from '@maprix/geo-core';
import type { ConferenciaResult, GeoPoint, Polygon, Segment } from '@maprix/types';
import { PolygonMap, type MapPoint } from '@/components/engenharia/polygon-map';
import { ErrorBoundary } from '@/components/shared/error-boundary';
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

  const mapPoints: MapPoint[] = useMemo(() => {
    if (!input.polygon) return [];
    try {
      const wgs = convertPolygonGeo(input.polygon, { type: 'LatLong', datum: 'WGS84' });
      return wgs.points
        .map((p) => ({ id: p.id, lon: p.x, lat: p.y }))
        .filter(
          (p) =>
            Number.isFinite(p.lon) &&
            Number.isFinite(p.lat) &&
            p.lat >= -90 &&
            p.lat <= 90 &&
            p.lon >= -180 &&
            p.lon <= 180,
        );
    } catch {
      return [];
    }
  }, [input.polygon]);

  const dualView = useMemo(() => {
    if (!input.polygon) return null;
    try {
      const ll = convertPolygonGeo(input.polygon, { type: 'LatLong', datum: 'SIRGAS2000' });
      const lon0 = ll.points[0]?.x ?? 0;
      const lat0 = ll.points[0]?.y ?? 0;
      const zone = Math.floor((lon0 + 180) / 6) + 1;
      const hemisphere: 'N' | 'S' = lat0 < 0 ? 'S' : 'N';
      const utm = convertPolygonGeo(input.polygon, {
        type: 'UTM',
        zone,
        hemisphere,
        datum: 'SIRGAS2000',
      });
      return { ll: ll.points, utm: utm.points, zone, hemisphere };
    } catch {
      return null;
    }
  }, [input.polygon]);

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
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
          <div className="lg:sticky lg:top-20">
            <PointsInputCard input={input} showTolerance />
          </div>

          <section className="min-w-0 space-y-3">
            <ErrorBoundary
              fallback={
                <div className="flex h-72 w-full items-center justify-center rounded-lg border border-dashed border-border bg-secondary/40 text-sm text-muted-foreground">
                  Não foi possível carregar o mapa.
                </div>
              }
            >
              <PolygonMap points={mapPoints} className="h-72 w-full" />
            </ErrorBoundary>

            {dualView && <DualCoordsCard data={dualView} />}

            <h2 className="text-xl font-semibold tracking-tight">Resultado</h2>

            {convert.status === 'idle' && (
              <ResultIdle
                icon={Target}
                title="Sem conversão ainda"
                description='Ajuste pontos e sistemas ao lado, depois clique em "Converter & conferir".'
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
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="space-y-4"
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
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
    </motion.div>
  );
}

function DualCoordsCard({
  data,
}: {
  data: { ll: GeoPoint[]; utm: GeoPoint[]; zone: number; hemisphere: 'N' | 'S' };
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-base">Lat/Long × UTM</CardTitle>
          <Badge variant="secondary" className="shrink-0">
            Zona {data.zone}
            {data.hemisphere} · SIRGAS2000
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Lat / Long
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vértice</TableHead>
                  <TableHead className="text-right">Latitude</TableHead>
                  <TableHead className="text-right">Longitude</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.ll.map((p, i) => (
                  <TableRow key={`${p.id}-${i}`}>
                    <TableCell className="font-medium">{p.id}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{p.y.toFixed(8)}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{p.x.toFixed(8)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              UTM (m)
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vértice</TableHead>
                  <TableHead className="text-right">E</TableHead>
                  <TableHead className="text-right">N</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.utm.map((p, i) => (
                  <TableRow key={`${p.id}-${i}`}>
                    <TableCell className="font-medium">{p.id}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{p.x.toFixed(3)}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{p.y.toFixed(3)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
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
