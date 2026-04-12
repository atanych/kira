/**
 * YouTube extractor — fetches video metadata + transcript via Gemini.
 */

import { config } from '../env.js';

export function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export function isYouTubeUrl(url) {
  return /(?:youtube\.com|youtu\.be)\//.test(url);
}

async function fetchMetadata(videoId) {
  if (!config.YOUTUBE_API_KEY) throw new Error('YOUTUBE_API_KEY not configured');
  const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${config.YOUTUBE_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);
  const data = await res.json();
  if (!data.items || data.items.length === 0) throw new Error(`Video not found: ${videoId}`);
  const item = data.items[0];
  return {
    title: item.snippet.title,
    author: item.snippet.channelTitle,
    publishedAt: item.snippet.publishedAt,
    description: item.snippet.description,
    duration: item.contentDetails.duration,
  };
}

async function transcribeWithGemini(videoId, originalUrl) {
  if (!config.GOOGLE_AI_API_KEY) throw new Error('GOOGLE_AI_API_KEY not configured');
  const youtubeUrl = originalUrl || `https://www.youtube.com/watch?v=${videoId}`;
  console.log(`  Transcribing via Gemini Flash...`);

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${config.GOOGLE_AI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { fileData: { fileUri: youtubeUrl } },
            { text: 'Provide a complete, accurate transcript of this video. Output only the spoken words in order. No timestamps, no speaker labels, no commentary — just the raw transcript text.' }
          ]
        }]
      })
    }
  );

  const data = await res.json();
  if (data.error) throw new Error(`Gemini error: ${data.error.message}`);

  const usage = data.usageMetadata || {};
  const inputTokens = usage.promptTokenCount || 0;
  const outputTokens = usage.candidatesTokenCount || 0;
  const costUsd = (inputTokens / 1_000_000) * 0.075 + (outputTokens / 1_000_000) * 0.30;
  console.log(`  Gemini cost: $${costUsd.toFixed(5)} (${inputTokens} in + ${outputTokens} out tokens)`);

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned empty transcript');
  return text;
}

export async function extractYouTube(url) {
  const videoId = extractVideoId(url);
  if (!videoId) throw new Error(`Invalid YouTube URL: ${url}`);

  const [metadata, content] = await Promise.all([
    fetchMetadata(videoId),
    transcribeWithGemini(videoId, url),
  ]);

  if (!content || content.trim().length === 0) {
    throw new Error(`No transcript available for video ${videoId} — skipping ingestion`);
  }

  return {
    title: metadata.title,
    content,
    author: metadata.author,
    publishedAt: metadata.publishedAt,
    sourceType: 'video',
    videoId,
    metadata,
  };
}

export default { extractYouTube, isYouTubeUrl, extractVideoId };
