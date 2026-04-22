import express from 'express';
import cors from 'cors';
import type { Polygon } from '@maprix/types';
import { computeArea } from '@maprix/geo-core';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Dummy import check — garante que os workspaces compartilhados resolvem
// no bundle do backend sem estourar em runtime.
const _typeCheck: Polygon | null = null;
void _typeCheck;
void computeArea;

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => {
  console.log(`[maprix backend] listening on :${PORT}`);
});
