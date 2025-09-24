import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { Database } from './types/database.types';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(key: string) {
          return request.cookies.get(key)?.value;
        },
        set(key: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name: key,
            value,
            ...options,
          });
          response.cookies.set({
            name: key,
            value,
            ...options,
          });
        },
        remove(key: string, options: CookieOptions) {
          request.cookies.set({
            name: key,
            value: '',
            ...options,
          });
          response.cookies.set({
            name: key,
            value: '',
            ...options,
          });
        },
      },
    }
  );

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
