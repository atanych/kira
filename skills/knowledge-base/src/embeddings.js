import { config } from './env.js';

if (!config.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not found in .env');

const MODEL = 'text-embedding-3-small';

/**
 * Generate embedding for text
 * @param {string} text
 * @returns {Promise<number[]>} 1536-dim vector
 */
export async function embed(text) {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: MODEL, input: text }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI embedding error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts (batch)
 * @param {string[]} texts
 * @returns {Promise<number[][]>}
 */
export async function embedBatch(texts) {
  if (texts.length === 0) return [];

  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: MODEL, input: texts }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI embedding batch error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.data
    .sort((a, b) => a.index - b.index)
    .map(d => d.embedding);
}

/**
 * Build embedding text from item fields
 */
export function buildEmbeddingText(title, summary, tags = []) {
  const parts = [title];
  if (summary) parts.push(summary);
  if (tags.length > 0) parts.push(tags.join(', '));
  return parts.join('\n');
}
