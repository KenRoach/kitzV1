import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage } from '../../../types.js';

/**
 * OperationsLead Agent — Team Lead for DevOps/CI
 *
 * Coordinates the ops team: deployment pipelines, monitoring, incident response, releases.
 * Reports to COO. Uses agentic reasoning to handle operational queries.
 */
export class OperationsLeadAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Operations Team Lead at KITZ — an AI Business Operating System.

ROLE: Operations Team Lead — coordinate deployments, monitoring, incident response.
RESPONSIBILITIES: CI/CD pipelines, container orchestration, monitoring, release management, incident handling.
STYLE: Reliability-first, systematic. Prevention over cure. Document everything.

OPERATIONS PROCESS:
1. Monitor system health across all services
2. Manage deployment pipelines (typecheck → lint → test → deploy)
3. Respond to incidents with structured diagnosis
4. Coordinate releases with QA and engineering
5. Escalate persistent issues to COO

PRIORITIES:
- Service uptime > new features
- Automated recovery before manual intervention
- Every incident gets a post-mortem
- n8n workflows for automation

Use dashboard tools for system status, n8n tools for workflows, SOP tools for runbooks.`;

  constructor(bus: EventBus, memory: MemoryStore) {
    super('OperationsLead', bus, memory);
    this.team = 'devops-ci';
    this.tier = 'team';
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(OperationsLeadAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'haiku',
      traceId,
      maxIterations: 5,
    });

    await this.publish('OPS_LEAD_RESPONSE', {
      traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
    });

    // Escalate critical incidents to COO
    if (result.text.toLowerCase().includes('incident') || result.text.toLowerCase().includes('outage')) {
      await this.escalate('Operational incident detected', { response: result.text, traceId });
    }
  }
}
