import bcrypt from 'bcryptjs';
import { Router } from 'express';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { currentUser, requireAuth, signToken, type AuthUser } from '../auth.ts';
import { pool } from '../db/pool.ts';
import { HttpError, requireEmail, requireOneOf, requireText } from '../http-error.ts';

export const authRouter = Router();

function session(user: AuthUser & { email: string }) {
  return { token: signToken(user), user: { id: user.id, name: user.name, email: user.email, role: user.role } };
}

// POST /api/auth/register  { name, email, password, role: 'hiker' | 'guide' }
authRouter.post('/register', async (req, res) => {
  const name = requireText(req.body?.name, 'Name', 2, 80);
  const email = requireEmail(req.body?.email);
  const password = requireText(req.body?.password, 'Password', 8, 72);
  const role = requireOneOf(req.body?.role, 'Account type', ['hiker', 'guide'] as const);

  const [existing] = await pool.query<RowDataPacket[]>('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) throw new HttpError(409, 'An account already exists with this email.');

  const hash = await bcrypt.hash(password, 10);
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [name, email, hash, role],
  );
  res.status(201).json(session({ id: result.insertId, name, email, role }));
});

// POST /api/auth/login  { email, password }
authRouter.post('/login', async (req, res) => {
  const email = requireEmail(req.body?.email);
  const password = requireText(req.body?.password, 'Password', 1, 72);

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, name, email, role, password_hash FROM users WHERE email = ?',
    [email],
  );
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user['password_hash']))) {
    throw new HttpError(401, 'Wrong email or password.');
  }
  res.json(session({ id: user['id'], name: user['name'], email: user['email'], role: user['role'] }));
});

// GET /api/auth/me  -> the logged-in user (checks the token is still valid)
authRouter.get('/me', requireAuth(), async (_req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT id, name, email, role FROM users WHERE id = ?', [
    currentUser(res).id,
  ]);
  if (!rows[0]) throw new HttpError(401, 'This account no longer exists.');
  res.json(rows[0]);
});
