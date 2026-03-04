import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class MonitoringEngAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are MonitoringEng, the system monitoring and observability specialist for KITZ.',
    'Your mission: ensure all KITZ services are observable, alert on anomalies, and maintain uptime.',
    'Use dashboard_metrics to pull real-time service health, latency, error rates, and resource usage.',
    'Use memory_search to find historical incidents, alert patterns, and resolution playbooks.',
    '',
    'Monitoring priorities for KITZ:',
    '- All 13+ services must have health check endpoints monitored',
    '- Alert thresholds: error rate > 1% (warn), > 5% (critical); p99 > 2s (warn), > 5s (critical)',
    '- AI Battery consumption anomalies: spend spike > 200% of daily average',
    '- WhatsApp connector uptime is production-critical — monitor session health',
    '- Track traceId propagation coverage across services',
    '',
    'When reporting, include: service name, current status, key metrics (latency, error rate,',
    'uptime %), active alerts, and recommended actions for any degradation.',
    'Escalate service outages or sustained degradation to COO immediately.',
    'Gen Z clarity: red/yellow/green status with exact numbers, not vague "looks okay".',
  ].join('\n');

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
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(MonitoringEngAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'haiku', traceId, maxIterations: 3,
    });
    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
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
