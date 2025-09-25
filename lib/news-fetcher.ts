import { XMLParser } from 'fast-xml-parser';
import { getSupabaseServiceClient } from './supabase-admin';
import { getDaysAgoOslo, getNowOsloISO, parseOsloDate } from './timezone';

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

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_'
});

export async function fetchRSSFeed(url: string): Promise<NewsItem[]> {
  try {
    console.log(`Fetching RSS feed: ${url}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Budbringer-Bot/1.0 (+https://budbringer.no)',
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const xmlText = await response.text();
    const xmlData = xmlParser.parse(xmlText);

    // Handle different RSS formats
    const channel = xmlData.rss?.channel || xmlData.feed;
    if (!channel) {
      throw new Error('Invalid RSS/Atom feed format');
    }

    const items = channel.item || channel.entry || [];
    const itemArray = Array.isArray(items) ? items : [items];

    return itemArray.map((item: Record<string, unknown>): NewsItem => {
      // Handle different date formats
      let publishedDate = item.pubDate || item.published || item['dc:date'] || getNowOsloISO();

      // Convert to ISO string if needed
      if (typeof publishedDate === 'string' && !publishedDate.includes('T')) {
        const parsedDate = parseOsloDate(publishedDate);
        publishedDate = parsedDate.toISOString();
      }

      const title = (item.title as Record<string, unknown>)?.['#text'] || item.title || 'No Title';
      const description = (item.description as Record<string, unknown>)?.['#text'] || item.description ||
                         (item.summary as Record<string, unknown>)?.['#text'] || item.summary || '';
      const url = (item.link as Record<string, unknown>)?.['@_href'] || item.link ||
                  (item.guid as Record<string, unknown>)?.['#text'] || item.guid || '';
      const source = (channel.title as Record<string, unknown>)?.['#text'] || channel.title || 'Unknown';
      const content = item['content:encoded'] || (item.content as Record<string, unknown>)?.['#text'] || item.content || '';

      return {
        title: String(title),
        description: String(description),
        url: String(url),
        published_at: String(publishedDate),
        source: String(source),
        content: String(content)
      };
    }).filter(item => item.url && item.title);

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

  // Fetch from each source
  for (const pipelineSource of pipelineSources) {
    const source = pipelineSource.content_sources as unknown as ContentSource;

    if (!source || !source.active) {
      continue;
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

  // Sort by date (newest first) and remove duplicates
  const uniqueNews = removeDuplicates(allNews);
  const sortedNews = uniqueNews.sort((a, b) =>
    new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );

  return sortedNews;
}

function removeDuplicates(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  return items.filter(item => {
    // Use URL as primary deduplication key, fallback to title
    const key = item.url || item.title.toLowerCase().trim();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
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