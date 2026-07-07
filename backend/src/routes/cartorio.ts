import { Router } from 'express';
import { z } from 'zod';
import { and, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm';
import type { Matricula, Protocolo } from '@maprix/types';
import { db } from '../db/client.js';
import {
  matriculas,
  protocolos,
  type MatriculaRow,
  type ProtocoloRow,
} from '../db/schema.js';
import { requireAuth, requireRole, type AuthedRequest } from '../lib/middleware.js';

const router = Router();

// Todas as rotas do cartório exigem sessão + role cartorio.
router.use(requireAuth, requireRole('cartorio'));

// --- Mappers (snake/DB -> camelCase/contrato). Nunca vazar a row crua. -------

function toMatricula(r: MatriculaRow): Matricula {
  return {
    id: r.id,
    numero: r.numero,
    cartorio: r.cartorio,
    proprietario: r.proprietario,
    municipio: r.municipio,
    uf: r.uf,
    areaM2: r.areaM2,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

function toProtocolo(r: ProtocoloRow): Protocolo {
  return {
    id: r.id,
    numero: r.numero,
    requerente: r.requerente,
    tipo: r.tipo,
    status: r.status,
    matriculaId: r.matriculaId,
    observacao: r.observacao,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

// Colunas explícitas — evita SELECT * em tabela com PII (proprietario/requerente).
const matriculaCols = {
  id: matriculas.id,
  numero: matriculas.numero,
  cartorio: matriculas.cartorio,
  proprietario: matriculas.proprietario,
  municipio: matriculas.municipio,
  uf: matriculas.uf,
  areaM2: matriculas.areaM2,
  status: matriculas.status,
  createdBy: matriculas.createdBy,
  createdAt: matriculas.createdAt,
  updatedAt: matriculas.updatedAt,
};

const protocoloCols = {
  id: protocolos.id,
  numero: protocolos.numero,
  requerente: protocolos.requerente,
  tipo: protocolos.tipo,
  status: protocolos.status,
  matriculaId: protocolos.matriculaId,
  observacao: protocolos.observacao,
  createdBy: protocolos.createdBy,
  createdAt: protocolos.createdAt,
  updatedAt: protocolos.updatedAt,
};

// --- Schemas ----------------------------------------------------------------

const matriculaStatusEnum = z.enum(['ativa', 'em_analise', 'cancelada']);
const protocoloTipoEnum = z.enum([
  'georreferenciamento',
  'retificacao',
  'desmembramento',
  'unificacao',
]);
const protocoloStatusEnum = z.enum([
  'recebido',
  'em_analise',
  'exigencia',
  'aprovado',
  'rejeitado',
]);

const createMatriculaSchema = z.object({
  numero: z.string().min(1).max(60).trim(),
  cartorio: z.string().max(160).trim().optional(),
  proprietario: z.string().min(1).max(200).trim(),
  municipio: z.string().max(120).trim().optional(),
  uf: z.string().length(2).toUpperCase().optional(),
  areaM2: z.number().nonnegative().optional(),
});

const updateMatriculaSchema = createMatriculaSchema.partial().extend({
  status: matriculaStatusEnum.optional(),
});

const createProtocoloSchema = z.object({
  numero: z.string().min(1).max(60).trim(),
  requerente: z.string().min(1).max(200).trim(),
  tipo: protocoloTipoEnum,
  matriculaId: z.string().uuid().optional(),
  observacao: z.string().max(2000).trim().optional(),
});

const updateProtocoloSchema = z.object({
  status: protocoloStatusEnum.optional(),
  observacao: z.string().max(2000).trim().optional(),
  matriculaId: z.string().uuid().nullable().optional(),
});

// --- Overview ---------------------------------------------------------------

router.get('/overview', async (_req, res) => {
  const countOf = async (cond?: SQL) => {
    const [row] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(protocolos)
      .where(cond ?? sql`true`);
    return row?.n ?? 0;
  };
  const [mrow] = await db.select({ n: sql<number>`count(*)::int` }).from(matriculas);

  res.json({
    matriculas: mrow?.n ?? 0,
    protocolosAbertos: await countOf(
      or(eq(protocolos.status, 'recebido'), eq(protocolos.status, 'em_analise')),
    ),
    protocolosExigencia: await countOf(eq(protocolos.status, 'exigencia')),
    protocolosAprovados: await countOf(eq(protocolos.status, 'aprovado')),
  });
});

// --- Matrículas -------------------------------------------------------------

router.get('/matriculas', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const statusParse = matriculaStatusEnum.safeParse(req.query.status);
  const filters: (SQL | undefined)[] = [];
  if (q) {
    filters.push(
      or(ilike(matriculas.numero, `%${q}%`), ilike(matriculas.proprietario, `%${q}%`)),
    );
  }
  if (statusParse.success) filters.push(eq(matriculas.status, statusParse.data));

  const rows = await db
    .select(matriculaCols)
    .from(matriculas)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(matriculas.createdAt))
    .limit(200);

  res.json({ matriculas: rows.map(toMatricula) });
});

router.post('/matriculas', async (req: AuthedRequest, res) => {
  const parsed = createMatriculaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_input', issues: parsed.error.issues });
  }
  const d = parsed.data;
  const [created] = await db
    .insert(matriculas)
    .values({
      numero: d.numero,
      cartorio: d.cartorio ?? null,
      proprietario: d.proprietario,
      municipio: d.municipio ?? null,
      uf: d.uf ?? null,
      areaM2: d.areaM2 ?? null,
      createdBy: req.auth?.sub ?? null,
    })
    .returning(matriculaCols);
  return res.status(201).json({ matricula: toMatricula(created) });
});

router.get('/matriculas/:id', async (req, res) => {
  const [row] = await db
    .select(matriculaCols)
    .from(matriculas)
    .where(eq(matriculas.id, req.params.id));
  if (!row) return res.status(404).json({ error: 'not_found' });
  return res.json({ matricula: toMatricula(row) });
});

router.patch('/matriculas/:id', async (req, res) => {
  const parsed = updateMatriculaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_input', issues: parsed.error.issues });
  }
  const d = parsed.data;
  const [updated] = await db
    .update(matriculas)
    .set({
      ...(d.numero !== undefined ? { numero: d.numero } : {}),
      ...(d.cartorio !== undefined ? { cartorio: d.cartorio } : {}),
      ...(d.proprietario !== undefined ? { proprietario: d.proprietario } : {}),
      ...(d.municipio !== undefined ? { municipio: d.municipio } : {}),
      ...(d.uf !== undefined ? { uf: d.uf } : {}),
      ...(d.areaM2 !== undefined ? { areaM2: d.areaM2 } : {}),
      ...(d.status !== undefined ? { status: d.status } : {}),
      updatedAt: new Date(),
    })
    .where(eq(matriculas.id, req.params.id))
    .returning(matriculaCols);
  if (!updated) return res.status(404).json({ error: 'not_found' });
  return res.json({ matricula: toMatricula(updated) });
});

// --- Protocolos -------------------------------------------------------------

router.get('/protocolos', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const statusParse = protocoloStatusEnum.safeParse(req.query.status);
  const filters: (SQL | undefined)[] = [];
  if (q) {
    filters.push(
      or(ilike(protocolos.numero, `%${q}%`), ilike(protocolos.requerente, `%${q}%`)),
    );
  }
  if (statusParse.success) filters.push(eq(protocolos.status, statusParse.data));

  const rows = await db
    .select(protocoloCols)
    .from(protocolos)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(protocolos.createdAt))
    .limit(200);

  res.json({ protocolos: rows.map(toProtocolo) });
});

