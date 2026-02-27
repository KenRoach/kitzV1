/**
 * Clarification Tools — Lets the AI request more information from the user.
 *
 * When the brain can't fulfill a request without additional context,
 * it uses these tools to ask the user a question. The orchestrator
 * sets the task status to 'pending_clarification' and sends the
 * question via the originating channel.
 */

import type { ToolSchema } from './registry.js';

export function getAllClarificationTools(): ToolSchema[] {
  return [
    {
      name: 'ask_clarification',
      description: 'Ask the user for more information when you cannot complete a task without additional context. Use this when the request is ambiguous, missing key details, or when you need to confirm before proceeding. The question will be sent to the user on their originating channel (WhatsApp, email, or workspace).',
      parameters: {
        type: 'object',
        properties: {
          question: {
            type: 'string',
            description: 'The specific question to ask the user. Be clear and concise. If multiple pieces of info are needed, list them. Include examples when helpful.',
          },
          context: {
            type: 'string',
            description: 'Brief context about what you understood so far and why you need clarification.',
          },
          suggestions: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional quick-reply suggestions the user can choose from.',
          },
        },
        required: ['question'],
      },
      riskLevel: 'low' as const,
      execute: async (args: Record<string, unknown>, traceId?: string) => {
        const question = String(args.question || '');
        const context = args.context ? String(args.context) : undefined;
        const suggestions = Array.isArray(args.suggestions) ? args.suggestions.map(String) : undefined;

        if (!question) {
          return { error: 'Question is required for clarification request' };
        }

        // The semantic router will intercept this result and route it through
        // the channel orchestrator's requestClarification() function
        return {
          type: 'clarification_request',
          question,
          context,
          suggestions,
          traceId,
          message: `Clarification requested: ${question}`,
        };
      },
    },
    {
      name: 'schedule_followup',
      description: 'Schedule a follow-up message to be sent to the user at a later time. Use this when you have a partial answer now but need time to prepare a complete response, or when the user should be reminded about something.',
      parameters: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'The follow-up message to send to the user.',
          },
          delay_hours: {
            type: 'number',
            description: 'Hours from now to send the follow-up. Default: 24. Max: 72.',
          },
          reason: {
            type: 'string',
            description: 'Why this follow-up is being scheduled (for audit trail).',
          },
        },
        required: ['message'],
      },
      riskLevel: 'low' as const,
      execute: async (args: Record<string, unknown>, traceId?: string) => {
        const message = String(args.message || '');
        const delayHours = Math.min(Number(args.delay_hours || 24), 72);
        const reason = args.reason ? String(args.reason) : undefined;

        if (!message) {
          return { error: 'Message is required for follow-up scheduling' };
        }

        const scheduledFor = new Date(Date.now() + delayHours * 60 * 60 * 1000).toISOString();

        // The cadence engine or a background job will pick this up
        return {
          type: 'followup_scheduled',
          message,
          scheduledFor,
          delayHours,
          reason,
          traceId,
          status: 'scheduled',
        };
      },
    },
  ];
}
