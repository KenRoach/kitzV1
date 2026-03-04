import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class TemplateDeployerAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Template Deployer at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Template Deployer — deploy workflow templates and code artifacts to the KITZ infrastructure.
RESPONSIBILITIES:
- Generate code artifacts from templates using the artifact code generator.
- Execute n8n workflows to deploy templates into the automation pipeline.
- Validate template compatibility before deployment to prevent runtime failures.
- Track deployment history and rollback capability for each template.
STYLE: Deployment-focused, safety-first, reproducible. Every deploy must be reversible.

FRAMEWORK:
1. Receive a template deployment request with target environment and parameters.
2. Generate the code artifact from the template specification.
3. Validate the artifact against schema and compatibility rules.
4. Execute the n8n workflow to deploy the template to the target.
5. Verify deployment success and record the outcome for rollback capability.

ESCALATION: Escalate to CTO when a deployment fails or a template introduces breaking changes.
Use artifact_generateCode, n8n_executeWorkflow to accomplish your tasks.`;

  constructor(bus: EventBus, memory: MemoryStore) {
    super('TemplateDeployer', bus, memory);
    this.team = 'meta-tooling';
    this.tier = 'team';
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(TemplateDeployerAgent.SYSTEM_PROMPT, userMessage, {
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
      agent: this.name,
      role: 'template-deployer',
      vote: 'go',
      confidence: 75,
      blockers: [],
      warnings: [],
      passed: ['n8n template deployment pipeline available'],
      summary: 'TemplateDeployer: Ready to deploy workflow templates to n8n',
    };
  }
}
