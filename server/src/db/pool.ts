import mysql from 'mysql2/promise';

export const dbConfig = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'jbalna',
};

export const pool = mysql.createPool({
  ...dbConfig,
  connectionLimit: 10,
  dateStrings: true, // DATE columns come back as 'YYYY-MM-DD', with no timezone shift
  decimalNumbers: true, // DECIMAL columns come back as numbers
});
