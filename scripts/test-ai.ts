import dotenv from 'dotenv';
import { getAvailableModels, generateContent } from '../lib/ai';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testAI() {
  console.log('=== Testing AI Integration ===\n');

  // Check which models are available
  const models = getAvailableModels();
  console.log('Available models:', models);

  if (!models.claude && !models.gpt) {
    console.error('❌ No AI models configured!');
    console.log('Please set ANTHROPIC_API_KEY or OPENAI_API_KEY in your .env.local file');
    process.exit(1);
  }

  // Test prompt
  const testPrompt = `Du er redaktør for et norsk KI-nyhetsbrev. Lag et kort eksempel på en nyhetssak basert på denne fiktive informasjonen:

Tittel: "OpenAI lanserer ny versjon av ChatGPT"
Sammendrag: "Selskapet kunngjør forbedringer innen norskspråklig støtte"

Svar med JSON i dette formatet:
{
  "heading": "Kort seksjonsnavn",
  "bullet": "En setning som oppsummerer nyheten på norsk"
}`;

  try {
    console.log('Testing AI generation...\n');

    const response = await generateContent(testPrompt, 500, 'auto');

    console.log('✅ AI Test Successful!');
    console.log('Model used:', response.model);
    console.log('Response length:', response.content.length, 'characters');

    if (response.usage) {
      console.log('Tokens used:', response.usage.total_tokens);
    }

    console.log('\n--- AI Response ---');
    console.log(response.content);
    console.log('--- End Response ---\n');

    // Try to parse as JSON
    try {
      const parsed = JSON.parse(response.content);
      console.log('✅ JSON parsing successful:', parsed);
    } catch (parseError) {
      console.log('⚠️  JSON parsing failed, but AI responded normally');
    }

  } catch (error) {
    console.error('❌ AI Test Failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testAI().catch(console.error);
}