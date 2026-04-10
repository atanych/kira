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

### Query
```bash
node skills/knowledge-base/scripts/query.js "search query" [options]
```

**Options:**
- `--limit <n>` — max results (default: 5)
- `--threshold <n>` — similarity threshold (default: 0.3)
- `--tags <tag1,tag2>` — filter by tags
- `--type <type>` — filter by source type
- `--chunks` — chunk-level RAG search instead of item-level
- `--full` — show full content

### Migrate
```bash
node skills/knowledge-base/scripts/migrate.js
```

## Input
- URLs (articles, YouTube, tweets)
- Raw text notes
- Search queries

## Output
- Ingestion: item ID + chunk count
- Query: ranked results with similarity scores, metadata, and links
