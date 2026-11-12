import { Router } from 'express';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { currentUser, requireAuth } from '../auth.ts';
import { pool } from '../db/pool.ts';
import { requireNumber, requireOneOf, requireText } from '../http-error.ts';

/** Trails ("routes" in the data model) created by guides. */
export const routesRouter = Router();

const ROUTE_SELECT = `
  SELECT r.id, r.title, r.mountain, r.region, r.description, r.level,
         r.distance_km AS distanceKm, r.elevation_m AS elevationM, r.duration_hours AS durationHours,
         (SELECT COUNT(*) FROM hikes h WHERE h.route_id = r.id AND h.status = 'open' AND h.date >= CURDATE())
           AS upcomingHikes
  FROM routes r
`;

// GET /api/routes/mine  (guide)
routesRouter.get('/mine', requireAuth('guide'), async (_req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(`${ROUTE_SELECT} WHERE r.guide_id = ? ORDER BY r.title`, [
    currentUser(res).id,
  ]);
  res.json(rows);
});

// POST /api/routes  (guide)  { title, mountain, region, description, level, distanceKm, elevationM, durationHours }
routesRouter.post('/', requireAuth('guide'), async (req, res) => {
  const body = req.body ?? {};
  const route = {
    title: requireText(body.title, 'Title', 3, 120),
    mountain: requireText(body.mountain, 'Mountain', 3, 80),
    region: requireText(body.region, 'Region', 2, 80),
    description: requireText(body.description, 'Description', 20, 2000),
    level: requireOneOf(body.level, 'Level', ['Easy', 'Medium', 'Hard'] as const),
    distanceKm: requireNumber(body.distanceKm, 'Distance', 0.5, 100),
    elevationM: Math.round(requireNumber(body.elevationM, 'Elevation gain', 0, 5000)),
    durationHours: requireNumber(body.durationHours, 'Duration', 0.5, 24),
  };

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO routes (guide_id, title, mountain, region, description, level, distance_km, elevation_m, duration_hours)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      currentUser(res).id,
      route.title,
      route.mountain,
      route.region,
      route.description,
      route.level,
      route.distanceKm,
      route.elevationM,
      route.durationHours,
    ],
  );
  const [rows] = await pool.query<RowDataPacket[]>(`${ROUTE_SELECT} WHERE r.id = ?`, [result.insertId]);
  res.status(201).json(rows[0]);
});
