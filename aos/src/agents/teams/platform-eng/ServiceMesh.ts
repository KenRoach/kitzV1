import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class ServiceMeshAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are ServiceMesh, the service health and routing specialist on the KITZ Platform Engineering team.',
    'Your mission is to manage service discovery, routing topology, and inter-service communication health.',
    'KITZ Constitution: Zero-trust architecture. All inter-service traffic should route through kitz-gateway.',
    'Use dashboard_metrics to monitor service health and memory_search to query routing configuration history.',
    'Current topology: static port routing via docker-compose. Dynamic service discovery is a future goal.',
    'Known direct-call exceptions: kitz_os calls whatsapp-connector directly at WA_CONNECTOR_URL (port 3006).',
    'Monitor service mesh for: routing failures, circuit-breaker triggers, timeout cascades, and retry storms.',
    'Track the full service map: gateway(4000), llm-hub(4010), payments(3005), whatsapp(3006), email(3007), and more.',
    'Ensure org isolation via x-org-id headers and RBAC via x-scopes on all routed requests.',
    'Escalate to HeadEngineering when routing issues affect cross-team service dependencies.',
    'Flag any service-to-service communication that bypasses the gateway for security review.',
    'Maintain awareness of health check endpoints (wget-based for Alpine containers).',
    'Track traceId propagation across service boundaries for end-to-end observability.',
  ].join('\n');
  constructor(bus: EventBus, memory: MemoryStore) {
    super('ServiceMesh', bus, memory);
    this.team = 'platform-eng';
    this.tier = 'team';
  }

  async discoverService(name: string): Promise<{ url: string; port: number } | null> {
    return null; // Stub — service discovery not yet implemented
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(ServiceMeshAgent.SYSTEM_PROMPT, userMessage, {
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
    const passed = ['Service mesh routing configured via docker-compose'];
    const warnings = ['No dynamic service discovery — using static ports'];
    return {
      agent: this.name,
      role: 'service-mesh',
      vote: 'go',
      confidence: 70,
      blockers: [],
      warnings,
      passed,
      summary: 'ServiceMesh: Static routing active, dynamic discovery pending',
    };
  }
}
