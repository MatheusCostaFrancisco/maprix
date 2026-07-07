import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@maprix/types';
import { COOKIE, verifyToken, type TokenPayload } from './auth.js';

export interface AuthedRequest extends Request {
  auth?: TokenPayload;
}

/** Exige um token válido; anexa o payload em `req.auth`. */
export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE];
  const decoded = token ? verifyToken(token) : null;
  if (!decoded?.sub) return res.status(401).json({ error: 'unauthorized' });
  req.auth = decoded;
  return next();
}

/** Exige que o usuário autenticado tenha um dos roles informados. */
export function requireRole(...roles: Role[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.auth) return res.status(401).json({ error: 'unauthorized' });
    if (!roles.includes(req.auth.role)) return res.status(403).json({ error: 'forbidden' });
    return next();
  };
}
