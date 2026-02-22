-- workspace.kitz.services core tables
-- Apply to xyz88-io Supabase project (mqkjbejuuedauygeccbj) via SQL Editor.

-- Contacts (CRM)
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'lead' CHECK (status IN ('active', 'inactive', 'lead')),
  tags TEXT[] DEFAULT '{}',
  lead_score TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contacts_user ON contacts(user_id);
CREATE INDEX idx_contacts_status ON contacts(user_id, status);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  contact_id UUID REFERENCES contacts(id),
  total NUMERIC(12,2) NOT NULL CHECK (total >= 0),
  subtotal NUMERIC(12,2),
  description TEXT,
  notes TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  fulfillment_status TEXT NOT NULL DEFAULT 'pending' CHECK (fulfillment_status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  payment_method TEXT,
  channel TEXT,
  delivery_tracking TEXT,
  delivery_provider TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_contact ON orders(contact_id);
CREATE INDEX idx_orders_payment ON orders(user_id, payment_status);

-- Checkout Links (Storefronts)
CREATE TABLE IF NOT EXISTS checkout_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  order_id UUID REFERENCES orders(id),
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  buyer_name TEXT,
  buyer_phone TEXT,
  buyer_email TEXT,
  short_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_checkout_user ON checkout_links(user_id);
CREATE INDEX idx_checkout_status ON checkout_links(user_id, status);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'done')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_user ON tasks(user_id);

-- AI Battery Usage
CREATE TABLE IF NOT EXISTS ai_battery_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  credits_used NUMERIC(6,2) NOT NULL CHECK (credits_used > 0),
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_battery_user ON ai_battery_usage(user_id);

-- RLS: users only see their own data
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkout_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_battery_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY contacts_user ON contacts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY orders_user ON orders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY checkout_links_user ON checkout_links FOR ALL USING (auth.uid() = user_id);
CREATE POLICY tasks_user ON tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY battery_user ON ai_battery_usage FOR ALL USING (auth.uid() = user_id);

-- Service-role bypass (for AI agent / MCP access via GOD_MODE_USER_ID)
CREATE POLICY contacts_service ON contacts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY orders_service ON orders FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY checkout_service ON checkout_links FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY tasks_service ON tasks FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY battery_service ON ai_battery_usage FOR ALL TO service_role USING (true) WITH CHECK (true);
