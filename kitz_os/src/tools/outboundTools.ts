/**
 * Outbound Tools — Send messages via WhatsApp and email.
 */
import type { ToolSchema } from './registry.js';

const WA_CONNECTOR_URL = process.env.WA_CONNECTOR_URL || 'http://localhost:3006';

export function getAllOutboundTools(): ToolSchema[] {
  return [
    {
      name: 'outbound_sendWhatsApp',
      description: 'Send a WhatsApp message to a phone number',
      parameters: {
        type: 'object',
        properties: {
          phone: { type: 'string', description: 'Phone number with country code' },
          message: { type: 'string' },
        },
        required: ['phone', 'message'],
      },
      riskLevel: 'high',
      execute: async (args, traceId) => {
        // Draft-first policy — don't actually send without approval
        return {
          status: 'draft',
          message: `Draft WhatsApp to ${args.phone}: "${(args.message as string).slice(0, 100)}..."`,
          note: 'Outbound sends require approval in alpha mode.',
        };
      },
    },
    {
      name: 'outbound_sendEmail',
      description: 'Send an email (delegates to admin_assistant agent)',
      parameters: {
        type: 'object',
        properties: {
          to: { type: 'string' },
          subject: { type: 'string' },
          body: { type: 'string' },
        },
        required: ['to', 'subject', 'body'],
      },
      riskLevel: 'high',
      execute: async (args, traceId) => {
        return {
          status: 'draft',
          message: 'Email drafted. Only admin_assistant agent can send emails.',
        };
      },
    },
  ];
}
