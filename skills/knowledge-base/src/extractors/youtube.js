/**
 * YouTube extractor — fetches video metadata + transcript with timestamps.
 */

import { execSync } from 'child_process';
import { readFileSync, unlinkSync, existsSync, appendFileSync, mkdirSync } from 'fs';
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

function decodeEntities(str) {
  return str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/\n/g, ' ');
}

async function fetchTranscript(videoId) {
  try {
    const playerRes = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'com.google.android.youtube/20.10.38 (Linux; U; Android 14)',
      },
      body: JSON.stringify({
        context: { client: { clientName: 'ANDROID', clientVersion: '20.10.38' } },
        videoId,
      }),
    });

    const playerData = await playerRes.json();
    const tracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!tracks || tracks.length === 0) {
      console.warn(`  No captions found for ${videoId}`);
      return null;
    }

    const track = tracks.find(t => t.languageCode === 'en') || tracks[0];
    const xmlRes = await fetch(track.baseUrl);
    const xml = await xmlRes.text();
    if (!xml || xml.length === 0) return null;

    const segments = [];

    // Format 2 (InnerTube): <p t="ms" d="ms">...</p>
    const pRegex = /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
    let m;
    while ((m = pRegex.exec(xml)) !== null) {
      const startMs = parseInt(m[1]);
      const durMs = parseInt(m[2]);
      let text = '';
      const sRegex = /<s[^>]*>([^<]*)<\/s>/g;
      let sm;
      while ((sm = sRegex.exec(m[3])) !== null) text += sm[1];
      if (!text) text = m[3].replace(/<[^>]+>/g, '');
      text = decodeEntities(text).trim();
      if (text) segments.push({ text, offset: startMs / 1000, duration: durMs / 1000 });
    }

    // Format 1 (classic): <text start="s" dur="s">...</text>
    if (segments.length === 0) {
      const textRegex = /<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g;
      while ((m = textRegex.exec(xml)) !== null) {
        segments.push({ text: decodeEntities(m[3]), offset: parseFloat(m[1]), duration: parseFloat(m[2]) });
      }
    }

    console.log(`  Transcript: ${segments.length} segments`);
    return segments.length > 0 ? segments : null;
  } catch (err) {
    console.warn(`  Transcript not available for ${videoId}: ${err.message}`);
    return null;
  }
}

async function transcribeWithYtDlp(videoId) {
  const outPath = `/tmp/ytdlp_${videoId}`;
  const vttPath = `${outPath}.en.vtt`;
  try {
    execSync(
      `yt-dlp --write-auto-sub --sub-lang en --skip-download --sub-format vtt -o "${outPath}" "https://www.youtube.com/watch?v=${videoId}" --quiet`,
      { timeout: 30000 }
    );
    if (!existsSync(vttPath)) return null;
    const vtt = readFileSync(vttPath, 'utf8');
    try { unlinkSync(vttPath); } catch {}
    const lines = vtt.split('\n')
      .filter(l => l && !l.startsWith('WEBVTT') && !l.startsWith('NOTE') && !l.match(/^\d{2}:\d{2}/) && !l.match(/^\d+$/))
      .map(l => l.replace(/<[^>]+>/g, '').trim())
      .filter(Boolean);
    const deduped = lines.filter((l, i) => i === 0 || l !== lines[i - 1]);
    const text = deduped.join(' ');
    console.log(`  yt-dlp transcript: ${text.length} chars`);
    return text || null;
  } catch (err) {
    console.warn(`  yt-dlp failed: ${err.message?.slice(0, 100)}`);
    try { if (existsSync(vttPath)) unlinkSync(vttPath); } catch {}
    return null;
  }
}

async function transcribeWithGemini(videoId, originalUrl) {
  if (!config.GOOGLE_AI_API_KEY) throw new Error('GOOGLE_AI_API_KEY not configured');
  const youtubeUrl = originalUrl || `https://www.youtube.com/watch?v=${videoId}`;
  console.log(`  No captions found - using Gemini Flash for transcript...`);

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

  const metadata = await fetchMetadata(videoId);
  const transcript = await fetchTranscript(videoId);

  let content = '';
  if (transcript && transcript.length > 0) {
    content = transcript.map(s => s.text).join(' ');
  } else {
    content = await transcribeWithYtDlp(videoId);
    if (!content) {
      content = await transcribeWithGemini(videoId, url);
    }
  }

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
    transcript,
    metadata,
  };
}

export default { extractYouTube, isYouTubeUrl, extractVideoId };
