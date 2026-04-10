/**
 * Grain API client — fetches recordings, transcripts, and metadata.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function getToken() {
  if (process.env.GRAIN_API_TOKEN) return process.env.GRAIN_API_TOKEN;
  const paths = [resolve(__dirname, '../../../.env'), resolve(__dirname, '../../.env')];
  for (const p of paths) {
    try {
      const content = readFileSync(p, 'utf8');
      const match = content.match(/^GRAIN_API_TOKEN=(.+)$/m);
      if (match) return match[1].trim();
    } catch {}
  }
  throw new Error('GRAIN_API_TOKEN not found');
}

const TOKEN = getToken();
const BASE = 'https://api.grain.com/_/public-api';

async function grain(path) {
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${TOKEN}` },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Grain API error: ${res.status} ${err}`);
  }
  return res.json();
}

/**
 * List recent recordings.
 * @param {object} [opts]
 * @param {number} [opts.limit] - Max results (default 20)
 * @param {string} [opts.cursor] - Pagination cursor
 * @returns {Promise<{recordings: object[], cursor: string}>}
 */
export async function listRecordings({ limit = 20, cursor } = {}) {
  let path = `/recordings?limit=${limit}`;
  if (cursor) path += `&cursor=${cursor}`;
  return grain(path);
}

/**
 * Get a specific recording by ID.
 */
export async function getRecording(id) {
  return grain(`/recordings/${id}`);
}

/**
 * Fetch transcript as plain text.
 */
export async function getTranscriptText(recordingId) {
  const url = `${BASE}/recordings/${recordingId}/transcript.txt`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${TOKEN}` },
  });
  if (!res.ok) return null;
  return res.text();
}

/**
 * Fetch transcript as JSON (with timestamps).
 */
export async function getTranscriptJson(recordingId) {
  const url = `${BASE}/recordings/${recordingId}/transcript`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${TOKEN}` },
  });
  if (!res.ok) return null;
  return res.json();
}

/**
 * List recordings from the last N days.
 */
export async function listRecentRecordings(days = 7) {
  const all = [];
  let cursor;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  while (true) {
    const data = await listRecordings({ limit: 50, cursor });
    if (!data.recordings || data.recordings.length === 0) break;

    for (const r of data.recordings) {
      const start = new Date(r.start_datetime);
      if (start < cutoff) return all; // recordings are chronological desc
      all.push(r);
    }

    cursor = data.cursor;
    if (!cursor) break;
  }

  return all;
}

export default { listRecordings, getRecording, getTranscriptText, getTranscriptJson, listRecentRecordings };
