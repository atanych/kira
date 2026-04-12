#!/usr/bin/env node

/**
 * Post a message to a Slack channel.
 *
 * Usage:
 *   node post.js --channel "#analytics" --message "hello"
 *   node post.js --channel "#analytics" --file message.txt
 */

import { parseArgs } from 'node:util';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const paths = [
    resolve(__dirname, '../../.env'),
    resolve(__dirname, '../../../.env'),
  ];
  for (const p of paths) {
    try {
      const content = readFileSync(p, 'utf8');
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
  }
}

loadEnv();

const token = process.env.SLACK_BOT_TOKEN;
if (!token) throw new Error('SLACK_BOT_TOKEN not found in .env');

const { values } = parseArgs({
  options: {
    channel: { type: 'string' },
    message: { type: 'string' },
    file:    { type: 'string' },
  },
});

if (!values.channel) {
  console.error('--channel is required');
  process.exit(1);
}

if (!values.message && !values.file) {
  console.error('--message or --file is required');
  process.exit(1);
}

const text = values.file
  ? readFileSync(values.file, 'utf8')
  : values.message;

const channelName = values.channel.replace(/^#/, '');

// Look up channel ID by name
async function findChannel(name) {
  let cursor = '';
  while (true) {
    const url = `https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=200${cursor ? `&cursor=${cursor}` : ''}`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json();
    if (!data.ok) throw new Error(`Slack API error: ${data.error}`);

    const match = data.channels.find(c => c.name === name);
    if (match) return match.id;

    if (data.response_metadata?.next_cursor) {
      cursor = data.response_metadata.next_cursor;
    } else {
      return null;
    }
  }
}

async function postMessage(channelId, text) {
  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      channel: channelId,
      text,
      unfurl_links: false,
    }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`Slack postMessage error: ${data.error}`);
  return data;
}

try {
  const channelId = await findChannel(channelName);
  if (!channelId) {
    console.error(`Channel #${channelName} not found`);
    process.exit(1);
  }

  const result = await postMessage(channelId, text);
  console.log(`Posted to #${channelName} (ts: ${result.ts})`);
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
