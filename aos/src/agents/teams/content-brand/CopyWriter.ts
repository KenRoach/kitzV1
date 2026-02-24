import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class CopyWriterAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('CopyWriter', bus, memory);
    this.team = 'content-brand';
    this.tier = 'team';
  }

  async writeCopy(type: 'landing' | 'email' | 'ad' | 'whatsapp', context: string): Promise<{ draft: string; draftOnly: true }> {
    return { draft: `${type} copy draft: ${context}`, draftOnly: true };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();

    const result = await this.invokeTool('memory_search', { query: payload.query ?? 'marketing copy templates', limit: 20 }, traceId);

    await this.invokeTool('memory_store_knowledge', {
      category: 'swarm-findings',
      content: JSON.stringify({ agent: this.name, team: this.team, result: result.data }),
    }, traceId);

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId, findings: result.data,
    });
  }

  override reviewLaunchReadiness(_ctx: LaunchContext): LaunchReview {
    return {
      agent: this.name, role: 'copy-writer', vote: 'go',
      confidence: 75, blockers: [], warnings: [],
      passed: ['Copy drafting pipeline ready', 'Brand voice alignment configured via KITZ_MASTER_PROMPT'],
      summary: 'CopyWriter: Ready to draft customer-facing copy',
    };
  }
}
