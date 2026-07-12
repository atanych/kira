import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const BOT_DIR = resolve(import.meta.dirname, "../..");
const OUTPUT_DIR = process.env.BOT_OUTPUT_DIR || resolve(BOT_DIR, "tmp/output");
const TEMPLATE_PATH = resolve(import.meta.dirname, "template.html");

interface DigestItem {
  title: string;
  price?: string;
  body: string;
  source?: string;
  url?: string;
}

interface Stat {
  value: string;
  label: string;
  sub?: string;
  trend?: "down" | "up" | "neutral";
}

interface DigestData {
  dateRange: string;
  newProjects: DigestItem[];
  construction: DigestItem[];
  analytics: {
    stats: Stat[];
    insights: string[];
  };
  useful: string[];
  sources: string;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function linkify(s: string): string {
  // Turn bare http(s) URLs into clickable links (call on already-escaped text)
  return s.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener" style="color:#6b70ff;text-decoration:none;border-bottom:1px dashed rgba(107,112,255,0.4);">$1</a>'
  );
}

function renderCard(item: DigestItem): string {
  const titleInner = `${esc(item.title)}${
    item.price ? ` <span class="price-pill">${esc(item.price)}</span>` : ""
  }`;
  const title = item.url
    ? `<a class="card-title-link" href="${esc(item.url)}" target="_blank" rel="noopener">${titleInner}<span class="link-arrow">↗</span></a>`
    : titleInner;
  return `
    <div class="card">
      <div class="card-title">${title}</div>
      <div class="card-body">${esc(item.body)}</div>
      ${item.source ? `<div class="card-source">${esc(item.source)}</div>` : ""}
    </div>`;
}

function renderStat(stat: Stat): string {
  const trendClass = stat.trend === "down" ? "trend-down" : stat.trend === "up" ? "trend-up" : "";
  return `
    <div class="stat-card">
      <div class="stat-value ${trendClass}">${esc(stat.value)}</div>
      <div class="stat-label">${esc(stat.label)}</div>
      ${stat.sub ? `<div class="stat-sub">${esc(stat.sub)}</div>` : ""}
    </div>`;
}

function buildHtml(data: DigestData): string {
  const template = readFileSync(TEMPLATE_PATH, "utf-8");

  const newProjectCards = data.newProjects.map(renderCard).join("\n");
  const constructionCards = data.construction.map(renderCard).join("\n");
  const statCards = data.analytics.stats.map(renderStat).join("\n");
  const insights = data.analytics.insights
    .map((i) => `<div class="insight">${esc(i)}</div>`)
    .join("\n");
  const usefulItems = data.useful
    .map((u) => `<div class="useful-item"><span class="arrow">→</span><span>${linkify(esc(u))}</span></div>`)
    .join("\n");

  return template
    .replace("{{dateRange}}", esc(data.dateRange))
    .replace("{{newProjects}}", newProjectCards)
    .replace("{{construction}}", constructionCards)
    .replace("{{stats}}", statCards)
    .replace("{{insights}}", insights)
    .replace("{{useful}}", usefulItems)
    .replace("{{sources}}", data.sources);
}

// --- Main ---
const jsonPath = process.argv[2];
if (!jsonPath) {
  console.error("Usage: npx tsx render.ts <digest-data.json>");
  process.exit(1);
}

const data: DigestData = JSON.parse(readFileSync(resolve(jsonPath), "utf-8"));
const html = buildHtml(data);
const outPath = resolve(OUTPUT_DIR, "digest.html");
writeFileSync(outPath, html);
console.log(`✓ HTML written to ${outPath}`);
