import type { EventSeverity } from '../types.js';

export function canSpawnAdHoc(input: { severity: EventSeverity; ownerRequested?: boolean; thresholdCrossed?: boolean }): boolean {
  return input.severity !== 'low' || Boolean(input.ownerRequested) || Boolean(input.thresholdCrossed);
}

export function createAdHocProposal(scope: string, owner: string, ttlHours = 24): Record<string, unknown> {
  return {
    scope,
    owner,
    expiresAt: new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString(),
    constraints: ['cannot_deploy', 'cannot_open_pr_without_owner_signoff'],
    artifact: 'Proposal'
  };
}
