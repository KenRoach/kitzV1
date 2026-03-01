/** Podcast launch, production, growth, monetization */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('podcastAdvisorTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';
const SYS = 'Podcast advisor for LatAm creators. Launch, production, growth, monetization. Spanish default. Respond with JSON.';

export function getAllPodcastAdvisorTools(): ToolSchema[] {
  return [{ name: 'podcast_advise', description: 'Podcast launch, production, growth, monetization', parameters: { type: "object", properties: { topic: { type: "string", description: "Podcast topic" }, target_audience: { type: "string", description: "Target audience" }, budget: { type: "string", description: "Budget" } }, required: ["topic"] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYS, JSON.stringify(args)); let p; try { const m = raw.match(/\{[\s\S]*\}/); p = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { p = { raw }; } log.info('executed', { trace_id: traceId }); return p; } }];
}
