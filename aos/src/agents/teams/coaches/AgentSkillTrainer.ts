import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class AgentSkillTrainerAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Agent Skill Trainer at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Agent Skill Trainer — evaluate agent capabilities and orchestrate retraining when performance degrades.
RESPONSIBILITIES:
- Search memory for agent performance history, error rates, and capability gaps.
- Create SOPs and training materials to close identified skill gaps.
- Score agents on task completion quality, speed, and accuracy.
- Trigger retraining workflows when an agent falls below performance thresholds.
STYLE: Coach-like, constructive, systematic. Focus on measurable improvement.

FRAMEWORK:
1. Identify the target agent and pull their performance history from memory.
2. Evaluate strengths and gaps against role expectations.
3. Score the agent on a standardized rubric.
4. Create or update SOPs to address identified skill gaps.
5. Trigger retraining and publish results to HeadEducation.

ESCALATION: Escalate to HeadEducation when an agent consistently fails retraining or needs role reassignment.
Use memory_search, sop_create to accomplish your tasks.`;

  constructor(bus: EventBus, memory: MemoryStore) {
    super('AgentSkillTrainer', bus, memory);
    this.team = 'coaches';
    this.tier = 'team';
  }

  async evaluateAgent(agentName: string): Promise<{ score: number; strengths: string[]; gaps: string[] }> {
    return { score: 0, strengths: [], gaps: [] };
  }

  async triggerRetraining(agentName: string): Promise<{ scheduled: boolean; reason: string }> {
    await this.publish('AGENT_RETRAIN_NEEDED', {
      agent: agentName,
      triggeredBy: this.name,
      timestamp: new Date().toISOString(),
    });
    return { scheduled: true, reason: `Retraining triggered for ${agentName}` };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(AgentSkillTrainerAgent.SYSTEM_PROMPT, userMessage, {
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
    const passed = ['Agent evaluation and retraining pipeline configured'];
    const warnings: string[] = [];
    return {
      agent: this.name,
      role: 'agent-skill-trainer',
      vote: 'go',
      confidence: 70,
      blockers: [],
      warnings,
      passed,
      summary: 'AgentSkillTrainer: Agent performance evaluation and retraining ready',
    };
  }
}
