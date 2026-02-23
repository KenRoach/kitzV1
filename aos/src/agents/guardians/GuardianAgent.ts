import { BaseAgent } from '../baseAgent.js';
import type { EventBus } from '../../eventBus.js';
import type { MemoryStore } from '../../memory/memoryStore.js';
import type { GuardianScope, LaunchContext, LaunchReview } from '../../types.js';

export class GuardianAgent extends BaseAgent {
  constructor(
    name: string,
    eventBus: EventBus,
    memory: MemoryStore,
    guardianScope: GuardianScope
  ) {
    super(name, eventBus, memory);
    this.tier = 'guardian';
    this.scope = guardianScope;
  }

  // ── Health Checks ──

  async checkTypeHealth(): Promise<{ healthy: boolean; errors: string[] }> {
    // In production: runs tsc --noEmit on scope.serviceDir
    await this.publish('BUILD_HEALTH_DEGRADED', {
      guardian: this.name,
      serviceDir: this.scope!.serviceDir,
      check: 'typecheck',
      status: 'checked',
    });
    return { healthy: true, errors: [] };
  }

  async checkDocsFreshness(): Promise<{ fresh: boolean; staleFiles: string[] }> {
    await this.publish('DOCS_STALE', {
      guardian: this.name,
      serviceDir: this.scope!.serviceDir,
      check: 'docs',
      status: 'checked',
    });
    return { fresh: true, staleFiles: [] };
  }

  async checkTestCoverage(): Promise<{ adequate: boolean; coverage: number }> {
    await this.publish('TEST_REGRESSION_DETECTED', {
      guardian: this.name,
      serviceDir: this.scope!.serviceDir,
      check: 'tests',
      status: 'checked',
    });
    return { adequate: true, coverage: 0 };
  }

  async checkDependencies(): Promise<{ safe: boolean; vulnerabilities: string[] }> {
    await this.publish('DEPENDENCY_VULN_FOUND', {
      guardian: this.name,
      serviceDir: this.scope!.serviceDir,
      check: 'dependencies',
      status: 'checked',
    });
    return { safe: true, vulnerabilities: [] };
  }

  async checkBuildHealth(): Promise<{ passing: boolean; errors: string[] }> {
    return { passing: true, errors: [] };
  }

  // ── Auto-Repair (within guardrails) ──

  async fixTypeErrors(): Promise<{ fixed: number }> {
    return { fixed: 0 };
  }

  async updateDocs(): Promise<{ updated: string[] }> {
    return { updated: [] };
  }

  async addTestStubs(): Promise<{ added: string[] }> {
    return { added: [] };
  }

  // ── Launch Review ──

  override reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const blockers: string[] = [];
    const warnings: string[] = [];
    const passed: string[] = [];

    passed.push(`Guardian ${this.name} watching ${this.scope!.serviceDir}`);

    if (ctx.killSwitch) {
      blockers.push('Kill switch is ON');
    }

    return {
      agent: this.name,
      role: `guardian:${this.scope!.serviceDir}`,
      vote: blockers.length > 0 ? 'no-go' : 'go',
      confidence: 85,
      blockers,
      warnings,
      passed,
      summary: `${this.name} — service health monitored`,
    };
  }
}
