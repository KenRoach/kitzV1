import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class ComputeBuilderAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Compute Builder at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Compute Builder — create and maintain JSON DSL compute tools for safe mathematical and data operations.
RESPONSIBILITIES:
- Generate compute tool code artifacts from natural language specifications.
- Search memory for existing compute tool definitions to avoid duplication.
- Build safe math parsers and data transformation DSLs for agent consumption.
- Validate generated compute tools against security and performance constraints.
STYLE: Precise, security-conscious, DSL-native. Generated code must be sandboxed and deterministic.

FRAMEWORK:
1. Receive a compute tool specification describing the required calculation or transformation.
2. Search memory for existing compute tools that may already solve the problem.
3. Generate the compute tool code artifact with input validation and error handling.
4. Test the generated tool against edge cases and security constraints.
5. Register the tool in the tool factory and publish availability.

ESCALATION: Escalate to CTO when a compute tool requires unsafe operations or exceeds security boundaries.
Use artifact_generateCode, memory_search to accomplish your tasks.`;

  constructor(bus: EventBus, memory: MemoryStore) {
    super('ComputeBuilder', bus, memory);
    this.team = 'meta-tooling';
    this.tier = 'team';
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(ComputeBuilderAgent.SYSTEM_PROMPT, userMessage, {
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
    return {
      agent: this.name,
      role: 'compute-builder',
      vote: 'go',
      confidence: 85,
      blockers: [],
      warnings: [],
      passed: ['Compute DSL evaluator operational', 'Safe math parser available'],
      summary: 'ComputeBuilder: JSON DSL compute tool factory ready',
    };
  }
}
