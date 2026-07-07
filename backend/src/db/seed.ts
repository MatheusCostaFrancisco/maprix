import 'dotenv/config';
import { eq, sql } from 'drizzle-orm';
import { db, pool } from './client.js';
import { matriculas, protocolos, users } from './schema.js';
import { hashPassword } from '../lib/auth.js';

/** Garante a conta de cartório (via env) e retorna o id, ou null se não configurada. */
async function ensureCartorioUser(): Promise<string | null> {
  const rawEmail = process.env.SEED_CARTORIO_EMAIL;
  const password = process.env.SEED_CARTORIO_PASSWORD;
  const name = process.env.SEED_CARTORIO_NAME ?? 'Cartório';

  if (!rawEmail || !password) {
    console.log('[seed] SEED_CARTORIO_EMAIL/PASSWORD não definidos — pulando usuário.');
    return null;
  }
  const email = rawEmail.toLowerCase().trim();

  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) {
    console.log(`[seed] conta de cartório já existe: ${email}`);
    return existing.id;
  }

  const passwordHash = await hashPassword(password);
  const [created] = await db
    .insert(users)
    .values({ email, passwordHash, name, role: 'cartorio' })
    .returning();
  console.log(`[seed] conta de cartório criada: ${email}`);
  return created!.id;
}

/** Popula matrículas/protocolos de demonstração (idempotente — só se vazio). */
async function seedCartorioData(createdBy: string | null) {
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(matriculas);
  if (n > 0) {
    console.log('[seed] matrículas já existem — pulando dados de exemplo.');
    return;
  }

  const inserted = await db
    .insert(matriculas)
    .values([
      {
        numero: '12.345',
        cartorio: '1º Ofício de Registro de Imóveis',
        proprietario: 'Fazenda Santa Helena Ltda.',
        municipio: 'Rio Verde',
        uf: 'GO',
        areaM2: 1_240_500,
        status: 'ativa',
        createdBy,
      },
      {
        numero: '8.902',
        cartorio: '2º Ofício de Registro de Imóveis',
        proprietario: 'João Batista de Souza',
        municipio: 'Uberaba',
        uf: 'MG',
        areaM2: 42_800,
        status: 'em_analise',
        createdBy,
      },
      {
        numero: '30.114',
        cartorio: '1º Ofício de Registro de Imóveis',
        proprietario: 'Agropecuária Vale Verde S.A.',
        municipio: 'Sorriso',
        uf: 'MT',
        areaM2: 3_985_000,
        status: 'ativa',
        createdBy,
      },
    ])
    .returning({ id: matriculas.id, numero: matriculas.numero });

  const byNumero = new Map(inserted.map((m) => [m.numero, m.id]));

  await db.insert(protocolos).values([
    {
      numero: 'PROT-2026-0001',
      requerente: 'Eng. Marina Alves (CREA 123456)',
      tipo: 'georreferenciamento',
      status: 'em_analise',
      matriculaId: byNumero.get('12.345') ?? null,
      observacao: 'Certificação SIGEF anexa. Conferir vértices M-3 e M-4.',
      createdBy,
    },
    {
      numero: 'PROT-2026-0002',
      requerente: 'Eng. Carlos Menezes (CREA 654321)',
      tipo: 'retificacao',
      status: 'exigencia',
      matriculaId: byNumero.get('8.902') ?? null,
      observacao: 'Divergência de área acima da tolerância. Solicitar novo memorial.',
      createdBy,
    },
    {
      numero: 'PROT-2026-0003',
      requerente: 'Agropecuária Vale Verde S.A.',
      tipo: 'desmembramento',
      status: 'recebido',
      matriculaId: byNumero.get('30.114') ?? null,
      observacao: null,
      createdBy,
    },
  ]);

  console.log('[seed] dados de exemplo do cartório inseridos.');
}

async function seed() {
  const cartorioId = await ensureCartorioUser();
  await seedCartorioData(cartorioId);
}

seed()
  .then(() => pool.end())
  .catch((err) => {
    console.error('[seed] erro:', err);
    void pool.end();
    process.exit(1);
  });
