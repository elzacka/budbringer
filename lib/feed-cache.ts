import { getSupabaseServiceClient } from './supabase-admin';
import type { NewsItem } from './news-fetcher';

export interface CachedFeed {
  feedUrl: string;
  items: NewsItem[];
  fetchedAt: string;
  expiresAt: string;
}

const DEFAULT_CACHE_TTL_MINUTES = 30;

export async function getCachedFeed(feedUrl: string): Promise<NewsItem[] | null> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('feed_cache')
    .select('feed_data, expires_at')
    .eq('feed_url', feedUrl)
    .single();

  if (error || !data) {
    return null;
  }

  const expiresAt = new Date(data.expires_at);
  const now = new Date();

  if (now > expiresAt) {
    console.log(`Cache expired for ${feedUrl}, will fetch fresh data`);
    await supabase.from('feed_cache').delete().eq('feed_url', feedUrl);
    return null;
  }

  console.log(`Using cached data for ${feedUrl} (expires in ${Math.round((expiresAt.getTime() - now.getTime()) / 60000)} minutes)`);

  return data.feed_data as NewsItem[];
}

export async function setCachedFeed(
  feedUrl: string,
  items: NewsItem[],
  ttlMinutes: number = DEFAULT_CACHE_TTL_MINUTES
): Promise<void> {
  const supabase = getSupabaseServiceClient();

  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);

  const { error } = await supabase
    .from('feed_cache')
    .upsert(
      {
        feed_url: feedUrl,
        feed_data: items,
        fetched_at: now.toISOString(),
        expires_at: expiresAt.toISOString()
      },
      {
        onConflict: 'feed_url'
      }
    );

  if (error) {
    console.error(`Error caching feed ${feedUrl}:`, error);
  } else {
    console.log(`Cached ${items.length} items for ${feedUrl} (TTL: ${ttlMinutes} minutes)`);
  }
}

export async function clearExpiredCache(): Promise<number> {
  const supabase = getSupabaseServiceClient();

  const now = new Date();

  const { data, error } = await supabase
    .from('feed_cache')
    .delete()
    .lt('expires_at', now.toISOString())
    .select('id');

  if (error) {
    console.error('Error clearing expired cache:', error);
    return 0;
  }

  const clearedCount = data?.length || 0;
  if (clearedCount > 0) {
    console.log(`Cleared ${clearedCount} expired cache entries`);
  }

  return clearedCount;
}

export async function clearAllCache(): Promise<void> {
  const supabase = getSupabaseServiceClient();

  const { error } = await supabase.from('feed_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) {
    console.error('Error clearing all cache:', error);
    throw error;
  }

  console.log('Cleared all feed cache');
}