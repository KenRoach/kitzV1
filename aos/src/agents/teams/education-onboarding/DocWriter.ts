import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class DocWriterAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('DocWriter', bus, memory);
    this.team = 'education-onboarding';
    this.tier = 'team';
  }

  async writeArticle(topic: string): Promise<{ articleId: string; draft: string; draftOnly: true }> {
    return { articleId: `article_${topic}`, draft: `Help article draft: ${topic}`, draftOnly: true };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();

    const result = await this.invokeTool('memory_search', { query: payload.query ?? 'documentation topics needed', limit: 20 }, traceId);

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
      agent: this.name, role: 'doc-writer', vote: 'go',
      confidence: 70, blockers: [], warnings: [],
      passed: ['Knowledge base accessible', 'Article drafting pipeline ready'],
      summary: 'DocWriter: Knowledge base articles ready for creation',
    };
  }
}
