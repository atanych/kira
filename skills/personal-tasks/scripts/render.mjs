#!/usr/bin/env node
// Render personal-tasks list.
// Run: node skills/personal-tasks/scripts/render.mjs [--today] [--all] [--html]
// Default output: $BOT_OUTPUT_DIR/photo-tasks.png (PNG for chat photo mode).
// With --html: writes $BOT_OUTPUT_DIR/tasks.html (mobile-friendly document).
// Prints output path on success. Empty list → text fallback to stdout, no render.

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import db from '../../crm/src/db.js';

const BOT_DIR = path.resolve(import.meta.dirname, '../../..');
const DESIGN_DIR = path.join(BOT_DIR, 'design');
const OUT_DIR = process.env.BOT_OUTPUT_DIR || path.join(BOT_DIR, 'tmp/output');
const TMP_HTML = path.join(BOT_DIR, 'tmp/tasks-render.html');
const TMP_PNG = path.join(BOT_DIR, 'tmp/tasks-full.png');
const OUT_PNG = path.join(OUT_DIR, 'photo-tasks.png');
const OUT_HTML = path.join(OUT_DIR, 'tasks.html');

const todayOnly = process.argv.includes('--today');
const showAll = process.argv.includes('--all');
const htmlMode = process.argv.includes('--html');

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Turn URLs and bare domains in escaped text into <a> tags. Only for HTML mode.
const URL_RE = /(https?:\/\/[^\s<]+)|(www\.[^\s<]+)|(\b[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.(?:by|ru|com|org|io|net|dev|ai|app|shop|store|info|me|xyz|tech|co|de|pl)(?:\/[^\s<]*)?)/gi;
function linkify(escaped) {
  if (!htmlMode) return escaped;
  return escaped.replace(URL_RE, (m) => {
    // Strip trailing punctuation from the linked text (keeps sentence commas/periods out of the URL)
    const trail = m.match(/[),.;:!?»"']+$/);
    const clean = trail ? m.slice(0, -trail[0].length) : m;
    const suffix = trail ? trail[0] : '';
    const href = /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
    return `<a href="${href}" target="_blank" rel="noopener">${clean}</a>${suffix}`;
  });
}

const TAG_META = {
  'квартира': { label: 'КВАРТИРА', order: 1, accent: 'var(--color-bmw-blue)' },
  'дача':     { label: 'ДАЧА',     order: 2, accent: 'var(--color-success)' },
  'ai':       { label: 'AI',       order: 3, accent: 'var(--color-m-blue-light)' },
  'volatclaw':{ label: 'VOLATCLAW', order: 4, accent: 'var(--color-warning)' },
  'other':    { label: 'ПРОЧЕЕ',   order: 5, accent: 'var(--color-muted)' },
};

function primaryGroup(tags) {
  if (!tags || tags.length === 0) return 'other';
  for (const t of ['квартира','дача','ai','volatclaw']) if (tags.includes(t)) return t;
  return 'other';
}

function dueBadge(due) {
  if (!due) return '';
  const today = new Date().toISOString().slice(0, 10);
  const cmp = due.localeCompare(today);
  if (cmp < 0) return `<span class="badge red">overdue · ${due.slice(5)}</span>`;
  if (cmp === 0) return `<span class="badge fire">today</span>`;
  return `<span class="badge blue">${due.slice(5)}</span>`;
}

function plural(n) {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'задача';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'задачи';
  return 'задач';
}

async function loadTasks() {
  const today = new Date().toISOString().slice(0, 10);
  let where;
  if (todayOnly) {
    where = `WHERE status='open' AND due_date IS NOT NULL AND due_date <= '${today}'::date`;
  } else if (showAll) {
    where = '';
  } else {
    where = `WHERE status='open' AND (due_date IS NULL OR due_date <= CURRENT_DATE + INTERVAL '1 month')`;
  }
  const r = await db.query(`
    SELECT id, title, TO_CHAR(due_date, 'YYYY-MM-DD') AS due_date, tags
    FROM tasks ${where}
    ORDER BY
      CASE WHEN 'квартира' = ANY(tags) THEN 1 WHEN 'дача' = ANY(tags) THEN 2 WHEN 'ai' = ANY(tags) THEN 3 WHEN 'volatclaw' = ANY(tags) THEN 4 ELSE 5 END,
      CASE WHEN due_date IS NOT NULL THEN 0 ELSE 1 END,
      due_date ASC NULLS LAST,
      created_at DESC,
      id ASC
  `);
  return r.rows;
}

function groupTasks(rows) {
  const groups = {};
  rows.forEach((t, i) => {
    const g = primaryGroup(t.tags);
    (groups[g] ||= []).push({ ...t, index: i + 1 });
  });
  return Object.keys(groups)
    .sort((a, b) => TAG_META[a].order - TAG_META[b].order)
    .map(g => ({ key: g, meta: TAG_META[g], items: groups[g] }));
}

function buildHtml(rows) {
  const tokensCss = fs.readFileSync(path.join(DESIGN_DIR, 'tokens.css'), 'utf-8');
  const baseCss   = fs.readFileSync(path.join(DESIGN_DIR, 'base.css'),   'utf-8');

  const groups = groupTasks(rows);
  const sections = groups.map(({ meta, items }) => `
    <section class="grp" style="--accent: ${meta.accent}">
      <div class="grp-head">
        <span class="grp-label">${meta.label}</span>
        <span class="grp-line"></span>
        <span class="grp-count">${items.length}</span>
      </div>
      ${items.map(t => `
        <div class="row">
          <span class="num">${t.index}</span>
          <span class="title">${linkify(esc(t.title))}</span>
          ${dueBadge(t.due_date)}
        </div>
      `).join('')}
    </section>
  `).join('');

  const titleLabel = todayOnly ? 'На сегодня' : (showAll ? 'Все' : 'Открытые');
  const dateLabel = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

  const bodyLayout = htmlMode
    ? 'max-width: 640px; margin: 0 auto; padding: 24px 20px 20px;'
    : 'width: 480px; padding: 20px 18px 16px;';

  return `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tasks</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Color+Emoji&display=swap" rel="stylesheet">
<style>${tokensCss}\n${baseCss}
  body, .badge, .title, .grp-label, .hero-count, .hero-label { font-family: var(--font-sans), 'Noto Color Emoji', system-ui !important; }
  body { ${bodyLayout} }
  .hero { display: flex; align-items: baseline; justify-content: space-between; padding-bottom: 12px; border-bottom: 1px solid var(--color-hairline-strong); margin-bottom: 14px; }
  .hero-count { font-family: var(--font-sans); font-size: 26px; font-weight: 700; color: var(--color-on-dark); line-height: 1; }
  .hero-label { font-family: var(--font-sans); font-size: 10px; font-weight: 700; letter-spacing: 1.8px; color: var(--color-muted); text-transform: uppercase; }
  .stripes { display: inline-flex; gap: 2px; margin-right: 6px; vertical-align: 1px; }
  .stripes i { display: inline-block; width: 12px; height: 3px; }
  .stripes i:nth-child(1){background:var(--color-m-blue-light)} .stripes i:nth-child(2){background:var(--color-m-blue-dark)} .stripes i:nth-child(3){background:var(--color-m-red)}

  .grp { margin-bottom: 14px; }
  .grp-head { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
  .grp-label { font-family: var(--font-sans); font-size: 10px; font-weight: 700; letter-spacing: 1.6px; color: var(--accent); }
  .grp-line { flex: 1; height: 1px; background: var(--color-hairline-strong); }
  .grp-count { font-size: 10px; color: var(--color-muted); font-weight: 700; }

  .row { display: flex; align-items: baseline; gap: 10px; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
  .row:last-child { border-bottom: none; }
  .num { font-family: var(--font-mono); font-size: 11px; color: var(--color-muted); width: 18px; font-weight: 700; flex-shrink: 0; }
  .title { font-size: 13px; color: var(--color-body-strong); line-height: 1.35; flex: 1; }
  .title a { color: var(--color-m-blue-light); text-decoration: underline; text-decoration-color: rgba(255,255,255,0.28); text-underline-offset: 2px; }
  .title a:hover { text-decoration-color: currentColor; color: var(--color-on-dark); }
  .badge { font-family: var(--font-mono); font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 3px; letter-spacing: 0.3px; flex-shrink: 0; }
  .badge.red { background: rgba(226,39,24,0.15); color: var(--color-m-red); }
  .badge.fire { background: rgba(244,180,0,0.18); color: var(--color-warning); }
  .badge.blue { background: rgba(28,105,212,0.15); color: var(--color-m-blue-dark); }

  .footer { margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--color-hairline-strong); display: flex; justify-content: space-between; font-family: var(--font-sans); font-size: 9px; color: var(--color-muted); letter-spacing: 1.5px; text-transform: uppercase; }
</style></head><body>
  <div class="hero">
    <div>
      <div class="hero-label"><span class="stripes"><i></i><i></i><i></i></span>${titleLabel}</div>
      <div class="hero-count">${rows.length} <span style="font-size:14px;color:var(--color-muted);font-weight:400">${plural(rows.length)}</span></div>
    </div>
    <div class="hero-label">${dateLabel}</div>
  </div>
  ${sections}
  <div class="footer"><span>kira</span><span>tasks</span></div>
</body></html>`;
}

async function main() {
  const rows = await loadTasks();

  if (rows.length === 0) {
    if (todayOnly) console.log('На сегодня и просроченных задач нет. Можно спать спокойно 😴');
    else if (showAll) console.log('Задач нет.');
    else console.log('Открытых задач нет.');
    await db.end();
    return;
  }

  const html = buildHtml(rows);
  fs.mkdirSync(path.dirname(TMP_HTML), { recursive: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  if (htmlMode) {
    fs.writeFileSync(OUT_HTML, html);
    console.log(OUT_HTML);
    await db.end();
    return;
  }

  fs.writeFileSync(TMP_HTML, html);

  const env = { ...process.env, AGENT_BROWSER_ARGS: '--no-sandbox' };
  execSync(`npx agent-browser open "file://${TMP_HTML}"`,      { stdio: 'pipe', timeout: 30000, env });
  execSync(`npx agent-browser screenshot "${TMP_PNG}" --full`, { stdio: 'pipe', timeout: 30000, env });
  execSync(`npx agent-browser close`,                          { stdio: 'pipe', timeout: 10000, env });

  const sharp = (await import('sharp')).default;
  const meta = await sharp(TMP_PNG).metadata();
  await sharp(TMP_PNG).extract({ left: 0, top: 0, width: 480, height: meta.height }).toFile(OUT_PNG);

  console.log(OUT_PNG);
  await db.end();
}

main().catch(e => { console.error(e.message); db.end().catch(()=>{}); process.exit(1); });
