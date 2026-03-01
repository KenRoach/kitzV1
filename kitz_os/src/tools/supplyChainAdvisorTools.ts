/**
 * Supply Chain Advisor Tools — Supplier evaluation, negotiation, logistics.
 * 1 tool: supply_chain_advise (low)
 */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('supplyChainAdvisorTools');
import type { ToolSchema } from './registry.js';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const OPENAI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
const SYSTEM = 'You are a supply chain advisor for LatAm SMBs. Evaluate suppliers, negotiate terms, optimize logistics. Spanish default. Respond with JSON: { "negotiationScripts": [string], "logisticsOptimization": [string], "costReduction": [string], "riskMitigation": [string], "actionSteps": [string] }';

async function callLLM(input: string): Promise<string> {
  if (CLAUDE_API_KEY) { try { const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1024, temperature: 0.2, system: SYSTEM, messages: [{ role: 'user', content: input }] }), signal: AbortSignal.timeout(15_000) }); if (r.ok) { const d = await r.json() as { content: Array<{ type: string; text?: string }> }; return d.content?.find(c => c.type === 'text')?.text || ''; } } catch { /* fall */ } }
  if (OPENAI_API_KEY) { try { const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` }, body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: input }], max_tokens: 1024 }), signal: AbortSignal.timeout(15_000) }); if (r.ok) { const d = await r.json() as { choices?: Array<{ message?: { content?: string } }> }; return d.choices?.[0]?.message?.content || ''; } } catch { /* */ } }
  return JSON.stringify({ error: 'No AI available' });
}

export function getAllSupplyChainAdvisorTools(): ToolSchema[] {
  return [{ name: 'supply_chain_advise', description: 'Get supply chain advice: supplier evaluation, negotiation scripts, logistics optimization, cost reduction tips.', parameters: { type: 'object', properties: { business: { type: 'string', description: 'Business name' }, suppliers: { type: 'string', description: 'JSON of suppliers: [{ "name": string, "products": string, "monthlySpend": number }]' }, challenges: { type: 'string', description: 'Current challenges' }, country: { type: 'string', description: 'Country' } }, required: ['business'] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(`Supply chain for: ${args.business}\nSuppliers: ${args.suppliers || '[]'}\nCountry: ${args.country || 'LatAm'}\nChallenges: ${args.challenges || 'general'}`); let parsed; try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { parsed = { raw: raw }; } log.info('executed', { trace_id: traceId }); return parsed; } }];
}
