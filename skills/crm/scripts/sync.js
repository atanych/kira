#!/usr/bin/env node

/**
 * CRM Grain Sync
 *
 * Usage:
 *   node sync.js                        # sync recent (last 3 days)
 *   node sync.js --days 7               # last 7 days
 *   node sync.js --meeting <grain_id>   # specific recording
 *   node sync.js --dry-run              # show what would sync
 */

import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import db from '../src/db.js';
import { embed } from '../src/embeddings.js';
import { listRecentRecordings, getRecording, getTranscriptText } from '../src/grain.js';
import { extractMeeting } from '../src/extractor.js';

// LightRAG import (optional dual-write)
let pushToLightRAG;
try {
  const lightrag = await import('../../knowledge-base/src/lightrag.js');
  pushToLightRAG = lightrag.pushToLightRAG;
} catch { pushToLightRAG = null; }

const { values } = parseArgs({
  options: {
    days:      { type: 'string', default: '3' },
    meeting:   { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
    force:     { type: 'boolean', default: false },
  },
});

/**
 * Extract participant names from transcript text.
 */
function extractParticipants(transcript) {
  const names = new Set();
  const lines = transcript.split('\n');
  for (const line of lines) {
    const match = line.match(/^([^:]{2,40}):/);
    if (match) {
      const name = match[1].trim();
      // Filter out timestamps and non-names
      if (name && !name.match(/^\d/) && name.length < 40) {
        names.add(name);
      }
    }
  }
  return [...names];
}

/**
 * Upsert a contact by name.
 */
async function upsertContact(name, email = null) {
  // Check if exists
  const existing = await db.query(
    'SELECT id FROM contacts WHERE name = $1 OR (email IS NOT NULL AND email = $2)',
    [name, email]
  );
  if (existing.rows.length > 0) {
    // Update last_interaction_at and increment count
    await db.query(`
      UPDATE contacts SET
        last_interaction_at = NOW(),
        interaction_count = interaction_count + 1,
        updated_at = NOW()
      WHERE id = $1
    `, [existing.rows[0].id]);
    return existing.rows[0].id;
  }

  // Insert new contact
  const res = await db.query(`
    INSERT INTO contacts (name, email, first_seen_at, last_interaction_at, interaction_count)
    VALUES ($1, $2, NOW(), NOW(), 1)
    RETURNING id
  `, [name, email]);

  // Generate embedding for new contact
  const contactEmb = await embed(`${name} ${email || ''}`);
  await db.query('UPDATE contacts SET embedding = $1 WHERE id = $2',
    [JSON.stringify(contactEmb), res.rows[0].id]);

  return res.rows[0].id;
}

/**
 * Sync a single Grain recording into CRM.
 */
async function syncRecording(recording, options = {}) {
  const { dryRun = false } = options;

  console.log(`\nSyncing: ${recording.title}`);
  console.log(`  Date: ${recording.start_datetime}`);
  console.log(`  Duration: ${Math.round((recording.duration_ms || 0) / 60000)}min`);

  // Check if already synced
  const existing = await db.query(
    'SELECT id FROM interactions WHERE source_id = $1',
    [recording.id]
  );
  if (existing.rows.length > 0 && !options.force) {
    console.log('  Already synced, skipping (use --force to re-sync)');
    return null;
  }

  // Fetch transcript
  console.log('  Fetching transcript...');
  const transcript = await getTranscriptText(recording.id);
  if (!transcript) {
    console.log('  No transcript available, skipping');
    return null;
  }

  // Extract participants from transcript
  const participants = extractParticipants(transcript);
  console.log(`  Participants: ${participants.join(', ')}`);

  if (dryRun) {
    console.log('  [DRY RUN] Would extract and save');
    return null;
  }

  // AI extraction
  console.log('  Running AI extraction...');
  const extracted = await extractMeeting({
    title: recording.title,
    transcript,
    participants,
    grainSummary: recording.summary,
    intelligenceNotes: recording.intelligence_notes_md,
  });

  console.log(`  Summary: ${extracted.summary?.slice(0, 150)}...`);
  console.log(`  Action items: ${extracted.action_items?.length || 0}`);
  console.log(`  Decisions: ${extracted.decisions?.length || 0}`);
  console.log(`  Context entries: ${extracted.context?.length || 0}`);
  console.log(`  Highlights: ${extracted.highlights?.length || 0}`);

  // Generate interaction embedding
  const interactionEmb = await embed(
    `${recording.title}\n${extracted.summary}\n${(extracted.decisions || []).map(d => d.decision).join('. ')}`
  );

  // Upsert interaction
  let interactionId;
  if (existing.rows.length > 0) {
    interactionId = existing.rows[0].id;
    await db.query(`
      UPDATE interactions SET
        subject = $1, summary = $2, embedding = $3,
        duration_minutes = $4, occurred_at = $5
      WHERE id = $6
    `, [
      recording.title,
      extracted.summary,
      JSON.stringify(interactionEmb),
      Math.round((recording.duration_ms || 0) / 60000),
      recording.start_datetime,
      interactionId,
    ]);
  } else {
    const res = await db.query(`
      INSERT INTO interactions (type, source, source_id, subject, summary, occurred_at, duration_minutes, embedding)
      VALUES ('meeting', 'grain', $1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [
      recording.id,
      recording.title,
      extracted.summary,
      recording.start_datetime,
      Math.round((recording.duration_ms || 0) / 60000),
      JSON.stringify(interactionEmb),
    ]);
    interactionId = res.rows[0].id;
  }

  // Upsert participants + link to interaction
  const contactMap = {};
  for (const name of participants) {
    const contactId = await upsertContact(name);
    contactMap[name] = contactId;

    // Link participant
    const linkExists = await db.query(
      'SELECT id FROM interaction_participants WHERE interaction_id = $1 AND contact_id = $2',
      [interactionId, contactId]
    );
    if (linkExists.rows.length === 0) {
      await db.query(
        'INSERT INTO interaction_participants (interaction_id, contact_id, role) VALUES ($1, $2, $3)',
        [interactionId, contactId, 'attendee']
      );
    }
  }

  // Save action items
  if (extracted.action_items?.length > 0) {
    // Clear old action items for this interaction if re-syncing
    if (existing.rows.length > 0) {
      await db.query('DELETE FROM action_items WHERE interaction_id = $1', [interactionId]);
    }

    for (const ai of extracted.action_items) {
      const assignedTo = ai.assigned_to ? contactMap[ai.assigned_to] || null : null;
      await db.query(`
        INSERT INTO action_items (interaction_id, assigned_to, owner, description, status, due_date)
        VALUES ($1, $2, $3, $4, 'pending', $5)
      `, [
        interactionId,
        assignedTo,
        ai.owner || 'them',
        ai.description,
        ai.due_date || null,
      ]);
    }
  }

  // Save per-person context
  if (extracted.context?.length > 0) {
    for (const ctx of extracted.context) {
      const contactId = contactMap[ctx.person];
      if (!contactId) continue;

      // Check for existing context entry
      const ctxExists = await db.query(
        'SELECT id FROM contact_context WHERE contact_id = $1 AND interaction_id = $2',
        [contactId, interactionId]
      );

      const ctxEmb = await embed(ctx.content);

      if (ctxExists.rows.length > 0) {
        await db.query(`
          UPDATE contact_context SET content = $1, sentiment = $2, topic_tags = $3, embedding = $4
          WHERE id = $5
        `, [ctx.content, ctx.sentiment, ctx.topics || [], JSON.stringify(ctxEmb), ctxExists.rows[0].id]);
      } else {
        await db.query(`
          INSERT INTO contact_context (contact_id, interaction_id, content, direction, topic_tags, source, source_id, occurred_at, sentiment, embedding)
          VALUES ($1, $2, $3, 'both', $4, 'grain', $5, $6, $7, $8)
        `, [
          contactId,
          interactionId,
          ctx.content,
          ctx.topics || [],
          recording.id,
          recording.start_datetime,
          ctx.sentiment,
          JSON.stringify(ctxEmb),
        ]);
      }
    }
  }

  // Save highlights as context entries with special direction
  if (extracted.highlights?.length > 0) {
    for (const h of extracted.highlights) {
      const speakerContact = h.speaker ? contactMap[h.speaker] : null;
      if (!speakerContact) continue;

      const highlightEmb = await embed(h.statement);
      await db.query(`
        INSERT INTO contact_context (contact_id, interaction_id, content, direction, topic_tags, source, source_id, occurred_at, sentiment, embedding)
        VALUES ($1, $2, $3, 'highlight', $4, 'grain', $5, $6, 'notable', $7)
      `, [
        speakerContact,
        interactionId,
        `${h.statement} — ${h.why}`,
        [],
        recording.id,
        recording.start_datetime,
        JSON.stringify(highlightEmb),
      ]);
    }
  }

  // LightRAG dual-write
  if (pushToLightRAG) {
    console.log('  Pushing to LightRAG...');
    const docText = `Meeting: ${recording.title}\nDate: ${recording.start_datetime}\nParticipants: ${participants.join(', ')}\n\nSummary: ${extracted.summary}\n\nDecisions: ${(extracted.decisions || []).map(d => d.decision).join('. ')}\n\nAction Items: ${(extracted.action_items || []).map(a => `${a.assigned_to}: ${a.description}`).join('. ')}`;
    await pushToLightRAG({ title: recording.title, content: docText, sourceType: 'meeting', itemId: interactionId });
  }

  console.log(`  Done: ${interactionId}`);

  return {
    interactionId,
    summary: extracted.summary,
    actionItems: extracted.action_items || [],
    decisions: extracted.decisions || [],
    highlights: extracted.highlights || [],
  };
}

// ─── CLI ───────────────────────────────────────────────────────────────────

async function main() {
  try {
    if (values.meeting) {
      // Sync specific recording
      console.log(`Fetching recording: ${values.meeting}`);
      const recording = await getRecording(values.meeting);
      await syncRecording(recording, { dryRun: values['dry-run'], force: values.force });
    } else {
      // Sync recent recordings
      const days = parseInt(values.days);
      console.log(`Fetching recordings from last ${days} days...`);
      const recordings = await listRecentRecordings(days);
      console.log(`Found ${recordings.length} recording(s)`);

      for (const recording of recordings) {
        await syncRecording(recording, { dryRun: values['dry-run'], force: values.force });
      }
    }

    console.log('\nSync complete!');
  } catch (err) {
    console.error(`\nError: ${err.message}`);
    process.exit(1);
  } finally {
    await db.end();
  }
}

main();
