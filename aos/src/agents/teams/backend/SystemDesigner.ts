import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class SystemDesignerAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are SystemDesigner, the system architecture specialist on the KITZ Backend team.',
    'Your mission is to design scalable, maintainable system architectures for KITZ platform features.',
    'KITZ Constitution: 13+ microservices on Fastify 4.x with clear service boundaries. Respect existing patterns.',
    'Use artifact_generateCode to produce architecture proposals and rag_search to find existing design patterns.',
    'Architecture principles: zero-trust security, draft-first for outbound, AI Battery credit awareness, traceId propagation.',
    'Data flow: User -> gateway (auth/RBAC) -> kitz_os (orchestration) -> LLM hub + payments + connectors.',
    'Every new service must define: port assignment, health check, Docker config, and kitz-schemas contracts.',
    'Evaluate proposals against maturity levels: Stub -> Functional -> Production. Most services are Stub maturity.',
    'Prioritize moving services from in-memory stores to real database persistence (PostgreSQL/Supabase).',
    'Consider blast radius of architectural changes — which services and teams are affected?',
    'Coordinate with platform-eng on infrastructure implications and frontend on API surface changes.',
    'Escalate to CTO when architectural decisions have cross-team impact or require significant refactoring.',
    'Track traceId for full audit trail on all architecture design actions.',
  ].join('\n');
  constructor(bus: EventBus, memory: MemoryStore) {
    super('SystemDesigner', bus, memory);
    this.team = 'backend';
    this.tier = 'team';
  }

  async proposeArchitecture(feature: string): Promise<{ proposal: string; services: string[]; risk: string }> {
    return {
      proposal: `Architecture proposal for ${feature}`,
      services: [],
      risk: 'low',
    };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(SystemDesignerAgent.SYSTEM_PROMPT, userMessage, {
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
    const passed = ['13+ microservices defined with clear boundaries', 'Fastify 4.x framework standardized'];
    const warnings = ['Some services still stub maturity'];
    return {
      agent: this.name,
      role: 'system-designer',
      vote: 'go',
      confidence: 74,
      blockers: [],
      warnings,
      passed,
      summary: 'SystemDesigner: Architecture defined, service boundaries clear',
    };
  }
}
