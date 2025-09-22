import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from './types/database.types';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const supabase = createMiddlewareClient<Database>({ req: request, res: response });

  if (request.nextUrl.pathname.startsWith('/admin')) {
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session && request.nextUrl.pathname !== '/admin/login') {
      const redirectTo = encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search);
      const loginUrl = new URL(`/admin/login?redirectTo=${redirectTo}`, request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*']
};
