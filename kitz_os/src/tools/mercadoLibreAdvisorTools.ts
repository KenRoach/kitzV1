/** Mercado Libre listings, pricing, ads, reputation */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('mercadoLibreAdvisorTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';
const SYS = 'Mercado Libre expert for LatAm sellers. Listings, pricing, ads, reputation. Spanish default. Respond with JSON.';

export function getAllMercadoLibreAdvisorTools(): ToolSchema[] {
  return [{ name: 'mercadolibre_advise', description: 'Mercado Libre listings, pricing, ads, reputation', parameters: { type: "object", properties: { product_category: { type: "string", description: "Product category" }, country: { type: "string", description: "Country" }, challenges: { type: "string", description: "Challenges" } }, required: ["product_category"] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYS, JSON.stringify(args)); let p; try { const m = raw.match(/\{[\s\S]*\}/); p = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { p = { raw }; } log.info('executed', { trace_id: traceId }); return p; } }];
}
