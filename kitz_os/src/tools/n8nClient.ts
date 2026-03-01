/**
 * n8n Client — HTTP client for n8n workflow automation API.
 * Follows the same pattern as mcpClient.ts.
 */

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('n8nClient');

const N8N_API_URL = process.env.N8N_API_URL || 'http://localhost:5678';
const N8N_API_KEY = process.env.N8N_API_KEY || '';

async function callN8n(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: Record<string, unknown>,
  traceId?: string,
): Promise<unknown> {
  const url = `${N8N_API_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (N8N_API_KEY) {
    headers['X-N8N-API-KEY'] = N8N_API_KEY;
  }
  if (traceId) {
    headers['x-trace-id'] = traceId;
  }

  log.info(method, { path, trace_id: traceId });

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => 'unknown');
      log.error(`n8n HTTP ${res.status}`, { path, detail: errText.slice(0, 300), trace_id: traceId });
      return { error: `n8n HTTP ${res.status}` };
    }

    // Some endpoints (like healthz) may return empty body
    const text = await res.text();
    if (!text) return { ok: true };
    try {
      return JSON.parse(text);
    } catch {
      return { ok: true, body: text };
    }
  } catch (err) {
    log.error('fetch failed', { path, detail: (err as Error).message, trace_id: traceId });
    return { error: (err as Error).message };
  }
}

/** Execute a workflow by ID */
export async function executeWorkflow(
  workflowId: string,
  data?: Record<string, unknown>,
  traceId?: string,
): Promise<unknown> {
  return callN8n('POST', `/api/v1/workflows/${workflowId}/execute`, data ? { data } : undefined, traceId);
}

/** Create a new workflow from a JSON definition */
export async function createWorkflow(
  workflow: Record<string, unknown>,
  traceId?: string,
): Promise<unknown> {
  return callN8n('POST', '/api/v1/workflows', workflow, traceId);
}

/** Delete a workflow by ID */
export async function deleteWorkflow(
  workflowId: string,
  traceId?: string,
): Promise<unknown> {
  return callN8n('DELETE', `/api/v1/workflows/${workflowId}`, undefined, traceId);
}

/** List all workflows */
export async function listWorkflows(traceId?: string): Promise<unknown> {
  return callN8n('GET', '/api/v1/workflows', undefined, traceId);
}

/** Get a single workflow by ID */
export async function getWorkflow(workflowId: string, traceId?: string): Promise<unknown> {
  return callN8n('GET', `/api/v1/workflows/${workflowId}`, undefined, traceId);
}

/** Activate or deactivate a workflow */
export async function setWorkflowActive(
  workflowId: string,
  active: boolean,
  traceId?: string,
): Promise<unknown> {
  return callN8n('PATCH', `/api/v1/workflows/${workflowId}`, { active }, traceId);
}

/** Trigger a webhook-based workflow by path (no API key needed) */
export async function triggerWebhook(
  webhookPath: string,
  data?: Record<string, unknown>,
  traceId?: string,
): Promise<unknown> {
  // Webhook calls go directly to /webhook/ path, no API key
  const url = `${N8N_API_URL}/webhook/${webhookPath}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (traceId) headers['x-trace-id'] = traceId;

  log.info('triggerWebhook', { webhook: webhookPath, trace_id: traceId });

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data || {}),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => 'unknown');
      return { error: `Webhook HTTP ${res.status}: ${errText.slice(0, 200)}` };
    }
    const text = await res.text();
    try { return JSON.parse(text); } catch { return { ok: true, body: text }; }
  } catch (err) {
    return { error: (err as Error).message };
  }
}

/** Get execution history */
export async function getExecutions(
  workflowId?: string,
  limit?: number,
  traceId?: string,
): Promise<unknown> {
  const params = new URLSearchParams();
  if (workflowId) params.set('workflowId', workflowId);
  if (limit) params.set('limit', String(limit));
  const qs = params.toString();
  return callN8n('GET', `/api/v1/executions${qs ? `?${qs}` : ''}`, undefined, traceId);
}

/** Check n8n health */
export async function checkHealth(traceId?: string): Promise<unknown> {
  return callN8n('GET', '/healthz', undefined, traceId);
}
