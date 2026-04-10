/**
 * LightRAG dual-write — push ingested content to graph KB.
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
 * Push a document to LightRAG graph store.
 *
 * @param {object} params
 * @param {string} params.title - Document title
 * @param {string} params.content - Full text content
 * @param {string} params.sourceType - article, video, tweet, note
 * @param {string} [params.itemId] - KB item ID for reference
 */
export async function pushToLightRAG({ title, content, sourceType, itemId }) {
  if (!config.LIGHTRAG_URL) {
    console.log('  LightRAG not configured, skipping dual-write');
    return null;
  }

  try {
    const token = await getToken();

    // Prefix content with metadata for better graph extraction
    const docText = `Title: ${title}\nSource: ${sourceType}\n\n${content}`;

    const res = await fetch(`${config.LIGHTRAG_URL}/documents/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ text: docText }),
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
