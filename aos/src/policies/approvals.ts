import type { AOSEvent } from '../types.js';

/**
 * Approvals Policy — Middleware that enforces approval rules on the event bus.
 *
 * Rules:
 *   - LAUNCH_APPROVED events must come from CEO
 *   - High-severity events are logged with warning
 *   - Draft-first: outbound message events must have draftOnly flag
 */
export function approvalsPolicy(event: AOSEvent): void {
  // Only CEO can emit LAUNCH_APPROVED
  if (event.type === 'LAUNCH_APPROVED' && event.source !== 'CEO') {
    throw new Error(`POLICY VIOLATION: Only CEO can approve launch. Source: ${event.source}`);
  }

  // Outbound messages must be drafts
  if (event.type === 'INVITE_DRAFT_CREATED') {
    if (event.payload.status !== 'pending_approval') {
      throw new Error('POLICY VIOLATION: All outbound messages must start as pending_approval drafts.');
    }
  }

  // Log high-severity events
  if (event.severity === 'critical') {
    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      module: 'aos-policy',
      event: 'critical_event',
      type: event.type,
      source: event.source,
    }));
  }
}
