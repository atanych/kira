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
  throw new Error(`Неизвестный tag: ${tag}. Варианты: дача, квартира`);
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

const TAG_ORDER_SQL = `CASE WHEN 'квартира' = ANY(tags) THEN 1 WHEN 'дача' = ANY(tags) THEN 2 ELSE 3 END`;
const TAG_HEADERS = { 'квартира': '🏠 Квартира', 'дача': '🌲 Дача', 'other': '📍 Прочее' };

function primaryGroup(tags) {
  if (!tags || tags.length === 0) return 'other';
  if (tags.includes('квартира')) return 'квартира';
  if (tags.includes('дача')) return 'дача';
  return 'other';
}

async function list() {
  const showAll = hasFlag('all');
  const todayOnly = hasFlag('today');

  let where = `WHERE status = 'open' AND (due_date IS NULL OR due_date <= CURRENT_DATE + INTERVAL '1 month')`;
  if (showAll && !todayOnly) where = '';
  if (todayOnly) where = `WHERE status = 'open' AND due_date IS NOT NULL AND due_date <= '${todayStr()}'`;

  const res = await db.query(`
    SELECT id, title, status,
           TO_CHAR(due_date, 'YYYY-MM-DD') AS due_date,
           notes, tags, created_at, completed_at
    FROM tasks
    ${where}
    ORDER BY
      CASE WHEN status = 'open' THEN 0 ELSE 1 END,
      ${TAG_ORDER_SQL},
      CASE WHEN due_date IS NOT NULL THEN 0 ELSE 1 END,
      due_date ASC NULLS LAST,
      created_at DESC
  `);

  if (res.rows.length === 0) {
    if (todayOnly) console.log('На сегодня и просроченных задач нет. Можно спать спокойно 😴');
    else if (showAll) console.log('Задач нет.');
    else console.log('Открытых задач нет.');
    return;
  }

  const label = todayOnly ? 'Задачи на сегодня' : showAll ? 'Все задачи' : 'Открытые задачи';
  console.log(`${label} — ${res.rows.length}:\n`);

  const today = todayStr();
  let currentGroup = null;
  res.rows.forEach((t, i) => {
    const tags = t.tags || [];
    const group = primaryGroup(tags);
    if (group !== currentGroup) {
      if (currentGroup !== null) console.log('');
      console.log(TAG_HEADERS[group]);
      currentGroup = group;
    }
    const status = t.status === 'done' ? '✅' : '⬚';
    const dueDate = t.due_date || null;
    let due = '';
    if (dueDate) {
      const isOverdue = dueDate < today;
      const isToday = dueDate === today;
      const emoji = isOverdue ? '🔴' : isToday ? '🔥' : '📅';
      due = ` | ${emoji} до ${dueDate}`;
    }
    const notes = t.notes ? ` — ${t.notes}` : '';
    const extraTags = tags.filter(x => x !== group);
    const extra = extraTags.length ? ` [+${extraTags.join(', ')}]` : '';
    console.log(`${i + 1}. ${status} ${t.title}${extra}${due}${notes}`);
  });
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
      created_at DESC
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

function parseRecurrence(s) {
  if (!s || !s.includes(':')) throw new Error(`Формат --every: monthly:N или weekly:<день>. Дано: ${s}`);
  const [type, val] = s.split(':');
  if (type === 'monthly') {
    const day = parseInt(val);
    if (isNaN(day) || day < 1 || day > 31) throw new Error(`monthly:N — N должно быть 1-31. Дано: ${val}`);
    return { type: 'monthly', day };
  }
  if (type === 'weekly') {
    const dow = DOW_MAP[val.toLowerCase()];
    if (dow === undefined) throw new Error(`Неизвестный день недели: ${val}`);
    return { type: 'weekly', dow };
  }
  throw new Error(`Неизвестный тип recurrence: ${type}`);
}

function daysInMonth(y, m) {
  // m is 1-12
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function fmtDate(y, m, d) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// Compute the next due date >= fromDateStr for a recurrence rule.
function computeNextDue(rec, fromDateStr) {
  const [y, m, d] = fromDateStr.split('-').map(Number);
  if (rec.type === 'monthly') {
    let yr = y, mo = m;
    let day = Math.min(rec.day, daysInMonth(yr, mo));
    if (day < d) {
      mo++;
      if (mo > 12) { mo = 1; yr++; }
      day = Math.min(rec.day, daysInMonth(yr, mo));
    }
    return fmtDate(yr, mo, day);
  }
  if (rec.type === 'weekly') {
    const dt = new Date(Date.UTC(y, m - 1, d));
    const curDow = dt.getUTCDay();
    const delta = (rec.dow - curDow + 7) % 7;
    dt.setUTCDate(dt.getUTCDate() + delta);
    return fmtDate(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
  }
  throw new Error(`Bad recurrence type: ${rec.type}`);
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

function describeRecurrence(s) {
  const rec = parseRecurrence(s);
  if (rec.type === 'monthly') return `каждое ${rec.day}-е число`;
  if (rec.type === 'weekly') return `каждую неделю в ${DOW_RU[rec.dow]}`;
  return s;
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
      console.log('Пример: node tasks.js recur add "Заплатить за МинГАЗ" --every monthly:20 --tag квартира');
  }
}

async function recurAdd() {
  const title = args[2];
  if (!title) {
    console.error('Нужен текст: node tasks.js recur add "Title" --every monthly:20');
    process.exit(1);
  }
  const everyRaw = getFlag('every');
  if (!everyRaw) {
    console.error('Нужен --every monthly:N или weekly:<день>');
    process.exit(1);
  }
  const rec = parseRecurrence(everyRaw); // validation
  const leadFlag = getFlag('lead');
  const leadDefault = rec.type === 'weekly' ? 0 : 3;
  const lead = leadFlag !== null ? parseInt(leadFlag) : leadDefault;
  if (isNaN(lead) || lead < 0) {
    console.error(`Bad --lead: ${leadFlag}`);
    process.exit(1);
  }
  const notes = getFlag('notes');
  const tags = parseTagsFlag() || [];

  const res = await db.query(
    `INSERT INTO task_templates (title, notes, tags, recurrence, lead_time_days)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [title, notes || null, tags, everyRaw, lead]
  );
  const tagStr = tags.length ? ` [${tags.join(', ')}]` : '';
  console.log(`Шаблон #${res.rows[0].id} добавлен${tagStr}: ${title} — ${describeRecurrence(everyRaw)} (lead ${lead}д)`);
}

async function recurList() {
  const res = await db.query(`
    SELECT id, title, notes, tags, recurrence, lead_time_days, active,
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
    const next = t.active ? ` | след: ${computeNextDue(parseRecurrence(t.recurrence), todayStr())}` : '';
    console.log(`#${t.id} ${status} ${t.title}${tags} — ${describeRecurrence(t.recurrence)} (lead ${t.lead_time_days}д)${next}${last}`);
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
    SELECT id, title, notes, tags, recurrence, lead_time_days,
           TO_CHAR(last_spawned_due, 'YYYY-MM-DD') AS last_spawned_due
    FROM task_templates
    WHERE active = TRUE
  `);

  const spawned = [];
  for (const tpl of res.rows) {
    let rec;
    try { rec = parseRecurrence(tpl.recurrence); }
    catch (e) {
      console.error(`Шаблон #${tpl.id} битый recurrence (${tpl.recurrence}): ${e.message}`);
      continue;
    }
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
