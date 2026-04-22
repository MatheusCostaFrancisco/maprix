export type CoordinateSystem =
  | { type: 'UTM'; zone: number; hemisphere: 'N' | 'S'; datum: 'SIRGAS2000' | 'WGS84' }
  | { type: 'LatLong'; datum: 'SIRGAS2000' | 'WGS84' | 'SAD69' };

export interface GeoPoint {
  id: string;
  x: number;
  y: number;
  z?: number;
}

export interface Polygon {
  points: GeoPoint[];
  system: CoordinateSystem;
  metadata?: {
    matricula?: string;
    proprietario?: string;
    municipio?: string;
    uf?: string;
    area_m2?: number;
    perimetro_m?: number;
  };
}

export interface Segment {
  from: GeoPoint;
  to: GeoPoint;
  azimute_decimal: number;
  azimute_dms: string;
  distancia_m: number;
}

export interface ConferenciaResult {
  sistemaOrigem: CoordinateSystem;
  sistemaDestino: CoordinateSystem;
  divergenciaMaxima_m: number;
  toleranciaConfig_m: number;
  aprovado: boolean;
  divergenciasPorPonto: Array<{ pontoId: string; delta_m: number }>;
}
