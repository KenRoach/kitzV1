/**
 * Approval Matrix — Multi-channel human approval system for critical actions.
 *
 * Every action KITZ takes is classified into a risk tier:
 *
 *   LOW       → Execute immediately, no approval needed (read operations, lookups)
 *   MEDIUM    → Draft-first: show user what will happen, require "approve" to execute
 *   HIGH      → Requires explicit approval + confirmation on originating channel
 *   CRITICAL  → Requires approval on 2 channels (e.g., WhatsApp approve + email confirm)
 *   BLOCKED   → Never executed by AI (outbound payments, refunds, account deletion)
 *
 * Approval can come from any channel: WhatsApp ("aprobar"), Email (reply "approve"),
 * or Workspace (click "Approve" button).
 */

import type { OutputChannel } from 'kitz-schemas';

// ── Risk Tiers ──

export type RiskTier = 'low' | 'medium' | 'high' | 'critical' | 'blocked';

export interface ApprovalRule {
  /** Tool name or pattern */
  tool: string;
  /** Risk classification */
  risk: RiskTier;
  /** Human-readable description of what this action does */
  description: string;
  /** Category for grouping in UI */
  category: string;
  /** Minimum channels that must approve (1 = any single channel, 2 = dual-channel confirmation) */
  minApprovalChannels: number;
  /** Whether this action can be auto-approved after N minutes of no rejection */
  autoApproveAfterMinutes?: number;
  /** Whether to notify all channels when this action is pending */
  notifyAllChannels: boolean;
  /** Specific channels that CAN approve (empty = any channel) */
  allowedApprovalChannels: OutputChannel[];
}

// ── The Approval Matrix ──

