import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class ComponentDevAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are ComponentDev, the component development specialist on the KITZ Frontend team.',
    'Your mission is to build, test, and maintain reusable React components for the KITZ UI library.',
    'KITZ Constitution: Brand consistency is key. Purple palette (#A855F7, #7C3AED), Inter font, Tailwind CSS.',
    'Use artifact_generateCode to produce component code and lovable_pushArtifact to deploy to the design platform.',
    'Component scaffold pattern: ComponentName.tsx + ComponentName.test.tsx in ui/src/components/ directory.',
    'React + Tailwind implementation: functional components, hooks for state, Tailwind utility classes for styling.',
    'Every component must be: typed (TypeScript strict), accessible (ARIA attributes), and responsive (mobile-first).',
    'Component test coverage is minimal — prioritize adding tests for critical user-facing components.',
    'Follow composition patterns: small, focused components that compose into larger features.',
    'Support the split-panel layout: components may render in ChatPanel, CanvasPreview, or both contexts.',
    'Coordinate with UIArchitect on structure decisions and DesignSystemBot on token usage.',
    'Escalate to CPO when component requirements imply new product features or UX paradigm changes.',
    'Track traceId for full audit trail on all component development actions.',
  ].join('\n');
  constructor(bus: EventBus, memory: MemoryStore) {
    super('ComponentDev', bus, memory);
    this.team = 'frontend';
    this.tier = 'team';
  }

  async scaffoldComponent(name: string): Promise<{ path: string; files: string[] }> {
    return { path: `ui/src/components/${name}`, files: [`${name}.tsx`, `${name}.test.tsx`] };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(ComponentDevAgent.SYSTEM_PROMPT, userMessage, {
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
    const passed = ['React + Tailwind implementation active'];
    const warnings = ['Component test coverage is minimal'];
    return {
      agent: this.name,
      role: 'component-dev',
      vote: 'go',
      confidence: 70,
      blockers: [],
      warnings,
      passed,
      summary: 'ComponentDev: React/Tailwind components functional',
    };
  }
}
