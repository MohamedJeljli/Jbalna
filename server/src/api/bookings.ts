import { Router } from 'express';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { currentUser, requireAuth } from '../auth.ts';
import { pool } from '../db/pool.ts';
import { HttpError, requireId, requireNumber, requireText } from '../http-error.ts';

export const bookingsRouter = Router();
bookingsRouter.use(requireAuth('hiker'));

// POST /api/bookings  { hikeId, spots }
// Runs in a transaction that locks the hike row, so two hikers can never book the same last spot.
bookingsRouter.post('/', async (req, res) => {
  const hikerId = currentUser(res).id;
  const hikeId = requireId(req.body?.hikeId);
  const spots = Math.floor(requireNumber(req.body?.spots, 'Spots', 1, 10));

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [hikes] = await conn.query<RowDataPacket[]>(
      "SELECT spots, status, date < CURDATE() AS isPast FROM hikes WHERE id = ? FOR UPDATE",
      [hikeId],
    );
    const hike = hikes[0];
    if (!hike) throw new HttpError(404, 'This hike does not exist.');
    if (hike['status'] !== 'open' || hike['isPast']) throw new HttpError(409, 'This hike is no longer open for booking.');

    const [mine] = await conn.query<RowDataPacket[]>(
      "SELECT id FROM bookings WHERE hike_id = ? AND hiker_id = ? AND status = 'confirmed'",
      [hikeId, hikerId],
    );
    if (mine[0]) throw new HttpError(409, 'You already have a booking on this hike. See My bookings.');

    const [[taken]] = await conn.query<RowDataPacket[]>(
      "SELECT COALESCE(SUM(spots), 0) AS booked FROM bookings WHERE hike_id = ? AND status = 'confirmed'",
      [hikeId],
    );
    const left = hike['spots'] - Number(taken!['booked']);
    if (spots > left) {
      throw new HttpError(409, left === 0 ? 'This hike is full.' : `Only ${left} spot${left > 1 ? 's' : ''} left.`);
    }

    const [result] = await conn.query<ResultSetHeader>(
      'INSERT INTO bookings (hike_id, hiker_id, spots) VALUES (?, ?, ?)',
      [hikeId, hikerId, spots],
    );
    await conn.commit();
    res.status(201).json({ id: result.insertId, hikeId, spots, status: 'confirmed' });
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
});

// GET /api/bookings/mine  -> the hiker's bookings, newest hike first, with review status
bookingsRouter.get('/mine', async (_req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT b.id, b.spots, b.status, b.created_at AS bookedAt,
            h.id AS hikeId, h.date, h.price_dt AS priceDt, h.meeting_point AS meetingPoint,
            h.date < CURDATE() AS isPast,
            r.title, r.mountain, r.level, r.duration_hours AS durationHours,
            g.id AS guideId, g.name AS guideName,
            rv.rating AS reviewRating
     FROM bookings b
     JOIN hikes h ON h.id = b.hike_id
     JOIN routes r ON r.id = h.route_id
     JOIN users g ON g.id = r.guide_id
     LEFT JOIN reviews rv ON rv.booking_id = b.id
     WHERE b.hiker_id = ?
     ORDER BY h.date DESC, b.id DESC`,
    [currentUser(res).id],
  );
  res.json(rows.map((row) => ({ ...row, isPast: Boolean(row['isPast']) })));
});

// PATCH /api/bookings/:id/cancel  -> only before the hike
bookingsRouter.patch('/:id/cancel', async (req, res) => {
  const id = requireId(req.params.id);
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE bookings b JOIN hikes h ON h.id = b.hike_id
     SET b.status = 'cancelled'
     WHERE b.id = ? AND b.hiker_id = ? AND b.status = 'confirmed' AND h.date >= CURDATE()`,
    [id, currentUser(res).id],
  );
  if (result.affectedRows === 0) throw new HttpError(409, 'This booking cannot be cancelled.');
  res.json({ id, status: 'cancelled' });
});

// POST /api/bookings/:id/review  { rating, comment }  -> only after the hike, once per booking
bookingsRouter.post('/:id/review', async (req, res) => {
  const hikerId = currentUser(res).id;
  const bookingId = requireId(req.params.id);
  const rating = Math.round(requireNumber(req.body?.rating, 'Rating', 1, 5));
  const comment = requireText(req.body?.comment, 'Comment', 5, 1000);

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT r.guide_id AS guideId, h.date < CURDATE() AS isPast, b.status,
            (SELECT id FROM reviews WHERE booking_id = b.id) AS reviewId
     FROM bookings b JOIN hikes h ON h.id = b.hike_id JOIN routes r ON r.id = h.route_id
     WHERE b.id = ? AND b.hiker_id = ?`,
    [bookingId, hikerId],
  );
  const booking = rows[0];
  if (!booking) throw new HttpError(404, 'Booking not found.');
  if (booking['status'] !== 'confirmed' || !booking['isPast']) {
    throw new HttpError(409, 'You can review a hike once you have done it.');
  }
  if (booking['reviewId']) throw new HttpError(409, 'You have already reviewed this hike.');

  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO reviews (booking_id, hiker_id, guide_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
    [bookingId, hikerId, booking['guideId'], rating, comment],
  );
  res.status(201).json({ id: result.insertId, rating, comment });
});
