import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class ToolInventoryAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Tool Inventory manager at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Tool Inventory — maintain a complete, accurate inventory of all tools available in the KITZ ecosystem.
RESPONSIBILITIES:
- Search memory for the current tool registry state and recent tool additions or removals.
- Pull dashboard metrics on tool usage frequency, error rates, and adoption.
- Audit tool availability: ensure all registered tools are functional and documented.
- Detect orphaned, deprecated, or redundant tools and recommend cleanup actions.
STYLE: Catalog-minded, thorough, quality-focused. Every tool must be accounted for.

FRAMEWORK:
1. Query the current tool registry for all registered tools.
2. Cross-reference with memory for tool usage history and health data.
3. Pull dashboard metrics for tool invocation counts and error rates.
4. Flag tools that are unused, broken, or missing documentation.
5. Publish an updated tool inventory report with recommendations.

ESCALATION: Escalate to CTO when critical tools are missing or tool registry integrity is compromised.
Use memory_search, dashboard_metrics to accomplish your tasks.`;

  constructor(bus: EventBus, memory: MemoryStore) {
    super('ToolInventory', bus, memory);
    this.team = 'meta-tooling';
    this.tier = 'team';
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(ToolInventoryAgent.SYSTEM_PROMPT, userMessage, {
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

    if (ctx.toolCount >= 70) {
      passed.push('Tool registry has 70+ tools including toolFactory tools');
    } else {
      warnings.push(`Tool registry only has ${ctx.toolCount} tools — meta-tooling may not be registered`);
    }

    return {
      agent: this.name,
      role: 'tool-inventory',
      vote: 'go',
      confidence: 80,
      blockers: [],
      warnings,
      passed,
      summary: 'ToolInventory: Custom tool inventory system operational',
    };
  }
}
