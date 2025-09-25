import dotenv from 'dotenv';
import { getSupabaseServiceClient } from '../lib/supabase-admin';
import { renderDigestHtml, renderDigestText } from '../lib/email';
import { fetchNewsFromSources, storeContentItems } from '../lib/news-fetcher';
import { processNewsIntoDigest } from '../lib/content-processor';
import { getAvailableModels } from '../lib/ai';

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

  // Get the AI pipeline configuration
  const { data: pipeline, error: pipelineError } = await supabase
    .from('pipelines')
    .select('id, name, config, template_config')
    .eq('name', 'KI-nyheter Norge')
    .single();

  if (pipelineError || !pipeline) {
    console.error('Failed to get pipeline config:', pipelineError);
    throw new Error('Pipeline configuration not found');
  }

  console.log(`Using pipeline: ${pipeline.name} (ID: ${pipeline.id})`);

  // Create a digest run record
  const today = new Date().toISOString().split('T')[0];
  const modelName = availableModels.claude ? 'claude-3-5-sonnet' : 'gpt-4o';

  const { data: run, error: runError } = await supabase
    .from('digest_runs')
    .insert({
      executed_for: today,
      status: 'pending',
      model_used: modelName,
      prompt_id: promptId || null,
      pipeline_id: pipeline.id,
      created_at: new Date().toISOString()
    })
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
    const newsItems = await fetchNewsFromSources(pipeline.id);

    if (newsItems.length === 0) {
      console.warn('No news items found from sources');
    } else {
      console.log(`Collected ${newsItems.length} news items`);

      // Store the collected news items
      await storeContentItems(pipeline.id, newsItems);
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
    await supabase
      .from('digest_runs')
      .update({
        status: 'success',
        summary_plain: textContent,
        summary_html: htmlContent,
        sources_checked: processingResult.sourceCount,
        items_processed: processingResult.articlesProcessed,
        ai_tokens_used: processingResult.aiResponse.usage?.total_tokens || 0,
        updated_at: new Date().toISOString()
      })
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
        updated_at: new Date().toISOString()
      })
      .eq('id', run.id);

    throw error;
  }
}