export const llmProvidersAllowed = [
  'lovable',
  'anthropic/claude-code',
  'openai/codex',
  'google/gemini'
] as const;

export const paymentProvidersAllowed = ['stripe', 'paypal'] as const;

export const financePolicy = {
  mode: 'receive_only',
  rule: 'Agents are never allowed to spend or transfer money. Only incoming payments are allowed.',
  blockedActions: ['refund', 'payout', 'transfer', 'expense', 'vendor_payment', 'purchase']
} as const;

export const assertReceiveOnlyAction = (action: string): void => {
  if (financePolicy.blockedActions.some((blocked) => action.toLowerCase().includes(blocked))) {
    throw new Error('Finance policy violation: agents can only receive money; spending actions are blocked.');
  }
};
