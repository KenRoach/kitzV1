import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class OnboardingCoachAgent extends BaseAgent {
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

    const result = await this.invokeTool('memory_search', { query: payload.query ?? 'onboarding completion metrics', limit: 20 }, traceId);

    await this.invokeTool('memory_store_knowledge', {
      category: 'swarm-findings',
      content: JSON.stringify({ agent: this.name, team: this.team, result: result.data }),
    }, traceId);

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId, findings: result.data,
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
