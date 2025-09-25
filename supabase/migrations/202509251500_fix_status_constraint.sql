-- Fix conflicting status constraint for subscribers table

-- 1. Drop the column completely and recreate it to remove the inline constraint
ALTER TABLE public.subscribers DROP COLUMN status CASCADE;

-- 2. Add the column back with the correct constraint
ALTER TABLE public.subscribers
ADD COLUMN status text NOT NULL DEFAULT 'pending'
CHECK (status IN ('pending', 'confirmed', 'unsubscribed', 'rejected'));

-- 3. Recreate the index
CREATE INDEX IF NOT EXISTS subscribers_status_idx ON public.subscribers(status);

-- 4. Update any existing data that might need the new status
-- (This should be safe since we're just adding 'rejected' as a new option)