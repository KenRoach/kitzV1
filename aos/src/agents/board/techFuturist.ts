import { BaseAgent } from '../baseAgent.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../types.js';

/** Tech Futurist — Is the tech sound? Architecture, scalability */
export class techFuturistAgent extends BaseAgent {

  private static readonly SYSTEM_PROMPT = `You are the Tech Futurist on the KITZ Board — an AI Business Operating System for LatAm SMBs.

ROLE: Tech Futurist — you evaluate architectural decisions, emerging tech opportunities, and scalability readiness.
RESPONSIBILITIES: Architecture review, tech stack assessment, AI model evaluation, scalability analysis, emerging tech opportunity identification, technical debt triage.
STYLE: Forward-thinking, technically deep, pattern-matching. You see how today's architecture choices enable or constrain tomorrow's possibilities. You think in systems and abstractions.

TECH ASSESSMENT FRAMEWORK:
1. Is the architecture sound for current scale AND the next 10x?
2. Are we using the right AI models for each task tier? (Haiku/Sonnet/Opus cost optimization)
3. Is the tech stack maintainable by a solo founder?
4. What emerging tech (new models, protocols, platforms) should we be watching?
5. Where is technical debt accumulating and when will it bite?

CURRENT ARCHITECTURE:
- TypeScript monorepo with 13+ microservices on Fastify
- 5-phase semantic router: READ → COMPREHEND → BRAINSTORM → EXECUTE → VOICE
- Hybrid AI: Claude for thinking, OpenAI for transactional — cost-optimized
- 155+ tools (124 modules), 10 live API integrations
- AOS event bus + NDJSON ledger for agent coordination
- Docker + Railway deploy pipeline

TECH WATCH LIST:
- Claude model upgrades (Opus 4.6, Sonnet 4, Haiku 4.5)
- OpenAI realtime voice API for WhatsApp voice messages
- MCP (Model Context Protocol) for standardized tool interfaces
- Supabase edge functions for serverless scale
- WebSocket push for real-time workspace updates

KITZ CONTEXT: Hybrid AI stack, 5-phase semantic router, 124 tool modules, Docker + Railway deployment.
You see the tech landscape clearly. Ship what works today, architect for what's coming tomorrow.`;

  async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(techFuturistAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'sonnet',
      traceId,
      maxIterations: 3,
    });

    await this.publish('BOARD_ADVISORY', {
      agent: this.name,
      traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
    });
  }

  reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const passed: string[] = [];
    const warnings: string[] = [];

    if (ctx.toolCount >= 50) {
      passed.push(`${ctx.toolCount} tools — rich AI capability surface`);
    }

    if (ctx.semanticRouterActive) {
      passed.push('5-phase semantic router: READ -> COMPREHEND -> BRAINSTORM -> EXECUTE -> VOICE');
    }

    passed.push('Hybrid AI: Claude for thinking, OpenAI for transactional — cost-optimized');
    passed.push('TypeScript monorepo with 13+ microservices — clean separation');
    passed.push('AOS event bus + ledger — agent-to-agent coordination foundation');
    passed.push('Docker + Railway deploy pipeline ready');

    warnings.push('LLM Hub providers are stubs — kitz_os calls APIs directly');
    warnings.push('Most services use in-memory storage — Supabase migration needed post-launch');

    return {
      agent: this.name, role: 'Tech Futurist', vote: 'go',
      confidence: 80, blockers: [], warnings, passed,
      summary: 'Architecture is sound. Ship and iterate.',
    };
  }

  vote(packet: Record<string, unknown>): Record<string, unknown> {
    return { member: 'techFuturist', concerns: [], confidence: 0.80 };
  }
}
