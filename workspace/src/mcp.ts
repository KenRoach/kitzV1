/**
 * MCP Client — JSON-RPC 2.0 HTTP client for workspace MCP server.
 * Same pattern as kitz_os/src/tools/mcpClient.ts.
 *
 * Passes the caller's userId for Supabase RLS enforcement.
 */

const WORKSPACE_MCP_URL = process.env.WORKSPACE_MCP_URL || 'https://mqkjbejuuedauygeccbj.supabase.co/functions/v1/mcp-server/mcp';
const WORKSPACE_MCP_KEY = process.env.WORKSPACE_MCP_KEY || '';

interface McpResponse {
  jsonrpc: string;
  id: number;
  result?: { content?: Array<{ type: string; text?: string }> };
  error?: { code: number; message: string };
}

export const mcpConfigured = !!WORKSPACE_MCP_URL;

export async function callMcp(
  toolName: string,
  args: Record<string, unknown> = {},
  userId: string,
): Promise<unknown> {
  if (!WORKSPACE_MCP_URL) return { error: 'MCP not configured' };

  const body = {
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: {
      name: toolName,
      arguments: { user_id: userId, ...args },
    },
  };

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (WORKSPACE_MCP_KEY) headers['x-api-key'] = WORKSPACE_MCP_KEY;

  try {
    const res = await fetch(WORKSPACE_MCP_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) return { error: `MCP HTTP ${res.status}` };

    const data = await res.json() as McpResponse;
    if (data.error) return { error: data.error.message };

    const textContent = data.result?.content
      ?.filter(c => c.type === 'text' && c.text)
      .map(c => c.text)
      .join('\n');

    if (textContent) {
      try { return JSON.parse(textContent); } catch { return textContent; }
    }

    return data.result || {};
  } catch (err) {
    return { error: (err as Error).message };
  }
}
