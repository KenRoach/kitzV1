-- Service persistence tables — backs the in-memory fallback stores that each
-- service uses when DATABASE_URL is configured.  All tables use IF NOT EXISTS
-- for idempotency.

-- ── Notification Jobs (kitz-notifications-queue) ──

CREATE TABLE IF NOT EXISTS notification_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT UNIQUE,
  channel         TEXT NOT NULL DEFAULT '',
  draft_only      BOOLEAN NOT NULL DEFAULT true,
  org_id          UUID,
  trace_id        TEXT DEFAULT '',
  payload         JSONB DEFAULT '{}',
  attempts        INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'queued'
                    CHECK (status IN ('queued', 'delivered', 'dead_letter')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_jobs_status
  ON notification_jobs (status);
CREATE INDEX IF NOT EXISTS idx_notification_jobs_org
  ON notification_jobs (org_id);

-- ── Email Templates (kitz-email-connector) ──

CREATE TABLE IF NOT EXISTS email_templates (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID NOT NULL,
  name       TEXT NOT NULL,
  content    TEXT DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, name)
);

CREATE INDEX IF NOT EXISTS idx_email_templates_org
  ON email_templates (org_id);

-- ── Email Consent (kitz-email-connector) ──

CREATE TABLE IF NOT EXISTS email_consent (
  contact    TEXT PRIMARY KEY,
  granted    BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Email Suppression (kitz-email-connector) ──

CREATE TABLE IF NOT EXISTS email_suppression (
  email         TEXT PRIMARY KEY,
  suppressed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Activity Logs (engine/logs-api) ──
-- Distinct from activity_log (singular, 004_logs.sql) which tracks per-user
-- workspace actions with a user_id FK.  This table stores the service-level
-- activity feed with actor flattening used by the logs-api service.

CREATE TABLE IF NOT EXISTS activity_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type           TEXT DEFAULT '',
  actor_name     TEXT DEFAULT '',
  actor_is_agent BOOLEAN DEFAULT false,
  action         TEXT NOT NULL,
  detail         TEXT DEFAULT '',
  timestamp      TIMESTAMPTZ NOT NULL DEFAULT now(),
  trace_id       TEXT DEFAULT '',
  status         TEXT DEFAULT 'pending',
  meta           JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_type
  ON activity_logs (type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp
  ON activity_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_trace
  ON activity_logs (trace_id);

-- ── Comms Log (engine/comms-api) ──

CREATE TABLE IF NOT EXISTS comms_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel      TEXT NOT NULL,
  to_addr      TEXT NOT NULL,
  message      TEXT DEFAULT '',
  subject      TEXT,
  status       TEXT NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft', 'approved', 'sent', 'failed')),
  provider     TEXT DEFAULT '',
  provider_sid TEXT,
  org_id       UUID,
  trace_id     TEXT DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comms_log_org
  ON comms_log (org_id);
CREATE INDEX IF NOT EXISTS idx_comms_log_status
  ON comms_log (status);
CREATE INDEX IF NOT EXISTS idx_comms_log_trace
  ON comms_log (trace_id);

-- ── Content Templates (kitz-services) ──

CREATE TABLE IF NOT EXISTS content_templates (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID NOT NULL,
  kind       TEXT NOT NULL DEFAULT 'email'
               CHECK (kind IN ('whatsapp', 'email', 'social', 'promo')),
  name       TEXT NOT NULL,
  content    TEXT DEFAULT '',
  language   TEXT DEFAULT 'es',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_templates_org
  ON content_templates (org_id);
CREATE INDEX IF NOT EXISTS idx_content_templates_kind
  ON content_templates (org_id, kind);

-- ── Team Members (safety net — 002 may already be marked applied) ──

CREATE TABLE IF NOT EXISTS team_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'member',
  invited_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_team_members_org
  ON team_members (org_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user
  ON team_members (user_id);

-- ── Missing FK: checkout_links.product_id → products(id) ──

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_checkout_links_product'
      AND table_name = 'checkout_links'
  ) THEN
    ALTER TABLE checkout_links
      ADD CONSTRAINT fk_checkout_links_product
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
  END IF;
END
$$;
