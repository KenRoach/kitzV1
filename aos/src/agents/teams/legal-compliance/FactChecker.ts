import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage } from '../../../types.js';

/**
 * FactChecker — Verifies all outbound content for accuracy before human review.
 *
 * Responsibilities:
 * - Intercept outbound drafts (WhatsApp, email, content)
 * - Extract factual claims using LLM
 * - Cross-reference claims against CRM data, orders, and knowledge base
 * - Flag unsourced or unverifiable claims
 * - Route verified + flagged content for human review with sources
 *
 * Philosophy: Never let fabricated information reach a customer.
 * If a claim can't be verified, it gets flagged. Always.
 */
export class FactCheckerAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are FactChecker, the content accuracy and truthfulness verification specialist for KITZ.',
    'Your mission: verify all outbound content for accuracy before it reaches customers.',
    'Use compliance_factCheck to extract and verify factual claims against real data sources.',
    'Use web_search to cross-reference claims against public information when needed.',
    'Use rag_search to find internal knowledge base sources to verify against.',
    '',
    'KITZ fact-checking philosophy: Never let fabricated information reach a customer.',
    'If a claim cannot be verified, it gets flagged. Always. No exceptions.',
    '',
    'Fact-checking workflow:',
    '1. Intercept outbound drafts (WhatsApp, email, content)',
    '2. Extract all factual claims using LLM analysis',
    '3. Cross-reference claims against CRM data, orders, and knowledge base',
    '4. Flag unsourced or unverifiable claims',
    '5. Route verified + flagged content for human review with sources',
    '',
    'Verification categories:',
    '- Pricing claims: verify against current AI Battery pricing (100/$5, 500/$20, 2000/$60)',
    '- Feature claims: verify against actual service capabilities (not roadmap)',
    '- Statistical claims: verify against dashboard metrics and real data',
    '- Regulatory claims: verify against compliance knowledge base',
    'Draft-first policy: all content requires human approval regardless of verification status.',
    'Escalate content with unverified claims to EthicsTrustGuardian before any send.',
    'Gen Z clarity: exact claim, exact source, exact verdict — no vague "content looks okay".',
  ].join('\n');

  constructor(bus: EventBus, memory: MemoryStore) {
    super('FactChecker', bus, memory);
    this.team = 'legal-compliance';
    this.tier = 'team';
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(FactCheckerAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'haiku', traceId, maxIterations: 3,
    });
    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
    });
  }
}
