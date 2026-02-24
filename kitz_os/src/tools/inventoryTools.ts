/**
 * Inventory Tools — stock checks, adjustments, and low-stock alerts via workspace MCP.
 */
import { callWorkspaceMcp } from './mcpClient.js';
import type { ToolSchema } from './registry.js';

export function getAllInventoryTools(): ToolSchema[] {
  return [
    {
      name: 'inventory_checkStock',
      description: 'Check current stock level for a product by product_id or sku',
      parameters: {
        type: 'object',
        properties: {
          product_id: { type: 'string', description: 'Product UUID' },
          sku: { type: 'string', description: 'Product SKU' },
        },
      },
      riskLevel: 'low',
      execute: async (args, traceId) => callWorkspaceMcp('check_stock', args, traceId),
    },
    {
      name: 'inventory_adjustStock',
      description: 'Adjust stock quantity with a delta (positive for restock, negative for sale)',
      parameters: {
        type: 'object',
        properties: {
          product_id: { type: 'string', description: 'Product UUID' },
          delta: { type: 'number', description: 'Stock change: positive to add, negative to subtract' },
          reason: {
            type: 'string',
            description: 'Reason for adjustment',
            enum: ['sale', 'return', 'restock', 'adjustment', 'damaged', 'lost'],
          },
        },
        required: ['product_id', 'delta', 'reason'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => callWorkspaceMcp('adjust_stock', args, traceId),
    },
    {
      name: 'inventory_lowStockAlerts',
      description: 'Get all products at or below their low-stock threshold',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Max results (default all)' },
        },
      },
      riskLevel: 'low',
      execute: async (args, traceId) => callWorkspaceMcp('low_stock_alerts', args, traceId),
    },
  ];
}
