/**
 * Draft-first policy enforcement.
 * All outbound messages (WhatsApp, email, voice) are drafts by default.
 * Nothing sends without explicit approval.
 */

export interface DraftableMessage {
  draftOnly?: boolean;
  approvedBy?: string;
  approvedAt?: string;
}

/** Enforce draft-first: returns true if the message should be held as draft. */
export function enforceDraftFirst(msg: DraftableMessage): boolean {
  if (msg.draftOnly === false && msg.approvedBy) return false;
  return true;
}

/** Check if a draft has been approved for sending. */
export function isDraftApproved(msg: DraftableMessage): boolean {
  return msg.draftOnly === false && !!msg.approvedBy;
}
