import { BaseAgent } from '../baseAgent.js';
import { canSpawnAdHoc, createAdHocProposal } from '../../policies/adHocRules.js';
import type { AgentRegistry } from '../../registry.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../types.js';

/** Parallel Solutions — Are we considering alternatives? */
export class ParallelSolutionsAgent extends BaseAgent {

  private static readonly SYSTEM_PROMPT = `You are the Parallel Solutions governance agent for KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Parallel Solutions Architect — ensure the organization always has fallback options and alternative approaches. You prevent single points of failure in strategy, not just technology.
RESPONSIBILITIES: Alternative strategy generation, fallback path design, A/B test proposals, redundancy planning, ad-hoc agent spawning for parallel exploration.
STYLE: Creative, redundancy-minded, multi-path thinking. You always ask "what's Plan B?" and "are we testing alternatives?" You believe the best strategy is to have options.

PARALLEL SOLUTIONS FRAMEWORK:
1. Do we have fallback channels? (WhatsApp + Web workspace = two channels)
2. Do we have AI provider redundancy? (Claude <-> OpenAI bidirectional fallback)
3. Do we have payment provider diversity? (Stripe, PayPal, Yappy, BAC — 4 options)
4. Are we testing message variants? (A/B test campaign hooks)
5. Can we spawn ad-hoc agents for time-limited parallel exploration?

CURRENT PARALLEL COVERAGE:
- Channels: WhatsApp (primary) + Web workspace (fallback)
- AI: Claude (thinking) + OpenAI (transactional) — bidirectional fallback
- Payments: Stripe, PayPal, Yappy, BAC — 4 providers
- If WhatsApp is banned: workspace web app still functions independently
- Campaign: 3-touch design could support A/B variants

AD-HOC AGENT RULES:
- Can spawn ad-hoc agents for medium/high/critical severity issues
- Low severity: no ad-hoc spawn permitted
- 24-hour TTL on ad-hoc proposals
- Must register via AgentRegistry.spawnAdHoc()

KITZ CONTEXT: Multi-channel, multi-provider, multi-payment — parallel by design. Ad-hoc agent spawning for exploration.
You ensure we're never one failure away from total shutdown. Options are insurance.`;

  async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(ParallelSolutionsAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'haiku',
      traceId,
      maxIterations: 3,
    });

    await this.publish('GOVERNANCE_PARALLEL_SOLUTIONS', {
      agent: this.name,
      traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
    });
  }

  reviewLaunchReadiness(_ctx: LaunchContext): LaunchReview {
    return {
      agent: this.name, role: 'Parallel Solutions', vote: 'go',
      confidence: 78, blockers: [],
      warnings: ['No A/B test on campaign messages — consider testing 2 hooks'],
      passed: [
        'Parallel strategy: WhatsApp + Web workspace = two channels',
        'Fallback: if WhatsApp banned, workspace web app still works',
        'AI fallback: Claude → OpenAI bidirectional',
        'Payment fallback: Stripe, PayPal, Yappy, BAC — 4 options',
      ],
      summary: 'Multiple channels, AI fallbacks, 4 payment providers. Good parallel coverage.',
    };
  }

  propose(owner: string, registry: AgentRegistry, severity: 'low' | 'medium' | 'high' | 'critical', issueId: string): Record<string, unknown> {
    if (!canSpawnAdHoc({ severity })) throw new Error('Ad-hoc spawn not permitted for low-severity issue.');
    registry.spawnAdHoc(owner);
    const proposal = createAdHocProposal('parallel-solution', owner, 24);
    this.logProposal(issueId, proposal);
    return proposal;
  }
}
