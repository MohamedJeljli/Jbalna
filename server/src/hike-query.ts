import type { RowDataPacket } from 'mysql2';

/**
 * The SELECT shared by every endpoint that lists hikes: one dated hike with its route,
 * its guide (with average rating) and the number of spots already booked.
 * Add WHERE / ORDER BY after it.
 */
export const HIKE_SELECT = `
  SELECT h.id, h.date, h.price_dt AS priceDt, h.spots, h.meeting_point AS meetingPoint, h.status,
         h.date < CURDATE() AS isPast,
         r.id AS routeId, r.title, r.mountain, r.region, r.level, r.description,
         r.distance_km AS distanceKm, r.elevation_m AS elevationM, r.duration_hours AS durationHours,
         g.id AS guideId, g.name AS guideName, g.verified AS guideVerified,
         COALESCE((SELECT SUM(b.spots) FROM bookings b
                   WHERE b.hike_id = h.id AND b.status = 'confirmed'), 0) AS booked,
         (SELECT ROUND(AVG(rv.rating), 1) FROM reviews rv WHERE rv.guide_id = g.id) AS guideRating,
         (SELECT COUNT(*) FROM reviews rv WHERE rv.guide_id = g.id) AS guideReviewCount
  FROM hikes h
  JOIN routes r ON r.id = h.route_id
  JOIN users g ON g.id = r.guide_id
`;

/** Shapes a row from HIKE_SELECT into the JSON sent to the front-end. */
export function toHike(row: RowDataPacket) {
  const booked = Number(row['booked']);
  return {
    id: row['id'] as number,
    date: row['date'] as string,
    priceDt: row['priceDt'] as number,
    spots: row['spots'] as number,
    booked,
    spotsLeft: Math.max(0, row['spots'] - booked),
    meetingPoint: row['meetingPoint'] as string,
    status: row['status'] as 'open' | 'cancelled',
    isPast: Boolean(row['isPast']),
    route: {
      id: row['routeId'] as number,
      title: row['title'] as string,
      mountain: row['mountain'] as string,
      region: row['region'] as string,
      level: row['level'] as 'Easy' | 'Medium' | 'Hard',
      description: row['description'] as string,
      distanceKm: row['distanceKm'] as number,
      elevationM: row['elevationM'] as number,
      durationHours: row['durationHours'] as number,
    },
    guide: {
      id: row['guideId'] as number,
      name: row['guideName'] as string,
      verified: Boolean(row['guideVerified']),
      rating: row['guideRating'] === null ? null : Number(row['guideRating']),
      reviewCount: Number(row['guideReviewCount']),
    },
  };
}
