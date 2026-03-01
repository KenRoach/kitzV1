/** International trade, customs, regulations, LatAm */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('crossBorderTradeAdvisorTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';
const SYS = 'Cross-border trade expert for LatAm. Import/export, customs, trade agreements. Spanish default. Respond with JSON.';

export function getAllCrossBorderTradeAdvisorTools(): ToolSchema[] {
  return [{ name: 'cross_border_trade_advise', description: 'International trade, customs, regulations, LatAm', parameters: { type: "object", properties: { origin_country: { type: "string", description: "Origin country" }, destination_country: { type: "string", description: "Destination country" }, product_type: { type: "string", description: "Product type" } }, required: ["origin_country", "destination_country"] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYS, JSON.stringify(args)); let p; try { const m = raw.match(/\{[\s\S]*\}/); p = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { p = { raw }; } log.info('executed', { trace_id: traceId }); return p; } }];
}
