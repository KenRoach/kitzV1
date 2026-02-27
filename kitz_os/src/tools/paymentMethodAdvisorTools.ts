/**
 * Payment Method Advisor Tools — Gateway selection by country, fees, local methods.
 * 1 tool: payment_method_advise (low)
 */
import type { ToolSchema } from './registry.js';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const OPENAI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
const SYSTEM = 'You are a payments advisor for LatAm SMBs. Recommend gateways, local methods (Yappy, PIX, OXXO, Nequi). Spanish default. Respond with JSON: { "recommended": { "name": string, "fees": string, "localMethods": [string] }, "alternatives": [object], "feeComparison": string, "actionSteps": [string] }';

async function callLLM(input: string): Promise<string> {
  if (CLAUDE_API_KEY) { try { const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1024, temperature: 0.2, system: SYSTEM, messages: [{ role: 'user', content: input }] }), signal: AbortSignal.timeout(15_000) }); if (r.ok) { const d = await r.json() as { content: Array<{ type: string; text?: string }> }; return d.content?.find(c => c.type === 'text')?.text || ''; } } catch { /* fall */ } }
  if (OPENAI_API_KEY) { try { const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` }, body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: input }], max_tokens: 1024 }), signal: AbortSignal.timeout(15_000) }); if (r.ok) { const d = await r.json() as { choices?: Array<{ message?: { content?: string } }> }; return d.choices?.[0]?.message?.content || ''; } } catch { /* */ } }
  return JSON.stringify({ error: 'No AI available' });
}

export function getAllPaymentMethodAdvisorTools(): ToolSchema[] {
  return [{ name: 'payment_method_advise', description: 'Get payment method recommendations by country: gateways, local methods (Yappy/PIX/OXXO/Nequi), fee comparison.', parameters: { type: 'object', properties: { business: { type: 'string', description: 'Business name' }, country: { type: 'string', description: 'Country (Panama, Mexico, Colombia, Brazil, etc.)' }, monthly_volume: { type: 'number', description: 'Monthly payment volume' }, currency: { type: 'string', description: 'Currency' } }, required: ['business', 'country'] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(`Payments for: ${args.business} in ${args.country}\nVolume: ${args.currency || 'USD'} ${args.monthly_volume || 0}/mo`); let parsed; try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { parsed = { raw: raw }; } console.log(JSON.stringify({ ts: new Date().toISOString(), module: 'paymentMethodAdvisorTools', trace_id: traceId })); return parsed; } }];
}
