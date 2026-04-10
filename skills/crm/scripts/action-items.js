#!/usr/bin/env node

/**
 * CRM Action Items Manager
 *
 * Usage:
 *   node action-items.js                          # list pending
 *   node action-items.js --status approved         # list approved
 *   node action-items.js --meeting <interaction_id> # items from specific meeting
 *   node action-items.js --approve 1,3,5           # approve by index (from last listing)
 *   node action-items.js --reject 2,4              # reject by index
 *   node action-items.js --complete 1              # mark as completed
 */

import { parseArgs } from 'node:util';
import db from '../src/db.js';

const { values } = parseArgs({
  options: {
    status:   { type: 'string', default: 'pending' },
    meeting:  { type: 'string' },
    approve:  { type: 'string' },
    reject:   { type: 'string' },
    complete: { type: 'string' },
    limit:    { type: 'string', default: '20' },
  },
});

async function listItems(status, meetingId, limit) {
  let where = 'WHERE 1=1';
  const params = [];
  let idx = 1;

  if (status && status !== 'all') {
    where += ` AND ai.status = $${idx++}`;
    params.push(status);
  }
  if (meetingId) {
    where += ` AND ai.interaction_id = $${idx++}`;
    params.push(meetingId);
  }

  params.push(parseInt(limit));

  const res = await db.query(`
    SELECT ai.id, ai.description, ai.status, ai.owner, ai.due_date,
           ai.approved, ai.created_at, ai.completed_at,
           c.name AS assigned_to_name, i.subject AS meeting_subject
    FROM action_items ai
    LEFT JOIN contacts c ON c.id = ai.assigned_to
    LEFT JOIN interactions i ON i.id = ai.interaction_id
    ${where}
    ORDER BY ai.created_at DESC
    LIMIT $${idx}
  `, params);

  return res.rows;
}

async function updateItems(ids, field, value) {
  for (const id of ids) {
    const updates = { [field]: value };
    if (field === 'status' && value === 'completed') {
      updates.completed_at = new Date().toISOString();
    }
    const setClauses = Object.entries(updates).map(([k, v], i) => `${k} = $${i + 2}`).join(', ');
    const vals = Object.values(updates);
    await db.query(`UPDATE action_items SET ${setClauses} WHERE id = $1`, [id, ...vals]);
  }
}

async function main() {
  try {
    // Handle approve/reject/complete
    if (values.approve || values.reject || values.complete) {
      // First get the current listing to map indices to IDs
      const items = await listItems(values.status, values.meeting, '100');

      if (values.approve) {
        const indices = values.approve.split(',').map(n => parseInt(n.trim()) - 1);
        const ids = indices.filter(i => i >= 0 && i < items.length).map(i => items[i].id);
        if (ids.length > 0) {
          await updateItems(ids, 'approved', true);
          console.log(`Approved ${ids.length} item(s)`);
        }
      }

      if (values.reject) {
        const indices = values.reject.split(',').map(n => parseInt(n.trim()) - 1);
        const ids = indices.filter(i => i >= 0 && i < items.length).map(i => items[i].id);
        if (ids.length > 0) {
          await updateItems(ids, 'approved', false);
          console.log(`Rejected ${ids.length} item(s)`);
        }
      }

      if (values.complete) {
        const indices = values.complete.split(',').map(n => parseInt(n.trim()) - 1);
        const ids = indices.filter(i => i >= 0 && i < items.length).map(i => items[i].id);
        if (ids.length > 0) {
          await updateItems(ids, 'status', 'completed');
          console.log(`Completed ${ids.length} item(s)`);
        }
      }
      return;
    }

    // List items
    const items = await listItems(values.status, values.meeting, values.limit);

    if (items.length === 0) {
      console.log(`No ${values.status} action items found.`);
      return;
    }

    console.log(`Action Items (${values.status}) — ${items.length} found:\n`);
    items.forEach((a, i) => {
      const approved = a.approved === true ? ' [approved]' : a.approved === false ? ' [rejected]' : '';
      console.log(`${i + 1}. [${a.owner}] ${a.description}${approved}`);
      console.log(`   Assigned: ${a.assigned_to_name || 'unassigned'} | Due: ${a.due_date || 'no date'} | Status: ${a.status}`);
      if (a.meeting_subject) console.log(`   From: ${a.meeting_subject}`);
      console.log();
    });

  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  } finally {
    await db.end();
  }
}

main();
