/** Press releases, media outreach, crisis communications */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('prWriterTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';
const SYS = 'PR and communications specialist for LatAm SMBs. Press releases, media, crisis comms. Spanish default. Respond with JSON.';

export function getAllPrWriterTools(): ToolSchema[] {
  return [{ name: 'pr_write', description: 'Press releases, media outreach, crisis communications', parameters: { type: "object", properties: { company: { type: "string", description: "Company name" }, news_type: { type: "string", description: "News type" }, target_media: { type: "string", description: "Target media" } }, required: ["company", "news_type"] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYS, JSON.stringify(args)); let p; try { const m = raw.match(/\{[\s\S]*\}/); p = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { p = { raw }; } log.info('executed', { trace_id: traceId }); return p; } }];
}
