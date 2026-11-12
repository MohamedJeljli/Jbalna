import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { authRouter } from './api/auth.ts';
import { bookingsRouter } from './api/bookings.ts';
import { contactRouter } from './api/contact.ts';
import { guidesRouter } from './api/guides.ts';
import { hikesRouter } from './api/hikes.ts';
import { routesRouter } from './api/routes.ts';
import { pool } from './db/pool.ts';
import { HttpError } from './http-error.ts';

const app = express();
app.use(cors());
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ ok: true });
});
app.use('/api/auth', authRouter);
app.use('/api/hikes', hikesRouter);
app.use('/api/routes', routesRouter);
app.use('/api/guides', guidesRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/contact', contactRouter);
app.use('/api', (_req, _res) => {
  throw new HttpError(404, 'Unknown API endpoint.');
});

// After "npm run build" in the Angular project, the API also serves the built site,
// so the whole app runs from one address (http://localhost:3000).
const site = fileURLToPath(new URL('../../dist/jbalna/browser', import.meta.url));
if (existsSync(site)) {
  app.use(express.static(site));
  app.get('/{*path}', (_req, res) => res.sendFile('index.html', { root: site }));
}

// Express 5 forwards errors thrown in async handlers here.
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ message: error.message });
    return;
  }
  if (error instanceof SyntaxError) {
    res.status(400).json({ message: 'The request body is not valid JSON.' });
    return;
  }
  const code = (error as { code?: string }).code;
  if (code === 'ECONNREFUSED' || code === 'ER_ACCESS_DENIED_ERROR' || code === 'ER_BAD_DB_ERROR') {
    console.error(`Database unavailable (${code}). Check server/.env and run "npm run db:setup".`);
    res.status(503).json({ message: 'The database is not available right now.' });
    return;
  }
  console.error(error);
  res.status(500).json({ message: 'Something went wrong on our side. Please try again.' });
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`Jbalna API listening on http://localhost:${port}`);
});
