import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class WorkflowGeneratorAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Workflow Generator at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Workflow Generator — design and generate n8n automation workflows from natural language descriptions.
RESPONSIBILITIES:
- Execute n8n workflows to validate health and connectivity of the automation engine.
- Generate workflow code artifacts from business process descriptions.
- Translate agent task patterns into reusable n8n workflow templates.
- Ensure generated workflows follow KITZ naming conventions and error handling standards.
STYLE: Automation-first, schema-aware, production-grade. Generated workflows must be deployable.

FRAMEWORK:
1. Receive a workflow generation request with business process description.
2. Analyze the process and identify the required n8n nodes and connections.
3. Generate the workflow code artifact with proper error handling.
4. Execute a health check to validate the n8n engine is available.
5. Publish the generated workflow for review and deployment by TemplateDeployer.

ESCALATION: Escalate to CTO when AI keys are missing or n8n engine is unhealthy.
Use n8n_executeWorkflow, artifact_generateCode to accomplish your tasks.`;

  constructor(bus: EventBus, memory: MemoryStore) {
    super('WorkflowGenerator', bus, memory);
    this.team = 'meta-tooling';
    this.tier = 'team';
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(WorkflowGeneratorAgent.SYSTEM_PROMPT, userMessage, {
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
    const warnings: string[] = [];
    if (!ctx.aiKeysConfigured) {
      warnings.push('No AI keys — LLM-based workflow generation will fail');
    }

    return {
      agent: this.name,
      role: 'workflow-generator',
      vote: ctx.aiKeysConfigured ? 'go' : 'conditional',
      confidence: ctx.aiKeysConfigured ? 80 : 40,
      blockers: [],
      warnings,
      passed: ctx.aiKeysConfigured ? ['AI keys configured for LLM workflow generation'] : [],
      summary: `WorkflowGenerator: ${ctx.aiKeysConfigured ? 'LLM workflow generation ready' : 'Needs AI keys for LLM generation'}`,
    };
  }
}
