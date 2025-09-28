import OpenAI from 'openai';
import { getSupabaseServiceClient } from './supabase-admin';
import type { NewsItem } from './news-fetcher';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export interface SimilarArticle {
  id: number;
  title: string;
  url: string;
  summary: string;
  publishedAt: string;
  sourceName: string;
  similarity: number;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text.substring(0, 8000)
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

export async function generateArticleEmbedding(item: NewsItem): Promise<number[]> {
  const text = `${item.title}\n\n${item.description || ''}\n\n${item.content || ''}`;
  return generateEmbedding(text);
}

export async function storeArticleEmbedding(articleId: number, embedding: number[]): Promise<void> {
  const supabase = getSupabaseServiceClient();

  const { error } = await supabase
    .from('content_items')
    .update({ embedding })
    .eq('id', articleId);

  if (error) {
    console.error('Error storing article embedding:', error);
    throw error;
  }
}

export async function findSimilarArticles(
  queryEmbedding: number[],
  limit: number = 10,
  minSimilarity: number = 0.80
): Promise<SimilarArticle[]> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase.rpc('match_articles', {
    query_embedding: queryEmbedding,
    match_threshold: minSimilarity,
    match_count: limit
  });

  if (error) {
    console.error('Error finding similar articles:', error);
    return [];
  }

  return (data || []).map((row: {
    id: number;
    title: string;
    url: string;
    summary: string;
    published_at: string;
    source_name: string;
    similarity: number;
  }) => ({
    id: row.id,
    title: row.title,
    url: row.url,
    summary: row.summary,
    publishedAt: row.published_at,
    sourceName: row.source_name,
    similarity: row.similarity
  }));
}

export async function searchArticlesByQuery(
  query: string,
  limit: number = 10,
  minSimilarity: number = 0.80
): Promise<SimilarArticle[]> {
  const queryEmbedding = await generateEmbedding(query);
  return findSimilarArticles(queryEmbedding, limit, minSimilarity);
}

export async function deduplicateBySemanticSimilarity(
  items: NewsItem[],
  similarityThreshold: number = 0.90
): Promise<NewsItem[]> {
  if (items.length === 0) {
    return [];
  }

  console.log(`Starting semantic deduplication of ${items.length} articles (threshold: ${similarityThreshold})`);

  const embeddings = await Promise.all(
    items.map(item => generateArticleEmbedding(item))
  );

  const duplicateGroups = new Set<number>();
  const unique: NewsItem[] = [];

  for (let i = 0; i < items.length; i++) {
    if (duplicateGroups.has(i)) {
      continue;
    }

    let isDuplicate = false;

    for (let j = 0; j < unique.length; j++) {
      const similarity = cosineSimilarity(embeddings[i], embeddings[items.indexOf(unique[j])]);
      if (similarity >= similarityThreshold) {
        isDuplicate = true;
        duplicateGroups.add(i);
        break;
      }
    }

    if (!isDuplicate) {
      unique.push(items[i]);
    }
  }

  const duplicatesRemoved = items.length - unique.length;
  console.log(`Semantic deduplication complete: Removed ${duplicatesRemoved} duplicates (${((duplicatesRemoved / items.length) * 100).toFixed(1)}%)`);

  return unique;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function batchGenerateEmbeddings(items: NewsItem[]): Promise<Map<string, number[]>> {
  const embeddings = new Map<string, number[]>();
  const batchSize = 100;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, Math.min(i + batchSize, items.length));

    console.log(`Generating embeddings for batch ${Math.floor(i / batchSize) + 1} (${batch.length} items)`);

    const batchEmbeddings = await Promise.all(
      batch.map(item => generateArticleEmbedding(item))
    );

    batch.forEach((item, idx) => {
      embeddings.set(item.url, batchEmbeddings[idx]);
    });

    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return embeddings;
}