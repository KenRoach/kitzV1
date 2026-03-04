import { BaseAgent } from '../../baseAgent.js'
import type { EventBus } from '../../../eventBus.js'
import type { MemoryStore } from '../../../memory/memoryStore.js'
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js'

export class OnboardingTrackerAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Onboarding Tracker at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Onboarding Tracker — track and ensure onboarding completion for every new user.
RESPONSIBILITIES:
- Monitor onboarding step completion rates across the user base.
- Identify users stalled at specific onboarding steps and flag for intervention.
- Track time-to-complete for each onboarding milestone.
- Ensure the onboarding path leads to the breakthrough moment (user sees own data).
STYLE: Detail-oriented, completion-focused, milestone-tracking. Clear progress reports.

FRAMEWORK:
1. Pull onboarding funnel progress from dashboard_metrics.
2. Search memory for onboarding patterns and known drop-off points.
3. Identify users who are stalled and the step where they stopped.
4. Recommend targeted nudges or flow changes to unblock stalled users.
5. Report onboarding completion rates and bottlenecks to HeadGrowth.

ESCALATION: Escalate to HeadGrowth when onboarding completion drops below target or flow redesign is needed.
Use dashboard_metrics, memory_search to accomplish your tasks.`;

  constructor(bus: EventBus, memory: MemoryStore) {
    super('OnboardingTracker', bus, memory)
    this.team = 'growth-hacking'
    this.tier = 'team'
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>
    const traceId = (payload.traceId as string) ?? crypto.randomUUID()
    const userMessage = (payload.message as string) || JSON.stringify(payload)

    const result = await this.reasonWithTools(OnboardingTrackerAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'haiku', traceId, maxIterations: 3,
    })

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
    })
  }

  override reviewLaunchReadiness(_ctx: LaunchContext): LaunchReview {
    return {
      agent: this.name, role: 'onboarding-tracker', vote: 'go',
      confidence: 70, blockers: [], warnings: [],
      passed: ['Onboarding funnel tracking ready'],
      summary: 'OnboardingTracker: Ready',
    }
  }
}
