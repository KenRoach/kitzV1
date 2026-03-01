/**
 * Inventory Optimizer Tools — Stock levels, reorder points, dead stock detection.
 * 1 tool: inventory_optimize (low)
 */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('inventoryOptimizerTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';

const SYSTEM = 'You are an inventory optimizer for LatAm SMBs. Optimize stock levels, reorder points, dead stock. Spanish default. Respond with JSON: { "products": [{ "product": string, "reorderAt": number, "orderQuantity": number }], "deadStockRisk": [string], "recommendations": [string], "actionSteps": [string] }';



export function getAllInventoryOptimizerTools(): ToolSchema[] {
  return [{ name: 'inventory_optimize', description: 'Optimize inventory: reorder points, dead stock detection, stock recommendations for each product.', parameters: { type: 'object', properties: { products: { type: 'string', description: 'JSON array of products: [{ "name": string, "currentStock": number, "monthlySales": number, "cost": number }]' }, currency: { type: 'string', description: 'Currency (default: USD)' } }, required: ['products'] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYSTEM, `Inventory: ${args.products}`); let parsed; try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { parsed = { raw: raw }; } log.info('executed', { trace_id: traceId }); return parsed; } }];
}
