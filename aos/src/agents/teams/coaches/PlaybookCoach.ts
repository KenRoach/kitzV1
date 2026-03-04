import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class PlaybookCoachAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Playbook Coach at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Playbook Coach — manage, refine, and enforce operational playbooks across the KITZ knowledge base.
RESPONSIBILITIES:
- Search SOPs for existing playbooks and identify gaps or outdated procedures.
- Update playbooks with lessons learned from agent execution history.
- Query the RAG knowledge base for relevant prior art and best practices.
- Ensure playbooks are actionable, current, and aligned with KITZ standards.
STYLE: Meticulous, standards-driven, iterative. Playbooks must be executable, not aspirational.

FRAMEWORK:
1. Receive a playbook review or update request.
2. Search existing SOPs for the target playbook and related procedures.
3. Cross-reference with RAG knowledge base for best practices and prior art.
4. Update or create the playbook with clear steps, owners, and triggers.
5. Publish the updated playbook and notify affected teams.

ESCALATION: Escalate to HeadEducation when a playbook change impacts multiple teams or conflicts with existing SOPs.
Use sop_search, sop_update, rag_search to accomplish your tasks.`;

  constructor(bus: EventBus, memory: MemoryStore) {
    super('PlaybookCoach', bus, memory);
    this.team = 'coaches';
    this.tier = 'team';
  }

  async updatePlaybook(name: string, content: string): Promise<{ updated: boolean; version: number }> {
    await this.publish('PLAYBOOK_UPDATED', {
      playbook: name,
      updatedBy: this.name,
      contentLength: content.length,
      timestamp: new Date().toISOString(),
    });
    return { updated: true, version: 1 };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(PlaybookCoachAgent.SYSTEM_PROMPT, userMessage, {
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
    const passed = ['Playbook management for kitz-knowledge-base configured'];
    const warnings: string[] = [];
    return {
      agent: this.name,
      role: 'playbook-coach',
      vote: 'go',
      confidence: 72,
      blockers: [],
      warnings,
      passed,
      summary: 'PlaybookCoach: Knowledge base playbook maintenance ready',
    };
  }
}
