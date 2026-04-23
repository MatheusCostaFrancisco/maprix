import express from 'express';
import cors from 'cors';
import type { CoordinateSystem, Polygon } from '@maprix/types';
import {
  computeArea,
  computePerimeter,
  computeSegments,
  conferenciaBilateral,
  convertPolygon,
  gerarMemorial,
  gerarMemorialDxf,
  gerarShapefileZip,
} from '@maprix/geo-core';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

function assertPolygon(p: unknown): asserts p is Polygon {
  if (!p || typeof p !== 'object') throw new Error('polygon ausente');
  const poly = p as Partial<Polygon>;
  if (!Array.isArray(poly.points) || poly.points.length < 2) {
    throw new Error('polygon.points deve ter ao menos 2 pontos');
  }
  if (!poly.system) throw new Error('polygon.system ausente');
}

function assertSystem(s: unknown): asserts s is CoordinateSystem {
  if (!s || typeof s !== 'object') throw new Error('system ausente');
}

app.post('/api/convert', (req, res) => {
  try {
    const { polygon, to } = req.body ?? {};
    assertPolygon(polygon);
    assertSystem(to);
    const converted = convertPolygon(polygon, to);
    const segments = computeSegments(converted);
    const area_m2 = computeArea(converted);
    const perimetro_m = computePerimeter(converted);
    res.json({
      polygon: { ...converted, metadata: { ...converted.metadata, area_m2, perimetro_m } },
      segments,
      area_m2,
      perimetro_m,
    });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.post('/api/conferencia', (req, res) => {
  try {
    const { polygon, to, tolerancia_m } = req.body ?? {};
    assertPolygon(polygon);
    assertSystem(to);
    const tol = typeof tolerancia_m === 'number' ? tolerancia_m : 0.5;
    const convertido = convertPolygon(polygon, to);
    const reconvertido = convertPolygon(convertido, polygon.system);
    const conferencia = conferenciaBilateral(polygon, reconvertido, tol);
    res.json({ polygon: convertido, conferencia });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.post('/api/memorial', (req, res) => {
  try {
    const { polygon } = req.body ?? {};
    assertPolygon(polygon);
    const memorial = gerarMemorial(polygon);
    res.json(memorial);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.post('/api/memorial/dxf', (req, res) => {
  try {
    const { polygon } = req.body ?? {};
    assertPolygon(polygon);
    const dxf = gerarMemorialDxf(polygon);
    res.setHeader('Content-Type', 'application/dxf');
    res.setHeader('Content-Disposition', 'attachment; filename="memorial-maprix.dxf"');
    res.send(dxf);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.post('/api/shapefile', async (req, res) => {
  try {
    const { polygon, baseName } = req.body ?? {};
    assertPolygon(polygon);
    const opts = typeof baseName === 'string' && baseName.trim() ? { baseName } : undefined;
    const zip = await gerarShapefileZip(polygon, opts);
    const zipFilename = opts ? `${opts.baseName}.zip` : 'maprix-sigri.zip';
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);
    res.send(Buffer.from(zip));
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => {
  console.log(`[maprix backend] listening on :${PORT}`);
});
