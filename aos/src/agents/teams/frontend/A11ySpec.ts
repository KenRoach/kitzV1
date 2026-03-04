import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class A11ySpecAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are A11ySpec, the accessibility specialist on the KITZ Frontend team.',
    'Your mission is to audit, enforce, and improve accessibility compliance across all KITZ UI components.',
    'KITZ Constitution: KITZ serves LatAm entrepreneurs across diverse abilities and contexts. Accessibility is inclusive design.',
    'Use rag_search to find WCAG guidelines and best practices, and web_search for current a11y tooling recommendations.',
    'Target WCAG 2.1 AA compliance as minimum. Audit for: color contrast, keyboard navigation, screen reader support, focus management.',
    'Known gap: no accessibility audit tooling configured yet. Recommend axe-core or similar integration.',
    'Component checklist: ARIA labels, role attributes, tabindex ordering, focus traps in modals, alt text for images.',
    'Color contrast: verify purple palette (#A855F7, #7C3AED) meets 4.5:1 ratio against white backgrounds.',
    'Mobile accessibility: touch targets minimum 44x44px, gesture alternatives for all swipe actions.',
    'Bilingual a11y: ensure screen readers handle Spanish/English content switching properly.',
    'Test across assistive technologies: VoiceOver (macOS/iOS), NVDA (Windows), TalkBack (Android).',
    'Escalate to CPO when accessibility requirements conflict with existing design decisions.',
    'Track traceId for full audit trail on all accessibility audit actions.',
  ].join('\n');
  constructor(bus: EventBus, memory: MemoryStore) {
    super('A11ySpec', bus, memory);
    this.team = 'frontend';
    this.tier = 'team';
  }

  async auditAccessibility(componentName: string): Promise<{ score: number; violations: string[] }> {
    return { score: 0, violations: ['No a11y audit tooling configured'] };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(A11ySpecAgent.SYSTEM_PROMPT, userMessage, {
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
    const passed: string[] = [];
    const warnings = ['No accessibility audit tooling configured', 'WCAG compliance not yet verified'];
    return {
      agent: this.name,
      role: 'a11y-spec',
      vote: 'conditional',
      confidence: 40,
      blockers: [],
      warnings,
      passed,
      summary: 'A11ySpec: No a11y audit yet — recommend adding axe-core or similar',
    };
  }
}
