import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { LaunchContext, LaunchReview } from '../../../types.js';

export class MonitoringEngAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('MonitoringEng', bus, memory);
    this.team = 'devops-ci';
    this.tier = 'team';
  }

  async checkAlerts(): Promise<{ activeAlerts: number; resolved: number; pending: string[] }> {
    return { activeAlerts: 0, resolved: 0, pending: [] };
  }

  override reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const passed: string[] = [];
    const warnings = [
      'No alerting system configured (PagerDuty, Opsgenie, etc.)',
      'No structured logging pipeline (ELK, Datadog, etc.)',
      'No uptime monitoring for production services',
    ];
    return {
      agent: this.name,
      role: 'monitoring-eng',
      vote: 'conditional',
      confidence: 35,
      blockers: [],
      warnings,
      passed,
      summary: 'MonitoringEng: No alerting or monitoring infrastructure — recommend setup before launch',
    };
  }
}
