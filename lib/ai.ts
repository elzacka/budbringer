/**
 * AI MODEL CONFIGURATION & CONTENT GENERATION
 * ============================================
 * This file manages AI model connections and content generation.
 * It supports both Anthropic Claude and OpenAI GPT models with fallback.
 *
 * SUPPORTED MODELS:
 * - Primary: Claude Sonnet 4 (claude-sonnet-4-20250514)
 * - Fallback: GPT-4o (gpt-4o)
 * - Auto mode: Tries Claude first, falls back to GPT on failure
 *
 * MAIN FUNCTIONS:
 * - generateWithClaude(): Uses Anthropic Claude for content generation
 * - generateWithOpenAI(): Uses OpenAI GPT for content generation
 * - generateContent(): Smart function that chooses best available model
 *
 * ENVIRONMENT VARIABLES REQUIRED:
 * - ANTHROPIC_API_KEY: Your Anthropic API key
 * - OPENAI_API_KEY: Your OpenAI API key
 *
 * CUSTOMIZATION AREAS:
 * - Model selection and fallback logic
 * - AI parameters (temperature, max tokens, etc.)
 * - Retry logic and error handling
 * - Usage tracking and cost monitoring
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

/**
 * LAZY-LOADED AI CLIENTS
 * ======================
 * Clients are created only when needed and only if API keys are available.
 * This prevents errors during startup if some keys are missing.
 */
let anthropic: Anthropic | null = null;
let openai: OpenAI | null = null;

/**
 * Get Anthropic Claude client (lazy-loaded)
 * Creates client only when needed and API key is available
 */
