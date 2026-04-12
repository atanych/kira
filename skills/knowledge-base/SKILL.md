# Knowledge Base

## Description
Personal RAG system — ingest articles, YouTube videos, tweets, and notes into Postgres + pgvector with LightRAG dual-write. Search via vector similarity at item or chunk level.

## Usage

### Ingest
```bash
node skills/knowledge-base/scripts/ingest.js <url> [options]
node skills/knowledge-base/scripts/ingest.js --note "some text" [options]
```

**Options:**
- `--tags <tag1,tag2>` — manual tags
- `--title <title>` — override title
- `--type <source_type>` — override detected type (article, video, tweet, note)
- `--note <text>` — ingest raw text instead of URL
- `--content <text>` — provide pre-fetched content
- `--dry-run` — show what would be ingested
- `--no-linked` — don't follow links in tweets
- `--force` — override security quarantine
- `--no-lightrag` — skip LightRAG push

### Query
```bash
node skills/knowledge-base/scripts/query.js "search query" [options]
```

**Options:**
- `--limit <n>` — max results (default: 5)
- `--threshold <n>` — similarity threshold (default: 0.3)
- `--tags <tag1,tag2>` — filter by tags
- `--type <type>` — filter by source type
- `--author <name>` — filter by author
- `--chunks` — chunk-level RAG search (finds exact sections, includes timestamps for videos)
- `--graph` — LightRAG graph search only (hybrid mode)
- `--all` — both chunk-level vector + graph search combined (DEFAULT)
- `--full` — show full content

**Search modes:**
- Default (`--all`): chunk-level vector search + LightRAG graph search combined — best overall results
- `--chunks`: chunk-level vector search only (finds exact sections, includes timestamps for videos)
- `--graph`: LightRAG graph search only (good for entity/relationship queries)
- Item-level: omit `--chunks` and `--all` flags — matches title + summary + tags embedding (coarse, for finding which article/video covers a topic)

### Migrate
```bash
node skills/knowledge-base/scripts/migrate.js
```

## LightRAG Integration

### What gets pushed
- **KB items**: full content (article text, video transcript, tweet, note) + author — NOT summary
- **Meetings** (from CRM sync): full transcript + summary + decisions — see CRM SKILL.md

### Dedup strategy
- Each doc pushed with `file_source` = item ID (CRM interaction ID or KB item UUID)
- Dedup lookup uses `file_path` match from LightRAG's document list
- Before pushing: check if doc with same `file_source` exists → skip if yes
- On `force: true`: delete existing doc first via `DELETE /documents/delete_document`, then re-push
- LightRAG API does NOT support upsert — dedup must happen client-side

### LightRAG API endpoints used
- `POST /documents/text` — push document (`{ text, file_source }`)
- `GET /documents` — list all docs (grouped by status)
- `DELETE /documents/delete_document` — delete specific docs (`{ doc_ids: [...] }`)
- `DELETE /documents` — ⚠️ NUKES EVERYTHING — never use unless intentional full rebuild
- `POST /query` — query the graph (`{ query, mode: 'hybrid'|'local'|'global'|'naive' }`)

### Rebuild from scratch
If LightRAG needs a full rebuild:
1. Delete all docs (or use fresh instance)
2. Push all KB items from `knowledge_items` table (full content)
3. Push all meetings from `interactions` table — re-fetch transcripts from Grain API
4. Wait for pipeline to finish processing

## Chunking
- **Videos**: semantic chunking via GPT-4o-mini — splits transcript by topic boundaries, each chunk gets a topic label. Falls back to timestamp-based 750-token chunks if semantic split fails.
- **Articles/text**: paragraph-based 750-token chunks with 200-char overlap.
- AI processing (summary/tags) uses up to 60k chars of content. If truncated, ingestion summary shows a warning.

## Translation
- All content translated to English before ingestion (via `translateToEnglishIfNeeded`)
- Titles and author names translated via `translateShort`
- LightRAG always receives English content
- Bug fixed Apr 10: `finalTitle` now uses translated title (was using original)

## DB Schema
- **Schema**: `eli` (set by KB's db.js on connection)
- **`knowledge_items`** — title, content, summary, source_type, tags, entities, embedding, author, url
- **`knowledge_chunks`** — item_id (FK), chunk_index, chunk_text, embedding, timestamp_start/end
- Search functions: `search_knowledge()` (item-level), `search_knowledge_chunks()` (chunk-level)

## Input
- URLs (articles, YouTube, tweets)
- Raw text notes
- Search queries

## Output
- Ingestion: item ID + chunk count
- Query: ranked results with similarity scores, metadata, and links

## Learnings

[2026-04-11] **Post-ingest report**: After ingesting, reply with a short report from the ingest output — title, author, duration, content length (chars), chunks count, and summary. No DB re-pull needed, the ingest script already prints all of this.

[2026-04-11] **Specific item queries**: When asked about a specific item (e.g. "what's this video about"), pull that item by URL from the DB. Do NOT use graph/cross-reference search (LightRAG) — it synthesizes across the entire KB and will mix in data from other items. Graph search is for broad topic queries only.
