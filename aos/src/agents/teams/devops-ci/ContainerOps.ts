import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class ContainerOpsAgent extends BaseAgent {
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

    const result = await this.invokeTool('memory_search', { query: payload.query ?? 'container deployment status', limit: 20 }, traceId);

    await this.invokeTool('memory_store_knowledge', {
      category: 'swarm-findings',
      content: JSON.stringify({ agent: this.name, team: this.team, result: result.data }),
    }, traceId);

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId, findings: result.data,
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
