import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { HttpError } from './http-error.ts';

export type Role = 'hiker' | 'guide' | 'admin';

export interface AuthUser {
  id: number;
  name: string;
  role: Role;
}

const SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';
if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET is not set: using a development secret. Set it in server/.env.');
}

export function signToken(user: AuthUser): string {
  return jwt.sign({ name: user.name, role: user.role }, SECRET, {
    subject: String(user.id),
    expiresIn: '7d',
  });
}

/** Checks the Bearer token and stores the user in res.locals.user. Optionally limits the route to some roles. */
export function requireAuth(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) throw new HttpError(401, 'Please log in first.');

    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(token, SECRET) as jwt.JwtPayload;
    } catch {
      throw new HttpError(401, 'Your session has expired. Please log in again.');
    }

    const user: AuthUser = { id: Number(payload.sub), name: payload['name'], role: payload['role'] };
    if (roles.length > 0 && !roles.includes(user.role)) {
      throw new HttpError(403, `This action is for ${roles.join(' or ')} accounts.`);
    }
    res.locals['user'] = user;
    next();
  };
}

export function currentUser(res: Response): AuthUser {
  return res.locals['user'] as AuthUser;
}
