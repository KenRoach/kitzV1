/**
 * Channel Orchestrator — Brain multi-channel lifecycle manager.
 *
 * Handles the full request lifecycle across WhatsApp, Email, and Workspace:
 *   1. RECEIVE    — Accept task from any channel
 *   2. ACKNOWLEDGE — Auto-reply with "working on it" on the originating channel
 *   3. PROCESS     — Route to brain skills via semantic router
 *   4. DRAFT       — Always return a draft for review (never send directly)
 *   5. CLARIFY     — If more info needed, send a clarification request
 *   6. DELIVER     — After approval, send final output via originating channel
 *
 * Channel Strategy:
 *   - WhatsApp = Business operations (orders, payments, CRM, invoicing, customer service)
 *   - Email    = Reports, documents, campaigns, follow-up sequences
 *   - Workspace (ChatPanel) = Full interactive workspace (advisory, content, analytics, strategy)
 */

import { randomUUID } from 'node:crypto';
import type { OutputChannel } from 'kitz-schemas';
import { dispatchMultiChannel } from '../channels/dispatcher.js';
import { formatForChannel } from '../channels/responseFormatter.js';

// ── Types ──

export type TaskStatus =
  | 'received'
  | 'processing'
  | 'draft_ready'
  | 'pending_clarification'
  | 'approved'
  | 'delivered'
  | 'rejected'
  | 'expired';

export interface BrainTask {
  id: string;
  traceId: string;
  userId: string;
  orgId: string;
  /** The channel the request came from */
  originChannel: OutputChannel;
  /** Original user message / request */
  userMessage: string;
  /** Current status */
  status: TaskStatus;
  /** The draft output (set after processing) */
  draftOutput?: string;
  /** Tools used during processing */
  toolsUsed: string[];
  /** Credits consumed */
  creditsConsumed: number;
  /** Clarification question (if status = pending_clarification) */
  clarificationQuestion?: string;
  /** Clarification context for re-processing */
  clarificationContext?: string;
  /** Number of clarification rounds so far */
  clarificationRounds: number;
  /** Final approved output */
  approvedOutput?: string;
  /** Recipient info for delivery */
  recipient: {
    userId: string;
    phone?: string;
    email?: string;
    whatsappUserId?: string;
  };
  /** Timestamps */
  receivedAt: string;
  processedAt?: string;
  approvedAt?: string;
  deliveredAt?: string;
  /** 24h SLA deadline */
  slaDeadline: string;
}

// ── In-Memory Task Store ──

const taskStore = new Map<string, BrainTask>();
const userTaskIndex = new Map<string, string[]>(); // userId → taskIds

const SLA_HOURS = 24;
const MAX_CLARIFICATION_ROUNDS = 3;
const TASK_TTL_MS = 72 * 60 * 60 * 1000; // 72 hours

function cleanExpiredTasks(): void {
  const now = Date.now();
  for (const [id, task] of taskStore) {
    if (now - new Date(task.receivedAt).getTime() > TASK_TTL_MS) {
      taskStore.delete(id);
      const userTasks = userTaskIndex.get(task.userId);
      if (userTasks) {
        const filtered = userTasks.filter(tid => tid !== id);
        if (filtered.length) userTaskIndex.set(task.userId, filtered);
        else userTaskIndex.delete(task.userId);
      }
    }
  }
}

// ── Channel-Aware Acknowledgment Messages ──

const ACK_MESSAGES: Record<OutputChannel, (task: BrainTask) => string> = {
  whatsapp: (t) => `Recibido. Trabajando en esto... Te envío el borrador pronto.\n\n_Ref: ${t.id.slice(0, 8)}_`,
  email: (t) => `We received your request and are working on it. You'll receive a draft for your review within 24 hours.\n\nReference: ${t.id.slice(0, 8)}`,
  web: (t) => `Got it. Processing your request...\n\nI'll have a draft ready for your review shortly. Reference: ${t.id.slice(0, 8)}`,
  sms: (t) => `KITZ: Request received. Draft coming soon. Ref: ${t.id.slice(0, 8)}`,
  voice: (t) => `Request received. I'll prepare a draft for your review. Reference number: ${t.id.slice(0, 8)}.`,
};

