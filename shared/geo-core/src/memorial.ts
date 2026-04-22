import type { Polygon } from '@maprix/types';
import { computeArea, computePerimeter, computeSegments } from './index.js';

function formatNumberBR(n: number, decimals = 2): string {
  return n.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatCoord(n: number, decimals = 3): string {
  return n.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export interface MemorialRow {
  de: string;
  para: string;
  azimute_dms: string;
  azimute_decimal: number;
  distancia_m: number;
}

export interface MemorialData {
  cursivo: string;
  tabelado: MemorialRow[];
  resumo: {
    area_m2: number;
    perimetro_m: number;
    num_vertices: number;
  };
}

export function gerarMemorial(poly: Polygon): MemorialData {
  if (poly.points.length < 3) {
    throw new Error('memorial exige pelo menos 3 vértices');
  }
  const segments = computeSegments(poly);
  const area_m2 = computeArea(poly);
  const perimetro_m = computePerimeter(poly);

  const tabelado: MemorialRow[] = segments.map((s) => ({
    de: s.from.id,
    para: s.to.id,
    azimute_dms: s.azimute_dms,
    azimute_decimal: s.azimute_decimal,
    distancia_m: s.distancia_m,
  }));

  const first = poly.points[0]!;
  const sistemaTxt =
    poly.system.type === 'UTM'
      ? `UTM zona ${poly.system.zone}${poly.system.hemisphere} (${poly.system.datum})`
      : `latitude/longitude (${poly.system.datum})`;

  const matricula = poly.metadata?.matricula ? `matrícula nº ${poly.metadata.matricula}` : 'o imóvel';
  const proprietario = poly.metadata?.proprietario ? ` de propriedade de ${poly.metadata.proprietario}` : '';
  const local =
    poly.metadata?.municipio && poly.metadata?.uf
      ? `, situado no município de ${poly.metadata.municipio}/${poly.metadata.uf}`
      : '';

  const partes: string[] = [];
  partes.push(
    `MEMORIAL DESCRITIVO — ${matricula}${proprietario}${local}. Coordenadas no sistema ${sistemaTxt}.`,
  );
  partes.push(
    `O perímetro inicia-se no vértice ${first.id}, de coordenadas X=${formatCoord(first.x, 6)}, Y=${formatCoord(first.y, 6)};`,
  );
  segments.forEach((s, i) => {
    const conector = i === 0 ? 'deste segue' : 'do qual segue';
    partes.push(
      `${conector} com azimute de ${s.azimute_dms} e distância de ${formatNumberBR(s.distancia_m, 3)} m até o vértice ${s.to.id};`,
    );
  });
  partes.push(
    `fechando o polígono no vértice ${first.id}, totalizando área de ${formatNumberBR(area_m2, 2)} m² e perímetro de ${formatNumberBR(perimetro_m, 2)} m.`,
  );

  return {
    cursivo: partes.join(' '),
    tabelado,
    resumo: {
      area_m2,
      perimetro_m,
      num_vertices: poly.points.length,
    },
  };
}

export function gerarMemorialDxf(poly: Polygon): string {
  if (poly.points.length < 2) {
    throw new Error('DXF exige pelo menos 2 pontos');
  }
  const ring = [...poly.points, poly.points[0]!];
  const lines: string[] = [];
  lines.push('0', 'SECTION', '2', 'HEADER', '0', 'ENDSEC');
  lines.push('0', 'SECTION', '2', 'ENTITIES');
  // LWPOLYLINE
  lines.push('0', 'LWPOLYLINE');
  lines.push('8', 'MAPRIX');
  lines.push('90', String(poly.points.length));
  lines.push('70', '1'); // closed
  poly.points.forEach((p) => {
    lines.push('10', p.x.toFixed(6));
    lines.push('20', p.y.toFixed(6));
  });
  // TEXT labels for each vertex
  ring.slice(0, -1).forEach((p) => {
    lines.push('0', 'TEXT');
    lines.push('8', 'MAPRIX-LABELS');
    lines.push('10', p.x.toFixed(6));
    lines.push('20', p.y.toFixed(6));
    lines.push('40', '1.5');
    lines.push('1', p.id);
  });
  lines.push('0', 'ENDSEC');
  lines.push('0', 'EOF');
  return lines.join('\n');
}
