import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class SecurityEngAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are SecurityEng, the security engineering specialist on the KITZ Backend team.',
    'Your mission is to audit, enforce, and improve security controls across the entire KITZ platform.',
    'KITZ Constitution: Zero-trust is mandatory. JWT auth, RBAC via x-scopes, org isolation via x-org-id.',
    'Use rag_search to find security policies and compliance_factCheck to verify security claims.',
    'Core security controls: JWT authentication, webhook cryptographic verification, rate limiting (120 req/min), draft-first.',
    'Draft-first is non-negotiable: draftOnly=true is default across all connectors. Nothing sends without approval.',
    'Known gaps: payment webhooks check header presence but lack cryptographic signature verification.',
    'Auth status: 12/13 services validate x-service-secret. Workspace uses per-route session auth by design.',
    'Kill-switch (KILL_SWITCH=true) must be respected — halts all AI execution at kernel boot.',
    'Audit: every action must be traceable via traceId. EventEnvelope shape enforced across all services.',
    'Review for: injection attacks, credential exposure, privilege escalation, and data leakage.',
    'Escalate to CTO when security vulnerabilities affect production systems or user data.',
    'Never expose API keys or secrets in code, logs, or error messages. Track traceId on all security actions.',
  ].join('\n');
  constructor(bus: EventBus, memory: MemoryStore) {
    super('SecurityEng', bus, memory);
    this.team = 'backend';
    this.tier = 'team';
  }

  async auditSecurity(): Promise<{ issues: string[]; score: number }> {
    return { issues: [], score: 0 };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(SecurityEngAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'haiku', traceId, maxIterations: 3,
    });
    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
    });
  }

  override reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const passed: string[] = [];
    const warnings: string[] = [];
    const blockers: string[] = [];
    if (ctx.jwtAuthEnabled) passed.push('JWT authentication enabled');
    else blockers.push('JWT authentication not enabled — zero-trust compromised');
    if (ctx.webhookCryptoEnabled) passed.push('Webhook cryptographic verification enabled');
    else warnings.push('Webhook signatures not cryptographically verified');
    if (ctx.rateLimitingEnabled) passed.push('Rate limiting active (120 req/min)');
    else warnings.push('Rate limiting not enabled on gateway');
    if (ctx.draftFirstEnforced) passed.push('Draft-first enforced — no unsanctioned outbound');
    else blockers.push('Draft-first not enforced — outbound messages uncontrolled');
    return {
      agent: this.name,
      role: 'security-eng',
      vote: blockers.length > 0 ? 'no-go' : 'go',
      confidence: blockers.length > 0 ? 25 : 82,
      blockers,
      warnings,
      passed,
      summary: `SecurityEng: ${passed.length} controls active, ${blockers.length} blockers, ${warnings.length} warnings`,
    };
  }
}
