import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class MonitoringEngAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('MonitoringEng', bus, memory);
    this.team = 'devops-ci';
    this.tier = 'team';
  }

  async checkAlerts(): Promise<{ activeAlerts: number; resolved: number; pending: string[] }> {
    return { activeAlerts: 0, resolved: 0, pending: [] };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();

    const result = await this.invokeTool('dashboard_metrics', { ...payload }, traceId);

    await this.invokeTool('memory_store_knowledge', {
      category: 'swarm-findings',
      content: JSON.stringify({ agent: this.name, team: this.team, result: result.data }),
    }, traceId);

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId, findings: result.data,
    });
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
