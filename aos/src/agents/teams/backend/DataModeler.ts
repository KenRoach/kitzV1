import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { LaunchContext, LaunchReview } from '../../../types.js';

export class DataModelerAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('DataModeler', bus, memory);
    this.team = 'backend';
    this.tier = 'team';
  }

  async modelSchema(entity: string): Promise<{ entity: string; fields: string[]; relations: string[] }> {
    return { entity, fields: [], relations: [] };
  }

  override reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const passed = ['Shared contracts in kitz-schemas'];
    const warnings = [
      'Most services use in-memory Maps — DB schemas incomplete',
      'Real DB persistence only in kitz_os (Supabase)',
    ];
    return {
      agent: this.name,
      role: 'data-modeler',
      vote: 'conditional',
      confidence: 55,
      blockers: [],
      warnings,
      passed,
      summary: 'DataModeler: Schemas defined in kitz-schemas but DB persistence incomplete',
    };
  }
}
