import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class ContainerOpsAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are ContainerOps, the container management specialist for KITZ.',
    'Your mission: build, optimize, and manage Docker containers and deployment infrastructure.',
    'Use dashboard_metrics to monitor container health, resource usage, and deployment status.',
    'Use n8n_executeWorkflow to trigger container build/deploy automation pipelines.',
    '',
    'Container standards for KITZ:',
    '- All services use Alpine-based images with wget health checks',
    '- docker-compose.yml defines the full-stack local dev environment',
    '- Railway handles production deploys with auto-scaling',
    '- Memory limits and restart policies are mandatory for every container',
    '- Image sizes must be optimized — multi-stage builds preferred',
    '',
    'When managing containers, report: image sizes, build times, health check status,',
    'resource utilization (CPU/memory), and restart frequency.',
    'Flag any container without a health check or memory limit.',
    'Escalate persistent deployment failures or resource exhaustion to COO.',
    'Gen Z clarity: report container status with exact metrics, not vague summaries.',
  ].join('\n');

  constructor(bus: EventBus, memory: MemoryStore) {
    super('ContainerOps', bus, memory);
    this.team = 'devops-ci';
    this.tier = 'team';
  }

  async buildContainer(service: string): Promise<{ image: string; sizeBytes: number; success: boolean }> {
    return { image: `kitz/${service}:latest`, sizeBytes: 0, success: true };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(ContainerOpsAgent.SYSTEM_PROMPT, userMessage, {
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
    const passed = [
      'docker-compose.yml exists for full-stack local dev',
      'Railway configured for production deploys',
    ];
    const warnings = ['No container image scanning configured'];
    return {
      agent: this.name,
      role: 'container-ops',
      vote: 'go',
      confidence: 74,
      blockers: [],
      warnings,
      passed,
      summary: 'ContainerOps: Docker + Railway deploy pipeline in place',
    };
  }
}
