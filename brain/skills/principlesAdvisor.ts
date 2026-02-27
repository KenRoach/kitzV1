/**
 * Principles advisor skill — Ray Dalio's decision-making frameworks applied to SMBs.
 *
 * Implements Dalio's core systems:
 *  - Radical Transparency in business decisions
 *  - Pain + Reflection = Progress cycle
 *  - Systematic decision-making (believability-weighted)
 *  - Economic Machine model (debt cycles, cash flow)
 *  - 5-Step Process: goals → problems → diagnoses → designs → doing
 *
 * Source: KB_FOUNDER_MINDSET.md (PKB-212 through PKB-217)
 */

import type { LLMClient } from './callTranscription.js';

export interface PrinciplesDecision {
  situation: string;
  diagnosis: string;
  principles_applied: string[];
  options: Array<{
    option: string;
    pros: string[];
    cons: string[];
    believability_score: number;
  }>;
  recommendation: string;
  next_steps: string[];
  reflection_prompt: string;
}

export interface EconomicAnalysis {
  business_stage: 'startup' | 'growth' | 'maturity' | 'decline';
  cash_flow_health: 'healthy' | 'tight' | 'critical';
  debt_assessment: string;
  revenue_trend: 'growing' | 'stable' | 'declining';
  key_risks: string[];
  dalio_framework: string;
  action_plan: string[];
}

export interface PrinciplesOptions {
  situation: string;
  context?: string;
  businessStage?: string;
  language?: string;
}

export interface EconomicOptions {
  revenue?: number;
  expenses?: number;
  debt?: number;
  monthlyGrowthRate?: number;
  industry?: string;
  country?: string;
  language?: string;
}

const PRINCIPLES_SYSTEM =
  'You are a business advisor using Ray Dalio\'s Principles framework. ' +
  'Apply: (1) Radical Transparency — face reality honestly. ' +
  '(2) Pain + Reflection = Progress — every setback is learning. ' +
  '(3) Believability-weighted decision-making — weight opinions by track record. ' +
  '(4) 5-Step Process: Set clear goals → Identify problems → Diagnose root causes → Design solutions → Execute. ' +
  '(5) Idea Meritocracy — best ideas win regardless of source. ' +
  'Context: small businesses in Latin America. Be direct, honest, data-driven. Default language: Spanish. ' +
  'Never sugarcoat — radical transparency means telling hard truths with empathy.';

const ECONOMIC_SYSTEM =
  'You are an economic analyst using Ray Dalio\'s "How the Economic Machine Works" framework. ' +
  'Analyze business finances through: productivity growth, short-term debt cycles, cash flow patterns. ' +
  'For SMBs: focus on runway, burn rate, unit economics, and cash conversion cycle. ' +
  'Context: Latin American markets (USD, local currencies, inflation considerations). ' +
  'Be practical — these are small businesses, not hedge funds. Default language: Spanish.';

export async function applyPrinciples(options: PrinciplesOptions, llmClient?: LLMClient): Promise<PrinciplesDecision> {
  if (llmClient) {
    const prompt = `Apply Dalio's Principles to this business situation:\n"${options.situation}"\n` +
      `Context: ${options.context ?? 'general SMB'}\nBusiness stage: ${options.businessStage ?? 'unknown'}\n` +
      `Language: ${options.language ?? 'es'}\n\n` +
      'Respond with JSON: { "situation": string, "diagnosis": string, "principles_applied": ["string"], ' +
      '"options": [{ "option": string, "pros": ["string"], "cons": ["string"], "believability_score": number (0-10) }], ' +
      '"recommendation": string, "next_steps": ["string"], "reflection_prompt": string }';
    const response = await llmClient.complete({ prompt, system: PRINCIPLES_SYSTEM, tier: 'sonnet' });
    try { return JSON.parse(response.text) as PrinciplesDecision; } catch { /* fall through */ }
  }
  return {
    situation: options.situation,
    diagnosis: '[Principles analysis unavailable — no LLM]',
    principles_applied: ['Radical Transparency', 'Pain + Reflection = Progress'],
    options: [],
    recommendation: 'Gather more data before deciding',
    next_steps: ['Write down the problem clearly', 'Identify root cause', 'Design 2-3 solutions'],
    reflection_prompt: 'What is the real problem here, and what can you learn from it?',
  };
}

export async function analyzeEconomics(options: EconomicOptions, llmClient?: LLMClient): Promise<EconomicAnalysis> {
  if (llmClient) {
    const prompt = `Analyze business economics (Dalio framework):\n` +
      `Revenue: ${options.revenue ?? 'unknown'}\nExpenses: ${options.expenses ?? 'unknown'}\n` +
      `Debt: ${options.debt ?? 'none'}\nGrowth rate: ${options.monthlyGrowthRate ?? 'unknown'}%/mo\n` +
      `Industry: ${options.industry ?? 'general'}\nCountry: ${options.country ?? 'Panama'}\n` +
      `Language: ${options.language ?? 'es'}\n\n` +
      'Respond with JSON: { "business_stage": string, "cash_flow_health": string, ' +
      '"debt_assessment": string, "revenue_trend": string, "key_risks": ["string"], ' +
      '"dalio_framework": string (which Dalio concept applies), "action_plan": ["string"] }';
    const response = await llmClient.complete({ prompt, system: ECONOMIC_SYSTEM, tier: 'sonnet' });
    try { return JSON.parse(response.text) as EconomicAnalysis; } catch { /* fall through */ }
  }
  return {
    business_stage: 'startup', cash_flow_health: 'tight',
    debt_assessment: '[Analysis unavailable]', revenue_trend: 'stable',
    key_risks: ['Insufficient data for analysis'],
    dalio_framework: 'Productivity Growth — focus on output per unit of input',
    action_plan: ['Track revenue and expenses daily', 'Calculate runway', 'Identify unit economics'],
  };
}
