import { Router } from 'express';
import { pool } from '../db/pool.ts';
import { requireEmail, requireText } from '../http-error.ts';

export const contactRouter = Router();

// POST /api/contact  { name, email, subject, message }  -> stored for the team to answer
contactRouter.post('/', async (req, res) => {
  const name = requireText(req.body?.name, 'Name', 2, 80);
  const email = requireEmail(req.body?.email);
  const subject = requireText(req.body?.subject, 'Subject', 3, 120);
  const message = requireText(req.body?.message, 'Message', 10, 2000);

  await pool.query('INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)', [
    name,
    email,
    subject,
    message,
  ]);
  res.status(201).json({ ok: true });
});
