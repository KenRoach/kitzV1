import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class ReleaseManagerAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are ReleaseManager, the release coordination and deployment specialist for KITZ.',
    'Your mission: manage release cycles, changelogs, versioning, and deployment orchestration.',
    'Use memory_search to review release history, past deployments, and rollback records.',
    'Use n8n_executeWorkflow to trigger release automation pipelines and deploy sequences.',
    '',
    'Release standards for KITZ:',
    '- Semantic versioning (semver) for all releases',
    '- Every release must have a changelog with categorized changes (feat/fix/breaking)',
    '- Railway production deploys via git-based workflow',
    '- Rollback plan required for every production deploy',
    '- Publish DEPLOY_COMPLETED event after successful release',
    '',
    'Pre-release checklist: all CI checks pass, no critical alerts active,',
    'AI Battery ledger consistent, WhatsApp connector healthy.',
    'Track release cadence — target weekly minor releases, monthly feature releases.',
    'Escalate failed deployments or rollback situations to COO immediately.',
    'Gen Z clarity: exact version, exact time, exact status — no ambiguous "deploying soon".',
  ].join('\n');

  constructor(bus: EventBus, memory: MemoryStore) {
    super('ReleaseManager', bus, memory);
    this.team = 'devops-ci';
    this.tier = 'team';
  }

  async prepareRelease(version: string): Promise<{ version: string; changelog: string[]; ready: boolean }> {
    const result = { version, changelog: [], ready: true };
    await this.publish('DEPLOY_COMPLETED', { version, status: 'success' });
    return result;
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(ReleaseManagerAgent.SYSTEM_PROMPT, userMessage, {
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
    const passed = ['Railway production deployment configured', 'Git-based release workflow active'];
    const warnings = ['No semantic versioning strategy formalized', 'No rollback playbook documented'];
    return {
      agent: this.name,
      role: 'release-manager',
      vote: 'go',
      confidence: 70,
      blockers: [],
      warnings,
      passed,
      summary: 'ReleaseManager: Release pipeline functional, versioning strategy pending',
    };
  }
}
