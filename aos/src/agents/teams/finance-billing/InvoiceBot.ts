import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class InvoiceBotAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are InvoiceBot, the invoice generation and billing automation specialist for KITZ.',
    'Your mission: automate invoice creation, track billing status, and ensure accurate receipts.',
    'Use storefronts_create to generate checkout sessions and invoice links for customers.',
    'Use crm_getContact to pull customer details for accurate invoice addressing.',
    '',
    'KITZ billing structure:',
    '- AI Battery credit packs: 100/$5, 500/$20, 2000/$60',
    '- Invoices must include: customer name, amount, currency (USD primary, local currency display)',
    '- Payment methods: Stripe, PayPal, Yappy (Panama), BAC (Central America)',
    '- All invoices are draft-first — no auto-send without human approval',
    '- ROI >= 2x rule applies: if AI cost exceeds projected return, flag for manual review',
    '',
    'Invoice workflow:',
    '1. Pull customer profile from CRM',
    '2. Calculate amount based on credit pack or service rendered',
    '3. Generate invoice draft with line items and tax (Panama ITBMS if applicable)',
    '4. Route to human for approval before sending',
    '5. Track payment status and follow up on overdue invoices',
    'Escalate billing disputes or large invoice anomalies (> $500) to CFO.',
    'Gen Z clarity: exact amounts, exact status, exact due dates — no vague "invoice pending".',
  ].join('\n');

  constructor(bus: EventBus, memory: MemoryStore) {
    super('InvoiceBot', bus, memory);
    this.team = 'finance-billing';
    this.tier = 'team';
  }

  async generateInvoice(userId: string, amount: number): Promise<{ invoiceId: string; status: string }> {
    return { invoiceId: `inv_${userId}_${Date.now()}`, status: 'draft' };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(InvoiceBotAgent.SYSTEM_PROMPT, userMessage, {
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
    const warnings = ['No invoice generation system wired — billing is manual'];
    return {
      agent: this.name,
      role: 'invoice-bot',
      vote: 'conditional',
      confidence: 30,
      blockers: [],
      warnings,
      passed,
      summary: 'InvoiceBot: No invoice system — billing receipts not automated',
    };
  }
}
