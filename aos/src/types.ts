export type EventSeverity = 'low' | 'medium' | 'high' | 'critical';

// ── Agent Tiers ──

export type AgentTier =
  | 'c-suite'
  | 'board'
  | 'governance'
  | 'external'
  | 'team'
  | 'guardian'
  | 'coach';

// ── Team Names (18 operational teams) ──

export type TeamName =
  | 'whatsapp-comms'
  | 'sales-crm'
  | 'marketing-growth'
  | 'growth-hacking'
  | 'education-onboarding'
  | 'customer-success'
  | 'content-brand'
  | 'platform-eng'
  | 'frontend'
  | 'backend'
  | 'devops-ci'
  | 'qa-testing'
  | 'ai-ml'
  | 'finance-billing'
  | 'legal-compliance'
  | 'strategy-intel'
  | 'governance-pmo'
  | 'coaches';

// ── Message Types ──

export type AOSMessageType =
  // Existing
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
  // Guardian events
  | 'BUILD_HEALTH_DEGRADED'
  | 'TEST_REGRESSION_DETECTED'
  | 'DEPENDENCY_VULN_FOUND'
  | 'DOCS_STALE'
  | 'PERFORMANCE_DEGRADED'
  // Coaching events
  | 'AGENT_ACCURACY_LOW'
  | 'PLAYBOOK_STALE'
  | 'WORKFLOW_BOTTLENECK'
  | 'AGENT_RETRAIN_NEEDED'
  | 'PLAYBOOK_UPDATED'
  | 'ONBOARDING_FLOW_UPDATED'
  | 'PROCESS_IMPROVEMENT_PROPOSAL'
  // Finance events
  | 'BATTERY_BURN_ANOMALY'
  // DevOps events
  | 'DEPLOY_FAILED'
  | 'DEPLOY_COMPLETED'
  // War room events
  | 'WAR_ROOM_ACTIVATED'
  | 'WAR_ROOM_DISSOLVED'
  // PMO events
  | 'DAILY_STANDUP'
  | 'SPRINT_STARTED'
  | 'SPRINT_COMPLETED'
  // Repair events
  | 'REPAIR_COMPLETED'
  | 'REPAIR_NEEDS_HUMAN'
  // CTO digest
  | 'CTO_DIGEST'
  // Docs
  | 'DOCS_UPDATED'
  // Sales/CRM
  | 'LEAD_SCORED'
  | 'LEAD_STAGE_CHANGED'
  // Broadcast
  | 'KILL_SWITCH_ACTIVATED'
  | 'GOVERNANCE_POLICY_UPDATED'
  // Extensible
  | string;

// ── Communication Channels ──

export type MessageChannel =
  | 'intra-team'
  | 'cross-team'
  | 'escalation'
  | 'war-room'
  | 'broadcast';

export type MessagePriority = 'low' | 'normal' | 'high' | 'critical';

// ── Core Event ──

export interface AOSEvent {
  id: string;
  type: AOSMessageType;
  source: string;
  severity: EventSeverity;
  timestamp: string;
  payload: Record<string, unknown>;
  related_ids?: string[];
}

// ── Agent Message (extends AOSEvent with routing) ──

export interface AgentMessage extends AOSEvent {
  target: string | string[];
  channel: MessageChannel;
  ttl: number;
  hops: string[];
  priority: MessagePriority;
  requiresAck: boolean;
  parentMessageId?: string;
}

// ── Agent Config ──

export interface AgentConfig {
  name: string;
  role: string;
  tier: AgentTier;
  team?: TeamName;
  can_spawn_ad_hoc: boolean;
  max_ad_hoc: number;
  max_active_ad_hoc: number;
}

// ── Agent Status ──

export interface AgentStatus {
  name: string;
  team?: TeamName;
  tier: AgentTier;
  online: boolean;
  lastAction?: string;
  lastActionAt?: string;
  actionsToday: number;
}

// ── Guardian Scope ──

export interface GuardianScope {
  serviceDir: string;
  watchPatterns: string[];
}

// ── Team Config ──

export interface TeamConfig {
  name: TeamName;
  displayName: string;
  lead: string;
  members: string[];
  description: string;
}

// ── War Room ──

export interface WarRoomConfig {
  id: string;
  reason: string;
  participants: string[];
  activatedAt: string;
  ttlMs: number;
  status: 'active' | 'dissolved';
  dissolvedAt?: string;
  postMortem?: string;
}

// ── CTO Digest ──

export interface CTODigestEntry {
  category: 'auto_fixed' | 'recommendation' | 'escalation';
  agent: string;
  summary: string;
  eventId: string;
  timestamp: string;
}

export interface CTODigestPayload {
  period: string;
  autoFixed: CTODigestEntry[];
  recommendations: CTODigestEntry[];
  escalations: CTODigestEntry[];
  agentsOnline: number;
  agentsTotal: number;
  warRoomsActive: number;
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
