import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class OutreachDrafterAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('OutreachDrafter', bus, memory);
    this.team = 'sales-crm';
    this.tier = 'team';
  }

  async draftOutreach(leadId: string, context: string): Promise<{ draft: string; draftOnly: true }> {
    return { draft: `Follow-up for ${leadId}: ${context}`, draftOnly: true };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();

    const result = await this.invokeTool('crm_listContacts', { ...payload }, traceId);

    await this.invokeTool('memory_store_knowledge', {
      category: 'swarm-findings',
      content: JSON.stringify({ agent: this.name, team: this.team, result: result.data }),
    }, traceId);

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId, findings: result.data,
    });
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
