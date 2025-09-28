import type { NewsItem } from './news-fetcher';

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function generateShingles(text: string, k: number = 3): Set<string> {
  const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim();
  const shingles = new Set<string>();

  if (normalized.length < k) {
    shingles.add(normalized);
    return shingles;
  }

  for (let i = 0; i <= normalized.length - k; i++) {
    shingles.add(normalized.substring(i, i + k));
  }

  return shingles;
}

function generateMinHashSignature(shingles: Set<string>, numHashes: number = 100): number[] {
  const signature: number[] = [];
  const shingleArray = Array.from(shingles);

  for (let i = 0; i < numHashes; i++) {
    let minHash = Number.MAX_SAFE_INTEGER;

    for (const shingle of shingleArray) {
      const hash = hashString(shingle + i.toString());
      minHash = Math.min(minHash, hash);
    }

    signature.push(minHash);
  }

  return signature;
}

function estimateJaccardSimilarity(sig1: number[], sig2: number[]): number {
  if (sig1.length !== sig2.length) {
    throw new Error('Signatures must have the same length');
  }

  let matches = 0;
  for (let i = 0; i < sig1.length; i++) {
    if (sig1[i] === sig2[i]) {
      matches++;
    }
  }

  return matches / sig1.length;
}

export interface ArticleSignature {
  item: NewsItem;
  signature: number[];
  contentHash: string;
}

export function generateArticleSignature(item: NewsItem): ArticleSignature {
  const contentText = `${item.title} ${item.description || ''} ${item.content || ''}`;
  const shingles = generateShingles(contentText, 3);
  const signature = generateMinHashSignature(shingles, 100);
  const contentHash = hashString(contentText).toString();

  return {
    item,
    signature,
    contentHash
  };
}

export interface LSHBucket {
  bandHash: string;
  signatures: ArticleSignature[];
}

export class LSHIndex {
  private buckets: Map<string, ArticleSignature[]> = new Map();
  private numBands: number;
  private rowsPerBand: number;

  constructor(numBands: number = 20, rowsPerBand: number = 5) {
    this.numBands = numBands;
    this.rowsPerBand = rowsPerBand;

    if (numBands * rowsPerBand > 100) {
      throw new Error('numBands * rowsPerBand must not exceed signature length (100)');
    }
  }

  private hashBand(bandSignature: number[]): string {
    return bandSignature.join(',');
  }

  insert(articleSig: ArticleSignature): void {
    for (let band = 0; band < this.numBands; band++) {
      const start = band * this.rowsPerBand;
      const bandSignature = articleSig.signature.slice(start, start + this.rowsPerBand);
      const bandHash = this.hashBand(bandSignature);

      if (!this.buckets.has(bandHash)) {
        this.buckets.set(bandHash, []);
      }

      this.buckets.get(bandHash)!.push(articleSig);
    }
  }

  findCandidates(articleSig: ArticleSignature): ArticleSignature[] {
    const candidates = new Set<ArticleSignature>();

    for (let band = 0; band < this.numBands; band++) {
      const start = band * this.rowsPerBand;
      const bandSignature = articleSig.signature.slice(start, start + this.rowsPerBand);
      const bandHash = this.hashBand(bandSignature);

      const bucket = this.buckets.get(bandHash);
      if (bucket) {
        bucket.forEach(sig => {
          if (sig !== articleSig) {
            candidates.add(sig);
          }
        });
      }
    }

    return Array.from(candidates);
  }

  findSimilar(articleSig: ArticleSignature, threshold: number = 0.8): ArticleSignature[] {
    const candidates = this.findCandidates(articleSig);
    const similar: ArticleSignature[] = [];

    for (const candidate of candidates) {
      const similarity = estimateJaccardSimilarity(articleSig.signature, candidate.signature);
      if (similarity >= threshold) {
        similar.push(candidate);
      }
    }

    return similar;
  }
}

export function deduplicateWithLSH(items: NewsItem[], similarityThreshold: number = 0.8): NewsItem[] {
  if (items.length === 0) {
    return [];
  }

  console.log(`Starting LSH deduplication of ${items.length} articles (threshold: ${similarityThreshold})`);

  const signatures = items.map(item => generateArticleSignature(item));

  const lshIndex = new LSHIndex(20, 5);
  const duplicateGroups = new Map<string, ArticleSignature[]>();
  const processed = new Set<string>();

  for (const sig of signatures) {
    if (processed.has(sig.contentHash)) {
      continue;
    }

    const similar = lshIndex.findSimilar(sig, similarityThreshold);

    if (similar.length > 0) {
      const group = [sig, ...similar];
      const groupKey = group.map(s => s.contentHash).sort().join('|');

      if (!duplicateGroups.has(groupKey)) {
        duplicateGroups.set(groupKey, group);
        group.forEach(s => processed.add(s.contentHash));
      }
    } else {
      processed.add(sig.contentHash);
    }

    lshIndex.insert(sig);
  }

  const uniqueSignatures = signatures.filter(sig => {
    for (const group of duplicateGroups.values()) {
      if (group.some(s => s.contentHash === sig.contentHash)) {
        return sig === group[0];
      }
    }
    return true;
  });

  const duplicatesRemoved = items.length - uniqueSignatures.length;
  const deduplicationRate = ((duplicatesRemoved / items.length) * 100).toFixed(1);

  console.log(`LSH deduplication complete: Removed ${duplicatesRemoved} duplicates (${deduplicationRate}%)`);
  console.log(`Unique articles: ${uniqueSignatures.length}`);

  return uniqueSignatures.map(sig => sig.item);
}

export function removeDuplicatesByUrl(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = item.url || item.title.toLowerCase().trim();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function deduplicateArticles(items: NewsItem[], useLSH: boolean = true, lshThreshold: number = 0.8): NewsItem[] {
  const urlDeduped = removeDuplicatesByUrl(items);

  if (useLSH && urlDeduped.length > 1) {
    return deduplicateWithLSH(urlDeduped, lshThreshold);
  }

  return urlDeduped;
}