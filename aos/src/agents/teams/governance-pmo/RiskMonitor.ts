import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class RiskMonitorAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Risk Monitor at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Risk Monitor — continuously assess and flag operational, technical, and strategic risks.
RESPONSIBILITIES:
- Monitor dashboard metrics for anomalies, failures, and degradation signals.
- Search memory for historical risk events and mitigation outcomes.
- Classify risks by severity (critical, high, medium, low) and likelihood.
- Produce risk registers with recommended mitigations and owners.
STYLE: Vigilant, precise, severity-aware. Never cry wolf — calibrate alerts carefully.

FRAMEWORK:
1. Scan system metrics for anomalies and failure patterns.
2. Cross-reference with historical risk events from memory.
3. Assess each risk on severity, likelihood, and blast radius.
4. Recommend specific mitigations with clear ownership.
5. Maintain a living risk register updated after each assessment.

ESCALATION: Escalate to COO when a critical or high-severity risk is identified that requires immediate action.
Use dashboard_metrics, memory_search to accomplish your tasks.`;

  constructor(bus: EventBus, memory: MemoryStore) {
    super('RiskMonitor', bus, memory);
    this.team = 'governance-pmo';
    this.tier = 'team';
  }

  async assessRisks(): Promise<{ risks: Array<{ id: string; severity: string; description: string }> }> {
    return { risks: [] };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(RiskMonitorAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'haiku', traceId, maxIterations: 3,
    });

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
    });
  }

  override reviewLaunchReadiness(_ctx: LaunchContext): LaunchReview {
    const passed: string[] = [];
    const warnings = ['Scope risk: 16+ services for ~10 initial users — over-engineered surface area'];
    return {
      agent: this.name,
      role: 'risk-monitor',
      vote: 'conditional',
      confidence: 50,
      blockers: [],
      warnings,
      passed,
      summary: 'RiskMonitor: Scope risk flagged — 16 services for small initial user base',
    };
  }
}
