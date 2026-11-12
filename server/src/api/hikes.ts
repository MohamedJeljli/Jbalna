import { Router } from 'express';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { currentUser, requireAuth } from '../auth.ts';
import { pool } from '../db/pool.ts';
import { HIKE_SELECT, toHike } from '../hike-query.ts';
import { HttpError, requireDate, requireId, requireNumber, requireText } from '../http-error.ts';

export const hikesRouter = Router();

const SORTS: Record<string, string> = {
  date: 'h.date ASC, h.id ASC',
  price: 'h.price_dt ASC, h.date ASC',
  rating: 'guideRating IS NULL, guideRating DESC, h.date ASC',
  popular: 'booked DESC, h.date ASC',
};

// GET /api/hikes?q=&mountain=&level=&date=&maxPrice=&sort=date|price|rating|popular&limit=
// Upcoming open hikes, filtered and sorted.
hikesRouter.get('/', async (req, res) => {
  const where = ["h.status = 'open'", 'h.date >= CURDATE()'];
  const params: unknown[] = [];
  const { q, mountain, level, date, maxPrice, sort, limit } = req.query;

  if (typeof q === 'string' && q.trim()) {
    where.push('(r.title LIKE ? OR r.mountain LIKE ? OR r.region LIKE ?)');
    const like = `%${q.trim()}%`;
    params.push(like, like, like);
  }
  if (typeof mountain === 'string' && mountain) {
    where.push('r.mountain = ?');
    params.push(mountain);
  }
  if (typeof level === 'string' && level) {
    where.push('r.level = ?');
    params.push(level);
  }
  if (typeof date === 'string' && date) {
    where.push('h.date = ?');
    params.push(requireDate(date, 'Date'));
  }
  if (typeof maxPrice === 'string' && maxPrice) {
    where.push('h.price_dt <= ?');
    params.push(requireNumber(maxPrice, 'Max price', 0, 10000));
  }

  const order = SORTS[typeof sort === 'string' ? sort : 'date'] ?? SORTS['date'];
  const max = typeof limit === 'string' ? requireNumber(limit, 'Limit', 1, 100) : 100;

  const [rows] = await pool.query<RowDataPacket[]>(
    `${HIKE_SELECT} WHERE ${where.join(' AND ')} ORDER BY ${order} LIMIT ${Math.floor(max)}`,
    params,
  );
  res.json(rows.map(toHike));
});

// GET /api/hikes/mountains  -> mountains that have routes (for the search filters)
hikesRouter.get('/mountains', async (_req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT DISTINCT mountain FROM routes ORDER BY mountain');
  res.json(rows.map((row) => row['mountain']));
});

// GET /api/hikes/:id  -> one hike, its guide's bio, and the other upcoming dates of the same route
hikesRouter.get('/:id', async (req, res) => {
  const id = requireId(req.params.id);
  const [rows] = await pool.query<RowDataPacket[]>(`${HIKE_SELECT} WHERE h.id = ?`, [id]);
  if (!rows[0]) throw new HttpError(404, 'This hike does not exist.');
  const hike = toHike(rows[0]);

  const [dates] = await pool.query<RowDataPacket[]>(
    `${HIKE_SELECT} WHERE r.id = ? AND h.status = 'open' AND h.date >= CURDATE() ORDER BY h.date`,
    [hike.route.id],
  );
  const [guide] = await pool.query<RowDataPacket[]>(
    'SELECT bio, languages, experience_years AS experienceYears FROM users WHERE id = ?',
    [hike.guide.id],
  );

  res.json({
    ...hike,
    guide: { ...hike.guide, ...guide[0] },
    dates: dates.map(toHike).map((d) => ({ id: d.id, date: d.date, priceDt: d.priceDt, spotsLeft: d.spotsLeft })),
  });
});

// POST /api/hikes  (guide)  { routeId, date, priceDt, spots, meetingPoint }  -> publishes a dated hike
hikesRouter.post('/', requireAuth('guide'), async (req, res) => {
  const guide = currentUser(res);
  const routeId = requireId(req.body?.routeId);
  const date = requireDate(req.body?.date, 'Date');
  const priceDt = requireNumber(req.body?.priceDt, 'Price', 1, 1000);
  const spots = requireNumber(req.body?.spots, 'Spots', 1, 30);
  const meetingPoint = requireText(req.body?.meetingPoint, 'Meeting point', 3, 160);

  const [[check]] = await pool.query<RowDataPacket[]>('SELECT ? < CURDATE() AS past', [date]);
  if (check?.['past']) throw new HttpError(400, 'The date must be today or later.');
  const [route] = await pool.query<RowDataPacket[]>('SELECT id FROM routes WHERE id = ? AND guide_id = ?', [
    routeId,
    guide.id,
  ]);
  if (!route[0]) throw new HttpError(404, 'Route not found in your routes.');

  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO hikes (route_id, date, price_dt, spots, meeting_point) VALUES (?, ?, ?, ?, ?)',
    [routeId, date, priceDt, Math.floor(spots), meetingPoint],
  );
  const [rows] = await pool.query<RowDataPacket[]>(`${HIKE_SELECT} WHERE h.id = ?`, [result.insertId]);
  res.status(201).json(toHike(rows[0]!));
});

// GET /api/hikes/:id/participants  (guide who owns the hike)
hikesRouter.get('/:id/participants', requireAuth('guide'), async (req, res) => {
  const id = requireId(req.params.id);
  const [owner] = await pool.query<RowDataPacket[]>(
    'SELECT h.id FROM hikes h JOIN routes r ON r.id = h.route_id WHERE h.id = ? AND r.guide_id = ?',
    [id, currentUser(res).id],
  );
  if (!owner[0]) throw new HttpError(404, 'Hike not found in your hikes.');

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT b.id, u.name, u.email, b.spots, b.created_at AS bookedAt
     FROM bookings b JOIN users u ON u.id = b.hiker_id
     WHERE b.hike_id = ? AND b.status = 'confirmed' ORDER BY b.created_at`,
    [id],
  );
  res.json(rows);
});
