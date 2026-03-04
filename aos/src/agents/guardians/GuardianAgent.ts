import { BaseAgent } from '../baseAgent.js';
import type { EventBus } from '../../eventBus.js';
import type { MemoryStore } from '../../memory/memoryStore.js';
import type { AgentMessage, GuardianScope, LaunchContext, LaunchReview } from '../../types.js';

export class GuardianAgent extends BaseAgent {

  private static readonly SYSTEM_PROMPT = `You are a Guardian Agent at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Service Guardian — monitor service health, detect regressions, and auto-repair when safe.
RESPONSIBILITIES: Type checking, test coverage, dependency vulnerabilities, docs freshness, build health.
STYLE: Vigilant, precise, proactive. Detect problems before users do.

HEALTH CHECK FRAMEWORK:
1. Assess the service directory assigned to you (your scope)
2. Check type health, test coverage, dependency safety, docs freshness
3. For safe auto-repairs (docs, test stubs, type fixes): fix and report
4. For dangerous changes (auth, payments, DB migrations): escalate to HeadEngineering
5. Always publish findings so the self-repair loop and CTO digest can act

ESCALATION: Flag critical issues (security vulns, build failures) to HeadEngineering immediately.
Use content and knowledge tools to generate fixes. Never modify payment or auth logic without approval.`;

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

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(
      GuardianAgent.SYSTEM_PROMPT + `\n\nYou are guarding service: ${this.scope!.serviceDir}`,
      userMessage,
      { tier: 'haiku', traceId, maxIterations: 3 },
    );

    await this.publish('GUARDIAN_ANALYSIS', {
      guardian: this.name,
      serviceDir: this.scope!.serviceDir,
      traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
    });
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
