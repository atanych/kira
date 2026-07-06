#!/usr/bin/env bash
# LLM-less cron gate for tasks-morning / tasks-evening.
# Runs render.mjs → sends PNG via Telegram sendPhoto, or text fallback via sendMessage.
# Always exits 0 with empty stdout → cron records `gated`, LLM is never invoked.
#
# Usage: cron-gate.sh [--today]
set -uo pipefail

BOT_DIR_LOCAL="${BOT_DIR:-$(cd "$(dirname "$0")/../../.." && pwd)}"
cd "$BOT_DIR_LOCAL"

CHAT_ID="-1003540340877"
THREAD_ID="780"
PNG_PATH="tmp/photo-tasks.png"

# Fresh output dir every run
mkdir -p tmp
rm -f "$PNG_PATH"

if [ -z "${TELEGRAM_BOT_TOKEN:-}" ]; then
  echo "cron-gate: TELEGRAM_BOT_TOKEN not in env" >&2
  exit 0    # still gated — do not spawn LLM to "fix" this
fi

# render.mjs writes PNG to $BOT_OUTPUT_DIR/photo-tasks.png; hijack that to our stable path.
export BOT_OUTPUT_DIR="$BOT_DIR_LOCAL/tmp"

# Run render — strip noisy node deprecation lines from stdout
RENDER_OUT="$(node skills/personal-tasks/scripts/render.mjs "$@" 2>&1 \
  | grep -v -e DeprecationWarning -e '^(Use `node' || true)"

API="https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}"

if [ -f "$PNG_PATH" ]; then
  # PNG rendered → send as photo
  curl -sS -o /dev/null \
    -F "chat_id=${CHAT_ID}" \
    -F "message_thread_id=${THREAD_ID}" \
    -F "photo=@${PNG_PATH}" \
    "${API}/sendPhoto" || echo "cron-gate: sendPhoto failed" >&2
  rm -f "$PNG_PATH"
else
  # Text fallback (empty list) — render.mjs printed a short line
  TEXT="${RENDER_OUT:-Открытых задач нет.}"
  curl -sS -o /dev/null \
    -d "chat_id=${CHAT_ID}" \
    -d "message_thread_id=${THREAD_ID}" \
    --data-urlencode "text=${TEXT}" \
    "${API}/sendMessage" || echo "cron-gate: sendMessage failed" >&2
fi

# Empty stdout — cron records `gated`, LLM never runs
exit 0
