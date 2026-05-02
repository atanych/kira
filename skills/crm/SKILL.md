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
- "Archive Socials" and "All Hands" meetings are in the IGNORED_MEETINGS list and always skipped
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
node skills/crm/scripts/action-items.js                   # list pending (unreviewed)
node skills/crm/scripts/action-items.js --status approved  # list approved
node skills/crm/scripts/action-items.js --status all       # all non-rejected
node skills/crm/scripts/action-items.js --group-by-person  # approved + pending sections
node skills/crm/scripts/action-items.js --approve 1,3,5   # approve by index
node skills/crm/scripts/action-items.js --reject 2,4      # reject by index
node skills/crm/scripts/action-items.js --complete 1      # mark completed
node skills/crm/scripts/action-items.js --limit 200       # default is 200
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

## Recap Format (Telegram)
When posting meeting recaps to Vovan in Telegram:
- **One message per meeting** — never bundle. Vovan needs to reply to each for action item approval/review.
- **Always English** — translate Russian meetings before posting.
- **No markdown bold** — Telegram renders it poorly; use emoji headers instead (📋 📌 🔑 💬).
- **Add approval/reject reminder** at the bottom of each recap so Vovan knows to respond.

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
- `action_items.status` — 'pending' (unreviewed), 'approved', 'rejected', 'completed'
- No separate `approved` column — status is the single source of truth
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

## Learnings
- [2026-04-15] [[crm]] Consolidated to 3 crons: grain-sync (15min 8-5), action-items-reminder (6am/12pm/6pm, silent when empty), daily-recap as final-sync (7pm, always posts). Single status field (pending/approved/rejected/completed). Action items report: ✅ APPROVED grouped by person + ⏳ NEEDS REVIEW numbered. Due dates short format.
- [2026-04-15] [[crm]] Extractor must pass full current date (YYYY-MM-DD) not just year — needed for resolving relative dates like tomorrow, next week.
- [2026-04-17] [[crm]] Action-items report total count must only include active items (approved + pending), not completed/rejected. Fixed Apr 16.
- [2026-04-23] [[crm]] Owner-required gate (shipped 2026-04-22): `--approve` blocks items without owners, Slack `recap.js` refuses to publish if any approved item is orphaned, morning/evening reports show only approved items (pending count surfaced as a hint).
- [2026-04-24] [[crm]] Grain public API has no clip-creation endpoint (404s). To pinpoint a quote: pull raw transcript via transcript API, grep, return deep-link `https://grain.com/share/recording/{id}/{token}?t={seconds}`. Timestamp deep-link is the fallback for clips.
- [2026-04-28] [[crm]] `recap.js` accepts a custom append section — auto-summary + appended text go to Slack as one message. Useful when you need to pin source-of-truth notes (e.g. "Lucy is not on HubSpot") directly in the recap. Confirmed on PostHog Alerts ship 2026-04-27 (#analytics).
- [2026-05-01] [[crm]] Embedding architecture: 1 per interaction (subject+summary, NOT raw transcript) + N per extracted context fact + N per highlight. NO transcript chunking — KB chunks content, CRM doesn't. Coarse search hits meeting, fine search hits facts.
