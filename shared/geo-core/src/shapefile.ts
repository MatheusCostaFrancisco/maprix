import JSZip from 'jszip';
import type { CoordinateSystem, Polygon } from '@maprix/types';
import { convertPolygon } from './index.js';

const SHAPE_TYPE_POLYGON = 5;

function bboxOf(points: { x: number; y: number }[]): [number, number, number, number] {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return [minX, minY, maxX, maxY];
}

function writeShpHeader(
  view: DataView,
  fileLength16Bit: number,
  bbox: [number, number, number, number],
) {
  // File code (big-endian)
  view.setInt32(0, 9994, false);
  // Unused
  for (let i = 4; i < 24; i += 4) view.setInt32(i, 0, false);
  // File length in 16-bit words (big-endian)
  view.setInt32(24, fileLength16Bit, false);
  // Version (little-endian)
  view.setInt32(28, 1000, true);
  // Shape type
  view.setInt32(32, SHAPE_TYPE_POLYGON, true);
  // BBox Xmin, Ymin, Xmax, Ymax (little-endian doubles)
  view.setFloat64(36, bbox[0], true);
  view.setFloat64(44, bbox[1], true);
  view.setFloat64(52, bbox[2], true);
  view.setFloat64(60, bbox[3], true);
  // Zmin, Zmax, Mmin, Mmax (unused for 2D polygon)
  view.setFloat64(68, 0, true);
  view.setFloat64(76, 0, true);
  view.setFloat64(84, 0, true);
  view.setFloat64(92, 0, true);
}

function buildShp(poly: Polygon): { shp: ArrayBuffer; shx: ArrayBuffer } {
  const ring = [...poly.points, poly.points[0]!];
  const bbox = bboxOf(ring);
  const numPoints = ring.length;
  // Record content for polygon: int(shape)=4 + box=32 + int(numParts)=4 + int(numPoints)=4
  // + parts=4*numParts + points=16*numPoints
  const numParts = 1;
  const recordContentLen = 4 + 32 + 4 + 4 + 4 * numParts + 16 * numPoints;
  const recordHeaderLen = 8;
  const recordLen = recordHeaderLen + recordContentLen;

  const shpLen = 100 + recordLen;
  const shpBuffer = new ArrayBuffer(shpLen);
  const shpView = new DataView(shpBuffer);
  writeShpHeader(shpView, shpLen / 2, bbox);

  let off = 100;
  // Record header (big-endian: record number, content length in 16-bit)
  shpView.setInt32(off, 1, false);
  shpView.setInt32(off + 4, recordContentLen / 2, false);
  off += 8;
  // Content
  shpView.setInt32(off, SHAPE_TYPE_POLYGON, true);
  off += 4;
  shpView.setFloat64(off, bbox[0], true);
  shpView.setFloat64(off + 8, bbox[1], true);
  shpView.setFloat64(off + 16, bbox[2], true);
  shpView.setFloat64(off + 24, bbox[3], true);
  off += 32;
  shpView.setInt32(off, numParts, true);
  off += 4;
  shpView.setInt32(off, numPoints, true);
  off += 4;
  // Parts: start index of each part
  shpView.setInt32(off, 0, true);
  off += 4;
  // Points
  for (const p of ring) {
    shpView.setFloat64(off, p.x, true);
    shpView.setFloat64(off + 8, p.y, true);
    off += 16;
  }

  // SHX: header (100 bytes) + 1 record (8 bytes: offset, content length)
  const shxLen = 100 + 8;
  const shxBuffer = new ArrayBuffer(shxLen);
  const shxView = new DataView(shxBuffer);
  writeShpHeader(shxView, shxLen / 2, bbox);
  // Offset in 16-bit words (100 bytes = 50)
  shxView.setInt32(100, 50, false);
  // Content length in 16-bit words
  shxView.setInt32(104, recordContentLen / 2, false);

  return { shp: shpBuffer, shx: shxBuffer };
}

function padRight(s: string, length: number): string {
  return s.length >= length ? s.slice(0, length) : s + ' '.repeat(length - s.length);
}

// Codifica uma string em ISO-8859-1 (Latin-1), um byte por UTF-16 code unit.
// Codepoints > 0xFF (fora do Latin-1) viram '?' — preserva alinhamento byte⇔char
// em campos de tamanho fixo do DBF, evitando truncar no meio de um caractere.
function latin1Bytes(s: string): Uint8Array {
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) {
    const cp = s.charCodeAt(i);
    out[i] = cp <= 0xff ? cp : 0x3f;
  }
  return out;
}

