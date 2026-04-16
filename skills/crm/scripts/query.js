#!/usr/bin/env node

/**
 * CRM Natural Language Query
 *
 * Searches across contacts, meetings, context, and action items,
 * then synthesizes an answer using LLM.
 *
 * Usage:
 *   node query.js "what did we discuss with John last week?"
 *   node query.js "who is responsible for the API redesign?"
 *   node query.js "show me pending action items from yesterday's meeting"
 */

import db from '../src/db.js';
import { embed } from '../src/embeddings.js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env for OPENAI key
function loadEnv() {
  const paths = [resolve(__dirname, '../../../.env'), resolve(__dirname, '../../.env')];
  for (const p of paths) {
    try {
      const content = readFileSync(p, 'utf8');
      for (const line of content.split('\n')) {
        const t = line.trim();
        if (!t || t.startsWith('#')) continue;
        const eq = t.indexOf('=');
        if (eq === -1) continue;
        const k = t.slice(0, eq).trim();
        const v = t.slice(eq + 1).trim();
        if (!process.env[k]) process.env[k] = v;
      }
    } catch {}
  }
}
loadEnv();

const query = process.argv.slice(2).join(' ');
if (!query) {
  console.error('Usage: node query.js "your question about CRM data"');
  process.exit(1);
}

async function gatherContext(queryEmbedding, queryText) {
  const context = [];

  // Search contacts
  const contacts = await db.query(`
    SELECT name, email, company, role, team, health_score, interaction_count, notes,
           (1 - (embedding <=> $1::vector))::FLOAT AS sim
    FROM contacts WHERE embedding IS NOT NULL
    ORDER BY embedding <=> $1::vector LIMIT 3
  `, [JSON.stringify(queryEmbedding)]);
  if (contacts.rows.length > 0) {
    context.push('## Relevant Contacts');
    contacts.rows.forEach(c => {
      context.push(`- ${c.name} (${c.role || ''} @ ${c.company || 'unknown'}) — health: ${c.health_score}, meetings: ${c.interaction_count}${c.notes ? ', notes: ' + c.notes.slice(0, 200) : ''}`);
    });
  }

  // Search meetings
  const meetings = await db.query(`
    SELECT subject, summary, occurred_at, duration_minutes,
           (1 - (embedding <=> $1::vector))::FLOAT AS sim
    FROM interactions WHERE embedding IS NOT NULL
    ORDER BY embedding <=> $1::vector LIMIT 3
  `, [JSON.stringify(queryEmbedding)]);
  if (meetings.rows.length > 0) {
    context.push('\n## Relevant Meetings');
    meetings.rows.forEach(m => {
      context.push(`- ${m.subject} (${new Date(m.occurred_at).toLocaleDateString()}, ${m.duration_minutes || '?'}min)`);
      if (m.summary) context.push(`  Summary: ${m.summary.slice(0, 500)}`);
    });
  }

  // Search context entries
  const ctxEntries = await db.query(`
    SELECT cc.content, cc.sentiment, cc.topic_tags, cc.occurred_at,
           c.name AS contact_name, i.subject AS meeting,
           (1 - (cc.embedding <=> $1::vector))::FLOAT AS sim
    FROM contact_context cc
    JOIN contacts c ON c.id = cc.contact_id
    LEFT JOIN interactions i ON i.id = cc.interaction_id
    WHERE cc.embedding IS NOT NULL
    ORDER BY cc.embedding <=> $1::vector LIMIT 5
  `, [JSON.stringify(queryEmbedding)]);
  if (ctxEntries.rows.length > 0) {
    context.push('\n## Relevant Context');
    ctxEntries.rows.forEach(cc => {
      context.push(`- [${cc.contact_name}] ${cc.content.slice(0, 300)}`);
      if (cc.meeting) context.push(`  From: ${cc.meeting} (${cc.occurred_at ? new Date(cc.occurred_at).toLocaleDateString() : ''})`);
    });
  }

  // Recent action items (text match)
  const actions = await db.query(`
    SELECT ai.description, ai.status, ai.owner, ai.due_date,
           c.name AS assigned_to, i.subject AS meeting
    FROM action_items ai
    LEFT JOIN contacts c ON c.id = ai.assigned_to
    LEFT JOIN interactions i ON i.id = ai.interaction_id
    WHERE ai.description ILIKE $1
    ORDER BY ai.created_at DESC LIMIT 5
  `, [`%${queryText.split(' ').slice(0, 3).join('%')}%`]);
  if (actions.rows.length > 0) {
    context.push('\n## Relevant Action Items');
    actions.rows.forEach(a => {
      context.push(`- [${a.status}] ${a.description} (owner: ${a.owner}, assigned: ${a.assigned_to || 'unassigned'}, due: ${a.due_date || 'none'})`);
    });
  }

  return context.join('\n');
}

async function synthesize(query, context) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: `You are a CRM assistant. Answer the user's question based on the retrieved CRM data below. Be concise and specific. If the data doesn't contain enough info, say so.

Retrieved CRM Data:
${context}`,
        },
        { role: 'user', content: query },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

async function main() {
  try {
    const queryEmbedding = await embed(query);
    const context = await gatherContext(queryEmbedding, query);
    const answer = await synthesize(query, context);
    console.log(answer);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  } finally {
    await db.end();
  }
}

main();
