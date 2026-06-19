#!/usr/bin/env node
// wb-search.ts — поиск товаров на wildberries.by через BY-прокси.
// Usage: npx tsx skills/wb/wb-search.ts "<query>" [--limit N] [--sort popular|priceup|pricedown|rate|newly]
//
// Output:
//   stdout — markdown-таблица топ-N товаров.
//   tmp/output/photo-wb-<idx>-<nmId>.jpg — фото каждого товара (Telegram-превью).

import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// ---------- args ----------
const args = process.argv.slice(2);
if (args.length === 0 || args[0].startsWith("--")) {
  console.error('Usage: wb-search.ts "<query>" [--limit N] [--sort popular|priceup|pricedown|rate|newly]');
  process.exit(2);
}

const query = args[0];
let limit = 5;
let sort = "popular";

for (let i = 1; i < args.length; i++) {
  if (args[i] === "--limit") limit = Math.min(10, Math.max(1, parseInt(args[++i], 10)));
  else if (args[i] === "--sort") sort = args[++i];
  else {
    console.error(`Unknown arg: ${args[i]}`);
    process.exit(2);
  }
}

const PROXY_BY = process.env.PROXY_BY;
if (!PROXY_BY) {
  console.error("PROXY_BY env var is not set — refusing to run (skill requires BY egress).");
  process.exit(3);
}

const OUTPUT_DIR = resolve("tmp/output");
mkdirSync(OUTPUT_DIR, { recursive: true });

// ---------- helpers ----------
function sh(cmd: string, args: string[], opts: { timeout?: number; input?: string } = {}): string {
  const res = spawnSync(cmd, args, {
    encoding: "utf8",
    timeout: opts.timeout ?? 60_000,
    maxBuffer: 50 * 1024 * 1024,
    input: opts.input,
  });
  if (res.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} → exit ${res.status}\n${res.stderr || res.stdout}`);
  }
  return res.stdout;
}

function browser(...cmd: string[]): string {
  return sh("npx", ["agent-browser", ...cmd], { timeout: 90_000 });
}

// ---------- 1. close any non-proxied daemon, open via BY proxy ----------
process.stderr.write("→ closing prior browser sessions...\n");
try { browser("close", "--all"); } catch { /* no active session is fine */ }

const searchUrl = `https://www.wildberries.by/catalog/0/search.aspx?search=${encodeURIComponent(query)}&sort=${sort}`;
process.stderr.write(`→ opening ${searchUrl}\n`);
browser("--proxy", PROXY_BY, "open", searchUrl);
browser("wait", "3500");

// ---------- 2. extract product cards ----------
const evalJs = `JSON.stringify(Array.from(document.querySelectorAll("article.product-card")).slice(0, ${limit}).map(a => {
  const link = a.querySelector("a.product-card__link");
  const img = a.querySelector("img");
  const brand = a.querySelector(".product-card__brand")?.textContent?.trim() || "";
  const priceCur = a.querySelector("ins.price__lower-price")?.textContent?.trim()
    || a.querySelector(".price__lower-price")?.textContent?.trim() || "";
  const priceOld = a.querySelector("del")?.textContent?.trim() || "";
  const rating = a.querySelector(".address-rate-mini")?.textContent?.trim() || "";
  const reviews = a.querySelector(".product-card__count")?.textContent?.trim() || "";
  return {
    nmId: a.dataset.nmId,
    name: link?.getAttribute("aria-label") || "",
    url: link?.href || "",
    brand,
    priceCur,
    priceOld,
    rating,
    reviews,
    imgUrl: img?.src || "",
  };
}))`;

process.stderr.write("→ extracting product data from DOM...\n");
const evalRaw = browser("eval", evalJs).trim();
// eval output is a JSON-encoded string of a JSON array → parse twice.
let products: any[];
try {
  const inner = JSON.parse(evalRaw); // → string
  products = typeof inner === "string" ? JSON.parse(inner) : inner;
} catch (e) {
  throw new Error(`failed to parse eval output:\n${evalRaw.slice(0, 500)}\n${e}`);
}

if (!Array.isArray(products) || products.length === 0) {
  console.error(`WB вернул 0 товаров по запросу "${query}". Возможно, WB сменил DOM-структуру или PoW не прошёл.`);
  try { browser("close", "--all"); } catch {}
  process.exit(1);
}

process.stderr.write(`→ got ${products.length} products, downloading images...\n`);

// ---------- 3. download images via BY proxy ----------
for (let i = 0; i < products.length; i++) {
  const p = products[i];
  if (!p.imgUrl) continue;
  const fileName = `photo-wb-${String(i + 1).padStart(2, "0")}-${p.nmId}.jpg`;
  const filePath = resolve(OUTPUT_DIR, fileName);
  try {
    sh("proxied", [
      "by", "curl", "-fsSL",
      "-H", "Referer: https://www.wildberries.by/",
      "-H", "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      "--max-time", "15",
      "-o", filePath,
      p.imgUrl,
    ], { timeout: 20_000 });
    p.localImage = fileName;
  } catch (e: any) {
    process.stderr.write(`  ✗ image #${i + 1} (${p.nmId}) failed: ${e.message.slice(0, 120)}\n`);
  }
}

// ---------- 4. close browser ----------
try { browser("close", "--all"); } catch {}

// ---------- 5. render stdout summary ----------
const lines: string[] = [];
lines.push(`**WB: "${query}"** — топ ${products.length} (${sort})\n`);

for (let i = 0; i < products.length; i++) {
  const p = products[i];
  const priceLine = p.priceOld && p.priceOld !== p.priceCur
    ? `${p.priceCur} (было ${p.priceOld})`
    : p.priceCur || "цена не отображена";
  const rateLine = p.rating ? `★ ${p.rating}${p.reviews ? ` · ${p.reviews}` : ""}` : "";
  lines.push(`**${i + 1}. ${p.name || "(без названия)"}**`);
  if (p.brand) lines.push(`   ${p.brand}`);
  lines.push(`   ${priceLine}${rateLine ? ` · ${rateLine}` : ""}`);
  lines.push(`   ${p.url}`);
  lines.push("");
}

console.log(lines.join("\n"));
