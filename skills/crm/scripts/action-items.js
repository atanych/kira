#!/usr/bin/env node

/**
 * CRM Action Items Manager
 *
 * Statuses: pending → approved / rejected / completed
 *
 * Usage:
 *   node action-items.js                          # list pending (unreviewed)
 *   node action-items.js --status approved         # list approved
 *   node action-items.js --status all              # list all non-rejected
 *   node action-items.js --meeting <interaction_id> # items from specific meeting
 *   node action-items.js --approve 1,3,5           # approve by index
 *   node action-items.js --reject 2,4              # reject by index
 *   node action-items.js --complete 1              # mark as completed
 *   node action-items.js --group-by-person         # two sections: approved + pending (needs review)
 *   node action-items.js --limit 200               # override default limit
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
    'group-by-person':  { type: 'boolean', default: false },
    limit:    { type: 'string', default: '200' },
  },
});

function fmtDate(d) {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt)) return null;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[dt.getUTCMonth()]} ${dt.getUTCDate()}`;
}

async function listItems(status, meetingId, limit) {
  let where = 'WHERE 1=1';
  const params = [];
  let idx = 1;

  if (status === 'all') {
    // Show everything except rejected
    where += ` AND ai.status != 'rejected'`;
  } else if (status) {
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
           ai.created_at, ai.completed_at,
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

async function updateItems(ids, status) {
  for (const id of ids) {
    const updates = { status };
    if (status === 'completed') {
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
      // When group-by-person, we need both approved + pending to correctly index
      const listStatus = values['group-by-person'] ? 'all' : values.status;
      const items = await listItems(listStatus, values.meeting, '500');

      // When group-by-person, indices refer to the "pending" section only
      const indexableItems = values['group-by-person']
        ? items.filter(a => a.status === 'pending')
        : items;

      if (values.approve) {
        const indices = values.approve.split(',').map(n => parseInt(n.trim()) - 1);
        const ids = indices.filter(i => i >= 0 && i < indexableItems.length).map(i => indexableItems[i].id);
        if (ids.length > 0) {
          await updateItems(ids, 'approved');
          console.log(`Approved ${ids.length} item(s)`);
        }
      }

      if (values.reject) {
        const indices = values.reject.split(',').map(n => parseInt(n.trim()) - 1);
        const ids = indices.filter(i => i >= 0 && i < indexableItems.length).map(i => indexableItems[i].id);
        if (ids.length > 0) {
          await updateItems(ids, 'rejected');
          console.log(`Rejected ${ids.length} item(s)`);
        }
      }

      if (values.complete) {
        const indices = values.complete.split(',').map(n => parseInt(n.trim()) - 1);
        const ids = indices.filter(i => i >= 0 && i < indexableItems.length).map(i => indexableItems[i].id);
        if (ids.length > 0) {
          await updateItems(ids, 'completed');
          console.log(`Completed ${ids.length} item(s)`);
        }
      }
      return;
    }

    // List items — group-by-person shows approved + pending together
    const listStatus = values['group-by-person'] ? 'all' : values.status;
    const items = await listItems(listStatus, values.meeting, values.limit);

    if (items.length === 0) {
      console.log(`No ${values.status} action items found.`);
      return;
    }

    if (values['group-by-person']) {
      const approvedItems = items.filter(a => a.status === 'approved');
      const pendingItems = items.filter(a => a.status === 'pending');

      // Count overdue
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const overdueItems = items.filter(a => a.due_date && new Date(a.due_date) < today);
      const overdueSuffix = overdueItems.length > 0
        ? `, ${overdueItems.length} overdue`
        : '';

      console.log(`📊 ${items.length} items — ${approvedItems.length} approved, ${pendingItems.length} needs review${overdueSuffix}\n`);

      // Section 1: Approved — grouped by person
      if (approvedItems.length > 0) {
        console.log('✅ APPROVED:\n');
        const groups = {};
        for (const a of approvedItems) {
          const name = a.assigned_to_name || 'Unassigned';
          if (!groups[name]) groups[name] = [];
          groups[name].push(a);
        }
        for (const [person, personItems] of Object.entries(groups)) {
          console.log(`👤 ${person}:`);
          for (const a of personItems) {
            const due = fmtDate(a.due_date) ? ` | Due: ${fmtDate(a.due_date)}` : '';
            console.log(`• ${a.description}${due}`);
          }
          console.log();
        }
      }

      // Section 2: Pending — numbered for approve/reject
      if (pendingItems.length > 0) {
        console.log('⏳ NEEDS REVIEW:\n');
        pendingItems.forEach((a, i) => {
          const name = a.assigned_to_name || 'unassigned';
          const due = fmtDate(a.due_date) ? ` | Due: ${fmtDate(a.due_date)}` : '';
          console.log(`${i + 1}. ${a.description} (${name})${due}`);
        });
        console.log();
        console.log('👆 Approve or reject items by number.');
      }
    } else {
      console.log(`Action Items (${values.status}) — ${items.length} found:\n`);
      items.forEach((a, i) => {
        console.log(`${i + 1}. [${a.owner}] ${a.description}`);
        console.log(`   Assigned: ${a.assigned_to_name || 'unassigned'} | Due: ${fmtDate(a.due_date) || 'no date'} | Status: ${a.status}`);
        if (a.meeting_subject) console.log(`   From: ${a.meeting_subject}`);
        console.log();
      });
    }

  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  } finally {
    await db.end();
  }
}

main();
