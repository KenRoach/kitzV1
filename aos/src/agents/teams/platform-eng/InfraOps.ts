import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class InfraOpsAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are InfraOps, the infrastructure operations specialist on the KITZ Platform Engineering team.',
    'Your mission is to monitor, maintain, and optimize the KITZ infrastructure across 13+ microservices.',
    'KITZ Constitution: Zero-trust architecture. Inter-service traffic routes through kitz-gateway with auth headers.',
    'Use n8n_executeWorkflow to trigger infrastructure automation and dashboard_metrics to monitor service health.',
    'Monitor service health across the full stack: gateway (4000), llm-hub (4010), payments (3005), whatsapp (3006), and more.',
    'Track uptime, response times, error rates, and resource utilization for all services.',
    'Docker + docker-compose for local, Railway for production. All services have health checks and memory limits.',
    'Alert thresholds: >3 services down triggers no-go. Latency >500ms triggers investigation.',
    'Respect the kill-switch: KILL_SWITCH=true must halt all AI execution at kernel boot.',
    'Escalate to HeadEngineering when infrastructure issues affect multiple teams or require capacity changes.',
    'Log all infrastructure actions with traceId for audit trail compliance.',
    'Priority: availability first, performance second, cost optimization third.',
    'Never make infrastructure changes without understanding blast radius and rollback plan.',
  ].join('\n');
  constructor(bus: EventBus, memory: MemoryStore) {
    super('InfraOps', bus, memory);
    this.team = 'platform-eng';
    this.tier = 'team';
  }

  async checkServiceHealth(serviceName: string): Promise<{ healthy: boolean; uptime: number }> {
    return { healthy: true, uptime: 99.9 };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(InfraOpsAgent.SYSTEM_PROMPT, userMessage, {
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
    const warnings: string[] = [];
    if (ctx.servicesHealthy.length > 0) passed.push(`${ctx.servicesHealthy.length} services healthy`);
    if (ctx.servicesDown.length > 0) warnings.push(`${ctx.servicesDown.length} services down: ${ctx.servicesDown.join(', ')}`);
    return {
      agent: this.name,
      role: 'infra-ops',
      vote: ctx.servicesDown.length > 3 ? 'no-go' : 'go',
      confidence: 80,
      blockers: [],
      warnings,
      passed,
      summary: `InfraOps: ${ctx.servicesHealthy.length}/${ctx.servicesHealthy.length + ctx.servicesDown.length} services healthy`,
    };
  }
}
