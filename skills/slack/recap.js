#!/usr/bin/env node

/**
 * Post meeting recap to Slack in rich format.
 *
 * Usage:
 *   node recap.js --channel "#analytics" --meeting "VLad <> ORal Sync"
 *   node recap.js --channel "#analytics" --today          # all today's meetings
 *   node recap.js --channel "#analytics" --interaction-id <uuid>
 */

import { parseArgs } from 'node:util';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const paths = [
    resolve(__dirname, '../../.env'),
    resolve(__dirname, '../../../.env'),
  ];
  for (const p of paths) {
    try {
      const content = readFileSync(p, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) process.env[key] = val;
      }
    } catch {}
  }
}

loadEnv();

const token = process.env.SLACK_BOT_TOKEN;
if (!token) throw new Error('SLACK_BOT_TOKEN not found in .env');

// DB import
const dbModule = await import('../crm/src/db.js');
const db = dbModule.default || dbModule;

const { values } = parseArgs({
  options: {
    channel:          { type: 'string', default: '#analytics' },
    meeting:          { type: 'string' },
    'interaction-id': { type: 'string' },
    today:            { type: 'boolean', default: false },
  },
});

// ─── Slack helpers ───────────────────────────────────────────────────────

async function findChannel(name) {
  const channelName = name.replace(/^#/, '');
  let cursor = '';
  while (true) {
    const url = `https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=1000&exclude_archived=true${cursor ? `&cursor=${cursor}` : ''}`;
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    if (!data.ok) throw new Error(`Slack API error: ${data.error}`);
    const match = data.channels.find(c => c.name === channelName);
    if (match) return match.id;
    if (data.response_metadata?.next_cursor) {
      cursor = data.response_metadata.next_cursor;
    } else {
      return null;
    }
  }
}

async function postMessage(channelId, text) {
  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel: channelId, text, unfurl_links: false, mrkdwn: true }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`Slack postMessage error: ${data.error}`);
  return data;
}

// ─── Slack user lookup (for @mentions) ───────────────────────────────────

