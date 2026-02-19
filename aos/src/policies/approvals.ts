import type { AOSEvent } from '../types.js';

const SUBMISSION_ACTIONS = new Set(['merge_pr_recommendation', 'deploy_recommendation', 'config_change_recommendation']);

export function enforceApprovals(event: AOSEvent): void {
  const action = String(event.payload.action ?? '');
  const approvals = new Set((event.payload.approvals as string[] | undefined) ?? []);

  if (SUBMISSION_ACTIONS.has(action) && !approvals.has('Reviewer')) {
    throw new Error('Reviewer approval is required for submission actions.');
  }
  if (action === 'capital_allocation_recommendation' && (!approvals.has('CFO') || !approvals.has('CapitalAllocation'))) {
    throw new Error('CFO + CapitalAllocation approvals are required.');
  }
  if (action === 'security_change_recommendation' && (!approvals.has('CTO') || !approvals.has('Security'))) {
    throw new Error('CTO + Security approvals are required.');
  }
}
