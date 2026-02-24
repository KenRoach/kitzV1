import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class WAFlowDesignerAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('WAFlowDesigner', bus, memory);
    this.team = 'whatsapp-comms';
    this.tier = 'team';
  }

  async designFlow(flowName: string, steps: string[]): Promise<{ flowId: string; steps: string[] }> {
    return { flowId: `flow_${flowName}`, steps };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();

    const result = await this.invokeTool('memory_search', { query: payload.query ?? 'WhatsApp flow designs', limit: 20 }, traceId);

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
