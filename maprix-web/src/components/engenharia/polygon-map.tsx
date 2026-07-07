import { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { Home, Maximize2, MapPin, Satellite } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { cn } from '@/lib/utils';

export interface MapPoint {
  id: string;
  lon: number;
  lat: number;
}

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
const STREET_STYLE = 'mapbox://styles/mapbox/dark-v11';
const SATELLITE_STYLE = 'mapbox://styles/mapbox/satellite-streets-v12';

// Vista padrão: Piracicaba/SP. Limites de zoom evitam carregar tiles demais.
const PIRACICABA: [number, number] = [-47.6492, -22.7253];
const HOME_ZOOM = 12;
const MIN_ZOOM = 6;
const MAX_ZOOM = 18;

const CYAN = '#3FB8E0';
const NAVY = '#1A2847';

/** Coordenada geográfica válida — evita LngLat fora de faixa quebrar o Mapbox. */
function isValidLngLat(p: MapPoint): boolean {
  return (
    Number.isFinite(p.lon) &&
    Number.isFinite(p.lat) &&
    p.lat >= -90 &&
    p.lat <= 90 &&
    p.lon >= -180 &&
    p.lon <= 180
  );
}

function polygonGeoJSON(points: MapPoint[]) {
  if (points.length < 3) return { type: 'FeatureCollection' as const, features: [] };
  const ring = points.map((p) => [p.lon, p.lat]);
  ring.push(ring[0]!);
  return {
    type: 'FeatureCollection' as const,
    features: [
      { type: 'Feature' as const, properties: {}, geometry: { type: 'Polygon' as const, coordinates: [ring] } },
    ],
  };
}

function pointsGeoJSON(points: MapPoint[]) {
  return {
    type: 'FeatureCollection' as const,
    features: points.map((p, i) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [p.lon, p.lat] },
      properties: { label: p.id || `P${i + 1}`, isFirst: i === 0 },
    })),
  };
}

function fitBounds(map: mapboxgl.Map, points: MapPoint[], padding = 64) {
  const valid = points.filter(isValidLngLat);
  if (!valid.length) return;
  const lons = valid.map((p) => p.lon);
  const lats = valid.map((p) => p.lat);
  try {
    map.fitBounds(
      [
        [Math.min(...lons), Math.min(...lats)],
        [Math.max(...lons), Math.max(...lats)],
      ],
      { padding, duration: 600, maxZoom: 18 },
    );
  } catch {
    /* bounds inválidos (coordenadas fora de faixa) — ignora sem quebrar o mapa */
  }
}

function ensureLayers(map: mapboxgl.Map, points: MapPoint[]) {
  const polyData = polygonGeoJSON(points);
  const ptsData = pointsGeoJSON(points);

  if (!map.getSource('poly')) {
    map.addSource('poly', { type: 'geojson', data: polyData });
    map.addLayer({ id: 'poly-fill', type: 'fill', source: 'poly', paint: { 'fill-color': CYAN, 'fill-opacity': 0.15 } });
    map.addLayer({ id: 'poly-line', type: 'line', source: 'poly', paint: { 'line-color': CYAN, 'line-width': 2.5 } });
  } else {
    (map.getSource('poly') as mapboxgl.GeoJSONSource).setData(polyData);
  }

  if (!map.getSource('pts')) {
    map.addSource('pts', { type: 'geojson', data: ptsData });
    map.addLayer({
      id: 'pts-circle',
      type: 'circle',
      source: 'pts',
      paint: {
        'circle-radius': ['case', ['get', 'isFirst'], 7, 5],
        'circle-color': ['case', ['get', 'isFirst'], CYAN, NAVY],
        'circle-stroke-color': '#e8ecf4',
        'circle-stroke-width': 2,
      },
    });
    map.addLayer({
      id: 'pts-label',
      type: 'symbol',
      source: 'pts',
      layout: {
        'text-field': ['get', 'label'],
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 11,
        'text-offset': [0, -1.4],
        'text-anchor': 'bottom',
      },
      paint: { 'text-color': '#e8ecf4', 'text-halo-color': '#0b1220', 'text-halo-width': 1.5 },
    });
  } else {
    (map.getSource('pts') as mapboxgl.GeoJSONSource).setData(ptsData);
  }
}

function MapButton({
  active,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-border bg-card/90 px-2.5 py-1.5 text-xs font-medium shadow-sm backdrop-blur',
        'transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active && 'border-accent text-accent',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function PolygonMap({ points, className }: { points: MapPoint[]; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [satellite, setSatellite] = useState(false);
  const [ready, setReady] = useState(false);

  // Só coordenadas geográficas válidas chegam ao Mapbox.
  const safePoints = useMemo(() => points.filter(isValidLngLat), [points]);

  useEffect(() => {
    if (!TOKEN || !containerRef.current) return;
    mapboxgl.accessToken = TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: STREET_STYLE,
      center: PIRACICABA,
      zoom: HOME_ZOOM,
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      attributionControl: false,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');
    map.on('load', () => {
      setReady(true);
      map.resize();
    });
    mapRef.current = map;
    const ro = new ResizeObserver(() => map.resize());
    ro.observe(containerRef.current);
    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    ensureLayers(map, safePoints);
    if (safePoints.length) fitBounds(map, safePoints);
  }, [safePoints, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.setStyle(satellite ? SATELLITE_STYLE : STREET_STYLE);
    map.once('style.load', () => ensureLayers(map, safePoints));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [satellite]);

  if (!TOKEN) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-secondary/40 p-8 text-center',
          className,
        )}
      >
        <div className="rounded-full bg-muted p-3">
          <MapPin className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <p className="text-sm font-medium">Mapa indisponível</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          Defina <code className="rounded bg-muted px-1">VITE_MAPBOX_TOKEN</code> no{' '}
          <code className="rounded bg-muted px-1">.env</code> do web para visualizar o polígono.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden rounded-lg border border-border', className)}>
      <div ref={containerRef} className="absolute inset-0" />
      <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
        <MapButton onClick={() => setSatellite((s) => !s)} active={satellite} aria-pressed={satellite}>
          <Satellite className="h-3.5 w-3.5" strokeWidth={1.75} />
          Satélite
        </MapButton>
        <MapButton
          onClick={() =>
            mapRef.current?.flyTo({ center: PIRACICABA, zoom: HOME_ZOOM, duration: 600 })
          }
          title="Voltar para Piracicaba"
        >
          <Home className="h-3.5 w-3.5" strokeWidth={1.75} />
          Piracicaba
        </MapButton>
        {safePoints.length > 0 && (
          <MapButton onClick={() => mapRef.current && fitBounds(mapRef.current, safePoints)}>
            <Maximize2 className="h-3.5 w-3.5" strokeWidth={1.75} />
            Ajustar
          </MapButton>
        )}
      </div>
    </div>
  );
}
