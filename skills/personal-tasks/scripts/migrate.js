#!/usr/bin/env node

/**
 * Create the tasks table for personal tasks.
 */

import db from '../../crm/src/db.js';

async function migrate() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      due_date DATE,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ
    )
  `);
  console.log('tasks table created (or already exists)');
  await db.end();
}

migrate().catch(err => {
  console.error(err.message);
  process.exit(1);
});
