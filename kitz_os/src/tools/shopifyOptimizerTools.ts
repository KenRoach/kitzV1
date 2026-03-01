/** Shopify store optimization, theme, apps, conversion */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('shopifyOptimizerTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';
const SYS = 'Shopify optimization expert for LatAm SMBs. Store setup, conversion, SEO. Spanish default. Respond with JSON.';

export function getAllShopifyOptimizerTools(): ToolSchema[] {
  return [{ name: 'shopify_optimize', description: 'Shopify store optimization, theme, apps, conversion', parameters: { type: "object", properties: { store_name: { type: "string", description: "Store name" }, industry: { type: "string", description: "Industry" }, challenges: { type: "string", description: "Current challenges" } }, required: ["store_name"] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYS, JSON.stringify(args)); let p; try { const m = raw.match(/\{[\s\S]*\}/); p = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { p = { raw }; } log.info('executed', { trace_id: traceId }); return p; } }];
}
