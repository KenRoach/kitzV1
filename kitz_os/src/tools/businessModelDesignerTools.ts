/** Design business model canvas, revenue model, unit economics */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('businessModelDesignerTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';
const SYS = 'Business model advisor using Lean Canvas for LatAm SMBs. Spanish default. Respond with JSON.';
export function getAllBusinessModelDesignerTools(): ToolSchema[] {
  return [{ name: 'business_model_design', description: 'Design business model canvas, revenue model, unit economics', parameters: { type: "object", properties: { business: { type: "string", description: "Business name" }, industry: { type: "string", description: "Industry" }, target_customer: { type: "string", description: "Target customer" } }, required: ["business", "industry", "target_customer"] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYS, JSON.stringify(args)); let p; try { const m = raw.match(/\{[\s\S]*\}/); p = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { p = { raw }; } log.info('executed', { trace_id: traceId }); return p; } }];
}
