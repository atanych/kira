-- ============================================
-- Knowledge Base — Schema v1.0
-- Run on Railway PostgreSQL (same DB as CRM)
-- ============================================

-- Ensure vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- Items table (documents / cards)
-- ============================================

CREATE TABLE IF NOT EXISTS knowledge_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Content
  url TEXT,
  source_url TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  
  -- Classification
  source_type TEXT NOT NULL DEFAULT 'article',
  tags TEXT[] DEFAULT '{}',
  entities TEXT[] DEFAULT '{}',
  
  -- Relationships
  parent_id UUID REFERENCES knowledge_items(id),
  
  -- Search
  embedding VECTOR(1536),
  
  -- Metadata
  author TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ki_url ON knowledge_items(url) WHERE url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ki_source_type ON knowledge_items(source_type);
CREATE INDEX IF NOT EXISTS idx_ki_tags ON knowledge_items USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_ki_entities ON knowledge_items USING gin(entities);
CREATE INDEX IF NOT EXISTS idx_ki_created ON knowledge_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ki_parent ON knowledge_items(parent_id) WHERE parent_id IS NOT NULL;

-- ============================================
-- Chunks table (RAG retrieval)
-- ============================================

CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES knowledge_items(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding VECTOR(1536),
  
  -- Video timestamps
  timestamp_start FLOAT,
  timestamp_end FLOAT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(item_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_kc_item ON knowledge_chunks(item_id);

-- ============================================
-- Search functions
-- ============================================

-- Item-level search (by summary embedding)
CREATE OR REPLACE FUNCTION search_knowledge(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10,
  filter_source TEXT DEFAULT NULL,
  filter_tags TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  url TEXT,
  title TEXT,
  summary TEXT,
  source_type TEXT,
  tags TEXT[],
  entities TEXT[],
  author TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  similarity FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    ki.id, ki.url, ki.title, ki.summary, ki.source_type,
    ki.tags, ki.entities, ki.author, ki.published_at, ki.created_at,
    (1 - (ki.embedding <=> query_embedding))::FLOAT AS similarity
  FROM knowledge_items ki
  WHERE
    1 - (ki.embedding <=> query_embedding) > match_threshold
    AND (filter_source IS NULL OR ki.source_type = filter_source)
    AND (filter_tags IS NULL OR ki.tags && filter_tags)
  ORDER BY ki.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Chunk-level search (primary RAG search)
CREATE OR REPLACE FUNCTION search_knowledge_chunks(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10,
  filter_source TEXT DEFAULT NULL,
  filter_tags TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  chunk_id UUID,
  item_id UUID,
  chunk_text TEXT,
  chunk_index INT,
  timestamp_start FLOAT,
  timestamp_end FLOAT,
  title TEXT,
  url TEXT,
  source_type TEXT,
  tags TEXT[],
  author TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id, kc.item_id, kc.chunk_text, kc.chunk_index,
    kc.timestamp_start, kc.timestamp_end,
    ki.title, ki.url, ki.source_type, ki.tags, ki.author,
    (1 - (kc.embedding <=> query_embedding))::FLOAT AS similarity
  FROM knowledge_chunks kc
  JOIN knowledge_items ki ON ki.id = kc.item_id
  WHERE
    1 - (kc.embedding <=> query_embedding) > match_threshold
    AND (filter_source IS NULL OR ki.source_type = filter_source)
    AND (filter_tags IS NULL OR ki.tags && filter_tags)
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================
-- Auto-update timestamp trigger
-- ============================================

CREATE OR REPLACE FUNCTION update_ki_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ki_updated ON knowledge_items;
CREATE TRIGGER ki_updated BEFORE UPDATE ON knowledge_items
  FOR EACH ROW EXECUTE FUNCTION update_ki_timestamp();
