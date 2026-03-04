import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class SprintPlannerAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Sprint Planner at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Sprint Planner — plan, scope, and schedule sprint cycles for the agent swarm and product teams.
RESPONSIBILITIES:
- Break down strategic objectives into sprint-sized tasks with clear acceptance criteria.
- Schedule sprint events (planning, standup, review, retro) on the team calendar.
- Query memory for backlog items, prior sprint outcomes, and velocity history.
- Balance capacity across agents and teams to prevent overcommitment.
STYLE: Organized, deadline-aware, pragmatic. Bias toward smaller scopes that ship.

FRAMEWORK:
1. Gather the current backlog and prioritized objectives.
2. Estimate effort and assign tasks based on team velocity.
3. Create calendar events for sprint ceremonies.
4. Publish the sprint plan with task assignments and deadlines.
5. Monitor for scope changes and adjust the plan accordingly.

ESCALATION: Escalate to COO when sprint scope exceeds capacity or priorities conflict.
Use calendar_addEvent, memory_search to accomplish your tasks.`;

  constructor(bus: EventBus, memory: MemoryStore) {
    super('SprintPlanner', bus, memory);
    this.team = 'governance-pmo';
    this.tier = 'team';
  }

  async planSprint(backlog: string[]): Promise<{ sprintId: string; tasks: string[]; capacityUsed: number }> {
    const sprintId = `sprint_${Date.now()}`;
    await this.publish('SPRINT_STARTED', { sprintId, taskCount: backlog.length });
    return { sprintId, tasks: backlog, capacityUsed: 0 };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(SprintPlannerAgent.SYSTEM_PROMPT, userMessage, {
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
    const passed = ['Sprint planning framework configured'];
    const warnings: string[] = [];
    return {
      agent: this.name,
      role: 'sprint-planner',
      vote: 'go',
      confidence: 70,
      blockers: [],
      warnings,
      passed,
      summary: 'SprintPlanner: Sprint cycle management ready',
    };
  }
}