const CLARIFICATION_MESSAGES: Record<OutputChannel, (question: string, taskRef: string) => string> = {
  whatsapp: (q, ref) => `Necesito más info para completar tu solicitud:\n\n${q}\n\n_Responde a este mensaje. Ref: ${ref}_`,
  email: (q, ref) => `We need a bit more information to complete your request:\n\n${q}\n\nPlease reply to this email with the details. Reference: ${ref}`,
  web: (q, ref) => `I need some additional information to complete this task:\n\n${q}\n\nPlease provide the details and I'll continue. Ref: ${ref}`,
  sms: (q, ref) => `KITZ needs more info: ${q} Reply with details. Ref: ${ref}`,
  voice: (q, ref) => `I need more information. ${q}. Please provide the details. Reference: ${ref}.`,
};

const DRAFT_READY_MESSAGES: Record<OutputChannel, (draft: string, taskRef: string) => string> = {
  whatsapp: (d, ref) => `📋 *Borrador listo para revisión*\n\n${d}\n\n_Responde "aprobar" para enviar o "rechazar" para cancelar._\n_Ref: ${ref}_`,
  email: (d, ref) => `Draft Ready for Review\n\n${d}\n\nReply "approve" to send or "reject" to cancel.\nReference: ${ref}`,
  web: (d, ref) => `**Draft Ready for Review**\n\n${d}\n\nClick "Approve" to execute or "Reject" to cancel. Ref: ${ref}`,
  sms: (d, ref) => `KITZ Draft: ${d.slice(0, 100)}... Reply APPROVE or REJECT. Ref: ${ref}`,
  voice: (d, ref) => `Your draft is ready. ${d.slice(0, 200)}. Say approve to send, or reject to cancel. Reference: ${ref}.`,
};

// ── Core Orchestration Functions ──

/**
 * Create a new brain task from an incoming message on any channel.
 * Returns the task and an acknowledgment message.
 */
export function createTask(opts: {
  userId: string;
  orgId: string;
  originChannel: OutputChannel;
  userMessage: string;
  recipient: BrainTask['recipient'];
  traceId?: string;
}): { task: BrainTask; ackMessage: string } {
  cleanExpiredTasks();

  const now = new Date();
  const slaDeadline = new Date(now.getTime() + SLA_HOURS * 60 * 60 * 1000);

  const task: BrainTask = {
    id: `btask_${randomUUID().slice(0, 12)}`,
    traceId: opts.traceId || randomUUID(),
    userId: opts.userId,
    orgId: opts.orgId,
    originChannel: opts.originChannel,
    userMessage: opts.userMessage,
    status: 'received',
    toolsUsed: [],
    creditsConsumed: 0,
    clarificationRounds: 0,
    recipient: opts.recipient,
    receivedAt: now.toISOString(),
    slaDeadline: slaDeadline.toISOString(),
  };

  taskStore.set(task.id, task);

  const userTasks = userTaskIndex.get(opts.userId) || [];
  userTasks.push(task.id);
  userTaskIndex.set(opts.userId, userTasks);

  const ackMessage = ACK_MESSAGES[opts.originChannel](task);
  return { task, ackMessage };
}

/**
 * Mark task as processing (brain is working on it).
 */
export function markProcessing(taskId: string): void {
  const task = taskStore.get(taskId);
  if (task) task.status = 'processing';
}

/**
 * Set the draft output for a task. Status → draft_ready.
 */
export function setDraftOutput(taskId: string, output: string, toolsUsed: string[], creditsConsumed: number): string {
  const task = taskStore.get(taskId);
  if (!task) return 'Task not found';

  task.draftOutput = output;
  task.toolsUsed = toolsUsed;
  task.creditsConsumed = creditsConsumed;
  task.status = 'draft_ready';
  task.processedAt = new Date().toISOString();

  const ref = task.id.slice(0, 8);
  return DRAFT_READY_MESSAGES[task.originChannel](output, ref);
}

/**
 * Request clarification from the user. Status → pending_clarification.
 * Returns the clarification message formatted for the origin channel.
 */
export function requestClarification(taskId: string, question: string, context?: string): string | null {
  const task = taskStore.get(taskId);
  if (!task) return null;

  if (task.clarificationRounds >= MAX_CLARIFICATION_ROUNDS) {
    return null; // Too many rounds — force a best-effort draft instead
  }

  task.status = 'pending_clarification';
  task.clarificationQuestion = question;
  task.clarificationContext = context;
  task.clarificationRounds += 1;

  const ref = task.id.slice(0, 8);
  return CLARIFICATION_MESSAGES[task.originChannel](question, ref);
}

/**
 * Provide clarification for a pending task. Resets status to received for re-processing.
 * Returns the updated user message (original + clarification).
 */
