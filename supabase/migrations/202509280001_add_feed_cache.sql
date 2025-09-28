CREATE TABLE IF NOT EXISTS feed_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_url TEXT NOT NULL UNIQUE,
  feed_data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feed_cache_url ON feed_cache(feed_url);
CREATE INDEX idx_feed_cache_expires ON feed_cache(expires_at);

COMMENT ON TABLE feed_cache IS 'Cache for RSS feed fetches with TTL';
COMMENT ON COLUMN feed_cache.feed_url IS 'URL of the RSS feed';
COMMENT ON COLUMN feed_cache.feed_data IS 'Cached feed items as JSON';
COMMENT ON COLUMN feed_cache.fetched_at IS 'When the feed was fetched';
COMMENT ON COLUMN feed_cache.expires_at IS 'When the cache entry expires';