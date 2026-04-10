# CRM

## Description
Meeting CRM — syncs Grain meetings, extracts summaries/action items/decisions/context via AI, conversational approval flow, Slack recaps, semantic search over contacts and meetings.

## Usage

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

### Sync
```bash
node skills/crm/scripts/sync.js                          # recent meetings
node skills/crm/scripts/sync.js --days 7                  # last 7 days
node skills/crm/scripts/sync.js --meeting <grain_id>      # specific meeting
```

### Action Items
```bash
node skills/crm/scripts/action-items.js                   # list pending
node skills/crm/scripts/action-items.js --approve 1,3,5   # approve by index
node skills/crm/scripts/action-items.js --reject 2,4      # reject by index
```

### Highlights
When user says "highlight that" or "Kira, highlight it" during/after a meeting review, save the statement as a highlighted context entry.

## Input
- Grain meeting IDs
- Search queries
- Natural language approval commands
- Highlight requests

## Output
- Meeting summaries with action items, decisions, context
- Ranked search results
- Contact profiles with interaction history
- Slack recaps
