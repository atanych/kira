/**
 * Twitter/X extractor — uses x-thread skill (Apify + Gemini).
 * Fetches original tweet + replies, returns discussion summary.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);

const __dirname = dirname(fileURLToPath(import.meta.url));
const X_THREAD_SCRIPT = resolve(__dirname, '../../../../../..', 'skills/x-thread/x-thread.ts');
const MAX_REPLIES = 200;

export function isTwitterUrl(url) {
  return /(?:twitter\.com|x\.com)\/\w+\/status\/\d+/.test(url);
}

export function extractTweetId(url) {
  const m = url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
  return m ? m[1] : null;
}

function extractUrls(text) {
  if (!text) return [];
  const urls = text.match(/https?:\/\/[^\s)>\]]+/g) || [];
  return urls.filter(u => !/(twitter\.com|x\.com|t\.co)/.test(u));
}

/**
 * Parse x-thread markdown output into structured data.
 */
function parseXThreadOutput(output) {
  let author = null;
  let tweetText = '';
  let discussionSummary = '';

  // Extract original tweet section — format: **Author:** text  (colon inside bold)
  const tweetMatch = output.match(/## Original Tweet\n\*\*(.+?):\*\*\s*([\s\S]*?)(?=\n+##|\n---)/);
  if (tweetMatch) {
    author = tweetMatch[1].trim();
    tweetText = tweetMatch[2].trim();
  }

  // Also try alternate format: **Author**: text  (colon outside bold)
  if (!author) {
    const altMatch = output.match(/## Original Tweet\n\*\*(.+?)\*\*:\s*([\s\S]*?)(?=\n+##|\n---)/);
    if (altMatch) {
      author = altMatch[1].trim();
      tweetText = altMatch[2].trim();
    }
  }

  // Fallback: couldn't fetch tweet text
  if (!author) {
    const fallbackMatch = output.match(/## Original Tweet\n\*\((.+?)\)\*/);
    if (fallbackMatch) {
      tweetText = '';
    }
  }

  // Extract discussion summary section
  const summaryMatch = output.match(/## Discussion Summary[^\n]*\n([\s\S]*?)(?=\n---|$)/);
  if (summaryMatch) {
    discussionSummary = summaryMatch[1].trim();
  }

  return { author, tweetText, discussionSummary };
}

export async function extractTwitter(url) {
  const tweetId = extractTweetId(url);
  if (!tweetId) throw new Error(`Invalid Twitter URL: ${url}`);

  console.log(`Running x-thread (up to ${MAX_REPLIES} replies)...`);
  const { stdout, stderr } = await execFileAsync(
    'npx', ['tsx', X_THREAD_SCRIPT, url, String(MAX_REPLIES)],
    { timeout: 240_000, maxBuffer: 10 * 1024 * 1024 }
  );

  if (stderr) console.log(stderr.trim());
  if (!stdout.trim()) throw new Error('x-thread returned empty output');

  const { author, tweetText, discussionSummary } = parseXThreadOutput(stdout);

  if (!tweetText && !discussionSummary) {
    throw new Error('Could not parse any content from x-thread output');
  }

  // Build full content: original tweet + discussion summary
  const contentParts = [];
  if (tweetText) contentParts.push(tweetText);
  if (discussionSummary) {
    contentParts.push(`\n\n--- Discussion Summary ---\n${discussionSummary}`);
  }
  const content = contentParts.join('');

  const linkedUrls = extractUrls(tweetText);

  // Build title — if tweet text is just a URL or empty, use summary snippet
  const isTextUseful = tweetText && !/^\s*https?:\/\/\S+\s*$/.test(tweetText);
  const titleText = isTextUseful
    ? tweetText.slice(0, 100) + (tweetText.length > 100 ? '...' : '')
    : discussionSummary
      ? discussionSummary
          .replace(/^Here's a summary.*?:\s*/is, '')   // strip preamble
          .replace(/^[\s*\-•]+/, '')                    // strip leading bullets
          .slice(0, 100) + '...'
      : '(tweet)';

  return {
    title: `@${author || 'unknown'}: ${titleText}`,
    content,
    author,
    publishedAt: null,
    sourceType: 'tweet',
    tweetId,
    linkedUrls: [...new Set(linkedUrls)],
    summary: discussionSummary || null, // pre-built summary — skip KB AI summarization
  };
}

export default { extractTwitter, isTwitterUrl, extractTweetId };
