/**
 * Customer Retention Advisor Tools — Churn signals, win-back, loyalty programs.
 * 1 tool: retention_advise (low)
 */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('customerRetentionAdvisorTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';

const SYSTEM = 'You are a retention strategist for LatAm SMBs. Identify churn signals, build win-back sequences, design loyalty programs. WhatsApp-first. Spanish default. Respond with JSON: { "churnSignals": [{ "signal": string, "severity": string, "action": string }], "retentionTactics": [string], "winBackSequence": [object], "loyaltyProgram": object, "actionSteps": [string] }';



export function getAllCustomerRetentionAdvisorTools(): ToolSchema[] {
  return [{ name: 'retention_advise', description: 'Get customer retention strategy: churn signals, win-back WhatsApp sequences, loyalty program design, retention metrics.', parameters: { type: 'object', properties: { business: { type: 'string', description: 'Business name' }, average_order_value: { type: 'number', description: 'Average order value' }, purchase_frequency: { type: 'string', description: 'How often customers buy (weekly/monthly/quarterly)' }, churn_rate: { type: 'number', description: 'Current churn rate %' }, currency: { type: 'string', description: 'Currency' } }, required: ['business', 'average_order_value'] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYSTEM, `Retention for: ${args.business}\nAOV: ${args.currency || 'USD'} ${args.average_order_value}\nFrequency: ${args.purchase_frequency || 'monthly'}\nChurn: ${args.churn_rate || 'unknown'}%`); let parsed; try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { parsed = { raw: raw }; } log.info('executed', { trace_id: traceId }); return parsed; } }];
}
