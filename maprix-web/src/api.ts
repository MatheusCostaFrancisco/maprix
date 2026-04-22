import type { ConferenciaResult, CoordinateSystem, Polygon, Segment } from '@maprix/types';

const raw = import.meta.env.VITE_API_URL?.trim();

export const API_BASE_URL = raw
  ? raw.startsWith('http://') || raw.startsWith('https://')
    ? raw.replace(/\/$/, '')
    : `https://${raw.replace(/\/$/, '')}`
  : '';

async function post<T>(path: string, body: unknown): Promise<T> {
  if (!API_BASE_URL) throw new Error('VITE_API_URL não configurada');
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchHealth(): Promise<{ ok: boolean }> {
  if (!API_BASE_URL) throw new Error('VITE_API_URL não configurada');
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export interface ConvertResponse {
  polygon: Polygon;
  segments: Segment[];
  area_m2: number;
  perimetro_m: number;
}

export function convertPolygon(polygon: Polygon, to: CoordinateSystem) {
  return post<ConvertResponse>('/api/convert', { polygon, to });
}

export interface ConferenciaResponse {
  polygon: Polygon;
  conferencia: ConferenciaResult;
}

export function conferirPolygon(polygon: Polygon, to: CoordinateSystem, tolerancia_m = 0.5) {
  return post<ConferenciaResponse>('/api/conferencia', { polygon, to, tolerancia_m });
}

export async function downloadMemorialDxf(polygon: Polygon): Promise<Blob> {
  if (!API_BASE_URL) throw new Error('VITE_API_URL não configurada');
  const res = await fetch(`${API_BASE_URL}/api/memorial/dxf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ polygon }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.blob();
}

export interface MemorialResponse {
  cursivo: string;
  tabelado: Array<{
    de: string;
    para: string;
    azimute_dms: string;
    azimute_decimal: number;
    distancia_m: number;
  }>;
  resumo: {
    area_m2: number;
    perimetro_m: number;
    num_vertices: number;
  };
}

export function gerarMemorial(polygon: Polygon) {
  return post<MemorialResponse>('/api/memorial', { polygon });
}

export async function downloadShapefile(polygon: Polygon): Promise<Blob> {
  if (!API_BASE_URL) throw new Error('VITE_API_URL não configurada');
  const res = await fetch(`${API_BASE_URL}/api/shapefile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ polygon }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.blob();
}
