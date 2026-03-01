/** Blog strategy, SEO writing, content structure, promotion */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('blogPostAdvisorTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';
const SYS = 'Blog content strategist for LatAm SMBs. SEO blog strategy, structure, promotion. Spanish default. Respond with JSON.';

export function getAllBlogPostAdvisorTools(): ToolSchema[] {
  return [{ name: 'blog_post_advise', description: 'Blog strategy, SEO writing, content structure, promotion', parameters: { type: "object", properties: { niche: { type: "string", description: "Niche/industry" }, target_audience: { type: "string", description: "Target audience" }, challenges: { type: "string", description: "Challenges" } }, required: ["niche"] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYS, JSON.stringify(args)); let p; try { const m = raw.match(/\{[\s\S]*\}/); p = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { p = { raw }; } log.info('executed', { trace_id: traceId }); return p; } }];
}
