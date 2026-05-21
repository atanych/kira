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
      template_id INTEGER,
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
  // Add template_id column to existing tables (idempotent).
  await db.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS template_id INTEGER`);

  // Recurring task templates.
  await db.query(`
    CREATE TABLE IF NOT EXISTS task_templates (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      notes TEXT,
      tags TEXT[] NOT NULL DEFAULT '{}',
      recurrence TEXT,
      lead_time_days INTEGER NOT NULL DEFAULT 3,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      last_spawned_due DATE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT task_templates_tags_allowed CHECK (tags <@ ARRAY['дача','квартира']::text[])
    )
  `);

  // 2026-05-20: split recurrence string into structured columns (type/day/interval).
  await db.query(`ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS recurrence_type TEXT`);
  await db.query(`ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS recurrence_day INT`);
  await db.query(`ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS interval INT NOT NULL DEFAULT 1`);

  // Backfill recurrence_type/day from old recurrence string, if the column still exists.
  const hasOldCol = await db.query(`
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'task_templates' AND column_name = 'recurrence'
  `);
  if (hasOldCol.rowCount > 0) {
    const DOW_MAP = {
      sunday: 0, sun: 0, вс: 0, воскресенье: 0,
      monday: 1, mon: 1, пн: 1, понедельник: 1,
      tuesday: 2, tue: 2, вт: 2, вторник: 2,
      wednesday: 3, wed: 3, ср: 3, среда: 3,
      thursday: 4, thu: 4, чт: 4, четверг: 4,
      friday: 5, fri: 5, пт: 5, пятница: 5,
      saturday: 6, sat: 6, сб: 6, суббота: 6,
    };
    const old = await db.query(`SELECT id, recurrence FROM task_templates WHERE recurrence IS NOT NULL AND recurrence_type IS NULL`);
    for (const row of old.rows) {
      const [type, val] = row.recurrence.split(':');
      let day;
      if (type === 'monthly') day = parseInt(val);
      else if (type === 'weekly') day = DOW_MAP[val.toLowerCase()];
      else { console.error(`skip template #${row.id}: bad recurrence ${row.recurrence}`); continue; }
      await db.query(`UPDATE task_templates SET recurrence_type=$1, recurrence_day=$2 WHERE id=$3`, [type, day, row.id]);
      console.log(`backfilled template #${row.id}: ${row.recurrence} → ${type}/${day}`);
    }
    await db.query(`ALTER TABLE task_templates DROP COLUMN recurrence`);
    console.log('dropped legacy recurrence column');
  }

  console.log('migrations applied');
  await db.end();
}

migrate().catch(err => {
  console.error(err.message);
  process.exit(1);
});
