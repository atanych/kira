# Book Summary

## Description
Generates a quick visual summary + voice narration for non-fiction books. Strips the fluff, extracts what actually matters.

## Flow
1. User provides a book title (and optionally author)
2. Agent researches the book via WebSearch (key principles, actionable takeaways, what to skip, criticisms)
3. Generates a styled HTML summary card using the template
4. Screenshots it as a full-page image via agent-browser (`-f` flag)
5. Generates voice narration via ElevenLabs (Jessica voice)
6. Sends both to chat via `tmp/output/`

## Invocation
No script — this is an agent-driven skill. When the user asks to summarize a book, follow the flow above using the HTML template below.

## Output Files
- `tmp/output/photo-<slug>.png` — visual summary card (photo mode)
- `tmp/output/<slug>-summary.mp3` — voice narration
- `books/<Book Title>.md` — Obsidian note (persistent, committed to repo)
- `books/assets/<Book Title>.png` — visual card image, embedded in .md via `![[Book Title.png]]`

## Obsidian Note Format
Every summary gets saved to `books/<Book Title>.md` with:
- **Frontmatter** — title, author, year, pages, tags, ratings, date-summarized
- **Obsidian links** — `[[Author Name]]`, `[[Related Book]]`, `[[Concept]]` for cross-referencing
- **Tags** — `#tag` format for Obsidian tag search
- **Sections** — One-Liner, Key Principles (H3 each), Actionable Takeaways (checkboxes), What You Can Skip, Verdict
- **Cross-links** — link to related books from the list or concepts that connect (e.g. `See also: [[Atomic Habits]]`)
- **Footer** — `*Summarized by [[Kira]] · date*`

## HTML Template Structure
Use the template in `template.html`. Fill in:
- Book title, author, year
- Page count, tags
- **One-liner** — the book's core thesis in 1-2 sentences
- **Principles that matter** (numbered, 4-8 items) — only the ones worth knowing, with bold title + explanation
- **Actionable takeaways** (3-5 items) — concrete things the reader can do TODAY
- **What you can skip** — chapters/ideas that are filler, outdated, or pseudoscience
- **Ratings** — 6 factors, each 1-10:
  1. 🎯 Core Ideas — how strong/original the concepts are
  2. 📦 Density — how packed with value per page (10 = every page hits, 3 = could've been a blog post)
  3. ⚡ Actionability — can you DO something with this tomorrow? (practical vs. philosophical)
  4. 🕐 Time Relevance — does it hold up in 2026 or is it stuck in its era?
  5. 🔁 Overlap — how much you've already seen in other books (10 = totally unique, 3 = recycled ideas)
  6. 🎓 Difficulty — entry-level mindset or advanced tactical? (helps prioritize by reader level)
- **Verdict** — honest Kira-style assessment

## Voice Script Guidelines
- Conversational, not robotic — write it like Kira would say it out loud
- Target ~5 minutes (~750-900 words). NOT a 1-minute teaser — actually explain each idea with context, examples, and why it matters
- For each key principle: name it, explain what it means, give an example or modern parallel, say why it's useful
- End with the "what to skip" section and bottom line verdict
- Use ElevenLabs API with voice ID `cgSgspJ2msm6clMCkdW9` (Jessica), model `eleven_multilingual_v2`

## Screenshot
- Set viewport first: `npx agent-browser set viewport 800 600`
- Open HTML via `npx agent-browser open file:///path/to/html`
- Full-page screenshot: `npx agent-browser screenshot /path/to/output.png -f`
- Close browser after: `npx agent-browser close`
- Delete the intermediate HTML file after screenshot
- The 800px viewport matches the body width in the template — no dead space on the right

## Learnings
(none yet)
- [2026-04-16] [[book-summary]] Viewport must match body width (800px, set viewport 800 600). Voice narration target ~5 min (not 1 min). Output to books/ folder at repo root as Obsidian notes with frontmatter, wiki links, tags, cross-references.
- [2026-04-17] [[book-summary]] 6-factor rating system: Core Ideas, Density, Actionability, Shelf Life, Uniqueness, Writing Quality. Visual bars in verdict section. Images stored in books/assets/, embedded via ![[Book Title.png]].
- [2026-04-20] [[book-summary]] Model can hallucinate book content — pulled from training-data reviews/excerpts, not actual PDFs. Core frameworks reliable for famous books, but exact quotes/details aren't guaranteed. For high-stakes summaries, verify against actual book text/PDFs (e.g. ingest to NotebookLM first).
- [2026-04-20] [[book-summary]] Chrome sandbox env fix: agent-browser's bundled chrome (at ~/.agent-browser/browsers/chrome-*/chrome) needs LD_LIBRARY_PATH set + --no-sandbox flag. Wrapper script installed — original binary preserved as chrome.real, wrapper exports LD_LIBRARY_PATH pointing to /home/claude/volatclaw/shared/chrome-libs/extracted/usr/lib/x86_64-linux-gnu and exec's real chrome with --no-sandbox. If book-summary screenshots break with libatk/sandbox errors, re-verify this wrapper.
- [2026-04-29] [[book-summary]] Headless chrome не имеет цветного эмодзи-шрифта. Фикс в template.html: <link> на Noto Color Emoji в <head> + добавить 'Noto Color Emoji' в body font-family. Без этого все цветные эмодзи рендерятся как tofu-боксы. Зафиксили на Personal MBA 2026-04-29.
