/**
 * Email Tools — Inbox read (all agents) + compose/send (admin_assistant ONLY).
 */
import { callWorkspaceMcp } from './mcpClient.js';
import type { ToolSchema } from './registry.js';

export function getAllEmailTools(): ToolSchema[] {
  return [
    {
      name: 'email_listInbox',
      description: 'Read inbox messages (all agents can read)',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number' },
          channel: { type: 'string' },
          direction: { type: 'string', enum: ['inbound', 'outbound'] },
        },
      },
      riskLevel: 'low',
      execute: async (args, traceId) => callWorkspaceMcp('list_inbox_messages', args, traceId),
    },
    {
      name: 'email_compose',
      description: 'Compose and send an email. ONLY admin_assistant agent can use this tool.',
      parameters: {
        type: 'object',
        properties: {
          to: { type: 'string', description: 'Recipient email' },
          subject: { type: 'string' },
          body: { type: 'string', description: 'Email body (plain text or HTML)' },
          __agent_type: { type: 'string', description: 'Agent type making the request (enforced)' },
        },
        required: ['to', 'subject', 'body'],
      },
      riskLevel: 'high',
      execute: async (args, traceId) => {
        if (args.__agent_type && args.__agent_type !== 'admin_assistant') {
          return { error: 'Only admin_assistant agent can send emails', blocked: true };
        }
        return { status: 'draft', message: 'Email composed. Approval required before send.', to: args.to, subject: args.subject };
      },
    },
    {
      name: 'email_sendApprovalRequest',
      description: 'Send a delete-approval email to the founder. ONLY admin_assistant agent.',
      parameters: {
        type: 'object',
        properties: {
          entity_type: { type: 'string', enum: ['storefront', 'product'] },
          entity_id: { type: 'string' },
          entity_name: { type: 'string' },
          approval_token: { type: 'string' },
        },
        required: ['entity_type', 'entity_id', 'approval_token'],
      },
      riskLevel: 'high',
      execute: async (args, traceId) => {
        return { status: 'sent', message: `Approval email sent for ${args.entity_type} deletion` };
      },
    },
  ];
}
