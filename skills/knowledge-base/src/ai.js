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
  const maxChars = 60000;
  const wasTruncated = content.length > maxChars;
  const truncated = wasTruncated
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
    truncated: wasTruncated,
    originalLength: content.length,
    processedLength: truncated.length,
  };
}

/**
 * Semantic chunking — split transcript into topical sections.
 * Returns split points with topic labels for meaningful chunking.
 *
 * @param {string} title - Video/content title
 * @param {Array<{text: string, offset: number, duration: number}>} segments - Transcript segments with timestamps
 * @returns {Promise<Array<{topic: string, startIndex: number, endIndex: number}>>} - Section boundaries as segment indices
 */
export async function semanticSplit({ title, segments }) {
  // Build a condensed transcript with segment indices for the AI
  // Format: [0] First segment text [1] Second segment text ...
  const maxChars = 60000;
  const lines = [];
  let totalChars = 0;
  let lastIncludedIndex = -1;

  for (let i = 0; i < segments.length; i++) {
    const line = `[${i}] ${segments[i].text.trim()}`;
    if (totalChars + line.length > maxChars) break;
    lines.push(line);
    totalChars += line.length;
    lastIncludedIndex = i;
  }

  const transcript = lines.join('\n');

  const result = await chat([
    {
      role: 'system',
      content: `You split transcripts into topical sections. Each section should cover one coherent topic or discussion thread.

Return JSON with:
- "sections": array of objects, each with:
  - "topic": short label for the section (3-8 words)
  - "start": segment index where this section starts (number from the [N] markers)
  - "end": segment index where this section ends (inclusive)

Rules:
- Sections must cover the entire transcript — no gaps, no overlaps
- First section starts at 0, last section ends at the last segment index
- Aim for sections of roughly 1-5 minutes of content — not too granular, not too broad
- Split at natural topic transitions, not mid-thought
- If the whole transcript is one topic, return a single section`,
    },
    {
      role: 'user',
      content: `Title: ${title}\n\nTranscript:\n${transcript}`,
    },
  ]);

  const sections = (result.sections || []).map(s => ({
    topic: s.topic,
    startIndex: s.start,
    endIndex: s.end,
  }));

  // If AI returned nothing usable, return null so caller can fall back
  if (sections.length === 0) return null;

  // If transcript was truncated, add a catch-all section for the rest
  if (lastIncludedIndex < segments.length - 1) {
    const lastSection = sections[sections.length - 1];
    if (lastSection.endIndex < segments.length - 1) {
      sections.push({
        topic: 'continued (beyond AI analysis)',
        startIndex: lastSection.endIndex + 1,
        endIndex: segments.length - 1,
      });
    }
  }

  return sections;
}

export default { processContent, semanticSplit };
