import { cookies } from 'next/headers';
import {
  createServerComponentClient,
  createRouteHandlerClient
} from '@supabase/auth-helpers-nextjs';
import type { Database } from '../types/database.types';

export function getSupabaseServerComponentClient() {
  return createServerComponentClient<Database>({ cookies });
}

export function getSupabaseRouteHandlerClient() {
  return createRouteHandlerClient<Database>({ cookies });
}
