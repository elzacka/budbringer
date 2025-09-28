CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE content_items ADD COLUMN IF NOT EXISTS embedding vector(1536);

CREATE INDEX IF NOT EXISTS idx_content_items_embedding ON content_items
USING hnsw (embedding vector_cosine_ops);

COMMENT ON COLUMN content_items.embedding IS 'OpenAI text-embedding-ada-002 vector (1536 dimensions) for semantic search';