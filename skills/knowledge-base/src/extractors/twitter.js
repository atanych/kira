/**
 * Twitter/X extractor — uses FxTwitter API.
 */

export function isTwitterUrl(url) {
  return /(?:twitter\.com|x\.com)\/\w+\/status\/\d+/.test(url);
}

export function extractTweetId(url) {
  const m = url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
  return m ? m[1] : null;
}

async function fetchTweet(tweetId) {
  const res = await fetch(`https://api.fxtwitter.com/status/${tweetId}`);
  if (!res.ok) throw new Error(`FxTwitter API error: ${res.status}`);
  const data = await res.json();
  if (!data.tweet) throw new Error(`Tweet not found: ${tweetId}`);
  return data.tweet;
}

function extractUrls(text) {
  if (!text) return [];
  const urls = text.match(/https?:\/\/[^\s)>\]]+/g) || [];
  return urls.filter(u => !/(twitter\.com|x\.com|t\.co)/.test(u));
}

export async function extractTwitter(url) {
  const tweetId = extractTweetId(url);
  if (!tweetId) throw new Error(`Invalid Twitter URL: ${url}`);

  const tweet = await fetchTweet(tweetId);

  const parts = [];
  let author = tweet.author?.screen_name || tweet.author?.name;
  let authorName = tweet.author?.name;

  parts.push(tweet.text || '');

  if (tweet.quote) {
    parts.push(`\n[Quoted @${tweet.quote.author?.screen_name}]: ${tweet.quote.text}`);
  }

  const content = parts.join('\n').trim();

  const linkedUrls = extractUrls(tweet.text);
  if (tweet.quote?.text) {
    linkedUrls.push(...extractUrls(tweet.quote.text));
  }

  return {
    title: `@${author}: ${(tweet.text || '').slice(0, 100)}${(tweet.text || '').length > 100 ? '...' : ''}`,
    content,
    author: authorName || author,
    publishedAt: tweet.created_at || null,
    sourceType: 'tweet',
    tweetId,
    linkedUrls: [...new Set(linkedUrls)],
    metrics: { likes: tweet.likes, retweets: tweet.retweets, replies: tweet.replies },
  };
}

export default { extractTwitter, isTwitterUrl, extractTweetId };
