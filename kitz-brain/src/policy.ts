export const llmProvidersAllowed = [
  'lovable',
  'anthropic/claude-code',
  'openai/codex',
  'google/gemini'
] as const;

export const paymentProvidersAllowed = ['stripe', 'paypal', 'yappy', 'bac'] as const;

export const financePolicy = {
  mode: 'receive_only',
  rule: 'Agents are never allowed to spend or transfer money. Only incoming payments are allowed.',
  blockedActions: ['refund', 'payout', 'transfer', 'expense', 'vendor_payment', 'purchase']
} as const;

export const growthExecutionPolicy = {
  strategy: 'scrappy_free_first',
  rule: 'Always try free options first, validate without money, then request funds only for plans with >=10x projected ROI.'
} as const;

export interface RoiPlan {
  initiative: string;
  freeValidationSteps: string[];
  projectedRoiMultiple: number;
  validationPassed: boolean;
  requestedBudgetUsd: number;
}

export const assertReceiveOnlyAction = (action: string): void => {
  if (financePolicy.blockedActions.some((blocked) => action.toLowerCase().includes(blocked))) {
    throw new Error('Finance policy violation: agents can only receive money; spending actions are blocked.');
  }
};

export const shouldRequestFunds = (plan: RoiPlan): boolean => plan.validationPassed && plan.projectedRoiMultiple >= 10;

export const buildRoiPlan = (initiative: string): RoiPlan => ({
  initiative,
  freeValidationSteps: [
    'Use free channel experiments (organic outreach / existing list reactivation).',
    'Run draft-first campaigns and manual follow-up using current tooling.',
    'Measure conversion and margin uplift before budget request.'
  ],
  projectedRoiMultiple: 10,
  validationPassed: true,
  requestedBudgetUsd: 500
});
