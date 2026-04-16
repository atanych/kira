#!/usr/bin/env node

/**
 * CRM Semantic Search
 *
 * Usage:
 *   node search.js "John Smith"
 *   node search.js "product roadmap" --type meetings
 *   node search.js "AI strategy" --type context --limit 10
 *   node search.js "pending tasks" --type actions
 */

import { parseArgs } from 'node:util';
import db from '../src/db.js';
import { embed } from '../src/embeddings.js';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    type:   { type: 'string' },  // contacts, meetings, context, actions, all
    limit:  { type: 'string', default: '5' },
    author: { type: 'string' },
  },
});

const query = positionals.join(' ');
if (!query) {
  console.error('Usage: node search.js "query" [--type contacts|meetings|context|actions] [--limit N]');
  process.exit(1);
}

const limit = parseInt(values.limit);
const searchType = values.type || 'all';

async function searchContacts(queryEmbedding, limit) {
  const res = await db.query(`
    SELECT id, name, email, company, role, team, health_score, interaction_count,
           last_interaction_at, notes,
           (1 - (embedding <=> $1::vector))::FLOAT AS similarity
    FROM contacts
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> $1::vector
    LIMIT $2
  `, [JSON.stringify(queryEmbedding), limit]);
  return res.rows;
}

async function searchMeetings(queryEmbedding, limit) {
  const res = await db.query(`
    SELECT i.id, i.subject, i.summary, i.occurred_at, i.duration_minutes, i.source_id,
           (1 - (i.embedding <=> $1::vector))::FLOAT AS similarity
    FROM interactions i
    WHERE i.embedding IS NOT NULL
    ORDER BY i.embedding <=> $1::vector
    LIMIT $2
  `, [JSON.stringify(queryEmbedding), limit]);
  return res.rows;
}

async function searchContext(queryEmbedding, limit) {
  const res = await db.query(`
    SELECT cc.id, cc.content, cc.direction, cc.topic_tags, cc.sentiment, cc.occurred_at,
           c.name AS contact_name, i.subject AS meeting_subject,
           (1 - (cc.embedding <=> $1::vector))::FLOAT AS similarity
    FROM contact_context cc
    JOIN contacts c ON c.id = cc.contact_id
    LEFT JOIN interactions i ON i.id = cc.interaction_id
    WHERE cc.embedding IS NOT NULL
    ORDER BY cc.embedding <=> $1::vector
    LIMIT $2
  `, [JSON.stringify(queryEmbedding), limit]);
  return res.rows;
}

async function searchActions(queryText, limit) {
  // Action items don't have embeddings — use text search
  const res = await db.query(`
    SELECT ai.id, ai.description, ai.status, ai.owner, ai.due_date,
           ai.created_at, ai.completed_at,
           c.name AS assigned_to_name, i.subject AS meeting_subject
    FROM action_items ai
    LEFT JOIN contacts c ON c.id = ai.assigned_to
    LEFT JOIN interactions i ON i.id = ai.interaction_id
    WHERE ai.description ILIKE $1
    ORDER BY ai.created_at DESC
    LIMIT $2
  `, [`%${queryText}%`, limit]);
  return res.rows;
}

async function main() {
  try {
    console.log(`Searching CRM: "${query}" (type: ${searchType})\n`);
    const queryEmbedding = await embed(query);

    if (searchType === 'contacts' || searchType === 'all') {
      const contacts = await searchContacts(queryEmbedding, limit);
      if (contacts.length > 0) {
        console.log(`--- Contacts (${contacts.length}) ---`);
        for (const c of contacts) {
          const sim = (c.similarity * 100).toFixed(1);
          console.log(`${c.name} (${sim}% match)`);
          console.log(`  ${c.role || ''} ${c.company ? '@ ' + c.company : ''}`);
          console.log(`  Email: ${c.email || 'n/a'} | Health: ${c.health_score} | Meetings: ${c.interaction_count}`);
          if (c.last_interaction_at) console.log(`  Last seen: ${new Date(c.last_interaction_at).toLocaleDateString()}`);
          if (c.notes) console.log(`  Notes: ${c.notes.slice(0, 200)}`);
          console.log();
        }
      }
    }

    if (searchType === 'meetings' || searchType === 'all') {
      const meetings = await searchMeetings(queryEmbedding, limit);
      if (meetings.length > 0) {
        console.log(`--- Meetings (${meetings.length}) ---`);
        for (const m of meetings) {
          const sim = (m.similarity * 100).toFixed(1);
          console.log(`${m.subject} (${sim}% match)`);
          console.log(`  Date: ${new Date(m.occurred_at).toLocaleDateString()} | Duration: ${m.duration_minutes || '?'}min`);
          if (m.summary) console.log(`  ${m.summary.slice(0, 300)}${m.summary.length > 300 ? '...' : ''}`);
          console.log();
        }
      }
    }

    if (searchType === 'context' || searchType === 'all') {
      const context = await searchContext(queryEmbedding, limit);
      if (context.length > 0) {
        console.log(`--- Context (${context.length}) ---`);
        for (const cc of context) {
          const sim = (cc.similarity * 100).toFixed(1);
          console.log(`${cc.contact_name} — ${cc.meeting_subject || 'unknown meeting'} (${sim}% match)`);
          console.log(`  ${cc.content.slice(0, 300)}${cc.content.length > 300 ? '...' : ''}`);
          if (cc.topic_tags?.length) console.log(`  Tags: ${cc.topic_tags.join(', ')}`);
          if (cc.sentiment) console.log(`  Sentiment: ${cc.sentiment}`);
          console.log();
        }
      }
    }

    if (searchType === 'actions' || searchType === 'all') {
      const actions = await searchActions(query, limit);
      if (actions.length > 0) {
        console.log(`--- Action Items (${actions.length}) ---`);
        for (const a of actions) {
          const status = a.status;
          console.log(`[${status}] ${a.description}`);
          console.log(`  Owner: ${a.owner} | Assigned: ${a.assigned_to_name || 'unassigned'} | Due: ${a.due_date || 'no date'}`);
          if (a.meeting_subject) console.log(`  From: ${a.meeting_subject}`);
          console.log();
        }
      }
    }

  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  } finally {
    await db.end();
  }
}

main();
