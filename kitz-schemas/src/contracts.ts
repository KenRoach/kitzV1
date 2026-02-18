
export type RiskLevel = 'low' | 'medium' | 'high';

export interface EventEnvelope<T = unknown> { orgId: string; userId: string; source: string; event: string; payload: T; traceId: string; ts: string; }
export interface ToolCallRequest<T = unknown> { name: string; input: T; output?: never; riskLevel: RiskLevel; requiredScopes: string[]; traceId: string; }
export interface ToolCallResponse<T = unknown> { name: string; input?: never; output: T; riskLevel: RiskLevel; requiredScopes: string[]; traceId: string; }
export interface StandardError { code: string; message: string; traceId: string; }
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ApprovalRequest {
  approvalId?: string;
  orgId: string;
  userId: string;
  toolName: string;
  action: string;
  reason?: string;
  status: ApprovalStatus;
  traceId: string;
  createdAt?: string;
  updatedAt?: string;
  reviewerUserId?: string;
  decisionComment?: string;
}
export interface ApprovalDecision { approvalId: string; orgId: string; approved: boolean; approverUserId: string; comment?: string; traceId: string; }
export interface AIBatteryLedgerEntry { orgId: string; deltaCredits: number; reason: string; traceId: string; ts: string; }
export interface CheckoutSession { orgId: string; orderId: string; amount: number; currency: string; mobileCheckoutLink: string; traceId: string; }
export interface PaymentWebhookEvent { provider: 'stripe' | 'local'; eventType: string; sessionId: string; orgId: string; traceId: string; raw: unknown; }
