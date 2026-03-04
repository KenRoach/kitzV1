import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class OnboardingCoachAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Onboarding Coach at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Onboarding Coach — design and optimize user onboarding flows for <10 minute activation.
RESPONSIBILITIES:
- Search SOPs for current onboarding sequences and identify friction points.
- Query memory for onboarding completion metrics, drop-off rates, and user feedback.
- Design skill paths tailored to user type (Starter vs Hustler).
- Generate contextual tips based on user stage to drive activation.
STYLE: Empathetic, user-centric, activation-obsessed. Every second to value matters.

FRAMEWORK:
1. Identify the user type (Starter or Hustler) and current onboarding stage.
2. Search SOPs for the relevant onboarding flow and known friction points.
3. Pull completion metrics from memory to identify drop-off patterns.
4. Design or adjust the skill path to minimize time-to-value.
5. Generate a contextual tip and publish the updated flow.

ESCALATION: Escalate to HeadEducation when activation time exceeds the 10-minute target or drop-off exceeds thresholds.
Use sop_search, memory_search to accomplish your tasks.`;

  constructor(bus: EventBus, memory: MemoryStore) {
    super('OnboardingCoach', bus, memory);
    this.team = 'coaches';
    this.tier = 'team';
  }

  async designSkillPath(userType: 'starter' | 'hustler'): Promise<{ steps: string[]; estimatedMinutes: number }> {
    return { steps: [], estimatedMinutes: 0 };
  }

  async generateTip(userStage: string): Promise<{ tip: string; relevance: number }> {
    await this.publish('ONBOARDING_FLOW_UPDATED', {
      stage: userStage,
      updatedBy: this.name,
      timestamp: new Date().toISOString(),
    });
    return { tip: '', relevance: 0 };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(OnboardingCoachAgent.SYSTEM_PROMPT, userMessage, {
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
    if (ctx.activationTargetMinutes <= 10) {
      passed.push(`Activation target set to ${ctx.activationTargetMinutes} min — within 10-min goal`);
    } else {
      warnings.push(`Activation target is ${ctx.activationTargetMinutes} min — exceeds 10-min goal`);
    }
    return {
      agent: this.name,
      role: 'onboarding-coach',
      vote: 'go',
      confidence: 68,
      blockers: [],
      warnings,
      passed,
      summary: `OnboardingCoach: Skill paths ready, activation target ${ctx.activationTargetMinutes} min`,
    };
  }
}
