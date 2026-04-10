/**
 * AI processing — summary generation, entity extraction, auto-tagging.
 */

import { config } from './env.js';

if (!config.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not found in .env');

const MODEL = 'gpt-4o-mini';

async function chat(messages, jsonMode = true) {
  const body = {
    model: MODEL,
    messages,
    temperature: 0.3,
  };
  if (jsonMode) body.response_format = { type: 'json_object' };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error: ${res.status} ${err}`);
  }

  const data = await res.json();
  const text = data.choices[0].message.content;
  return jsonMode ? JSON.parse(text) : text;
}

/**
 * Process content — generate summary, extract entities, suggest tags.
 */
export async function processContent({ title, content, sourceType, userTags = [] }) {
  const maxChars = 12000;
  const truncated = content.length > maxChars
    ? content.slice(0, maxChars) + '\n...[truncated]'
    : content;

  const result = await chat([
    {
      role: 'system',
      content: `You analyze content and extract structured metadata. Return JSON with:
- "summary": 2-4 sentence summary of the key points
- "entities": array of notable people, companies, products, and concepts mentioned (max 15)
- "tags": array of 3-7 topic tags (lowercase, hyphenated, e.g. "machine-learning", "rag", "fine-tuning")
- "author": author/creator name if detectable from the content, null otherwise

Be concise and precise. Tags should be useful for filtering and discovery.`,
    },
    {
      role: 'user',
      content: `Source type: ${sourceType}\nTitle: ${title}\n\nContent:\n${truncated}`,
    },
  ]);

  const allTags = [...new Set([
    ...(userTags || []).map(t => t.toLowerCase().trim()),
    ...(result.tags || []).map(t => t.toLowerCase().trim()),
  ])];

  return {
    summary: result.summary || '',
    entities: result.entities || [],
    tags: allTags,
    author: result.author || null,
  };
}

export default { processContent };
