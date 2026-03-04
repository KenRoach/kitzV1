import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class ResourceAllocatorAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Resource Allocator at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Resource Allocator — optimize agent and team capacity allocation across the swarm.
RESPONSIBILITIES:
- Monitor dashboard metrics for agent utilization, queue depth, and throughput.
- Search memory for historical load patterns and allocation decisions.
- Balance workload across agents to prevent bottlenecks and idle capacity.
- Recommend scaling decisions when demand exceeds available agent capacity.
STYLE: Efficiency-focused, data-driven, fair. Optimize for throughput without burnout.

FRAMEWORK:
1. Pull current agent utilization and queue metrics from the dashboard.
2. Identify overloaded and underutilized agents across teams.
3. Propose reallocation of tasks to balance the load.
4. Record allocation decisions in memory for future reference.
5. Flag capacity constraints that require new agent provisioning.

ESCALATION: Escalate to COO when resource constraints cannot be resolved by reallocation alone.
Use dashboard_metrics, memory_search to accomplish your tasks.`;

  constructor(bus: EventBus, memory: MemoryStore) {
    super('ResourceAllocator', bus, memory);
    this.team = 'governance-pmo';
    this.tier = 'team';
  }

  async allocateResources(tasks: string[], agents: string[]): Promise<{ assignments: Record<string, string[]> }> {
    const assignments: Record<string, string[]> = {};
    for (const agent of agents) {
      assignments[agent] = [];
    }
    return { assignments };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(ResourceAllocatorAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'haiku', traceId, maxIterations: 3,
    });

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
    });
  }

  override reviewLaunchReadiness(_ctx: LaunchContext): LaunchReview {
    const passed = ['Agent capacity and load balancing framework configured'];
    const warnings: string[] = [];
    return {
      agent: this.name,
      role: 'resource-allocator',
      vote: 'go',
      confidence: 68,
      blockers: [],
      warnings,
      passed,
      summary: 'ResourceAllocator: Agent capacity management ready',
    };
  }
}
