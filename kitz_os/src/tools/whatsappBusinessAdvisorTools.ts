/** WhatsApp Business catalog, automation, broadcasts, API */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('whatsappBusinessAdvisorTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';
const SYS = 'WhatsApp Business expert for LatAm SMBs. Catalog, automation, broadcasts. Spanish default. Respond with JSON.';

export function getAllWhatsappBusinessAdvisorTools(): ToolSchema[] {
  return [{ name: 'whatsapp_business_advise', description: 'WhatsApp Business catalog, automation, broadcasts, API', parameters: { type: "object", properties: { business_type: { type: "string", description: "Business type" }, country: { type: "string", description: "Country" }, monthly_messages: { type: "number", description: "Monthly messages" } }, required: ["business_type"] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYS, JSON.stringify(args)); let p; try { const m = raw.match(/\{[\s\S]*\}/); p = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { p = { raw }; } log.info('executed', { trace_id: traceId }); return p; } }];
}
