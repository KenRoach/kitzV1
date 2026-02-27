/**
 * fetch wrapper — auto-injects x-trace-id, x-org-id, x-scopes headers.
 * Supports AbortSignal timeout.
 */

import { randomUUID } from 'node:crypto';
import { TRACE_ID_HEADER, ORG_ID_HEADER, SCOPES_HEADER } from './headers.js';

export interface TracedFetchOptions extends RequestInit {
  traceId?: string;
  orgId?: string;
  scopes?: string[];
  timeoutMs?: number;
}

export async function fetchWithTrace(
  url: string,
  options: TracedFetchOptions = {},
): Promise<Response> {
  const { traceId, orgId, scopes, timeoutMs, ...fetchOpts } = options;

  const headers = new Headers(fetchOpts.headers);

  headers.set(TRACE_ID_HEADER, traceId ?? randomUUID());
  if (orgId) headers.set(ORG_ID_HEADER, orgId);
  if (scopes?.length) headers.set(SCOPES_HEADER, scopes.join(','));

  let signal = fetchOpts.signal;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  if (timeoutMs && !signal) {
    const controller = new AbortController();
    signal = controller.signal;
    timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  }

  try {
    return await fetch(url, { ...fetchOpts, headers, signal });
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
