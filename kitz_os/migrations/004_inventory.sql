-- Migration 004: Inventory management tables
-- Products catalog with stock tracking, order line items, and checkout link → product binding.
-- Apply to workspace Supabase project via SQL Editor.

-- ── Products ──
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  org_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  cost NUMERIC(12,2) CHECK (cost >= 0),
  sku TEXT,
  stock_qty INTEGER NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  category TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_user ON products(user_id);
CREATE INDEX idx_products_sku ON products(user_id, sku);
CREATE INDEX idx_products_category ON products(user_id, category);

-- ── Order Items (line items per order) ──
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  subtotal NUMERIC(12,2) GENERATED ALWAYS AS (unit_price * quantity) STORED
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- ── Checkout link → product binding ──
ALTER TABLE checkout_links ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;

-- ── Low-stock view ──
CREATE OR REPLACE VIEW products_low_stock AS
  SELECT * FROM products
  WHERE stock_qty <= low_stock_threshold
    AND is_active = true;

-- ── RLS ──
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Users own their rows
CREATE POLICY products_user ON products FOR ALL USING (auth.uid() = user_id);
CREATE POLICY order_items_user ON order_items FOR ALL USING (auth.uid() = user_id);

-- Service-role bypass (AI agent / MCP via GOD_MODE_USER_ID)
CREATE POLICY products_service ON products FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY order_items_service ON order_items FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── updated_at trigger (reuse pattern from 002) ──
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
