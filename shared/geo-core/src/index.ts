import proj4 from 'proj4';
import distance from '@turf/distance';
import bearing from '@turf/bearing';
import area from '@turf/area';
import { point, polygon as turfPolygon } from '@turf/helpers';
import type {
  Polygon,
  Segment,
  ConferenciaResult,
  CoordinateSystem,
  GeoPoint,
} from '@maprix/types';
import { projString, decimalToDMS, normalizeAzimute } from './proj.js';

export { projString, decimalToDMS, normalizeAzimute };
export { gerarMemorial, gerarMemorialDxf } from './memorial.js';
export type { MemorialData, MemorialRow } from './memorial.js';
export { gerarShapefileZip } from './shapefile.js';

function sameSystem(a: CoordinateSystem, b: CoordinateSystem): boolean {
  if (a.type !== b.type) return false;
  if (a.type === 'UTM' && b.type === 'UTM') {
    return a.zone === b.zone && a.hemisphere === b.hemisphere && a.datum === b.datum;
  }
  if (a.type === 'LatLong' && b.type === 'LatLong') {
    return a.datum === b.datum;
  }
  return false;
}

export function convertPolygon(poly: Polygon, to: CoordinateSystem): Polygon {
  if (sameSystem(poly.system, to)) return poly;
  const from = projString(poly.system);
  const target = projString(to);
  const points: GeoPoint[] = poly.points.map((p) => {
    const [x, y] = proj4(from, target, [p.x, p.y]);
    return { id: p.id, x, y, ...(p.z !== undefined ? { z: p.z } : {}) };
  });
  return { points, system: to, metadata: poly.metadata };
}

function toLatLong(poly: Polygon): Polygon {
  if (poly.system.type === 'LatLong') return poly;
  return convertPolygon(poly, { type: 'LatLong', datum: poly.system.datum });
}

function bearingPlanar(from: GeoPoint, to: GeoPoint): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return normalizeAzimute(Math.atan2(dx, dy) * (180 / Math.PI));
}

function distancePlanar(from: GeoPoint, to: GeoPoint): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function computeSegments(poly: Polygon): Segment[] {
  const pts = poly.points;
  if (pts.length < 2) return [];
  const ring = [...pts, pts[0]];
  const segments: Segment[] = [];
  for (let i = 0; i < ring.length - 1; i++) {
    const from = ring[i]!;
    const to = ring[i + 1]!;
    let az: number;
    let dist: number;
    if (poly.system.type === 'UTM') {
      az = bearingPlanar(from, to);
      dist = distancePlanar(from, to);
    } else {
      const a = point([from.x, from.y]);
      const b = point([to.x, to.y]);
      az = normalizeAzimute(bearing(a, b));
      dist = distance(a, b, { units: 'meters' });
    }
    segments.push({
      from,
      to,
      azimute_decimal: az,
      azimute_dms: decimalToDMS(az),
      distancia_m: dist,
    });
  }
  return segments;
}

export function computePerimeter(poly: Polygon): number {
  return computeSegments(poly).reduce((s, seg) => s + seg.distancia_m, 0);
}

export function computeArea(poly: Polygon): number {
  if (poly.points.length < 3) return 0;
  const ll = toLatLong(poly);
  const ring = [...ll.points.map((p) => [p.x, p.y]), [ll.points[0]!.x, ll.points[0]!.y]];
  const turfPoly = turfPolygon([ring]);
  return area(turfPoly);
}

export function conferenciaBilateral(
  original: Polygon,
  convertido: Polygon,
  tolerancia_m: number,
): ConferenciaResult {
  if (original.points.length !== convertido.points.length) {
    throw new Error('polígonos com número diferente de pontos — comparação inválida');
  }
  const a = toLatLong(original);
  const b = toLatLong(convertido);
  const divergencias = a.points.map((pa, i) => {
    const pb = b.points[i]!;
    const delta = distance(point([pa.x, pa.y]), point([pb.x, pb.y]), { units: 'meters' });
    return { pontoId: pa.id, delta_m: delta };
  });
  const max = divergencias.reduce((m, d) => Math.max(m, d.delta_m), 0);
  return {
    sistemaOrigem: original.system,
    sistemaDestino: convertido.system,
    divergenciaMaxima_m: max,
    toleranciaConfig_m: tolerancia_m,
    aprovado: max <= tolerancia_m,
    divergenciasPorPonto: divergencias,
  };
}
