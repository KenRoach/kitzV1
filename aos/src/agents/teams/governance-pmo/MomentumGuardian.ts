import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage } from '../../../types.js';

/**
 * MomentumGuardian — Ensures task continuity. Never lets work stall.
 *
 * Responsibilities:
 * - Monitor running tasks for stalls, failures, and timeouts
 * - When a task fails or stalls: restart it immediately or reassign to another agent
 * - When internet/service goes down: queue the task and retry when back online
 * - When an agent gives a sloppy or incomplete response: flag it and re-trigger
 * - When an agent fails entirely: transfer its accumulated knowledge and last task to a dormant agent on the same team
 * - Maintain a retry queue with exponential backoff
 * - Escalate only if all retry attempts exhausted
 *
 * Philosophy: Momentum is everything. A task in motion stays in motion.
 * If something breaks, fix it and keep going. Don't wait for humans unless
 * the task is blocked on a human decision.
 */
export class MomentumGuardianAgent extends BaseAgent {
  private retryQueue: Array<{
    taskId: string;
    originalAgent: string;
    payload: Record<string, unknown>;
    attempts: number;
    maxAttempts: number;
    lastAttempt: string;
    reason: string;
  }> = [];

  constructor(bus: EventBus, memory: MemoryStore) {
    super('MomentumGuardian', bus, memory);
    this.team = 'governance-pmo';
    this.tier = 'team';
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? msg.id;

    // Determine message type
    const type = (payload.type as string) || msg.type || '';

    if (type === 'TASK_FAILED' || type === 'AGENT_STALLED' || type === 'SWARM_TASK_FAILED') {
      await this.handleFailure(payload, traceId);
    } else if (type === 'QUALITY_CHECK') {
      await this.handleQualityCheck(payload, traceId);
    } else {
      // Default: check system health and process retry queue
      await this.processRetryQueue(traceId);
    }
  }

  /** Handle a failed task — retry or reassign */
  private async handleFailure(
    payload: Record<string, unknown>,
    traceId: string,
  ): Promise<void> {
    const failedAgent = (payload.agent as string) || 'unknown';
    const reason = (payload.error as string) || (payload.reason as string) || 'unknown failure';
    const taskId = (payload.taskId as string) || traceId;

    // Check if already in retry queue
    const existing = this.retryQueue.find(r => r.taskId === taskId);
    if (existing) {
      existing.attempts += 1;
      existing.lastAttempt = new Date().toISOString();
      existing.reason = reason;

      if (existing.attempts >= existing.maxAttempts) {
        // Agent is considered failed — transfer knowledge + task to a dormant teammate
        // Find teammates on the same team and hand off with full context
        const team = (payload.team as string) || '';
        const context = {
          ...payload,
          failedAgent,
          failedAfterAttempts: existing.attempts,
          accumulatedKnowledge: payload.findings ?? payload.context ?? {},
          transferReason: `Agent ${failedAgent} failed after ${existing.attempts} attempts. Transferring knowledge and task to you.`,
        };

        // Hand off to any available teammate (broadcast to team)
        await this.handoff(
          team ? `team:${team}` : 'CEO', // Route to team or escalate
          context,
          `MomentumGuardian failover: ${failedAgent} exhausted ${existing.attempts} retries. Transferring accumulated knowledge and last task to dormant teammate.`,
          traceId,
        );

        // Also escalate to CEO for visibility
        await this.escalate(
          `Task ${taskId} failed after ${existing.attempts} attempts. Transferred to teammate. Original agent: ${failedAgent}. Last error: ${reason}`,
          { taskId, attempts: existing.attempts, transferredToTeam: team, payload },
        );
        // Remove from queue
        this.retryQueue = this.retryQueue.filter(r => r.taskId !== taskId);
        return;
      }
    } else {
      // Add to retry queue
      this.retryQueue.push({
        taskId,
        originalAgent: failedAgent,
        payload,
        attempts: 1,
        maxAttempts: 3,
        lastAttempt: new Date().toISOString(),
        reason,
      });
    }

    // Retry: hand off to the same agent or a backup
    await this.handoff(
      failedAgent,
      { ...payload, retryAttempt: (existing?.attempts ?? 1), momentumGuardianRetry: true },
      `MomentumGuardian retry: ${reason}. Attempt ${(existing?.attempts ?? 1)} of 3.`,
      traceId,
    );

    // Log the retry
    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name,
      team: this.team,
      tool: 'momentum_retry',
      findings: {
        action: 'retry',
        failedAgent,
        taskId,
        attempt: existing?.attempts ?? 1,
        reason,
      },
      traceId,
    });
  }

  /** Check quality of agent output — flag sloppy responses */
  private async handleQualityCheck(
    payload: Record<string, unknown>,
    traceId: string,
  ): Promise<void> {
    const response = (payload.response as string) || '';
    const agent = (payload.agent as string) || 'unknown';

    // Use LLM to evaluate quality
    const result = await this.invokeTool('llm_analyze', {
      topic: 'agent response quality check',
      data: JSON.stringify({
        agent,
        response: response.slice(0, 2000),
        criteria: [
          'Is the response complete (not cut off)?',
          'Does it contain actionable information?',
          'Does it avoid fabricated data?',
          'Is it specific (not generic filler)?',
        ],
      }),
      format: 'json',
    }, traceId);

    const analysis = result.data as { analysis?: string } | undefined;
    const isLowQuality = response.length < 20
      || response.includes('[error]')
      || response.includes('I cannot')
      || response.includes('timed out');

    if (isLowQuality) {
      // Re-trigger the task
      await this.handoff(
        agent,
        { ...payload, qualityRetry: true, previousResponse: response.slice(0, 500) },
        `MomentumGuardian quality retry: Response was incomplete or low quality. Try again with more detail.`,
        traceId,
      );
    }

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name,
      team: this.team,
      tool: 'llm_analyze',
      findings: {
        action: 'quality_check',
        targetAgent: agent,
        isLowQuality,
        analysis: analysis?.analysis,
        retryTriggered: isLowQuality,
      },
      traceId,
    });
  }

  /** Process the retry queue — retry tasks that have been waiting */
  private async processRetryQueue(traceId: string): Promise<void> {
    const now = Date.now();
    const retryable = this.retryQueue.filter(r => {
      const lastAttemptTime = new Date(r.lastAttempt).getTime();
      const backoffMs = Math.min(r.attempts * 10_000, 60_000); // 10s, 20s, 30s... max 60s
      return (now - lastAttemptTime) > backoffMs;
    });

    for (const item of retryable) {
      await this.handoff(
        item.originalAgent,
        { ...item.payload, retryAttempt: item.attempts + 1, momentumGuardianRetry: true },
        `MomentumGuardian auto-retry: ${item.reason}. Attempt ${item.attempts + 1} of ${item.maxAttempts}.`,
        traceId,
      );
      item.attempts += 1;
      item.lastAttempt = new Date().toISOString();
    }

    // Report status
    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name,
      team: this.team,
      tool: 'momentum_queue_process',
      findings: {
        queueSize: this.retryQueue.length,
        retriedNow: retryable.length,
        pendingRetries: this.retryQueue.filter(r => r.attempts < r.maxAttempts).length,
      },
      traceId,
    });
  }
}
