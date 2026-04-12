#!/usr/bin/env node

/**
 * Knowledge Base Ingestion Script
 *
 * Usage:
 *   node ingest.js <url> [options]
 *   node ingest.js --note "some text" [options]
 *
 * Options:
 *   --tags <tag1,tag2>     Manual tags
 *   --title <title>        Override title
 *   --type <source_type>   Override detected type
 *   --note <text>          Ingest raw text instead of URL
 *   --content <text>       Provide pre-fetched content
 *   --dry-run              Show what would be ingested
 *   --no-linked            Don't follow links in tweets
 *   --force                Override quarantine
 *   --no-lightrag          Skip LightRAG dual-write
 */

import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import db from '../src/db.js';
import { embed, embedBatch, buildEmbeddingText } from '../src/embeddings.js';
import { processContent, semanticSplit } from '../src/ai.js';
import { chunkText, chunkTranscript, chunkTranscriptSemantic } from '../src/chunker.js';
import { isYouTubeUrl, extractYouTube } from '../src/extractors/youtube.js';
import { isTwitterUrl, extractTwitter } from '../src/extractors/twitter.js';
import { parseArticle } from '../src/extractors/article.js';
import { extractNote } from '../src/extractors/note.js';
import { scan as securityScan } from '../src/security.js';
import { translateToEnglishIfNeeded, translateShort } from '../src/translation.js';
import { pushToLightRAG } from '../src/lightrag.js';

// Re-export db so callers can close the pool
export { db };

/**
 * Fetch and strip a URL to plain text.
 */
export async function fetchContent(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KnowledgeBase/1.0)' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);

  const html = await res.text();
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : null;

  return { title, content: text, url };
}

/**
 * Detect content type and extract.
 */
export async function extractContent(url, { note, title, content: preContent } = {}) {
  if (note) {
    console.log('Ingesting note...');
    return extractNote(note, title);
  }

  if (!url) return null;

  if (isYouTubeUrl(url)) {
    console.log(`Extracting YouTube video: ${url}`);
    const extracted = await extractYouTube(url);
    extracted.url = url;
    return extracted;
  }

  if (isTwitterUrl(url)) {
    console.log(`Extracting tweet: ${url}`);
    const extracted = await extractTwitter(url);
    extracted.url = url;
    return extracted;
  }

  if (preContent) {
    console.log(`Processing pre-fetched article: ${url}`);
    const extracted = parseArticle({ title, content: preContent, url });
    extracted.url = url;
    return extracted;
  }

  console.log(`Fetching article: ${url}`);
  const fetched = await fetchContent(url);
  const extracted = parseArticle(fetched);
  extracted.url = url;
  return extracted;
}

/**
 * Ingest a single extracted item into the knowledge base.
 */
