import { NextResponse } from 'next/server';
import { getSupabaseRouteHandlerClient } from '../../../lib/supabase-server';

// Force dynamic rendering for this route due to request.url usage
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const redirectTo = requestUrl.searchParams.get('redirectTo') ?? '/admin';
  const code = requestUrl.searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(`${requestUrl.origin}/admin/login?error=missing_code`);
  }

  const supabase = await getSupabaseRouteHandlerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${requestUrl.origin}/admin/login?error=${error.message}`);
  }

  return NextResponse.redirect(`${requestUrl.origin}${redirectTo}`);
}
