/**
 * Agent Tools — Route conversations to specialized KITZ agents.
 * Uses the real AOS AgentExecutor runtime (LLM reasoning + tool access).
 * Falls back to claudeChat if agent is not registered.
 */
import { claudeChat, type ClaudeTier } from '../llm/claudeClient.js';
import { dispatchToAgent } from '../../../aos/src/runtime/taskDispatcher.js';
import type { ToolSchema } from './registry.js';

/** Map agent_type enum (used by LLM tool selection) to AOS agent names */
const AGENT_TYPE_TO_AOS: Record<string, string> = {
  ceo: 'CEO',
  sales: 'CRO',
  ops: 'COO',
  cfo: 'CFO',
  cto: 'CTO',
  marketing: 'CMO',
  support: 'HeadCustomer',
  onboarding: 'HeadEducation',
  analytics: 'HeadIntelligenceRisk',
};

const AGENT_TIERS: Record<string, ClaudeTier> = {
  ceo: 'opus', cfo: 'opus', cto: 'opus',
  sales: 'sonnet', ops: 'sonnet', marketing: 'sonnet', content: 'sonnet',
  support: 'haiku', onboarding: 'haiku', analytics: 'haiku',
};

export function getAllAgentTools(): ToolSchema[] {
  return [
    {
      name: 'agent_chat',
      description: 'Route a message to a specialized KITZ agent (CEO, Sales, Ops, CFO, etc.)',
      parameters: {
        type: 'object',
        properties: {
          agent_type: { type: 'string', enum: ['ceo', 'sales', 'ops', 'cfo', 'cto', 'marketing', 'support', 'onboarding', 'analytics'] },
          message: { type: 'string' },
          context: { type: 'string' },
        },
        required: ['agent_type', 'message'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const agentType = args.agent_type as string;
        const message = args.message as string;
        const context = (args.context as string) || '';
        const fullMessage = context ? `${message}\n\nContext: ${context}` : message;

        // Map to AOS agent name and dispatch via real AgentExecutor
        const aosName = AGENT_TYPE_TO_AOS[agentType];
        if (aosName) {
          const result = await dispatchToAgent(aosName, fullMessage, traceId);
          // If agent was found and responded, return real result
          if (result.iterations > 0 || !result.response.startsWith('Agent "')) {
            return {
              agent: agentType,
              aosAgent: aosName,
              response: result.response,
              toolResults: result.toolResults,
              iterations: result.iterations,
              durationMs: result.durationMs,
            };
          }
        }

        // Fallback: agent not registered, use direct claudeChat
        const tier = AGENT_TIERS[agentType] || 'haiku';
        const systemPrompt = `You are the ${agentType.toUpperCase()} agent for KITZ, an AI Business Operating System. Be concise, actionable, and data-driven. Max 200 words.`;
        const response = await claudeChat(
          [{ role: 'user', content: fullMessage }],
          tier,
          traceId,
          systemPrompt,
        );
        return { agent: agentType, tier, response, fallback: true };
      },
    },
  ];
}
