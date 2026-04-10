#!/usr/bin/env node

/**
 * Run database migration for knowledge base.
 * Safe to re-run — all CREATE IF NOT EXISTS.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import db from '../src/db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = resolve(__dirname, '../schema/001_create.sql');

async function migrate() {
  console.log('Running knowledge base migration...');

  const sql = readFileSync(schemaPath, 'utf8');

  try {
    await db.query(sql);

    const items = await db.query(`
      SELECT count(*) FROM information_schema.tables
      WHERE table_name = 'knowledge_items'
    `);
    const chunks = await db.query(`
      SELECT count(*) FROM information_schema.tables
      WHERE table_name = 'knowledge_chunks'
    `);

    console.log(`knowledge_items table: ${items.rows[0].count > 0 ? 'exists' : 'MISSING'}`);
    console.log(`knowledge_chunks table: ${chunks.rows[0].count > 0 ? 'exists' : 'MISSING'}`);

    const funcs = await db.query(`
      SELECT routine_name FROM information_schema.routines
      WHERE routine_name IN ('search_knowledge', 'search_knowledge_chunks')
      ORDER BY routine_name
    `);
    console.log(`Search functions: ${funcs.rows.map(r => r.routine_name).join(', ')}`);

    const ext = await db.query(`SELECT extversion FROM pg_extension WHERE extname = 'vector'`);
    if (ext.rows.length > 0) console.log(`pgvector: v${ext.rows[0].extversion}`);

    // Count existing data
    try {
      const itemCount = await db.query('SELECT count(*) FROM knowledge_items');
      const chunkCount = await db.query('SELECT count(*) FROM knowledge_chunks');
      console.log(`\nExisting data: ${itemCount.rows[0].count} items, ${chunkCount.rows[0].count} chunks`);
    } catch {}

    console.log('\nMigration complete.');
  } catch (err) {
    console.error(`Migration failed: ${err.message}`);
    process.exit(1);
  } finally {
    await db.end();
  }
}

migrate();
