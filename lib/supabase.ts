import { createClient } from '@supabase/supabase-js';

// Validate required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set');
}

if (!supabaseServiceRoleKey) {
  throw new Error('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY must be set');
}

// Client-side Supabase client (respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * ADMIN CLIENT - USE WITH EXTREME CAUTION
 *
 * This client bypasses Row-Level Security (RLS) policies.
 *
 * DO NOT USE for user-facing operations. Instead:
 * - For API routes: Use createClient() from lib/supabase-server.ts
 * - For client components: Use supabase from this file
 *
 * Only use supabaseAdmin for:
 * - System-level operations that truly need admin access
 * - Background jobs and cron tasks
 * - Operations that span multiple users
 *
 * NEVER use this in API routes that respond to user requests.
 */
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
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
  user_id: string | null;
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
