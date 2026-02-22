-- Migration 003: Strengthen RLS with org-level isolation
--
-- Problem: Current RLS uses auth.uid() = user_id which gives per-user isolation.
-- But Kitz is multi-tenant: each user belongs to an org, and future features
-- (team members, shared dashboards) need org-level isolation.
--
-- This migration adds org_id columns and org-scoped RLS policies alongside
-- the existing user-level policies for defense-in-depth.

-- Step 1: Add org_id column to all workspace tables (nullable for backwards compat)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE checkout_links ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE ai_battery_usage ADD COLUMN IF NOT EXISTS org_id UUID;

-- Step 2: Create indexes for org-scoped queries
CREATE INDEX IF NOT EXISTS idx_contacts_org ON contacts(org_id);
CREATE INDEX IF NOT EXISTS idx_orders_org ON orders(org_id);
CREATE INDEX IF NOT EXISTS idx_checkout_org ON checkout_links(org_id);
CREATE INDEX IF NOT EXISTS idx_tasks_org ON tasks(org_id);
CREATE INDEX IF NOT EXISTS idx_battery_org ON ai_battery_usage(org_id);

-- Step 3: Add org-scoped RLS policies (defense-in-depth alongside user policies)
-- These use a custom claim: auth.jwt() ->> 'org_id' that must match the row's org_id.
-- When org_id IS NULL (legacy rows), user-level policy still applies.

-- Contacts: user owns OR belongs to same org
CREATE POLICY contacts_org ON contacts FOR ALL
  USING (
    auth.uid() = user_id
    OR (org_id IS NOT NULL AND org_id::text = (auth.jwt() ->> 'org_id'))
  )
  WITH CHECK (
    auth.uid() = user_id
    OR (org_id IS NOT NULL AND org_id::text = (auth.jwt() ->> 'org_id'))
  );

-- Orders: user owns OR belongs to same org
CREATE POLICY orders_org ON orders FOR ALL
  USING (
    auth.uid() = user_id
    OR (org_id IS NOT NULL AND org_id::text = (auth.jwt() ->> 'org_id'))
  )
  WITH CHECK (
    auth.uid() = user_id
    OR (org_id IS NOT NULL AND org_id::text = (auth.jwt() ->> 'org_id'))
  );

-- Checkout links: user owns OR belongs to same org
CREATE POLICY checkout_links_org ON checkout_links FOR ALL
  USING (
    auth.uid() = user_id
    OR (org_id IS NOT NULL AND org_id::text = (auth.jwt() ->> 'org_id'))
  )
  WITH CHECK (
    auth.uid() = user_id
    OR (org_id IS NOT NULL AND org_id::text = (auth.jwt() ->> 'org_id'))
  );

-- Tasks: user owns OR belongs to same org
CREATE POLICY tasks_org ON tasks FOR ALL
  USING (
    auth.uid() = user_id
    OR (org_id IS NOT NULL AND org_id::text = (auth.jwt() ->> 'org_id'))
  )
  WITH CHECK (
    auth.uid() = user_id
    OR (org_id IS NOT NULL AND org_id::text = (auth.jwt() ->> 'org_id'))
  );

-- AI Battery: user owns OR belongs to same org
CREATE POLICY battery_org ON ai_battery_usage FOR ALL
  USING (
    auth.uid() = user_id
    OR (org_id IS NOT NULL AND org_id::text = (auth.jwt() ->> 'org_id'))
  )
  WITH CHECK (
    auth.uid() = user_id
    OR (org_id IS NOT NULL AND org_id::text = (auth.jwt() ->> 'org_id'))
  );

-- Step 4: Verification query — run to confirm all policies are active
-- SELECT tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
