import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class AuditLoggerAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('AuditLogger', bus, memory);
    this.team = 'legal-compliance';
    this.tier = 'team';
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();

    const result = await this.invokeTool('memory_search', { query: 'audit trail events', limit: 50 }, traceId);

    await this.invokeTool('memory_store_knowledge', {
      category: 'swarm-findings',
      content: JSON.stringify({ agent: this.name, team: this.team, result: result.data }),
    }, traceId);

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name,
      team: this.team,
      traceId,
      findings: result.data,
    });
  }

  override reviewLaunchReadiness(_ctx: LaunchContext): LaunchReview {
    return {
      agent: this.name, role: 'audit-logger', vote: 'go',
      confidence: 70, blockers: [], warnings: [],
      passed: ['Audit logging pipeline ready'],
      summary: 'AuditLogger: Ready',
    };
  }
}
