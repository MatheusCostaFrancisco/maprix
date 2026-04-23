import { writeFileSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.resolve(__dirname, 'inspect-out');

mkdirSync(OUT, { recursive: true });

const modUrl = pathToFileURL(path.resolve(ROOT, 'shared/geo-core/dist/index.js')).href;
const { gerarShapefileZip } = await import(modUrl);

// Polígono de teste: imóvel retangular de 100x100m perto de Campinas/SP
// em UTM 22S SIRGAS2000. Matrícula inclui acentos para validar encoding do DBF.
const poly = {
  points: [
    { id: 'P1', x: 500000, y: 7500000 },
    { id: 'P2', x: 500100, y: 7500000 },
    { id: 'P3', x: 500100, y: 7500100 },
    { id: 'P4', x: 500000, y: 7500100 },
  ],
  system: { type: 'UTM', zone: 22, hemisphere: 'S', datum: 'SIRGAS2000' },
  metadata: {
    matricula: 'São-Paulo',
    proprietario: 'João Antônio Müller',
    municipio: 'São Paulo',
    uf: 'SP',
  },
};

// Sanity: teste do helper de encoding Latin-1 isolado do DBF.
function latin1EncodeLocal(s) {
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) {
    const cp = s.charCodeAt(i);
    out[i] = cp <= 0xff ? cp : 0x3f;
  }
  return out;
}
console.log('==== ENCODING SANITY ====');
for (const s of ['São Paulo', 'João Antônio Müller', 'Açaí', 'Coração']) {
  const bytes = latin1EncodeLocal(s);
  const decoded = Buffer.from(bytes).toString('latin1');
  const ok = decoded === s ? '✅' : '❌';
  console.log(`  ${ok} "${s}" → [${[...bytes].map((b) => b.toString(16).padStart(2, '0')).join(' ')}] → "${decoded}"`);
}

// Passamos baseName explícito 'imovel' pra manter as leituras do script alinhadas
// com os arquivos extraídos (o default agora é derivado da matrícula).
const zip = await gerarShapefileZip(poly, { baseName: 'imovel' });
const zipPath = path.join(OUT, 'maprix-sigri.zip');
writeFileSync(zipPath, Buffer.from(zip));
console.log('ZIP gerado:', zipPath, `(${zip.length} bytes)`);

// GAP-04 — Dois ZIPs com baseNames distintos, lado a lado, sem colisão.
console.log('\n==== GAP-04 TEST: baseNames distintos ====');
const dualDir = path.join(OUT, 'dual');
mkdirSync(dualDir, { recursive: true });
for (const name of ['lote-01', 'lote-02']) {
  const z = await gerarShapefileZip(poly, { baseName: name });
  const p = path.join(dualDir, `${name}.zip`);
  writeFileSync(p, Buffer.from(z));
  execSync(`unzip -o -d ${dualDir} ${p}`, { stdio: 'pipe' });
}
execSync(`ls -la ${dualDir}/maprix-sigri/`, { stdio: 'inherit' });

// Listar + extrair o principal
execSync(`unzip -o -d ${OUT} ${zipPath}`, { stdio: 'inherit' });
const extractedDir = path.join(OUT, 'maprix-sigri');
const shp = readFileSync(path.join(extractedDir, 'imovel.shp'));
const shx = readFileSync(path.join(extractedDir, 'imovel.shx'));
const dbf = readFileSync(path.join(extractedDir, 'imovel.dbf'));
const prj = readFileSync(path.join(extractedDir, 'imovel.prj'), 'utf-8');
let cpg = null;
try {
  cpg = readFileSync(path.join(extractedDir, 'imovel.cpg'), 'utf-8');
} catch {
  /* .cpg pode não existir (pré GAP-03) */
}
console.log('\n==== CPG ====');
if (cpg) console.log('  content:', JSON.stringify(cpg.trim()));
else console.log('  (sem .cpg)');

console.log('\n==== SHP (' + shp.length + ' bytes) ====');
// Header (100 bytes)
const fileCode = shp.readInt32BE(0);
const fileLen16 = shp.readInt32BE(24);
const version = shp.readInt32LE(28);
const shapeType = shp.readInt32LE(32);
const xmin = shp.readDoubleLE(36);
const ymin = shp.readDoubleLE(44);
const xmax = shp.readDoubleLE(52);
const ymax = shp.readDoubleLE(60);
console.log('  fileCode:', fileCode, '(expected 9994)');
console.log('  file length (16-bit words):', fileLen16, '→ bytes:', fileLen16 * 2, '(actual:', shp.length, ')');
console.log('  version:', version, '(expected 1000)');
console.log('  shape type:', shapeType, '(5=Polygon, 3=Polyline, 1=Point)');
console.log('  BBox: [', xmin, ymin, ',', xmax, ymax, ']');

