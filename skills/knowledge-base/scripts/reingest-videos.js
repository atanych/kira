#!/usr/bin/env node

/**
 * Re-ingest videos with broken/missing transcripts.
 *
 * Pulls videos from DB, re-fetches transcripts from YouTube,
 * re-runs AI processing, semantic chunking, and re-embeds.
 *
 * Usage:
 *   node reingest-videos.js                    # show all videos + status (dry run)
 *   node reingest-videos.js --id <uuid>        # re-ingest one video by DB id
 *   node reingest-videos.js --all              # re-ingest all broken videos
 *   node reingest-videos.js --threshold 5000   # custom "broken" threshold (default: 5000 chars)
 */

import { parseArgs } from 'node:util';
import db from '../src/db.js';
import { embed, embedBatch, buildEmbeddingText } from '../src/embeddings.js';
import { processContent, semanticSplit } from '../src/ai.js';
import { chunkTranscript, chunkTranscriptSemantic } from '../src/chunker.js';
import { extractYouTube } from '../src/extractors/youtube.js';
import { translateToEnglishIfNeeded, translateShort } from '../src/translation.js';
import { pushToLightRAG } from '../src/lightrag.js';

const { values } = parseArgs({
  options: {
    id:        { type: 'string' },
    all:       { type: 'boolean', default: false },
    threshold: { type: 'string', default: '5000' },
    'dry-run': { type: 'boolean', default: false },
    'no-lightrag': { type: 'boolean', default: false },
  },
});

const THRESHOLD = parseInt(values.threshold);

async function listVideos() {
  const res = await db.query(`
    SELECT id, title, url, LENGTH(content) as content_len, created_at
    FROM knowledge_items
    WHERE source_type = 'video'
    ORDER BY content_len ASC
  `);
  return res.rows;
}

