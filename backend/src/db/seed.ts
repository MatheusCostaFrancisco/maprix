import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db, pool } from './client.js';
import { users } from './schema.js';
import { hashPassword } from '../lib/auth.js';

async function seed() {
  const rawEmail = process.env.SEED_CARTORIO_EMAIL;
  const password = process.env.SEED_CARTORIO_PASSWORD;
  const name = process.env.SEED_CARTORIO_NAME ?? 'Cartório';

  if (!rawEmail || !password) {
    console.log('[seed] SEED_CARTORIO_EMAIL/PASSWORD não definidos — pulando.');
    return;
  }
  const email = rawEmail.toLowerCase().trim();

  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) {
    console.log(`[seed] conta de cartório já existe: ${email}`);
    return;
  }

  const passwordHash = await hashPassword(password);
  await db.insert(users).values({ email, passwordHash, name, role: 'cartorio' });
  console.log(`[seed] conta de cartório criada: ${email}`);
}

seed()
  .then(() => pool.end())
  .catch((err) => {
    console.error('[seed] erro:', err);
    void pool.end();
    process.exit(1);
  });
