# ai-news-digest

## Description
Renders a clickable dark-themed HTML digest of AI news — top items per category with "Why it matters" callouts, source links, direct links to each story. Consumed by the `ai-digest` cron for the daily briefing.

## Usage

### Step 1: Build digest data JSON
```bash
cat > tmp/ai-news.json << 'EOF'
{
  "dateLabel": "20 Jul 2026",
  "headline": "AI Daily",
  "tagline": "Top developments in tools, models, and automation — under 3 minutes.",
  "categories": [
    {
      "key": "tools",
      "label": "AI Tools",
      "accent": "blue",
      "items": [
        {
          "title": "Cursor 2.0 ships multi-file diffs",
          "body": "2-sentence summary of what happened.",
          "whyItMatters": "1-sentence take on impact / who cares.",
          "url": "https://example.com/story",
          "source": "TechCrunch"
        }
      ]
    },
    {
      "key": "models",
      "label": "New LLM Models",
      "accent": "teal",
      "items": []
    },
    {
      "key": "automation",
      "label": "AI Automation",
      "accent": "orange",
      "items": []
    }
  ],
  "sources": "<a href=\"https://techcrunch.com/\" target=\"_blank\">TechCrunch</a> · <a href=\"https://www.theverge.com/ai-artificial-intelligence\" target=\"_blank\">The Verge</a>"
}
EOF
```

Field notes:
- **`accent`** — one of `blue | teal | orange | red | purple`. Used for the section pill color.
- **`url`** on an item → title becomes clickable with a dashed underline + ↗.
- **`body`** / **`whyItMatters`** — bare `https://…` URLs auto-linkify.
- **`sources`** — accepts raw HTML (put `<a>` tags directly).
- **`whyItMatters`** — optional but recommended, renders as a callout.
- Order of categories drives order in the digest.

### Step 2: Render
```bash
npx tsx skills/ai-news-digest/render.ts tmp/ai-news.json
```

## Output
Writes `ai-news.html` to `$BOT_OUTPUT_DIR/` — auto-sends to the chat as a document (`.html` file). User opens in a browser and clicks through to each story.

**Do NOT rename to `photo-*.html`** — HTML must go as document. Photo mode will just fail to preview.

## Design
Dark inky canvas, DM Sans display + Inter body. Purple/blue accent for "why it matters" callouts. Loosely inspired by Revolut / dark-mode news apps. ~780px centered body, mobile-friendly via viewport meta.

## Learnings
_(none yet — created 2026-07-20 to replace plain-text ai-digest cron output)_
- [[2026-07-21]] [[ai-news-digest]] Скилл создан 2026-07-20. Dark-themed clickable HTML digest — top-N новостей по 3 категориям (AI Tools / New Models / AI Automation), с 'Why it matters' callouts под каждой и прямыми ссылками на источники. Emits digest.html в output dir — открывается в браузере. Утренний ai-digest cron (7:00 Минск) шлёт HTML документом с 21.07. Vovan одобрил стиль после теста ('огонь').
