-- Payment Transactions table
-- Stores every incoming payment confirmation from any provider.
-- Apply to workspace Supabase project (mqkjbejuuedauygeccbj) via SQL Editor.
--
-- KITZ OS receive-only policy: only incoming payments are recorded.
-- amount CHECK > 0 enforces this at the DB level.

CREATE TABLE IF NOT EXISTS payment_transactions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL,
  storefront_id           UUID,
  order_id                UUID,
  provider                TEXT NOT NULL CHECK (provider IN ('stripe','paypal','yappy','bac')),
  provider_transaction_id TEXT NOT NULL,
  amount                  NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency                TEXT NOT NULL DEFAULT 'USD',
  status                  TEXT NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','completed','failed','refunded')),
  fiscal_invoice_id       TEXT,
  metadata                JSONB NOT NULL DEFAULT '{}',
  webhook_received_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Idempotency: same provider + transaction ID = unique (prevents duplicate processing)
CREATE UNIQUE INDEX IF NOT EXISTS idx_pt_idempotent
  ON payment_transactions (provider, provider_transaction_id);

-- Query indexes
CREATE INDEX IF NOT EXISTS idx_pt_status ON payment_transactions (status);
CREATE INDEX IF NOT EXISTS idx_pt_provider ON payment_transactions (provider);
CREATE INDEX IF NOT EXISTS idx_pt_created ON payment_transactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pt_storefront
  ON payment_transactions (storefront_id) WHERE storefront_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pt_order
  ON payment_transactions (order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pt_user ON payment_transactions (user_id);

-- RLS: service role can do everything (MCP server uses service role key)
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY pt_service_all ON payment_transactions
  FOR ALL USING (true);
