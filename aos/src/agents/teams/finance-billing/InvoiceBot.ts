import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { LaunchContext, LaunchReview } from '../../../types.js';

export class InvoiceBotAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('InvoiceBot', bus, memory);
    this.team = 'finance-billing';
    this.tier = 'team';
  }

  async generateInvoice(userId: string, amount: number): Promise<{ invoiceId: string; status: string }> {
    return { invoiceId: `inv_${userId}_${Date.now()}`, status: 'draft' };
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
