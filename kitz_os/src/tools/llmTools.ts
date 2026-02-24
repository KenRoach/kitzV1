/**
 * LLM Tools — Direct access to Anthropic Claude and OpenAI APIs for AOS swarm agents.
 *
 * These tools let agents invoke LLM completions during swarm runs
 * for analysis, synthesis, and decision-making. Tiered by model.
 *
 * Uses existing claudeClient.ts which handles fallback routing.
 */

import { claudeChat, claudeThink, type ClaudeTier } from '../llm/claudeClient.js';
import type { ToolSchema } from './registry.js';

export function getAllLlmTools(): ToolSchema[] {
  return [
    {
      name: 'llm_complete',
      description: 'Send a prompt to the LLM (Claude with OpenAI fallback). Specify tier: opus (strategic), sonnet (analysis), haiku (fast/cheap).',
      parameters: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'The user message/prompt to send' },
          tier: { type: 'string', enum: ['opus', 'sonnet', 'haiku'], description: 'Model tier: opus=strategic, sonnet=analysis, haiku=fast' },
          system: { type: 'string', description: 'Optional system prompt for context' },
          context: { type: 'string', description: 'Optional additional context appended to prompt' },
        },
        required: ['prompt'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const prompt = args.prompt as string;
        const tier = (args.tier as ClaudeTier) || 'haiku';
        const system = args.system as string | undefined;
        const context = args.context as string | undefined;

        const fullPrompt = context ? `${prompt}\n\nContext: ${context}` : prompt;

        const response = await claudeChat(
          [{ role: 'user', content: fullPrompt }],
          tier,
          traceId,
          system,
        );

        return { tier, response, model: tier === 'opus' ? 'claude-opus-4-6' : tier === 'sonnet' ? 'claude-sonnet-4-20250514' : 'claude-haiku-4-5-20251001' };
      },
    },
    {
      name: 'llm_analyze',
      description: 'Ask the LLM to analyze data and return structured insights. Uses sonnet tier by default.',
      parameters: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: 'What to analyze (e.g., "customer churn", "sales pipeline")' },
          data: { type: 'string', description: 'Data or context to analyze (JSON, text, metrics)' },
          format: { type: 'string', enum: ['summary', 'bullets', 'json', 'action-items'], description: 'Output format' },
        },
        required: ['topic', 'data'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const topic = args.topic as string;
        const data = args.data as string;
        const format = (args.format as string) || 'bullets';

        const formatInstructions: Record<string, string> = {
          summary: 'Respond with a concise 2-3 sentence summary.',
          bullets: 'Respond with 3-7 bullet points. Each should be actionable.',
          json: 'Respond with valid JSON: { "insights": string[], "risks": string[], "recommendations": string[] }',
          'action-items': 'Respond with a numbered list of action items, highest priority first.',
        };

        const system = `You are an AI analyst for KITZ, an AI Business Operating System for small businesses in Latin America. Be concise, data-driven, actionable. ${formatInstructions[format] || formatInstructions.bullets}`;

        const response = await claudeChat(
          [{ role: 'user', content: `Analyze: ${topic}\n\nData:\n${data}` }],
          'sonnet',
          traceId,
          system,
        );

        return { topic, format, analysis: response };
      },
    },
    {
      name: 'llm_strategize',
      description: 'Ask the LLM for strategic thinking on a business problem. Uses opus tier (most capable).',
      parameters: {
        type: 'object',
        properties: {
          question: { type: 'string', description: 'The strategic question to think about' },
          context: { type: 'string', description: 'Business context, constraints, and goals' },
        },
        required: ['question'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const question = args.question as string;
        const context = (args.context as string) || '';

        const response = await claudeThink(question, context, traceId);

        return { question, strategy: response, tier: 'opus' };
      },
    },
  ];
}