export const APPROVAL_MATRIX: ApprovalRule[] = [
  // ── BLOCKED: Never executed by AI ──
  { tool: 'payments_sendOutbound',   risk: 'blocked',  description: 'Send money outbound',                 category: 'payments',    minApprovalChannels: 0, notifyAllChannels: false, allowedApprovalChannels: [] },
  { tool: 'refunds_create',          risk: 'blocked',  description: 'Issue a refund',                      category: 'payments',    minApprovalChannels: 0, notifyAllChannels: false, allowedApprovalChannels: [] },
  { tool: 'account_delete',          risk: 'blocked',  description: 'Delete user account',                 category: 'admin',       minApprovalChannels: 0, notifyAllChannels: false, allowedApprovalChannels: [] },
  { tool: 'data_export_all',         risk: 'blocked',  description: 'Export all business data',             category: 'admin',       minApprovalChannels: 0, notifyAllChannels: false, allowedApprovalChannels: [] },

  // ── CRITICAL: Dual-channel approval (2 channels must confirm) ──
  { tool: 'broadcast_send',          risk: 'critical', description: 'Send bulk message to multiple contacts', category: 'outbound',  minApprovalChannels: 2, notifyAllChannels: true,  allowedApprovalChannels: ['whatsapp', 'web', 'email'] },
  { tool: 'pricing_change',          risk: 'critical', description: 'Change product/service pricing',         category: 'business',  minApprovalChannels: 2, notifyAllChannels: true,  allowedApprovalChannels: ['whatsapp', 'web', 'email'] },
  { tool: 'country_configure',       risk: 'critical', description: 'Change country/tax/compliance config',   category: 'admin',     minApprovalChannels: 2, notifyAllChannels: true,  allowedApprovalChannels: ['whatsapp', 'web', 'email'] },
  { tool: 'autoreply_set',           risk: 'critical', description: 'Change auto-reply rules (affects all inbound)', category: 'config', minApprovalChannels: 2, notifyAllChannels: true, allowedApprovalChannels: ['whatsapp', 'web'] },

  // ── HIGH: Single-channel approval + notify other channels ──
  { tool: 'outbound_sendWhatsApp',   risk: 'high',    description: 'Send WhatsApp message to customer',     category: 'outbound',    minApprovalChannels: 1, notifyAllChannels: true,  allowedApprovalChannels: ['whatsapp', 'web', 'email'] },
  { tool: 'outbound_sendEmail',      risk: 'high',    description: 'Send email to customer',                category: 'outbound',    minApprovalChannels: 1, notifyAllChannels: true,  allowedApprovalChannels: ['whatsapp', 'web', 'email'] },
  { tool: 'outbound_sendSMS',        risk: 'high',    description: 'Send SMS to customer',                  category: 'outbound',    minApprovalChannels: 1, notifyAllChannels: true,  allowedApprovalChannels: ['whatsapp', 'web', 'email'] },
  { tool: 'outbound_sendVoiceNote',  risk: 'high',    description: 'Send voice note to customer',           category: 'outbound',    minApprovalChannels: 1, notifyAllChannels: true,  allowedApprovalChannels: ['whatsapp', 'web'] },
  { tool: 'outbound_makeCall',       risk: 'high',    description: 'Initiate voice call to customer',       category: 'outbound',    minApprovalChannels: 1, notifyAllChannels: true,  allowedApprovalChannels: ['whatsapp', 'web'] },
  { tool: 'outbound_sendVoiceCall',  risk: 'high',    description: 'Initiate voice call via Twilio',        category: 'outbound',    minApprovalChannels: 1, notifyAllChannels: true,  allowedApprovalChannels: ['whatsapp', 'web'] },
  { tool: 'email_compose',           risk: 'high',    description: 'Compose and send email',                category: 'outbound',    minApprovalChannels: 1, notifyAllChannels: true,  allowedApprovalChannels: ['whatsapp', 'web', 'email'] },
  { tool: 'email_sendApprovalRequest', risk: 'high',  description: 'Send approval request email',           category: 'outbound',    minApprovalChannels: 1, notifyAllChannels: false, allowedApprovalChannels: ['whatsapp', 'web', 'email'] },
  { tool: 'storefronts_send',        risk: 'high',    description: 'Send checkout link to customer',        category: 'payments',    minApprovalChannels: 1, notifyAllChannels: true,  allowedApprovalChannels: ['whatsapp', 'web', 'email'] },
  { tool: 'storefronts_delete',      risk: 'high',    description: 'Delete a storefront/checkout link',     category: 'payments',    minApprovalChannels: 1, notifyAllChannels: false, allowedApprovalChannels: ['whatsapp', 'web', 'email'] },
  { tool: 'products_delete',         risk: 'high',    description: 'Delete a product from catalog',         category: 'catalog',     minApprovalChannels: 1, notifyAllChannels: false, allowedApprovalChannels: ['whatsapp', 'web', 'email'] },
  { tool: 'content_publish',         risk: 'high',    description: 'Publish content to social media',       category: 'marketing',   minApprovalChannels: 1, notifyAllChannels: true,  allowedApprovalChannels: ['whatsapp', 'web'] },
  { tool: 'content_promote',         risk: 'high',    description: 'Promote content (may cost money)',      category: 'marketing',   minApprovalChannels: 1, notifyAllChannels: true,  allowedApprovalChannels: ['whatsapp', 'web'] },
  { tool: 'lovable_pushArtifact',    risk: 'high',    description: 'Push code to Lovable.dev project',      category: 'development', minApprovalChannels: 1, notifyAllChannels: false, allowedApprovalChannels: ['web'] },
  { tool: 'artifact_pushToLovable',  risk: 'high',    description: 'Push artifact to Lovable.dev',          category: 'development', minApprovalChannels: 1, notifyAllChannels: false, allowedApprovalChannels: ['web'] },

  // ── MEDIUM: Draft-first (show what will happen, "approve" to execute) ──
  { tool: 'crm_createContact',       risk: 'medium',  description: 'Add new contact to CRM',               category: 'crm',         minApprovalChannels: 1, notifyAllChannels: false, allowedApprovalChannels: [], autoApproveAfterMinutes: 60 },
  { tool: 'crm_updateContact',       risk: 'medium',  description: 'Update existing CRM contact',          category: 'crm',         minApprovalChannels: 1, notifyAllChannels: false, allowedApprovalChannels: [], autoApproveAfterMinutes: 60 },
  { tool: 'orders_createOrder',      risk: 'medium',  description: 'Create a new order',                   category: 'orders',      minApprovalChannels: 1, notifyAllChannels: false, allowedApprovalChannels: [] },
  { tool: 'orders_updateOrder',      risk: 'medium',  description: 'Update order status/details',          category: 'orders',      minApprovalChannels: 1, notifyAllChannels: false, allowedApprovalChannels: [] },
  { tool: 'storefronts_create',      risk: 'medium',  description: 'Create checkout link/storefront',      category: 'payments',    minApprovalChannels: 1, notifyAllChannels: false, allowedApprovalChannels: [] },
  { tool: 'storefronts_update',      risk: 'medium',  description: 'Update checkout link details',         category: 'payments',    minApprovalChannels: 1, notifyAllChannels: false, allowedApprovalChannels: [] },
  { tool: 'storefronts_markPaid',    risk: 'medium',  description: 'Mark storefront as paid',              category: 'payments',    minApprovalChannels: 1, notifyAllChannels: false, allowedApprovalChannels: [] },
  { tool: 'products_create',         risk: 'medium',  description: 'Add new product to catalog',           category: 'catalog',     minApprovalChannels: 1, notifyAllChannels: false, allowedApprovalChannels: [], autoApproveAfterMinutes: 60 },
  { tool: 'products_update',         risk: 'medium',  description: 'Update product details',               category: 'catalog',     minApprovalChannels: 1, notifyAllChannels: false, allowedApprovalChannels: [], autoApproveAfterMinutes: 60 },
  { tool: 'calendar_addEvent',       risk: 'medium',  description: 'Add event to calendar',                category: 'calendar',    minApprovalChannels: 1, notifyAllChannels: false, allowedApprovalChannels: [], autoApproveAfterMinutes: 30 },
  { tool: 'calendar_updateEvent',    risk: 'medium',  description: 'Update calendar event',                category: 'calendar',    minApprovalChannels: 1, notifyAllChannels: false, allowedApprovalChannels: [], autoApproveAfterMinutes: 30 },
  { tool: 'calendar_deleteEvent',    risk: 'medium',  description: 'Delete calendar event',                category: 'calendar',    minApprovalChannels: 1, notifyAllChannels: false, allowedApprovalChannels: [] },
  { tool: 'calendar_addTask',        risk: 'medium',  description: 'Add task to calendar',                 category: 'calendar',    minApprovalChannels: 1, notifyAllChannels: false, allowedApprovalChannels: [], autoApproveAfterMinutes: 30 },
  { tool: 'sop_create',              risk: 'medium',  description: 'Create new SOP (standard procedure)',   category: 'operations',  minApprovalChannels: 1, notifyAllChannels: false, allowedApprovalChannels: [] },
  { tool: 'sop_update',              risk: 'medium',  description: 'Update existing SOP',                  category: 'operations',  minApprovalChannels: 1, notifyAllChannels: false, allowedApprovalChannels: [] },
  { tool: 'artifact_generateCode',   risk: 'medium',  description: 'Generate code artifact',               category: 'development', minApprovalChannels: 1, notifyAllChannels: false, allowedApprovalChannels: [] },
  { tool: 'artifact_generateDocument', risk: 'medium', description: 'Generate document',                   category: 'content',     minApprovalChannels: 1, notifyAllChannels: false, allowedApprovalChannels: [] },
  { tool: 'artifact_generateTool',   risk: 'medium',  description: 'Generate new tool',                    category: 'development', minApprovalChannels: 1, notifyAllChannels: false, allowedApprovalChannels: [] },
  { tool: 'artifact_selfHeal',       risk: 'medium',  description: 'Regenerate missing/broken file',       category: 'development', minApprovalChannels: 1, notifyAllChannels: false, allowedApprovalChannels: [] },
  { tool: 'artifact_generateMigration', risk: 'medium', description: 'Generate database migration',        category: 'development', minApprovalChannels: 1, notifyAllChannels: false, allowedApprovalChannels: [] },
  { tool: 'lovable_addProject',      risk: 'medium',  description: 'Add Lovable.dev project',              category: 'development', minApprovalChannels: 1, notifyAllChannels: false, allowedApprovalChannels: [] },
  { tool: 'lovable_updateProject',   risk: 'medium',  description: 'Update Lovable.dev project',           category: 'development', minApprovalChannels: 1, notifyAllChannels: false, allowedApprovalChannels: [] },
  { tool: 'lovable_removeProject',   risk: 'medium',  description: 'Remove Lovable.dev project',           category: 'development', minApprovalChannels: 1, notifyAllChannels: false, allowedApprovalChannels: [] },
  { tool: 'lovable_linkProjects',    risk: 'medium',  description: 'Link Lovable.dev projects',            category: 'development', minApprovalChannels: 1, notifyAllChannels: false, allowedApprovalChannels: [] },
];

