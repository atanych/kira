import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const BOT_DIR = resolve(import.meta.dirname, "../..");
const OUTPUT_DIR = process.env.BOT_OUTPUT_DIR || resolve(BOT_DIR, "tmp/output");
const TEMPLATE_PATH = resolve(import.meta.dirname, "template.html");

interface NewsItem {
  title: string;
  body: string;
  whyItMatters?: string;
  url?: string;
  source?: string;
}

type Accent = "blue" | "teal" | "orange" | "red" | "purple";

interface Category {
  key: string;
  label: string;
  accent: Accent;
  items: NewsItem[];
}

interface DigestData {
  dateLabel: string;
  headline: string;
  tagline: string;
  categories: Category[];
  sources: string; // raw HTML allowed
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Linkify bare URLs in already-escaped text.
function linkify(escaped: string): string {
  return escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener">$1</a>'
  );
}

function renderItem(item: NewsItem): string {
  const titleInner = esc(item.title);
  const title = item.url
    ? `<a class="item-title-link" href="${esc(item.url)}" target="_blank" rel="noopener">${titleInner}<span class="link-arrow">↗</span></a>`
    : titleInner;
  const body = linkify(esc(item.body));
  const why = item.whyItMatters
    ? `<div class="why"><span class="why-label">Why it matters</span>${linkify(esc(item.whyItMatters))}</div>`
    : "";
  const source = item.source
    ? `<div class="item-source">${linkify(esc(item.source))}</div>`
    : "";
  return `
    <div class="item">
      <div class="item-title">${title}</div>
      <div class="item-body">${body}</div>
      ${why}
      ${source}
    </div>`;
}

function renderCategory(cat: Category): string {
  const items = cat.items.map(renderItem).join("\n");
  return `
    <div class="section">
      <div class="section-header">
        <span class="section-pill pill-${cat.accent}">${esc(cat.label)}</span>
      </div>
      ${items}
    </div>`;
}

function buildHtml(data: DigestData): string {
  const template = readFileSync(TEMPLATE_PATH, "utf-8");
  const sections = data.categories.map(renderCategory).join("\n");
  return template
    .replace(/{{dateLabel}}/g, esc(data.dateLabel))
    .replace("{{headline}}", esc(data.headline))
    .replace("{{tagline}}", esc(data.tagline))
    .replace("{{sections}}", sections)
    .replace("{{sources}}", data.sources); // raw HTML
}

// --- Main ---
const jsonPath = process.argv[2];
if (!jsonPath) {
  console.error("Usage: npx tsx render.ts <digest-data.json>");
  process.exit(1);
}

const data: DigestData = JSON.parse(readFileSync(resolve(jsonPath), "utf-8"));
const html = buildHtml(data);
const outPath = resolve(OUTPUT_DIR, "ai-news.html");
writeFileSync(outPath, html);
console.log(`✓ HTML written to ${outPath}`);
