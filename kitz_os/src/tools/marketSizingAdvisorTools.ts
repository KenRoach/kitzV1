/** Calculate TAM/SAM/SOM, market opportunity analysis */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('marketSizingAdvisorTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';
const SYS = 'Market sizing advisor for LatAm. TAM/SAM/SOM. Be realistic. Spanish default. Respond with JSON.';
export function getAllMarketSizingAdvisorTools(): ToolSchema[] {
  return [{ name: 'market_size', description: 'Calculate TAM/SAM/SOM, market opportunity analysis', parameters: { type: "object", properties: { business: { type: "string", description: "Business name" }, industry: { type: "string", description: "Industry" }, target_market: { type: "string", description: "Target market" }, country: { type: "string", description: "Country" } }, required: ["business", "industry", "country"] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYS, JSON.stringify(args)); let p; try { const m = raw.match(/\{[\s\S]*\}/); p = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { p = { raw }; } log.info('executed', { trace_id: traceId }); return p; } }];
}
