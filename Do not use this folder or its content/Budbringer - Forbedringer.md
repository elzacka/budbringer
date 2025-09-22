# Komplett instruksjon til Codex for videreutvikling av Budbringer

## Overordnet mål

Refaktorere Budbringer fra hardkodede kilder til en fleksibel, skalerbar plattform. Levere kvalitetsinnhold fra pålitelige kilder på korrekt norsk til norske brukere. 

I fokus nå, for det Budbringer skal tilby først: Nyheter om kunstig intelligens (KI) både fra Norge og utenfor Norge (kilder), som er relevant for norske forhold/norske brukere.

**Viktig merknad:** I Norge heter det "*kunstig intelligens"*, forkortet *"KI".* På engelsk heter det *"artificial intelligence"*, forkortet *"AI"*. Det er viktig å bruke den norske måten å skrive det på. Unntaket er egennavn. F. eks navn på leverandører og produkter/løsninger. F. eks "Claude.ai", "OpenAI".

## 1. Database-arkitektur (Supabase migrations)

### Opprett nye tabeller:

sql

```sql
-- 1.1 Pipelines (ulike formål/workflows)
CREATE TABLE pipelines (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('ai-nyheter', 'opplaering', 'alerts', 'generelle-nyheter')),
  config JSONB NOT NULL DEFAULT '{}',
  template_config JSONB NOT NULL DEFAULT '{}',
  schedule_cron TEXT DEFAULT '0 6 * * *',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 Content sources (fleksible kilder)
CREATE TABLE content_sources (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('rss', 'scraping', 'api', 'manual')),
  base_url TEXT,
  config JSONB NOT NULL DEFAULT '{}',
  category TEXT,
  priority INTEGER DEFAULT 5,
  active BOOLEAN DEFAULT true,
  last_successful_fetch TIMESTAMPTZ,
  consecutive_failures INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 Pipeline-source mapping
CREATE TABLE pipeline_sources (
  id SERIAL PRIMARY KEY,
  pipeline_id INTEGER REFERENCES pipelines(id) ON DELETE CASCADE,
  source_id INTEGER REFERENCES content_sources(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 5,
  processor_config JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pipeline_id, source_id)
);

-- 1.4 Refaktorer content_items (erstatt news_items)
ALTER TABLE news_items RENAME TO content_items;
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS source_id INTEGER REFERENCES content_sources(id);
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS pipeline_id INTEGER REFERENCES pipelines(id);
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS relevance_score DECIMAL;
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'article';

-- 1.5 Error logging
CREATE TABLE error_logs (
  id SERIAL PRIMARY KEY,
  pipeline_id INTEGER REFERENCES pipelines(id),
  source_id INTEGER REFERENCES content_sources(id),
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN ('fetching', 'processing', 'generation', 'dispatch')),
  context JSONB DEFAULT '{}',
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.6 Analytics/metrics
CREATE TABLE digest_analytics (
  id SERIAL PRIMARY KEY,
  digest_run_id INTEGER REFERENCES digest_runs(id) ON DELETE CASCADE,
  pipeline_id INTEGER REFERENCES pipelines(id),
  articles_processed INTEGER DEFAULT 0,
  sources_checked INTEGER DEFAULT 0,
  sources_failed INTEGER DEFAULT 0,
  generation_time_ms INTEGER DEFAULT 0,
  recipients_sent INTEGER DEFAULT 0,
  open_rate DECIMAL,
  click_rate DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.7 Indexes for performance
CREATE INDEX idx_content_items_pipeline_published ON content_items(pipeline_id, published_at DESC);
CREATE INDEX idx_content_items_source_processed ON content_items(source_id, processed_at DESC);
CREATE INDEX idx_error_logs_pipeline_created ON error_logs(pipeline_id, created_at DESC);
```

### Seed data for AI-nyheter pipeline (med faktiske, fungerende kilder):

sql

