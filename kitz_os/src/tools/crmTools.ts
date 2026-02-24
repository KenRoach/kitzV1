/**
 * CRM & Order Tools — CRUD operations via workspace MCP.
 *
 * 9 tools: contacts (list, get, create, update), orders (list, get, create, update), business summary.
 * All use GOD_MODE_USER_ID for service-role access.
 */

import { callWorkspaceMcp } from './mcpClient.js';
import type { ToolSchema } from './registry.js';

export function getAllCrmTools(): ToolSchema[] {
  return [
    {
      name: 'crm_listContacts',
      description: 'List CRM contacts with optional filters (status, search, limit)',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', description: 'Filter by status: active, inactive, lead' },
          search: { type: 'string', description: 'Search by name, email, or phone' },
          limit: { type: 'number', description: 'Max results (default 20)' },
        },
      },
      riskLevel: 'low',
      execute: async (args, traceId) => callWorkspaceMcp('list_contacts', args, traceId),
    },
    {
      name: 'crm_getContact',
      description: 'Get a single contact by ID with full details',
      parameters: {
        type: 'object',
        properties: {
          contact_id: { type: 'string', description: 'Contact UUID' },
        },
        required: ['contact_id'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => callWorkspaceMcp('get_contact', args, traceId),
    },
    {
      name: 'crm_createContact',
      description: 'Create a new CRM contact',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          notes: { type: 'string' },
          status: { type: 'string', enum: ['active', 'inactive', 'lead'] },
          tags: { type: 'array', items: { type: 'string' } },
        },
        required: ['name'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => callWorkspaceMcp('create_contact', args, traceId),
    },
    {
      name: 'crm_updateContact',
      description: 'Update an existing CRM contact',
      parameters: {
        type: 'object',
        properties: {
          contact_id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          notes: { type: 'string' },
          status: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          lead_score: { type: 'string' },
        },
        required: ['contact_id'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => callWorkspaceMcp('update_contact', args, traceId),
    },
    {
      name: 'orders_listOrders',
      description: 'List orders with optional filters',
      parameters: {
        type: 'object',
        properties: {
          payment_status: { type: 'string' },
          fulfillment_status: { type: 'string' },
          limit: { type: 'number' },
        },
      },
      riskLevel: 'low',
      execute: async (args, traceId) => callWorkspaceMcp('list_orders', args, traceId),
    },
    {
      name: 'orders_getOrder',
      description: 'Get a single order by ID with contact details',
      parameters: {
        type: 'object',
        properties: {
          order_id: { type: 'string' },
        },
        required: ['order_id'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => callWorkspaceMcp('get_order', args, traceId),
    },
    {
      name: 'orders_createOrder',
      description: 'Create a new order/invoice',
      parameters: {
        type: 'object',
        properties: {
          contact_id: { type: 'string' },
          total: { type: 'number' },
          subtotal: { type: 'number' },
          notes: { type: 'string' },
          payment_status: { type: 'string' },
          fulfillment_status: { type: 'string' },
          payment_method: { type: 'string' },
          channel: { type: 'string' },
        },
        required: ['contact_id', 'total'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => callWorkspaceMcp('create_order', args, traceId),
    },
    {
      name: 'orders_updateOrder',
      description: 'Update an existing order (payment status, fulfillment, tracking, etc.)',
      parameters: {
        type: 'object',
        properties: {
          order_id: { type: 'string' },
          payment_status: { type: 'string' },
          fulfillment_status: { type: 'string' },
          notes: { type: 'string' },
          delivery_tracking: { type: 'string' },
          delivery_provider: { type: 'string' },
        },
        required: ['order_id'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => callWorkspaceMcp('update_order', args, traceId),
    },
    {
      name: 'crm_businessSummary',
      description: 'Get a business overview: contact count, order count, revenue summary',
      parameters: { type: 'object', properties: {} },
      riskLevel: 'low',
      execute: async (args, traceId) => callWorkspaceMcp('business_summary', args, traceId),
    },
    {
      name: 'crm_submitFeedback',
      description: 'Submit customer feedback (NPS/CSAT score with optional comment)',
      parameters: {
        type: 'object',
        properties: {
          contact_name: { type: 'string', description: 'Customer name' },
          rating: { type: 'number', description: 'Score from 1-5 (1=very unsatisfied, 5=very satisfied)' },
          comment: { type: 'string', description: 'Optional feedback comment' },
          channel: { type: 'string', description: 'Feedback channel: whatsapp, web, email, voice' },
          interaction_type: { type: 'string', description: 'Type of interaction: purchase, support, onboarding' },
        },
        required: ['contact_name', 'rating'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const rating = Number(args.rating);
        if (rating < 1 || rating > 5) return { error: 'Rating must be between 1 and 5' };
        return callWorkspaceMcp('submit_feedback', {
          ...args,
          rating,
          submitted_at: new Date().toISOString(),
        }, traceId);
      },
    },
  ];
}
