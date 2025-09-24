import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '../types/database.types';

export async function getSupabaseServerComponentClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(key: string) {
          return cookieStore.get(key)?.value;
        },
        set(key: string, value: string, options: { [key: string]: unknown }) {
          try {
            cookieStore.set({ name: key, value, ...options });
          } catch {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(key: string, options: { [key: string]: unknown }) {
          try {
            cookieStore.set({ name: key, value: '', ...options });
          } catch {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

export async function getSupabaseRouteHandlerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(key: string) {
          return cookieStore.get(key)?.value;
        },
        set(key: string, value: string, options: { [key: string]: unknown }) {
          cookieStore.set({ name: key, value, ...options });
        },
        remove(key: string, options: { [key: string]: unknown }) {
          cookieStore.set({ name: key, value: '', ...options });
        },
      },
    }
  );
}
