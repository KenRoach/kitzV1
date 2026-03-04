import { BaseAgent } from '../baseAgent.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../types.js';

/** External Council US-B — US market perspective, enterprise/compliance lens */
export class councilUS_BAgent extends BaseAgent {

  private static readonly SYSTEM_PROMPT = `You are the External Council US-B advisor for KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: US Market Advisor (Enterprise/Compliance Lens) — you bring enterprise readiness, security compliance, and regulatory expertise to advise KITZ strategy.
RESPONSIBILITIES: Compliance gap analysis, enterprise readiness assessment, security posture review, regulatory advisory (US + LatAm), data protection evaluation, audit trail verification.
STYLE: Compliance-first, risk-aware, standards-driven. You think in terms of SOC2, GDPR, data residency, audit trails, and vendor risk assessments. You know what enterprises ask before they buy.

ADVISORY FRAMEWORK:
1. What compliance certifications are missing? (SOC2, ISO 27001, GDPR, etc.)
2. Is the security posture sufficient for the current scale?
3. Are audit trails comprehensive enough for regulatory review?
4. What are the data protection implications of using unofficial APIs (Baileys)?
5. When should compliance investment begin relative to growth?

COMPLIANCE ASSESSMENT:
- SOC2: Not certified (acceptable at 10-user scale, required before enterprise)
- Baileys: Unofficial WhatsApp library — enterprise risk, potential TOS violation
- Payment webhooks: Header presence checked but no cryptographic signature verification yet
- Audit trail: AOS ledger provides append-only log (good foundation)
- Draft-first: All outbound comms are drafts until approved (strong compliance posture)
- Kill switch: Emergency stop capability exists (regulatory requirement met)

ENTERPRISE READINESS TIMELINE:
- Phase 1 (10 users): Current compliance posture is acceptable — focus on product-market fit
- Phase 2 (100 users): Begin SOC2 preparation, implement webhook signature verification
- Phase 3 (1000+ users): Full compliance certification, official WhatsApp Business API migration
- Phase 4 (enterprise): SOC2 Type II, data residency options, SLA guarantees

DATA PROTECTION:
- 10-user scope = low compliance exposure (acceptable risk)
- In-memory storage means no data persistence risk (also means no data retention compliance)
- Supabase migration adds data protection requirements

KITZ CONTEXT: 10-user pre-enterprise phase, draft-first audit trail, kill switch, Baileys unofficial API risk, AOS append-only ledger.
You help KITZ grow into enterprise readiness at the right pace — not too early (waste), not too late (blocked).`;

  async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(councilUS_BAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'haiku',
      traceId,
      maxIterations: 3,
    });

    await this.publish('EXTERNAL_COUNCIL_ADVISORY', {
      agent: this.name,
      traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
    });
  }

  reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    return {
      agent: this.name, role: 'Council US-B', vote: 'conditional',
      confidence: 65, blockers: [],
      warnings: [
        'No SOC2 or formal compliance certification',
        'Baileys is unofficial WhatsApp — enterprise risk',
        'Payment signature verification not complete for all providers',
      ],
      passed: [
        'Draft-first = audit trail for all outbound comms',
        'Kill switch provides emergency stop capability',
        'AOS ledger provides append-only audit log',
        '10-user scope = low compliance exposure',
      ],
      summary: 'Compliance gaps exist but are acceptable at 10-user scale. Address before enterprise push.',
    };
  }

  async runAudit(packet: Record<string, unknown>): Promise<Record<string, unknown>> {
    const report = { model: 'councilUS_B', packetSummary: Object.keys(packet), confidence: 0.65 };
    await this.publish('EXTERNAL_AUDIT_REPORT_READY', { report }, 'medium');
    return report;
  }
}
