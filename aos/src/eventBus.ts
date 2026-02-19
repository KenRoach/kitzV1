import { randomUUID } from 'node:crypto';
import { detectAlignmentWarnings } from './policies/incentiveAlignment.js';
import type { AOSEvent } from './types.js';
import { MemoryStore } from './memory/memoryStore.js';

type Handler = (event: AOSEvent) => void | Promise<void>;

export class EventBus {
  private readonly subscriptions = new Map<string, Handler[]>();
  private readonly middleware: Array<(event: AOSEvent) => void> = [];

  constructor(private readonly memory: MemoryStore) {}

  use(handler: (event: AOSEvent) => void): void {
    this.middleware.push(handler);
  }

  subscribe(eventType: string, handler: Handler): void {
    const current = this.subscriptions.get(eventType) ?? [];
    current.push(handler);
    this.subscriptions.set(eventType, current);
  }

  async publish(event: Omit<AOSEvent, 'id' | 'timestamp'>): Promise<AOSEvent> {
    const hydrated: AOSEvent = {
      ...event,
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      alignmentWarnings: detectAlignmentWarnings(event as AOSEvent)
    };

    for (const mw of this.middleware) mw(hydrated);
    this.memory.writeEvent(hydrated);

    const handlers = [...(this.subscriptions.get(hydrated.type) ?? []), ...(this.subscriptions.get('*') ?? [])];
    for (const handler of handlers) await handler(hydrated);
    return hydrated;
  }
}
