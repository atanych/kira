/**
 * Content chunking for RAG retrieval.
 * Splits content into ~500-1000 token chunks with overlap.
 * For YouTube, preserves timestamps per chunk.
 */

const TARGET_CHUNK_TOKENS = 750;   // ~3000 chars
const MIN_CHUNK_TOKENS = 100;      // don't create tiny chunks
const OVERLAP_TOKENS = 50;         // ~200 chars overlap
const CHARS_PER_TOKEN = 4;

/**
 * Chunk text content (articles, PDFs, notes)
 */
export function chunkText(text) {
  if (!text || text.trim().length === 0) return [];

  const targetChars = TARGET_CHUNK_TOKENS * CHARS_PER_TOKEN;
  const minChars = MIN_CHUNK_TOKENS * CHARS_PER_TOKEN;
  const overlapChars = OVERLAP_TOKENS * CHARS_PER_TOKEN;

  if (text.length <= targetChars * 1.3) {
    return [{ chunkText: text.trim(), chunkIndex: 0 }];
  }

  let paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);

  if (paragraphs.length === 1 && paragraphs[0].length > targetChars) {
    paragraphs = paragraphs[0]
      .split(/(?<=[.!?])\s+/)
      .filter(s => s.trim().length > 0);
  }

  if (paragraphs.length === 1 && paragraphs[0].length > targetChars) {
    const raw = paragraphs[0];
    paragraphs = [];
    for (let i = 0; i < raw.length; i += targetChars - overlapChars) {
      paragraphs.push(raw.slice(i, i + targetChars));
    }
  }

  const chunks = [];
  let currentChunk = '';
  let chunkIndex = 0;

  for (const para of paragraphs) {
    if (currentChunk.length > 0 && currentChunk.length + para.length > targetChars) {
      chunks.push({ chunkText: currentChunk.trim(), chunkIndex: chunkIndex++ });
      const overlap = currentChunk.slice(-overlapChars);
      currentChunk = overlap + '\n\n' + para;
    } else {
      currentChunk += (currentChunk.length > 0 ? '\n\n' : '') + para;
    }
  }

  if (currentChunk.trim().length >= minChars) {
    chunks.push({ chunkText: currentChunk.trim(), chunkIndex });
  } else if (chunks.length > 0 && currentChunk.trim().length > 0) {
    chunks[chunks.length - 1].chunkText += '\n\n' + currentChunk.trim();
  } else if (currentChunk.trim().length > 0) {
    chunks.push({ chunkText: currentChunk.trim(), chunkIndex: 0 });
  }

  return chunks;
}

/**
 * Chunk YouTube transcript with timestamps
 */
export function chunkTranscript(segments) {
  if (!segments || segments.length === 0) return [];

  const targetChars = TARGET_CHUNK_TOKENS * CHARS_PER_TOKEN;

  const totalText = segments.map(s => s.text).join(' ');
  if (totalText.length <= targetChars * 1.3) {
    return [{
      chunkText: totalText.trim(),
      chunkIndex: 0,
      timestampStart: segments[0].offset,
      timestampEnd: segments[segments.length - 1].offset + (segments[segments.length - 1].duration || 0),
    }];
  }

  const chunks = [];
  let currentText = '';
  let chunkIndex = 0;
  let chunkStartTime = segments[0].offset;
  let chunkEndTime = 0;

  for (const seg of segments) {
    const segText = seg.text.trim();
    if (!segText) continue;

    if (currentText.length > 0 && currentText.length + segText.length > targetChars) {
      chunks.push({
        chunkText: currentText.trim(),
        chunkIndex: chunkIndex++,
        timestampStart: chunkStartTime,
        timestampEnd: chunkEndTime,
      });
      currentText = segText;
      chunkStartTime = seg.offset;
    } else {
      currentText += (currentText.length > 0 ? ' ' : '') + segText;
    }
    chunkEndTime = seg.offset + (seg.duration || 0);
  }

  if (currentText.trim().length > 0) {
    chunks.push({
      chunkText: currentText.trim(),
      chunkIndex,
      timestampStart: chunkStartTime,
      timestampEnd: chunkEndTime,
    });
  }

  return chunks;
}

/**
 * Chunk transcript by semantic sections (AI-detected topic boundaries).
 * Each section becomes one chunk with timestamps and topic label.
 *
 * @param {Array<{text: string, offset: number, duration: number}>} segments
 * @param {Array<{topic: string, startIndex: number, endIndex: number}>} sections
 */
export function chunkTranscriptSemantic(segments, sections) {
  if (!segments || !sections || sections.length === 0) return [];

  return sections.map((section, i) => {
    const sectionSegments = segments.slice(section.startIndex, section.endIndex + 1);
    const text = sectionSegments.map(s => s.text.trim()).filter(Boolean).join(' ');
    const startSeg = sectionSegments[0];
    const endSeg = sectionSegments[sectionSegments.length - 1];

    return {
      chunkText: `[${section.topic}]\n${text}`,
      chunkIndex: i,
      timestampStart: startSeg?.offset ?? 0,
      timestampEnd: endSeg ? endSeg.offset + (endSeg.duration || 0) : 0,
      topic: section.topic,
    };
  }).filter(c => c.chunkText.length > 0);
}

export default { chunkText, chunkTranscript, chunkTranscriptSemantic };
