-- Fix subscriber approval functionality

-- 1. Update status constraint to include 'rejected'
ALTER TABLE public.subscribers
DROP CONSTRAINT IF EXISTS subscribers_status_check;

ALTER TABLE public.subscribers
ADD CONSTRAINT subscribers_status_check
CHECK (status IN ('pending', 'confirmed', 'unsubscribed', 'rejected'));

-- 2. Add notes field for rejection reasons
ALTER TABLE public.subscribers
ADD COLUMN IF NOT EXISTS notes text;

-- 3. Ensure admin_actions table exists for logging approval/rejection actions
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  target_id uuid,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Add RLS policy for admin_actions if it doesn't exist
ALTER TABLE public.admin_actions ENABLE row level security;

DROP POLICY IF EXISTS "Admins can manage admin_actions" ON public.admin_actions;
CREATE POLICY "Admins can manage admin_actions" ON public.admin_actions
  FOR ALL USING (
    auth.jwt() -> 'app_metadata' -> 'roles' ? 'admin'
  )
  WITH CHECK (
    auth.jwt() -> 'app_metadata' -> 'roles' ? 'admin'
  );