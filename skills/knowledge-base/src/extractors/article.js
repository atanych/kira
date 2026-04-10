/**
 * Article extractor — cleans up fetched web content.
 */

export function parseArticle({ title, content, url }) {
  let cleaned = content
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s*#+\s*$/gm, '')
    .replace(/\[Skip to .*?\]\(.*?\)/gi, '')
    .trim();

  return {
    title: title || extractTitleFromContent(cleaned),
    content: cleaned,
    author: null,
    publishedAt: null,
    sourceType: 'article',
  };
}

function extractTitleFromContent(content) {
  const match = content.match(/^#\s+(.+)$/m);
  if (match) return match[1].trim();
  const firstLine = content.split('\n').find(l => l.trim().length > 0);
  return firstLine ? firstLine.slice(0, 200).trim() : 'Untitled';
}

export default { parseArticle };
