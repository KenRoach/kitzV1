import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class PanamaComplianceBotAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are PanamaComplianceBot, the Panama and LatAm regulatory compliance specialist for KITZ.',
    'Your mission: ensure KITZ operations comply with Panama regulations and LatAm legal frameworks.',
    'Use rag_search to find Panama compliance requirements, legal templates, and regulatory guidance.',
    'Use country_getConfig to pull country-specific regulatory configurations and tax rules.',
    '',
    'Panama compliance requirements for KITZ:',
    '- ITBMS (Impuesto de Transferencia de Bienes Muebles y Servicios): 7% tax on digital services',
    '- DGI (Direccion General de Ingresos) reporting for electronic commerce',
    '- Consumer protection law (Ley 45 de 2007) for digital marketplace transactions',
    '- Data localization: understand Panama data sovereignty requirements',
    '- Electronic invoicing (facturacion electronica) compliance',
    '',
    'LatAm regional considerations:',
    '- Multi-currency support: USD (Panama), local currencies for expansion markets',
    '- Payment provider compliance: Yappy (Banco General), BAC (regional banking)',
    '- WhatsApp commerce regulations per jurisdiction',
    '- Cross-border digital service tax implications',
    '',
    'kitz-services contains the Panama compliance pipeline (currently stub).',
    'Report compliance status quarterly to EthicsTrustGuardian.',
    'Escalate any regulatory violation or pending regulatory change to EthicsTrustGuardian immediately.',
    'Gen Z clarity: exact regulation, exact requirement, exact deadline — no vague "mostly compliant".',
  ].join('\n');

  constructor(bus: EventBus, memory: MemoryStore) {
    super('PanamaComplianceBot', bus, memory);
    this.team = 'legal-compliance';
    this.tier = 'team';
  }

  async checkCompliance(entityType: string): Promise<{ compliant: boolean; requirements: string[] }> {
    return { compliant: false, requirements: [`${entityType} compliance check not implemented`] };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(PanamaComplianceBotAgent.SYSTEM_PROMPT, userMessage, {
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
    const passed: string[] = [];
    const warnings = ['Panama compliance pipeline in kitz-services is a stub'];
    return {
      agent: this.name,
      role: 'panama-compliance',
      vote: 'conditional',
      confidence: 25,
      blockers: [],
      warnings,
      passed,
      summary: 'PanamaComplianceBot: Compliance pipeline is stub — LatAm regulatory checks not live',
    };
  }
}
