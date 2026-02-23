import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { LaunchContext, LaunchReview } from '../../../types.js';

export class SecurityEngAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('SecurityEng', bus, memory);
    this.team = 'backend';
    this.tier = 'team';
  }

  async auditSecurity(): Promise<{ issues: string[]; score: number }> {
    return { issues: [], score: 0 };
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
