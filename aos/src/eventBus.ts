import { randomUUID } from 'node:crypto';
import type { AOSEvent, AOSMessageType } from './types.js';
import type { LedgerStore } from './ledger/ledgerStore.js';

type Handler = (event: AOSEvent) => void | Promise<void>;

type Middleware = (event: AOSEvent) => void;

export class EventBus {
  private readonly handlers = new Map<string, Handler[]>();
  private readonly middleware: Middleware[] = [];

  constructor(private readonly ledger: LedgerStore) {}

  use(middleware: Middleware): void {
    this.middleware.push(middleware);
  }

  subscribe(type: AOSMessageType | '*', handler: Handler): void {
    const list = this.handlers.get(type) ?? [];
    list.push(handler);
    this.handlers.set(type, list);
  }

  async publish(input: Omit<AOSEvent, 'id' | 'timestamp'>): Promise<AOSEvent> {
    const event: AOSEvent = {
      ...input,
      id: randomUUID(),
      timestamp: new Date().toISOString()
    };

    this.middleware.forEach((entry) => entry(event));
    this.ledger.appendEvent(event);

    const typed = this.handlers.get(event.type) ?? [];
    const any = this.handlers.get('*') ?? [];
    for (const handler of [...typed, ...any]) {
      await handler(event);
    }

    return event;
  }
}
