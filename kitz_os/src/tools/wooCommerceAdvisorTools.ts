/** WooCommerce setup, plugins, performance, payments */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('wooCommerceAdvisorTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';
const SYS = 'WooCommerce expert for LatAm SMBs. Optimization, plugins, payments. Spanish default. Respond with JSON.';

export function getAllWooCommerceAdvisorTools(): ToolSchema[] {
  return [{ name: 'woocommerce_advise', description: 'WooCommerce setup, plugins, performance, payments', parameters: { type: "object", properties: { store_name: { type: "string", description: "Store name" }, country: { type: "string", description: "Country" }, product_count: { type: "number", description: "Product count" } }, required: ["store_name"] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYS, JSON.stringify(args)); let p; try { const m = raw.match(/\{[\s\S]*\}/); p = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { p = { raw }; } log.info('executed', { trace_id: traceId }); return p; } }];
}
