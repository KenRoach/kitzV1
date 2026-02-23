import type { EventBus } from '../eventBus.js';
import type { MemoryStore } from '../memory/memoryStore.js';
import type {
  AgentMessage,
  AgentStatus,
  AgentTier,
  EventSeverity,
  GuardianScope,
  LaunchContext,
  LaunchReview,
  MessageChannel,
  MessagePriority,
  TeamName,
} from '../types.js';
import type { SOPEntry } from '../../../kitz_os/src/sops/types.js';

export class BaseAgent {
  /** Team this agent belongs to (undefined for board/governance/external without a team) */
  public team?: TeamName;
  /** Tier in the org hierarchy */
  public tier: AgentTier = 'team';
  /** Guardian scope — only set for guardian agents */
  public scope?: GuardianScope;

  private _online = true;
  private _lastAction?: string;
  private _lastActionAt?: string;
  private _actionsToday = 0;

  constructor(
    public readonly name: string,
    protected readonly eventBus: EventBus,
    protected readonly memory: MemoryStore
  ) {}

  // ── Publishing ──

  async publish(
    type: string,
    payload: Record<string, unknown>,
    severity: EventSeverity = 'low'
  ): Promise<void> {
    await this.eventBus.publish({ type, payload, severity, source: this.name });
    this._lastAction = type;
    this._lastActionAt = new Date().toISOString();
    this._actionsToday += 1;
  }

  // ── Routed Messaging ──

  async sendMessage(
    target: string | string[],
    channel: MessageChannel,
    payload: Record<string, unknown>,
    options: {
      type?: string;
      severity?: EventSeverity;
      priority?: MessagePriority;
      requiresAck?: boolean;
      parentMessageId?: string;
    } = {}
  ): Promise<void> {
    const msg: Omit<AgentMessage, 'id' | 'timestamp'> = {
      type: options.type ?? 'AGENT_MESSAGE',
      source: this.name,
      severity: options.severity ?? 'low',
      payload,
      target,
      channel,
      ttl: 5,
      hops: [this.name],
      priority: options.priority ?? 'normal',
      requiresAck: options.requiresAck ?? false,
      parentMessageId: options.parentMessageId,
    };
    await this.eventBus.publish(msg);
    this._lastAction = `sendMessage:${channel}`;
    this._lastActionAt = new Date().toISOString();
    this._actionsToday += 1;
  }

  // ── Escalation shortcut ──

  async escalate(
    reason: string,
    payload: Record<string, unknown> = {}
  ): Promise<void> {
    await this.sendMessage(
      'CEO',
      'escalation',
      { reason, ...payload },
      { severity: 'high', priority: 'high' }
    );
  }

  // ── Message Handling ──

  /** Override in subclasses to handle inbound routed messages */
  async handleMessage(_msg: AgentMessage): Promise<void> {
    // Default: no-op. Subclasses implement domain logic.
  }

  // ── Status ──

  getStatus(): AgentStatus {
    return {
      name: this.name,
      team: this.team,
      tier: this.tier,
      online: this._online,
      lastAction: this._lastAction,
      lastActionAt: this._lastActionAt,
      actionsToday: this._actionsToday,
    };
  }

  setOnline(online: boolean): void {
    this._online = online;
  }

  resetDailyActions(): void {
    this._actionsToday = 0;
  }

  // ── SOP Access ──

  /** Get SOPs applicable to this agent from the SOP store */
  async getMySOPs(): Promise<SOPEntry[]> {
    try {
      // Dynamic import to avoid hard dependency — SOP store may not be initialized
      const { getSOPsForAgent } = await import('../../../kitz_os/src/sops/store.js') as {
        getSOPsForAgent: (agentName: string) => SOPEntry[];
      };
      return getSOPsForAgent(this.name);
    } catch {
      // SOP store not available — return empty
      return [];
    }
  }

  // ── Proposals ──

  logProposal(issueId: string, proposal: Record<string, unknown>): void {
    this.memory.logProposal({
      owner: this.name,
      issueId,
      proposal,
      timestamp: new Date().toISOString(),
    });
  }

  // ── Launch Review ──

  reviewLaunchReadiness(_ctx: LaunchContext): LaunchReview {
    return {
      agent: this.name,
      role: 'base',
      vote: 'conditional',
      confidence: 0,
      blockers: ['Agent has no launch review logic implemented'],
      warnings: [],
      passed: [],
      summary: `${this.name} has not implemented launch readiness review.`,
    };
  }
}
