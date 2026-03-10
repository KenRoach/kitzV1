-- Kitz Contact Registry — System-level contact tracking for onboarding, trials, and lifecycle.
-- Distinct from workspace CRM contacts (which are user-owned business contacts).
-- This table stores WhatsApp/email/web users who interact with Kitz itself.
-- Apply to kitz Supabase project via SQL Editor.

CREATE TABLE IF NOT EXISTS kitz_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT,
  email TEXT,
  name TEXT,
  business_name TEXT,
  business_type TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'onboarding', 'trial', 'active', 'expired')),
  onboarding_step TEXT NOT NULL DEFAULT 'welcome_sent' CHECK (onboarding_step IN ('welcome_sent', 'awaiting_name', 'awaiting_business', 'trial_started', 'complete')),
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email', 'web')),
  trial_started_at BIGINT,    -- unix ms
  trial_expires_at BIGINT,    -- unix ms
  trial_credits INT NOT NULL DEFAULT 0,
  paid_at BIGINT,             -- unix ms
  referred_by TEXT,
  total_messages INT NOT NULL DEFAULT 0,
  first_contact_at BIGINT NOT NULL,  -- unix ms
  last_contact_at BIGINT NOT NULL,   -- unix ms
  tags TEXT[] DEFAULT '{}',
  locale TEXT NOT NULL DEFAULT 'es',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup by phone (WhatsApp contacts)
CREATE UNIQUE INDEX IF NOT EXISTS idx_kitz_contacts_phone ON kitz_contacts(phone) WHERE phone IS NOT NULL;
-- Index for fast lookup by email
CREATE UNIQUE INDEX IF NOT EXISTS idx_kitz_contacts_email ON kitz_contacts(email) WHERE email IS NOT NULL;
-- Index for status queries (trial reminders, expired contacts)
CREATE INDEX IF NOT EXISTS idx_kitz_contacts_status ON kitz_contacts(status);
-- Index for trial expiry notifications
CREATE INDEX IF NOT EXISTS idx_kitz_contacts_trial ON kitz_contacts(status, trial_expires_at) WHERE status IN ('trial', 'expired');

-- Service-role bypass (kitz_os uses service_role key)
ALTER TABLE kitz_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY kitz_contacts_service ON kitz_contacts FOR ALL TO service_role USING (true) WITH CHECK (true);
