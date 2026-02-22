/**
 * MCP Client for admin dashboard — JSON-RPC 2.0 to workspace MCP.
 * Same pattern as workspace/src/mcp.ts and kitz_os/src/tools/mcpClient.ts.
 */

const WORKSPACE_MCP_URL = process.env.WORKSPACE_MCP_URL || '';
const WORKSPACE_MCP_KEY = process.env.WORKSPACE_MCP_KEY || '';
const GOD_MODE_USER_ID = process.env.GOD_MODE_USER_ID || '8787fee9-d06a-442f-91ba-fd082b134ccf';

export const mcpConfigured = !!WORKSPACE_MCP_URL;

export async function callMcp(
  toolName: string,
  args: Record<string, unknown> = {},
): Promise<any> {
  if (!WORKSPACE_MCP_URL) return { error: 'MCP not configured' };

  const body = {
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: {
      name: toolName,
      arguments: { user_id: GOD_MODE_USER_ID, ...args },
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

    const data = await res.json() as any;
    if (data.error) return { error: data.error.message };

    const text = data.result?.content
      ?.filter((c: any) => c.type === 'text' && c.text)
      .map((c: any) => c.text)
      .join('\n');

    if (text) {
      try { return JSON.parse(text); } catch { return text; }
    }
    return data.result || {};
  } catch (err) {
    return { error: (err as Error).message };
  }
}
