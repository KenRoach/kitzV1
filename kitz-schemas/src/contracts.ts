import { randomUUID } from 'node:crypto';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface EventEnvelope<T = unknown> {
  orgId: string;
  userId: string;
  source: string;
  event: string;
  payload: T;
  traceId: string;
  ts: string;
}

export interface ToolCallRequest<T = unknown> {
  name: string;
  input: T;
  riskLevel: RiskLevel;
  requiredScopes: string[];
  traceId: string;
}

export interface ToolCallResponse<T = unknown> {
  name: string;
  output: T;
  riskLevel: RiskLevel;
  requiredScopes: string[];
  traceId: string;
}

export interface StandardError {
  code: string;
  message: string;
  traceId: string;
}

export interface ApprovalRequest {
  orgId: string;
  action: string;
  reason: string;
  requesterUserId: string;
  traceId: string;
}

export interface ApprovalDecision {
  approvalId: string;
  orgId: string;
  approved: boolean;
  approverUserId: string;
  comment?: string;
  traceId: string;
}

export interface AIBatteryLedgerEntry {
  orgId: string;
  deltaCredits: number;
  reason: string;
  traceId: string;
  ts: string;
}

export interface CheckoutSession {
  orgId: string;
  orderId: string;
  amount: number;
  currency: string;
  mobileCheckoutLink: string;
  traceId: string;
}

// ── Payment Providers ──
export type PaymentProvider = 'stripe' | 'paypal' | 'yappy' | 'bac';
export type PaymentTransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface PaymentWebhookEvent {
  provider: PaymentProvider;
  eventType: string;
  sessionId: string;
  orgId: string;
  traceId: string;
  raw: unknown;
}

// Persistent payment transaction record
export interface PaymentTransaction {
  id: string;
  user_id: string;
  storefront_id?: string | null;
  order_id?: string | null;
  provider: PaymentProvider;
  provider_transaction_id: string;
  amount: number;
  currency: string;
  status: PaymentTransactionStatus;
  fiscal_invoice_id?: string | null;
  metadata: Record<string, unknown>;
  webhook_received_at: string;
  created_at: string;
}

// Normalized input for process_payment_webhook MCP tool
export interface ProcessPaymentWebhookInput {
  provider: PaymentProvider;
  provider_transaction_id: string;
  amount: number;
  currency: string;
  status: PaymentTransactionStatus;
  storefront_id?: string;
  buyer_name?: string;
  buyer_email?: string;
  buyer_phone?: string;
  metadata: Record<string, unknown>;
}

export const createTraceId = (): string => randomUUID();
export const nowIso = (): string => new Date().toISOString();

// ── AOS Agent Architecture Contracts (for cross-service consumption) ──

export type AgentTier = 'c-suite' | 'board' | 'governance' | 'external' | 'team' | 'guardian' | 'coach';

export type TeamName =
  | 'whatsapp-comms' | 'sales-crm' | 'marketing-growth' | 'growth-hacking'
  | 'education-onboarding' | 'customer-success' | 'content-brand'
  | 'platform-eng' | 'frontend' | 'backend' | 'devops-ci' | 'qa-testing'
  | 'ai-ml' | 'finance-billing' | 'legal-compliance' | 'strategy-intel'
  | 'governance-pmo' | 'coaches';

export type MessageChannel = 'intra-team' | 'cross-team' | 'escalation' | 'war-room' | 'broadcast';

export type MessagePriority = 'low' | 'normal' | 'high' | 'critical';

export interface TeamConfig {
  name: TeamName;
  displayName: string;
  lead: string;
  members: string[];
  description: string;
}

export interface GuardianScope {
  serviceDir: string;
  watchPatterns: string[];
}

export interface AgentMessage {
  id: string;
  type: string;
  source: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  payload: Record<string, unknown>;
  related_ids?: string[];
  target: string | string[];
  channel: MessageChannel;
  ttl: number;
  hops: string[];
  priority: MessagePriority;
  requiresAck: boolean;
  parentMessageId?: string;
}

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
