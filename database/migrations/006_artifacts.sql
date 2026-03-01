-- Artifact persistence — stores generated code, documents, tools, and migrations.
-- Used by kitz_os/src/tools/artifactTools.ts for persistent artifact storage.

CREATE TABLE IF NOT EXISTS artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  artifact_type TEXT NOT NULL CHECK (artifact_type IN ('code', 'document', 'tool', 'migration', 'other')),
  name TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  file_path TEXT DEFAULT '',
  language TEXT DEFAULT '',
  trace_id TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_artifacts_business ON artifacts (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_artifacts_type ON artifacts (business_id, artifact_type);
