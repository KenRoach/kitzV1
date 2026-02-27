/**
 * Generic service proxy — forwards requests to downstream services with trace headers.
 */

import type { FastifyRequest } from 'fastify';

export interface ProxyOptions {
  baseUrl: string;
  path: string;
  method?: string;
  timeoutMs?: number;
}

/** Forward a request to a downstream service, injecting trace headers. */
export async function proxyRequest(req: FastifyRequest, opts: ProxyOptions): Promise<unknown> {
  const url = `${opts.baseUrl}${opts.path}`;
  const method = opts.method ?? req.method;
  const timeoutMs = opts.timeoutMs ?? 10_000;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-trace-id': String(req.headers['x-trace-id'] || ''),
    'x-org-id': String(req.headers['x-org-id'] || ''),
  };

  if (req.headers['x-scopes']) {
    headers['x-scopes'] = String(req.headers['x-scopes']);
  }
  if (req.headers['x-user-id']) {
    headers['x-user-id'] = String(req.headers['x-user-id']);
  }

  const res = await fetch(url, {
    method,
    headers,
    body: method !== 'GET' && method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => 'unknown');
    return { error: true, status: res.status, message: errText.slice(0, 500), proxied: true };
  }

  return res.json();
}

/** Build service URLs from env vars with defaults. */
export const SERVICE_URLS = {
  kitzOs: process.env.KITZ_OS_URL || 'http://localhost:3012',
  payments: process.env.PAYMENTS_URL || 'http://localhost:3005',
  whatsapp: process.env.WA_CONNECTOR_URL || 'http://localhost:3006',
  email: process.env.EMAIL_CONNECTOR_URL || 'http://localhost:3007',
  notifications: process.env.NOTIFICATIONS_URL || 'http://localhost:3008',
  llmHub: process.env.LLM_HUB_URL || 'http://localhost:4010',
  comms: process.env.COMMS_URL || 'http://localhost:3013',
  logs: process.env.LOGS_URL || 'http://localhost:3014',
} as const;
