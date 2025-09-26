-- Add category column to content_items table
-- This column stores the category/topic of each article for better organization and filtering

ALTER TABLE public.content_items
ADD COLUMN IF NOT EXISTS category TEXT;

-- Add index for category filtering
CREATE INDEX IF NOT EXISTS idx_content_items_category
ON public.content_items(category);

-- Add comment for documentation
COMMENT ON COLUMN public.content_items.category IS 'Article category/topic (e.g., AI, Technology, Science)';