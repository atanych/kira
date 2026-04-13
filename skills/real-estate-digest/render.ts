import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { execSync } from "child_process";
import sharp from "sharp";

const BOT_DIR = resolve(import.meta.dirname, "../..");
const OUTPUT_DIR = resolve(BOT_DIR, "tmp/output");
const TEMPLATE_PATH = resolve(import.meta.dirname, "template.html");
const VIEWPORT_WIDTH = 700;

interface DigestItem {
  title: string;
  price?: string;
  body: string;
  source?: string;
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

function renderCard(item: DigestItem): string {
  return `
    <div class="card">
      <div class="card-title">
        ${esc(item.title)}
        ${item.price ? `<span class="price-pill">${esc(item.price)}</span>` : ""}
      </div>
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
    .map((u) => `<div class="useful-item"><span class="arrow">→</span><span>${esc(u)}</span></div>`)
    .join("\n");

  return template
    .replace("{{dateRange}}", esc(data.dateRange))
    .replace("{{newProjects}}", newProjectCards)
    .replace("{{construction}}", constructionCards)
    .replace("{{stats}}", statCards)
    .replace("{{insights}}", insights)
    .replace("{{useful}}", usefulItems)
    .replace("{{sources}}", esc(data.sources));
}

// --- Main ---
const jsonPath = process.argv[2];
if (!jsonPath) {
  console.error("Usage: npx tsx render.ts <digest-data.json>");
  process.exit(1);
}

const data: DigestData = JSON.parse(readFileSync(resolve(jsonPath), "utf-8"));
const html = buildHtml(data);
const htmlPath = resolve(BOT_DIR, "tmp/digest-rendered.html");
writeFileSync(htmlPath, html);
console.log(`✓ HTML written to ${htmlPath}`);

// Screenshot via agent-browser + crop with sharp
const tmpPath = resolve(BOT_DIR, "tmp/digest-full.png");
const outPath = resolve(OUTPUT_DIR, "digest.png");
try {
  execSync(`npx agent-browser open "file://${htmlPath}"`, { stdio: "pipe", timeout: 15000 });
  execSync(`npx agent-browser screenshot "${tmpPath}" --full`, { stdio: "pipe", timeout: 15000 });
  execSync(`npx agent-browser close`, { stdio: "pipe", timeout: 10000 });

  // Crop to body width (700px), removing empty right side
  const img = sharp(tmpPath);
  const meta = await img.metadata();
  await sharp(tmpPath)
    .extract({ left: 0, top: 0, width: VIEWPORT_WIDTH, height: meta.height! })
    .toFile(outPath);

  console.log(`✓ Screenshot saved to ${outPath} (${VIEWPORT_WIDTH}x${meta.height})`);
} catch (e: any) {
  console.error(`✗ Screenshot failed: ${e.message}`);
  process.exit(1);
}
