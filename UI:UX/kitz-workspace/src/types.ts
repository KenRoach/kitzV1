export interface LogEntry {
  ts: number;
  agent: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

export type RunStatus = 'idle' | 'running' | 'awaiting_approval' | 'completed' | 'failed';
export type RunPhase = 'READ' | 'COMPREHEND' | 'BRAINSTORM' | 'EXECUTE' | 'VOICE' | 'DONE';

export interface Run {
  id: string;
  createdAt: number;
  status: RunStatus;
  goal: string;
  command: string;
  phase: RunPhase;
  risk: 'low' | 'medium' | 'high';
  costCredits: number;
  logs: LogEntry[];
  artifactId: string | null;
  artifactVersion: number;
  approvalAction?: string;
}

export type ArtifactType = 'flyer' | 'email_sequence' | 'audit' | 'waitlist' | 'landing' | 'sop';

export interface ArtifactBlock {
  id: string;
  type: 'heading' | 'subheading' | 'paragraph' | 'bullets' | 'cta' | 'image' | 'divider' | 'email';
  content: string;
  meta?: Record<string, string>;
}

export interface ArtifactVersion {
  version: number;
  createdAt: number;
  title: string;
  blocks: ArtifactBlock[];
  meta: { changeNote?: string; command?: string };
}

export interface Artifact {
  id: string;
  name: string;
  type: ArtifactType;
  versions: ArtifactVersion[];
  currentVersion: number;
}

export interface Battery {
  mode: 'unlimited' | 'metered';
  creditsRemaining: number;
  creditsUsedToday: number;
}
