-- Conversations Schema for Content Predator
-- Adds Notion-like conversation history and recall

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'Untitled Conversation',
  description TEXT,
  icon TEXT DEFAULT '💬',

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Organization
  favorite BOOLEAN DEFAULT FALSE,
  archived BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',

  -- Conversation stats
  message_count INTEGER DEFAULT 0,

  -- User/workspace (for future multi-user support)
  user_id UUID,
  workspace_id UUID,

  -- Ordering
  position INTEGER DEFAULT 0
);

-- Create conversation_messages table
CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

  -- Message content
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'generated_content', 'critique', 'opportunity')),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  edited_at TIMESTAMP WITH TIME ZONE,

  -- Related entities
  opportunity_id UUID REFERENCES content_opportunities(id) ON DELETE SET NULL,
  generated_content_id UUID REFERENCES generated_content(id) ON DELETE SET NULL,

  -- Message metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Ordering within conversation
  position INTEGER NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_archived ON conversations(archived, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_favorite ON conversations(favorite, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_tags ON conversations USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON conversation_messages(conversation_id, position);
CREATE INDEX IF NOT EXISTS idx_messages_created ON conversation_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_opportunity ON conversation_messages(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_messages_generated ON conversation_messages(generated_content_id);

-- Create trigger to update conversation updated_at and message_count
CREATE OR REPLACE FUNCTION update_conversation_metadata()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE conversations
    SET
      updated_at = NOW(),
      last_message_at = NOW(),
      message_count = message_count + 1
    WHERE id = NEW.conversation_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE conversations
    SET
      updated_at = NOW(),
      message_count = GREATEST(message_count - 1, 0)
    WHERE id = OLD.conversation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_metadata
AFTER INSERT OR DELETE ON conversation_messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_metadata();

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_conversations_updated_at
BEFORE UPDATE ON conversations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Allow all operations on conversations for authenticated users"
  ON conversations FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for conversation_messages
CREATE POLICY "Allow all operations on conversation_messages for authenticated users"
  ON conversation_messages FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create view for conversation list with latest message preview
CREATE OR REPLACE VIEW conversation_list_view AS
SELECT
  c.id,
  c.title,
  c.description,
  c.icon,
  c.created_at,
  c.updated_at,
  c.last_message_at,
  c.favorite,
  c.archived,
  c.tags,
  c.message_count,
  c.position,
  cm.content AS last_message_preview
FROM conversations c
LEFT JOIN LATERAL (
  SELECT content
  FROM conversation_messages
  WHERE conversation_id = c.id
  ORDER BY position DESC
  LIMIT 1
) cm ON true
ORDER BY c.updated_at DESC;

-- Insert sample conversation for demo
INSERT INTO conversations (title, icon, description, tags)
VALUES
  ('Content Strategy Discussion', '🎯', 'Planning viral content opportunities', ARRAY['strategy', 'planning']),
  ('Email Campaign Ideas', '📧', 'Brainstorming email sequences', ARRAY['email', 'marketing'])
ON CONFLICT DO NOTHING;
