/** KPI recommendations, dashboard design, data-driven decision making */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('analyticsAdvisorTools');
import type { ToolSchema } from './registry.js';
const CK = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const OK = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
const SYS = 'Analytics advisor for LatAm SMBs. KPIs, dashboards, simple tools. Spanish default. Respond with JSON.';
async function callLLM(input: string): Promise<string> {
  if (CK) { try { const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': CK, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1024, temperature: 0.2, system: SYS, messages: [{ role: 'user', content: input }] }), signal: AbortSignal.timeout(15_000) }); if (r.ok) { const d = await r.json() as { content: Array<{ type: string; text?: string }> }; return d.content?.find((c: any) => c.type === 'text')?.text || ''; } } catch { /* */ } }
  if (OK) { try { const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OK}` }, body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: SYS }, { role: 'user', content: input }], max_tokens: 1024 }), signal: AbortSignal.timeout(15_000) }); if (r.ok) { const d = await r.json() as { choices?: Array<{ message?: { content?: string } }> }; return d.choices?.[0]?.message?.content || ''; } } catch { /* */ } }
  return JSON.stringify({ error: 'No AI available' });
}
export function getAllAnalyticsAdvisorTools(): ToolSchema[] {
  return [{ name: 'analytics_advise', description: 'KPI recommendations, dashboard design, data-driven decision making', parameters: { type: "object", properties: { business: { type: "string", description: "Business name" }, industry: { type: "string", description: "Industry" }, goals: { type: "string", description: "Business goals" } }, required: ["business", "industry"] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(JSON.stringify(args)); let p; try { const m = raw.match(/\{[\s\S]*\}/); p = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { p = { raw }; } log.info('executed', { trace_id: traceId }); return p; } }];
}
