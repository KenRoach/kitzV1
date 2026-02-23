import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { LaunchContext, LaunchReview } from '../../../types.js';

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