async function reingestVideo(video, dryRun = false) {
  console.log(`\n── Re-ingesting: ${video.title}`);
  console.log(`   URL: ${video.url}`);
  console.log(`   Current content: ${video.content_len} chars`);

  if (!video.url) {
    console.log('   ❌ No URL stored, skipping');
    return null;
  }

  // Fetch fresh transcript from YouTube
  console.log('   Fetching fresh transcript...');
  let extracted;
  try {
    extracted = await extractYouTube(video.url);
  } catch (err) {
    console.error(`   ❌ Failed to extract: ${err.message}`);
    return null;
  }

  const newLen = extracted.content.length;
  console.log(`   Fresh transcript: ${newLen} chars`);

  if (newLen <= video.content_len) {
    console.log(`   ⚠️  Fresh transcript is same size or shorter — skipping`);
    return null;
  }

  console.log(`   📈 ${video.content_len} → ${newLen} chars (+${newLen - video.content_len})`);

  if (dryRun) {
    console.log('   [DRY RUN] Would re-ingest');
    return { title: video.title, oldLen: video.content_len, newLen };
  }

  let content = extracted.content;

  // Translation
  content = await translateToEnglishIfNeeded(content, extracted.title);
  const translatedTitle = await translateShort(extracted.title);

  // AI processing (summary, tags, entities)
  console.log('   Running AI processing...');
  const ai = await processContent({
    title: translatedTitle || extracted.title,
    content,
    sourceType: 'video',
  });

  // Embedding for the item
  console.log('   Generating item embedding...');
  const embeddingText = buildEmbeddingText(translatedTitle || extracted.title, ai.summary, ai.tags);
  const itemEmbedding = await embed(embeddingText);

  // Update the item
  console.log('   Updating item in DB...');
  await db.query(`
    UPDATE knowledge_items SET
      content = $1,
      summary = $2,
      tags = $3,
      entities = $4,
      embedding = $5
    WHERE id = $6
  `, [
    content,
    ai.summary,
    ai.tags,
    ai.entities,
    JSON.stringify(itemEmbedding),
    video.id,
  ]);

  // Delete old chunks
  const oldChunks = await db.query(
    'DELETE FROM knowledge_chunks WHERE item_id = $1 RETURNING id',
    [video.id]
  );
  console.log(`   Deleted ${oldChunks.rowCount} old chunks`);

  // Semantic chunking
  let chunks;
  let chunkingMethod = 'timestamp';
  if (extracted.transcript && extracted.transcript.length > 0) {
    console.log('   Attempting semantic chunking...');
    try {
      const sections = await semanticSplit({
        title: translatedTitle || extracted.title,
        segments: extracted.transcript,
      });
      if (sections && sections.length > 0) {
        chunks = chunkTranscriptSemantic(extracted.transcript, sections);
        chunkingMethod = 'semantic';
        console.log(`   Semantic split: ${sections.length} topical sections`);
      } else {
        chunks = chunkTranscript(extracted.transcript);
        console.log('   Semantic split returned nothing, using timestamp chunking');
      }
    } catch (err) {
      console.warn(`   Semantic chunking failed: ${err.message}`);
      chunks = chunkTranscript(extracted.transcript);
    }
  } else {
    // Flat text from Gemini — no segments, use text chunking
    const { chunkText } = await import('../src/chunker.js');
    chunks = chunkText(content);
    chunkingMethod = 'text';
    console.log('   No segments available, using text chunking');
  }

  // Embed and save chunks
  if (chunks.length > 0) {
    console.log(`   Embedding ${chunks.length} chunks (${chunkingMethod})...`);
    const chunkTexts = chunks.map(c => c.chunkText);
    const chunkEmbeddings = await embedBatch(chunkTexts);

    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      await db.query(`
        INSERT INTO knowledge_chunks
          (item_id, chunk_index, chunk_text, embedding, timestamp_start, timestamp_end)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        video.id,
        c.chunkIndex,
        c.chunkText,
        JSON.stringify(chunkEmbeddings[i]),
        c.timestampStart || null,
        c.timestampEnd || null,
      ]);
    }
    console.log(`   ${chunks.length} chunks saved`);
  }

  // LightRAG re-push
  if (!values['no-lightrag']) {
    console.log('   Pushing to LightRAG...');
    await pushToLightRAG({
      title: translatedTitle || extracted.title,
      content,
      sourceType: 'video',
      itemId: video.id,
      force: true,
    });
  }

  // Truncation warning
  if (ai.truncated) {
    const pct = Math.round((ai.processedLength / ai.originalLength) * 100);
    console.log(`   ⚠️  AI processed ${pct}% of content (${ai.originalLength} chars total)`);
  }

  console.log(`   ✅ Done — ${chunks.length} chunks (${chunkingMethod})`);

  return {
    title: video.title,
    oldLen: video.content_len,
    newLen,
    chunks: chunks.length,
    chunkingMethod,
  };
}

async function main() {
  try {
    const videos = await listVideos();

    if (!values.id && !values.all) {
      // List mode — show status of all videos
      console.log(`Found ${videos.length} videos:\n`);
      let brokenCount = 0;
      for (const v of videos) {
        const broken = v.content_len < THRESHOLD;
        const flag = broken ? '❌' : '✅';
        if (broken) brokenCount++;
        console.log(`  ${flag} ${v.content_len.toString().padStart(6)} chars | ${v.title}`);
      }
      console.log(`\n${brokenCount} video(s) likely have broken/missing transcripts (< ${THRESHOLD} chars)`);
      console.log('Use --id <uuid> to re-ingest one, or --all to re-ingest all broken ones');
      return;
    }

    if (values.id) {
      const video = videos.find(v => v.id === values.id);
      if (!video) {
        console.error(`Video not found: ${values.id}`);
        process.exit(1);
      }
      await reingestVideo(video, values['dry-run']);
    }

    if (values.all) {
      const broken = videos.filter(v => v.content_len < THRESHOLD);
      console.log(`Found ${broken.length} broken video(s) to re-ingest\n`);
      const results = [];
      for (const video of broken) {
        const result = await reingestVideo(video, values['dry-run']);
        if (result) results.push(result);
      }
      console.log(`\n── Summary: ${results.length}/${broken.length} videos re-ingested`);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  } finally {
    await db.end();
  }
}

main();
