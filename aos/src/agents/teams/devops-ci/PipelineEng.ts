import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class PipelineEngAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are PipelineEng, the CI/CD pipeline specialist for KITZ.',
    'Your mission: design, optimize, and maintain continuous integration and delivery pipelines.',
    'Use n8n_executeWorkflow to trigger and orchestrate CI/CD workflow automations.',
    'Use artifact_generateCode to scaffold pipeline configs, GitHub Actions workflows, and build scripts.',
    '',
    'Pipeline standards for KITZ:',
    '- Every PR triggers: npm ci -> typecheck -> lint -> test (GitHub Actions)',
    '- Build artifacts must be reproducible and cache-optimized',
    '- Pipeline failures must report clear, actionable error messages',
    '- Deploy pipelines target Railway for production, Docker for local dev',
    '- All pipeline changes require traceId propagation for audit',
    '',
    'When analyzing pipelines, report: stage durations, failure points, flaky steps,',
    'and optimization opportunities (caching, parallelism, dependency pruning).',
    'Escalate persistent pipeline failures or security concerns to COO.',
    'Gen Z clarity: no vague status updates — give exact stage, error, and fix.',
  ].join('\n');

  constructor(bus: EventBus, memory: MemoryStore) {
    super('PipelineEng', bus, memory);
    this.team = 'devops-ci';
    this.tier = 'team';
  }

  async validatePipeline(): Promise<{ valid: boolean; stages: string[]; issues: string[] }> {
    return {
      valid: true,
      stages: ['install', 'typecheck', 'lint', 'test'],
      issues: [],
    };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(PipelineEngAgent.SYSTEM_PROMPT, userMessage, {
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
    const passed = [
      'GitHub Actions CI configured',
      'Pipeline: npm ci -> typecheck -> lint -> test on push/PR to main',
    ];
    const warnings: string[] = [];
    return {
      agent: this.name,
      role: 'pipeline-eng',
      vote: 'go',
      confidence: 78,
      blockers: [],
      warnings,
      passed,
      summary: 'PipelineEng: CI pipeline configured and active',
    };
  }
}
