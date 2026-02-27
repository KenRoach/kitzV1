-- Skills table — registry of agent skills available in KITZ brain
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '0.1.0',
  tier TEXT NOT NULL DEFAULT 'haiku' CHECK (tier IN ('haiku', 'sonnet', 'opus')),
  credits_per_use NUMERIC(6,2) NOT NULL DEFAULT 0.5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
CREATE INDEX IF NOT EXISTS idx_skills_active ON skills(is_active) WHERE is_active = true;
