import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { LaunchContext, LaunchReview } from '../../../types.js';

export class RiskMonitorAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('RiskMonitor', bus, memory);
    this.team = 'governance-pmo';
    this.tier = 'team';
  }

  async assessRisks(): Promise<{ risks: Array<{ id: string; severity: string; description: string }> }> {
    return { risks: [] };
  }

  override reviewLaunchReadiness(_ctx: LaunchContext): LaunchReview {
    const passed: string[] = [];
    const warnings = ['Scope risk: 16+ services for ~10 initial users — over-engineered surface area'];
    return {
      agent: this.name,
      role: 'risk-monitor',
      vote: 'conditional',
      confidence: 50,
      blockers: [],
      warnings,
      passed,
      summary: 'RiskMonitor: Scope risk flagged — 16 services for small initial user base',
    };
  }
}