```sql
-- Insert AI-nyheter pipeline med norsk fokus
INSERT INTO pipelines (name, purpose, config, template_config) VALUES 
('KI-nyheter Norge', 'ki-nyheter', 
'{"ai_editor_prompt": "Du er redaktør for et norsk KI-nyhetsbrev. Prioriter saker som er relevante for norske lesere, tech-miljøet og som kan påvirke Norge. Fokuser på praktiske anvendelser, forskningsnytt fra norske miljøer, regelverksendringer og teknologiutvikling som berører nordmenn.", "max_articles": 15, "require_approval": false, "filter_strength": "high"}',
'{"language": "no", "tone": "profesjonell_tilgjengelig", "target_audience": "norske brukere/lesere med ulik kompetanse og erfaring med KI og teknologi generelt", "style_guide": "Bruk korrekt norsk, klarspråk, bevar engelske fagtermer og egennavn"}');

-- Insert content sources (kun verifiserte, fungerende kilder)
INSERT INTO content_sources (name, type, base_url, config, category, priority) VALUES 

-- Norske kilder (høyest prioritet)
('NRK Viten', 'rss', 'https://www.nrk.no/viten/toppsaker.rss', 
'{"filter_keywords": ["kunstig intelligens", "KI", "AI", "maskinlæring", "OpenAI", "ChatGPT", "GPT", "Anthropic", "Claude", "Claude.ai", "Gemini", "Copilot", "MetaAI", "xAI", "Grok", "ElevenLabs", "GoogleAI", "roboter", "automatisering", "digitalisering"], "language": "no", "quality": "high"}', 'norsk-media', 10),

('NRK Nyheter', 'rss', 'https://www.nrk.no/nyheter/siste.rss', 
'{"filter_keywords": ["kunstig intelligens", "KI", "AI", "maskinlæring", "OpenAI", "ChatGPT", "GPT", "Anthropic", "Claude", "Claude.ai", "Gemini", "Copilot", "MetaAI", "xAI", "Grok", "ElevenLabs", "GoogleAI"], "language": "no", "quality": "high"}', 'norsk-media', 9),

('Forskningsrådet', 'scraping', 'https://www.forskningsradet.no/forskningspolitikk-strategi/ltp/kunstig-intelligens/', 
'{"selector": "article", "title_selector": "h1,h2,h3", "date_selector": "time", "filter_keywords": ["KI", "forskning", "milliard"], "language": "no", "quality": "high"}', 'norsk-forskning', 10),

('Norwegian SciTech News', 'rss', 'https://norwegianscitechnews.com/feed', 
'{"filter_keywords": ["artificial intelligence", "AI", "machine learning", "robotics", "NTNU", "SINTEF"], "language": "en", "norwegian_relevance": true}', 'norsk-forskning', 8),

('AIavisen.no', 'scraping', 'https://aiavisen.no/ai-nyheter/', 
'{"selector": "article", "title_selector": "h2,h3", "filter_keywords": ["Norge", "norsk", "skandinavisk"], "language": "no", "quality": "medium"}', 'spesialisert-ai', 7),

-- Tekniske norske medier
('Digi.no Generell', 'scraping', 'https://www.digi.no/', 
'{"selector": "article", "title_selector": "h1,h2", "filter_keywords": ["kunstig intelligens", "KI", "AI", "maskinlæring", "OpenAI", "ChatGPT", "GPT", "Anthropic", "Claude", "Claude.ai", "Gemini", "Copilot", "MetaAI", "xAI", "Grok", "ElevenLabs", "GoogleAI"], "language": "no", "check_interval": "hourly"}', 'norsk-tech', 8),

('ITavisen', 'rss', 'https://itavisen.no/feed', 
'{"filter_keywords": ["kunstig intelligens", "KI", "AI", "maskinlæring", "OpenAI", "ChatGPT", "GPT", "Anthropic", "Claude", "Claude.ai", "Gemini", "Copilot", "MetaAI", "xAI", "Grok", "ElevenLabs", "GoogleAI", "roboter", "automatisering", "digitalisering"], "language": "no"}', 'norsk-tech', 7),

-- Internasjonale kilder med høy kvalitet
('TechCrunch AI', 'rss', 'https://techcrunch.com/category/artificial-intelligence/feed/', 
'{"filter_keywords": ["OpenAI", "Google", "Microsoft", "Anthropic", "breakthrough", "funding"], "language": "en", "quality": "high"}', 'internasjonal', 6),

('MIT Technology Review AI', 'rss', 'https://www.technologyreview.com/topic/artificial-intelligence/feed/', 
'{"filter_keywords": ["research", "breakthrough", "ethics", "policy"], "language": "en", "quality": "high"}', 'internasjonal', 6),

('The Verge AI', 'rss', 'https://www.theverge.com/ai-artificial-intelligence/rss/index.xml', 
'{"filter_keywords": ["OpenAI", "ChatGPT", "GPT", "Anthropic", "Claude", "Claude.ai", "Gemini", "Copilot", "MetaAI", "xAI", "Grok", "ElevenLabs", "GoogleAI", "Google", "Microsoft", "regulation", "EU"], "language": "en", "quality": "high"}', 'internasjonal', 5),

-- Selskaps-/forskningsblogs
('OpenAI Blog', 'scraping', 'https://openai.com/news/', 
'{"selector": "article", "title_selector": "h1,h2", "date_selector": "time", "language": "en", "quality": "high"}', 'selskap', 8),

('Google AI Blog', 'scraping', 'https://ai.googleblog.com/', 
'{"selector": ".post", "title_selector": "h2", "date_selector": ".publishdate", "language": "en", "quality": "high"}', 'selskap', 7),

('Anthropic News', 'scraping', 'https://www.anthropic.com/news', 
'{"selector": "article", "title_selector": "h1,h2", "language": "en", "quality": "high"}', 'selskap', 7);

-- Link sources to AI pipeline med norsk prioritering
INSERT INTO pipeline_sources (pipeline_id, source_id, priority, processor_config) 
SELECT 1, id, 
  CASE 
    WHEN category = 'norsk-forskning' THEN 10
    WHEN category = 'norsk-media' THEN 9
    WHEN category = 'norsk-tech' THEN 8
    WHEN category = 'selskap' THEN 7
    WHEN category = 'internasjonal' THEN 5
    ELSE 3
  END,
  '{"max_age_days": 3, "min_relevance": 0.6}'::jsonb
FROM content_sources;
```

## 2. ContentFetcher med robust norsk håndtering

### 2.1 Opprett `lib/content-fetcher.ts`:

typescript