router.post('/protocolos', async (req: AuthedRequest, res) => {
  const parsed = createProtocoloSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_input', issues: parsed.error.issues });
  }
  const d = parsed.data;
  const [created] = await db
    .insert(protocolos)
    .values({
      numero: d.numero,
      requerente: d.requerente,
      tipo: d.tipo,
      matriculaId: d.matriculaId ?? null,
      observacao: d.observacao ?? null,
      createdBy: req.auth?.sub ?? null,
    })
    .returning(protocoloCols);
  return res.status(201).json({ protocolo: toProtocolo(created) });
});

router.patch('/protocolos/:id', async (req, res) => {
  const parsed = updateProtocoloSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_input', issues: parsed.error.issues });
  }
  const d = parsed.data;
  const [updated] = await db
    .update(protocolos)
    .set({
      ...(d.status !== undefined ? { status: d.status } : {}),
      ...(d.observacao !== undefined ? { observacao: d.observacao } : {}),
      ...(d.matriculaId !== undefined ? { matriculaId: d.matriculaId } : {}),
      updatedAt: new Date(),
    })
    .where(eq(protocolos.id, req.params.id))
    .returning(protocoloCols);
  if (!updated) return res.status(404).json({ error: 'not_found' });
  return res.json({ protocolo: toProtocolo(updated) });
});

export default router;
