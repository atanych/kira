#!/usr/bin/env node

/**
 * Personal tasks manager.
 *
 * Usage:
 *   node tasks.js add "Title" [--due YYYY-MM-DD] [--notes "..."] [--tag ...]
 *   node tasks.js list [--all|--today]
 *   node tasks.js done 1,3
 *   node tasks.js remove 2
 *   node tasks.js edit 1 [--title "New"] [--due YYYY-MM-DD] [--notes "..."] [--tag ...]
 *
 *   node tasks.js recur add "Title" --every monthly:20 [--lead 3] [--notes ...] [--tag ...]
 *   node tasks.js recur add "Title" --every weekly:friday [--lead 0] [--tag ...]
 *   node tasks.js recur list
 *   node tasks.js recur on <id>
 *   node tasks.js recur off <id>
 *   node tasks.js recur rm <id>
 *   node tasks.js spawn   # spawn pending recurring tasks for today (cron-driven)
 */

import db from '../../crm/src/db.js';
import path from 'node:path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const args = process.argv.slice(2);
const command = args[0];

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function getFlag(name) {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1 || idx + 1 >= args.length) return null;
  return args[idx + 1];
}

function hasFlag(name) {
  return args.includes(`--${name}`);
}

function normalizeTag(tag) {
  if (!tag) return null;
  const t = tag.toLowerCase().trim();
  if (['кв', 'квартира', 'apt', 'apartment'].includes(t)) return 'квартира';
  if (['дача', 'dacha', 'cottage'].includes(t)) return 'дача';
  if (['ai', 'ии', 'aiwork'].includes(t)) return 'ai';
  if (['volatclaw', 'volat', 'platform', 'vc'].includes(t)) return 'volatclaw';
  throw new Error(`Неизвестный tag: ${tag}. Варианты: дача, квартира, ai, volatclaw`);
}

function parseTagsFlag() {
  // Accepts --tag дача,квартира and/or repeated --tag flags.
  const raw = [];
  args.forEach((a, i) => {
    if (a === '--tag' && i + 1 < args.length) raw.push(args[i + 1]);
  });
  const flat = raw.flatMap(s => s.split(',')).map(s => s.trim()).filter(Boolean);
  if (flat.length === 0) return null; // null = flag not provided (no change semantics for edit)
  const normalized = [...new Set(flat.map(normalizeTag).filter(Boolean))];
  return normalized;
}

async function add() {
  const title = args[1];
  if (!title) {
    console.error('Нужен текст задачи: node tasks.js add "Текст"');
    process.exit(1);
  }
  const due = getFlag('due');
  const notes = getFlag('notes');
  const tags = parseTagsFlag() || [];

  const res = await db.query(
    `INSERT INTO tasks (title, due_date, notes, tags) VALUES ($1, $2::date, $3, $4) RETURNING id`,
    [title, due || null, notes || null, tags]
  );
  const tagStr = tags.length ? ` [${tags.join(', ')}]` : '';
  console.log(`Задача #${res.rows[0].id} добавлена${tagStr}: ${title}${due ? ` (до ${due})` : ''}`);
}

const TAG_ORDER_SQL = `CASE WHEN 'квартира' = ANY(tags) THEN 1 WHEN 'дача' = ANY(tags) THEN 2 WHEN 'ai' = ANY(tags) THEN 3 WHEN 'volatclaw' = ANY(tags) THEN 4 ELSE 5 END`;
const TAG_HEADERS = { 'квартира': '🏠 Квартира', 'дача': '🌲 Дача', 'ai': '🤖 AI', 'volatclaw': '⚙️ Volatclaw', 'other': '📍 Прочее' };

function primaryGroup(tags) {
  if (!tags || tags.length === 0) return 'other';
  if (tags.includes('квартира')) return 'квартира';
  if (tags.includes('дача')) return 'дача';
  if (tags.includes('ai')) return 'ai';
  if (tags.includes('volatclaw')) return 'volatclaw';
  return 'other';
}

