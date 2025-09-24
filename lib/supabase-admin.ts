// supabase-admin.ts
import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client
 * 
 * Bruker SUPABASE_SECRET_KEY (ikke anon, ikke service_role).
 * Denne nøkkelen må kun brukes på serversiden (API routes, workers, edge functions).
 */
export function getSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url) {
    throw new Error('Missing env var: NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!secretKey) {
    throw new Error('Missing env var: SUPABASE_SECRET_KEY');
  }

  return createClient(url, secretKey, {
    auth: {
      persistSession: false, // server-side: vi trenger ikke lagre session cookies
    },
  });
}
