import { getSupabaseServerComponentClient } from './supabase-server';
import type { Database } from '../types/database.types';

export async function getRecipients() {
  const supabase = getSupabaseServerComponentClient();
  const { data, error } = await supabase.from('subscribers').select('*').order('created_at', { ascending: false });
  if (error) {
    throw error;
  }
  return data;
}

export async function getPrompts() {
  const supabase = getSupabaseServerComponentClient();
  const { data, error } = await supabase.from('prompts').select('*').order('updated_at', { ascending: false });
  if (error) {
    throw error;
  }
  return data;
}

export async function getLatestRuns(limit = 10) {
  const supabase = getSupabaseServerComponentClient();
  const { data, error } = await supabase
    .from('digest_runs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    throw error;
  }
  return data;
}

export type Subscriber = Database['public']['Tables']['subscribers']['Row'];
export type Prompt = Database['public']['Tables']['prompts']['Row'];
export type DigestRun = Database['public']['Tables']['digest_runs']['Row'];
