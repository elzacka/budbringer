/**
 * NEWS FETCHER - RSS SOURCE MANAGEMENT & CONTENT FILTERING
 * =========================================================
 * This file handles fetching news from RSS feeds and filtering relevant content.
 * It's crucial for adding new news sources and customizing content filtering.
 *
 * MAIN FUNCTIONS:
 * - fetchRSSFeed(): Downloads and parses RSS feeds from sources
 * - filterRelevantNews(): Filters articles based on keywords and criteria
 * - fetchAllSources(): Orchestrates fetching from all configured sources
 * - fetchNewsFromSources(): Main entry point for news collection
 *
 * FEATURES:
 * - RSS feed parsing with custom fields
 * - Keyword-based content filtering
 * - Source reliability tracking
 * - Circuit breaker pattern for unreliable sources
 * - Feed caching for performance
 * - Deduplication of similar articles
 * - Robots.txt compliance checking
 *
 * CUSTOMIZATION AREAS:
 * - Add new RSS sources in database
 * - Modify keyword filtering logic
 * - Adjust source reliability parameters
 * - Change caching behavior
 * - Update RSS parser configuration
 */

import Parser from 'rss-parser';
import { getSupabaseServiceClient } from './supabase-admin';
import { getDaysAgoOslo, getNowOsloISO } from './timezone';
import { deduplicateArticles } from './deduplication';
import { getCachedFeed, setCachedFeed } from './feed-cache';
import { circuitBreakerRegistry } from './circuit-breaker';
import { updateSourceReliability } from './source-reliability';

/**
 * DATA STRUCTURES
 * ===============
 */

/**
 * NewsItem represents a single news article from any source.
 * This is the standardized format used throughout the system.
 */
export interface NewsItem {
  title: string;              // Article headline
  description?: string;       // Article summary/excerpt
  url: string;               // Link to full article
  published_at: string;      // Publication date (ISO format)
  source: string;           // Source name (e.g., "TechCrunch")
  content?: string;         // Full article content (optional)
  category?: string;        // Article category (optional)
}

/**
 * ContentSource represents a news source configuration in the database.
 * This defines where and how to fetch news from different sources.
 */
export interface ContentSource {
  id: number;                           // Database ID
  name: string;                        // Display name (e.g., "TechCrunch")
  type: 'rss' | 'scraping' | 'api';   // How to fetch content
  base_url: string;                    // RSS feed URL or base website URL
  config: Record<string, unknown>;     // Source-specific configuration
  category: string;                    // Content category
  priority: number;                    // Source priority (higher = more important)
  active: boolean;                     // Whether source is enabled
}

/**
 * RSS PARSER CONFIGURATION
 * =========================
 * This configures how RSS feeds are parsed and what data is extracted.
 *
 * CUSTOMIZATION:
 * - timeout: Change RSS fetch timeout (currently 10 seconds)
 * - User-Agent: Update bot identification for RSS requests
 * - customFields: Add support for additional RSS fields
 */
const parser = new Parser({
  timeout: 10000,  // 10 second timeout for RSS requests
  headers: {
    // Identify our bot to RSS servers (some require this)
    'User-Agent': 'Budbringer-Bot/1.0 (+https://budbringer.no)',
  },
  customFields: {
    item: [
      // Extract additional fields from RSS items
      ['content:encoded', 'contentEncoded'],  // Full article content
      ['dc:creator', 'creator']               // Article author
    ]
  }
});

/**
 * FETCH RSS FEED
 * ==============
 * Downloads and parses RSS feed from a URL, with caching and error handling.
 *
 * INPUTS:
 * - url: RSS feed URL to fetch
 * - useCache: Whether to use cached results (default: true)
 *
 * OUTPUT: Array of NewsItem objects from the RSS feed
 *
 * FEATURES:
 * - Automatic feed caching for performance
 * - Oslo timezone conversion for publication dates
 * - Robust error handling and logging
 * - Support for various RSS formats
 *
 * CUSTOMIZATION:
 * - Modify caching behavior
 * - Adjust error handling
 * - Change timezone handling
 * - Add support for additional RSS fields
 */
