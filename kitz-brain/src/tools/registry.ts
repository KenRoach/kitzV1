export const tools = {
  'crm.getLeadsSummary': { risk: 'low', endpoint: '/tool-calls' },
  'crm.createTask': { risk: 'low', endpoint: '/tool-calls' },
  'orders.getOpenOrders': { risk: 'low', endpoint: '/tool-calls' },
  'orders.updateStatus': { risk: 'medium', endpoint: '/tool-calls' },
  'payments.createCheckoutLink': { risk: 'medium', endpoint: '/payments/checkout-session' },
  'messaging.draftWhatsApp': { risk: 'low', endpoint: '/notifications/enqueue' },
  'messaging.draftEmail': { risk: 'low', endpoint: '/notifications/enqueue' },
  'messaging.send': { risk: 'high', endpoint: '/tool-calls' },
  'refunds.create': { risk: 'high', endpoint: '/tool-calls' },
  'pricing.change': { risk: 'high', endpoint: '/tool-calls' },
  'approvals.request': { risk: 'low', endpoint: '/approvals/request' }
} as const;

export const approvalRequiredActions = ['messaging.send', 'refunds.create', 'pricing.change'];

export type ToolName = keyof typeof tools;

export const toolRegistry = {
  isHighRisk(name: string) {
    return approvalRequiredActions.includes(name);
  },
  async invoke(name: ToolName, payload: unknown, traceId: string) {
    return { name, payload, traceId, via: 'kitz-gateway', endpoint: tools[name].endpoint };
  }
};
