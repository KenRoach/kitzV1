/**
 * Standardized audit entry creation using EventEnvelope shape.
 */

import { randomUUID } from 'node:crypto';
import type { EventEnvelope } from 'kitz-schemas';

export interface AuditEntryOpts {
  orgId: string;
  userId: string;
  source: string;
  event: string;
  payload: unknown;
  traceId?: string;
}

/** Create a typed EventEnvelope for audit logging. */
export function createAuditEntry(opts: AuditEntryOpts): EventEnvelope {
  return {
    orgId: opts.orgId,
    userId: opts.userId,
    source: opts.source,
    event: opts.event,
    payload: opts.payload,
    traceId: opts.traceId ?? randomUUID(),
    ts: new Date().toISOString(),
  };
}