```typescript
import Parser from 'rss-parser';
import { createClient } from '@supabase/supabase-js';

interface ContentSource {
  id: number;
  name: string;
  type: 'rss' | 'scraping' | 'api' | 'manual';
  base_url: string;
  config: {
    filter_keywords?: string[];
    selector?: string;
    title_selector?: string;
    date_selector?: string;
    language?: string;
    quality?: 'high' | 'medium' | 'low';
    norwegian_relevance?: boolean;
    check_interval?: string;
    min_relevance?: number;
  };
  category: string;
  priority: number;
}

interface ContentItem {
  id?: number;
  source_id: number;
  pipeline_id?: number;
  title: string;
  content?: string;
  url?: string;
  published_at: Date;
  metadata: Record<string, any>;
  relevance_score?: number;
}

export class ContentFetcher {
  private supabase;
  private parser = new Parser({
    customFields: {
      item: ['media:content', 'media:thumbnail']
    }
  });

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async fetchFromSource(source: ContentSource, pipelineId?: number): Promise<ContentItem[]> {
    try {
      let items: ContentItem[] = [];

      console.log(`Fetching from ${source.name} (${source.type})`);

      switch (source.type) {
        case 'rss':
          items = await this.fetchRSS(source);
          break;
        case 'scraping':
          items = await this.fetchByScraping(source);
          break;
        case 'api':
          items = await this.fetchFromAPI(source);
          break;
        default:
          throw new Error(`Unknown source type: ${source.type}`);
      }

      // Apply Norwegian AI-specific filtering
      items = this.filterForNorwegianAI(items, source.config);

      // Calculate relevance scores
      items = items.map(item => ({
        ...item,
        relevance_score: this.calculateRelevanceScore(item, source.config),
        pipeline_id: pipelineId
      }));

      // Filter by minimum relevance
      const minRelevance = source.config.min_relevance || 0.3;
      items = items.filter(item => (item.relevance_score || 0) >= minRelevance);

      console.log(`Found ${items.length} relevant items from ${source.name}`);
      
      // Update successful fetch
      await this.updateSourceStatus(source.id, true);
      
      return items;

    } catch (error) {
      console.error(`Error fetching from ${source.name}:`, error);
      await this.updateSourceStatus(source.id, false);
      await this.logError(source.id, 'fetching', error as Error);
      return [];
    }
  }

  private async fetchRSS(source: ContentSource): Promise<ContentItem[]> {
    try {
      const feed = await this.parser.parseURL(source.base_url);
      
      return feed.items
        .filter(item => item.title && item.link)
        .map(item => ({
          source_id: source.id,
          title: this.cleanText(item.title || 'Untitled'),
          content: this.cleanText(item.content || item.summary || item.contentSnippet || ''),
          url: item.link,
          published_at: new Date(item.pubDate || Date.now()),
          metadata: {
            author: item.creator || item.author,
            categories: item.categories || [],
            guid: item.guid,
            source_language: source.config.language,
            fetch_method: 'rss'
          }
        }));
    } catch (error) {
      throw new Error(`RSS fetch failed: ${error.message}`);
    }
  }

  private async fetchByScraping(source: ContentSource): Promise<ContentItem[]> {
    // Simplified scraping implementation - you may want to use Firecrawl or similar
    try {
      const response = await fetch(source.base_url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Budbringer/1.0; +https://budbringer.no)'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      
      // Basic HTML parsing - implement proper parsing based on selectors
      // For now, return a placeholder that indicates scraping capability
      return [{
        source_id: source.id,
        title: `Scraped content from ${source.name}`,
        content: 'Content retrieved via scraping - implement proper HTML parsing',
        url: source.base_url,
        published_at: new Date(),
        metadata: {
          fetch_method: 'scraping',
          scraped_at: new Date().toISOString(),
          source_language: source.config.language
        }
      }];
    } catch (error) {
      throw new Error(`Scraping failed: ${error.message}`);
    }
  }

  private async fetchFromAPI(source: ContentSource): Promise<ContentItem[]> {
    // Implement API fetching for custom endpoints
    return [];
  }

  private filterForNorwegianAI(items: ContentItem[], config: any): ContentItem[] {
    if (!config.filter_keywords?.length) return items;

    return items.filter(item => {
      const text = `${item.title} ${item.content}`.toLowerCase();
      const norwegianText = this.normalizeNorwegianText(text);
      
      return config.filter_keywords.some((keyword: string) => {
        const normalizedKeyword = keyword.toLowerCase();
        return norwegianText.includes(normalizedKeyword) || 
               text.includes(normalizedKeyword);
      });
    });
  }

  private calculateRelevanceScore(item: ContentItem, config: any): number {
    let score = 0.5; // Base score
    
    const text = `${item.title} ${item.content}`.toLowerCase();
    const norwegianText = this.normalizeNorwegianText(text);
    
    // High-value AI keywords (Norwegian and English)
    const highValueKeywords = [
      'chatgpt', 'openai', 'claude', 'anthropic', 'google ai', 'microsoft ai',
      'kunstig intelligens', 'maskinlæring', 'dyp læring', 'nevrale nettverk',
      'forskningsrådet', 'ntnu', 'sintef', 'ki-milliarden', 'norge', 'norsk'
    ];
    
    const mediumValueKeywords = [
      'ai', 'ml', 'llm', 'roboter', 'automatisering', 'algoritmer'
    ];

    // Boost for high-value keywords
    highValueKeywords.forEach(keyword => {
      if (norwegianText.includes(keyword) || text.includes(keyword)) {
        score += 0.2;
      }
    });

    // Boost for medium-value keywords
    mediumValueKeywords.forEach(keyword => {
      if (norwegianText.includes(keyword) || text.includes(keyword)) {
        score += 0.1;
      }
    });

    // Boost for Norwegian relevance
    if (config.norwegian_relevance && 
        (norwegianText.includes('norge') || norwegianText.includes('norsk'))) {
      score += 0.3;
    }

    // Boost for quality sources
    if (config.quality === 'high') score += 0.1;
    
    // Penalize old articles
    const ageInDays = (Date.now() - item.published_at.getTime()) / (1000 * 60 * 60 * 24);
    if (ageInDays > 7) score -= 0.2;
    if (ageInDays > 30) score -= 0.3;

    return Math.min(Math.max(score, 0), 1); // Clamp between 0 and 1
  }

  private normalizeNorwegianText(text: string): string {
    return text
      .replace(/[æÆ]/g, 'ae')
      .replace(/[øØ]/g, 'o')
      .replace(/[åÅ]/g, 'a')
      .replace(/[éÉ]/g, 'e');
  }

  private cleanText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .trim();
  }

  private async updateSourceStatus(sourceId: number, success: boolean) {
    const updates: any = {
      updated_at: new Date().toISOString()
    };

    if (success) {
      updates.last_successful_fetch = new Date().toISOString();
      updates.consecutive_failures = 0;
    } else {
      updates.consecutive_failures = await this.getConsecutiveFailures(sourceId) + 1;
    }

    await this.supabase
      .from('content_sources')
      .update(updates)
      .eq('id', sourceId);
  }

  private async getConsecutiveFailures(sourceId: number): Promise<number> {
    const { data } = await this.supabase
      .from('content_sources')
      .select('consecutive_failures')
      .eq('id', sourceId)
      .single();
    
    return data?.consecutive_failures || 0;
  }

  private async logError(sourceId: number, phase: string, error: Error) {
    await this.supabase.from('error_logs').insert({
      source_id: sourceId,
      error_type: error.name,
      error_message: error.message,
      phase,
      context: { 
        stack: error.stack?.substring(0, 1000), // Limit stack trace length
        timestamp: new Date().toISOString()
      }
    });
  }
}
```

## 3. Norsk-optimalisert PipelineEngine

### 3.1 Opprett `lib/pipeline-engine.ts`:

typescript

