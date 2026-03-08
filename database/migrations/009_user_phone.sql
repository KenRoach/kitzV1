-- 009: Add phone + WhatsApp identity to users, magic-link token storage
-- Phase 1b of KITZ System Rewiring

-- Phone number (E.164 format, e.g. +50761234567)
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;

-- WhatsApp JID from Baileys (e.g. 50761234567@s.whatsapp.net)
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_jid TEXT;

-- Allow phone-only registration (WhatsApp login without email)
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- Update auth_provider constraint to include 'whatsapp' and 'magic-link'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_auth_provider_check;
ALTER TABLE users ADD CONSTRAINT users_auth_provider_check
  CHECK (auth_provider IN ('email', 'google', 'whatsapp', 'magic-link'));

-- Unique index on phone (partial — only non-null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone
  ON users (phone) WHERE phone IS NOT NULL;

-- Unique index on whatsapp_jid
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_whatsapp_jid
  ON users (whatsapp_jid) WHERE whatsapp_jid IS NOT NULL;

-- Magic-link tokens table for passwordless login
CREATE TABLE IF NOT EXISTS magic_link_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_token
  ON magic_link_tokens (token) WHERE used_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_phone
  ON magic_link_tokens (phone);
