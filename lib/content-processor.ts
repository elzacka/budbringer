import { generateContent, AIResponse } from './ai';
import { NewsItem } from './news-fetcher';
import { formatNewsletterDate, formatNorwegianDate } from './timezone';
import { DigestContent } from './types';

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

  return `Du er en erfaren redaktør for et norsk nyhetsbrev om kunstig intelligens (KI). Din jobb er å gjøre komplekse KI-nyheter forståelige og nyttige for vanlige folk.

REDAKTØRENS INSTRUKSER:
${editorPrompt}

MÅLGRUPPE: ${audience}
TONE: ${tone}
SPRÅKGUIDE: ${styleGuide}

**NORSK TERMINOLOGI:**
- Bruk ALLTID "kunstig intelligens" eller "KI" i stedet for "AI" eller "artificial intelligence"
- Bruk "maskinlæring" i stedet for "machine learning"
- Bruk "språkmodell" i stedet for "language model"
- Bruk "chatbot" eller "chat-robot" i stedet for "chatbot"
- UNNTAK: Behold engelske navn på produkter (ChatGPT, GPT-4, Claude) og firmaer (OpenAI, Anthropic)

DAGENS NYHETER (${newsItems.length} artikler):
${articlesText}

## SKRIVEFILOSOFI

**TONE & STEMME:**
- Skriv som om du forklarer til en nysgjerrig venn over kaffe
- Være entusiastisk men ikke overdrevet
- Bruk aktiv stemme og korte setninger (maks 20 ord)
- Unngå klisjeer som "revolusjonerende", "game-changing", "paradigmeskifte"

**"HVA BETYR DETTE?" REGEL:**
For hver nyhet MÅ du svare på:
- Hvorfor er dette viktig for leseren?
- Hva betyr dette i praksis?
- Hvordan påvirker dette hverdagen til folk?
- Hva bør jeg tenke om dette?

**FJERN UNØDVENDIG INFO:**
IKKE inkluder:
- Generisk corporate speak ("leading provider", "innovative solutions")
- Vage påstander uten substans ("significantly improved", "enhanced capabilities")
- Tekniske detaljer som ikke betyr noe for vanlige folk
- PR-språk og markedsføringsbegrep
- Rene produktlanseringer uten samfunnsverdi

INKLUDER BARE:
- Nyheter som faktisk påvirker folks liv eller arbeid
- Konkrete endringer folk kan merke
- Utvikling som har praktiske konsekvenser

**FORKLARINGSKRAV:**
- Forklar alle fagtermer første gang de brukes
- Gi konkrete eksempler på abstrakte konsepter
- Oversett teknisk sjargong til hverdagsspråk
- Sammenlign med ting folk kjenner

**RELEVANSTEST:**
Før du inkluderer en nyhet, spør:
1. Vil dette påvirke hvordan folk jobber, lærer eller lever?
2. Er dette noe folk faktisk kan bruke eller forholde seg til?
3. Forteller dette noe viktig om fremtiden?
4. Hvis svaret er nei på alle - ikke inkluder det.

Opprett et strukturert nyhetsbrev for ${today} med følgende format:

1. INGRESS (2-3 setninger som fanger dagens største KI-historie OG forklarer hvorfor den betyr noe)
2. HOVEDSAKER (3-5 saker som faktisk påvirker folks liv, organisert tematisk)
3. HANDLINGSFORSLAG (2-4 konkrete ting leseren kan gjøre DENNE UKEN)

**PRIORITERING AV KILDER:**
- Hvis det finnes norske/nordiske KI-nyheter: prioriter disse høyest
- Internasjonale nyheter: bare inkluder hvis de påvirker Norge eller er særlig viktige
- Hvis få norske kilder: fokuser på hvordan internasjonale utviklinger påvirker Norge

Retningslinjer:
- Maksimalt 700 ord totalt (kortere er bedre)
- Hver bullet skal svare på "så hva?" innen første setning
- Bruk konkrete tall og eksempler fremfor vage beskrivelser
- Prioriter norske/nordiske perspektiver når tilgjengelig
- Gjør handlingsforslag spesifikke og gjennomførbare
- Organiser i tematiske seksjoner som gir mening for leseren
- Inkluder norsk kontekst selv for internasjonale nyheter

Svar BARE med JSON i følgende format:
{
  "dateLabel": "${today}",
  "lead": "Din ingress her...",
  "sections": [
    {
      "heading": "Seksjonsnavn",
      "bullets": [
        {
          "text": "ChatGPT kan nå skrive kode som fungerer første gang - det betyr at programmerere kan fokusere mer på kreativt problemløsing fremfor å fikse bugs.",
          "sourceUrl": "https://example.com/article1",
          "sourceName": "TechCrunch"
        },
        {
          "text": "Google lanserer AI-assistent som kan planlegge hele ferier for deg - bare fortell hvor du vil reise og hva du liker, så ordner den resten.",
          "sourceUrl": "https://example.com/article2",
          "sourceName": "The Verge"
        }
      ]
    }
  ],
  "actions": [
    "Test ChatGPT Code Interpreter på ett av dine vanlige programmeringsoppgaver denne uken",
    "Prøv Google Bard til å planlegge din neste helgetur - sammenlign resultatene med dine egne planer"
  ]
}

KRITISKE KRAV:

**TEKSTSTRUKTUR:**
Hver bullet MÅ følge denne malen:
"[HVA SKJER] - [HVA DETTE BETYR FOR LESEREN]"

Eksempel på RIKTIG format:
✓ "OpenAI lanserer GPT-5 med multimodal-funksjon - det betyr du kan laste opp bilder og få AI til å forklare, redigere eller lage lignende bilder direkte i chatten."

Eksempel på FEIL format:
✗ "OpenAI announces GPT-5 with enhanced capabilities and improved performance across multiple domains."

**KILDEKRAV:**
For hver bullet skal du ALLTID inkludere:
- "text": nyhetsteksten som følger strukturen over
- "sourceUrl": originalartikkelens URL fra listen over
- "sourceName": navnet på kilden fra listen over

**KVALITETSKONTROLL:**
Før du sender svaret, sjekk:
1. Forklarer hver bullet HVORFOR dette er viktig?
2. Kan bestemor forstå hva dette betyr?
3. Er handlingsforslagene noe folk faktisk kan gjøre?
4. Har du fjernet alt corporate speak og teknisk tull?

Bruk kun URLer og kildenavn fra artiklene jeg ga deg over. Match hver bullet til riktig originalartikel.`;
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
          bullets: [{ text: 'Ingen nye relevante KI-nyheter funnet i dag' }]
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
      } else {
        section.bullets.forEach((bullet, bulletIndex) => {
          if (typeof bullet === 'string') {
            if (bullet.trim().length === 0) {
              errors.push(`Section ${index + 1}, bullet ${bulletIndex + 1} is empty`);
            }
          } else if (bullet && typeof bullet === 'object' && 'text' in bullet) {
            if (!bullet.text || bullet.text.trim().length === 0) {
              errors.push(`Section ${index + 1}, bullet ${bulletIndex + 1} missing text`);
            }
          } else {
            errors.push(`Section ${index + 1}, bullet ${bulletIndex + 1} is not valid`);
          }
        });
      }
    });
  }

  if (!Array.isArray(content.actions) || content.actions.length === 0) {
    errors.push('Missing or empty actions array');
  }

  return errors;
}