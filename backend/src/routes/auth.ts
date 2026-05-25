import { Router } from 'express';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import type { User } from '@maprix/types';
import { db } from '../db/client.js';
import { users, type UserRow } from '../db/schema.js';
import {
  COOKIE,
  cookieOptions,
  hashPassword,
  signToken,
  verifyPassword,
  verifyToken,
} from '../lib/auth.js';

const router = Router();

const signupSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8).max(200),
  name: z.string().min(1).max(120).optional(),
});

const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8).max(200),
});

function publicUser(u: UserRow): User {
  return { id: u.id, email: u.email, name: u.name, role: u.role };
}

router.post('/signup', async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_input', issues: parsed.error.issues });
  }
  const { email, password, name } = parsed.data;

  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) {
    return res.status(409).json({ error: 'email_already_used' });
  }

  const passwordHash = await hashPassword(password);
  // Signup público sempre cria engenheiro; cartório é seed/convite.
  const [created] = await db
    .insert(users)
    .values({ email, passwordHash, name: name ?? null, role: 'engenheiro' })
    .returning();

  res.cookie(COOKIE, signToken({ sub: created.id, role: 'engenheiro' }), cookieOptions());
  return res.json({ user: publicUser(created) });
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_input' });
  }
  const { email, password } = parsed.data;

  const [u] = await db.select().from(users).where(eq(users.email, email));
  if (!u) return res.status(401).json({ error: 'invalid_credentials' });

  const ok = await verifyPassword(password, u.passwordHash);
  if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

  res.cookie(COOKIE, signToken({ sub: u.id, role: u.role }), cookieOptions());
  return res.json({ user: publicUser(u) });
});

router.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE, { path: '/' });
  return res.json({ ok: true });
});

router.get('/me', async (req, res) => {
  const token = req.cookies?.[COOKIE];
  if (!token) return res.status(401).json({ user: null });
  const decoded = verifyToken(token);
  if (!decoded?.sub) return res.status(401).json({ user: null });
  const [u] = await db.select().from(users).where(eq(users.id, decoded.sub));
  if (!u) return res.status(401).json({ user: null });
  return res.json({ user: publicUser(u) });
});

export default router;
