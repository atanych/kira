#!/usr/bin/env node

/**
 * Personal tasks manager.
 *
 * Usage:
 *   node tasks.js add "Title" [--due YYYY-MM-DD] [--notes "..."]
 *   node tasks.js list [--all]
 *   node tasks.js done 1,3
 *   node tasks.js remove 2
 *   node tasks.js edit 1 [--title "New"] [--due YYYY-MM-DD] [--notes "..."]
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

async function main() {
  try {
    switch (command) {
      case 'add': await add(); break;
      case 'list': await list(); break;
      case 'done': await done(); break;
      case 'remove': await remove(); break;
      case 'edit': await edit(); break;
      default:
        console.log('Команды: add, list, done, remove, edit');
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
