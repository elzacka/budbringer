import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '../types/database.types';

export function getSupabaseBrowserClient() {
  return createClientComponentClient<Database>();
}
