import { getSupabaseServerComponentClient } from './supabase-server';
import type { Database } from '../types/database.types';

export async function getRecipients(): Promise<Subscriber[] | null> {
  const supabase = await getSupabaseServerComponentClient();
  const { data, error } = await supabase.from('subscribers').select('*').order('created_at', { ascending: false });
  if (error) {
    throw error;
  }
  return data;
}

export async function getPrompts(): Promise<Prompt[] | null> {
  const supabase = await getSupabaseServerComponentClient();
  const { data, error } = await supabase.from('prompts').select('*').order('updated_at', { ascending: false });
  if (error) {
    throw error;
  }
  return data;
}

export async function getLatestRuns(limit = 10): Promise<DigestRunWithPrompt[] | null> {
  const supabase = await getSupabaseServerComponentClient();
  const { data, error } = await supabase
    .from('digest_runs')
    .select(`
      *,
      prompts!digest_runs_prompt_id_fkey (
        name
      )
    `)
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

export type DigestRunWithPrompt = DigestRun & {
  prompts: {
    name: string;
  } | null;
};

export async function deleteDigestRun(runId: string): Promise<void> {
  const supabase = await getSupabaseServerComponentClient();
  const { error } = await supabase
    .from('digest_runs')
    .delete()
    .eq('id', runId);
  if (error) {
    throw error;
  }
}
