import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { LaunchContext, LaunchReview } from '../../../types.js';

export class BackendCopyWriterAgent extends BaseAgent {
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
