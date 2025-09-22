import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();
import Parser from 'rss-parser';
import pLimit from 'p-limit';
import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import type { Database, Json } from '../types/database.types';
import { defaultSources } from '../lib/news-sources';
import { renderDigestHtml, renderDigestText } from '../lib/email';
import { Anthropic } from '@anthropic-ai/sdk';
import { writeFile, mkdtemp, mkdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';

type PromptRow = Database['public']['Tables']['prompts']['Row'];
type DigestRunRow = Database['public']['Tables']['digest_runs']['Row'];
type DigestRunInsert = Database['public']['Tables']['digest_runs']['Insert'];
type NewsItemInsert = Database['public']['Tables']['news_items']['Insert'];

interface Article {
  id: string;
  title: string;
  link: string;
  source: string;
  publishedAt: Date | null;
  contentSnippet: string;
  language: string;
}

interface ModelDigest {
  date_label: string;
  lead: string;
  sections: Array<{
    heading: string;
    bullets: string[];
    link?: string;
  }>;
  actions?: string[];
  audio_script?: string;
}

const logger = new console.Console(process.stdout, process.stderr);

const OSLO_TIMEZONE = 'Europe/Oslo';

function getOsloNow() {
  const now = new Date();
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: OSLO_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);

  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: OSLO_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(now);

  const offsetString = new Intl.DateTimeFormat('en-GB', {
    timeZone: OSLO_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'shortOffset'
  }).format(now);

  let offset = '+00:00';
  const match = offsetString.match(/GMT([+-]\d{1,2})(?::?(\d{2}))?/);
  if (match) {
    const sign = match[1].startsWith('-') ? '-' : '+';
    let hours = match[1].replace(/[+-]/, '');
    if (hours.length === 1) {
      hours = `0${hours}`;
    }
    const minutes = match[2] ?? '00';
    offset = `${sign}${hours}:${minutes}`;
  }

  const isoLocal = `${date}T${time}${offset}`;
  const label = new Intl.DateTimeFormat('nb-NO', {
    timeZone: OSLO_TIMEZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(now);

  return {
    executedFor: date,
    dateLabel: label,
    isoLocal
  };
}

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Miljøvariabel ${name} mangler`);
  }
  return value;
}

async function fetchArticles(): Promise<Article[]> {
  const parser = new Parser({
    customFields: {
      item: ['content:encoded']
    }
  });

  const limit = pLimit(4);
  const results = await Promise.all(
    defaultSources.map((source) =>
      limit(async () => {
        try {
          const feed = await parser.parseURL(source.url);
          return feed.items.map<Article>((item) => ({
            id: crypto.createHash('sha1').update(item.link ?? item.guid ?? item.title ?? '').digest('hex'),
            title: item.title ?? 'Uten tittel',
            link: item.link ?? item.guid ?? '',
            source: source.name,
            publishedAt: item.isoDate ? new Date(item.isoDate) : item.pubDate ? new Date(item.pubDate) : null,
            contentSnippet: (item['content:encoded'] as string) ?? item.contentSnippet ?? item.content ?? '',
            language: source.language === 'nb' ? 'nb-NO' : 'en-US'
          }));
        } catch (error) {
          logger.warn(`Klarte ikke å hente ${source.name}:`, error);
          return [];
        }
      })
    )
  );

  const articles = results.flat().filter((article) => article.link);

  // Dedupliser på URL + tittel
  const deduped = new Map<string, Article>();
  for (const article of articles) {
    const key = article.link.replace(/[#?].*$/, '').toLowerCase();
    if (!deduped.has(key)) {
      deduped.set(key, article);
    }
  }

  return Array.from(deduped.values())
    .sort((a, b) => {
      const aTime = a.publishedAt?.getTime() ?? 0;
      const bTime = b.publishedAt?.getTime() ?? 0;
      return bTime - aTime;
    })
    .slice(0, 24);
}

function buildContext(articles: Article[]) {
  return articles
    .map((article, index) => {
      const published = article.publishedAt
        ? format(article.publishedAt, "d. MMMM yyyy HH:mm", { locale: nb })
        : 'Ukjent';
      return `${index + 1}. [${article.source}] ${article.title} (${published})\nURL: ${article.link}\nSammendrag: ${article.contentSnippet?.replace(/\s+/g, ' ').slice(0, 400)}`;
    })
    .join('\n\n');
}

function extractJson(text: string): ModelDigest {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const candidate = jsonMatch ? jsonMatch[0] : text;
  const parsed = JSON.parse(candidate) as ModelDigest;
  if (!parsed.sections) {
    throw new Error('JSON mangler sections');
  }
  return parsed;
}

async function callAnthropic(prompt: string, context: string) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return null;
  }
  const anthropic = new Anthropic({ apiKey: key });
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20240620',
    max_tokens: 2048,
    temperature: 0.6,
    system: prompt,
    messages: [
      {
        role: 'user',
        content: `Her er dagens nyheter:\n\n${context}\n\nLever følgende JSON-format: {"date_label": string, "lead": string, "sections": [{"heading": string, "bullets": [string], "link"?: string}], "actions"?: [string], "audio_script"?: string}`
      }
    ]
  });
  const text = response.content
    .map((block) => (block.type === 'text' ? block.text : ''))
    .join('\n');
  return extractJson(text);
}

async function maybeGenerateTTS(text: string, runId: string) {
  if (!process.env.ENABLE_TTS || process.env.ENABLE_TTS !== 'true') {
    return null;
  }

  const voice = process.env.PIPER_VOICE ?? 'nb_NO-karlsen-medium';
  const piperBinary = process.env.PIPER_BINARY ?? 'piper';
  const supabaseUrl = requireEnv('SUPABASE_SERVICE_URL');
  const supabaseKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

  const tempDir = await mkdtemp(join(tmpdir(), 'tts-'));
  const inputPath = join(tempDir, 'input.txt');
  const outputPath = join(tempDir, 'output.wav');

  await writeFile(inputPath, text, 'utf8');

  await new Promise<void>((resolve, reject) => {
    const child = execFile(
      piperBinary,
      ['--model', voice, '--output_file', outputPath],
      { maxBuffer: 1024 * 1024 * 10 },
      (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      }
    );

    child.stdin?.write(text);
    child.stdin?.end();
  }).catch((error: Error) => {
    logger.warn('TTS feilet', error);
    return null;
  });

  const audio = await readFile(outputPath);

  const supabaseTyped = createClient<Database>(supabaseUrl, supabaseKey);
  const storage = supabaseTyped.storage.from('digests');
  const fileName = `audio/${runId}.wav`;
  const upload = await storage.upload(fileName, audio, {
    contentType: 'audio/wav',
    upsert: true
  });

  if (upload.error) {
    logger.warn('Kunne ikke laste opp lydfil', upload.error);
    return null;
  }

  const { data: signed } = await storage.createSignedUrl(fileName, 60 * 60 * 24 * 7);
  return signed?.signedUrl ?? null;
}

async function main() {
  const supabaseUrl = requireEnv('SUPABASE_SERVICE_URL');
  const supabaseKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const publicSite = requireEnv('PUBLIC_SITE_URL');

  const supabaseClient = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });
  const supabase = supabaseClient as any;

  const articles = await fetchArticles();
  if (articles.length === 0) {
    throw new Error('Fant ingen artikler – avbryter.');
  }

  const newsItemPayload: NewsItemInsert[] = articles.map((article) => ({
    url: article.link,
    title: article.title,
    source: article.source,
    language: article.language,
    raw_content: article.contentSnippet.slice(0, 2000),
    published_at: article.publishedAt?.toISOString() ?? null
  }));

  await supabase.from('news_items').upsert(newsItemPayload as any, { onConflict: 'url' });

  const { data: promptData, error: promptError } = await supabase
    .from('prompts')
    .select('*')
    .eq('is_active', true)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  const prompt = promptData as PromptRow | null;

  if (promptError || !prompt) {
    throw new Error('Ingen aktiv prompt funnet. Sett en prompt i admin-panelet.');
  }

  const context = buildContext(articles);

  let digest: ModelDigest | null = null;
  let modelUsed = '';

  try {
    const anthropicResult = await callAnthropic(prompt.body, context);
    if (anthropicResult) {
      digest = anthropicResult;
      modelUsed = 'claude-3-5-sonnet';
    }
  } catch (error) {
    logger.warn('Anthropic feilet', error);
  }

  if (!digest) {
    throw new Error('Anthropic-modellen returnerte ingen data. Kontroller API-nøkkelen eller kvoten.');
  }

  const osloNow = getOsloNow();
  const executedFor = osloNow.executedFor;

  digest.date_label = osloNow.dateLabel;

  const runInsert: DigestRunInsert = {
    executed_for: executedFor,
    status: 'pending',
    model_used: modelUsed,
    prompt_id: prompt.id,
    metadata: {
      articles: articles.map((article) => article.link),
      generated_at_local: osloNow.isoLocal
    }
  };

  const { data: runData, error: runError } = await supabase
    .from('digest_runs')
    .insert(runInsert as any)
    .select('*')
    .single();

  const run = runData as DigestRunRow | null;

  if (runError || !run) {
    throw runError ?? new Error('Kunne ikke opprette rad i digest_runs');
  }

  let audioUrl: string | null = null;
  if (digest.audio_script) {
    audioUrl = await maybeGenerateTTS(digest.audio_script, run.id);
  }

  const emailHtml = renderDigestHtml({
    dateLabel: digest.date_label,
    lead: digest.lead,
    sections: digest.sections,
    actions: digest.actions,
    audioUrl
  });

  const emailText = renderDigestText({
    dateLabel: digest.date_label,
    lead: digest.lead,
    sections: digest.sections,
    actions: digest.actions,
    audioUrl
  });

  const markdown = digest.sections
    .map((section) => `## ${section.heading}\n${section.bullets.map((bullet) => `- ${bullet}`).join('\n')}`)
    .join('\n\n');

  const existingMetadata =
    run.metadata && typeof run.metadata === 'object' && !Array.isArray(run.metadata)
      ? (run.metadata as Record<string, Json>)
      : {};

  const updatedMetadata: Json = {
    ...existingMetadata,
    public_site: publicSite,
    generated_at_local: osloNow.isoLocal
  };

  const { error: updateError } = await supabase
    .from('digest_runs')
    .update({
      status: 'success',
      summary_html: emailHtml,
      summary_markdown: markdown,
      summary_plain: emailText,
      audio_url: audioUrl,
      metadata: updatedMetadata
    })
    .eq('id', run.id);

  if (updateError) {
    throw updateError;
  }

  await mkdir('out', { recursive: true });
  await writeFile('out/latest-digest.html', emailHtml, 'utf8');
  await writeFile('out/latest-digest.txt', emailText, 'utf8');

  logger.log('Digest generert for', osloNow.dateLabel, 'med modell', modelUsed);
}

main().catch(async (error) => {
  console.error('Daglig jobb feilet', error);
  const supabaseUrl = process.env.SUPABASE_SERVICE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && supabaseKey) {
    const supabase = createClient<Database>(supabaseUrl, supabaseKey) as any;
    const osloNow = getOsloNow();
    const failureInsert: DigestRunInsert = {
      executed_for: osloNow.executedFor,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Ukjent feil',
      metadata: {
        stack: error instanceof Error ? error.stack : null,
        generated_at_local: osloNow.isoLocal
      }
    };

    await supabase
      .from('digest_runs')
      .insert(failureInsert as any);
  }
  process.exit(1);
});