export async function ingestItem(extracted, parentId = null, options = {}) {
  const {
    titleOverride,
    typeOverride,
    userTags = [],
    dryRun = false,
    force = false,
    noLightrag = false,
  } = options;

  const {
    title, content: rawContent, author, publishedAt, sourceType,
    transcript, url: itemUrl, metadata,
  } = extracted;
  let content = rawContent;

  // Check for duplicate
  if (itemUrl) {
    const existing = await db.query(
      'SELECT id, title FROM knowledge_items WHERE url = $1', [itemUrl]
    );
    if (existing.rows.length > 0) {
      console.log(`Already exists: "${existing.rows[0].title}" (${existing.rows[0].id})`);
      return existing.rows[0].id;
    }
  }

  // Translation
  content = await translateToEnglishIfNeeded(content, title);
  const translatedTitle = await translateShort(title);
  const translatedAuthor = await translateShort(author);
  if (translatedTitle !== title) { extracted.title = translatedTitle; console.log(`  Title translated: ${translatedTitle}`); }
  if (translatedAuthor !== author) { extracted.author = translatedAuthor; console.log(`  Author translated: ${translatedAuthor}`); }

  // Security scan
  console.log('Security scan...');
  const secResult = await securityScan(content, { skipFrontier: false });
  if (!secResult.safe) {
    const level = secResult.score > 60 ? 'INJECTION DETECTED' : 'SUSPICIOUS';
    console.warn(`  ${level} (score: ${secResult.score}/100)`);
    if (secResult.flags.length > 0) console.warn(`  Flags: ${secResult.flags.join(', ')}`);
    if (secResult.score > 60) {
      console.error('  Content quarantined. Use --force to override.');
      if (!force) return null;
      console.warn('  --force used, proceeding with sanitized content');
    }
    content = secResult.sanitized;
  } else {
    console.log(`  Clean (score: ${secResult.score}/100)`);
  }

  // AI processing
  console.log('Processing with AI...');
  const ai = await processContent({ title: translatedTitle || title, content, sourceType, userTags });

  const finalTitle = titleOverride || translatedTitle || title;
  const finalType = typeOverride || sourceType;
  const finalAuthor = translatedAuthor || author || ai.author || null;

  if (dryRun) {
    console.log('\nDRY RUN — would ingest:');
    console.log(`  Title: ${finalTitle}`);
    console.log(`  Type: ${finalType}`);
    console.log(`  Author: ${finalAuthor}`);
    console.log(`  Tags: ${ai.tags.join(', ')}`);
    console.log(`  Entities: ${ai.entities.join(', ')}`);
    console.log(`  Summary: ${ai.summary}`);
    console.log(`  Content length: ${content.length} chars`);
    return null;
  }

  // Embeddings
  console.log('Generating embeddings...');
  const embeddingText = buildEmbeddingText(finalTitle, ai.summary, ai.tags);
  const itemEmbedding = await embed(embeddingText);

  // Insert item
  console.log('Saving to database...');
  const insertResult = await db.query(`
    INSERT INTO knowledge_items
      (url, title, content, content_length, summary, source_type, tags, entities,
       embedding, author, published_at, parent_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING id
  `, [
    itemUrl || null,
    finalTitle,
    content,
    content.length,
    ai.summary,
    finalType,
    ai.tags,
    ai.entities,
    JSON.stringify(itemEmbedding),
    finalAuthor,
    publishedAt || null,
    parentId,
  ]);

  const itemId = insertResult.rows[0].id;
  console.log(`Item saved: ${itemId}`);

  // Chunk content
  let chunks;
  let chunkingMethod = 'text';
  if (sourceType === 'video' && transcript && transcript.length > 0) {
    // Try semantic chunking first
    console.log('Attempting semantic chunking...');
    try {
      const sections = await semanticSplit({ title: finalTitle, segments: transcript });
      if (sections && sections.length > 0) {
        chunks = chunkTranscriptSemantic(transcript, sections);
        chunkingMethod = 'semantic';
        console.log(`  Semantic split: ${sections.length} topical sections`);
      } else {
        chunks = chunkTranscript(transcript);
        chunkingMethod = 'timestamp';
        console.log('  Semantic split returned nothing, falling back to timestamp chunking');
      }
    } catch (err) {
      console.warn(`  Semantic chunking failed: ${err.message}`);
      chunks = chunkTranscript(transcript);
      chunkingMethod = 'timestamp';
      console.log('  Falling back to timestamp chunking');
    }
  } else {
    chunks = chunkText(content);
  }

  if (chunks.length > 0) {
    console.log(`Creating ${chunks.length} chunks...`);
    const chunkTexts = chunks.map(c => c.chunkText);
    const chunkEmbeddings = await embedBatch(chunkTexts);

    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      await db.query(`
        INSERT INTO knowledge_chunks
          (item_id, chunk_index, chunk_text, embedding, timestamp_start, timestamp_end)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        itemId,
        c.chunkIndex,
        c.chunkText,
        JSON.stringify(chunkEmbeddings[i]),
        c.timestampStart || null,
        c.timestampEnd || null,
      ]);
    }
    console.log(`${chunks.length} chunks embedded and saved`);
  }

  // LightRAG dual-write
  let lightragOk = false;
  if (!noLightrag) {
    console.log('Pushing to LightRAG...');
    await pushToLightRAG({ title: finalTitle, author: finalAuthor, content, sourceType: finalType, itemId });
    lightragOk = true;
  }

  // Summary
  console.log('\n── Ingestion Summary ──');
  console.log(`  Item ID:    ${itemId}`);
  console.log(`  Title:      ${finalTitle}`);
  console.log(`  Type:       ${finalType}`);
  console.log(`  Author:     ${finalAuthor || 'unknown'}`);
  if (metadata?.duration) console.log(`  Duration:   ${metadata.duration}`);
  console.log(`  Length:     ${content.length} chars`);
  console.log(`  pgvector:   ${chunks.length} chunks stored (${chunkingMethod})`);
  console.log(`  LightRAG:   ${lightragOk ? '✓ pushed' : 'skipped'}`);
  console.log(`  Summary:    ${ai.summary}`);
  if (ai.truncated) {
    const pct = Math.round((ai.processedLength / ai.originalLength) * 100);
    console.log(`  ⚠️  AI summary used ${pct}% of content (${ai.originalLength} chars total, truncated to 60k). Summary may not cover the full transcript.`);
  }

  return itemId;
}

// ─── CLI ───────────────────────────────────────────────────────────────────

const isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      tags:          { type: 'string', default: '' },
      title:         { type: 'string' },
      type:          { type: 'string' },
      note:          { type: 'string' },
      content:       { type: 'string' },
      'dry-run':     { type: 'boolean', default: false },
      'no-linked':   { type: 'boolean', default: false },
      'no-lightrag': { type: 'boolean', default: false },
      force:         { type: 'boolean', default: false },
    },
  });

  const url = positionals[0];
  const userTags = values.tags ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

  const cliOptions = {
    titleOverride: values.title,
    typeOverride: values.type,
    userTags,
    dryRun: values['dry-run'],
    force: values.force,
    noLightrag: values['no-lightrag'],
  };

  async function main() {
    try {
      if (!values.note && !url) {
        console.error('Usage: node ingest.js <url> [options]');
        console.error('       node ingest.js --note "text" [options]');
        process.exit(1);
      }

      const extracted = await extractContent(url, {
        note: values.note,
        title: values.title,
        content: values.content,
      });

      if (!extracted) process.exit(1);

      const itemId = await ingestItem(extracted, null, cliOptions);

      // Handle linked URLs from tweets
      if (extracted.linkedUrls && extracted.linkedUrls.length > 0 && !values['no-linked']) {
        console.log(`\nFound ${extracted.linkedUrls.length} linked URL(s) in tweet`);
        for (const linkedUrl of extracted.linkedUrls) {
          console.log(`\nIngesting linked: ${linkedUrl}`);
          try {
            const linkedExtracted = await extractContent(linkedUrl);
            await ingestItem(linkedExtracted, itemId, cliOptions);
          } catch (err) {
            console.warn(`Failed to ingest linked URL ${linkedUrl}: ${err.message}`);
          }
        }
      }

      console.log('\nIngestion complete!');
    } catch (err) {
      console.error(`\nError: ${err.message}`);
      process.exit(1);
    } finally {
      await db.end();
    }
  }

  main();
}