// Record 1
let off = 100;
const recNum = shp.readInt32BE(off);
const contentLen16 = shp.readInt32BE(off + 4);
off += 8;
const shapeTypeRec = shp.readInt32LE(off);
off += 4;
const bboxRec = [shp.readDoubleLE(off), shp.readDoubleLE(off + 8), shp.readDoubleLE(off + 16), shp.readDoubleLE(off + 24)];
off += 32;
const numParts = shp.readInt32LE(off);
off += 4;
const numPoints = shp.readInt32LE(off);
off += 4;
const parts = [];
for (let i = 0; i < numParts; i++) {
  parts.push(shp.readInt32LE(off));
  off += 4;
}
const pts = [];
for (let i = 0; i < numPoints; i++) {
  pts.push([shp.readDoubleLE(off), shp.readDoubleLE(off + 8)]);
  off += 16;
}
console.log('\n  Record 1: num=', recNum, 'contentLen16=', contentLen16, '→ bytes:', contentLen16 * 2);
console.log('  shapeTypeRec:', shapeTypeRec);
console.log('  BBox record:', bboxRec);
console.log('  numParts:', numParts, 'parts:', parts);
console.log('  numPoints:', numPoints);
pts.forEach((p, i) => console.log(`    p${i}:`, p));

// Ring orientation (shoelace)
let sum = 0;
for (let i = 0; i < pts.length - 1; i++) {
  const [x1, y1] = pts[i];
  const [x2, y2] = pts[i + 1];
  sum += (x2 - x1) * (y2 + y1);
}
console.log('  Shoelace sum:', sum, '→', sum > 0 ? 'CLOCKWISE (ESRI outer ring OK)' : 'COUNTER-CLOCKWISE (ESRI expects CLOCKWISE for outer)');
console.log('  First point == last:', JSON.stringify(pts[0]) === JSON.stringify(pts[pts.length - 1]) ? 'YES (closed)' : 'NO (NOT closed)');

console.log('\n==== SHX (' + shx.length + ' bytes) ====');
const shxFileLen16 = shx.readInt32BE(24);
console.log('  file length 16-bit words:', shxFileLen16, '→ bytes:', shxFileLen16 * 2, '(actual:', shx.length, ')');
const idxOffset = shx.readInt32BE(100);
const idxContent = shx.readInt32BE(104);
console.log('  record index: offset=', idxOffset, 'contentLen16=', idxContent);

console.log('\n==== PRJ (' + prj.length + ' bytes) ====');
console.log(prj);
const prjUsesSIRGAS = /SIRGAS[_ ]2000/i.test(prj);
const prjIsGeographic = /^GEOGCS/i.test(prj.trim());
const prjIsProjected = /^PROJCS/i.test(prj.trim());
console.log('  uses SIRGAS2000:', prjUsesSIRGAS);
console.log('  is GEOGCS (lat/long):', prjIsGeographic);
console.log('  is PROJCS (UTM):', prjIsProjected);

console.log('\n==== DBF (' + dbf.length + ' bytes) ====');
const version_ = dbf.readUInt8(0);
const yy = dbf.readUInt8(1);
const mm = dbf.readUInt8(2);
const dd = dbf.readUInt8(3);
const recCount = dbf.readUInt32LE(4);
const headerLen = dbf.readUInt16LE(8);
const recLen = dbf.readUInt16LE(10);
console.log('  version byte:', '0x' + version_.toString(16), '(0x03=dBase III)');
const ldid = dbf.readUInt8(29);
console.log('  LDID (byte 29):', '0x' + ldid.toString(16).padStart(2, '0'), '(0x03=Windows ANSI/CP1252)');
console.log('  last update:', 1900 + yy, mm, dd);
console.log('  record count:', recCount);
console.log('  header length:', headerLen);
console.log('  record length:', recLen);

const numFields = Math.floor((headerLen - 32 - 1) / 32);
console.log('  num fields:', numFields);
const fields = [];
for (let i = 0; i < numFields; i++) {
  const off = 32 + i * 32;
  const name = dbf.slice(off, off + 11).toString('binary').replace(/\0.*$/, '').trim();
  const type = String.fromCharCode(dbf.readUInt8(off + 11));
  const len = dbf.readUInt8(off + 16);
  const dec = dbf.readUInt8(off + 17);
  fields.push({ name, type, len, dec });
  console.log(`  field #${i + 1}:`, name, 'type=', type, 'len=', len, 'dec=', dec);
}

// Record dump
let roff = headerLen;
for (let r = 0; r < recCount; r++) {
  const deleted = dbf.readUInt8(roff);
  const rowBytes = dbf.slice(roff + 1, roff + 1 + fields.reduce((s, f) => s + f.len, 0));
  console.log(`\n  Record ${r + 1} (deleted flag=0x${deleted.toString(16)}):`);
  let cursor = 0;
  fields.forEach((f) => {
    const raw = rowBytes.slice(cursor, cursor + f.len);
    const asLatin1 = raw.toString('latin1');
    const asBinary = raw.toString('binary');
    console.log(`    ${f.name} (${f.type}): latin1="${asLatin1}" | bytes: ${[...raw].map((b) => b.toString(16).padStart(2, '0')).join(' ')}`);
    if (asLatin1 !== asBinary) console.log(`       note: latin1 != binary interpretation`);
    cursor += f.len;
  });
  roff += 1 + fields.reduce((s, f) => s + f.len, 0);
}
const eof = dbf.readUInt8(dbf.length - 1);
console.log('\n  EOF marker (last byte):', '0x' + eof.toString(16), '(expected 0x1a)');

console.log('\n==== FILE LIST ====');
execSync(`ls -la ${extractedDir}`, { stdio: 'inherit' });

console.log('\n==== DONE ====');
