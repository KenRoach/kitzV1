-- Agent audit log — tracks all AI spend, tool invocations, and agent actions.
-- Used by kitz_os/src/aiBattery.ts for credit tracking and restore-on-boot.

CREATE TABLE IF NOT EXISTS agent_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  agent_type TEXT NOT NULL DEFAULT 'system',
  action TEXT NOT NULL,
  tool_name TEXT DEFAULT '',
  args JSONB DEFAULT '{}',
  result_summary TEXT DEFAULT '',
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  trace_id TEXT DEFAULT '',
  credits_consumed NUMERIC(8,4) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_business_action ON agent_audit_log (business_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_business_created ON agent_audit_log (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_trace ON agent_audit_log (trace_id);

-- Activity log — general activity feed for workspace UI.
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT DEFAULT '',
  entity_id TEXT DEFAULT '',
  detail JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log (user_id, created_at DESC);
