import { randomUUID } from 'node:crypto';
import type { EventBus } from './eventBus.js';
import type { LedgerStore } from './ledger/ledgerStore.js';
import type { WarRoomConfig } from './types.js';

const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

export class WarRoomManager {
  private readonly active = new Map<string, WarRoomConfig>();
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(
    private readonly bus: EventBus,
    private readonly ledger: LedgerStore
  ) {}

  activate(reason: string, participants: string[]): WarRoomConfig {
    const config: WarRoomConfig = {
      id: randomUUID(),
      reason,
      participants,
      activatedAt: new Date().toISOString(),
      ttlMs: DEFAULT_TTL_MS,
      status: 'active',
    };

    this.active.set(config.id, config);

    // Auto-dissolve after TTL
    const timer = setTimeout(() => {
      this.dissolve(config.id, 'TTL expired — auto-dissolved after 1 hour');
    }, DEFAULT_TTL_MS);
    this.timers.set(config.id, timer);

    // Publish activation event
    this.bus.publish({
      type: 'WAR_ROOM_ACTIVATED',
      source: 'WarRoomManager',
      severity: 'critical',
      payload: {
        warRoomId: config.id,
        reason,
        participants,
      },
    });

    return config;
  }

  dissolve(id: string, postMortem?: string): WarRoomConfig | undefined {
    const config = this.active.get(id);
    if (!config) return undefined;

    config.status = 'dissolved';
    config.dissolvedAt = new Date().toISOString();
    config.postMortem = postMortem;

    // Clear auto-dissolve timer
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }

    // Log post-mortem to ledger
    this.ledger.appendEvent({
      id: randomUUID(),
      type: 'WAR_ROOM_DISSOLVED',
      source: 'WarRoomManager',
      severity: 'high',
      timestamp: config.dissolvedAt,
      payload: {
        warRoomId: id,
        reason: config.reason,
        participants: config.participants,
        postMortem: postMortem ?? 'No post-mortem provided',
        durationMs: new Date(config.dissolvedAt).getTime() - new Date(config.activatedAt).getTime(),
      },
    });

    this.active.delete(id);
    return config;
  }

  getActive(): WarRoomConfig[] {
    return [...this.active.values()];
  }

  getById(id: string): WarRoomConfig | undefined {
    return this.active.get(id);
  }

  get activeCount(): number {
    return this.active.size;
  }
}
