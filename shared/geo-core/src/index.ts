import type {
  Polygon,
  Segment,
  ConferenciaResult,
  CoordinateSystem,
} from '@maprix/types';

export function convertPolygon(_poly: Polygon, _to: CoordinateSystem): Polygon {
  throw new Error('not implemented');
}

export function computeSegments(_poly: Polygon): Segment[] {
  throw new Error('not implemented');
}

export function computeArea(_poly: Polygon): number {
  throw new Error('not implemented');
}

export function computePerimeter(_poly: Polygon): number {
  throw new Error('not implemented');
}

export function conferenciaBilateral(
  _original: Polygon,
  _convertido: Polygon,
  _tolerancia_m: number,
): ConferenciaResult {
  throw new Error('not implemented');
}
