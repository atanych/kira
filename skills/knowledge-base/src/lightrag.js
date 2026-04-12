/**
 * LightRAG dual-write — push ingested content to graph KB.
 *
 * Dedup strategy:
 * - Each doc is pushed with file_source = itemId (CRM interaction ID or KB item ID)
 * - Before pushing, check if a doc with that file_source already exists
 * - If exists: skip (unless force = true, then delete + re-push)
 * - delete_document API: DELETE /documents/delete_document { doc_ids: [...] }
 */

import { config } from './env.js';

let _token = null;

/**
 * Login to LightRAG and cache the JWT token.
 */
async function getToken() {
  if (_token) return _token;
  if (!config.LIGHTRAG_URL || !config.LIGHTRAG_USERNAME) {
    throw new Error('LIGHTRAG_URL / LIGHTRAG_USERNAME not configured in .env');
  }

  const form = new URLSearchParams();
  form.append('username', config.LIGHTRAG_USERNAME);
  form.append('password', config.LIGHTRAG_PASSWORD);

  const res = await fetch(`${config.LIGHTRAG_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LightRAG login failed: ${res.status} ${err}`);
  }

  const data = await res.json();
  _token = data.access_token || data.token;
  if (!_token) throw new Error('LightRAG login returned no token');
  return _token;
}

/**
 * List all documents in LightRAG (all statuses).
 */
export async function listDocuments() {
  const token = await getToken();
  const res = await fetch(`${config.LIGHTRAG_URL}/documents`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  const docs = [];
  for (const statusDocs of Object.values(data.statuses || {})) {
    if (Array.isArray(statusDocs)) docs.push(...statusDocs);
  }
  return docs;
}

/**
 * Find a document by file_source (our itemId).
 */
export async function findDocBySource(fileSource) {
  const docs = await listDocuments();
  return docs.find(d => d.file_path === fileSource);
}

/**
 * Delete specific documents by their LightRAG IDs.
 */
export async function deleteDocuments(docIds) {
  if (!docIds.length) return null;
  const token = await getToken();
  const res = await fetch(`${config.LIGHTRAG_URL}/documents/delete_document`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ doc_ids: docIds, delete_file: true, delete_llm_cache: true }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.warn(`  LightRAG delete failed: ${res.status} ${err}`);
    return null;
  }
  return res.json();
}

/**
 * Push a document to LightRAG graph store.
 *
 * Uses file_source for dedup:
 * - If a doc with same file_source exists, skip (unless force = true)
 * - On force, delete existing doc first then re-push
 *
 * @param {object} params
 * @param {string} params.title - Document title
 * @param {string} [params.author] - Author name (already translated to English)
 * @param {string} params.content - Full text content
 * @param {string} params.sourceType - article, video, tweet, note, meeting
 * @param {string} [params.itemId] - CRM interaction ID or KB item ID (used as file_source for dedup)
 * @param {boolean} [params.force] - Force re-push (delete existing first)
 */
export async function pushToLightRAG({ title, author, content, sourceType, itemId, force = false }) {
  if (!config.LIGHTRAG_URL) {
    console.log('  LightRAG not configured, skipping dual-write');
    return null;
  }

  try {
    const token = await getToken();
    const fileSource = itemId || title;

    // Dedup: check if doc already exists
    if (!force) {
      const existing = await findDocBySource(fileSource);
      if (existing) {
        console.log(`  LightRAG: already exists, skipping (use force to re-push)`);
        return null;
      }
    } else {
      // Force: delete existing doc first
      const existing = await findDocBySource(fileSource);
      if (existing) {
        console.log(`  LightRAG: deleting existing doc before re-push`);
        await deleteDocuments([existing.id]);
      }
    }

    // Prefix content with metadata + source tag for dedup tracking
    const authorLine = author ? `\nAuthor: ${author}` : '';
    const docText = `Title: ${title}${authorLine}\nSource: ${sourceType}\n\n${content}`;

    const res = await fetch(`${config.LIGHTRAG_URL}/documents/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ text: docText, file_source: fileSource }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.warn(`  LightRAG push failed: ${res.status} ${err}`);
      return null;
    }

    const data = await res.json();
    console.log(`  LightRAG: document pushed`);
    return data;
  } catch (err) {
    console.warn(`  LightRAG error: ${err.message}`);
    return null;
  }
}

/**
 * Query LightRAG graph store.
 *
 * @param {string} query - Search query
 * @param {object} [options]
 * @param {string} [options.mode] - Search mode: 'hybrid', 'local', 'global', 'naive'
 * @returns {Promise<string|null>} - LightRAG response text
 */
export async function queryLightRAG(query, { mode = 'hybrid' } = {}) {
  if (!config.LIGHTRAG_URL) return null;

  try {
    const token = await getToken();

    const res = await fetch(`${config.LIGHTRAG_URL}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ query, mode }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.warn(`  LightRAG query failed: ${res.status} ${err}`);
      return null;
    }

    const data = await res.json();
    return data.response || data.result || null;
  } catch (err) {
    console.warn(`  LightRAG query error: ${err.message}`);
    return null;
  }
}