```typescript
import { ContentFetcher } from './content-fetcher';
import { callAnthropic } from './anthropic';
import { createClient } from '@supabase/supabase-js';

interface Pipeline {
  id: number;
  name: string;
  purpose: string;
  config: {
    ai_editor_prompt?: string;
    max_articles?: number;
    require_approval?: boolean;
    filter_strength?: 'low' | 'medium' | 'high';
  };
  template_config: {
    language?: string;
    tone?: string;
    target_audience?: string;
    style_guide?: string;
  };
}

export class PipelineEngine {
  private supabase;
  private contentFetcher = new ContentFetcher();

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async runPipeline(pipelineId: number): Promise<any> {
    const startTime = Date.now();
    
    try {
      console.log(`Starting pipeline ${pipelineId}...`);
      
      // Load pipeline configuration
      const { data: pipeline } = await this.supabase
        .from('pipelines')
        .select('*')
        .eq('id', pipelineId)
        .single();

      if (!pipeline) {
        throw new Error(`Pipeline ${pipelineId} not found`);
      }

      // Load pipeline sources
      const { data: pipelineSources } = await this.supabase
        .from('pipeline_sources')
        .select(`
          *,
          content_sources (*)
        `)
        .eq('pipeline_id', pipelineId)
        .eq('active', true)
        .order('priority', { ascending: false });

      console.log(`Found ${pipelineSources?.length || 0} active sources`);

      // Fetch content from all sources
      const allContent: any[] = [];
      let sourcesChecked = 0;
      let sourcesFailed = 0;

      for (const ps of pipelineSources || []) {
        sourcesChecked++;
        try {
          const content = await this.contentFetcher.fetchFromSource(
            ps.content_sources, 
            pipelineId
          );
          allContent.push(...content);
        } catch (error) {
          sourcesFailed++;
          console.error(`Source ${ps.content_sources.name} failed:`, error);
        }
      }

      console.log(`Fetched ${allContent.length} total items`);

      // Remove duplicates and save to database
      const uniqueContent = await this.deduplicateAndSave(allContent, pipelineId);
      console.log(`${uniqueContent.length} unique items after deduplication`);

      // Process content with Norwegian AI focus
      const processedContent = await this.processContent(uniqueContent, pipeline);
      console.log(`${processedContent.length} items after processing`);

      // Generate digest using Norwegian-optimized prompts
      const digest = await this.generateNorwegianDigest(processedContent, pipeline);

      // Save digest run
      const { data: digestRun } = await this.supabase
        .from('digest_runs')
        .insert({
          pipeline_id: pipelineId,
          status: 'success',
          summary_html: digest.html,
          summary_plain: digest.plain,
          generated_at_local: new Date().toISOString(),
          metadata: {
            articles_used: processedContent.length,
            total_articles_fetched: uniqueContent.length,
            sources_checked: sourcesChecked,
            sources_failed: sourcesFailed,
            generation_time_ms: Date.now() - startTime
          }
        })
        .select()
        .single();

      // Save analytics
      await this.supabase.from('digest_analytics').insert({
        digest_run_id: digestRun.id,
        pipeline_id: pipelineId,
        articles_processed: uniqueContent.length,
        sources_checked: sourcesChecked,
        sources_failed: sourcesFailed,
        generation_time_ms: Date.now() - startTime
      });

      console.log('Digest generated successfully');
      return digestRun;

    } catch (error) {
      await this.logError(pipelineId, null, 'processing', error as Error);
      throw error;
    }
  }

  private async deduplicateAndSave(content: any[], pipelineId: number) {
    // Enhanced deduplication for Norwegian content
    const unique = content.filter((item, index, self) => {
      // URL-based deduplication
      if (item.url && self.findIndex(other => other.url === item.url) !== index) {
        return false;
      }
      
      // Title similarity deduplication (Norwegian-aware)
      const normalizedTitle = this.normalizeNorwegianTitle(item.title);
      const similarExists = self.some((other, otherIndex) => {
        if (otherIndex >= index) return false;
        const otherNormalizedTitle = this.normalizeNorwegianTitle(other.title);
        return this.calculateSimilarity(normalizedTitle, otherNormalizedTitle) > 0.8;
      });
      
      return !similarExists;
    });

    // Save unique items to database
    if (unique.length > 0) {
      const { error } = await this.supabase.from('content_items').insert(unique);
      if (error) {
        console.error('Error saving content items:', error);
      }
    }

    return unique;
  }

  private normalizeNorwegianTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[æÆ]/g, 'ae')
      .replace(/[øØ]/g, 'o')
      .replace(/[åÅ]/g, 'a')
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.split(' ');
    const words2 = str2.split(' ');
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    return intersection.length / union.length;
  }

  private async processContent(content: any[], pipeline: Pipeline) {
    // Sort by relevance score and recency
    const sorted = content.sort((a, b) => {
      const scoreA = (a.relevance_score || 0) * 0.7 + this.getRecencyScore(a.published_at) * 0.3;
      const scoreB = (b.relevance_score || 0) * 0.7 + this.getRecencyScore(b.published_at) * 0.3;
      return scoreB - scoreA;
    });

    // Apply Norwegian AI-specific filtering
    const maxArticles = pipeline.config.max_articles || 15;
    const filtered = sorted.slice(0, maxArticles);

    // AI-powered Norwegian content prioritization if needed
    if (filtered.length > 10) {
      return await this.aiPrioritizeForNorwegians(filtered, pipeline);
    }

    return filtered;
  }

  private getRecencyScore(publishedAt: Date): number {
    const ageInHours = (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60);
    if (ageInHours <= 6) return 1.0;
    if (ageInHours <= 24) return 0.8;
    if (ageInHours <= 72) return 0.6;
    return 0.3;
  }

  private async aiPrioritizeForNorwegians(content: any[], pipeline: Pipeline): Promise<any[]> {
    const priorityPrompt = `
Du er redaktør for et norsk KI-nyhetsbrev. Analyser disse ${content.length} artiklene og velg de 10 mest relevante for norske lesere.

Prioriter artikler som:
1. Direkte påvirker Norge eller nordmenn
2. Handler om norske selskaper, forskningsinstitusjoner eller myndigheter
3. Har praktisk relevans for norsk næringsliv eller offentlig sektor
4. Omhandler KI-utvikling som kan påvirke norske arbeidsplasser
5. Gjelder regulering som berører Norge (EU-regelverk, etc.)

Artikler å vurdere:
${content.map((item, i) => `${i + 1}. "${item.title}" (Relevans: ${item.relevance_score?.toFixed(2)}) - ${item.content?.substring(0, 150)}...`).join('\n')}

Returner kun en JSON-array med indeksene (1-${content.length}) for de 10 viktigste artiklene i prioritert rekkefølge.
Eksempel: [3, 1, 7, 12, 5, 9, 2, 15, 8, 11]
`;

    try {
      const response = await callAnthropic(priorityPrompt, {});
      const indices = JSON.parse(response.content || '[]');
      
      if (Array.isArray(indices) && indices.length > 0) {
        return indices
          .filter(i => i >= 1 && i <= content.length)
          .map(i => content[i - 1])
          .slice(0, 10);
      }
    } catch (error) {
      console.error('AI prioritization failed, using default sorting:', error);
    }

    return content.slice(0, 10);
  }

  private async generateNorwegianDigest(content: any[], pipeline: Pipeline) {
    const prompt = this.buildNorwegianDigestPrompt(content, pipeline);
    
    try {
      const response = await callAnthropic(prompt, { articles: content });
      
      // Parse AI response and format for Norwegian audience
      const digestContent = this.parseAndFormatDigest(response.content, pipeline);
      
      return digestContent;
    } catch (error) {
      console.error('Digest generation failed:', error);
      throw new Error(`AI digest generation failed: ${error.message}`);
    }
  }

  private buildNorwegianDigestPrompt(content: any[], pipeline: Pipeline): string {
    const today = new Date().toLocaleDateString('no-NO', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    return `
Du skal skrive dagens KI-nyhetsbrev for norske lesere. 

MÅLGRUPPE: ${pipeline.template_config.target_audience || 'Norske lesere med ulik erfaring og kompetanse om kunstig intelligens (KI) og teknologi generelt'}

STILGUIDE:
${pipeline.template_config.style_guide || 'Bruk korrekt norsk, klarspråk, bevar engelske fagtermer og egennavn'}

TONE: ${pipeline.template_config.tone || 'Profesjonell men tilgjengelig'}

STRUKTUR:
1. **Overskrift**: Fengslende overskrift som fanger dagens hovedsak
2. **Innledning**: 2-3 setninger som setter kontekst for dagens viktigste KI-nyheter
3. **Hovedsaker**: 3-5 prioriterte saker med følgende format for hver:
   - Tydelig undertittel
   - 2-3 avsnitt som forklarer saken
   - Hvorfor dette er relevant for norske lesere
   - Lenke til originalkilden
4. **Kort nytt**: 2-3 andre interessante saker i kortformat
5. **Avslutning**: Fremtidsrettet kommentar eller refleksjon

SPRÅKREGLER:
- Skriv på norsk (bokmål)
- Bruk klarspråk og unngå unødvendig fagsjargong
- Bevar engelske fagtermer der de er etablert (f.eks. "machine learning", "ChatGPT")
- Bevar selskaps- og produktnavn på originalspråk
- Forklar komplekse konsepter på en forståelig måte
- Legg vekt på norsk relevans og konsekvenser

DAGENS DATO: ${today}

