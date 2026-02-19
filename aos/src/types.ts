export type EventSeverity = 'low' | 'medium' | 'high' | 'critical';

export type EventType =
  | 'KPI_CHANGED'
  | 'CUSTOMER_FEEDBACK_RECEIVED'
  | 'BUG_REPORTED'
  | 'INCIDENT_DETECTED'
  | 'PR_OPENED'
  | 'PR_READY_FOR_REVIEW'
  | 'REVIEW_REJECTED'
  | 'COMPLIANCE_UPDATE_FOUND'
  | 'COST_SPIKE_DETECTED'
  | 'ROADMAP_CHANGE_PROPOSED'
  | 'CAPITAL_ALLOCATION_CYCLE'
  | 'BOARD_REVIEW_REQUESTED'
  | 'ORG_DIGEST_READY'
  | 'EXTERNAL_AUDIT_REPORT_READY'
  | 'BOARD_REVIEW_COMPLETE'
  | 'PROPOSAL_CREATED';

export interface AOSEvent {
  id: string;
  type: EventType | string;
  source: string;
  severity: EventSeverity;
  timestamp: string;
  payload: Record<string, unknown>;
  requires_review?: boolean;
  related_ids?: string[];
  alignmentWarnings?: string[];
}

export interface AgentConfig {
  name: string;
  role: string;
  reports_to?: string;
  owns: string[];
  triggers: string[];
  allowed_actions: string[];
  can_spawn_ad_hoc: boolean;
  max_ad_hoc: number;
  max_active_ad_hoc: number;
  approval_required: string[];
}

export interface ProposalRecord {
  owner: string;
  issueId: string;
  proposal: Record<string, unknown>;
  timestamp: string;
}
