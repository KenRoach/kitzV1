-- ══════════════════════════════════════════════════════════
-- Phase 11: Admin Assistant + Delete Approvals
-- ══════════════════════════════════════════════════════════

-- Pending approvals table for email-gated deletes
CREATE TABLE IF NOT EXISTS public.pending_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL DEFAULT 'delete',
  requested_by TEXT,
  approval_token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','expired')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  approved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pending_approvals_token ON public.pending_approvals(approval_token);
CREATE INDEX IF NOT EXISTS idx_pending_approvals_business ON public.pending_approvals(business_id, created_at DESC);