export async function fetchRSSFeed(url: string, useCache: boolean = true): Promise<NewsItem[]> {
  // STEP 1: Check cache first (if enabled)
  if (useCache) {
    const cached = await getCachedFeed(url);
    if (cached) {
      return cached;
    }
  }

  const breaker = circuitBreakerRegistry.getOrCreate(`rss-feed-${url}`, {
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 15000,
    resetTimeout: 300000
  });

  try {
    const items = await breaker.execute(async () => {
      console.log(`Fetching RSS feed: ${url}`);

      const feed = await parser.parseURL(url);

      if (!feed.items || feed.items.length === 0) {
        console.warn(`No items found in RSS feed: ${url}`);
        return [];
      }

      return feed.items.map((item): NewsItem => {
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
    });

    if (useCache) {
      await setCachedFeed(url, items, 30);
    }

    return items;

  } catch (error) {
    console.error(`Error fetching RSS from ${url}:`, error);
    throw error;
  }
}

/**
 * FILTER RELEVANT NEWS
 * ====================
 * Filters news articles based on keywords and publication date.
 * This is where you customize what content gets included in the newsletter.
 *
 * INPUTS:
 * - items: Array of NewsItem objects to filter
 * - filterConfig: Configuration with keywords and age limits
 *
 * OUTPUT: Filtered array of relevant NewsItem objects
 *
 * FILTERING CRITERIA:
 * 1. Age filter: Only articles newer than maxAgeDays
 * 2. Keyword filter: Articles must contain at least one keyword
 *
 * CUSTOMIZATION:
 * - Add new filtering criteria (e.g., source priority, content length)
 * - Modify keyword matching logic (exact match, fuzzy matching, etc.)
 * - Adjust default age limit (currently 7 days)
 * - Add category-based filtering
 * - Implement relevance scoring instead of binary filtering
 */
export async function filterRelevantNews(items: NewsItem[], filterConfig: Record<string, unknown>): Promise<NewsItem[]> {
  // Extract configuration values with defaults
  const keywords = (filterConfig.filter_keywords as string[]) || [];
  const maxAgeDays = (filterConfig.max_age_days as number) || 7;

  // If no keywords specified, return all items (no filtering)
  if (keywords.length === 0) {
    return items;
  }

  // Calculate cutoff date for age filtering (in Oslo timezone)
  const cutoffDate = getDaysAgoOslo(maxAgeDays);

  return items.filter(item => {
    // FILTER 1: Check article age
    const itemDate = new Date(item.published_at);
    if (itemDate < cutoffDate) {
      return false; // Article too old
    }

    // FILTER 2: Check keyword relevance
    // Search in both title and description
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

        await updateSourceReliability(source.id, true);
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

      await updateSourceReliability(source.id, false);
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

/**
 * NEWS SOURCE CUSTOMIZATION REFERENCE GUIDE
 * ==========================================
 * Quick reference for managing RSS sources and content filtering.
 *
 * ADDING NEW RSS SOURCES:
 * 1. Add to content_sources table in database:
 *    - name: Display name (e.g., "TechCrunch")
 *    - type: "rss"
 *    - base_url: RSS feed URL
 *    - category: Content category
 *    - priority: Higher number = higher priority
 *    - active: true to enable
 *
 * 2. Assign to pipeline in pipeline_sources table:
 *    - pipeline_id: Usually 1 for main pipeline
 *    - content_source_id: ID from step 1
 *    - active: true
 *    - priority: Source priority within pipeline
 *
 * RSS PARSER CONFIGURATION:
 * - Line 83: Timeout (default: 10 seconds)
 * - Line 86: User-Agent string for RSS requests
 * - Lines 90-93: Custom RSS fields to extract
 *
 * CONTENT FILTERING:
 * - filterRelevantNews function (line 197)
 * - Line 200: Default max age (7 days)
 * - Lines 220-222: Keyword matching logic
 * - Add new filters in the items.filter() function
 *
 * KEYWORD FILTERING:
 * Keywords are stored in processor_config.filter_keywords
 * Common AI keywords: ['AI', 'artificial intelligence', 'machine learning',
 * 'KI', 'kunstig intelligens', 'maskinlæring', 'OpenAI', 'ChatGPT', 'GPT',
 * 'Claude', 'Gemini', 'Copilot', 'LLM', 'neural network']
 *
 * RELIABILITY & PERFORMANCE:
 * - Circuit breaker: Lines 129-132 (failure threshold, timeout)
 * - Caching: Managed by feed-cache.ts
 * - Source reliability: Tracked automatically in source-reliability.ts
 * - Deduplication: Handled by deduplication.ts
 *
 * COMMON CUSTOMIZATIONS:
 * 1. Add new RSS source: Update database tables (see above)
 * 2. Change filtering keywords: Update processor_config in database
 * 3. Adjust age limit: Modify line 200 or processor_config.max_age_days
 * 4. Add content scoring: Extend filterRelevantNews function
 * 5. Change RSS timeout: Modify line 83
 * 6. Add new RSS fields: Update lines 90-93
 *
 * TESTING RSS SOURCES:
 * 1. Run: npm run sources:test
 * 2. Check: npx tsx scripts/test-norwegian-sources.ts
 * 3. Debug: Use scripts/check-sources.ts to inspect source configuration
 *
 * TROUBLESHOOTING:
 * - Check Cloudflare logs for robots.txt issues
 * - Verify RSS feed URLs are accessible
 * - Test keyword filtering with sample articles
 * - Monitor source reliability scores
 * - Check circuit breaker status for failing sources
 *
 * DATABASE QUERIES TO MANAGE SOURCES:
 * -- Add new source
 * INSERT INTO content_sources (name, type, base_url, category, priority, active)
 * VALUES ('Source Name', 'rss', 'https://example.com/feed.xml', 'tech', 50, true);
 *
 * -- Assign to pipeline
 * INSERT INTO pipeline_sources (pipeline_id, content_source_id, active, priority)
 * VALUES (1, [source_id], true, 50);
 *
 * -- Update keywords
 * UPDATE pipeline_sources SET processor_config = '{"filter_keywords": ["AI", "KI"]}'
 * WHERE pipeline_id = 1;
 */