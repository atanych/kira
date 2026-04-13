# real-estate-digest

## Description
Generates a beautiful Revolut-styled HTML digest of Minsk real estate news and renders it as a photo image.

## Usage

### Step 1: Create digest data JSON
```bash
cat > tmp/digest-data.json << 'EOF'
{
  "dateRange": "5–12 апреля 2026",
  "newProjects": [
    { "title": "Nobili 1 (квартал Depo)", "price": "от $5 845/м²", "body": "Description...", "source": "realt.by" }
  ],
  "construction": [
    { "title": "«Зелёная гавань»", "price": "от $1 820/м²", "body": "Description...", "source": "onliner.by" }
  ],
  "analytics": {
    "stats": [
      { "value": "$2 258", "label": "Новостройки", "sub": "средн. за м²" }
    ],
    "insights": ["Insight text..."]
  },
  "useful": ["Item 1...", "Item 2..."],
  "sources": "realt.by · onliner.by · domovita.by"
}
EOF
```

### Step 2: Render
```bash
npx tsx skills/real-estate-digest/render.ts tmp/digest-data.json
```

## Output
Saves `digest.png` to `tmp/output/` (auto-sent as Telegram file — no `photo-` prefix, full quality).

## Design
Revolut-inspired: near-black (#191c1f), white, flat (zero shadows), pill badges, Inter font, 20px card radius.

## Excluded Sources
- nashaniva.com

## Learnings

[2026-04-12] Send digest as PNG **file** (no `photo-` prefix) — Telegram photo compression kills readability. PDF also tested, unnecessary.

[2026-04-12] Viewport 700px for mobile-friendly reading on phone. Body 100% width, no dead space.
- [2026-04-12] Real estate digest cron — Fridays 19:00 Минск. Revolut-styled PNG as file (not photo — quality loss). [[real-estate-digest]]
