import { generateContent, AIResponse } from './ai';
import { NewsItem } from './news-fetcher';
import { formatNewsletterDate, formatNorwegianDate } from './timezone';

export interface DigestContent {
  dateLabel: string;
  lead: string;
  sections: {
    heading: string;
    bullets: string[];
  }[];
  actions: string[];
}

export interface ProcessingResult {
  content: DigestContent;
  aiResponse: AIResponse;
  sourceCount: number;
  articlesProcessed: number;
}

export function buildPrompt(newsItems: NewsItem[], editorPrompt: string, templateConfig: Record<string, unknown>): string {
  const today = formatNorwegianDate();

  const articlesText = newsItems.map((item, index) => {
    return `${index + 1}. "${item.title}" (${item.source})
   URL: ${item.url}
   Publisert: ${new Date(item.published_at).toLocaleDateString('no-NO', { timeZone: 'Europe/Oslo' })}
   Sammendrag: ${item.description || 'Ikke tilgjengelig'}
   Kategori: ${item.category || 'Ukjent'}`;
  }).join('\n\n');

  const tone = (templateConfig.tone as string) || 'profesjonell_tilgjengelig';
  const audience = (templateConfig.target_audience as string) || 'norske lesere';
  const styleGuide = (templateConfig.style_guide as string) || 'Bruk korrekt norsk, bevar engelske fagtermer';

  return `Du er en erfaren redaktør for et norsk KI-nyhetsbrev. Din oppgave er å lage dagens utgave basert på de innsamlede nyhetene.

REDAKTØRENS INSTRUKSER:
${editorPrompt}

MÅLGRUPPE: ${audience}
TONE: ${tone}
SPRÅKGUIDE: ${styleGuide}

DAGENS NYHETER (${newsItems.length} artikler):
${articlesText}

Opprett et strukturert nyhetsbrev for ${today} med følgende format:

1. INGRESS (2-3 setninger som oppsummerer dagens viktigste KI-nyheter)
2. HOVEDSAKER (3-6 viktigste saker, organisert i tematiske seksjoner)
3. HANDLINGSFORSLAG (2-4 konkrete ting leseren kan gjøre)

Retningslinjer:
- Fokuser på nyheter som påvirker Norge eller nordmenn
- Prioriter nyheter fra de siste 48 timene
- Behold engelske fagtermer og firmanavn
- Skriv kort og konsist - maksimalt 800 ord totalt
- Inkluder relevante lenker fra artiklene
- Organiser i tematiske seksjoner (f.eks. "Produktnyheter", "Forskning", "Regulering")

Svar BARE med JSON i følgende format:
{
  "dateLabel": "${today}",
  "lead": "Din ingress her...",
  "sections": [
    {
      "heading": "Seksjonsnavn",
      "bullets": [
        "Første nyhet med relevant informasjon",
        "Andre nyhet med relevant informasjon"
      ]
    }
  ],
  "actions": [
    "Første handlingsforslag",
    "Andre handlingsforslag"
  ]
}`;
}

export async function processNewsIntoDigest(
  newsItems: NewsItem[],
  editorPrompt: string,
  templateConfig: Record<string, unknown>,
  preferredModel: 'claude' | 'gpt' | 'auto' = 'auto'
): Promise<ProcessingResult> {

  if (newsItems.length === 0) {
    // Return fallback content if no news
    return {
      content: {
        dateLabel: formatNewsletterDate(),
        lead: 'I dag har vi ikke funnet nye KI-nyheter som møter våre kriterier. Vi fortsetter å overvåke situasjonen.',
        sections: [{
          heading: 'Status',
          bullets: ['Ingen nye relevante KI-nyheter funnet i dag']
        }],
        actions: ['Sjekk gjerne tidligere utgaver av nyhetsbrevet for oppdateringer']
      },
      aiResponse: {
        content: 'Fallback content generated',
        model: 'fallback'
      },
      sourceCount: 0,
      articlesProcessed: 0
    };
  }

  console.log(`Processing ${newsItems.length} news items into digest`);

  // Build the prompt
  const prompt = buildPrompt(newsItems, editorPrompt, templateConfig);
  console.log('Prompt length:', prompt.length, 'characters');

  try {
    // Generate content with AI
    const aiResponse = await generateContent(prompt, 4000, preferredModel);
    console.log(`Generated content with ${aiResponse.model}`);

    // Parse the JSON response
    let content: DigestContent;
    try {
      // First, try to clean the response by removing markdown code blocks
      let cleanedContent = aiResponse.content.trim();
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      content = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('AI Response:', aiResponse.content.substring(0, 500) + '...');

      // Fallback: try to extract JSON from response
      const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        content = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('AI did not return valid JSON format');
      }
    }

    // Validate the structure
    if (!content.dateLabel || !content.lead || !Array.isArray(content.sections) || !Array.isArray(content.actions)) {
      throw new Error('AI response missing required fields');
    }

    // Count unique sources
    const uniqueSources = new Set(newsItems.map(item => item.source));

    return {
      content,
      aiResponse,
      sourceCount: uniqueSources.size,
      articlesProcessed: newsItems.length
    };

  } catch (error) {
    console.error('Error processing news into digest:', error);
    throw new Error(`Content processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function validateDigestContent(content: DigestContent): string[] {
  const errors: string[] = [];

  if (!content.dateLabel || content.dateLabel.trim().length === 0) {
    errors.push('Missing or empty dateLabel');
  }

  if (!content.lead || content.lead.trim().length === 0) {
    errors.push('Missing or empty lead');
  }

  if (!Array.isArray(content.sections) || content.sections.length === 0) {
    errors.push('Missing or empty sections array');
  } else {
    content.sections.forEach((section, index) => {
      if (!section.heading || section.heading.trim().length === 0) {
        errors.push(`Section ${index + 1} missing heading`);
      }
      if (!Array.isArray(section.bullets) || section.bullets.length === 0) {
        errors.push(`Section ${index + 1} missing bullets`);
      }
    });
  }

  if (!Array.isArray(content.actions) || content.actions.length === 0) {
    errors.push('Missing or empty actions array');
  }

  return errors;
}