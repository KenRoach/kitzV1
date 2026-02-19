import type { RiskLevel, ToolCallRequest, ToolCallResponse } from 'kitz-schemas';

export interface ToolSpec {
  endpoint: string;
  riskLevel: RiskLevel;
  requiredScopes: string[];
}

export const tools: Record<string, ToolSpec> = {
  'crm.getLeadsSummary': { riskLevel: 'low', endpoint: '/tool-calls', requiredScopes: ['tools:invoke'] },
  'crm.createTask': { riskLevel: 'low', endpoint: '/tool-calls', requiredScopes: ['tools:invoke'] },
  'orders.getOpenOrders': { riskLevel: 'low', endpoint: '/tool-calls', requiredScopes: ['tools:invoke'] },
  'orders.updateStatus': { riskLevel: 'medium', endpoint: '/tool-calls', requiredScopes: ['tools:invoke', 'orders:write'] },
  'payments.createCheckoutLink': { riskLevel: 'medium', endpoint: '/payments/checkout-session', requiredScopes: ['payments:write'] },
  'messaging.draftWhatsApp': { riskLevel: 'low', endpoint: '/notifications/enqueue', requiredScopes: ['notifications:write'] },
  'messaging.draftEmail': { riskLevel: 'low', endpoint: '/notifications/enqueue', requiredScopes: ['notifications:write'] },
  'approvals.request': { riskLevel: 'low', endpoint: '/approvals/request', requiredScopes: ['approvals:write'] }
};

export const approvalRequiredActions = ['messaging.send', 'refunds.create', 'pricing.change'];

const gatewayBaseUrl = process.env.GATEWAY_URL || 'http://localhost:4000';

export const toolRegistry = {
  async invoke(name: keyof typeof tools, input: unknown, traceId: string, orgId = 'demo-org'): Promise<ToolCallResponse | unknown> {
    const spec = tools[name];
    const requestBody: ToolCallRequest = {
      name,
      input,
      riskLevel: spec.riskLevel,
      requiredScopes: spec.requiredScopes,
      traceId
    };

    const response = await fetch(`${gatewayBaseUrl}${spec.endpoint}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer brain-service-token',
        'x-org-id': orgId,
        'x-trace-id': traceId,
        'x-scopes': spec.requiredScopes.join(',')
      },
      body: JSON.stringify(requestBody)
    });

    return response.json();
  }
};
