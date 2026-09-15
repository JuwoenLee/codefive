import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be set in production.');
}

const secret = jwtSecret ?? 'local-development-secret-change-me';

export type AuthUser = { id: string; email: string; username: string; coding_level?: 'beginner' | 'intermediate' | 'advanced' };

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export function passwordMatches(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function createToken(user: AuthUser) {
  return jwt.sign(user, secret, { expiresIn: '7d' });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.header('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ message: '로그인이 필요합니다.' });
  try {
    res.locals.user = jwt.verify(token, secret) as AuthUser;
    next();
  } catch {
    res.status(401).json({ message: '로그인 세션이 만료되었습니다. 다시 로그인해 주세요.' });
  }
}
