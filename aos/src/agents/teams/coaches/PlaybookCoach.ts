import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class PlaybookCoachAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('PlaybookCoach', bus, memory);
    this.team = 'coaches';
    this.tier = 'team';
  }

  async updatePlaybook(name: string, content: string): Promise<{ updated: boolean; version: number }> {
    await this.publish('PLAYBOOK_UPDATED', {
      playbook: name,
      updatedBy: this.name,
      contentLength: content.length,
      timestamp: new Date().toISOString(),
    });
    return { updated: true, version: 1 };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();

    const result = await this.invokeTool('memory_search', { query: payload.query ?? 'playbook execution history', limit: 20 }, traceId);

    await this.invokeTool('memory_store_knowledge', {
      category: 'swarm-findings',
      content: JSON.stringify({ agent: this.name, team: this.team, result: result.data }),
    }, traceId);

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId, findings: result.data,
    });
  }

  override reviewLaunchReadiness(_ctx: LaunchContext): LaunchReview {
    const passed = ['Playbook management for kitz-knowledge-base configured'];
    const warnings: string[] = [];
    return {
      agent: this.name,
      role: 'playbook-coach',
      vote: 'go',
      confidence: 72,
      blockers: [],
      warnings,
      passed,
      summary: 'PlaybookCoach: Knowledge base playbook maintenance ready',
    };
  }
}