let _slackUsers = null;
async function getSlackUsers() {
  if (_slackUsers) return _slackUsers;
  const res = await fetch('https://slack.com/api/users.list?limit=500', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await res.json();
  _slackUsers = data.ok ? data.members : [];
  return _slackUsers;
}

// Build email -> Slack ID map from CRM contacts + Slack users
let _emailMap = null;
async function getEmailMap() {
  if (_emailMap) return _emailMap;
  const users = await getSlackUsers();
  const slackByEmail = {};
  for (const u of users) {
    const email = u.profile?.email?.toLowerCase();
    if (email) slackByEmail[email] = u.id;
  }
  _emailMap = slackByEmail;
  return _emailMap;
}

async function nameToMention(name) {
  if (!name) return 'unassigned';

  // Look up CRM contact email
  const contact = await db.query(
    "SELECT email FROM contacts WHERE name = $1 AND email IS NOT NULL AND email != 'n/a' LIMIT 1",
    [name]
  );

  if (contact.rows.length > 0) {
    const emailMap = await getEmailMap();
    const slackId = emailMap[contact.rows[0].email.toLowerCase()];
    if (slackId) return `<@${slackId}>`;
  }

  // Fallback: exact real_name match, then first+last name match
  const users = await getSlackUsers();
  const lower = name.toLowerCase();
  const exact = users.find(u => (u.real_name || '').toLowerCase() === lower);
  if (exact) return `<@${exact.id}>`;

  const parts = lower.split(/\s+/);
  if (parts.length >= 2) {
    const firstName = parts[0];
    const lastName = parts[parts.length - 1];
    const fuzzy = users.find(u => {
      const real = (u.real_name || '').toLowerCase();
      return real.includes(firstName) && real.includes(lastName);
    });
    if (fuzzy) return `<@${fuzzy.id}>`;

    // Try first name + email domain match
    const firstNameMatches = users.filter(u => {
      const real = (u.real_name || '').toLowerCase();
      const display = (u.profile?.display_name || '').toLowerCase();
      return real === firstName || display === firstName;
    });
    if (firstNameMatches.length === 1) return `<@${firstNameMatches[0].id}>`;
  }

  return name;
}

// ─── Format recap ────────────────────────────────────────────────────────

async function formatRecap(interaction) {
  const { id, subject, summary, occurred_at, duration_minutes, decisions: decisionsJson, highlights: highlightsJson } = interaction;

  // Get participants
  const parts = await db.query(
    `SELECT c.name FROM interaction_participants ip JOIN contacts c ON ip.contact_id = c.id WHERE ip.interaction_id = $1`,
    [id]
  );
  const participantNames = parts.rows.map(r => r.name);
  const participantMentions = await Promise.all(participantNames.map(n => nameToMention(n)));

  // Decisions and highlights from interaction JSON columns
  const decisions = (decisionsJson || []);
  const highlights = (highlightsJson || []);

  // Get action items (approved only, or all if none approved)
  const actionItems = await db.query(
    `SELECT ai.description, ai.owner, c.name as assigned_to
     FROM action_items ai LEFT JOIN contacts c ON ai.assigned_to = c.id
     WHERE ai.interaction_id = $1 AND (ai.approved IS NULL OR ai.approved = true)
     ORDER BY ai.owner ASC`, [id]
  );

  // Format date
  const date = new Date(occurred_at);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Build message
  let msg = `📋 *Meeting Recap: ${subject}*\n`;
  msg += `_${dateStr} • ${duration_minutes} min • Participants: ${participantMentions.join(', ')}_\n\n`;

  // Summary
  msg += `*Summary*\n${summary}\n\n`;

  // Decisions
  if (decisions.length > 0) {
    msg += `*🔑 Decisions*\n`;
    decisions.forEach((d, i) => {
      msg += `${i + 1}. ${d.decision || d}\n`;
    });
    msg += '\n';
  }

  // Action Items
  if (actionItems.rows.length > 0) {
    msg += `*📌 Action Items*\n`;
    let idx = 1;
    for (const ai of actionItems.rows) {
      const mention = await nameToMention(ai.assigned_to);
      msg += `${idx++}. ${mention} ${ai.description}\n`;
    }
    msg += '\n';
  }

  // Highlights
  if (highlights.length > 0) {
    msg += `*💬 Highlights*\n`;
    highlights.forEach((h, i) => {
      const text = h.statement ? `${h.statement} — ${h.why}` : h;
      msg += `${i + 1}. ${text}\n`;
    });
  }

  return msg.trim();
}

// ─── Main ────────────────────────────────────────────────────────────────

async function main() {
  // Support direct channel/DM IDs (start with C, D, or G)
  const channelId = /^[CDG][A-Z0-9]+$/.test(values.channel)
    ? values.channel
    : await findChannel(values.channel);
  if (!channelId) {
    console.error(`Channel ${values.channel} not found`);
    process.exit(1);
  }

  // Join channel (in case bot isn't in it)
  await fetch('https://slack.com/api/conversations.join', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel: channelId }),
  });

  let interactions;

  if (values['interaction-id']) {
    interactions = await db.query('SELECT * FROM interactions WHERE id = $1', [values['interaction-id']]);
  } else if (values.meeting) {
    interactions = await db.query('SELECT * FROM interactions WHERE subject ILIKE $1 ORDER BY occurred_at DESC LIMIT 1', [`%${values.meeting}%`]);
  } else if (values.today) {
    interactions = await db.query("SELECT * FROM interactions WHERE occurred_at::date = CURRENT_DATE ORDER BY occurred_at ASC");
  } else {
    console.error('Specify --meeting, --interaction-id, or --today');
    process.exit(1);
  }

  if (interactions.rows.length === 0) {
    console.log('No meetings found');
    process.exit(0);
  }

  for (const interaction of interactions.rows) {
    const recap = await formatRecap(interaction);
    const result = await postMessage(channelId, recap);
    console.log(`Posted recap for "${interaction.subject}" (ts: ${result.ts})`);
  }
}

try {
  await main();
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
} finally {
  await db.end();
}
