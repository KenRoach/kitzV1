/**
 * Sales Funnel Analyzer Tools — Conversion bottleneck diagnosis, revenue leakage.
 * 1 tool: funnel_analyze (low)
 */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('salesFunnelAnalyzerTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';

const SYSTEM = 'You are a sales funnel analyst for LatAm SMBs. Diagnose conversion bottlenecks, calculate revenue leakage. Spanish default. Respond with JSON: { "stages": [{ "name": string, "visitors": number, "conversionRate": number, "bottleneck": boolean, "fix": string }], "overallConversion": number, "biggestBottleneck": string, "optimizations": [string], "actionSteps": [string] }';



export function getAllSalesFunnelAnalyzerTools(): ToolSchema[] {
  return [{ name: 'funnel_analyze', description: 'Analyze sales funnel: identify bottlenecks, calculate drop-off rates, estimate revenue leakage, recommend optimizations and A/B tests.', parameters: { type: 'object', properties: { business: { type: 'string', description: 'Business name' }, stages: { type: 'string', description: 'JSON array: [{ "name": string, "visitors": number }]' }, revenue: { type: 'number', description: 'Monthly revenue' }, industry: { type: 'string', description: 'Industry' }, currency: { type: 'string', description: 'Currency' } }, required: ['business'] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYSTEM, `Funnel for: ${args.business} (${args.industry || 'general'})\nStages: ${args.stages || '[]'}\nRevenue: ${args.currency || 'USD'} ${args.revenue || 0}`); let parsed; try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { parsed = { raw: raw }; } log.info('executed', { trace_id: traceId }); return parsed; } }];
}
