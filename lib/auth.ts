import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

export async function requireAdmin(supabase: SupabaseClient<Database>) {
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: NextResponse.json({ error: 'Ikke innlogget' }, { status: 401 }) };
  }

  const isAdmin = user?.app_metadata?.roles?.includes?.('admin') ?? user?.user_metadata?.is_admin;

  if (!isAdmin) {
    return { error: NextResponse.json({ error: 'Ikke tilgang' }, { status: 403 }) };
  }

  return { user };
}
