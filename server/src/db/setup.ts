/**
 * npm run db:setup
 * Drops and recreates the jbalna database, creates the tables (schema.sql) and loads demo data.
 * Hike dates are relative to today, so the demo always has upcoming and past hikes.
 */
import bcrypt from 'bcryptjs';
import { readFile } from 'node:fs/promises';
import mysql from 'mysql2/promise';
import type { ResultSetHeader } from 'mysql2';
import { dbConfig } from './pool.ts';

const DEMO_PASSWORD = 'jbalna123';

const guides = [
  {
    key: 'amira',
    name: 'Amira Ben Salah',
    email: 'amira@jbalna.tn',
    region: 'Zaghouan',
    languages: 'Arabic, French, English',
    years: 8,
    verified: true,
    bio: 'Born at the foot of Djebel Zaghouan, I have guided groups on its ridges for eight years. Certified mountain leader and first-aid trained. I love sharing the Roman water temple and the view over the Cap Bon on a clear day.',
  },
  {
    key: 'karim',
    name: 'Karim Trabelsi',
    email: 'karim@jbalna.tn',
    region: 'Siliana',
    languages: 'Arabic, French',
    years: 12,
    verified: true,
    bio: 'Forest ranger for ten years, now a full-time guide in the Siliana mountains. Expect easy-going walks, local bread with olive oil at the top, and a lot of stories about the Bargou and Serj forests.',
  },
  {
    key: 'yosra',
    name: 'Yosra Gharbi',
    email: 'yosra@jbalna.tn',
    region: 'Ben Arous',
    languages: 'Arabic, English',
    years: 5,
    verified: false,
    bio: 'Geography teacher and hiker from Mornag. I take small groups and families on the easy paths around Djebel Ressas, half an hour from Tunis, for a first taste of the mountain.',
  },
];

const hikers = [
  { key: 'sami', name: 'Sami Haddad', email: 'sami@jbalna.tn' },
  { key: 'lina', name: 'Lina Mansour', email: 'lina@jbalna.tn' },
  { key: 'tom', name: 'Tom Becker', email: 'tom@jbalna.tn' },
];

const routes = [
  {
    key: 'zaghouan',
    guide: 'amira',
    title: 'Zaghouan summit loop',
    mountain: 'Djebel Zaghouan',
    region: 'Zaghouan',
    level: 'Medium',
    km: 11,
    elevation: 750,
    hours: 5,
    description:
      'From the Water Temple, a steady climb through pines and rock to the summit ridge (1,295 m), with views over the plains to the Gulf of Tunis. We come back down by the old shepherds’ path.',
  },
  {
    key: 'ressas',
    guide: 'amira',
    title: 'Ressas ridge',
    mountain: 'Djebel Ressas',
    region: 'Ben Arous',
    level: 'Hard',
    km: 12,
    elevation: 650,
    hours: 6,
    description:
      'A rocky, airy ridge walk 30 km from Tunis. Some easy scrambling with hands on the rock, then a long descent past the old lead mines. Good shoes and a head for heights needed.',
  },
  {
    key: 'bargou',
    guide: 'karim',
    title: 'Bargou plateau trail',
    mountain: 'Djebel Bargou',
    region: 'Siliana',
    level: 'Easy',
    km: 7,
    elevation: 300,
    hours: 3,
    description:
      'A gentle walk across the Bargou plateau, between Aleppo pines and wheat fields, ending at a viewpoint over the Siliana valley. Perfect for a first hike or for families.',
  },
  {
    key: 'serj',
    guide: 'karim',
    title: 'Serj forest and spring',
    mountain: 'Djebel Serj',
    region: 'Siliana',
    level: 'Medium',
    km: 9,
    elevation: 500,
    hours: 4,
    description:
      'Into the protected maple and oak forest of Djebel Serj, one of the most unusual woods of Tunisia, up to a cool spring where we have lunch in the shade.',
  },
  {
    key: 'ressas-easy',
    guide: 'yosra',
    title: 'Ressas foothills walk',
    mountain: 'Djebel Ressas',
    region: 'Ben Arous',
    level: 'Easy',
    km: 6,
    elevation: 250,
    hours: 3,
    description:
      'A family walk at the foot of Djebel Ressas, through olive groves and pines, with the rocky ridge above us the whole way. No scrambling, just a good path and a picnic with a view.',
  },
];

// [key, route, days from today, price DT, spots, meeting point]
const hikes: [string, string, number, number, number, string][] = [
  ['z1', 'zaghouan', 2, 45, 12, 'Water Temple car park, Zaghouan, 8:00'],
  ['z2', 'zaghouan', 9, 45, 12, 'Water Temple car park, Zaghouan, 8:00'],
  ['z-past', 'zaghouan', -10, 45, 12, 'Water Temple car park, Zaghouan, 8:00'],
  ['r1', 'ressas', 3, 55, 10, 'Mornag train station, 7:30'],
  ['r2', 'ressas', 17, 55, 10, 'Mornag train station, 7:30'],
  ['b1', 'bargou', 4, 35, 15, 'Bargou village mosque, 9:00'],
  ['b2', 'bargou', 11, 35, 15, 'Bargou village mosque, 9:00'],
  ['s1', 'serj', 6, 40, 12, 'Kesra main square, 8:30'],
  ['s-past', 'serj', -20, 40, 12, 'Kesra main square, 8:30'],
  ['re1', 'ressas-easy', 5, 30, 15, 'Mornag train station, 9:30'],
];

