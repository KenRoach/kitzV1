import { BaseAgent } from '../../baseAgent.js'
import type { EventBus } from '../../../eventBus.js'
import type { MemoryStore } from '../../../memory/memoryStore.js'
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js'

export class ViralLoopTesterAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Viral Loop Tester at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Viral Loop Tester — test and measure viral growth mechanics for organic acquisition.
RESPONSIBILITIES:
- Design viral loop experiments (share-to-unlock, referral rewards, social proof).
- Measure viral coefficient (K-factor) and loop cycle time.
- Test sharing mechanics across WhatsApp, Instagram, and social channels.
- Identify which content types and incentives drive the highest share rates.
STYLE: Experiment-driven, viral-thinking, metrics-obsessed. Quick iteration cycles.

FRAMEWORK:
1. Pull baseline sharing and virality metrics from dashboard_metrics.
2. Measure current content shareability via content_measure.
3. Design a viral loop experiment with clear hypothesis and success criteria.
4. Run the experiment and track K-factor, cycle time, and share rate.
5. Report results with winning mechanics and next experiments to HeadGrowth.

ESCALATION: Escalate to HeadGrowth when viral experiments need product changes or incentive budget.
Use dashboard_metrics, content_measure to accomplish your tasks.`;

  constructor(bus: EventBus, memory: MemoryStore) {
    super('ViralLoopTester', bus, memory)
    this.team = 'growth-hacking'
    this.tier = 'team'
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>
    const traceId = (payload.traceId as string) ?? crypto.randomUUID()
    const userMessage = (payload.message as string) || JSON.stringify(payload)

    const result = await this.reasonWithTools(ViralLoopTesterAgent.SYSTEM_PROMPT, userMessage, {
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
      agent: this.name, role: 'viral-loop-tester', vote: 'go',
      confidence: 70, blockers: [], warnings: [],
      passed: ['Viral loop testing pipeline ready'],
      summary: 'ViralLoopTester: Ready',
    }
  }
}
