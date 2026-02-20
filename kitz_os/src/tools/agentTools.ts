/**
 * Agent Tools — Route conversations to specialized KITZ agents.
 * Uses Claude (tiered by agent importance). Falls back to OpenAI.
 */
import { claudeChat, type ClaudeTier } from '../llm/claudeClient.js';
import type { ToolSchema } from './registry.js';

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
        const tier = AGENT_TIERS[agentType] || 'haiku';

        const systemPrompt = `You are the ${agentType.toUpperCase()} agent for KITZ, an AI Business Operating System. Be concise, actionable, and data-driven. Max 200 words.`;

        const response = await claudeChat(
          [{ role: 'user', content: context ? `${message}\n\nContext: ${context}` : message }],
          tier,
          traceId,
          systemPrompt,
        );

        return { agent: agentType, tier, response };
      },
    },
  ];
}