// [key, hike, hiker, spots]
const bookings: [string, string, string, number][] = [
  ['sami-z1', 'z1', 'sami', 2],
  ['sami-b1', 'b1', 'sami', 1],
  ['sami-zpast', 'z-past', 'sami', 2],
  ['lina-r1', 'r1', 'lina', 4],
  ['lina-zpast', 'z-past', 'lina', 1],
  ['lina-spast', 's-past', 'lina', 2],
  ['tom-z1', 'z1', 'tom', 3],
  ['tom-r1', 'r1', 'tom', 4],
  ['tom-spast', 's-past', 'tom', 1],
];

// [booking, rating, comment]
const reviews: [string, number, string][] = [
  ['lina-zpast', 5, 'Amira knows every stone of this mountain. Great pace, great stories, and the view from the top was worth every step.'],
  ['lina-spast', 5, 'Karim made the forest come alive. The lunch at the spring was the best part. Perfect for a relaxed Sunday.'],
  ['tom-spast', 4, 'Beautiful forest and a very kind guide. Explanations were mostly in French, but Karim translated the key points for me.'],
];

async function main() {
  const { database, ...server } = dbConfig;
  if (!/^\w+$/.test(database)) throw new Error(`Invalid DB_NAME: ${database}`);

  const conn = await mysql.createConnection({ ...server, multipleStatements: true });
  console.log(`Connected to MySQL at ${server.host}:${server.port} as ${server.user}.`);

  await conn.query(`DROP DATABASE IF EXISTS \`${database}\``);
  await conn.query(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.query(`USE \`${database}\``);
  await conn.query(await readFile(new URL('./schema.sql', import.meta.url), 'utf8'));
  console.log(`Database "${database}" created with its tables.`);

  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const ids = new Map<string, number>();
  const insert = async (key: string, sql: string, params: unknown[]) => {
    const [result] = await conn.query<ResultSetHeader>(sql, params);
    ids.set(key, result.insertId);
  };
  const id = (key: string) => ids.get(key)!;

  for (const g of guides) {
    await insert(
      g.key,
      `INSERT INTO users (name, email, password_hash, role, bio, region, languages, experience_years, verified)
       VALUES (?, ?, ?, 'guide', ?, ?, ?, ?, ?)`,
      [g.name, g.email, hash, g.bio, g.region, g.languages, g.years, g.verified],
    );
  }
  for (const h of hikers) {
    await insert(h.key, "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'hiker')", [
      h.name,
      h.email,
      hash,
    ]);
  }
  await insert('admin', "INSERT INTO users (name, email, password_hash, role) VALUES ('Jbalna Admin', 'admin@jbalna.tn', ?, 'admin')", [hash]);

  for (const r of routes) {
    await insert(
      r.key,
      `INSERT INTO routes (guide_id, title, mountain, region, description, level, distance_km, elevation_m, duration_hours)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id(r.guide), r.title, r.mountain, r.region, r.description, r.level, r.km, r.elevation, r.hours],
    );
  }
  for (const [key, route, days, price, spots, meeting] of hikes) {
    await insert(
      key,
      'INSERT INTO hikes (route_id, date, price_dt, spots, meeting_point) VALUES (?, DATE_ADD(CURDATE(), INTERVAL ? DAY), ?, ?, ?)',
      [id(route), days, price, spots, meeting],
    );
  }
  for (const [key, hike, hiker, spots] of bookings) {
    await insert(key, 'INSERT INTO bookings (hike_id, hiker_id, spots) VALUES (?, ?, ?)', [id(hike), id(hiker), spots]);
  }
  for (const [booking, rating, comment] of reviews) {
    await insert(
      `review-${booking}`,
      `INSERT INTO reviews (booking_id, hiker_id, guide_id, rating, comment)
       SELECT b.id, b.hiker_id, r.guide_id, ?, ? FROM bookings b
       JOIN hikes h ON h.id = b.hike_id JOIN routes r ON r.id = h.route_id WHERE b.id = ?`,
      [rating, comment, id(booking)],
    );
  }

  await conn.end();
  console.log(`Demo data loaded: ${guides.length} guides, ${hikers.length} hikers, ${routes.length} routes, ${hikes.length} hikes.`);
  console.log(`Demo accounts (password "${DEMO_PASSWORD}"): sami@jbalna.tn (hiker), amira@jbalna.tn (guide).`);
}

main().catch((error) => {
  console.error('Database setup failed:', error.message);
  process.exit(1);
});
