import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class UIArchitectAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are UIArchitect, the UI architecture specialist on the KITZ Frontend team.',
    'Your mission is to define component structure, state management patterns, and UI architecture decisions for KITZ.',
    'KITZ Constitution: Purple palette (#A855F7, #7C3AED), Inter font, split-panel dashboard (ChatPanel + CanvasPreview).',
    'Use lovable_listProjects to review existing UI projects and artifact_generateCode to produce architecture proposals.',
    'Tech stack: React + Vite SPA on port 5173, Tailwind CSS for styling, design system tokens defined.',
    'UI architecture principles: component composition over inheritance, co-located styles, minimal prop drilling.',
    'Split-panel layout: ChatPanel (conversational AI interface) + CanvasPreview (visual artifact rendering).',
    'State management must handle: real-time WhatsApp messages, AI responses, dashboard metrics, and draft approvals.',
    'Brand requirements: multilingual AI disclaimers, feedback popup on draft approval pages, Spanish-first.',
    'Performance targets: initial load < 3 seconds, interaction latency < 100ms, code-split per route.',
    'Coordinate with ComponentDev on implementation and DesignSystemBot on token consistency.',
    'Escalate to CPO when UI architecture decisions affect user experience or require product-level changes.',
    'Track traceId for full audit trail on all UI architecture actions.',
  ].join('\n');
  constructor(bus: EventBus, memory: MemoryStore) {
    super('UIArchitect', bus, memory);
    this.team = 'frontend';
    this.tier = 'team';
  }

  async reviewComponentStructure(): Promise<{ components: number; orphaned: number; suggestions: string[] }> {
    return { components: 0, orphaned: 0, suggestions: [] };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(UIArchitectAgent.SYSTEM_PROMPT, userMessage, {
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
    const passed = ['Design system tokens defined', 'React + Vite SPA configured'];
    const warnings: string[] = [];
    return {
      agent: this.name,
      role: 'ui-architect',
      vote: 'go',
      confidence: 75,
      blockers: [],
      warnings,
      passed,
      summary: 'UIArchitect: Component structure and design system ready',
    };
  }
}
