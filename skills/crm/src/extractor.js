/**
 * AI Meeting Extractor
 *
 * Extracts from meeting transcripts:
 * - Summary
 * - Action items (with owner: me/them, assignee, due date)
 * - Decisions made
 * - Per-person context (what they said/cared about)
 * - Highlights (notable statements)
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

async function chat(messages) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

/**
 * Extract structured data from a meeting transcript.
 *
 * @param {object} params
 * @param {string} params.title - Meeting title
 * @param {string} params.transcript - Full transcript text
 * @param {string[]} params.participants - List of participant names
 * @param {string} [params.myName] - The user's name (to determine me/them ownership)
 * @param {string} [params.grainSummary] - Grain's own summary (for reference)
 * @param {string} [params.intelligenceNotes] - Grain's intelligence notes
 * @returns {Promise<object>} Extracted meeting data
 */
export async function extractMeeting({ title, transcript, participants, myName = 'Vlad', grainSummary, intelligenceNotes }) {
  // Truncate transcript for LLM (keep it under ~30k chars)
  const maxChars = 30000;
  const truncated = transcript.length > maxChars
    ? transcript.slice(0, maxChars) + '\n...[transcript truncated]'
    : transcript;

  const result = await chat([
    {
      role: 'system',
      content: `You extract structured data from meeting transcripts. Return JSON with:

{
  "summary": "2-5 sentence meeting summary focusing on key outcomes",
  "decisions": [
    {"decision": "what was decided", "context": "brief context", "made_by": "who decided"}
  ],
  "action_items": [
    {
      "description": "clear, actionable task description",
      "owner": "me" or "them",
      "assigned_to": "person's name",
      "due_date": "YYYY-MM-DD if mentioned, null otherwise",
      "priority": "high" or "medium" or "low"
    }
  ],
  "context": [
    {
      "person": "participant name",
      "content": "what they said, cared about, or committed to — 1-3 sentences",
      "sentiment": "positive" or "neutral" or "negative" or "concerned",
      "topics": ["topic1", "topic2"]
    }
  ],
  "highlights": [
    {"statement": "notable or important quote/point", "speaker": "who said it", "why": "why it matters"}
  ]
}

Rules:
- "${myName}" is "me". Everyone else is "them".
- In the summary, do NOT include participant names or the company name — those are already shown separately. Focus on what was discussed, decided, and committed to.
- Action items must be specific and actionable, not vague.
- For due dates, only include if explicitly mentioned in the transcript.
- Context should capture what each person uniquely contributed or cared about.
- Highlights are statements that stand out — important commitments, surprising info, strategic insights. Highlights must NOT duplicate decisions. If something is already a decision, don't repeat it as a highlight.
- Extract EVERY action item, commitment, follow-up, and task mentioned — do not skip any. If someone says they will do something, that's an action item.
- When in doubt, include it as an action item rather than omitting it.`
    },
    {
      role: 'user',
      content: `Meeting: ${title}
Participants: ${participants.join(', ')}
${grainSummary ? `\nGrain Summary: ${grainSummary}` : ''}
${intelligenceNotes ? `\nIntelligence Notes:\n${intelligenceNotes.slice(0, 3000)}` : ''}

Transcript:
${truncated}`
    }
  ]);

  return result;
}

/**
 * Extract a highlight from a specific statement in context.
 * Used when user says "Kira, highlight that" during review.
 *
 * @param {string} statement - The statement to highlight
 * @param {string} context - Surrounding context from the transcript
 * @param {string} meetingTitle - Meeting title for reference
 */
export async function extractHighlight(statement, context, meetingTitle) {
  const result = await chat([
    {
      role: 'system',
      content: `You are extracting a highlight from a meeting. Return JSON:
{
  "statement": "the key statement, cleaned up for clarity",
  "speaker": "who said it",
  "why": "brief explanation of why this matters",
  "topics": ["relevant", "topics"]
}`
    },
    {
      role: 'user',
      content: `Meeting: ${meetingTitle}\n\nContext:\n${context}\n\nStatement to highlight:\n${statement}`
    }
  ]);

  return result;
}

export default { extractMeeting, extractHighlight };
