export type EventSeverity = 'low' | 'medium' | 'high' | 'critical';

export type AOSMessageType =
  | 'KPI_CHANGED'
  | 'CUSTOMER_FEEDBACK_RECEIVED'
  | 'BUG_REPORTED'
  | 'INCIDENT_DETECTED'
  | 'PR_READY_FOR_REVIEW'
  | 'ORG_DIGEST_READY'
  | 'LAUNCH_REVIEW_REQUESTED'
  | 'LAUNCH_REVIEW_SUBMITTED'
  | 'LAUNCH_APPROVED'
  | 'LAUNCH_BLOCKED'
  | 'INVITE_DRAFT_CREATED'
  | 'REVENUE_EVENT'
  | 'USER_ACTIVATION_STAGE'
  | string;

export interface AOSEvent {
  id: string;
  type: AOSMessageType;
  source: string;
  severity: EventSeverity;
  timestamp: string;
  payload: Record<string, unknown>;
  related_ids?: string[];
}

export interface AgentConfig {
  name: string;
  role: string;
  tier: 'c-suite' | 'board' | 'governance' | 'external';
  can_spawn_ad_hoc: boolean;
  max_ad_hoc: number;
  max_active_ad_hoc: number;
}

export interface ProposalRecord {
  owner: string;
  issueId: string;
  proposal: Record<string, unknown>;
  timestamp: string;
}

export interface TaskArtifact {
  id: string;
  title: string;
  owner_agent: string;
  status: 'open' | 'in_progress' | 'blocked' | 'done';
  created_at: string;
  related_event_ids: string[];
}

export interface ProposalArtifact {
  id: string;
  task_id: string;
  owner_agent: string;
  summary: string;
  risk: 'low' | 'medium' | 'high';
  created_at: string;
  related_event_ids: string[];
}

export interface DecisionArtifact {
  id: string;
  proposal_id: string;
  decision: 'approved' | 'rejected' | 'needs_changes';
  decided_by: string;
  rationale: string;
  created_at: string;
  related_event_ids: string[];
}

export interface OutcomeArtifact {
  id: string;
  decision_id: string;
  owner_agent: string;
  outcome: string;
  kpi_impact?: string;
  created_at: string;
  related_event_ids: string[];
}

export type LedgerArtifact =
  | { kind: 'task'; data: TaskArtifact }
  | { kind: 'proposal'; data: ProposalArtifact }
  | { kind: 'decision'; data: DecisionArtifact }
  | { kind: 'outcome'; data: OutcomeArtifact };

// ── Launch Review Protocol ──

export type LaunchVote = 'go' | 'no-go' | 'conditional';

export interface LaunchReview {
  agent: string;
  role: string;
  vote: LaunchVote;
  confidence: number;
  blockers: string[];
  warnings: string[];
  passed: string[];
  summary: string;
}

export interface LaunchContext {
  killSwitch: boolean;
  toolCount: number;
  systemStatus: string;
  aiKeysConfigured: boolean;
  batteryRemaining: number;
  batteryDailyLimit: number;
  batteryDepleted: boolean;
  servicesHealthy: string[];
  servicesDown: string[];
  campaignProfileCount: number;
  campaignTemplateLanguages: string[];
  draftFirstEnforced: boolean;
  webhookCryptoEnabled: boolean;
  rateLimitingEnabled: boolean;
  jwtAuthEnabled: boolean;
  semanticRouterActive: boolean;
  whatsappConnectorConfigured: boolean;
  workspaceMcpConfigured: boolean;
  cadenceEngineEnabled: boolean;
  funnelStagesDefined: number;
  activationTargetMinutes: number;
  pricingTiersDefined: number;
  freeToPathDefined: boolean;
}

export interface LaunchDecision {
  approved: boolean;
  decidedBy: string;
  timestamp: string;
  reviews: LaunchReview[];
  totalGo: number;
  totalNoGo: number;
  totalConditional: number;
  blockers: string[];
  summary: string;
}
