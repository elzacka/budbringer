-- Add updated_at column to pipeline_sources so we can track modifications
ALTER TABLE IF EXISTS public.pipeline_sources
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT NOW();

UPDATE public.pipeline_sources
SET updated_at = COALESCE(updated_at, NOW());

-- Attach existing updated_at trigger function if available
DO
$$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_pipeline_sources_updated_at') THEN
      CREATE TRIGGER set_pipeline_sources_updated_at
        BEFORE UPDATE ON public.pipeline_sources
        FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
    END IF;
  END IF;
END
$$;
