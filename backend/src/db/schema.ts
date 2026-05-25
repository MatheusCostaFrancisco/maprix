import { pgTable, uuid, text, timestamp, index, pgEnum } from 'drizzle-orm/pg-core';

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
