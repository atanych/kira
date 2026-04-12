import { writeFileSync } from 'fs';
import { extractYouTube } from '../src/extractors/youtube.js';

const url = process.argv[2];
if (!url) {
  console.error('Usage: node temp-extract.js <youtube-url>');
  process.exit(1);
}

const result = await extractYouTube(url);

const out = `/tmp/transcript-${result.videoId}.txt`;
writeFileSync(out, result.content);

console.log(`Title: ${result.title}`);
console.log(`Author: ${result.author}`);
console.log(`Segments: ${result.transcript?.length || 0}`);
console.log(`Content: ${result.content.length} chars`);
console.log(`Saved to: ${out}`);
