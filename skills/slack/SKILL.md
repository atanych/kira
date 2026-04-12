# Slack

## Description
Post messages and meeting recaps to Slack channels or DMs.

## Usage

### Simple message
```bash
node skills/slack/post.js --channel "#analytics" --message "your message here"
node skills/slack/post.js --channel "#analytics" --file message.txt
```

### Meeting recap (rich format with @mentions, decisions, action items, highlights)
```bash
node skills/slack/recap.js --channel "#analytics" --today
node skills/slack/recap.js --channel "#analytics" --meeting "Vlad <> Oral"
node skills/slack/recap.js --channel "#analytics" --interaction-id <uuid>
node skills/slack/recap.js --channel D0ARY491V34 --meeting "Oral"   # DM by ID
```

## Input
### post.js
- `--channel` — Slack channel name or ID (e.g., `#analytics`, `D0ARY491V34`)
- `--message` — inline message text (supports Slack mrkdwn)
- `--file` — path to a text file with the message content

### recap.js
- `--channel` — Slack channel or DM ID (default: `#analytics`)
- `--today` — post recaps for all meetings today
- `--meeting` — post recap for a specific meeting (fuzzy match on subject)
- `--interaction-id` — post recap by CRM interaction ID

## Output
Formatted Slack message with:
- 📋 Bold title
- _Italic metadata_ (date, duration, @participant mentions)
- **Summary** — what was discussed (no names/company)
- **🔑 Decisions** — numbered list
- **📌 Action Items** — numbered list with @mentions
- **💬 Highlights** — numbered list

## @mention Resolution
Priority order:
1. CRM contact email → match Slack user by email
2. Exact `real_name` match in Slack
3. First + last name fuzzy match
4. First-name-only match (if unique in Slack)
5. Fallback: plain text name

## Important
- Vlad's Slack DM ID: `D0ARY491V34`
- Bot auto-joins public channels before posting
- Decisions come from `interactions.decisions` JSONB column (not `contact_context`)
- Highlights come from `interactions.highlights` JSONB column
- Only approved (or unreviewed) action items shown — rejected items excluded
