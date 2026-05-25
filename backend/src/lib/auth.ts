import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Role } from '@maprix/types';

const TOKEN_TTL = '7d';

export const COOKIE = 'maprix_token';

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET não definida');
  }
  return secret;
}

const SECRET = getSecret();

export interface TokenPayload {
  sub: string;
  role: Role;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: TOKEN_TTL });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function cookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 7, // express: maxAge em milissegundos
  };
}
