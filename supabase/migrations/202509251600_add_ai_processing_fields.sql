-- Add fields needed for AI-powered digest processing

-- 1. Add pipeline_id to digest_runs if it doesn't exist
ALTER TABLE public.digest_runs
ADD COLUMN IF NOT EXISTS pipeline_id integer REFERENCES public.pipelines(id);

-- 2. Add AI processing metrics
ALTER TABLE public.digest_runs
ADD COLUMN IF NOT EXISTS sources_checked integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS sources_failed integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS items_processed integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_tokens_used integer DEFAULT 0;

-- 3. Add source_name to content_items for tracking
ALTER TABLE public.content_items
ADD COLUMN IF NOT EXISTS source_name text;

-- 4. Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_digest_runs_pipeline_executed ON public.digest_runs(pipeline_id, executed_for DESC);
CREATE INDEX IF NOT EXISTS idx_content_items_source_published ON public.content_items(source_name, published_at DESC);