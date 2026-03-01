/** Product launch strategy, go-to-market, pre-launch buzz */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('productLaunchAdvisorTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';
const SYS = 'Product launch strategist for LatAm SMBs. Pre-launch, GTM, post-launch. Spanish default. Respond with JSON.';

export function getAllProductLaunchAdvisorTools(): ToolSchema[] {
  return [{ name: 'product_launch_advise', description: 'Product launch strategy, go-to-market, pre-launch buzz', parameters: { type: "object", properties: { product_name: { type: "string", description: "Product name" }, category: { type: "string", description: "Category" }, target_market: { type: "string", description: "Target market" } }, required: ["product_name"] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYS, JSON.stringify(args)); let p; try { const m = raw.match(/\{[\s\S]*\}/); p = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { p = { raw }; } log.info('executed', { trace_id: traceId }); return p; } }];
}
