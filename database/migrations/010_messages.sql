-- 010: Unified messages table — all channels in one place
-- Phase 2a of KITZ System Rewiring
--
-- WhatsApp, email, SMS, web chat, voice — every message lands here.
-- Replaces: kitz_os JSONL files, WA connector in-memory store,
--           workspace Supabase scattered inserts.

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  org_id UUID,

  -- Channel metadata
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email', 'sms', 'web', 'voice', 'instagram', 'messenger')),
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),

  -- Participants (channel-specific identifiers)
  sender_id TEXT,        -- e.g. WhatsApp JID, email address, phone number
  recipient_id TEXT,     -- e.g. WhatsApp JID, email address, phone number

  -- Content
  content TEXT NOT NULL DEFAULT '',
  media_type TEXT,       -- e.g. 'image/jpeg', 'audio/ogg', 'application/pdf'
  media_url TEXT,        -- S3/Supabase storage URL

  -- Threading
  thread_id TEXT,        -- conversation thread identifier
  parent_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,

  -- Tracing
  trace_id TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'queued', 'draft', 'sent', 'delivered', 'read', 'failed')),

  -- Extensible metadata (channel-specific fields, read receipts, etc.)
  metadata JSONB NOT NULL DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Query patterns: inbox by user, by channel, by thread
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_org_id ON messages (org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_channel ON messages (channel, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages (thread_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages (recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_trace_id ON messages (trace_id);
