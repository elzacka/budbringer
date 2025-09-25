export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      subscribers: {
        Row: {
          id: string;
          email: string;
          status: 'pending' | 'confirmed' | 'unsubscribed' | 'rejected';
          created_at: string;
          updated_at: string;
          source: 'form' | 'admin';
          language: 'nb-NO';
          preferences: Json | null;
          last_sent_at: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          status?: 'pending' | 'confirmed' | 'unsubscribed' | 'rejected';
          created_at?: string;
          updated_at?: string;
          source?: 'form' | 'admin';
          language?: 'nb-NO';
          preferences?: Json | null;
          last_sent_at?: string | null;
          notes?: string | null;
        };
        Update: Partial<Database['public']['Tables']['subscribers']['Insert']>;
      };
      prompts: {
        Row: {
          id: string;
          name: string;
          body: string;
          created_at: string;
          updated_at: string;
          is_active: boolean;
          version: number;
          tags: string[] | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          body: string;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
          version?: number;
          tags?: string[] | null;
          notes?: string | null;
        };
        Update: Partial<Database['public']['Tables']['prompts']['Insert']>;
      };
      digest_runs: {
        Row: {
          id: string;
          created_at: string;
          executed_for: string;
          status: 'pending' | 'success' | 'failed';
          model_used: string | null;
          prompt_id: string | null;
          summary_html: string | null;
          summary_markdown: string | null;
          summary_plain: string | null;
          audio_url: string | null;
          metadata: Json | null;
          error: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          executed_for: string;
          status?: 'pending' | 'success' | 'failed';
          model_used?: string | null;
          prompt_id?: string | null;
          summary_html?: string | null;
          summary_markdown?: string | null;
          summary_plain?: string | null;
          audio_url?: string | null;
          metadata?: Json | null;
          error?: string | null;
        };
        Update: Partial<Database['public']['Tables']['digest_runs']['Insert']>;
      };
      news_items: {
        Row: {
          id: string;
          created_at: string;
          url: string;
          title: string;
          source: string;
          published_at: string | null;
          language: string | null;
          raw_content: string | null;
          summary: string | null;
          embedding: number[] | null;
          tags: string[] | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          url: string;
          title: string;
          source: string;
          published_at?: string | null;
          language?: string | null;
          raw_content?: string | null;
          summary?: string | null;
          embedding?: number[] | null;
          tags?: string[] | null;
        };
        Update: Partial<Database['public']['Tables']['news_items']['Insert']>;
      };
    };
    Views: {};
    Functions: {};
  };
}
