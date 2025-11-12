-- Content Predator Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Content opportunities table
CREATE TABLE IF NOT EXISTS content_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date_scanned TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'substack')),
  opportunity_type TEXT NOT NULL CHECK (opportunity_type IN ('gap', 'viral_format', 'trending_topic')),
  content_snippet TEXT,
  engagement_metrics JSONB,
  suggested_angle TEXT NOT NULL,
  suggested_format TEXT NOT NULL CHECK (suggested_format IN ('tweet', 'thread', 'article')),
  hook TEXT,
  cta TEXT,
  priority_score INTEGER CHECK (priority_score >= 1 AND priority_score <= 10),
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scan history table
CREATE TABLE IF NOT EXISTS scan_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scan_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  platforms_scanned TEXT[] NOT NULL,
  opportunities_found INTEGER DEFAULT 0,
  scan_duration INTEGER, -- in seconds
  error_log TEXT,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content generation history
CREATE TABLE IF NOT EXISTS generated_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID REFERENCES content_opportunities(id) ON DELETE CASCADE,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  content_type TEXT NOT NULL CHECK (content_type IN ('tweet', 'thread', 'article')),
  content TEXT NOT NULL,
  hook TEXT,
  cta TEXT,
  published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  engagement_actual JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_opportunities_date ON content_opportunities(date_scanned DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_used ON content_opportunities(used);
CREATE INDEX IF NOT EXISTS idx_opportunities_priority ON content_opportunities(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_scan_history_date ON scan_history(scan_date DESC);
CREATE INDEX IF NOT EXISTS idx_generated_content_opportunity ON generated_content(opportunity_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to content_opportunities
CREATE TRIGGER update_content_opportunities_updated_at
    BEFORE UPDATE ON content_opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE content_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all data
CREATE POLICY "Allow authenticated users to read opportunities"
  ON content_opportunities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert opportunities"
  ON content_opportunities FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update opportunities"
  ON content_opportunities FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read scan history"
  ON scan_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert scan history"
  ON scan_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read generated content"
  ON generated_content FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert generated content"
  ON generated_content FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update generated content"
  ON generated_content FOR UPDATE
  TO authenticated
  USING (true);

-- Service role can do everything (bypass RLS)
-- This is handled automatically by Supabase

-- Comments for documentation
COMMENT ON TABLE content_opportunities IS 'Stores identified content opportunities from social media scans';
COMMENT ON TABLE scan_history IS 'Tracks history of scanning operations';
COMMENT ON TABLE generated_content IS 'Stores AI-generated content based on opportunities';
