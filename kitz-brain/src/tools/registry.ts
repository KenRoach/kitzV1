import type { RiskLevel, ToolCallRequest, ToolCallResponse } from 'kitz-schemas';

export interface ToolSpec {
  endpoint: string;
  riskLevel: RiskLevel;
  requiredScopes: string[];
}

export const tools: Record<string, ToolSpec> = {
  'crm.getLeadsSummary': { riskLevel: 'low', endpoint: '/api/kitz', requiredScopes: ['tools:invoke'] },
  'crm.createTask': { riskLevel: 'low', endpoint: '/api/kitz', requiredScopes: ['tools:invoke'] },
  'orders.getOpenOrders': { riskLevel: 'low', endpoint: '/api/kitz', requiredScopes: ['tools:invoke'] },
  'orders.updateStatus': { riskLevel: 'medium', endpoint: '/api/kitz', requiredScopes: ['tools:invoke'] },
  'payments.createCheckoutLink': { riskLevel: 'medium', endpoint: '/api/kitz', requiredScopes: ['payments:write'] },
  'messaging.draftWhatsApp': { riskLevel: 'low', endpoint: '/api/kitz', requiredScopes: ['notifications:write'] },
  'messaging.draftEmail': { riskLevel: 'low', endpoint: '/api/kitz', requiredScopes: ['notifications:write'] },
  'approvals.request': { riskLevel: 'low', endpoint: '/api/kitz', requiredScopes: ['approvals:write'] },
};

export const approvalRequiredActions = ['messaging.send', 'refunds.create', 'pricing.change'];

const KITZ_OS_URL = process.env.KITZ_OS_URL || 'http://localhost:3012';
const SERVICE_SECRET = process.env.SERVICE_SECRET || process.env.DEV_TOKEN_SECRET || '';

export const toolRegistry = {
  async invoke(name: keyof typeof tools, input: unknown, traceId: string, orgId = 'demo-org'): Promise<ToolCallResponse | unknown> {
    const spec = tools[name];

    // Route through kitz_os semantic router — this gives brain agents
    // access to all 155+ tools via natural language commands.
    const message = buildToolMessage(name, input);

    const response = await fetch(`${KITZ_OS_URL}${spec.endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(SERVICE_SECRET ? { 'x-dev-secret': SERVICE_SECRET } : {}),
        'x-trace-id': traceId,
        'x-org-id': orgId,
      },
      body: JSON.stringify({
        message,
        user_id: `brain-agent`,
        trace_id: traceId,
        source: 'brain_agent',
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      return { error: `Tool invocation failed (${response.status}): ${text.slice(0, 200)}` };
    }

    return response.json();
  }
};

/** Convert a tool name + args into a natural language message for the semantic router */
function buildToolMessage(name: string, input: unknown): string {
  const args = input as Record<string, unknown>;
  switch (name) {
    case 'crm.getLeadsSummary':
      return `Get a summary of CRM leads from the last ${args.window || '24h'}`;
    case 'crm.createTask':
      return `Create a task: "${args.title}"${args.dueDate ? ` due ${args.dueDate}` : ''}`;
    case 'orders.getOpenOrders':
      return 'List all open orders with aging information';
    case 'orders.updateStatus':
      return `Update order ${args.orderId} status to ${args.status}`;
    case 'payments.createCheckoutLink':
      return `Create a checkout link for $${args.amount || 0}`;
    case 'messaging.draftWhatsApp':
      return `Draft a WhatsApp message to ${args.phone}: "${args.message}"`;
    case 'messaging.draftEmail':
      return `Draft an email to ${args.to} with subject "${args.subject}": "${args.body}"`;
    case 'approvals.request':
      return `[APPROVAL REQUEST] Action: ${args.action}. Reason: ${args.reason}`;
    default:
      return `Execute tool ${name} with args: ${JSON.stringify(args)}`;
  }
}
