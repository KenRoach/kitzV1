import type { EventBus } from './eventBus.js';
import type { AOSEvent, CTODigestEntry, CTODigestPayload } from './types.js';

const DEFAULT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export class CTODigest {
  private entries: CTODigestEntry[] = [];
  private windowMs: number;
  private timer: ReturnType<typeof setInterval> | null = null;
  private agentsTotal = 106;

  constructor(
    private readonly bus: EventBus,
    options: { windowMs?: number; agentsTotal?: number } = {}
  ) {
    this.windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
    if (options.agentsTotal) this.agentsTotal = options.agentsTotal;
  }

  /** Subscribe to events that feed the CTO digest */
  wire(): void {
    // Auto-fixed repairs
    this.bus.subscribe('REPAIR_COMPLETED', (event) => {
      this.addEntry({
        category: 'auto_fixed',
        agent: String(event.payload.routedTo ?? event.source),
        summary: `Auto-fixed: ${event.payload.action} on ${event.payload.originalType}`,
        eventId: event.id,
        timestamp: event.timestamp,
      });
    });

    // Recommendations (needs human acknowledgment)
    this.bus.subscribe('AGENT_RETRAIN_NEEDED', (event) => {
      this.addEntry({
        category: 'recommendation',
        agent: String(event.payload.agentName ?? event.source),
        summary: `Agent retraining recommended: ${event.payload.reason ?? 'accuracy drop'}`,
        eventId: event.id,
        timestamp: event.timestamp,
      });
    });

    this.bus.subscribe('PROCESS_IMPROVEMENT_PROPOSAL', (event) => {
      this.addEntry({
        category: 'recommendation',
        agent: event.source,
        summary: `Process improvement: ${event.payload.proposal ?? 'see details'}`,
        eventId: event.id,
        timestamp: event.timestamp,
      });
    });

    // Escalations (needs human decision)
    this.bus.subscribe('REPAIR_NEEDS_HUMAN', (event) => {
      this.addEntry({
        category: 'escalation',
        agent: String(event.payload.routedTo ?? event.source),
        summary: `Human decision needed: ${event.payload.reason ?? event.payload.action}`,
        eventId: event.id,
        timestamp: event.timestamp,
      });
    });

    this.bus.subscribe('WAR_ROOM_ACTIVATED', (event) => {
      this.addEntry({
        category: 'escalation',
        agent: 'WarRoomManager',
        summary: `War room activated: ${event.payload.reason}`,
        eventId: event.id,
        timestamp: event.timestamp,
      });
    });

    this.bus.subscribe('DEPENDENCY_VULN_FOUND', (event) => {
      this.addEntry({
        category: 'escalation',
        agent: event.source,
        summary: `Vulnerability found in ${event.payload.serviceDir ?? 'unknown service'}`,
        eventId: event.id,
        timestamp: event.timestamp,
      });
    });
  }

  /** Start periodic digest publishing */
  startPeriodicDigest(): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.publishDigest();
    }, this.windowMs);
  }

  /** Stop periodic digest publishing */
  stopPeriodicDigest(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Manually publish the current digest */
  async publishDigest(): Promise<CTODigestPayload> {
    const payload = this.buildPayload();

    await this.bus.publish({
      type: 'CTO_DIGEST',
      source: 'CTODigest',
      severity: payload.escalations.length > 0 ? 'high' : 'low',
      payload: payload as unknown as Record<string, unknown>,
    });

    // Clear entries after publishing
    this.entries = [];

    return payload;
  }

  private buildPayload(): CTODigestPayload {
    const autoFixed = this.entries.filter((e) => e.category === 'auto_fixed');
    const recommendations = this.entries.filter((e) => e.category === 'recommendation');
    const escalations = this.entries.filter((e) => e.category === 'escalation');

    return {
      period: `${this.windowMs / 60000}min`,
      autoFixed,
      recommendations,
      escalations,
      agentsOnline: this.agentsTotal, // In production: query agent registry
      agentsTotal: this.agentsTotal,
      warRoomsActive: 0, // In production: query WarRoomManager
    };
  }

  private addEntry(entry: CTODigestEntry): void {
    this.entries.push(entry);
  }

  /** Get current pending entries (before digest is published) */
  getPendingEntries(): CTODigestEntry[] {
    return [...this.entries];
  }

  /** Set total agent count (for status reporting) */
  setAgentsTotal(total: number): void {
    this.agentsTotal = total;
  }
}
