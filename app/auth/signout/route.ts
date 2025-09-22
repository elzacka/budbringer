import { NextResponse } from 'next/server';
import { getSupabaseRouteHandlerClient } from '../../../lib/supabase-server';

export async function POST(request: Request) {
  const supabase = getSupabaseRouteHandlerClient();
  await supabase.auth.signOut();
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(`${origin}/admin/login`, { status: 302 });
}
