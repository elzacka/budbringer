import { cookies } from 'next/headers';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '../types/database.types';

export function getSupabaseServerActionClient() {
  return createServerActionClient<Database>({ cookies });
}
