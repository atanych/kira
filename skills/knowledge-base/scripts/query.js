#!/usr/bin/env node

/**
 * Knowledge Base Query Script
 *
 * Usage:
 *   node query.js "search query"
 *   node query.js "AI agents" --limit 10 --type article
 *   node query.js "fine-tuning" --tags ai,llm
 *   node query.js "Hermes" --author "Matt Berman"
 *   node query.js "planning" --chunks
 *   node query.js "planning" --graph
 *   node query.js "planning" --all
 */

import { parseArgs } from 'node:util';
import db from '../src/db.js';
import { embed } from '../src/embeddings.js';
import { queryLightRAG } from '../src/lightrag.js';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    limit:     { type: 'string', default: '5' },
    threshold: { type: 'string', default: '0.3' },
    tags:      { type: 'string' },
    type:      { type: 'string' },
    author:    { type: 'string' },
    full:      { type: 'boolean', default: false },
    chunks:    { type: 'boolean', default: false },
    graph:     { type: 'boolean', default: false },
    all:       { type: 'boolean', default: false },
  },
});

const query = positionals.join(' ');
if (!query) {
  console.error('Usage: node query.js "search query" [options]');
  process.exit(1);
}

async function searchVector(queryText, opts) {
  const queryEmbedding = await embed(queryText);
  const limit = parseInt(opts.limit);
  const threshold = parseFloat(opts.threshold);

  if (opts.chunks) {
    const res = await db.query(
      `SELECT * FROM search_knowledge_chunks($1, $2, $3, $4, $5, $6)`,
      [
        JSON.stringify(queryEmbedding),
        threshold,
        limit,
        opts.type || null,
        opts.tags ? `{${opts.tags}}` : null,
        opts.author || null,
      ]
    );

    if (res.rows.length === 0) {
      console.log('No chunk results found.');
      return;
    }

    console.log(`Found ${res.rows.length} chunk(s):\n`);
    for (const r of res.rows) {
      const sim = (r.similarity * 100).toFixed(1);
      console.log(`${r.title} — chunk #${r.chunk_index} (${sim}% match)`);
      console.log(`  Author: ${r.author || 'unknown'} | Type: ${r.source_type} | Tags: ${(r.tags || []).join(', ')}`);
      if (r.url) {
        let link = r.url;
        if (r.timestamp_start != null && r.timestamp_end != null) {
          const chunkText = r.chunk_text.toLowerCase();
          const queryLower = queryText.toLowerCase();
          const matchIdx = chunkText.indexOf(queryLower.split(' ')[0]);
          const ratio = matchIdx >= 0 ? matchIdx / chunkText.length : 0;
          const ts = Math.floor(parseFloat(r.timestamp_start) + (parseFloat(r.timestamp_end) - parseFloat(r.timestamp_start)) * ratio);
          link += `?t=${ts}s`;
        }
        console.log(`  ${link}`);
      }
      console.log(`  ${r.chunk_text.slice(0, 300)}${r.chunk_text.length > 300 ? '...' : ''}`);
      console.log();
    }
  } else {
    const res = await db.query(
      `SELECT * FROM search_knowledge($1::vector, $2::integer, $3::text, $4::text[], $5::text)`,
      [
        JSON.stringify(queryEmbedding),
        limit,
        opts.type || null,
        opts.tags ? `{${opts.tags}}` : null,
        opts.author || null,
      ]
    );

    if (res.rows.length === 0) {
      console.log('No results found.');
      return;
    }

    console.log(`Found ${res.rows.length} result(s):\n`);
    for (const r of res.rows) {
      const sim = (r.similarity * 100).toFixed(1);
      console.log(`${r.title} (${sim}% match)`);
      console.log(`  Type: ${r.source_type}`);
      console.log(`  Tags: ${(r.tags || []).join(', ')}`);
      if (r.url) console.log(`  ${r.url}`);
      console.log(`  ${r.content?.slice(0, 300)}${(r.content?.length || 0) > 300 ? '...' : ''}`);
      console.log();
    }
  }
}

async function searchGraph(queryText) {
  console.log('LightRAG graph search...\n');
  const result = await queryLightRAG(queryText, { mode: 'hybrid' });
  if (result) {
    console.log('--- Graph Results ---');
    console.log(result);
    console.log();
  } else {
    console.log('No graph results found.');
  }
}

async function main() {
  try {
    console.log(`Searching: "${query}"\n`);

    if (values.graph) {
      await searchGraph(query);
    } else if (values.all) {
      await searchVector(query, values);
      console.log('---\n');
      await searchGraph(query);
    } else {
      await searchVector(query, values);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  } finally {
    await db.end();
  }
}

main();