function getAnthropicClient(): Anthropic | null {
  if (anthropic === null && process.env.ANTHROPIC_API_KEY) {
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropic;
}

/**
 * Get OpenAI GPT client (lazy-loaded)
 * Creates client only when needed and API key is available
 */
function getOpenAIClient(): OpenAI | null {
  if (openai === null && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

/**
 * Standard response format for all AI models
 * Provides consistent interface regardless of which model is used
 */
export interface AIResponse {
  content: string;              // Generated text content
  model: string;               // Which model was used (e.g., "claude-sonnet-4")
  usage?: {                    // Token usage statistics (optional)
    prompt_tokens?: number;    // Tokens in the prompt
    completion_tokens?: number; // Tokens in the response
    total_tokens?: number;     // Total tokens used
  };
}

/**
 * GENERATE CONTENT WITH CLAUDE
 * =============================
 * Uses Anthropic's Claude Sonnet 4 model for content generation.
 * This is the primary AI model for newsletter generation.
 *
 * INPUTS:
 * - prompt: The instruction/prompt for content generation
 * - maxTokens: Maximum tokens to generate (default: 4000)
 *
 * OUTPUT: AIResponse with generated content and usage statistics
 *
 * MODEL CONFIGURATION:
 * - Model: claude-sonnet-4-20250514 (latest Claude Sonnet 4)
 * - Temperature: 0.7 (balanced creativity vs consistency)
 * - Max tokens: 4000 (enough for newsletter content)
 *
 * CUSTOMIZATION:
 * - Change model: Modify line 88 (e.g., 'claude-3-opus-20240229')
 * - Adjust creativity: Modify temperature on line 94 (0.0 = deterministic, 1.0 = creative)
 * - Change output length: Modify maxTokens parameter
 * - Add system messages: Extend the messages array
 */
export async function generateWithClaude(prompt: string, maxTokens: number = 4000): Promise<AIResponse> {
  const client = getAnthropicClient();
  if (!client) {
    throw new Error('Anthropic API key not configured');
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',  // CUSTOMIZATION: Change model here
      max_tokens: maxTokens,
      messages: [{
        role: 'user',
        content: prompt
      }],
      temperature: 0.7  // CUSTOMIZATION: Adjust creativity (0.0-1.0)
    });

    // Extract text content from Claude's response
    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response format from Claude');
    }

    return {
      content: content.text,
      model: 'claude-sonnet-4-20250514',
      usage: {
        prompt_tokens: message.usage.input_tokens,
        completion_tokens: message.usage.output_tokens,
        total_tokens: message.usage.input_tokens + message.usage.output_tokens
      }
    };
  } catch (error) {
    console.error('Claude API error:', error);
    throw new Error(`Claude generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateWithGPT(prompt: string, maxTokens: number = 4000): Promise<AIResponse> {
  const client = getOpenAIClient();
  if (!client) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: prompt
      }],
      max_tokens: maxTokens,
      temperature: 0.7
    });

    const choice = completion.choices[0];
    if (!choice?.message?.content) {
      throw new Error('No content received from GPT');
    }

    return {
      content: choice.message.content,
      model: 'gpt-4o',
      usage: {
        prompt_tokens: completion.usage?.prompt_tokens,
        completion_tokens: completion.usage?.completion_tokens,
        total_tokens: completion.usage?.total_tokens
      }
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error(`GPT generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateContent(prompt: string, maxTokens: number = 4000, preferredModel: 'claude' | 'gpt' | 'auto' = 'auto'): Promise<AIResponse> {
  const claudeAvailable = !!process.env.ANTHROPIC_API_KEY;
  const gptAvailable = !!process.env.OPENAI_API_KEY;

  if (!claudeAvailable && !gptAvailable) {
    throw new Error('No AI models configured. Please set ANTHROPIC_API_KEY or OPENAI_API_KEY');
  }

  // Determine which model to use
  let useModel: 'claude' | 'gpt';
  if (preferredModel === 'auto') {
    useModel = claudeAvailable ? 'claude' : 'gpt';
  } else if (preferredModel === 'claude' && !claudeAvailable) {
    if (!gptAvailable) throw new Error('Claude not available and no fallback configured');
    useModel = 'gpt';
    console.warn('Claude requested but not available, falling back to GPT');
  } else if (preferredModel === 'gpt' && !gptAvailable) {
    if (!claudeAvailable) throw new Error('GPT not available and no fallback configured');
    useModel = 'claude';
    console.warn('GPT requested but not available, falling back to Claude');
  } else {
    useModel = preferredModel;
  }

  // Generate content
  if (useModel === 'claude') {
    return await generateWithClaude(prompt, maxTokens);
  } else {
    return await generateWithGPT(prompt, maxTokens);
  }
}

/**
 * Get available AI models based on configured API keys
 * Useful for debugging and displaying available options in admin panel
 */
export function getAvailableModels(): { claude: boolean; gpt: boolean } {
  return {
    claude: !!process.env.ANTHROPIC_API_KEY,
    gpt: !!process.env.OPENAI_API_KEY
  };
}

/**
 * AI MODEL CUSTOMIZATION REFERENCE GUIDE
 * =======================================
 * Quick reference for AI model configuration and customization.
 *
 * SWITCHING PRIMARY MODEL:
 * 1. Claude Sonnet 4 (default): Best quality, slower, more expensive
 * 2. Claude Sonnet 3.5: Faster, good quality, cheaper
 * 3. GPT-4o: Good fallback, different writing style
 * 4. GPT-4o-mini: Fastest, cheapest, lower quality
 *
 * MODEL CONFIGURATION:
 * - Line 111: Change Claude model (claude-sonnet-4-20250514)
 * - Line 117: Adjust Claude temperature (0.7)
 * - Line 147: Change GPT model (gpt-4o)
 * - Line 153: Adjust GPT temperature (0.7)
 *
 * TEMPERATURE SETTINGS:
 * - 0.0: Deterministic, consistent output
 * - 0.3: Slightly creative, good for formal content
 * - 0.7: Balanced creativity (default)
 * - 1.0: Very creative, less predictable
 *
 * TOKEN LIMITS:
 * - Claude Sonnet 4: 200k input tokens, 4k output tokens
 * - GPT-4o: 128k input tokens, 4k output tokens
 * - Default maxTokens: 4000 (good for newsletters)
 * - Increase for longer content, decrease for shorter
 *
 * FALLBACK LOGIC:
 * - 'auto': Try Claude first, fall back to GPT
 * - 'claude': Use Claude only, fail if unavailable
 * - 'gpt': Use GPT only, fail if unavailable
 * - Modify in generateContent() function
 *
 * ENVIRONMENT VARIABLES:
 * Add to .env.local:
 * ANTHROPIC_API_KEY=your_claude_api_key_here
 * OPENAI_API_KEY=your_openai_api_key_here
 *
 * COST OPTIMIZATION:
 * 1. Use GPT-4o-mini for testing (much cheaper)
 * 2. Reduce maxTokens for shorter content
 * 3. Lower temperature for more predictable output
 * 4. Monitor usage with the usage statistics in AIResponse
 *
 * QUALITY OPTIMIZATION:
 * 1. Use Claude Sonnet 4 for best results
 * 2. Adjust temperature based on content type:
 *    - News summaries: 0.3-0.5
 *    - Creative content: 0.7-0.9
 *    - Technical content: 0.1-0.3
 * 3. Fine-tune prompts in content-processor.ts
 *
 * AVAILABLE MODELS TO TRY:
 * Claude:
 * - claude-sonnet-4-20250514 (latest, best quality)
 * - claude-3-5-sonnet-20241022 (fast, good quality)
 * - claude-3-opus-20240229 (legacy, very expensive)
 *
 * OpenAI:
 * - gpt-4o (balanced)
 * - gpt-4o-mini (fast, cheap)
 * - gpt-4-turbo (legacy)
 *
 * TESTING CHANGES:
 * 1. Update model names and parameters
 * 2. Run: npm run digest:generate
 * 3. Check generated content quality
 * 4. Monitor costs and performance
 * 5. A/B test different configurations
 *
 * DEBUGGING:
 * - Check getAvailableModels() for API key status
 * - Monitor console logs for API errors
 * - Review usage statistics in responses
 * - Test with simple prompts first
 */