import dotenv from 'dotenv';
import { getSupabaseServiceClient } from '../lib/supabase-admin';
import { renderDigestHtml, renderDigestText } from '../lib/email';
import { fetchNewsFromSources, storeContentItems, fetchRSSFeed, filterRelevantNews } from '../lib/news-fetcher';
import { processNewsIntoDigest } from '../lib/content-processor';
import { getAvailableModels } from '../lib/ai';
import { getTodayOslo, getNowOsloISO } from '../lib/timezone';

// Fallback news sources when pipeline is not available
async function fetchFallbackNews() {
  const fallbackSources = [
    {
      name: 'NRK Viten',
      url: 'https://www.nrk.no/viten/toppsaker.rss',
      keywords: ['kunstig intelligens', 'KI', 'AI', 'maskinlæring', 'OpenAI', 'ChatGPT', 'GPT', 'Anthropic', 'Claude', 'Gemini', 'Copilot']
    },
    {
      name: 'ITavisen',
      url: 'https://itavisen.no/feed',
      keywords: ['kunstig intelligens', 'KI', 'AI', 'maskinlæring', 'OpenAI', 'ChatGPT', 'roboter', 'automatisering']
    }
  ];

  const allNews = [];

  for (const source of fallbackSources) {
    try {
      console.log(`Fetching fallback source: ${source.name}`);
      const items = await fetchRSSFeed(source.url);
      const filtered = await filterRelevantNews(items, {
        filter_keywords: source.keywords,
        max_age_days: 3,
        language: 'no'
      });

      filtered.forEach(item => {
        item.source = source.name;
        item.category = 'fallback';
      });

      allNews.push(...filtered);
      console.log(`Found ${filtered.length} relevant articles from ${source.name}`);
    } catch (error) {
      console.warn(`Failed to fetch ${source.name}:`, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  return allNews.slice(0, 15); // Limit to 15 articles
}

// Load environment variables
dotenv.config({ path: '.env.local' });

export async function generateDigestWithAI(promptBody: string, promptId?: string): Promise<{ content: any; runId: string }> {
  const supabase = getSupabaseServiceClient();

  console.log('=== Starting AI-powered digest generation ===');

  // Check available AI models
  const availableModels = getAvailableModels();
  console.log('Available AI models:', availableModels);

  if (!availableModels.claude && !availableModels.gpt) {
    throw new Error('No AI models configured. Please set ANTHROPIC_API_KEY or OPENAI_API_KEY');
  }

  // Get the AI pipeline configuration (fallback to defaults if table doesn't exist)
  let pipeline: any = null;
  try {
    const { data, error: pipelineError } = await supabase
      .from('pipelines')
      .select('id, name, config, template_config')
      .eq('name', 'KI-nyheter Norge')
      .single();

    if (pipelineError) {
      console.warn('Pipeline table not found, using fallback configuration');
      pipeline = {
        id: 1,
        name: 'KI-nyheter Norge (fallback)',
        config: {
          ai_editor_prompt: promptBody || 'Du er redaktør for et norsk KI-nyhetsbrev. Prioriter saker som er relevante for norske lesere.',
          max_articles: 15,
          require_approval: false,
          filter_strength: 'high'
        },
        template_config: {
          language: 'no',
          tone: 'profesjonell_tilgjengelig',
          target_audience: 'norske brukere/lesere med ulik kompetanse og erfaring med KI og teknologi generelt',
          style_guide: 'Bruk korrekt norsk, klarspråk, bevar engelske fagtermer og egennavn'
        }
      };
    } else {
      pipeline = data;
    }
  } catch (error) {
    console.warn('Pipeline table not accessible, using fallback configuration');
    pipeline = {
      id: 1,
      name: 'KI-nyheter Norge (fallback)',
      config: {
        ai_editor_prompt: promptBody || 'Du er redaktør for et norsk KI-nyhetsbrev. Prioriter saker som er relevante for norske lesere.',
        max_articles: 15,
        require_approval: false,
        filter_strength: 'high'
      },
      template_config: {
        language: 'no',
        tone: 'profesjonell_tilgjengelig',
        target_audience: 'norske brukere/lesere med ulik kompetanse og erfaring med KI og teknologi generelt',
        style_guide: 'Bruk korrekt norsk, klarspråk, bevar engelske fagtermer og egennavn'
      }
    };
  }

  console.log(`Using pipeline: ${pipeline.name} (ID: ${pipeline.id})`);

  // Create a digest run record
  const today = getTodayOslo();
  const modelName = availableModels.claude ? 'claude-sonnet-4-20250514' : 'gpt-4o';

  // Create digest run - handle missing columns gracefully
  const runData: Record<string, unknown> = {
    executed_for: today,
    status: 'pending',
    model_used: modelName,
    created_at: getNowOsloISO()
  };

  // Add optional fields if they exist in the database
  if (promptId) {
    runData.prompt_id = promptId;
  }

  const { data: run, error: runError } = await supabase
    .from('digest_runs')
    .insert(runData)
    .select('id')
    .single();

  if (runError) {
    console.error('Failed to create digest run:', runError);
    throw runError;
  }

  console.log(`Created digest run with ID: ${run.id}`);

  try {
    // Step 1: Fetch news from configured sources
    console.log('--- Step 1: Fetching news from sources ---');
    let newsItems: any[] = [];

    try {
      newsItems = await fetchNewsFromSources(pipeline.id);
    } catch (error) {
      console.warn('Failed to fetch from pipeline sources, using fallback news sources');
      // Fallback to basic news fetching from hardcoded sources
      newsItems = await fetchFallbackNews();
    }

    if (newsItems.length === 0) {
      console.warn('No news items found from sources');
    } else {
      console.log(`Collected ${newsItems.length} news items`);

      // Store the collected news items (if content_items table exists)
      try {
        await storeContentItems(pipeline.id, newsItems);
      } catch (error) {
        console.warn('Failed to store content items (table may not exist):', error instanceof Error ? error.message : 'Unknown error');
      }
    }

    // Step 2: Process news into digest using AI
    console.log('--- Step 2: Processing news with AI ---');
    const editorPrompt = promptBody || pipeline.config?.ai_editor_prompt || 'Create a comprehensive AI news digest in Norwegian.';
    const templateConfig = pipeline.template_config || {};

    const processingResult = await processNewsIntoDigest(
      newsItems,
      editorPrompt,
      templateConfig,
      availableModels.claude ? 'claude' : 'gpt'
    );

    console.log(`AI processing completed with ${processingResult.aiResponse.model}`);
    console.log(`Processed ${processingResult.articlesProcessed} articles from ${processingResult.sourceCount} sources`);

    // Step 3: Render email content
    console.log('--- Step 3: Rendering email content ---');
    const htmlContent = renderDigestHtml(processingResult.content);
    const textContent = renderDigestText(processingResult.content);

    // Step 4: Update run status with results
    console.log('--- Step 4: Updating database ---');
    const updateData: Record<string, unknown> = {
      status: 'success',
      summary_plain: textContent,
      summary_html: htmlContent,
      updated_at: getNowOsloISO()
    };

    // Add metrics if columns exist (graceful degradation)
    try {
      updateData.sources_checked = processingResult.sourceCount;
      updateData.items_processed = processingResult.articlesProcessed;
      updateData.ai_tokens_used = processingResult.aiResponse.usage?.total_tokens || 0;
    } catch {
      // Ignore if columns don't exist
    }

    await supabase
      .from('digest_runs')
      .update(updateData)
      .eq('id', run.id);

    console.log(`✅ Digest generation completed successfully!`);
    console.log(`Run ID: ${run.id}`);
    console.log(`Model: ${processingResult.aiResponse.model}`);
    console.log(`Articles processed: ${processingResult.articlesProcessed}`);
    console.log(`Sources: ${processingResult.sourceCount}`);

    if (processingResult.aiResponse.usage) {
      console.log(`AI tokens used: ${processingResult.aiResponse.usage.total_tokens}`);
    }

    return {
      content: processingResult.content,
      runId: run.id
    };

  } catch (error) {
    console.error('❌ Digest generation failed:', error);

    // Update run status to failed
    await supabase
      .from('digest_runs')
      .update({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        updated_at: getNowOsloISO()
      })
      .eq('id', run.id);

    throw error;
  }
}