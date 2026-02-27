import { BaseAgent } from '../baseAgent.js';
import type { AOSEvent, LaunchContext, LaunchReview } from '../../types.js';

export type ReviewDecision = 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT';

export interface ResponseReviewResult {
  approved: boolean;
  revised?: string;
  flags: string[];
  confidence: number;
}

const LLM_HUB_URL = process.env.LLM_HUB_URL || 'http://localhost:4010';

/** Reviewer — Final code/config review. The last check before CEO decides. */
export class ReviewerAgent extends BaseAgent {

  /**
   * Review an agent's response before it reaches the user.
   * Checks: relevance, security, formatting, draft-first, compliance.
   * Uses LLM Hub (Haiku tier) for evaluation, with rule-based fallback.
   */
  async reviewResponse(
    agentName: string,
    userMessage: string,
    agentResponse: string,
    toolsUsed: string[],
    traceId: string,
  ): Promise<ResponseReviewResult> {
    const flags: string[] = [];

    // Rule-based fast checks (no LLM needed)
    // 1. Security: check for exposed secrets/keys
    const secretPatterns = /\b(sk-[a-zA-Z0-9]{20,}|AKIA[A-Z0-9]{16}|password\s*[:=]\s*\S+|api[_-]?key\s*[:=]\s*\S+)\b/i;
    if (secretPatterns.test(agentResponse)) {
      flags.push('security: potential secret/key exposure detected');
    }

    // 2. Draft-first: if write tools were used, verify draft language
    const writeTools = ['crm_createContact', 'crm_updateContact', 'orders_createOrder', 'orders_updateOrder',
      'outbound_sendWhatsApp', 'outbound_sendEmail', 'email_compose', 'broadcast_send'];
    const usedWriteTools = toolsUsed.filter(t => writeTools.includes(t));
    if (usedWriteTools.length > 0 && !agentResponse.toLowerCase().includes('draft') && !agentResponse.toLowerCase().includes('approval')) {
      flags.push('draft-first: write operation without draft/approval language');
    }

    // 3. Empty or very short response
    if (agentResponse.trim().length < 5) {
      flags.push('quality: response is empty or too short');
    }

    // Try LLM-based review for deeper quality check
    let llmReview: { approved: boolean; revised?: string; flags?: string[] } | null = null;
    try {
      const reviewPrompt = `You are the KITZ Reviewer agent. Check this response for quality:

USER ASKED: "${userMessage.slice(0, 300)}"
AGENT (${agentName}) RESPONDED: "${agentResponse.slice(0, 500)}"
TOOLS USED: ${toolsUsed.join(', ') || 'none'}

Checklist:
1. Does the response answer what the user asked?
2. Does it expose security-sensitive data (API keys, passwords, internal IDs)?
3. Is it appropriately concise for WhatsApp delivery?
4. Does it follow draft-first for write operations?
5. Is it compliant with KITZ constitutional governance (no fabrication, no spending)?

Respond with ONLY valid JSON:
{"approved": true/false, "revised": "corrected response if needed", "flags": ["issue descriptions"]}`;

      const res = await fetch(`${LLM_HUB_URL}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-trace-id': traceId },
        body: JSON.stringify({ system: 'You are a quality reviewer.', prompt: reviewPrompt, tier: 'haiku', taskType: 'classification' }),
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        const data = (await res.json()) as { text?: string };
        const jsonMatch = data.text?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          llmReview = JSON.parse(jsonMatch[0]);
        }
      }
    } catch {
      // LLM review failed — rely on rule-based checks only
    }

    // Merge LLM flags with rule-based flags
    if (llmReview?.flags) {
      flags.push(...llmReview.flags);
    }

    const approved = flags.length === 0 && (llmReview?.approved ?? true);
    const confidence = llmReview ? (approved ? 90 : 60) : (flags.length === 0 ? 80 : 40);

    return {
      approved,
      revised: llmReview?.revised,
      flags,
      confidence,
    };
  }

  reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const passed: string[] = [];
    const warnings: string[] = [];

    // Run the checklist
    const checklist = {
      alignment: ctx.draftFirstEnforced,
      security: !ctx.killSwitch && ctx.rateLimitingEnabled,
      ux: ctx.semanticRouterActive && ctx.toolCount >= 50,
      financial: !ctx.batteryDepleted && ctx.pricingTiersDefined >= 2,
      compliance: ctx.draftFirstEnforced,
    };

    const allPassing = Object.values(checklist).every(Boolean);

    for (const [check, passing] of Object.entries(checklist)) {
      if (passing) passed.push(`Checklist: ${check} — PASS`);
      else warnings.push(`Checklist: ${check} — NEEDS ATTENTION`);
    }

    return {
      agent: this.name, role: 'Reviewer', vote: allPassing ? 'go' : 'conditional',
      confidence: allPassing ? 88 : 60, blockers: [], warnings, passed,
      summary: allPassing
        ? 'All review checks pass. Alignment, security, UX, financial, compliance — GO.'
        : `Review: ${warnings.length} items need attention. ${passed.length} items pass.`,
    };
  }

  review(event: AOSEvent): { decision: ReviewDecision; checklist: Record<string, boolean> } {
    const checklist = {
      alignment: true,
      security: !String(event.payload.action ?? '').includes('security_change') || Boolean((event.payload.approvals as string[] | undefined)?.includes('Security')),
      ux: true,
      financial: true,
      compliance: true,
    };
    const decision: ReviewDecision = Object.values(checklist).every(Boolean) ? 'APPROVE' : 'REQUEST_CHANGES';
    return { decision, checklist };
  }
}
