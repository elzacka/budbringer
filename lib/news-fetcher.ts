import Parser from 'rss-parser';
import { getSupabaseServiceClient } from './supabase-admin';
import { getDaysAgoOslo, getNowOsloISO } from './timezone';
import { deduplicateArticles } from './deduplication';
import { getCachedFeed, setCachedFeed } from './feed-cache';

export interface NewsItem {
  title: string;
  description?: string;
  url: string;
  published_at: string;
  source: string;
  content?: string;
  category?: string;
}

export interface ContentSource {
  id: number;
  name: string;
  type: 'rss' | 'scraping' | 'api';
  base_url: string;
  config: Record<string, unknown>;
  category: string;
  priority: number;
  active: boolean;
}

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Budbringer-Bot/1.0 (+https://budbringer.no)',
  },
  customFields: {
    item: [
      ['content:encoded', 'contentEncoded'],
      ['dc:creator', 'creator']
    ]
  }
});

export async function fetchRSSFeed(url: string, useCache: boolean = true): Promise<NewsItem[]> {
  try {
    if (useCache) {
      const cached = await getCachedFeed(url);
      if (cached) {
        return cached;
      }
    }

    console.log(`Fetching RSS feed: ${url}`);

    const feed = await parser.parseURL(url);

    if (!feed.items || feed.items.length === 0) {
      console.warn(`No items found in RSS feed: ${url}`);
      return [];
    }

    const items = feed.items.map((item): NewsItem => {
      const publishedDate = item.pubDate || item.isoDate || getNowOsloISO();
      const content = (item as { contentEncoded?: string }).contentEncoded || item.content || '';

      return {
        title: item.title || 'No Title',
        description: item.contentSnippet || item.summary || '',
        url: item.link || item.guid || '',
        published_at: publishedDate,
        source: feed.title || 'Unknown',
        content: content
      };
    }).filter(item => item.url && item.title);

    if (useCache) {
      await setCachedFeed(url, items, 30);
    }

    return items;

  } catch (error) {
    console.error(`Error fetching RSS from ${url}:`, error);
    throw error;
  }
}

export async function filterRelevantNews(items: NewsItem[], filterConfig: Record<string, unknown>): Promise<NewsItem[]> {
  const keywords = (filterConfig.filter_keywords as string[]) || [];
  const maxAgeDays = (filterConfig.max_age_days as number) || 7;

  if (keywords.length === 0) {
    return items;
  }

  const cutoffDate = getDaysAgoOslo(maxAgeDays);

  return items.filter(item => {
    // Check age
    const itemDate = new Date(item.published_at);
    if (itemDate < cutoffDate) {
      return false;
    }

    // Check relevance based on keywords
    const searchText = `${item.title} ${item.description || ''}`.toLowerCase();
    const hasRelevantKeyword = keywords.some((keyword: string) =>
      searchText.includes(keyword.toLowerCase())
    );

    return hasRelevantKeyword;
  });
}

export async function fetchNewsFromSources(pipelineId: number): Promise<NewsItem[]> {
  const supabase = getSupabaseServiceClient();

  // Get active sources for this pipeline
  const { data: pipelineSources, error: sourcesError } = await supabase
    .from('pipeline_sources')
    .select(`
      priority,
      processor_config,
      content_sources (
        id,
        name,
        type,
        base_url,
        config,
        category,
        priority,
        active
      )
    `)
    .eq('pipeline_id', pipelineId)
    .eq('active', true)
    .order('priority', { ascending: false });

  if (sourcesError) {
    console.error('Error fetching pipeline sources:', sourcesError);
    throw sourcesError;
  }

  if (!pipelineSources || pipelineSources.length === 0) {
    console.warn('No active sources found for pipeline', pipelineId);
    return [];
  }

  console.log(`Found ${pipelineSources.length} active sources for pipeline ${pipelineId}`);

  const allNews: NewsItem[] = [];
  const errors: string[] = [];

  // Fetch from each source with respectful delays
  for (let i = 0; i < pipelineSources.length; i++) {
    const pipelineSource = pipelineSources[i];
    const source = pipelineSource.content_sources as unknown as ContentSource;

    if (!source || !source.active) {
      continue;
    }

    // Add a small delay between different sources to be respectful
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms between sources
    }

    try {
      console.log(`Fetching from source: ${source.name} (${source.type})`);

      let sourceNews: NewsItem[] = [];

      if (source.type === 'rss') {
        sourceNews = await fetchRSSFeed(source.base_url);

        // Apply filtering
        if (source.config && Object.keys(source.config).length > 0) {
          sourceNews = await filterRelevantNews(sourceNews, source.config);
        }

        console.log(`Found ${sourceNews.length} relevant articles from ${source.name}`);
      } else {
        console.warn(`Source type '${source.type}' not implemented yet for ${source.name}`);
        continue;
      }

      // Add metadata
      sourceNews.forEach(item => {
        item.source = source.name;
        item.category = source.category;
      });

      allNews.push(...sourceNews);

    } catch (error) {
      const errorMsg = `Failed to fetch from ${source.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg);
      errors.push(errorMsg);

      // Continue with other sources even if one fails
    }
  }

  console.log(`Total articles collected: ${allNews.length}`);

  if (errors.length > 0) {
    console.warn(`Encountered ${errors.length} errors during news fetching:`, errors);
  }

  const uniqueNews = deduplicateArticles(allNews, true, 0.8);

  const sortedNews = uniqueNews.sort((a, b) =>
    new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );

  return sortedNews;
}

export async function storeContentItems(pipelineId: number, items: NewsItem[]): Promise<void> {
  if (items.length === 0) {
    return;
  }

  const supabase = getSupabaseServiceClient();

  // Convert NewsItems to database format
  const contentItems = items.map(item => ({
    pipeline_id: pipelineId,
    title: item.title,
    url: item.url,
    summary: item.description,
    content: item.content,
    published_at: item.published_at,
    source_name: item.source,
    category: item.category,
    processed_at: getNowOsloISO()
  }));

  // Insert items, ignoring duplicates
  const { error } = await supabase
    .from('content_items')
    .upsert(contentItems, {
      onConflict: 'url',
      ignoreDuplicates: true
    });

  if (error) {
    console.error('Error storing content items:', error);
    throw error;
  }

  console.log(`Stored ${contentItems.length} content items in database`);
}