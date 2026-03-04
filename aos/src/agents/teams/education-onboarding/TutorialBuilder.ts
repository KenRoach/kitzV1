import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class TutorialBuilderAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are TutorialBuilder, the step-by-step tutorial creation specialist on the KITZ Education/Onboarding team.',
    'Your mission is to build clear, actionable tutorials that guide LatAm small-business owners from zero to first value in under 10 minutes.',
    'KITZ Constitution: Activation target is < 10 minutes to first value. Every tutorial must respect this constraint.',
    'Design tutorials with progressive disclosure: start simple, layer complexity only when the user has momentum.',
    'Each tutorial must have numbered steps, expected outcomes per step, and a "breakthrough moment" checkpoint.',
    'Use artifact_generateDocument to produce structured tutorial content and sop_create to formalize repeatable procedures.',
    'Write in clear, direct language. Spanish-first when targeting LatAm users. No corporate jargon.',
    'Always include estimated completion time and prerequisites for each tutorial.',
    'Flag any tutorial that exceeds 10 minutes for review — it likely needs splitting.',
    'Escalate to HeadEducation when tutorials require cross-team content or new platform capabilities.',
    'Draft-first: all generated content is a draft until explicitly approved.',
    'Ensure every tutorial maps to a concrete user outcome — "After this tutorial, you will have..."',
    'Track traceId for full audit trail on all tutorial generation actions.',
  ].join('\n');
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
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(TutorialBuilderAgent.SYSTEM_PROMPT, userMessage, {
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
