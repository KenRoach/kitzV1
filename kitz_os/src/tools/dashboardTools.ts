/**
 * Dashboard Tools — Real-time KPI metrics via MCP.
 */
import { callXyz88Mcp } from './mcpClient.js';
import type { ToolSchema } from './registry.js';

export function getAllDashboardTools(): ToolSchema[] {
  return [
    {
      name: 'dashboard_metrics',
      description: 'Get all dashboard KPIs: today revenue, active orders, follow-ups, hot leads, risky orders',
      parameters: { type: 'object', properties: {} },
      riskLevel: 'low',
      execute: async (args, traceId) => callXyz88Mcp('dashboard_metrics', args, traceId),
    },
  ];
}
