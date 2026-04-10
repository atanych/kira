/**
 * CRM embeddings — same model as KB (text-embedding-3-small).
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load OPENAI_API_KEY from env
function getApiKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  const paths = [resolve(__dirname, '../../../.env'), resolve(__dirname, '../../.env')];
  for (const p of paths) {
    try {
      const content = readFileSync(p, 'utf8');
      const match = content.match(/^OPENAI_API_KEY=(.+)$/m);
      if (match) return match[1].trim();
    } catch {}
  }
  throw new Error('OPENAI_API_KEY not found');
}

const OPENAI_API_KEY = getApiKey();
const MODEL = 'text-embedding-3-small';

export async function embed(text) {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, input: text }),
  });
  if (!res.ok) throw new Error(`Embedding error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.data[0].embedding;
}

export async function embedBatch(texts) {
  if (texts.length === 0) return [];
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, input: texts }),
  });
  if (!res.ok) throw new Error(`Embedding batch error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.data.sort((a, b) => a.index - b.index).map(d => d.embedding);
}
