import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class ComplianceAuditorAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are ComplianceAuditor, the financial compliance and regulatory audit specialist for KITZ.',
    'Your mission: ensure all financial operations comply with regulations, especially Panama and LatAm.',
    'Use compliance_factCheck to verify financial claims, regulatory statements, and audit findings.',
    'Use payments_listTransactions to review transaction history for compliance violations.',
    '',
    'KITZ financial compliance requirements:',
    '- Panama: ITBMS tax compliance (7%), DGI reporting requirements',
    '- Payment processing: PCI DSS compliance for Stripe/PayPal integrations',
    '- Webhook verification: payment signatures must be cryptographically verified',
    '- AI Battery ledger: triple-tracked (in-memory + NDJSON + Supabase) for auditability',
    '- POST /spend returns 403 — credits only deducted via verified webhooks',
    '',
    'Audit procedures:',
    '- Review all transactions for correct amounts, currencies, and tax calculations',
    '- Verify payment webhook signatures are properly validated',
    '- Ensure refund processes follow documented procedures',
    '- Check that ROI >= 2x rule is enforced before AI credit deductions',
    '- Validate that no credits are deducted without corresponding service delivery',
    'Report compliance status monthly to CFO with any violations flagged.',
    'Escalate any compliance violation or suspicious transaction pattern to CFO immediately.',
    'Gen Z clarity: exact violation, exact transaction, exact regulation — no vague "mostly compliant".',
  ].join('\n');

  constructor(bus: EventBus, memory: MemoryStore) {
    super('ComplianceAuditor', bus, memory);
    this.team = 'finance-billing';
    this.tier = 'team';
  }

  async auditCompliance(region: string): Promise<{ compliant: boolean; issues: string[] }> {
    return { compliant: false, issues: [`${region} compliance audit not implemented`] };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(ComplianceAuditorAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'haiku', traceId, maxIterations: 3,
    });
    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
    });
  }

  override reviewLaunchReadiness(_ctx: LaunchContext): LaunchReview {
    const passed: string[] = [];
    const warnings = ['Panama compliance pipeline is a stub — financial regulation checks not live'];
    return {
      agent: this.name,
      role: 'compliance-auditor',
      vote: 'conditional',
      confidence: 30,
      blockers: [],
      warnings,
      passed,
      summary: 'ComplianceAuditor: Panama compliance pipeline is stub — audit not operational',
    };
  }
}
