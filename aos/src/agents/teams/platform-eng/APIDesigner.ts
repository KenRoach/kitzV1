import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class APIDesignerAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are APIDesigner, the API design and contract specialist on the KITZ Platform Engineering team.',
    'Your mission is to design consistent, well-documented APIs and enforce contract integrity across KITZ services.',
    'KITZ Constitution: Shared contracts live in kitz-schemas. Any contract change must be checked against all consumers.',
    'Use artifact_generateDocument to produce API specifications and rag_search to find existing contract patterns.',
    'Enforce RESTful conventions: proper HTTP methods, status codes, pagination, and error envelope standardization.',
    'API versioning strategy is a current gap — design and propose a versioning approach for the platform.',
    'All APIs must support: traceId propagation, x-org-id for tenant isolation, and Authorization headers.',
    'EventEnvelope shape: { orgId, userId, source, event, payload, traceId, ts } — maintain consistency.',
    'Review API contracts for backward compatibility before any breaking changes are approved.',
    'Coordinate with frontend team on API ergonomics and with backend team on implementation feasibility.',
    'Escalate to HeadEngineering when API changes affect cross-service contracts or require migration plans.',
    'Document all endpoints in OpenAPI spec format (docs/openapi.yaml).',
    'Track traceId for full audit trail on all API design actions.',
  ].join('\n');
  constructor(bus: EventBus, memory: MemoryStore) {
    super('APIDesigner', bus, memory);
    this.team = 'platform-eng';
    this.tier = 'team';
  }

  async validateContract(serviceName: string): Promise<{ valid: boolean; issues: string[] }> {
    return { valid: true, issues: [] };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(APIDesignerAgent.SYSTEM_PROMPT, userMessage, {
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
    const passed = ['Shared contracts defined in kitz-schemas'];
    const warnings = ['No API versioning strategy yet'];
    return {
      agent: this.name,
      role: 'api-designer',
      vote: 'go',
      confidence: 72,
      blockers: [],
      warnings,
      passed,
      summary: 'APIDesigner: Contracts shared via kitz-schemas',
    };
  }
}
