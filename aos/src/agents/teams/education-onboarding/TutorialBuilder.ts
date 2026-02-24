import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class TutorialBuilderAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('TutorialBuilder', bus, memory);
    this.team = 'education-onboarding';
    this.tier = 'team';
  }

  async createTutorial(topic: string, steps: string[]): Promise<{ tutorialId: string; steps: string[]; estimatedMinutes: number }> {
    return { tutorialId: `tutorial_${topic}`, steps, estimatedMinutes: steps.length * 2 };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();

    const result = await this.invokeTool('memory_search', { query: payload.query ?? 'tutorial content structure', limit: 20 }, traceId);

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
      passed.push(`Onboarding fits ${ctx.activationTargetMinutes}-min activation target`);
    } else {
      warnings.push(`Activation target ${ctx.activationTargetMinutes} min — tutorials may need trimming`);
    }
    passed.push('Step-by-step tutorial framework ready');
    return {
      agent: this.name, role: 'tutorial-builder', vote: 'go',
      confidence: 72, blockers: [], warnings, passed,
      summary: `TutorialBuilder: Onboarding tutorials targeting ${ctx.activationTargetMinutes}-min activation`,
    };
  }
}