// ── Lookup Functions ──

const matrixIndex = new Map<string, ApprovalRule>();
for (const rule of APPROVAL_MATRIX) {
  matrixIndex.set(rule.tool, rule);
}

/**
 * Get the approval rule for a tool. Returns null for tools not in the matrix
 * (implicitly LOW risk — no approval needed).
 */
export function getApprovalRule(toolName: string): ApprovalRule | null {
  return matrixIndex.get(toolName) || null;
}

/**
 * Get the risk tier for a tool.
 */
export function getToolRisk(toolName: string): RiskTier {
  return matrixIndex.get(toolName)?.risk || 'low';
}

/**
 * Check if a tool action is blocked (should never be executed by AI).
 */
export function isBlocked(toolName: string): boolean {
  return getToolRisk(toolName) === 'blocked';
}

/**
 * Check if a tool requires approval before execution.
 */
export function requiresApproval(toolName: string): boolean {
  const risk = getToolRisk(toolName);
  return risk === 'medium' || risk === 'high' || risk === 'critical';
}

/**
 * Check if a tool requires dual-channel approval (CRITICAL tier).
 */
export function requiresDualApproval(toolName: string): boolean {
  const rule = getApprovalRule(toolName);
  return rule ? rule.minApprovalChannels >= 2 : false;
}

