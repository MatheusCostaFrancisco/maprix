import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  pgEnum,
  doublePrecision,
} from 'drizzle-orm/pg-core';

export const userRole = pgEnum('user_role', ['engenheiro', 'cartorio']);

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    name: text('name'),
    role: userRole('role').notNull().default('engenheiro'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: index('users_email_idx').on(table.email),
  }),
);

export type UserRow = typeof users.$inferSelect;

// --- Cartório ---------------------------------------------------------------

export const matriculaStatus = pgEnum('matricula_status', [
  'ativa',
  'em_analise',
  'cancelada',
]);

export const protocoloTipo = pgEnum('protocolo_tipo', [
  'georreferenciamento',
  'retificacao',
  'desmembramento',
  'unificacao',
]);

export const protocoloStatus = pgEnum('protocolo_status', [
  'recebido',
  'em_analise',
  'exigencia',
  'aprovado',
  'rejeitado',
]);

export const matriculas = pgTable(
  'matriculas',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    numero: text('numero').notNull(),
    cartorio: text('cartorio'),
    proprietario: text('proprietario').notNull(),
    municipio: text('municipio'),
    uf: text('uf'),
    areaM2: doublePrecision('area_m2'),
    status: matriculaStatus('status').notNull().default('ativa'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    numeroIdx: index('matriculas_numero_idx').on(table.numero),
    statusIdx: index('matriculas_status_idx').on(table.status),
  }),
);

export const protocolos = pgTable(
  'protocolos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    numero: text('numero').notNull(),
    requerente: text('requerente').notNull(),
    tipo: protocoloTipo('tipo').notNull(),
    status: protocoloStatus('status').notNull().default('recebido'),
    matriculaId: uuid('matricula_id').references(() => matriculas.id, {
      onDelete: 'set null',
    }),
    observacao: text('observacao'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    numeroIdx: index('protocolos_numero_idx').on(table.numero),
    statusIdx: index('protocolos_status_idx').on(table.status),
  }),
);

export type MatriculaRow = typeof matriculas.$inferSelect;
export type ProtocoloRow = typeof protocolos.$inferSelect;