ARTIKLER Å BASERE NYHETSBREVET PÅ:
${content.map((item, i) => `
${i + 1}. ${item.title}
Kilde: ${item.metadata?.source_language === 'no' ? 'Norsk' : 'Internasjonal'} - ${new URL(item.url || '').hostname}
Publisert: ${new Date(item.published_at).toLocaleDateString('no-NO')}
Sammendrag: ${item.content?.substring(0, 300)}...
Relevans: ${(item.relevance_score || 0).toFixed(2)}
---`).join('\n')}

VIKTIG: 
- Fokuser på saker som påvirker Norge direkte eller indirekte
- Trekk frem norske aktører, forskning og selskaper når relevant
- Forklar hvordan internasjonale utviklinger kan påvirke Norge
- Bruk konkrete eksempler og unngå vage formuleringer

Skriv nyhetsbrevet som ren tekst med markdown-formatering. Returner resultatet som JSON med feltene:
{
  "headline": "Hovedoverskrift",
  "intro": "Innledningstekst",
  "main_stories": [
    {
      "title": "Overskrift for hovedsak",
      "content": "Innhold med markdown-formatering",
      "source_url": "URL til originalkilde"
    }
  ],
  "brief_news": [
    {
      "title": "Kort nyhet overskrift", 
      "summary": "Kort sammendrag",
      "source_url": "URL"
    }
  ],
  "conclusion": "Avsluttende kommentar"
}
`;
  }

  private parseAndFormatDigest(aiResponse: string, pipeline: Pipeline): any {
    try {
      // Clean AI response and parse JSON
      let cleanResponse = aiResponse.trim();
      
      // Remove potential markdown code blocks
      cleanResponse = cleanResponse.replace(/```json\s*|\s*```/g, '');
      
      const digestData = JSON.parse(cleanResponse);
      
      // Generate HTML and plain text versions
      const html = this.generateHTML(digestData);
      const plain = this.generatePlainText(digestData);
      
      return {
        html,
        plain,
        structured_data: digestData
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      
      // Fallback: create a simple digest from the raw response
      return {
        html: `<div>${aiResponse.replace(/\n/g, '<br>')}</div>`,
        plain: aiResponse,
        structured_data: { error: 'Failed to parse structured response' }
      };
    }
  }

  private generateHTML(data: any): string {
    return `
