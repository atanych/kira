/**
 * Translation module — detect language and translate to English if needed.
 * Uses GPT-4o-mini for cost efficiency.
 */

import { config } from './env.js';

/**
 * Detect language and translate to English if needed.
 * Chunks large content to stay within token limits.
 */
export async function translateToEnglishIfNeeded(content, title = '') {
  if (!config.OPENAI_API_KEY || !content) return content;

  const sample = (title + ' ' + content).slice(0, 500);
  const detectRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 5,
      messages: [
        { role: 'system', content: 'Detect the language of the text. Reply with ONLY the 2-letter ISO code (e.g. en, ru, de). Nothing else.' },
        { role: 'user', content: sample }
      ]
    })
  });
  const detectData = await detectRes.json();
  const lang = detectData.choices?.[0]?.message?.content?.trim().toLowerCase().slice(0, 2);

  if (!lang || lang === 'en') return content;

  console.log(`  Detected language: ${lang} - translating to English...`);

  async function translateChunk(text) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Translate the following text to English. Preserve formatting and technical terms. Output only the translated text.' },
          { role: 'user', content: text }
        ]
      })
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || text;
  }

  const CHUNK = 3000;
  const chunks = [];
  for (let i = 0; i < content.length; i += CHUNK) chunks.push(content.slice(i, i + CHUNK));

  const translated = [];
  for (const chunk of chunks) {
    translated.push(await translateChunk(chunk));
    await new Promise(r => setTimeout(r, 100));
  }

  const result = translated.join(' ');
  console.log(`  Translated: ${content.length} -> ${result.length} chars`);
  return result;
}

/**
 * Translate a short string (title/author) if non-English.
 */
export async function translateShort(text) {
  if (!config.OPENAI_API_KEY || !text) return text;
  const nonLatin = (text.match(/[^\x00-\x7F\s]/g) || []).length;
  if (nonLatin / text.length < 0.2) return text;
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 100,
      messages: [
        { role: 'system', content: 'Translate to English. Output only the translation, nothing else.' },
        { role: 'user', content: text }
      ]
    })
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || text;
}
