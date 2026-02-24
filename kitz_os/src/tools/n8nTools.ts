/**
 * n8n Tools — workflow automation management via n8n API.
 */
import {
  listWorkflows,
  getWorkflow,
  executeWorkflow,
  triggerWebhook,
  setWorkflowActive,
  getExecutions,
  checkHealth,
} from './n8nClient.js';
import type { ToolSchema } from './registry.js';

export function getAllN8nTools(): ToolSchema[] {
  return [
    {
      name: 'n8n_listWorkflows',
      description: 'List all n8n workflows, optionally filtered by active status',
      parameters: {
        type: 'object',
        properties: {
          active: { type: 'boolean', description: 'Filter by active/inactive status' },
        },
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const result = await listWorkflows(traceId);
        if (args.active !== undefined && result && typeof result === 'object' && 'data' in result) {
          const data = (result as Record<string, unknown>).data;
          if (Array.isArray(data)) {
            return { data: data.filter((w: Record<string, unknown>) => w.active === args.active) };
          }
        }
        return result;
      },
    },
    {
      name: 'n8n_getWorkflow',
      description: 'Get details of a single n8n workflow by its ID',
      parameters: {
        type: 'object',
        properties: {
          workflow_id: { type: 'string', description: 'The workflow ID' },
        },
        required: ['workflow_id'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => getWorkflow(args.workflow_id as string, traceId),
    },
    {
      name: 'n8n_executeWorkflow',
      description: 'Execute an n8n workflow by ID with optional input data',
      parameters: {
        type: 'object',
        properties: {
          workflow_id: { type: 'string', description: 'The workflow ID to execute' },
          data: { type: 'object', description: 'Optional input data to pass to the workflow' },
        },
        required: ['workflow_id'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) =>
        executeWorkflow(
          args.workflow_id as string,
          args.data as Record<string, unknown> | undefined,
          traceId,
        ),
    },
    {
      name: 'n8n_triggerWebhook',
      description: 'Trigger a webhook-based n8n workflow by its webhook path with optional data',
      parameters: {
        type: 'object',
        properties: {
          webhook_path: { type: 'string', description: 'The webhook path (e.g. "my-workflow")' },
          data: { type: 'object', description: 'Optional payload to send to the webhook' },
        },
        required: ['webhook_path'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) =>
        triggerWebhook(
          args.webhook_path as string,
          args.data as Record<string, unknown> | undefined,
          traceId,
        ),
    },
    {
      name: 'n8n_activateWorkflow',
      description: 'Activate or deactivate an n8n workflow',
      parameters: {
        type: 'object',
        properties: {
          workflow_id: { type: 'string', description: 'The workflow ID' },
          active: { type: 'boolean', description: 'Set true to activate, false to deactivate' },
        },
        required: ['workflow_id', 'active'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) =>
        setWorkflowActive(args.workflow_id as string, args.active as boolean, traceId),
    },
    {
      name: 'n8n_getExecutions',
      description: 'Get execution history, optionally filtered by workflow ID',
      parameters: {
        type: 'object',
        properties: {
          workflow_id: { type: 'string', description: 'Filter executions by workflow ID' },
          limit: { type: 'number', description: 'Max number of executions to return' },
        },
      },
      riskLevel: 'low',
      execute: async (args, traceId) =>
        getExecutions(
          args.workflow_id as string | undefined,
          args.limit as number | undefined,
          traceId,
        ),
    },
    {
      name: 'n8n_healthCheck',
      description: 'Check if the n8n instance is healthy and reachable',
      parameters: {
        type: 'object',
        properties: {},
      },
      riskLevel: 'low',
      execute: async (_args, traceId) => checkHealth(traceId),
    },
  ];
}
