# real-estate-digest

## Description
Generates a Revolut-styled clickable **HTML** digest of Minsk real estate news. Emits `digest.html` directly to the output dir — the user opens it in a browser and clicks through to each project.

## Usage

### Step 1: Create digest data JSON
```bash
cat > tmp/digest-data.json << 'EOF'
{
  "dateRange": "5–12 апреля 2026",
  "newProjects": [
    { "title": "ЖК Пример", "price": "от $2 100/м²", "body": "Description...", "source": "realt.by", "url": "https://realt.by/newflats/?text=%D0%9F%D1%80%D0%B8%D0%BC%D0%B5%D1%80" }
  ],
  "construction": [
    { "title": "«Зелёная гавань»", "price": "от $1 820/м²", "body": "Description...", "source": "onliner.by", "url": "https://realt.by/newflats/?text=..." }
  ],
  "analytics": {
    "stats": [
      { "value": "$2 258", "label": "Новостройки", "sub": "средн. за м²", "trend": "up" }
    ],
    "insights": ["Insight text..."]
  },
  "useful": ["Item text with inline URL https://bank.by/", "Item 2..."],
  "sources": "<a href=\"https://realt.by/newflats/\" target=\"_blank\">realt.by</a> · <a href=\"https://realt.onliner.by/\" target=\"_blank\">onliner.by</a>"
}
EOF
```

Field notes:
- **`url`** on each project → makes the title clickable (dashed underline + ↗). Optional but strongly recommended.
- **`useful`** items → bare `https://...` URLs are auto-linkified.
- **`sources`** → allows raw HTML (put `<a>` tags directly).

### Step 2: Render
```bash
npx tsx skills/real-estate-digest/render.ts tmp/digest-data.json
```

## Output
Writes `digest.html` to `$BOT_OUTPUT_DIR/` — auto-sends as a Telegram document (`.html` file). User opens locally in a browser to click through project links.

**Do NOT rename to `photo-*.html`** — HTML must go as document, not photo (Telegram would just fail to preview it).

## Design
Revolut-inspired: near-black (#191c1f), white, flat (zero shadows), pill badges, Inter font, ~760px centered body.

## URL patterns that actually work (verified)
- `realt.by/newflats/?text=<url-encoded-query>` — search on realt.by, returns real results (NOT `/search/?query=` — that 404s).
- `realt.onliner.by/` — Onliner real estate portal root.
- `domovita.by/` — portal root.
- Direct dev sites: `uyutnyi.by`, `minskdsk.by`, `belarusbank.by`, `belapb.by`, `mtbank.by` — check `curl -sIL` before using.

## Excluded Sources
- nashaniva.com

## Learnings

[2026-07-18] Switched from PNG to HTML output — user wants clickable per-project links, not a static screenshot. Rendering pipeline dropped agent-browser + sharp entirely, just writes HTML string to output dir.

[2026-07-18] `realt.by/search/?query=` returns 404 for all queries. Use `realt.by/newflats/?text=<encoded>` — verified with `curl -sIL` and confirmed presence of the query term in the response body.
- [[2026-07-19]] [[real-estate-digest]] Скилл переделан 2026-07-18: **HTML документ** с кликабельными ссылками на порталы (realt.by / minskdsk.by / uyutnyi.by), а не PNG. Утренний cron (7:05 Минск) шлёт HTML, вечерний (20:00) остался картинкой. Vovan попросил кликабельные — уже пофиксено.
