/**
 * Inbound Message Debouncer — ported from OpenClaw inbound-debounce.ts
 *
 * Batches rapid consecutive messages from the same sender within a
 * time window. Text bodies are merged; media messages flush immediately.
 */

export interface DebouncerOptions {
  /** Debounce window in milliseconds (0 to disable). */
  windowMs: number;
  /** Called with the batched message(s) when the window flushes. */
  onFlush: (messages: DebouncedMessage[]) => Promise<void>;
  /** Called on flush errors. */
  onError?: (err: unknown) => void;
}

export interface DebouncedMessage {
  text: string;
  senderJid: string;
  userId: string;
  traceId: string;
  hasMedia: boolean;
}

interface PendingBatch {
  messages: DebouncedMessage[];
  timer: ReturnType<typeof setTimeout>;
}

export class InboundDebouncer {
  private batches = new Map<string, PendingBatch>();
  private windowMs: number;
  private onFlush: DebouncerOptions['onFlush'];
  private onError: DebouncerOptions['onError'];

  constructor(opts: DebouncerOptions) {
    this.windowMs = opts.windowMs;
    this.onFlush = opts.onFlush;
    this.onError = opts.onError;
  }

  /** Enqueue a message. Media messages flush immediately. */
  enqueue(msg: DebouncedMessage): void {
    if (this.windowMs <= 0 || msg.hasMedia) {
      // No debouncing or media — flush immediately
      void this.flush([msg]);
      return;
    }

    const key = `${msg.userId}:${msg.senderJid}`;
    const existing = this.batches.get(key);

    if (existing) {
      existing.messages.push(msg);
      // Don't reset timer — flush at original window end
      return;
    }

    const timer = setTimeout(() => {
      const batch = this.batches.get(key);
      this.batches.delete(key);
      if (batch) void this.flush(batch.messages);
    }, this.windowMs);
    timer.unref();

    this.batches.set(key, { messages: [msg], timer });
  }

  private async flush(messages: DebouncedMessage[]): Promise<void> {
    try {
      await this.onFlush(messages);
    } catch (err) {
      this.onError?.(err);
    }
  }

  /** Force-flush all pending batches (e.g. on shutdown). */
  flushAll(): void {
    for (const [key, batch] of this.batches) {
      clearTimeout(batch.timer);
      this.batches.delete(key);
      void this.flush(batch.messages);
    }
  }
}