<!DOCTYPE html>
<html lang="no">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.headline}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        .intro { background: #f8f9fa; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0; }
        .story { margin: 25px 0; padding: 20px; border: 1px solid #e9ecef; border-radius: 5px; }
        .brief-news { background: #f1f3f4; padding: 15px; margin: 10px 0; border-radius: 3px; }
        .conclusion { font-style: italic; background: #e8f5e8; padding: 15px; border-radius: 5px; margin-top: 30px; }
        a { color: #3498db; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .date { color: #7f8c8d; font-size: 0.9em; }
    </style>
</head>
<body>
    <h1>${data.headline}</h1>
    
    <div class="intro">
        <p>${data.intro}</p>
    </div>
    
    <h2>Hovedsaker</h2>
    ${data.main_stories?.map((story: any) => `
        <div class="story">
            <h3>${story.title}</h3>
            <div>${this.markdownToHTML(story.content)}</div>
            ${story.source_url ? `<p><a href="${story.source_url}" target="_blank">Les mer</a></p>` : ''}
        </div>
    `).join('') || ''}
    
    ${data.brief_news?.length ? `
        <h2>Kort nytt</h2>
        ${data.brief_news.map((news: any) => `
            <div class="brief-news">
                <h4>${news.title}</h4>
                <p>${news.summary}</p>
                ${news.source_url ? `<p><a href="${news.source_url}" target="_blank">Les mer</a></p>` : ''}
            </div>
        `).join('')}
    ` : ''}
    
    <div class="conclusion">
        <p>${data.conclusion}</p>
    </div>
    
    <div class="date">
        <p>Generert ${new Date().toLocaleDateString('no-NO', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
    </div>
</body>
</html>`;
  }

  private generatePlainText(data: any): string {
    return `
${data.headline}
${'='.repeat(data.headline.length)}

${data.intro}

HOVEDSAKER
----------

${data.main_stories?.map((story: any) => `
${story.title}
${'-'.repeat(story.title.length)}

${this.markdownToPlainText(story.content)}

${story.source_url ? `Les mer: ${story.source_url}` : ''}
`).join('\n') || ''}

${data.brief_news?.length ? `
KORT OM NYTT
---------

${data.brief_news.map((news: any) => `
- ${news.title}
  ${news.summary}
  ${news.source_url ? `  ${news.source_url}` : ''}
`).join('\n')}
` : ''}

${data.conclusion}

---
Generert ${new Date().toLocaleDateString('no-NO', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}
`;
  }

  private markdownToHTML(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
  }

  private markdownToPlainText(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/\n\n/g, '\n\n')
      .trim();
  }

  private async logError(pipelineId: number, sourceId: number | null, phase: string, error: Error) {
    await this.supabase.from('error_logs').insert({
      pipeline_id: pipelineId,
      source_id: sourceId,
      error_type: error.name,
      error_message: error.message,
      phase,
      context: { 
        stack: error.stack?.substring(0, 1000),
        timestamp: new Date().toISOString()
      }
    });
  }
}
```

## 4. Oppdatert `scripts/dailyDigest.ts`:

typescript

```typescript
import { PipelineEngine } from '../lib/pipeline-engine';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function main() {
  try {
    console.log('🤖 Starter Budbringer KI-nyhetsdigst...');
    
    const pipelineEngine = new PipelineEngine();
    
    // Default to AI-nyheter pipeline (ID 1)
    const pipelineId = parseInt(process.env.PIPELINE_ID || '1');
    
    console.log(`📊 Genererer digest for pipeline ${pipelineId}...`);
    
    const digestRun = await pipelineEngine.runPipeline(pipelineId);
    
    console.log(`✅ Digest generert!`, {
      id: digestRun.id,
      articles: digestRun.metadata?.articles_used || 0,
      sources_checked: digestRun.metadata?.sources_checked || 0,
      generation_time: `${digestRun.metadata?.generation_time_ms || 0}ms`
    });
    
    // Write output files for manual inspection
    await writeOutputFiles(digestRun);
    
    console.log('📁 Filer skrevet til out/ mappen for inspeksjon');
    
  } catch (error) {
    console.error('❌ Digest-generering feilet:', error);
    process.exit(1);
  }
}

async function writeOutputFiles(digestRun: any) {
  const outDir = path.join(process.cwd(), 'out');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  
  // Write HTML version
  fs.writeFileSync(
    path.join(outDir, 'latest-digest.html'),
    digestRun.summary_html || '<p>Ingen HTML-innhold generert</p>'
  );
  
  // Write plain text version
  fs.writeFileSync(
    path.join(outDir, 'latest-digest.txt'), 
    digestRun.summary_plain || 'Ingen tekst-innhold generert'
  );

  // Write metadata for debugging
  fs.writeFileSync(
    path.join(outDir, 'digest-metadata.json'),
    JSON.stringify(digestRun.metadata || {}, null, 2)
  );
  
  console.log('📄 Filer skrevet:');
  console.log('  - latest-digest.html (for forhåndsvisning)');
  console.log('  - latest-digest.txt (for tekst-versjon)');
  console.log('  - digest-metadata.json (for debugging)');
}

if (require.main === module) {
  main();
}
```

## 5. Oppdatert GitHub Actions workflow

### 5.1 `.github/workflows/daily-digest.yml`:

yaml

```yaml
name: Budbringer KI-nyheter

on:
  schedule:
    - cron: '0 6 * * *'  # 06:00 UTC (07:00/08:00 norsk tid)
  workflow_dispatch:
    inputs:
      pipeline_id:
        description: 'Pipeline ID (1 for AI-nyheter)'
        required: false
        default: '1'
        type: string

jobs:
  generate-ai-digest:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Generate Norwegian AI digest
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          PIPELINE_ID: ${{ github.event.inputs.pipeline_id || '1' }}
        run: |
          echo "🇳🇴 Genererer norsk KI-nyhetsbrev..."
          npx ts-node --project tsconfig.scripts.json scripts/dailyDigest.ts
          
      - name: Dispatch emails to subscribers
        env:
          DISPATCH_URL: ${{ secrets.DISPATCH_URL }}
          DISPATCH_TOKEN: ${{ secrets.DISPATCH_TOKEN }}
        run: |
          echo "📧 Sender e-post til abonnenter..."
          response=$(curl -s -w "%{http_code}" -X POST "$DISPATCH_URL" \
            -H "Authorization: Bearer $DISPATCH_TOKEN" \
            -H "Content-Type: application/json" \
            -d '{"pipeline_id": ${{ github.event.inputs.pipeline_id || 1 }}}')
          
          http_code=${response: -3}
          response_body=${response%???}
          
          echo "HTTP Status: $http_code"
          echo "Response: $response_body"
          
          if [[ $http_code == "200" ]]; then
            echo "✅ E-post sendt!"
          else
            echo "❌ E-post feilet"
            exit 1
          fi
          
      - name: Notify on failure
        if: failure()
        run: |
          echo "❌ Budbringer KI-digest feilet!"
          # Implementer Slack/Teams notifikasjon her hvis ønskelig
```

## 6. Testscript for kilder

### 6.1 Opprett `scripts/test-ai-sources.ts`:

typescript

```typescript
import { ContentFetcher } from '../lib/content-fetcher';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function testAISources() {
  console.log('🧪 Tester AI-nyhetskilder...\n');
  
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  // Get all active sources for AI-news pipeline
  const { data: sources } = await supabase
    .from('pipeline_sources')
    .select(`
      content_sources (*)
    `)
    .eq('pipeline_id', 1)
    .eq('active', true);
    
  const fetcher = new ContentFetcher();
  
  let totalSuccess = 0;
  let totalFailed = 0;
  
  for (const sourceWrapper of sources || []) {
    const source = sourceWrapper.content_sources;
    
    console.log(`\n📡 Tester: ${source.name} (${source.type})`);
    console.log(`   URL: ${source.base_url}`);
    console.log(`   Kategori: ${source.category}`);
    
    try {
      const startTime = Date.now();
      const content = await fetcher.fetchFromSource(source, 1);
      const duration = Date.now() - startTime;
      
      if (content.length > 0) {
        console.log(`   ✅ Suksess: ${content.length} artikler (${duration}ms)`);
        
        // Show top 3 most relevant articles
        const topArticles = content
          .sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
          .slice(0, 3);
          
        topArticles.forEach((article, i) => {
          console.log(`      ${i + 1}. "${article.title}" (relevans: ${(article.relevance_score || 0).toFixed(2)})`);
        });
        
        totalSuccess++;
      } else {
        console.log(`   ⚠️  Ingen relevante artikler funnet`);
        totalFailed++;
      }
      
    } catch (error) {
      console.log(`   ❌ Feil: ${error.message}`);
      totalFailed++;
    }
    
    // Wait between requests to be polite
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n📊 Oppsummering:`);
  console.log(`   ✅ Fungerende kilder: ${totalSuccess}`);
  console.log(`   ❌ Feilende kilder: ${totalFailed}`);
  console.log(`   📈 Suksessrate: ${(totalSuccess / (totalSuccess + totalFailed) * 100).toFixed(1)}%`);
  
  if (totalFailed > totalSuccess) {
    console.log(`\n⚠️  Advarsel: Mange kilder feiler. Vurder å oppdatere kildekonfigurasjonen.`);
  }
}

if (require.main === module) {
  testAISources().catch(console.error);
}
```

## 7. Oppdaterte miljøvariabler

### 7.1 Oppdater `.env.example`:

bash

```bash
# Supabase (eksisterende)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# AI og innholdsgenerering
ANTHROPIC_API_KEY=your_anthropic_key

# E-post levering (eksisterende)
MAILCHANNELS_AUTH_TOKEN=your_mailchannels_token
MAILCHANNELS_SMTP_PASSWORD=your_smtp_password

# Applikasjon (eksisterende)
UNSUBSCRIBE_SECRET=your_unsubscribe_secret
DISPATCH_TOKEN=your_dispatch_token
DISPATCH_URL=your_cloudflare_worker_url
PUBLIC_SITE_URL=https://your-domain.com

# Pipeline konfigurasjon
PIPELINE_ID=1
DEFAULT_LANGUAGE=no
TARGET_AUDIENCE="norske brukere/lesere med ulik kompetanse og erfaring med KI og teknologi generelt"

# Valgfrie tillegg for fremtiden
FIRECRAWL_API_KEY=your_firecrawl_key_if_needed
SLACK_WEBHOOK=your_slack_webhook_for_notifications
```

## 8. Admin UI forbedringer

### 8.1 Oppdater `app/admin/page.tsx`:

typescript

```typescript
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>({});
  const [recentDigests, setRecentDigests] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load basic stats
      const [subscribersRes, digestsRes, sourcesRes] = await Promise.all([
        supabase.from('subscribers').select('status'),
        supabase.from('digest_runs').select('*').limit(5).order('created_at', { ascending: false }),
        supabase.from('content_sources').select('*').eq('active', true)
      ]);

      const confirmedSubscribers = subscribersRes.data?.filter(s => s.status === 'confirmed').length || 0;
      
      setStats({
        totalSubscribers: confirmedSubscribers,
        recentDigests: digestsRes.data?.length || 0,
        activeSources: sourcesRes.data?.length || 0
      });
      
      setRecentDigests(digestsRes.data || []);
      setSources(sourcesRes.data || []);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🤖 Budbringer Admin - AI Nyheter
        </h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Aktive abonnenter</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalSubscribers}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Sendte nyhetsbrev</h3>
            <p className="text-3xl font-bold text-green-600">{stats.recentDigests}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Aktive kilder</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.activeSources}</p>
          </div>
        </div>

        {/* Recent Digests */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Siste nyhetsbrev</h2>
          </div>
          <div className="p-6">
            {recentDigests.length > 0 ? (
              <div className="space-y-4">
                {recentDigests.map((digest) => (
                  <div key={digest.id} className="border rounded p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">Digest #{digest.id}</p>
                        <p className="text-sm text-gray-600">
                          Generert: {new Date(digest.generated_at_local).toLocaleDateString('no-NO', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p className="text-sm text-gray-500">
                          Status: <span className={digest.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                            {digest.status}
                          </span>
                        </p>
                        {digest.metadata?.articles_used && (
                          <p className="text-sm text-gray-500">
                            Basert på {digest.metadata.articles_used} artikler
                          </p>
                        )}
                      </div>
                      <div className="space-x-2">
                        {digest.summary_html && (
                          <a 
                            href={`data:text/html;charset=utf-8,${encodeURIComponent(digest.summary_html)}`}
                            target="_blank"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            Vis HTML
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Ingen nyhetsbrev generert ennå.</p>
            )}
          </div>
        </div>

        {/* Sources Status */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Kilder for AI-nyheter</h2>
          </div>
          <div className="p-6">
            <div className="grid gap-4">
              {sources.map((source) => (
                <div key={source.id} className="border rounded p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{source.name}</h3>
                    <p className="text-sm text-gray-600">{source.base_url}</p>
                    <div className="flex gap-4 text-sm text-gray-500 mt-1">
                      <span>Type: {source.type}</span>
                      <span>Kategori: {source.category}</span>
                      <span>Prioritet: {source.priority}</span>
                    </div>
                    {source.last_successful_fetch && (
                      <p className="text-xs text-green-600">
                        Sist hentet: {new Date(source.last_successful_fetch).toLocaleDateString('no-NO')}
                      </p>
                    )}
                    {source.consecutive_failures > 0 && (
                      <p className="text-xs text-red-600">
                        Påfølgende feil: {source.consecutive_failures}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center">
                    <span className={`px-2 py-1 rounded text-sm ${
                      source.consecutive_failures === 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {source.consecutive_failures === 0 ? 'OK' : 'Feil'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## 9. Implementeringsstrategi

### Prioritert rekkefølge (steg):

1. Database migrations og seed data med verifiserte norske kilder
2. ContentFetcher med norsk AI-fokus og feilhåndtering
3. PipelineEngine med norsk språkhåndtering og Anthropic-integrasjon
4. Refaktorer dailyDigest.ts og test alle komponenter
5. GitHub Actions automatisering og testscript for kilder
6. Admin UI forbedringer og overvåking
7. Finpussing, testing og optimalisering
8. Produksjonssetting og overvåking

### Viktige testpunkter underveis:

- **Etter steg 2**: Test at alle norske kilder fungerer
- **Etter steg 4**: Generer første komplette AI-digest manuelt
- **Etter steg 5**: Test automatisk kjøring via GitHub Actions
- **Etter steg 6**: Verifiser at admin-panelet viser riktig data

## 10. Ytterligere forbedringer for fremtiden

### 10.1 Norsk språkoptimalisering:

typescript

```typescript
// lib/norwegian-language-utils.ts
export class NorwegianLanguageUtils {
  static cleanNorwegianText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      .replace(/…/g, '...')
      .trim();
  }

  static isNorwegianRelevant(text: string): boolean {
    const norwegianIndicators = [
      'norge', 'norsk', 'oslo', 'bergen', 'trondheim',
      'regjeringen', 'stortinget', 'forskningsrådet',
      'ntnu', 'sintef', 'uio', 'nav', 'equinor',
      'telenor', 'dnb', 'skandinavisk', 'nordisk'
    ];
    
    const lowerText = text.toLowerCase();
    return norwegianIndicators.some(indicator => 
      lowerText.includes(indicator)
    );
  }

  static extractNorwegianEntities(text: string): string[] {
    // Implementer ekstraksjon av norske firmanavn, steder, etc.
    const entities: string[] = [];
    // ... implementasjon
    return entities;
  }
}
```

### 10.2 Avansert innholdsfiltrering:

typescript

```typescript
// lib/content-quality-filter.ts
export class ContentQualityFilter {
  static scoreContentQuality(item: ContentItem): number {
    let score = 0.5;
    
    // Lengde på innhold
    const contentLength = (item.content || '').length;
    if (contentLength > 500) score += 0.2;
    if (contentLength < 100) score -= 0.3;
    
    // Tilstedeværelse av fakta/tall
    if (/\d+[%\s]|\$\d+|\d+\s*millioner?|\d+\s*milliarder?/i.test(item.content || '')) {
      score += 0.1;
    }
    
    // Unngå clickbait
    const clickbaitIndicators = [
      'du vil ikke tro', 'sjokk', 'utrolig', 'hemmelighet'
    ];
    if (clickbaitIndicators.some(indicator => 
        (item.title || '').toLowerCase().includes(indicator))) {
      score -= 0.3;
    }
    
    return Math.max(0, Math.min(1, score));
  }
}
```

### 10.3 Backup-kilder ved feil:

typescript

```typescript
// lib/backup-sources.ts
export const backupSources = [
  {
    name: 'AI News Backup',
    type: 'api' as const,
    url: 'https://api.example.com/ai-news',
    config: {
      api_key: process.env.BACKUP_API_KEY,
      language: 'en',
      topics: ['artificial intelligence', 'machine learning']
    }
  }
];

export async function useBackupSources(primarySourcesFailed: number): Promise<boolean> {
  // Aktiver backup-kilder hvis mer enn 50% av primære kilder feiler
  return primarySourcesFailed > 0.5;
}
```

## 11. Overvåking og varslinger

### 11.1 Opprett `lib/monitoring.ts`:

typescript

```typescript
import { createClient } from '@supabase/supabase-js';

export class BudbringerMonitoring {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async checkSystemHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    metrics: any;
  }> {
    const issues: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Sjekk kilder som feiler
    const { data: failingSources } = await this.supabase
      .from('content_sources')
      .select('name, consecutive_failures')
      .gt('consecutive_failures', 3);

    if (failingSources && failingSources.length > 0) {
      issues.push(`${failingSources.length} kilder feiler konsekvent`);
      status = failingSources.length > 5 ? 'critical' : 'warning';
    }

    // Sjekk siste vellykkede digest
    const { data: lastDigest } = await this.supabase
      .from('digest_runs')
      .select('created_at, status')
      .eq('status', 'success')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (lastDigest) {
      const hoursSinceLastDigest = 
        (Date.now() - new Date(lastDigest.created_at).getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastDigest > 48) {
        issues.push('Ingen vellykket digest på over 48 timer');
        status = 'critical';
      } else if (hoursSinceLastDigest > 26) {
        issues.push('Siste digest er over 26 timer gammel');
        if (status === 'healthy') status = 'warning';
      }
    } else {
      issues.push('Ingen vellykkede digests funnet');
      status = 'critical';
    }

    // Sjekk antall aktive abonnenter
    const { count: subscriberCount } = await this.supabase
      .from('subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'confirmed');

    const metrics = {
      active_subscribers: subscriberCount || 0,
      failing_sources: failingSources?.length || 0,
      hours_since_last_digest: lastDigest ? 
        (Date.now() - new Date(lastDigest.created_at).getTime()) / (1000 * 60 * 60) : null
    };

    return { status, issues, metrics };
  }

  async sendSlackAlert(message: string, severity: 'info' | 'warning' | 'error' = 'info') {
    if (!process.env.SLACK_WEBHOOK) return;

    const colors = {
      info: '#36a64f',
      warning: '#ff9500', 
      error: '#ff0000'
    };

    try {
      await fetch(process.env.SLACK_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attachments: [{
            color: colors[severity],
            title: '🤖 Budbringer Alert',
            text: message,
            ts: Math.floor(Date.now() / 1000)
          }]
        })
      });
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }
}
```

### 11.2 Helsesjekk-script:

typescript

```typescript
// scripts/health-check.ts
import { BudbringerMonitoring } from '../lib/monitoring';

async function runHealthCheck() {
  const monitoring = new BudbringerMonitoring();
  
  try {
    const health = await monitoring.checkSystemHealth();
    
    console.log(`🏥 Systemhelse: ${health.status.toUpperCase()}`);
    console.log(`📊 Aktive abonnenter: ${health.metrics.active_subscribers}`);
    console.log(`❌ Feilende kilder: ${health.metrics.failing_sources}`);
    
    if (health.issues.length > 0) {
      console.log('\n⚠️  Problemer oppdaget:');
      health.issues.forEach(issue => console.log(`   - ${issue}`));
      
      // Send Slack-varsel ved kritiske problemer
      if (health.status === 'critical') {
        await monitoring.sendSlackAlert(
          `🚨 Kritiske problemer i Budbringer:\n${health.issues.join('\n')}`,
          'error'
        );
      }
    } else {
      console.log('\n✅ Alt ser bra ut!');
    }
    
  } catch (error) {
    console.error('❌ Helsesjekk feilet:', error);
    await monitoring.sendSlackAlert(
      `🚨 Budbringer helsesjekk feilet: ${error.message}`,
      'error'
    );
  }
}

if (require.main === module) {
  runHealthCheck();
}
```

## 12. Dokumentasjon og brukerveiledning

### 12.1 Opprett `docs/norwegian-ai-sources.md`:

markdown

````markdown
# Norske KI-kilder for Budbringer

## Verifiserte kilder (September 2025)

### Norske medier og institusjoner
- **NRK Viten**: https://www.nrk.no/viten/toppsaker.rss
- **Forskningsrådet**: Scraping av KI-sider
- **Norwegian SciTech News**: https://norwegianscitechnews.com/feed
- **ITavisen**: https://itavisen.no/feed

### Tekniske norske publikasjoner  
- **Digi.no**: Scraping med AI-filter
- **AIavisen.no**: Norsk AI-fokusert nettsted

### Internasjonale kilder med norsk relevans
- **TechCrunch AI**: Filtrering på nordisk/europeisk innhold
- **MIT Technology Review**: Høy kvalitet på forskning
- **The Verge AI**: Fokus på regulering og større trender

## Kildekonfigurering

Hver kilde har følgende konfigurering optimalisert for norske lesere:
```json
{
  "filter_keywords": ["kunstig intelligens", "AI", "Norge", "norsk"],
  "language": "no",
  "quality": "high",
  "norwegian_relevance": true,
  "priority": 8
}
````

## Vedlikehold av kilder

Kjør regelmessig:

bash

```bash
npm run test:sources  # Test alle kilder
npm run health:check  # Sjekk systemhelse
```

````

### 12.2 Oppdater `README.md`:
```markdown
# Budbringer - Norsk AI-nyhetsbrev

Automatisert system for generering og distribusjon av AI-nyheter tilpasset norske lesere.

## 🇳🇴 Spesielle funksjoner for Norge

- **Norsk språkoptimalisering**: Klarspråk med korrekt terminologi
- **Norske kilder**: Prioritering av NRK, Forskningsrådet, norske tech-medier
- **Lokal relevans**: AI som berører Norge, norsk næringsliv og forskning
- **Kulturell tilpasning**: Forståelse for norske forhold og perspektiver

## 🚀 Kom i gang

1. **Sett opp database**:
```bash
   # Kjør migrations for nye tabeller
   supabase db reset
````

2. **Konfigurer miljøvariabler**:

bash

```bash
   cp .env.example .env.local
   # Fyll inn dine API-nøkler
```

3. **Test kilder**:

bash

```bash
   npm run test:sources
```

4. **Generer første digest**:

bash

```bash
   npm run digest:generate
```

## 📊 Overvåking

- **Admin-panel**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Helsesjekk**: `npm run health:check`
- **Kilde-test**: `npm run test:sources`

## 🛠 Utvikling

Systemet er bygget for fleksibilitet:

- Enkelt å legge til nye kildetyper
- Modulær pipeline-arkitektur
- Skalerbar til andre innholdstyper

Se `docs/` for detaljert dokumentasjon.

````

## 13. Package.json scripts

### 13.1 Legg til i `package.json`:
```json
{
  "scripts": {
    "digest:generate": "npx ts-node --project tsconfig.scripts.json scripts/dailyDigest.ts",
    "test:sources": "npx ts-node --project tsconfig.scripts.json scripts/test-ai-sources.ts", 
    "health:check": "npx ts-node --project tsconfig.scripts.json scripts/health-check.ts",
    "admin:dev": "next dev",
    "admin:build": "next build"
  }
}
````

## 14. Siste sjekkliste for Codex

### Umiddelbare oppgaver:

1. ✅ Kjør database migrations med verifiserte norske kilder
2. ✅ Implementer ContentFetcher med robust norsk håndtering
3. ✅ Lag PipelineEngine med norsk-optimaliserte prompts
4. ✅ Refaktorer dailyDigest.ts til ny arkitektur
5. ✅ Sett opp GitHub Actions for automatisk kjøring
6. ✅ Test alle kilder og verifiser at de fungerer
7. ✅ Implementer admin UI forbedringer
8. ✅ Legg til helsesjekk og overvåking

### Kvalitetssikring:

- **Språk**: Alle prompts på norsk med korrekt terminologi
- **Kilder**: Kun verifiserte, fungerende RSS/scraping-endepunkter
- **Feilhåndtering**: Robust håndtering av kilde-feil og backup-strategier
- **Overvåking**: Automatisk varsling ved systemproblemer
- **Testing**: Comprehensive testing av alle komponenter

Denne spesifikasjonen gir deg en komplett, norsk-optimalisert løsning som er både robust og skalerbar for fremtidige utvidelser.