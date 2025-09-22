import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const supabaseUrl = process.env.SUPABASE_SERVICE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getSupabaseServiceClient() {
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Supabase service credentials mangler. Sett SUPABASE_SERVICE_URL og SUPABASE_SERVICE_ROLE_KEY.');
  }

  return createClient<Database>(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
