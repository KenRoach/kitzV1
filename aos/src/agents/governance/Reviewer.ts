import { BaseAgent } from '../baseAgent.js';
import type { AOSEvent } from '../../types.js';

export type ReviewDecision = 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT';

export class ReviewerAgent extends BaseAgent {
  review(event: AOSEvent): { decision: ReviewDecision; checklist: Record<string, boolean> } {
    const checklist = {
      alignment: true,
      security: !String(event.payload.action ?? '').includes('security_change') || Boolean((event.payload.approvals as string[] | undefined)?.includes('Security')),
      ux: true,
      financial: true,
      compliance: true
    };

    const decision: ReviewDecision = Object.values(checklist).every(Boolean) ? 'APPROVE' : 'REQUEST_CHANGES';
    return { decision, checklist };
  }
}
