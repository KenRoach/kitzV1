/**
 * Lean Startup Tools — Eric Ries + Y Combinator frameworks.
 *
 * 1 tool:
 *   - startup_assess (medium) — PMF assessment, Build-Measure-Learn, YC growth metrics
 *
 * Uses Claude Sonnet, falls back to OpenAI gpt-4o.
 */

import type { ToolSchema } from './registry.js';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_VERSION = '2023-06-01';
const OPENAI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM = `You are a startup advisor combining Eric Ries's Lean Startup with Y Combinator methodology.
RIES: Build-Measure-Learn loop, MVP, Validated Learning, Pivot vs Persevere, Innovation Accounting.
YC: Sean Ellis PMF Test (40%+ "very disappointed" = PMF), Do Things That Don't Scale,
Default Alive vs Dead (revenue growth > expense growth?), Talk to users weekly,
Growth rate 5-7%/week = good, LTV:CAC > 3x, JTBD (what job is customer hiring you for?),
Seibel axioms: clarity > accuracy, explain to a 5-year-old, speed of iteration beats perfection.
Context: LatAm SMBs. Be brutally honest about PMF. Default language: Spanish.

Respond with valid JSON:
{ "pmf_score": number (0-100), "pmf_status": "pre-pmf"|"approaching"|"achieved"|"scaling",
  "sean_ellis_estimate": number (0-100), "signals": ["string"], "gaps": ["string"],
  "build_measure_learn": { "current_hypothesis": string, "mvp_suggestion": string, "metrics_to_track": ["string"], "learn_criteria": string },
  "pivot_or_persevere": "persevere"|"pivot"|"need-more-data", "pivot_options": ["string"],
  "default_alive": boolean, "runway_months": number,
  "jtbd_insights": ["string"], "yc_advice": ["string"], "next_experiment": string }`;

async function callLLM(input: string): Promise<string> {
  if (CLAUDE_API_KEY) {
    try {
      const res = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': CLAUDE_API_VERSION },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1024, temperature: 0.3, system: SYSTEM, messages: [{ role: 'user', content: input }] }),
        signal: AbortSignal.timeout(30_000),
      });
      if (res.ok) { const d = await res.json() as { content: Array<{ type: string; text?: string }> }; return d.content?.find(c => c.type === 'text')?.text || ''; }
    } catch { /* fall through */ }
  }
  if (OPENAI_API_KEY) {
    try {
      const res = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: input }], max_tokens: 1024, temperature: 0.3 }),
        signal: AbortSignal.timeout(30_000),
      });
      if (res.ok) { const d = await res.json() as { choices?: Array<{ message?: { content?: string } }> }; return d.choices?.[0]?.message?.content || ''; }
    } catch { /* return error */ }
  }
  return JSON.stringify({ error: 'No AI available' });
}

export function getAllLeanStartupTools(): ToolSchema[] {
  return [{
    name: 'startup_assess',
    description: 'Assess startup/product using Lean Startup + YC frameworks. Returns PMF score, Sean Ellis estimate, Build-Measure-Learn plan, pivot/persevere recommendation, default alive status, JTBD insights, and YC advice.',
    parameters: {
      type: 'object',
      properties: {
        product: { type: 'string', description: 'Product or service name' },
        problem_solved: { type: 'string', description: 'What problem does it solve' },
        current_users: { type: 'number', description: 'Number of current users' },
        monthly_revenue: { type: 'number', description: 'Monthly revenue (USD)' },
        monthly_burn: { type: 'number', description: 'Monthly expenses/burn (USD)' },
        growth_rate: { type: 'number', description: 'Monthly growth rate (%)' },
        customer_feedback: { type: 'string', description: 'Summary of customer feedback' },
        industry: { type: 'string', description: 'Industry/vertical' },
        language: { type: 'string', description: 'Response language (default: es)' },
      },
      required: ['product', 'problem_solved'],
    },
    riskLevel: 'medium',
    execute: async (args, traceId) => {
      const product = String(args.product || '').trim();
      if (!product) return { error: 'Product name is required.' };
      const input = `Assess this startup:\nProduct: ${product}\nProblem: ${args.problem_solved}\nUsers: ${args.current_users ?? 'unknown'}\nMRR: $${args.monthly_revenue ?? 'unknown'}\nBurn: $${args.monthly_burn ?? 'unknown'}\nGrowth: ${args.growth_rate ?? 'unknown'}%/mo\nFeedback: ${args.customer_feedback || 'none'}\nIndustry: ${args.industry || 'general'}\nLanguage: ${args.language || 'es'}`;
      const raw = await callLLM(input);
      let parsed;
      try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : null; } catch { parsed = null; }
      if (!parsed) parsed = { pmf_score: 0, pmf_status: 'pre-pmf', sean_ellis_estimate: 0, signals: [], gaps: ['Need more data'], build_measure_learn: { current_hypothesis: '', mvp_suggestion: '', metrics_to_track: [], learn_criteria: '' }, pivot_or_persevere: 'need-more-data', default_alive: false, jtbd_insights: [], yc_advice: ['Talk to users'], next_experiment: 'Interview 10 customers' };
      console.log(JSON.stringify({ ts: new Date().toISOString(), module: 'leanStartupTools', product, trace_id: traceId }));
      return parsed;
    },
  }];
}
