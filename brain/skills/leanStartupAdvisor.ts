/**
 * Lean Startup Advisor — Eric Ries + Y Combinator frameworks.
 *
 * Ries frameworks (PKB-249):
 *  - Build-Measure-Learn loop
 *  - MVP (Minimum Viable Product)
 *  - Validated Learning
 *  - Pivot vs Persevere decision
 *  - Innovation Accounting
 *
 * YC frameworks (YC_STARTUP_INTELLIGENCE.md):
 *  - Sean Ellis PMF Test (40%+ "very disappointed")
 *  - Michael Seibel axioms (clarity > accuracy, simple language, speed)
 *  - Do Things That Don't Scale
 *  - Default Alive vs Default Dead (Paul Graham)
 *  - Unit economics (LTV:CAC ratios, cohort analysis)
 *  - Growth rate targets (5-7% weekly during batch)
 *  - Jobs to Be Done (JTBD) customer research
 *
 * Source: KB_FOUNDER_MINDSET.md, YC_STARTUP_INTELLIGENCE.md
 */

import type { LLMClient } from './callTranscription.js';

export interface PMFAssessment {
  pmf_score: number;
  pmf_status: 'pre-pmf' | 'approaching' | 'achieved' | 'scaling';
  sean_ellis_estimate: number;
  signals: string[];
  gaps: string[];
  build_measure_learn: {
    current_hypothesis: string;
    mvp_suggestion: string;
    metrics_to_track: string[];
    learn_criteria: string;
  };
  pivot_or_persevere: 'persevere' | 'pivot' | 'need-more-data';
  pivot_options?: string[];
  default_alive: boolean;
  runway_months?: number;
  jtbd_insights: string[];
  yc_advice: string[];
  next_experiment: string;
}

export interface LeanStartupOptions {
  product: string;
  problem_solved: string;
  current_users?: number;
  monthly_revenue?: number;
  monthly_burn?: number;
  growth_rate?: number;
  customer_feedback?: string;
  industry?: string;
  language?: string;
}

const SYSTEM =
  'You are a startup advisor combining Eric Ries\'s Lean Startup with Y Combinator methodology. ' +
  'RIES: (1) Build-Measure-Learn — fastest loop wins. (2) MVP — smallest thing that tests your hypothesis. ' +
  '(3) Validated Learning — measure progress with actionable metrics, not vanity. (4) Pivot vs Persevere — when to change direction. ' +
  'YC: (1) Sean Ellis PMF Test — survey users "How disappointed if product gone?" 40%+ "very" = PMF. ' +
  '(2) Do Things That Don\'t Scale — manual service first, automate later. ' +
  '(3) Default Alive vs Dead — revenue growth > expense growth? (4) Talk to users every week. ' +
  '(5) Growth rate: 5-7% weekly is good. (6) LTV:CAC > 3x target. ' +
  '(7) JTBD: What job is the customer hiring your product to do? ' +
  '(8) Michael Seibel: clarity > accuracy, explain to a 5-year-old, speed of iteration beats perfection. ' +
  'Context: LatAm SMBs building real businesses. Be brutally honest about PMF. Default language: Spanish.';

export async function assessStartup(options: LeanStartupOptions, llmClient?: LLMClient): Promise<PMFAssessment> {
  if (llmClient) {
    const prompt = `Assess this startup/product:\nProduct: ${options.product}\nProblem: ${options.problem_solved}\n` +
      `Users: ${options.current_users ?? 'unknown'}\nMRR: $${options.monthly_revenue ?? 'unknown'}\n` +
      `Burn: $${options.monthly_burn ?? 'unknown'}\nGrowth: ${options.growth_rate ?? 'unknown'}%/mo\n` +
      `Feedback: ${options.customer_feedback ?? 'none'}\nIndustry: ${options.industry ?? 'general'}\n` +
      `Language: ${options.language ?? 'es'}\n\n` +
      'Respond with JSON: { "pmf_score": number (0-100), "pmf_status": "pre-pmf"|"approaching"|"achieved"|"scaling", ' +
      '"sean_ellis_estimate": number (0-100), "signals": ["string"], "gaps": ["string"], ' +
      '"build_measure_learn": { "current_hypothesis": string, "mvp_suggestion": string, "metrics_to_track": ["string"], "learn_criteria": string }, ' +
      '"pivot_or_persevere": "persevere"|"pivot"|"need-more-data", "pivot_options": ["string"], ' +
      '"default_alive": boolean, "runway_months": number, "jtbd_insights": ["string"], ' +
      '"yc_advice": ["string"], "next_experiment": string }';
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'sonnet' });
    try { return JSON.parse(response.text) as PMFAssessment; } catch { /* fall through */ }
  }
  return {
    pmf_score: 0, pmf_status: 'pre-pmf', sean_ellis_estimate: 0,
    signals: ['[Assessment unavailable — no LLM]'], gaps: ['Need user data'],
    build_measure_learn: { current_hypothesis: options.problem_solved, mvp_suggestion: 'Build the simplest version', metrics_to_track: ['retention', 'NPS'], learn_criteria: 'Do users come back?' },
    pivot_or_persevere: 'need-more-data', default_alive: false,
    jtbd_insights: ['What job is the customer hiring you for?'],
    yc_advice: ['Talk to users', 'Do things that don\'t scale', 'Launch now'],
    next_experiment: 'Talk to 10 potential customers this week',
  };
}
