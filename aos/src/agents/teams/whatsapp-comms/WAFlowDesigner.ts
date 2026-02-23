import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { LaunchContext, LaunchReview } from '../../../types.js';

export class WAFlowDesignerAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('WAFlowDesigner', bus, memory);
    this.team = 'whatsapp-comms';
    this.tier = 'team';
  }

  async designFlow(flowName: string, steps: string[]): Promise<{ flowId: string; steps: string[] }> {
    return { flowId: `flow_${flowName}`, steps };
  }

  override reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const blockers: string[] = [];
    const warnings: string[] = [];
    const passed: string[] = [];
    if (ctx.whatsappConnectorConfigured) passed.push('WhatsApp connector configured');
    else blockers.push('WhatsApp connector not configured');
    if (!ctx.draftFirstEnforced) blockers.push('Draft-first not enforced for outbound flows');
    else passed.push('Draft-first enforced');
    return {
      agent: this.name, role: 'flow-designer', vote: blockers.length > 0 ? 'no-go' : 'go',
      confidence: blockers.length > 0 ? 30 : 82, blockers, warnings, passed,
      summary: `WAFlowDesigner: ${blockers.length === 0 ? 'Flows ready' : 'Flows blocked'}`,
    };
  }
}
