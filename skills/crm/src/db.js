/**
 * CRM database connection — reuses the same Railway Postgres as KB.
 */

import pg from 'pg';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env
function loadEnv() {
  const paths = [
    resolve(__dirname, '../../../.env'),
    resolve(__dirname, '../../.env'),
  ];
  for (const p of paths) {
    try {
      const content = readFileSync(p, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) process.env[key] = val;
      }
    } catch {}
  }
}

loadEnv();

const connString = (process.env.CRM_DATABASE_URL || '').replace(/[?&]sslmode=[^&]*/g, '');
if (!connString) throw new Error('CRM_DATABASE_URL not found in .env');

const needsSsl = connString.includes('supabase.com');

const pool = new pg.Pool({
  connectionString: connString,
  ssl: needsSsl ? { rejectUnauthorized: false } : false,
  max: 5,
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