async function list() {
  // Delegate rendering to render.mjs — produces PNG in $BOT_OUTPUT_DIR/photo-tasks.png.
  // Empty list → render.mjs prints a text fallback to stdout.
  const showAll = hasFlag('all');
  const todayOnly = hasFlag('today');
  const { spawnSync } = await import('node:child_process');
  const renderArgs = [path.resolve(__dirname, 'render.mjs')];
  if (todayOnly) renderArgs.push('--today');
  if (showAll && !todayOnly) renderArgs.push('--all');
  const r = spawnSync(process.execPath, renderArgs, { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status || 1);
}

async function done() {
  const indices = args[1];
  if (!indices) {
    console.error('Укажи индексы: node tasks.js done 1,3');
    process.exit(1);
  }

  const items = await getOpenItems();
  const idxList = indices.split(',').map(n => parseInt(n.trim()) - 1);
  const ids = idxList.filter(i => i >= 0 && i < items.length).map(i => items[i].id);

  if (ids.length === 0) {
    console.error('Не найдены задачи по указанным индексам.');
    process.exit(1);
  }

  await db.query(
    `UPDATE tasks SET status = 'done', completed_at = NOW() WHERE id = ANY($1)`,
    [ids]
  );
  console.log(`Завершено задач: ${ids.length}`);
}

async function remove() {
  const indices = args[1];
  if (!indices) {
    console.error('Укажи индексы: node tasks.js remove 2');
    process.exit(1);
  }

  const items = await getOpenItems();
  const idxList = indices.split(',').map(n => parseInt(n.trim()) - 1);
  const ids = idxList.filter(i => i >= 0 && i < items.length).map(i => items[i].id);

  if (ids.length === 0) {
    console.error('Не найдены задачи по указанным индексам.');
    process.exit(1);
  }

  await db.query(`DELETE FROM tasks WHERE id = ANY($1)`, [ids]);
  console.log(`Удалено задач: ${ids.length}`);
}

async function edit() {
  const index = parseInt(args[1]);
  if (isNaN(index)) {
    console.error('Укажи индекс: node tasks.js edit 1 --title "Новый текст"');
    process.exit(1);
  }

  const items = await getOpenItems();
  const item = items[index - 1];
  if (!item) {
    console.error(`Задача с индексом ${index} не найдена.`);
    process.exit(1);
  }

  const title = getFlag('title');
  const due = getFlag('due');
  const notes = getFlag('notes');
  const tags = parseTagsFlag();

  const updates = [];
  const params = [item.id];
  let idx = 2;

  if (title) { updates.push(`title = $${idx++}`); params.push(title); }
  if (due) { updates.push(`due_date = $${idx++}::date`); params.push(due); }
  if (notes) { updates.push(`notes = $${idx++}`); params.push(notes); }
  if (tags !== null) { updates.push(`tags = $${idx++}`); params.push(tags); }

  if (updates.length === 0) {
    console.error('Нечего менять. Используй --title, --due, --notes, --tag');
    process.exit(1);
  }

  await db.query(`UPDATE tasks SET ${updates.join(', ')} WHERE id = $1`, params);
  console.log(`Задача #${item.id} обновлена.`);
}

async function getOpenItems() {
  const res = await db.query(`
    SELECT id, title, status,
           TO_CHAR(due_date, 'YYYY-MM-DD') AS due_date,
           notes, tags
    FROM tasks
    WHERE status = 'open' AND (due_date IS NULL OR due_date <= CURRENT_DATE + INTERVAL '1 month')
    ORDER BY
      ${TAG_ORDER_SQL},
      CASE WHEN due_date IS NOT NULL THEN 0 ELSE 1 END,
      due_date ASC NULLS LAST,
      created_at DESC,
      id ASC
  `);
  return res.rows;
}

// ─── Recurring templates ──────────────────────────────────────────────────

const DOW_MAP = {
  sunday: 0, sun: 0, вс: 0, воскресенье: 0,
  monday: 1, mon: 1, пн: 1, понедельник: 1,
  tuesday: 2, tue: 2, вт: 2, вторник: 2,
  wednesday: 3, wed: 3, ср: 3, среда: 3,
  thursday: 4, thu: 4, чт: 4, четверг: 4,
  friday: 5, fri: 5, пт: 5, пятница: 5,
  saturday: 6, sat: 6, сб: 6, суббота: 6,
};
const DOW_RU = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const RU_MONTHS = ['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь'];

// Parse and validate --day for given type. Accepts numeric DOW (0-6) or named day for weekly.
function parseDay(type, val) {
  if (type === 'monthly') {
    const day = parseInt(val);
    if (isNaN(day) || day < 1 || day > 31) throw new Error(`monthly day — 1-31. Дано: ${val}`);
    return day;
  }
  if (type === 'weekly') {
    if (val === null || val === undefined) throw new Error(`weekly: нужен --day (понедельник/friday/5)`);
    const lower = String(val).toLowerCase();
    if (DOW_MAP[lower] !== undefined) return DOW_MAP[lower];
    const n = parseInt(val);
    if (!isNaN(n) && n >= 0 && n <= 6) return n;
    throw new Error(`Неизвестный день недели: ${val}`);
  }
  throw new Error(`Неизвестный тип: ${type}. Варианты: monthly, weekly`);
}

function daysInMonth(y, m) {
  // m is 1-12
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function fmtDate(y, m, d) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function addMonths(y, m, n) {
  // returns [y2, m2] after adding n months to (y, m) where m is 1-12.
  const total = (y * 12 + (m - 1)) + n;
  return [Math.floor(total / 12), (total % 12) + 1];
}

// Compute the next due date >= fromDateStr for a recurrence rule.
// rec = { type, day, interval, lastSpawnedDue|null }
function computeNextDue(rec, fromDateStr) {
  const interval = Math.max(1, rec.interval || 1);
  const last = rec.lastSpawnedDue || null;

  if (rec.type === 'monthly') {
    // If we already spawned once, next = last + interval months (clamp day).
    if (last) {
      const [ly, lm] = last.split('-').map(Number);
      const [ny, nm] = addMonths(ly, lm, interval);
      const nd = Math.min(rec.day, daysInMonth(ny, nm));
      return fmtDate(ny, nm, nd);
    }
    // First spawn: nearest N-th of month >= today, ignoring interval (anchor here).
    const [y, m, d] = fromDateStr.split('-').map(Number);
    let yr = y, mo = m;
    let day = Math.min(rec.day, daysInMonth(yr, mo));
    if (day < d) {
      [yr, mo] = addMonths(yr, mo, 1);
      day = Math.min(rec.day, daysInMonth(yr, mo));
    }
    return fmtDate(yr, mo, day);
  }

  if (rec.type === 'weekly') {
    if (last) {
      const [ly, lm, ld] = last.split('-').map(Number);
      const dt = new Date(Date.UTC(ly, lm - 1, ld));
      dt.setUTCDate(dt.getUTCDate() + 7 * interval);
      return fmtDate(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
    }
    const [y, m, d] = fromDateStr.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    const curDow = dt.getUTCDay();
    const delta = (rec.day - curDow + 7) % 7;
    dt.setUTCDate(dt.getUTCDate() + delta);
    return fmtDate(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
  }
  throw new Error(`Bad type: ${rec.type}`);
}

// Subtract N days from a YYYY-MM-DD string, returning YYYY-MM-DD.
function subtractDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - n);
  return fmtDate(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

function stampedTitle(baseTitle, rec, dueDate) {
  if (rec.type === 'monthly') {
    const [y, m] = dueDate.split('-').map(Number);
    return `${baseTitle} (${RU_MONTHS[m - 1]} ${y})`;
  }
  if (rec.type === 'weekly') {
    return `${baseTitle} (${dueDate})`;
  }
  return baseTitle;
}

function describeRecurrence(rec) {
  const interval = Math.max(1, rec.interval || 1);
  if (rec.type === 'monthly') {
    if (interval === 1) return `каждое ${rec.day}-е число`;
    return `каждое ${rec.day}-е число раз в ${interval} мес.`;
  }
  if (rec.type === 'weekly') {
    if (interval === 1) return `каждую неделю в ${DOW_RU[rec.day]}`;
    return `каждые ${interval} недели в ${DOW_RU[rec.day]}`;
  }
  return `${rec.type}:${rec.day}:${interval}`;
}

async function recur() {
  const sub = args[1];
  switch (sub) {
    case 'add': return recurAdd();
    case 'list': return recurList();
    case 'on': return recurToggle(true);
    case 'off': return recurToggle(false);
    case 'rm':
    case 'remove':
    case 'delete': return recurRemove();
    default:
      console.log('Команды recur: add, list, on, off, rm');
      console.log('Пример: node tasks.js recur add "Заплатить за МинГАЗ" --type monthly --day 20 --tag квартира');
      console.log('Quarterly: --type monthly --day 15 --interval 3');
      console.log('Biweekly:  --type weekly --day friday --interval 2');
  }
}

async function recurAdd() {
  const title = args[2];
  if (!title) {
    console.error('Нужен текст: node tasks.js recur add "Title" --type monthly --day 20');
    process.exit(1);
  }
  const type = getFlag('type');
  const dayFlag = getFlag('day');
  if (!type) {
    console.error('Нужен --type monthly|weekly');
    process.exit(1);
  }
  if (dayFlag === null) {
    console.error('Нужен --day (для monthly: 1-31; для weekly: пн/friday/5)');
    process.exit(1);
  }
  const day = parseDay(type, dayFlag);
  const intervalFlag = getFlag('interval');
  const interval = intervalFlag !== null ? parseInt(intervalFlag) : 1;
  if (isNaN(interval) || interval < 1) {
    console.error(`Bad --interval: ${intervalFlag} (должно быть >= 1)`);
    process.exit(1);
  }
  const leadFlag = getFlag('lead');
  const leadDefault = type === 'weekly' ? 0 : 3;
  const lead = leadFlag !== null ? parseInt(leadFlag) : leadDefault;
  if (isNaN(lead) || lead < 0) {
    console.error(`Bad --lead: ${leadFlag}`);
    process.exit(1);
  }
  const notes = getFlag('notes');
  const tags = parseTagsFlag() || [];

  const res = await db.query(
    `INSERT INTO task_templates (title, notes, tags, recurrence_type, recurrence_day, interval, lead_time_days)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [title, notes || null, tags, type, day, interval, lead]
  );
  const tagStr = tags.length ? ` [${tags.join(', ')}]` : '';
  console.log(`Шаблон #${res.rows[0].id} добавлен${tagStr}: ${title} — ${describeRecurrence({ type, day, interval })} (lead ${lead}д)`);
}

async function recurList() {
  const res = await db.query(`
    SELECT id, title, notes, tags, recurrence_type, recurrence_day, interval, lead_time_days, active,
           TO_CHAR(last_spawned_due, 'YYYY-MM-DD') AS last_spawned_due
    FROM task_templates
    ORDER BY active DESC, id ASC
  `);
  if (res.rows.length === 0) {
    console.log('Шаблонов нет.');
    return;
  }
  console.log(`Повторяющиеся шаблоны — ${res.rows.length}:\n`);
  res.rows.forEach(t => {
    const status = t.active ? '🟢' : '⚪️';
    const tags = t.tags && t.tags.length ? ` [${t.tags.join(', ')}]` : '';
    const last = t.last_spawned_due ? ` | последний: ${t.last_spawned_due}` : '';
    const rec = { type: t.recurrence_type, day: t.recurrence_day, interval: t.interval, lastSpawnedDue: t.last_spawned_due };
    const next = t.active ? ` | след: ${computeNextDue(rec, todayStr())}` : '';
    console.log(`#${t.id} ${status} ${t.title}${tags} — ${describeRecurrence(rec)} (lead ${t.lead_time_days}д)${next}${last}`);
    if (t.notes) console.log(`     ${t.notes}`);
  });
}

async function recurToggle(active) {
  const id = parseInt(args[2]);
  if (isNaN(id)) {
    console.error('Укажи id шаблона: node tasks.js recur on <id>');
    process.exit(1);
  }
  const res = await db.query(
    `UPDATE task_templates SET active = $1 WHERE id = $2 RETURNING title`,
    [active, id]
  );
  if (res.rowCount === 0) {
    console.error(`Шаблон #${id} не найден.`);
    process.exit(1);
  }
  console.log(`Шаблон #${id} ${active ? 'включён' : 'выключен'}: ${res.rows[0].title}`);
}

async function recurRemove() {
  const id = parseInt(args[2]);
  if (isNaN(id)) {
    console.error('Укажи id шаблона: node tasks.js recur rm <id>');
    process.exit(1);
  }
  const res = await db.query(`DELETE FROM task_templates WHERE id = $1 RETURNING title`, [id]);
  if (res.rowCount === 0) {
    console.error(`Шаблон #${id} не найден.`);
    process.exit(1);
  }
  console.log(`Шаблон #${id} удалён: ${res.rows[0].title}`);
}

async function spawn() {
  const today = todayStr();
  const res = await db.query(`
    SELECT id, title, notes, tags, recurrence_type, recurrence_day, interval, lead_time_days,
           TO_CHAR(last_spawned_due, 'YYYY-MM-DD') AS last_spawned_due
    FROM task_templates
    WHERE active = TRUE
  `);

  const spawned = [];
  for (const tpl of res.rows) {
    if (!tpl.recurrence_type || tpl.recurrence_day === null) {
      console.error(`Шаблон #${tpl.id} без recurrence_type/day — пропускаю`);
      continue;
    }
    const rec = {
      type: tpl.recurrence_type,
      day: tpl.recurrence_day,
      interval: tpl.interval,
      lastSpawnedDue: tpl.last_spawned_due,
    };
    const nextDue = computeNextDue(rec, today);
    const spawnDate = subtractDays(nextDue, tpl.lead_time_days);
    if (today < spawnDate) continue; // not time yet
    if (tpl.last_spawned_due === nextDue) continue; // already spawned this period

    const title = stampedTitle(tpl.title, rec, nextDue);
    const ins = await db.query(
      `INSERT INTO tasks (title, due_date, notes, tags, template_id)
       VALUES ($1, $2::date, $3, $4, $5) RETURNING id`,
      [title, nextDue, tpl.notes, tpl.tags, tpl.id]
    );
    await db.query(
      `UPDATE task_templates SET last_spawned_due = $1::date WHERE id = $2`,
      [nextDue, tpl.id]
    );
    spawned.push({ taskId: ins.rows[0].id, title, due: nextDue });
  }

  if (spawned.length === 0) {
    // silent — nothing to spawn
    return;
  }
  console.log(`Заспавнено задач: ${spawned.length}`);
  spawned.forEach(s => {
    console.log(`#${s.taskId} ${s.title} | до ${s.due}`);
  });
}

async function main() {
  try {
    switch (command) {
      case 'add': await add(); break;
      case 'list': await list(); break;
      case 'done': await done(); break;
      case 'remove': await remove(); break;
      case 'edit': await edit(); break;
      case 'recur': await recur(); break;
      case 'spawn': await spawn(); break;
      default:
        console.log('Команды: add, list, done, remove, edit, recur, spawn');
        console.log('Пример: node tasks.js add "Починить iPhone" --due 2025-02-15');
    }
  } catch (err) {
    console.error(`Ошибка: ${err.message}`);
    process.exit(1);
  } finally {
    await db.end();
  }
}

main();
