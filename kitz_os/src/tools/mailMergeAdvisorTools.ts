/** Personalized bulk communications, templates, channels */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('mailMergeAdvisorTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';
const SYS = 'Mail merge and personalized communications expert for LatAm SMBs. Spanish default. Respond with JSON.';

export function getAllMailMergeAdvisorTools(): ToolSchema[] {
  return [{ name: 'mail_merge_advise', description: 'Personalized bulk communications, templates, channels', parameters: { type: "object", properties: { use_case: { type: "string", description: "Use case" }, recipient_count: { type: "number", description: "Recipient count" }, channels: { type: "string", description: "Channels" } }, required: ["use_case"] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYS, JSON.stringify(args)); let p; try { const m = raw.match(/\{[\s\S]*\}/); p = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { p = { raw }; } log.info('executed', { trace_id: traceId }); return p; } }];
}
