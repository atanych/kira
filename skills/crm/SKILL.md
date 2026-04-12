# CRM

## Description
Meeting CRM — syncs Grain meetings, extracts summaries/action items/decisions/context via AI, conversational approval flow, Slack recaps, semantic search over contacts and meetings.

## Usage

### Sync
```bash
node skills/crm/scripts/sync.js --days 0.5 --participant "Vlad Atanov"   # standard cron sync
node skills/crm/scripts/sync.js --days 7 --participant "Vlad Atanov"     # last 7 days
node skills/crm/scripts/sync.js --meeting <grain_id>                      # specific meeting
node skills/crm/scripts/sync.js --meeting <grain_id> --force              # re-sync (re-extract)
node skills/crm/scripts/sync.js --days 0.5 --participant "Vlad Atanov" --dry-run  # preview
```

**Important:**
- Always use `--participant "Vlad Atanov"` to only sync Vlad's meetings
- The `--days` flag uses `parseFloat` (not parseInt) — fractional values like 0.5 work
- "Archive Socials" meetings are in the IGNORED_MEETINGS list and always skipped
- Extraction uses GPT-4o (not mini) with temperature 0.3
- All meetings already in CRM DB are treated as Vlad's meetings (pre-filter era data)

### Query
```bash
node skills/crm/scripts/query.js "what did we discuss with John last week?"
node skills/crm/scripts/query.js "pending action items"
```

### Search
```bash
node skills/crm/scripts/search.js "John Smith" --type contacts
node skills/crm/scripts/search.js "product roadmap" --type meetings
node skills/crm/scripts/search.js "AI strategy" --type context
```

### Action Items
```bash
node skills/crm/scripts/action-items.js                   # list pending
node skills/crm/scripts/action-items.js --approve 1,3,5   # approve by index
node skills/crm/scripts/action-items.js --reject 2,4      # reject by index
```

You can also approve/reject directly via DB:
```js
import db from './skills/crm/src/db.js';
await db.query("UPDATE action_items SET approved = false WHERE id = $1", [id]);
```

### Slack Recaps
```bash
node skills/slack/recap.js --channel "#analytics" --meeting "Vlad <> Oral"
node skills/slack/recap.js --channel "#analytics" --today
node skills/slack/recap.js --channel D0ARY491V34 --meeting "Oral"   # DM by ID
```

### Highlights
When user says "highlight that" or "Kira, highlight it" during/after a meeting review, save the statement as a highlighted context entry.

## Cron Jobs

### Grain Sync (`crons/grain-sync.json`)
- Schedule: every 15 min, 8am-5pm weekdays
- Command: `sync.js --days 0.5 --participant "Vlad Atanov"`
- If new meetings found → post recap to Telegram
- If nothing new → stay silent

### Action Items Reminder (`crons/action-items-reminder.json`)
- Schedule: 6am & 12pm weekdays
- Shows overdue, due today, due tomorrow (morning only)
- Always posts — if nothing urgent, say so

### Daily Recap (`crons/daily-recap.json`)
- Schedule: 6pm weekdays
- Final sync + end-of-day summary

## Recap Format (Slack)
```
📋 *Meeting Recap: Title*
_Date • Duration • Participants: @mentions_

*Summary*
What was discussed (no participant names or company name)

*🔑 Decisions*
1. Decision one
2. Decision two

*📌 Action Items*
1. @person Task description
2. @person Task description

*💬 Highlights*
1. Statement — why it matters
```

**Rules:**
- Titles bold, everything else not bold
- Metadata line is italic
- Numbered lists for decisions, action items, highlights
- @mentions resolved via CRM contact emails → Slack emails, fallback to first+last name, then first-name-only if unique
- Decisions and highlights must NOT overlap — if it's a decision, don't repeat as highlight
- Summary should NOT include participant names or "Archive Technologies"
- Only approved (or unreviewed) action items are shown in recaps

## Workflow
1. Cron fires → sync Grain meetings (Vlad only)
2. New meeting found → extract via GPT-4o → save to DB (summary, action items, decisions, highlights)
3. Push full transcript + summary + decisions to LightRAG (dedup via file_source = interaction ID)
4. Post recap to Telegram for Vlad to review
5. Vlad approves/rejects action items
6. On request → post recap to Slack channel with approved items only

## LightRAG Integration
- Meetings push: title + date + participants + summary + decisions + **full transcript** (NOT just summary)
- No action items in LightRAG — those live in CRM DB only
- Dedup: uses `file_source` = interaction ID. If doc exists, skip. On `--force`, delete + re-push.
- Transcripts are NOT stored in CRM DB — fetched from Grain API on demand
- If LightRAG needs a full rebuild, re-fetch transcripts from Grain and re-push

## DB Schema Notes
- `interactions` table has `decisions` and `highlights` JSONB columns
- `action_items.approved` — true = approved, false = rejected, null = not reviewed
- Action items with `approved = false` are still `status = 'pending'` — filter by `(approved IS NULL OR approved = true)` for active items
- `contact_context` with `direction = 'both'` is per-person context, NOT decisions
- `contact_context` with `direction = 'highlight'` is legacy highlight storage
- Transcripts are NOT stored — Grain is the source of truth

## Extraction Prompt Notes
- GPT-4o, temperature 0.3
- Summary must NOT include participant names or company name
- Must extract EVERY action item — "when in doubt, include it"
- Highlights must NOT duplicate decisions
- `due_date` must handle string "null" → actual null (bug fix)

## Input
- Grain meeting IDs
- Search queries
- Natural language approval commands
- Highlight requests

## Output
- Meeting summaries with action items, decisions, context
- Ranked search results
- Contact profiles with interaction history
- Slack recaps to any channel
