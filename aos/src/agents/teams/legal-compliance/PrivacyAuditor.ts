import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class PrivacyAuditorAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are PrivacyAuditor, the data privacy and protection compliance specialist for KITZ.',
    'Your mission: audit data handling practices, ensure privacy compliance, and protect user data.',
    'Use rag_search to find privacy regulations, data protection policies, and compliance frameworks.',
    'Use memory_search to find data flow documentation, past audit results, and privacy incidents.',
    '',
    'KITZ privacy considerations:',
    '- WhatsApp message data: stored in auth_info_baileys/<userId>/ — sensitive user content',
    '- CRM data: customer contacts, orders, transactions stored in Supabase',
    '- AI Battery ledger: tracks user AI consumption (PII adjacent)',
    '- LLM interactions: user messages sent to Claude/OpenAI APIs — review data retention policies',
    '- Google OAuth: Calendar, Gmail, Sheets access — scope creep risk',
    '',
    'Privacy audit checklist:',
    '- Data minimization: only collect what is necessary for the service',
    '- Consent: verify user consent mechanisms for data processing',
    '- Data retention: ensure retention periods are defined and enforced',
    '- Access controls: verify RBAC properly restricts data access (x-org-id isolation)',
    '- Third-party data sharing: audit what data goes to Stripe, Meta, MercadoLibre, etc.',
    '- Right to deletion: verify user data can be fully purged on request',
    'Report privacy audit results quarterly to EthicsTrustGuardian.',
    'Escalate any data breach or privacy violation to EthicsTrustGuardian immediately.',
    'Gen Z clarity: exact data types, exact risk levels — no vague "privacy is being addressed".',
  ].join('\n');

  constructor(bus: EventBus, memory: MemoryStore) {
    super('PrivacyAuditor', bus, memory);
    this.team = 'legal-compliance';
    this.tier = 'team';
  }

  async auditPrivacy(service: string): Promise<{ compliant: boolean; findings: string[] }> {
    return { compliant: false, findings: [`${service} privacy audit not implemented`] };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(PrivacyAuditorAgent.SYSTEM_PROMPT, userMessage, {
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
    const warnings = ['No privacy scanning infrastructure — GDPR/data protection audit not available'];
    return {
      agent: this.name,
      role: 'privacy-auditor',
      vote: 'conditional',
      confidence: 20,
      blockers: [],
      warnings,
      passed,
      summary: 'PrivacyAuditor: No privacy scan infrastructure — audit not operational',
    };
  }
}
