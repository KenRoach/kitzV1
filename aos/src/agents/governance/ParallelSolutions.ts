import { BaseAgent } from '../baseAgent.js';
import { canSpawnAdHoc, createAdHocProposal } from '../../policies/adHocRules.js';
import type { AgentRegistry } from '../../registry.js';
import type { LaunchContext, LaunchReview } from '../../types.js';

/** Parallel Solutions — Are we considering alternatives? */
export class ParallelSolutionsAgent extends BaseAgent {
  reviewLaunchReadiness(_ctx: LaunchContext): LaunchReview {
    return {
      agent: this.name, role: 'Parallel Solutions', vote: 'go',
      confidence: 78, blockers: [],
      warnings: ['No A/B test on campaign messages — consider testing 2 hooks'],
      passed: [
        'Parallel strategy: WhatsApp + Web workspace = two channels',
        'Fallback: if WhatsApp banned, workspace web app still works',
        'AI fallback: Claude → OpenAI bidirectional',
        'Payment fallback: Stripe, PayPal, Yappy, BAC — 4 options',
      ],
      summary: 'Multiple channels, AI fallbacks, 4 payment providers. Good parallel coverage.',
    };
  }

  propose(owner: string, registry: AgentRegistry, severity: 'low' | 'medium' | 'high' | 'critical', issueId: string): Record<string, unknown> {
    if (!canSpawnAdHoc({ severity })) throw new Error('Ad-hoc spawn not permitted for low-severity issue.');
    registry.spawnAdHoc(owner);
    const proposal = createAdHocProposal('parallel-solution', owner, 24);
    this.logProposal(issueId, proposal);
    return proposal;
  }
}