/**
 * Check if a specific channel can approve a tool action.
 */
export function canApproveOn(toolName: string, channel: OutputChannel): boolean {
  const rule = getApprovalRule(toolName);
  if (!rule) return true; // No rule = low risk, any channel can "approve" (no approval needed)
  if (rule.risk === 'blocked') return false;
  if (rule.allowedApprovalChannels.length === 0) return true; // Empty = any channel
  return rule.allowedApprovalChannels.includes(channel);
}

/**
 * Get all tools that need notification on all channels when pending.
 */
export function getHighVisibilityTools(): ApprovalRule[] {
  return APPROVAL_MATRIX.filter(r => r.notifyAllChannels);
}

/**
 * Get the approval matrix grouped by category.
 */
export function getMatrixByCategory(): Record<string, ApprovalRule[]> {
  const result: Record<string, ApprovalRule[]> = {};
  for (const rule of APPROVAL_MATRIX) {
    if (!result[rule.category]) result[rule.category] = [];
    result[rule.category].push(rule);
  }
  return result;
}

/**
 * Get the approval matrix grouped by risk tier.
 */
export function getMatrixByRisk(): Record<RiskTier, ApprovalRule[]> {
  const result: Record<RiskTier, ApprovalRule[]> = {
    low: [],
    medium: [],
    high: [],
    critical: [],
    blocked: [],
  };
  for (const rule of APPROVAL_MATRIX) {
    result[rule.risk].push(rule);
  }
  return result;
}

/**
 * Format the approval matrix as a human-readable summary for the AI system prompt.
 */
export function getApprovalSummaryForPrompt(): string {
  return `APPROVAL RULES:
- BLOCKED (never execute): outbound payments, refunds, account deletion, data export
- CRITICAL (dual-channel approval needed): broadcast messages, pricing changes, country config, auto-reply rules
- HIGH (single approval + notify all channels): sending WhatsApp/email/SMS/voice to customers, publishing content, pushing to Lovable
- MEDIUM (draft-first, "approve" to execute): CRM updates, orders, products, calendar events, code generation, SOPs
- LOW (execute immediately): all read operations, lookups, searches, analytics, reports

When a CRITICAL action is requested, tell the user they need to confirm on 2 channels.
When a BLOCKED action is requested, refuse and explain why.
When a HIGH action is requested, draft it and wait for approval.
When a MEDIUM action is requested, draft it and wait for approval (some auto-approve after 30-60 min).`;
}
