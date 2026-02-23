import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { LaunchContext, LaunchReview } from '../../../types.js';

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
