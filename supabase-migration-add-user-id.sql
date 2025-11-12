-- Migration: Add user_id to content_opportunities and update RLS policies
-- Run this in your Supabase SQL Editor to add authentication support

-- Add user_id column to content_opportunities
ALTER TABLE content_opportunities
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_opportunities_user_id ON content_opportunities(user_id);

-- Add user_id column to generated_content
ALTER TABLE generated_content
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for user_id lookups on generated_content
CREATE INDEX IF NOT EXISTS idx_generated_content_user_id ON generated_content(user_id);

-- Drop old RLS policies
DROP POLICY IF EXISTS "Allow authenticated users to read opportunities" ON content_opportunities;
DROP POLICY IF EXISTS "Allow authenticated users to insert opportunities" ON content_opportunities;
DROP POLICY IF EXISTS "Allow authenticated users to update opportunities" ON content_opportunities;
DROP POLICY IF EXISTS "Allow authenticated users to read generated content" ON generated_content;
DROP POLICY IF EXISTS "Allow authenticated users to insert generated content" ON generated_content;
DROP POLICY IF EXISTS "Allow authenticated users to update generated content" ON generated_content;

-- Create new RLS policies with user_id filtering

-- Content Opportunities: Users can only see their own opportunities
CREATE POLICY "Users can read own opportunities"
  ON content_opportunities FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Content Opportunities: Users can insert their own opportunities
CREATE POLICY "Users can insert own opportunities"
  ON content_opportunities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Content Opportunities: Users can update their own opportunities
CREATE POLICY "Users can update own opportunities"
  ON content_opportunities FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Content Opportunities: Users can delete their own opportunities
CREATE POLICY "Users can delete own opportunities"
  ON content_opportunities FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Scan History: Users can only see their own scan history
CREATE POLICY "Users can read own scan history"
  ON scan_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Scan History: Users can insert their own scan history
CREATE POLICY "Users can insert own scan history"
  ON scan_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Generated Content: Users can only see their own generated content
CREATE POLICY "Users can read own generated content"
  ON generated_content FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Generated Content: Users can insert their own generated content
CREATE POLICY "Users can insert own generated content"
  ON generated_content FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Generated Content: Users can update their own generated content
CREATE POLICY "Users can update own generated content"
  ON generated_content FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Generated Content: Users can delete their own generated content
CREATE POLICY "Users can delete own generated content"
  ON generated_content FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Update existing records to have null user_id (for migration)
-- Note: In production, you may want to assign these to a specific user
-- or delete them before applying this migration

COMMENT ON COLUMN content_opportunities.user_id IS 'Owner of this opportunity (references auth.users)';
COMMENT ON COLUMN generated_content.user_id IS 'Owner of this generated content (references auth.users)';
