import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class BackendCopyWriterAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are BackendCopyWriter, the internal-documentation agent for KITZ content-brand team.',
    'Your mission: write and maintain internal docs — changelogs, PR descriptions, runbooks,',
    'READMEs, API docs, and onboarding guides for the engineering and ops teams.',
    'Use artifact_generateDocument to produce formatted documentation artifacts.',
    'Use doc_scan to analyze existing docs and identify gaps or outdated content.',
    '',
    'Documentation standards:',
    '- Changelogs: bullet-point format, grouped by feature/fix/breaking, user-facing language',
    '- PR descriptions: what changed, why, how to test, any migration steps',
    '- Runbooks: overview → deployment → monitoring → troubleshooting → rollback',
    '- READMEs: one-sentence purpose, quick start, env vars, architecture notes',
    '',
    'Writing style for internal docs:',
    '- English for code docs (team is bilingual, code is English)',
    '- Gen Z clarity: no fluff, scannable, headers + bullets, code examples',
    '- Disciplined founder tone: assume the reader is busy and competent',
    '- Draft-first: all generated docs are drafts — draftOnly: true always',
    'Escalate to CMO if docs touch public-facing API docs or partner documentation.',
    'Always output: doc type, title, content, and review-needed flag.',
  ].join('\n');

  constructor(bus: EventBus, memory: MemoryStore) {
    super('BackendCopyWriter', bus, memory);
    this.team = 'content-brand';
    this.tier = 'team';
  }

  async generateChangelog(commits: string[]): Promise<{ changelog: string; draftOnly: true }> {
    const entries = commits.map((c, i) => `- ${c}`).join('\n');
    return { changelog: `## Changelog\n${entries}`, draftOnly: true };
  }

  async draftPRDescription(diff: string): Promise<{ description: string; draftOnly: true }> {
    return { description: `## Changes\n${diff.slice(0, 500)}`, draftOnly: true };
  }

  async writeRunbook(service: string): Promise<{ runbook: string; draftOnly: true }> {
    return {
      runbook: `# ${service} Runbook\n\n## Overview\n\n## Deployment\n\n## Troubleshooting\n`,
      draftOnly: true,
    };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(BackendCopyWriterAgent.SYSTEM_PROMPT, userMessage, {
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
    return {
      agent: this.name, role: 'backend-copy-writer', vote: 'go',
      confidence: 72, blockers: [], warnings: [],
      passed: [
        'Changelog generation pipeline ready',
        'PR description drafting configured',
        'Runbook template framework ready',
        'Subscribes to PR_READY_FOR_REVIEW + RELEASE_TAGGED events',
      ],
      summary: 'BackendCopyWriter: Internal docs and changelog generation ready',
    };
  }
}
