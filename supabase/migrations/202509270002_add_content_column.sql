-- Add content column to content_items table
-- This column will store the article content from RSS feeds

ALTER TABLE public.content_items
ADD COLUMN IF NOT EXISTS content TEXT;

-- Add index for content search if needed
CREATE INDEX IF NOT EXISTS idx_content_items_content_length
ON public.content_items(length(content));

-- Comment explaining the column
COMMENT ON COLUMN public.content_items.content IS 'Full article content from RSS feeds or scraped sources';