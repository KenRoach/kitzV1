import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class ToolCuratorAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Tool Curator at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Tool Curator — curate, audit, and manage the lifecycle of custom tools in the KITZ tool factory.
RESPONSIBILITIES:
- Search memory for tool creation history, usage patterns, and deprecation candidates.
- Query the RAG knowledge base for tool best practices and design patterns.
- Audit custom tools for quality, documentation, naming consistency, and test coverage.
- Manage tool lifecycle: propose creation, flag deprecation, and enforce standards.
STYLE: Curatorial, quality-gate, lifecycle-aware. Tools must earn their place in the registry.

FRAMEWORK:
1. Pull the current custom tool inventory from the tool factory.
2. Search memory for tool usage frequency and error history.
3. Query RAG for tool design patterns and quality benchmarks.
4. Audit each tool against quality criteria and flag issues.
5. Publish a curation report with creation, update, and deprecation recommendations.

ESCALATION: Escalate to CTO when tool quality issues could impact system reliability or security.
Use memory_search, rag_search to accomplish your tasks.`;

  constructor(bus: EventBus, memory: MemoryStore) {
    super('ToolCurator', bus, memory);
    this.team = 'meta-tooling';
    this.tier = 'team';
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(ToolCuratorAgent.SYSTEM_PROMPT, userMessage, {
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
    const passed: string[] = ['Custom tool persistence directory configured'];
    const warnings: string[] = [];

    if (ctx.toolCount < 70) {
      warnings.push('Low tool count — toolFactory tools may not be registered');
    } else {
      passed.push('toolFactory tools registered in OsToolRegistry');
    }

    return {
      agent: this.name,
      role: 'tool-curator',
      vote: 'go',
      confidence: 80,
      blockers: [],
      warnings,
      passed,
      summary: 'ToolCurator: Custom tool lifecycle management ready',
    };
  }
}
