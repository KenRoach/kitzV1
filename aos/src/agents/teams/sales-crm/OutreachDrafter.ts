import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { LaunchContext, LaunchReview } from '../../../types.js';

export class OutreachDrafterAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('OutreachDrafter', bus, memory);
    this.team = 'sales-crm';
    this.tier = 'team';
  }

  async draftOutreach(leadId: string, context: string): Promise<{ draft: string; draftOnly: true }> {
    return { draft: `Follow-up for ${leadId}: ${context}`, draftOnly: true };
  }

  override reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const blockers: string[] = [];
    const passed: string[] = [];
    if (ctx.draftFirstEnforced) passed.push('Draft-first enforced for all outreach');
    else blockers.push('Draft-first not enforced — outreach cannot send without approval');
    return {
      agent: this.name, role: 'outreach-drafter', vote: blockers.length > 0 ? 'no-go' : 'go',
      confidence: 80, blockers, warnings: [], passed,
      summary: 'OutreachDrafter: Draft-first outreach pipeline ready',
    };
  }
}
