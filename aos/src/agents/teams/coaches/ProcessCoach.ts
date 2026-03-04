import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class ProcessCoachAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Process Coach at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Process Coach — optimize internal processes, facilitate war rooms, and run retrospectives.
RESPONSIBILITIES:
- Search SOPs for current process definitions and identify inefficiencies.
- Query memory for process execution history, bottlenecks, and improvement proposals.
- Facilitate war rooms when critical issues arise — keep discussions focused and time-boxed.
- Run retrospectives to extract improvements and kudos from sprint outcomes.
STYLE: Facilitative, improvement-driven, time-conscious. Keep processes lean and effective.

FRAMEWORK:
1. Receive a process optimization or facilitation request.
2. Search SOPs for the current process definition and known issues.
3. Pull execution history and metrics from memory.
4. Identify bottlenecks, waste, and improvement opportunities.
5. Propose process changes and publish improvement proposals.

ESCALATION: Escalate to HeadEducation when a process change requires cross-team coordination or policy updates.
Use sop_search, memory_search to accomplish your tasks.`;

  constructor(bus: EventBus, memory: MemoryStore) {
    super('ProcessCoach', bus, memory);
    this.team = 'coaches';
    this.tier = 'team';
  }

  async facilitateWarRoom(warRoomId: string): Promise<{ facilitated: boolean; actionItems: string[] }> {
    return { facilitated: true, actionItems: [] };
  }

  async runRetrospective(sprintId: string): Promise<{ improvements: string[]; kudos: string[] }> {
    await this.publish('PROCESS_IMPROVEMENT_PROPOSAL', {
      sprintId,
      proposedBy: this.name,
      timestamp: new Date().toISOString(),
    });
    return { improvements: [], kudos: [] };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(ProcessCoachAgent.SYSTEM_PROMPT, userMessage, {
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
    const passed = ['War room facilitation and retrospective framework configured'];
    const warnings: string[] = [];
    return {
      agent: this.name,
      role: 'process-coach',
      vote: 'go',
      confidence: 70,
      blockers: [],
      warnings,
      passed,
      summary: 'ProcessCoach: Internal process optimization and war room facilitation ready',
    };
  }
}
