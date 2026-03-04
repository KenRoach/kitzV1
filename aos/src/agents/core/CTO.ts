import { BaseAgent } from '../baseAgent.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../types.js';

/**
 * CTO Agent — Chief Technology Officer
 *
 * Owns: system health, infrastructure, security, AI pipeline, service reliability.
 * Launch gate: Systems up? AI keys configured? Security posture acceptable?
 */
export class CTOAgent extends BaseAgent {

  private static readonly SYSTEM_PROMPT = `You are the CTO of KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Chief Technology Officer — infrastructure, architecture, security, and engineering excellence.
RESPONSIBILITIES: System health, AI pipeline reliability, service architecture, security posture, tech debt management.
STYLE: Systems thinker, precise, pragmatic. Ship reliable software, not perfect software.

TECHNICAL FRAMEWORK:
1. Assess system health: services online, AI keys configured, semantic router active
2. Evaluate architecture decisions against scalability and security requirements
3. Prioritize: reliability > performance > features
4. For infrastructure changes: validate with PipelineEng and SecurityEng first
5. End with specific technical recommendations and next steps

ESCALATION: Escalate to CEO for budget decisions or strategic pivots. Flag security issues to HeadIntelligenceRisk.

Use artifact tools for code generation, n8n for workflow automation, lovable tools for frontend projects.
Backend and meta-tooling teams report to you. Think in systems, not tasks.`;

  async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(CTOAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'sonnet',
      traceId,
      maxIterations: 5,
    });

    await this.publish('CTO_RESPONSE', {
      traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
    });

    if (result.text.toLowerCase().includes('security') && result.text.toLowerCase().includes('critical')) {
      await this.handoff('HeadIntelligenceRisk', { response: result.text, traceId }, 'Critical security concern');
    }
  }

  reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const blockers: string[] = [];
    const warnings: string[] = [];
    const passed: string[] = [];

    if (ctx.killSwitch) {
      blockers.push('KILL_SWITCH is ON — all AI execution halted');
    } else {
      passed.push('Kill switch disengaged');
    }

    if (ctx.systemStatus !== 'online' && ctx.systemStatus !== 'degraded') {
      blockers.push(`System status: ${ctx.systemStatus}`);
    } else if (ctx.systemStatus === 'degraded') {
      warnings.push('System in degraded mode');
    } else {
      passed.push('System status: online');
    }

    if (!ctx.aiKeysConfigured) {
      blockers.push('No AI API keys — semantic router will fail');
    } else {
      passed.push('AI API keys configured');
    }

    if (ctx.toolCount < 50) {
      blockers.push(`Only ${ctx.toolCount} tools loaded — expected 68+`);
    } else {
      passed.push(`${ctx.toolCount} tools loaded`);
    }

    if (!ctx.jwtAuthEnabled) warnings.push('JWT auth not enabled');
    else passed.push('JWT authentication enabled');

    if (!ctx.rateLimitingEnabled) warnings.push('Rate limiting not enabled');
    else passed.push('Rate limiting active');

    if (ctx.servicesDown.length > 0) warnings.push(`Services down: ${ctx.servicesDown.join(', ')}`);
    if (ctx.servicesHealthy.length > 0) passed.push(`${ctx.servicesHealthy.length} services healthy`);

    if (!ctx.whatsappConnectorConfigured) blockers.push('WhatsApp connector not configured');
    else passed.push('WhatsApp connector configured');

    if (!ctx.semanticRouterActive) blockers.push('Semantic router inactive');
    else passed.push('5-phase semantic router active');

    const vote = blockers.length > 0 ? 'no-go' as const : warnings.length > 0 ? 'conditional' as const : 'go' as const;
    const confidence = blockers.length === 0 ? (warnings.length === 0 ? 92 : 78) : 20;

    return {
      agent: this.name, role: 'CTO', vote, confidence, blockers, warnings, passed,
      summary: vote === 'go'
        ? `Infrastructure solid. ${ctx.toolCount} tools, AI wired, all systems online. Ship it.`
        : vote === 'conditional'
          ? `Tech ready with caveats: ${warnings.join('; ')}`
          : `Tech blockers: ${blockers.join('; ')}`,
    };
  }
}
