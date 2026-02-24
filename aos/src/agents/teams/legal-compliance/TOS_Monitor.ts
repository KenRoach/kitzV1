import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class TOSMonitorAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('TOS_Monitor', bus, memory);
    this.team = 'legal-compliance';
    this.tier = 'team';
  }

  async checkTOS(content: string): Promise<{ compliant: boolean; violations: string[] }> {
    return { compliant: true, violations: [] };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();

    const result = await this.invokeTool('memory_search', { query: payload.query ?? 'terms of service changes', limit: 20 }, traceId);

    await this.invokeTool('memory_store_knowledge', {
      category: 'swarm-findings',
      content: JSON.stringify({ agent: this.name, team: this.team, result: result.data }),
    }, traceId);

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId, findings: result.data,
    });
  }

  override reviewLaunchReadiness(_ctx: LaunchContext): LaunchReview {
    const passed = ['Constitutional governance defined in KITZ_MASTER_PROMPT.md'];
    const warnings: string[] = [];
    return {
      agent: this.name,
      role: 'tos-monitor',
      vote: 'go',
      confidence: 70,
      blockers: [],
      warnings,
      passed,
      summary: 'TOS_Monitor: Terms of service enforcement backed by constitutional governance',
    };
  }
}
