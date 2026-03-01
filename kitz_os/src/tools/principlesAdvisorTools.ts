/**
 * Principles Advisor Tools — Ray Dalio's decision-making frameworks for SMBs.
 *
 * 2 tools:
 *   - principles_decide (medium) — Apply Dalio's Principles to a business decision
 *   - principles_analyzeEconomics (medium) — Analyze business finances using Dalio's Economic Machine model
 *
 * Uses Claude Sonnet, falls back to OpenAI gpt-4o.
 */

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('principlesAdvisorTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';


const PRINCIPLES_SYSTEM = `You are a business advisor using Ray Dalio's Principles framework.
Apply: (1) Radical Transparency — face reality honestly.
(2) Pain + Reflection = Progress — every setback is learning.
(3) Believability-weighted decision-making — weight opinions by track record.
(4) 5-Step Process: Set clear goals → Identify problems → Diagnose root causes → Design solutions → Execute.
(5) Idea Meritocracy — best ideas win regardless of source.
Context: small businesses in Latin America. Be direct, honest, data-driven. Default language: Spanish.
Never sugarcoat — radical transparency means telling hard truths with empathy.`;

const ECONOMIC_SYSTEM = `You are an economic analyst using Ray Dalio's "How the Economic Machine Works" framework.
Analyze business finances through: productivity growth, short-term debt cycles, cash flow patterns.
For SMBs: focus on runway, burn rate, unit economics, and cash conversion cycle.
Context: Latin American markets (USD, local currencies, inflation considerations).
Be practical — these are small businesses, not hedge funds. Default language: Spanish.`;



export function getAllPrinciplesAdvisorTools(): ToolSchema[] {
  return [
    {
      name: 'principles_decide',
      description: 'Apply Ray Dalio\'s Principles framework to a business decision. Returns diagnosis, principles applied, options with believability scores, recommendation, next steps, and a reflection prompt.',
      parameters: {
        type: 'object',
        properties: {
          situation: { type: 'string', description: 'The business situation or decision to analyze' },
          context: { type: 'string', description: 'Additional context (industry, stage, constraints)' },
          business_stage: { type: 'string', enum: ['startup', 'growth', 'maturity', 'decline'], description: 'Business lifecycle stage' },
          language: { type: 'string', description: 'Response language (default: es)' },
        },
        required: ['situation'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const situation = String(args.situation || '').trim();
        if (!situation) return { error: 'Situation description is required.' };
        const input = `Apply Dalio's Principles to this business situation:\n"${situation}"\nContext: ${args.context || 'general SMB'}\nBusiness stage: ${args.business_stage || 'unknown'}\nLanguage: ${args.language || 'es'}\n\nRespond with JSON: { "situation": string, "diagnosis": string, "principles_applied": ["string"], "options": [{ "option": string, "pros": ["string"], "cons": ["string"], "believability_score": number (0-10) }], "recommendation": string, "next_steps": ["string"], "reflection_prompt": string }`;
        const raw = await callLLM(PRINCIPLES_SYSTEM, input, { temperature: 0.5 });
        let parsed;
        try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : null; } catch { parsed = null; }
        if (!parsed) parsed = { situation, diagnosis: 'Analysis unavailable', principles_applied: ['Radical Transparency'], options: [], recommendation: 'Gather more data before deciding', next_steps: ['Write down the problem clearly', 'Identify root cause'], reflection_prompt: 'What is the real problem here?' };
        log.info('executed', { trace_id: traceId });
        return parsed;
      },
    },
    {
      name: 'principles_analyzeEconomics',
      description: 'Analyze business finances using Ray Dalio\'s "How the Economic Machine Works" framework. Returns business stage, cash flow health, debt assessment, risks, and action plan.',
      parameters: {
        type: 'object',
        properties: {
          revenue: { type: 'number', description: 'Monthly revenue (USD)' },
          expenses: { type: 'number', description: 'Monthly expenses (USD)' },
          debt: { type: 'number', description: 'Total debt (USD)' },
          monthly_growth_rate: { type: 'number', description: 'Monthly growth rate (%)' },
          industry: { type: 'string', description: 'Business industry' },
          country: { type: 'string', description: 'Country (default: Panama)' },
          language: { type: 'string', description: 'Response language (default: es)' },
        },
        required: [],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const input = `Analyze business economics (Dalio framework):\nRevenue: ${args.revenue ?? 'unknown'}\nExpenses: ${args.expenses ?? 'unknown'}\nDebt: ${args.debt ?? 'none'}\nGrowth rate: ${args.monthly_growth_rate ?? 'unknown'}%/mo\nIndustry: ${args.industry || 'general'}\nCountry: ${args.country || 'Panama'}\nLanguage: ${args.language || 'es'}\n\nRespond with JSON: { "business_stage": string, "cash_flow_health": string, "debt_assessment": string, "revenue_trend": string, "key_risks": ["string"], "dalio_framework": string, "action_plan": ["string"] }`;
        const raw = await callLLM(ECONOMIC_SYSTEM, input, { temperature: 0.5 });
        let parsed;
        try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : null; } catch { parsed = null; }
        if (!parsed) parsed = { business_stage: 'startup', cash_flow_health: 'tight', debt_assessment: 'Analysis unavailable', revenue_trend: 'stable', key_risks: ['Insufficient data'], dalio_framework: 'Productivity Growth', action_plan: ['Track revenue and expenses daily', 'Calculate runway'] };
        log.info('executed', { trace_id: traceId });
        return parsed;
      },
    },
  ];
}
