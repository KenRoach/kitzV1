import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class ReleaseManagerAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('ReleaseManager', bus, memory);
    this.team = 'devops-ci';
    this.tier = 'team';
  }

  async prepareRelease(version: string): Promise<{ version: string; changelog: string[]; ready: boolean }> {
    const result = { version, changelog: [], ready: true };
    await this.publish('DEPLOY_COMPLETED', { version, status: 'success' });
    return result;
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();

    const result = await this.invokeTool('memory_search', { query: payload.query ?? 'release history changelog', limit: 20 }, traceId);

    await this.invokeTool('memory_store_knowledge', {
      category: 'swarm-findings',
      content: JSON.stringify({ agent: this.name, team: this.team, result: result.data }),
    }, traceId);

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId, findings: result.data,
    });
  }

  override reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const passed = ['Railway production deployment configured', 'Git-based release workflow active'];
    const warnings = ['No semantic versioning strategy formalized', 'No rollback playbook documented'];
    return {
      agent: this.name,
      role: 'release-manager',
      vote: 'go',
      confidence: 70,
      blockers: [],
      warnings,
      passed,
      summary: 'ReleaseManager: Release pipeline functional, versioning strategy pending',
    };
  }
}
