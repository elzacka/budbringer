ALTER TABLE content_sources ADD COLUMN IF NOT EXISTS reliability_score DECIMAL(3,2) DEFAULT 0.50;
ALTER TABLE content_sources ADD COLUMN IF NOT EXISTS historical_accuracy DECIMAL(3,2) DEFAULT 0.50;
ALTER TABLE content_sources ADD COLUMN IF NOT EXISTS fetch_success_rate DECIMAL(3,2) DEFAULT 1.00;
ALTER TABLE content_sources ADD COLUMN IF NOT EXISTS total_fetches INTEGER DEFAULT 0;
ALTER TABLE content_sources ADD COLUMN IF NOT EXISTS successful_fetches INTEGER DEFAULT 0;
ALTER TABLE content_sources ADD COLUMN IF NOT EXISTS last_fetch_success BOOLEAN DEFAULT true;
ALTER TABLE content_sources ADD COLUMN IF NOT EXISTS last_updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_content_sources_reliability ON content_sources(reliability_score DESC);

COMMENT ON COLUMN content_sources.reliability_score IS 'Overall reliability score (0.00-1.00) combining multiple factors';
COMMENT ON COLUMN content_sources.historical_accuracy IS 'Historical accuracy score based on fact-checking (0.00-1.00)';
COMMENT ON COLUMN content_sources.fetch_success_rate IS 'Success rate of RSS fetch attempts (0.00-1.00)';
COMMENT ON COLUMN content_sources.total_fetches IS 'Total number of fetch attempts';
COMMENT ON COLUMN content_sources.successful_fetches IS 'Number of successful fetch attempts';
COMMENT ON COLUMN content_sources.last_fetch_success IS 'Whether the last fetch was successful';
COMMENT ON COLUMN content_sources.last_updated_at IS 'Last time reliability metrics were updated';