import { Router } from 'express';
import type { RowDataPacket } from 'mysql2';
import { currentUser, requireAuth } from '../auth.ts';
import { pool } from '../db/pool.ts';
import { HIKE_SELECT, toHike } from '../hike-query.ts';
import { HttpError, requireId } from '../http-error.ts';

export const guidesRouter = Router();

const GUIDE_SELECT = `
  SELECT g.id, g.name, g.bio, g.region, g.languages, g.experience_years AS experienceYears, g.verified,
         (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE guide_id = g.id) AS rating,
         (SELECT COUNT(*) FROM reviews WHERE guide_id = g.id) AS reviewCount,
         (SELECT COUNT(*) FROM hikes h JOIN routes r ON r.id = h.route_id
          WHERE r.guide_id = g.id AND h.status = 'open' AND h.date >= CURDATE()) AS upcomingHikes
  FROM users g
  WHERE g.role = 'guide'
`;

function toGuide(row: RowDataPacket) {
  return {
    id: row['id'] as number,
    name: row['name'] as string,
    bio: (row['bio'] as string | null) ?? '',
    region: (row['region'] as string | null) ?? '',
    languages: ((row['languages'] as string | null) ?? '')
      .split(',')
      .map((language) => language.trim())
      .filter(Boolean),
    experienceYears: (row['experienceYears'] as number | null) ?? 0,
    verified: Boolean(row['verified']),
    rating: row['rating'] === null ? null : Number(row['rating']),
    reviewCount: Number(row['reviewCount']),
    upcomingHikes: Number(row['upcomingHikes']),
  };
}

async function latestReviews(guideId: number, limit: number) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT rv.id, rv.rating, rv.comment, DATE_FORMAT(rv.created_at, '%Y-%m-%d') AS createdAt, u.name AS hikerName, r.title AS routeTitle
     FROM reviews rv
     JOIN users u ON u.id = rv.hiker_id
     JOIN bookings b ON b.id = rv.booking_id
     JOIN hikes h ON h.id = b.hike_id
     JOIN routes r ON r.id = h.route_id
     WHERE rv.guide_id = ? ORDER BY rv.created_at DESC, rv.id DESC LIMIT ?`,
    [guideId, limit],
  );
  return rows;
}

// GET /api/guides  -> every guide, verified first, best rated first
guidesRouter.get('/', async (_req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `${GUIDE_SELECT} ORDER BY g.verified DESC, rating IS NULL, rating DESC, g.name`,
  );
  res.json(rows.map(toGuide));
});

// GET /api/guides/me/dashboard  (guide)  -> key figures, upcoming hikes, latest reviews
// Declared before /:id so that "me" is not read as an id.
guidesRouter.get('/me/dashboard', requireAuth('guide'), async (_req, res) => {
  const guideId = currentUser(res).id;
  const [profile] = await pool.query<RowDataPacket[]>(`${GUIDE_SELECT} AND g.id = ?`, [guideId]);
  if (!profile[0]) throw new HttpError(404, 'Guide not found.');

  const [upcoming] = await pool.query<RowDataPacket[]>(
    `${HIKE_SELECT} WHERE g.id = ? AND h.status = 'open' AND h.date >= CURDATE() ORDER BY h.date`,
    [guideId],
  );
  const hikes = upcoming.map(toHike);

  res.json({
    guide: toGuide(profile[0]),
    stats: {
      upcomingHikes: hikes.length,
      bookedSpots: hikes.reduce((sum, hike) => sum + hike.booked, 0),
      rating: profile[0]['rating'] === null ? null : Number(profile[0]['rating']),
    },
    upcoming: hikes,
    reviews: await latestReviews(guideId, 4),
  });
});

// GET /api/guides/:id  -> public profile: bio, upcoming hikes, reviews
guidesRouter.get('/:id', async (req, res) => {
  const id = requireId(req.params.id);
  const [rows] = await pool.query<RowDataPacket[]>(`${GUIDE_SELECT} AND g.id = ?`, [id]);
  if (!rows[0]) throw new HttpError(404, 'This guide does not exist.');

  const [hikes] = await pool.query<RowDataPacket[]>(
    `${HIKE_SELECT} WHERE g.id = ? AND h.status = 'open' AND h.date >= CURDATE() ORDER BY h.date`,
    [id],
  );
  res.json({ ...toGuide(rows[0]), hikes: hikes.map(toHike), reviews: await latestReviews(id, 20) });
});