function buildDbf(poly: Polygon): ArrayBuffer {
  // Campos: ID (char 10), AREA_M2 (numeric 16.3), PERIM_M (numeric 16.3)
  const fields = [
    { name: 'ID', type: 'C', length: 10, decimals: 0 },
    { name: 'AREA_M2', type: 'N', length: 16, decimals: 3 },
    { name: 'PERIM_M', type: 'N', length: 16, decimals: 3 },
  ];
  const recordCount = 1;
  const headerLen = 32 + fields.length * 32 + 1;
  const recordLen = 1 + fields.reduce((s, f) => s + f.length, 0);
  const totalLen = headerLen + recordCount * recordLen + 1;

  const buffer = new ArrayBuffer(totalLen);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  // Header
  view.setUint8(0, 0x03); // dBase III
  const now = new Date();
  view.setUint8(1, now.getFullYear() - 1900);
  view.setUint8(2, now.getMonth() + 1);
  view.setUint8(3, now.getDate());
  view.setUint32(4, recordCount, true);
  view.setUint16(8, headerLen, true);
  view.setUint16(10, recordLen, true);
  // Bytes 12..31 ficam zerados por default. Exceção: byte 29 é o Language Driver ID
  // (LDID). 0x03 = Windows ANSI / CP1252 — codifica acentos do português brasileiro
  // (ã, ç, é, ó, ú, ê, â, ô) de forma idêntica ao ISO-8859-1 e é amplamente
  // reconhecido por ArcGIS, QGIS e ferramentas tradicionais de GIS no Brasil.
  view.setUint8(29, 0x03);

  // Field descriptors
  fields.forEach((f, i) => {
    const offset = 32 + i * 32;
    const name = padRight(f.name, 11).slice(0, 11);
    bytes.set(latin1Bytes(name), offset);
    view.setUint8(offset + 11, f.type.charCodeAt(0));
    view.setUint8(offset + 16, f.length);
    view.setUint8(offset + 17, f.decimals);
  });
  view.setUint8(headerLen - 1, 0x0d); // header terminator

  // Record
  const matricula = poly.metadata?.matricula ?? '1';
  const area = poly.metadata?.area_m2 ?? 0;
  const perim = poly.metadata?.perimetro_m ?? 0;

  let recOff = headerLen;
  view.setUint8(recOff, 0x20); // deletion flag = not deleted
  recOff += 1;
  bytes.set(latin1Bytes(padRight(matricula.slice(0, 10), 10)), recOff);
  recOff += 10;
  bytes.set(latin1Bytes(area.toFixed(3).padStart(16, ' ').slice(-16)), recOff);
  recOff += 16;
  bytes.set(latin1Bytes(perim.toFixed(3).padStart(16, ' ').slice(-16)), recOff);
  recOff += 16;

  // EOF marker
  view.setUint8(totalLen - 1, 0x1a);
  return buffer;
}

function wktForSystem(sys: CoordinateSystem): string {
  if (sys.type === 'LatLong' && sys.datum === 'SIRGAS2000') {
    return 'GEOGCS["SIRGAS 2000",DATUM["SIRGAS_2000",SPHEROID["GRS 1980",6378137,298.257222101]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]]';
  }
  if (sys.type === 'LatLong' && sys.datum === 'WGS84') {
    return 'GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]]';
  }
  if (sys.type === 'LatLong') {
    return `GEOGCS["${sys.datum}",DATUM["${sys.datum}",SPHEROID["GRS 1980",6378137,298.257222101]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]]`;
  }
  // UTM
  const falseNorthing = sys.hemisphere === 'S' ? 10000000 : 0;
  const centralMeridian = -183 + 6 * sys.zone;
  const datum =
    sys.datum === 'SIRGAS2000'
      ? 'DATUM["SIRGAS_2000",SPHEROID["GRS 1980",6378137,298.257222101]]'
      : 'DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563]]';
  return `PROJCS["UTM Zone ${sys.zone}${sys.hemisphere} ${sys.datum}",GEOGCS["${sys.datum}",${datum},PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",${centralMeridian}],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",${falseNorthing}],UNIT["metre",1]]`;
}

export async function gerarShapefileZip(poly: Polygon): Promise<Uint8Array> {
  if (poly.points.length < 3) throw new Error('shapefile exige pelo menos 3 vértices');

  // SIG-RI exige coordenadas geográficas (lat/long) em SIRGAS2000.
  const targetSystem: CoordinateSystem =
    poly.system.type === 'LatLong' && poly.system.datum === 'SIRGAS2000'
      ? poly.system
      : { type: 'LatLong', datum: 'SIRGAS2000' };
  const projected = poly.system === targetSystem ? poly : convertPolygon(poly, targetSystem);

  const { shp, shx } = buildShp(projected);
  const dbf = buildDbf(projected);
  const prj = wktForSystem(projected.system);

  const zip = new JSZip();
  const folder = zip.folder('maprix-sigri');
  if (!folder) throw new Error('não foi possível criar pasta no zip');
  folder.file('imovel.shp', shp);
  folder.file('imovel.shx', shx);
  folder.file('imovel.dbf', dbf);
  folder.file('imovel.prj', prj);
  // .cpg companion — declara o encoding do .dbf para leitores modernos. Tem
  // precedência sobre o LDID do header quando os dois divergem. ISO-8859-1 é o
  // nome canônico aceito por GDAL, QGIS, PostGIS e ESRI.
  folder.file('imovel.cpg', 'ISO-8859-1\n');

  const out = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
  return out;
}
