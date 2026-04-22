import type { CoordinateSystem, GeoPoint, Polygon } from '@maprix/types';

export interface ParseResult {
  points: GeoPoint[];
  errors: string[];
}

export function parsePoints(text: string): ParseResult {
  const errors: string[] = [];
  const points: GeoPoint[] = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) return;
    const parts = line.split(/[,;\t\s]+/).filter(Boolean);
    if (parts.length < 3) {
      errors.push(`Linha ${idx + 1}: esperado "id, x, y" (mínimo 3 colunas)`);
      return;
    }
    const [id, xs, ys, zs] = parts;
    const x = Number(xs);
    const y = Number(ys);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      errors.push(`Linha ${idx + 1}: x ou y inválido`);
      return;
    }
    const point: GeoPoint = { id: id!, x, y };
    if (zs !== undefined && zs !== '') {
      const z = Number(zs);
      if (Number.isFinite(z)) point.z = z;
    }
    points.push(point);
  });
  return { points, errors };
}

export const DEFAULT_SAMPLE = `# id, x, y (1 por linha) — exemplo em UTM 22S SIRGAS2000
P1, 500000, 7500000
P2, 500100, 7500000
P3, 500100, 7500100
P4, 500000, 7500100`;

export const SYSTEM_PRESETS: Array<{ label: string; value: CoordinateSystem }> = [
  { label: 'UTM 22S (SIRGAS2000)', value: { type: 'UTM', zone: 22, hemisphere: 'S', datum: 'SIRGAS2000' } },
  { label: 'UTM 23S (SIRGAS2000)', value: { type: 'UTM', zone: 23, hemisphere: 'S', datum: 'SIRGAS2000' } },
  { label: 'UTM 24S (SIRGAS2000)', value: { type: 'UTM', zone: 24, hemisphere: 'S', datum: 'SIRGAS2000' } },
  { label: 'UTM 25S (SIRGAS2000)', value: { type: 'UTM', zone: 25, hemisphere: 'S', datum: 'SIRGAS2000' } },
  { label: 'UTM 21S (SIRGAS2000)', value: { type: 'UTM', zone: 21, hemisphere: 'S', datum: 'SIRGAS2000' } },
  { label: 'Lat/Long (SIRGAS2000)', value: { type: 'LatLong', datum: 'SIRGAS2000' } },
  { label: 'Lat/Long (WGS84)', value: { type: 'LatLong', datum: 'WGS84' } },
  { label: 'Lat/Long (SAD69)', value: { type: 'LatLong', datum: 'SAD69' } },
];

export function systemKey(sys: CoordinateSystem): string {
  if (sys.type === 'UTM') return `UTM-${sys.zone}${sys.hemisphere}-${sys.datum}`;
  return `LatLong-${sys.datum}`;
}

export function buildPolygon(points: GeoPoint[], system: CoordinateSystem): Polygon {
  return { points, system };
}
