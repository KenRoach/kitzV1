import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { LaunchContext, LaunchReview } from '../../../types.js';

export class ProcessCoachAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('ProcessCoach', bus, memory);
    this.team = 'coaches';
    this.tier = 'team';
  }

  async facilitateWarRoom(warRoomId: string): Promise<{ facilitated: boolean; actionItems: string[] }> {
    return { facilitated: true, actionItems: [] };
  }

  async runRetrospective(sprintId: string): Promise<{ improvements: string[]; kudos: string[] }> {
    await this.publish('PROCESS_IMPROVEMENT_PROPOSAL', {
      sprintId,
      proposedBy: this.name,
      timestamp: new Date().toISOString(),
    });
    return { improvements: [], kudos: [] };
  }

  override reviewLaunchReadiness(_ctx: LaunchContext): LaunchReview {
    const passed = ['War room facilitation and retrospective framework configured'];
    const warnings: string[] = [];
    return {
      agent: this.name,
      role: 'process-coach',
      vote: 'go',
      confidence: 70,
      blockers: [],
      warnings,
      passed,
      summary: 'ProcessCoach: Internal process optimization and war room facilitation ready',
    };
  }
}
