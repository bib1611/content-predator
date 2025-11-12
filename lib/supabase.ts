import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client with service role (use carefully)
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Database types
export interface ContentOpportunity {
  id: string;
  date_scanned: string;
  platform: 'twitter' | 'substack';
  opportunity_type: 'gap' | 'viral_format' | 'trending_topic';
  content_snippet: string | null;
  engagement_metrics: Record<string, any> | null;
  suggested_angle: string;
  suggested_format: 'tweet' | 'thread' | 'article';
  hook: string | null;
  cta: string | null;
  priority_score: number;
  used: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScanHistory {
  id: string;
  scan_date: string;
  platforms_scanned: string[];
  opportunities_found: number;
  scan_duration: number | null;
  error_log: string | null;
  user_id: string | null;
  created_at: string;
}

export interface GeneratedContent {
  id: string;
  opportunity_id: string;
  generated_at: string;
  content_type: 'tweet' | 'thread' | 'article';
  content: string;
  hook: string | null;
  cta: string | null;
  published: boolean;
  published_at: string | null;
  engagement_actual: Record<string, any> | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  favorite: boolean;
  archived: boolean;
  tags: string[];
  message_count: number;
  user_id: string | null;
  workspace_id: string | null;
  position: number;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  content_type: 'text' | 'generated_content' | 'critique' | 'opportunity';
  created_at: string;
  edited_at: string | null;
  opportunity_id: string | null;
  generated_content_id: string | null;
  metadata: Record<string, any>;
  position: number;
}

export interface ConversationListView {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  favorite: boolean;
  archived: boolean;
  tags: string[];
  message_count: number;
  position: number;
  last_message_preview: string | null;
}
