/**
 * LATAM Compliance Navigator Tools — Cross-border compliance, data privacy, trade.
 * 1 tool: latam_compliance_advise (low)
 */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('latamComplianceNavigatorTools');
import type { ToolSchema } from './registry.js';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const OPENAI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
const SYSTEM = 'You are a LatAm compliance navigator. Expert in data privacy (LGPD, Ley 1581, LFPDPPP, Ley 81), e-commerce regulations, WhatsApp Business rules, cross-border trade. Spanish default. Respond with JSON: { "countries": [object], "crossBorderRules": [string], "dataPrivacy": object, "ecommerceCompliance": [string], "whatsappBusinessRules": [string], "actionSteps": [string] }';

async function callLLM(input: string): Promise<string> {
  if (CLAUDE_API_KEY) { try { const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1024, temperature: 0.2, system: SYSTEM, messages: [{ role: 'user', content: input }] }), signal: AbortSignal.timeout(15_000) }); if (r.ok) { const d = await r.json() as { content: Array<{ type: string; text?: string }> }; return d.content?.find(c => c.type === 'text')?.text || ''; } } catch { /* fall */ } }
  if (OPENAI_API_KEY) { try { const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` }, body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: input }], max_tokens: 1024 }), signal: AbortSignal.timeout(15_000) }); if (r.ok) { const d = await r.json() as { choices?: Array<{ message?: { content?: string } }> }; return d.choices?.[0]?.message?.content || ''; } } catch { /* */ } }
  return JSON.stringify({ error: 'No AI available' });
}

export function getAllLatamComplianceNavigatorTools(): ToolSchema[] {
  return [{ name: 'latam_compliance_advise', description: 'LatAm compliance: data privacy (LGPD/LFPDPPP/Ley 1581), e-commerce rules, WhatsApp Business policies, cross-border trade regulations for multiple countries.', parameters: { type: 'object', properties: { business: { type: 'string', description: 'Business name' }, countries: { type: 'string', description: 'Comma-separated countries' }, sells_online: { type: 'boolean', description: 'Sells online?' }, question: { type: 'string', description: 'Specific compliance question' } }, required: ['business', 'countries'] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(`Compliance for: ${args.business} in ${args.countries}\nOnline: ${args.sells_online ?? true}${args.question ? `\nQ: ${args.question}` : ''}`); let parsed; try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { parsed = { raw: raw }; } log.info('executed', { trace_id: traceId }); return parsed; } }];
}
