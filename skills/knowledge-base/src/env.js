/**
 * Centralized env loader — single source of truth for all config.
 * Loads from the bot's .env file once, used by all modules.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env from bot root (two levels up from src/)
const envPath = resolve(__dirname, '../../.env');
try {
  const content = readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch {}

// Also try bot root .env (three levels up, in case skill is nested deeper)
const botEnvPath = resolve(__dirname, '../../../.env');
try {
  const content = readFileSync(botEnvPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch {}

export const config = {
  DATABASE_URL: process.env.CRM_DATABASE_URL || process.env.KB_DATABASE_URL,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
  GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
  LIGHTRAG_URL: process.env.LIGHTRAG_URL,
  LIGHTRAG_USERNAME: process.env.LIGHTRAG_USERNAME,
  LIGHTRAG_PASSWORD: process.env.LIGHTRAG_PASSWORD,
};
