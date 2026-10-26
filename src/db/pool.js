import pg from 'pg';
const { Pool } = pg;
let pool;

export function databaseEnabled() {
  return Boolean(process.env.DATABASE_URL);
}

export function getPool() {
  if (!databaseEnabled()) throw new Error('DATABASE_URL is not configured');
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    });
  }
  return pool;
}
