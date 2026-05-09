#!/usr/bin/env bash
# Render car-report HTML → PDF and put it in tmp/output for auto-send
#
# Usage:
#   bash skills/car-report/render-pdf.sh [html-file] [output-name]
#
# Defaults:
#   html-file   = tmp/car-report.html
#   output-name = Volvo-XC90-replacement-shortlist.pdf
#
# Output goes to tmp/output/ — Telegram auto-sends as document.

set -e

HTML="${1:-tmp/car-report.html}"
OUTPUT_NAME="${2:-Volvo-XC90-replacement-shortlist.pdf}"

if [ ! -f "$HTML" ]; then
  echo "❌ HTML file not found: $HTML"
  exit 1
fi

# Absolute paths required for agent-browser
HTML_ABS=$(realpath "$HTML")
OUTPUT_PATH="$(pwd)/tmp/output/${OUTPUT_NAME}"

mkdir -p tmp/output

echo "→ Opening $HTML_ABS"
npx agent-browser open "file://${HTML_ABS}" 2>&1 | tail -2

echo "→ Generating PDF..."
npx agent-browser pdf "$OUTPUT_PATH" 2>&1 | tail -2

echo "→ Closing browser..."
npx agent-browser close 2>&1 | tail -1

echo ""
echo "✓ PDF ready: $OUTPUT_PATH"
ls -la "$OUTPUT_PATH"
