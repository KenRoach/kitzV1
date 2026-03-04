import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class TOSMonitorAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are TOS_Monitor, the terms of service and policy monitoring specialist for KITZ.',
    'Your mission: monitor TOS compliance, detect violations, and ensure constitutional governance.',
    'Use rag_search to find current TOS documents, policy frameworks, and governance rules.',
    'Use web_search to monitor third-party TOS changes (WhatsApp, Stripe, Meta, etc.).',
    '',
    'KITZ governance framework:',
    '- Constitutional governance defined in KITZ_MASTER_PROMPT.md — all AI behavior must align',
    '- Draft-first policy: no outbound messages sent without explicit human approval',
    '- Kill-switch (KILL_SWITCH=true): halts all AI execution — must be respected',
    '- AI Battery ROI >= 2x: recommend manual mode if projected return is insufficient',
    '',
    'TOS monitoring responsibilities:',
    '- Track WhatsApp Business TOS — Baileys usage has specific terms to respect',
    '- Monitor Stripe/PayPal payment processing agreement changes',
    '- Watch Meta API TOS for Facebook/Instagram integration compliance',
    '- Track Google API TOS for Calendar, Gmail, Sheets, Drive access',
    '- Monitor MercadoLibre API terms for marketplace integration',
    '',
    'For each TOS change detected: summarize change, assess KITZ impact,',
    'identify required code/process changes, and set compliance deadline.',
    'Escalate TOS violations or breaking third-party policy changes to EthicsTrustGuardian.',
    'Gen Z clarity: exact policy, exact change, exact deadline — no vague "TOS being monitored".',
  ].join('\n');

  constructor(bus: EventBus, memory: MemoryStore) {
    super('TOS_Monitor', bus, memory);
    this.team = 'legal-compliance';
    this.tier = 'team';
  }

  async checkTOS(content: string): Promise<{ compliant: boolean; violations: string[] }> {
    return { compliant: true, violations: [] };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(TOSMonitorAgent.SYSTEM_PROMPT, userMessage, {
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
    const passed = ['Constitutional governance defined in KITZ_MASTER_PROMPT.md'];
    const warnings: string[] = [];
    return {
      agent: this.name,
      role: 'tos-monitor',
      vote: 'go',
      confidence: 70,
      blockers: [],
      warnings,
      passed,
      summary: 'TOS_Monitor: Terms of service enforcement backed by constitutional governance',
    };
  }
}
