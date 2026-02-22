/**
 * MCP Client — JSON-RPC 2.0 HTTP client for workspace MCP server.
 *
 * Passes the caller's userId for Supabase RLS enforcement.
 * Falls back to GOD_MODE_USER_ID only when no userId is provided (system/cron calls).
 */

const WORKSPACE_MCP_URL = process.env.WORKSPACE_MCP_URL || 'https://mqkjbejuuedauygeccbj.supabase.co/functions/v1/mcp-server/mcp';
const WORKSPACE_MCP_KEY = process.env.WORKSPACE_MCP_KEY || '';
const GOD_MODE_USER_ID = process.env.GOD_MODE_USER_ID || '8787fee9-d06a-442f-91ba-fd082b134ccf';

interface McpResponse {
  jsonrpc: string;
  id: number;
  result?: { content?: Array<{ type: string; text?: string }> };
  error?: { code: number; message: string };
}

export async function callWorkspaceMcp(
  toolName: string,
  args: Record<string, unknown> = {},
  traceId?: string,
  userId?: string,
): Promise<unknown> {
  const effectiveUserId = userId || GOD_MODE_USER_ID;

  const body = {
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: {
      name: toolName,
      arguments: { user_id: effectiveUserId, ...args },
    },
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (WORKSPACE_MCP_KEY) {
    headers['x-api-key'] = WORKSPACE_MCP_KEY;
  }
  if (traceId) {
    headers['x-trace-id'] = traceId;
  }

  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    module: 'mcpClient',
    action: 'call',
    tool: toolName,
    trace_id: traceId,
  }));

  try {
    const res = await fetch(WORKSPACE_MCP_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => 'unknown');
      console.error(JSON.stringify({
        ts: new Date().toISOString(),
        module: 'mcpClient',
        error: `HTTP ${res.status}`,
        detail: errText.slice(0, 300),
        tool: toolName,
        trace_id: traceId,
      }));
      return { error: `MCP HTTP ${res.status}` };
    }

    const data = await res.json() as McpResponse;

    if (data.error) {
      return { error: data.error.message };
    }

    // Extract text content from MCP response
    const textContent = data.result?.content
      ?.filter(c => c.type === 'text' && c.text)
      .map(c => c.text)
      .join('\n');

    if (textContent) {
      try {
        return JSON.parse(textContent);
      } catch {
        return textContent;
      }
    }

    return data.result || {};
  } catch (err) {
    console.error(JSON.stringify({
      ts: new Date().toISOString(),
      module: 'mcpClient',
      error: 'fetch_failed',
      detail: (err as Error).message,
      tool: toolName,
      trace_id: traceId,
    }));
    return { error: (err as Error).message };
  }
}
