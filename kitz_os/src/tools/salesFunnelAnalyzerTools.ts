/**
 * Sales Funnel Analyzer Tools — Conversion bottleneck diagnosis, revenue leakage.
 * 1 tool: funnel_analyze (low)
 */
import type { ToolSchema } from './registry.js';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const OPENAI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
const SYSTEM = 'You are a sales funnel analyst for LatAm SMBs. Diagnose conversion bottlenecks, calculate revenue leakage. Spanish default. Respond with JSON: { "stages": [{ "name": string, "visitors": number, "conversionRate": number, "bottleneck": boolean, "fix": string }], "overallConversion": number, "biggestBottleneck": string, "optimizations": [string], "actionSteps": [string] }';

async function callLLM(input: string): Promise<string> {
  if (CLAUDE_API_KEY) { try { const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1024, temperature: 0.2, system: SYSTEM, messages: [{ role: 'user', content: input }] }), signal: AbortSignal.timeout(15_000) }); if (r.ok) { const d = await r.json() as { content: Array<{ type: string; text?: string }> }; return d.content?.find(c => c.type === 'text')?.text || ''; } } catch { /* fall */ } }
  if (OPENAI_API_KEY) { try { const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` }, body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: input }], max_tokens: 1024 }), signal: AbortSignal.timeout(15_000) }); if (r.ok) { const d = await r.json() as { choices?: Array<{ message?: { content?: string } }> }; return d.choices?.[0]?.message?.content || ''; } } catch { /* */ } }
  return JSON.stringify({ error: 'No AI available' });
}

export function getAllSalesFunnelAnalyzerTools(): ToolSchema[] {
  return [{ name: 'funnel_analyze', description: 'Analyze sales funnel: identify bottlenecks, calculate drop-off rates, estimate revenue leakage, recommend optimizations and A/B tests.', parameters: { type: 'object', properties: { business: { type: 'string', description: 'Business name' }, stages: { type: 'string', description: 'JSON array: [{ "name": string, "visitors": number }]' }, revenue: { type: 'number', description: 'Monthly revenue' }, industry: { type: 'string', description: 'Industry' }, currency: { type: 'string', description: 'Currency' } }, required: ['business'] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(`Funnel for: ${args.business} (${args.industry || 'general'})\nStages: ${args.stages || '[]'}\nRevenue: ${args.currency || 'USD'} ${args.revenue || 0}`); let parsed; try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { parsed = { raw: raw }; } console.log(JSON.stringify({ ts: new Date().toISOString(), module: 'salesFunnelAnalyzerTools', trace_id: traceId })); return parsed; } }];
}
