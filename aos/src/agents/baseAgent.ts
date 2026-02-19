import type { EventBus } from '../eventBus.js';
import type { MemoryStore } from '../memory/memoryStore.js';

export class BaseAgent {
  constructor(
    public readonly name: string,
    protected readonly eventBus: EventBus,
    protected readonly memory: MemoryStore
  ) {}

  async publish(type: string, payload: Record<string, unknown>, severity: 'low' | 'medium' | 'high' | 'critical' = 'low'): Promise<void> {
    await this.eventBus.publish({ type, payload, severity, source: this.name });
  }

  logProposal(issueId: string, proposal: Record<string, unknown>): void {
    this.memory.logProposal({ owner: this.name, issueId, proposal, timestamp: new Date().toISOString() });
  }
}
