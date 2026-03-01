/**
 * Inventory Optimizer Tools — Stock levels, reorder points, dead stock detection.
 * 1 tool: inventory_optimize (low)
 */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('inventoryOptimizerTools');
import type { ToolSchema } from './registry.js';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const OPENAI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
const SYSTEM = 'You are an inventory optimizer for LatAm SMBs. Optimize stock levels, reorder points, dead stock. Spanish default. Respond with JSON: { "products": [{ "product": string, "reorderAt": number, "orderQuantity": number }], "deadStockRisk": [string], "recommendations": [string], "actionSteps": [string] }';

async function callLLM(input: string): Promise<string> {
  if (CLAUDE_API_KEY) { try { const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1024, temperature: 0.2, system: SYSTEM, messages: [{ role: 'user', content: input }] }), signal: AbortSignal.timeout(15_000) }); if (r.ok) { const d = await r.json() as { content: Array<{ type: string; text?: string }> }; return d.content?.find(c => c.type === 'text')?.text || ''; } } catch { /* fall */ } }
  if (OPENAI_API_KEY) { try { const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` }, body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: input }], max_tokens: 1024 }), signal: AbortSignal.timeout(15_000) }); if (r.ok) { const d = await r.json() as { choices?: Array<{ message?: { content?: string } }> }; return d.choices?.[0]?.message?.content || ''; } } catch { /* */ } }
  return JSON.stringify({ error: 'No AI available' });
}

export function getAllInventoryOptimizerTools(): ToolSchema[] {
  return [{ name: 'inventory_optimize', description: 'Optimize inventory: reorder points, dead stock detection, stock recommendations for each product.', parameters: { type: 'object', properties: { products: { type: 'string', description: 'JSON array of products: [{ "name": string, "currentStock": number, "monthlySales": number, "cost": number }]' }, currency: { type: 'string', description: 'Currency (default: USD)' } }, required: ['products'] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(`Inventory: ${args.products}`); let parsed; try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { parsed = { raw: raw }; } log.info('executed', { trace_id: traceId }); return parsed; } }];
}
