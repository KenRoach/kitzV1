/**
 * Storefront & Product Tools — CRUD via xyz88-io MCP.
 */
import { callXyz88Mcp } from './mcpClient.js';
import type { ToolSchema } from './registry.js';

export function getAllStorefrontTools(): ToolSchema[] {
  return [
    {
      name: 'storefronts_list',
      description: 'List storefronts/payment links',
      parameters: { type: 'object', properties: { status: { type: 'string' }, limit: { type: 'number' } } },
      riskLevel: 'low',
      execute: async (args, traceId) => callXyz88Mcp('list_storefronts', args, traceId),
    },
    {
      name: 'storefronts_create',
      description: 'Create a new storefront/payment link/invoice',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          price: { type: 'number' },
          buyer_name: { type: 'string' },
          buyer_phone: { type: 'string' },
          buyer_email: { type: 'string' },
        },
        required: ['title', 'price'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => callXyz88Mcp('create_storefront', args, traceId),
    },
    {
      name: 'storefronts_update',
      description: 'Update a storefront',
      parameters: {
        type: 'object',
        properties: { storefront_id: { type: 'string' }, title: { type: 'string' }, description: { type: 'string' }, price: { type: 'number' } },
        required: ['storefront_id'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => callXyz88Mcp('update_storefront', args, traceId),
    },
    {
      name: 'storefronts_markPaid',
      description: 'Mark a storefront as paid (6-step transaction: update status, upsert contact, create order, create items, log activity)',
      parameters: {
        type: 'object',
        properties: { storefront_id: { type: 'string' } },
        required: ['storefront_id'],
      },
      riskLevel: 'high',
      execute: async (args, traceId) => callXyz88Mcp('mark_storefront_paid', args, traceId),
    },
    {
      name: 'storefronts_send',
      description: 'Send a storefront link to a buyer (marks as sent)',
      parameters: {
        type: 'object',
        properties: { storefront_id: { type: 'string' } },
        required: ['storefront_id'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => callXyz88Mcp('send_storefront', args, traceId),
    },
    {
      name: 'storefronts_delete',
      description: 'Delete a storefront (requires email approval)',
      parameters: {
        type: 'object',
        properties: { storefront_id: { type: 'string' }, approval_token: { type: 'string' } },
        required: ['storefront_id'],
      },
      riskLevel: 'critical',
      execute: async (args, traceId) => {
        if (!args.approval_token) {
          return { pending: true, message: 'Delete requires email approval. Approval request will be sent.' };
        }
        return callXyz88Mcp('delete_storefront', args, traceId);
      },
    },
    {
      name: 'products_list',
      description: 'List catalog products',
      parameters: { type: 'object', properties: { limit: { type: 'number' } } },
      riskLevel: 'low',
      execute: async (args, traceId) => callXyz88Mcp('list_products', args, traceId),
    },
    {
      name: 'products_create',
      description: 'Create a new product',
      parameters: {
        type: 'object',
        properties: { name: { type: 'string' }, description: { type: 'string' }, price: { type: 'number' }, cost: { type: 'number' } },
        required: ['name', 'price'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => callXyz88Mcp('create_product', args, traceId),
    },
    {
      name: 'products_update',
      description: 'Update an existing product',
      parameters: {
        type: 'object',
        properties: { product_id: { type: 'string' }, name: { type: 'string' }, description: { type: 'string' }, price: { type: 'number' } },
        required: ['product_id'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => callXyz88Mcp('update_product', args, traceId),
    },
    {
      name: 'products_delete',
      description: 'Delete a product (requires email approval)',
      parameters: {
        type: 'object',
        properties: { product_id: { type: 'string' }, approval_token: { type: 'string' } },
        required: ['product_id'],
      },
      riskLevel: 'critical',
      execute: async (args, traceId) => {
        if (!args.approval_token) {
          return { pending: true, message: 'Delete requires email approval. Approval request will be sent.' };
        }
        return callXyz88Mcp('delete_product', args, traceId);
      },
    },
  ];
}
