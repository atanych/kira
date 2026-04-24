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
      tags TEXT[] NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ,
      CONSTRAINT tasks_tags_allowed CHECK (tags <@ ARRAY['дача','квартира']::text[])
    )
  `);
  // Ensure constraint exists for already-created tables (idempotent).
  await db.query(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tasks_tags_allowed'
      ) THEN
        ALTER TABLE tasks
          ADD CONSTRAINT tasks_tags_allowed
          CHECK (tags <@ ARRAY['дача','квартира']::text[]);
      END IF;
    END $$;
  `);
  console.log('tasks table created (or already exists)');
  await db.end();
}

migrate().catch(err => {
  console.error(err.message);
  process.exit(1);
});
