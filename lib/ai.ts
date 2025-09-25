import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

// Lazy-loaded AI clients
let anthropic: Anthropic | null = null;
let openai: OpenAI | null = null;

function getAnthropicClient(): Anthropic | null {
  if (anthropic === null && process.env.ANTHROPIC_API_KEY) {
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropic;
}

function getOpenAIClient(): OpenAI | null {
  if (openai === null && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

export interface AIResponse {
  content: string;
  model: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export async function generateWithClaude(prompt: string, maxTokens: number = 4000): Promise<AIResponse> {
  const client = getAnthropicClient();
  if (!client) {
    throw new Error('Anthropic API key not configured');
  }

  try {
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: maxTokens,
      messages: [{
        role: 'user',
        content: prompt
      }],
      temperature: 0.7
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response format from Claude');
    }

    return {
      content: content.text,
      model: 'claude-3-5-sonnet-20241022',
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

export function getAvailableModels(): { claude: boolean; gpt: boolean } {
  return {
    claude: !!process.env.ANTHROPIC_API_KEY,
    gpt: !!process.env.OPENAI_API_KEY
  };
}