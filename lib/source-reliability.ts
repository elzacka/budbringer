import { getSupabaseServiceClient } from './supabase-admin';
import type { NewsItem } from './news-fetcher';

export interface SourceReliability {
  sourceId: number;
  sourceName: string;
  reliabilityScore: number;
  historicalAccuracy: number;
  fetchSuccessRate: number;
  totalFetches: number;
  successfulFetches: number;
  lastFetchSuccess: boolean;
}

const RELIABILITY_WEIGHTS = {
  historicalAccuracy: 0.30,
  fetchSuccessRate: 0.25,
  contentQuality: 0.20,
  expertEndorsement: 0.15,
  socialSignals: 0.10
};

const TIER_SCORES = {
  tier1: 0.90,
  tier2: 0.75,
  tier3: 0.60,
  tier4: 0.50,
  unknown: 0.50
};

const NORWEGIAN_TIER1_SOURCES = [
  'nrk.no', 'aftenposten.no', 'dn.no', 'vg.no', 'nettavisen.no'
];

const TECH_TIER1_SOURCES = [
  'techcrunch.com', 'arstechnica.com', 'theverge.com', 'wired.com',
  'technologyreview.com', 'itavisen.no'
];

export function calculateBaseReliabilityScore(source: {
  name: string;
  base_url: string;
  historical_accuracy?: number;
  fetch_success_rate?: number;
}): number {
  const historicalAccuracy = source.historical_accuracy || 0.50;
  const fetchSuccessRate = source.fetch_success_rate || 1.00;

  const domain = new URL(source.base_url).hostname.replace('www.', '');
  let expertEndorsement = TIER_SCORES.unknown;

  if (NORWEGIAN_TIER1_SOURCES.some(tier1 => domain.includes(tier1))) {
    expertEndorsement = TIER_SCORES.tier1;
  } else if (TECH_TIER1_SOURCES.some(tier1 => domain.includes(tier1))) {
    expertEndorsement = TIER_SCORES.tier1;
  } else if (domain.includes('edu') || domain.includes('gov')) {
    expertEndorsement = TIER_SCORES.tier2;
  }

  const contentQuality = 0.60;
  const socialSignals = 0.50;

  const reliabilityScore =
    (historicalAccuracy * RELIABILITY_WEIGHTS.historicalAccuracy) +
    (fetchSuccessRate * RELIABILITY_WEIGHTS.fetchSuccessRate) +
    (contentQuality * RELIABILITY_WEIGHTS.contentQuality) +
    (expertEndorsement * RELIABILITY_WEIGHTS.expertEndorsement) +
    (socialSignals * RELIABILITY_WEIGHTS.socialSignals);

  return Math.max(0, Math.min(1, reliabilityScore));
}

export async function updateSourceReliability(
  sourceId: number,
  fetchSuccess: boolean
): Promise<void> {
  const supabase = getSupabaseServiceClient();

  const { data: source, error: fetchError } = await supabase
    .from('content_sources')
    .select('id, name, base_url, total_fetches, successful_fetches, historical_accuracy, fetch_success_rate')
    .eq('id', sourceId)
    .single();

  if (fetchError || !source) {
    console.error('Error fetching source for reliability update:', fetchError);
    return;
  }

  const totalFetches = (source.total_fetches || 0) + 1;
  const successfulFetches = (source.successful_fetches || 0) + (fetchSuccess ? 1 : 0);
  const fetchSuccessRate = totalFetches > 0 ? successfulFetches / totalFetches : 1.0;

  const reliabilityScore = calculateBaseReliabilityScore({
    name: source.name,
    base_url: source.base_url,
    historical_accuracy: source.historical_accuracy || 0.50,
    fetch_success_rate: fetchSuccessRate
  });

  const { error: updateError } = await supabase
    .from('content_sources')
    .update({
      reliability_score: reliabilityScore,
      fetch_success_rate: fetchSuccessRate,
      total_fetches: totalFetches,
      successful_fetches: successfulFetches,
      last_fetch_success: fetchSuccess,
      last_updated_at: new Date().toISOString()
    })
    .eq('id', sourceId);

  if (updateError) {
    console.error('Error updating source reliability:', updateError);
  } else {
    console.log(`Updated reliability for ${source.name}: ${reliabilityScore.toFixed(2)} (fetch rate: ${(fetchSuccessRate * 100).toFixed(1)}%)`);
  }
}

export async function getSourceReliability(sourceId: number): Promise<SourceReliability | null> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('content_sources')
    .select('id, name, reliability_score, historical_accuracy, fetch_success_rate, total_fetches, successful_fetches, last_fetch_success')
    .eq('id', sourceId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    sourceId: data.id,
    sourceName: data.name,
    reliabilityScore: data.reliability_score || 0.50,
    historicalAccuracy: data.historical_accuracy || 0.50,
    fetchSuccessRate: data.fetch_success_rate || 1.00,
    totalFetches: data.total_fetches || 0,
    successfulFetches: data.successful_fetches || 0,
    lastFetchSuccess: data.last_fetch_success !== false
  };
}

export function sortByReliability<T extends { source: string }>(
  items: T[],
  reliabilityMap: Map<string, number>
): T[] {
  return items.sort((a, b) => {
    const reliabilityA = reliabilityMap.get(a.source) || 0.50;
    const reliabilityB = reliabilityMap.get(b.source) || 0.50;
    return reliabilityB - reliabilityA;
  });
}

export async function getAllSourceReliabilities(): Promise<Map<string, number>> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('content_sources')
    .select('name, reliability_score');

  if (error || !data) {
    console.error('Error fetching source reliabilities:', error);
    return new Map();
  }

  const reliabilityMap = new Map<string, number>();
  for (const source of data) {
    reliabilityMap.set(source.name, source.reliability_score || 0.50);
  }

  return reliabilityMap;
}

export function filterByMinimumReliability(
  items: NewsItem[],
  reliabilityMap: Map<string, number>,
  minimumScore: number = 0.40
): NewsItem[] {
  return items.filter(item => {
    const reliability = reliabilityMap.get(item.source) || 0.50;
    return reliability >= minimumScore;
  });
}