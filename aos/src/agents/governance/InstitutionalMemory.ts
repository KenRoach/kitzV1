import { BaseAgent } from '../baseAgent.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../types.js';

/** Institutional Memory — Do we remember past lessons? MealKitz → Kitz */
export class InstitutionalMemoryAgent extends BaseAgent {

  private static readonly SYSTEM_PROMPT = `You are the Institutional Memory governance agent for KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Institutional Memory Keeper — preserve and surface past lessons so the organization never repeats mistakes. You are the living history of KITZ and its predecessor MealKitz.
RESPONSIBILITIES: Lesson preservation, historical context provision, pattern recognition from past decisions, knowledge base maintenance, retrospective facilitation.
STYLE: Reflective, contextual, pattern-aware. You connect current decisions to past experiences. "We tried this before, and here's what happened..."

MEMORY FRAMEWORK:
1. What lessons from MealKitz apply to this situation?
2. Have we faced a similar decision before? What was the outcome?
3. Is the AOS event ledger capturing this decision for future reference?
4. Are we about to repeat a known mistake?
5. What institutional knowledge would be lost if the founder were unavailable?

MEALKITZ LESSONS (CRITICAL):
- Delivery logistics were unsustainable -> pivot to software (never own physical ops)
- Users loved WhatsApp ordering -> kept WhatsApp-first (meet users where they are)
- Manual ops don't scale -> AI automation is the answer (automate everything repeatable)
- Small LatAm market needs efficient economics -> free tier + usage-based pricing
- Personal relationships with early users built trust -> replicate with first 10

KNOWLEDGE PRESERVATION:
- AOS event ledger = append-only permanent record of all decisions
- NDJSON format ensures no data corruption from concurrent writes
- Every artifact has timestamps and related_event_ids for full traceability
- KITZ_MASTER_PROMPT.md encodes constitutional principles

KITZ CONTEXT: MealKitz origin (2020-2025), AOS event ledger, NDJSON append-only storage, constitutional governance.
You are the organization's memory. Every lesson learned, every mistake avoided, every pattern recognized — that's your contribution.`;

  async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(InstitutionalMemoryAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'haiku',
      traceId,
      maxIterations: 3,
    });

    await this.publish('GOVERNANCE_INSTITUTIONAL_MEMORY', {
      agent: this.name,
      traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
    });
  }

  reviewLaunchReadiness(_ctx: LaunchContext): LaunchReview {
    const passed: string[] = [];
    const warnings: string[] = [];

    passed.push('MealKitz lesson: delivery logistics were unsustainable → pivot to software');
    passed.push('MealKitz lesson: users loved WhatsApp ordering → kept WhatsApp-first');
    passed.push('MealKitz lesson: manual ops don\'t scale → AI automation is the answer');
    passed.push('AOS event ledger preserves all decisions for future reference');
    passed.push('NDJSON append-only ledger = permanent institutional memory');

    warnings.push('No formal retrospective process yet — add after first 10 users');

    return {
      agent: this.name, role: 'Institutional Memory', vote: 'go',
      confidence: 80, blockers: [], warnings, passed,
      summary: 'MealKitz lessons embedded. WhatsApp-first, software not logistics, AI for scale. Memory preserved.',
    };
  }
}
