export type EventSeverity = 'low' | 'medium' | 'high' | 'critical';

export type AOSMessageType =
  | 'KPI_CHANGED'
  | 'CUSTOMER_FEEDBACK_RECEIVED'
  | 'BUG_REPORTED'
  | 'INCIDENT_DETECTED'
  | 'PR_READY_FOR_REVIEW'
  | 'ORG_DIGEST_READY'
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
