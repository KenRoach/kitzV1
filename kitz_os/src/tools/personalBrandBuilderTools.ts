/** Founder branding, thought leadership, content strategy */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('personalBrandBuilderTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';
const SYS = 'Personal brand strategist for LatAm founders. Positioning, content, thought leadership. Spanish default. Respond with JSON.';

export function getAllPersonalBrandBuilderTools(): ToolSchema[] {
  return [{ name: 'personal_brand_build', description: 'Founder branding, thought leadership, content strategy', parameters: { type: "object", properties: { name: { type: "string", description: "Person name" }, industry: { type: "string", description: "Industry" }, goals: { type: "string", description: "Goals" } }, required: ["name", "industry"] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYS, JSON.stringify(args)); let p; try { const m = raw.match(/\{[\s\S]*\}/); p = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { p = { raw }; } log.info('executed', { trace_id: traceId }); return p; } }];
}
