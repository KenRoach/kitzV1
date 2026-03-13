-- 011: Conversation messages — AI memory persistence layer
-- Migrates kitz_os in-memory conversations to Supabase.
--
-- This table serves the AI semantic router and memory manager.
-- It stores conversation turns (user + assistant messages) per
-- user/sender pair, optimized for fast context window retrieval.
--
-- Separate from `messages` (unified inbox): this table is AI-scoped,
-- stores role-based turns, and supports the 3-strategy lookup pattern.

CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity: who is talking
  user_id TEXT NOT NULL,          -- kitz user ID (may be 'dev', UUID, etc.)
  sender_jid TEXT NOT NULL,       -- WhatsApp JID or email address
  channel TEXT NOT NULL DEFAULT 'whatsapp'
    CHECK (channel IN ('whatsapp', 'email', 'web', 'terminal')),

  -- Turn data
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL DEFAULT '',
  trace_id TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Primary query: context window by user + sender (most common)
CREATE INDEX IF NOT EXISTS idx_convo_user_sender
  ON conversation_messages (user_id, sender_jid, created_at DESC);

-- Strategy 2: lookup by sender_jid alone (cross-userId recovery)
CREATE INDEX IF NOT EXISTS idx_convo_sender_jid
  ON conversation_messages (sender_jid, created_at DESC);

-- Strategy 3: lookup by user_id alone (unknown senderJid recovery)
CREATE INDEX IF NOT EXISTS idx_convo_user_id
  ON conversation_messages (user_id, created_at DESC);

-- Full-text search on content for memory_search_conversations
CREATE INDEX IF NOT EXISTS idx_convo_content_fts
  ON conversation_messages USING gin (to_tsvector('spanish', content));

-- Prune old messages via created_at
CREATE INDEX IF NOT EXISTS idx_convo_created_at
  ON conversation_messages (created_at);
