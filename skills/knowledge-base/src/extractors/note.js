/**
 * Note extractor — raw text passthrough.
 */

export function extractNote(text, title) {
  return {
    title: title || text.slice(0, 100).trim() + (text.length > 100 ? '...' : ''),
    content: text,
    author: null,
    publishedAt: null,
    sourceType: 'note',
  };
}

export default { extractNote };
