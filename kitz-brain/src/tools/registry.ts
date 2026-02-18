
export const tools = {
  'crm.getLeadsSummary': { risk: 'low', endpoint: '/tool-calls' },
  'crm.createTask': { risk: 'low', endpoint: '/tool-calls' },
  'orders.getOpenOrders': { risk: 'low', endpoint: '/tool-calls' },
  'orders.updateStatus': { risk: 'medium', endpoint: '/tool-calls' },
  'payments.createCheckoutLink': { risk: 'medium', endpoint: '/payments/checkout-session' },
  'messaging.draftWhatsApp': { risk: 'low', endpoint: '/notifications/enqueue' },
  'messaging.draftEmail': { risk: 'low', endpoint: '/notifications/enqueue' },
  'approvals.request': { risk: 'low', endpoint: '/approvals/request' }
} as const;

export const approvalRequiredActions = ['messaging.send', 'refunds.create', 'pricing.change'];

export const toolRegistry = {
  async invoke(name: keyof typeof tools, payload: unknown, traceId: string) {
    return { name, payload, traceId, via: 'kitz-gateway', endpoint: tools[name].endpoint };
  }
};
