import type { EventBus } from '../eventBus.js';
import type { LedgerStore } from '../ledger/ledgerStore.js';

export class NetworkingBot {
  constructor(
    private readonly sourceAgent = 'NetworkingBot',
    private readonly bus: EventBus,
    private readonly ledger: LedgerStore
  ) {}

  async publishOrgDigest(): Promise<void> {
    const artifacts = this.ledger.listArtifacts();
    const digest = {
      generated_at: new Date().toISOString(),
      totals: {
        tasks: artifacts.filter((entry) => entry.kind === 'task').length,
        proposals: artifacts.filter((entry) => entry.kind === 'proposal').length,
        decisions: artifacts.filter((entry) => entry.kind === 'decision').length,
        outcomes: artifacts.filter((entry) => entry.kind === 'outcome').length
      }
    };

    await this.bus.publish({
      type: 'ORG_DIGEST_READY',
      source: this.sourceAgent,
      severity: 'low',
      payload: digest
    });
  }
}