export function provideClarification(taskId: string, clarification: string): BrainTask | null {
  const task = taskStore.get(taskId);
  if (!task || task.status !== 'pending_clarification') return null;

  // Append clarification to original message for re-processing
  task.userMessage = `${task.userMessage}\n\n[Clarification]: ${clarification}`;
  task.status = 'received';
  task.clarificationQuestion = undefined;

  return task;
}

/**
 * Approve a draft. Status → approved.
 */
export function approveDraft(taskId: string): BrainTask | null {
  const task = taskStore.get(taskId);
  if (!task || task.status !== 'draft_ready') return null;

  task.status = 'approved';
  task.approvedOutput = task.draftOutput;
  task.approvedAt = new Date().toISOString();

  return task;
}

/**
 * Reject a draft. Status → rejected.
 */
export function rejectDraft(taskId: string): BrainTask | null {
  const task = taskStore.get(taskId);
  if (!task || task.status !== 'draft_ready') return null;

  task.status = 'rejected';
  return task;
}

/**
 * Mark task as delivered after sending the approved output.
 */
export function markDelivered(taskId: string): void {
  const task = taskStore.get(taskId);
  if (task) {
    task.status = 'delivered';
    task.deliveredAt = new Date().toISOString();
  }
}

/**
 * Deliver the approved output via the originating channel.
 */
export async function deliverApproved(taskId: string): Promise<{ delivered: boolean; error?: string }> {
  const task = taskStore.get(taskId);
  if (!task || !task.approvedOutput) return { delivered: false, error: 'No approved output' };

  try {
    await dispatchMultiChannel({
      rawResponse: task.approvedOutput,
      originChannel: task.originChannel,
      echoChannels: [],
      recipientInfo: task.recipient,
      traceId: task.traceId,
      orgId: task.orgId,
      draftOnly: false, // This is the approved send — not a draft
    });

    markDelivered(taskId);
    return { delivered: true };
  } catch (err) {
    return { delivered: false, error: (err as Error).message };
  }
}

// ── Query Functions ──

export function getTask(taskId: string): BrainTask | null {
  return taskStore.get(taskId) || null;
}

export function getTasksByUser(userId: string): BrainTask[] {
  const taskIds = userTaskIndex.get(userId) || [];
  return taskIds.map(id => taskStore.get(id)).filter(Boolean) as BrainTask[];
}

export function getPendingTasks(): BrainTask[] {
  return Array.from(taskStore.values()).filter(t =>
    t.status === 'received' || t.status === 'processing'
  );
}

export function getDraftReadyTasks(userId?: string): BrainTask[] {
  const tasks = userId
    ? getTasksByUser(userId)
    : Array.from(taskStore.values());
  return tasks.filter(t => t.status === 'draft_ready');
}

export function getPendingClarificationTasks(userId?: string): BrainTask[] {
  const tasks = userId
    ? getTasksByUser(userId)
    : Array.from(taskStore.values());
  return tasks.filter(t => t.status === 'pending_clarification');
}

/**
 * Find a task by short reference (first 8 chars of task ID).
 */
export function findTaskByRef(ref: string, userId?: string): BrainTask | null {
  const tasks = userId
    ? getTasksByUser(userId)
    : Array.from(taskStore.values());
  return tasks.find(t => t.id.startsWith(`btask_${ref}`) || t.id.includes(ref)) || null;
}

/**
 * Check for tasks approaching SLA deadline (within 2 hours).
 * Used by cadence engine to send reminders.
 */
export function getTasksNearingSLA(): BrainTask[] {
  const twoHoursFromNow = Date.now() + 2 * 60 * 60 * 1000;
  return Array.from(taskStore.values()).filter(t =>
    (t.status === 'received' || t.status === 'processing') &&
    new Date(t.slaDeadline).getTime() <= twoHoursFromNow
  );
}

/**
 * Get all tasks as a summary for the admin dashboard.
 */
export function getTaskSummary(): {
  total: number;
  byStatus: Record<string, number>;
  withinSLA: number;
  pastSLA: number;
} {
  const tasks = Array.from(taskStore.values());
  const now = Date.now();
  const byStatus: Record<string, number> = {};

  let withinSLA = 0;
  let pastSLA = 0;

  for (const t of tasks) {
    byStatus[t.status] = (byStatus[t.status] || 0) + 1;
    if (t.status !== 'delivered' && t.status !== 'rejected' && t.status !== 'expired') {
      if (now <= new Date(t.slaDeadline).getTime()) withinSLA++;
      else pastSLA++;
    }
  }

  return { total: tasks.length, byStatus, withinSLA, pastSLA };
}
