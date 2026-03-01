/** Subscription pricing tiers, billing systems, churn reduction */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('subscriptionBillingAdvisorTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';
const SYS = 'Subscription billing advisor for LatAm SMBs. Tiers, churn reduction, billing tools. Spanish default. Respond with JSON.';
export function getAllSubscriptionBillingAdvisorTools(): ToolSchema[] {
  return [{ name: 'subscription_advise', description: 'Subscription pricing tiers, billing systems, churn reduction', parameters: { type: "object", properties: { business: { type: "string", description: "Business name" }, product: { type: "string", description: "Product/service" }, current_price: { type: "number", description: "Current price" } }, required: ["business", "product"] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYS, JSON.stringify(args)); let p; try { const m = raw.match(/\{[\s\S]*\}/); p = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { p = { raw }; } log.info('executed', { trace_id: traceId }); return p; } }];
}
