import pg from 'pg';
import { config } from './env.js';

if (!config.DATABASE_URL) {
  throw new Error('No database connection found. Set CRM_DATABASE_URL or KB_DATABASE_URL in .env');
}

// Strip sslmode from connection string — we handle SSL manually
const connString = config.DATABASE_URL.replace(/[?&]sslmode=[^&]*/g, '');
const needsSsl = connString.includes('supabase.com') || config.DATABASE_URL.includes('sslmode=require');

const pool = new pg.Pool({
  connectionString: connString,
  ssl: needsSsl ? { rejectUnauthorized: false } : false,
  max: 5,
});

// KB tables live in the eli schema
pool.on('connect', (client) => {
  client.query('SET search_path TO eli, extensions, public').catch(() => {});
});

export async function query(text, params) {
  return pool.query(text, params);
}

export async function getClient() {
  return pool.connect();
}

export async function end() {
  await pool.end();
}

export { pool };
export default { query, getClient, end, pool };
