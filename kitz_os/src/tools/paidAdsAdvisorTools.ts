/**
 * Paid Ads Advisor Tools — Google/Meta campaign strategy, budget allocation, ROAS.
 *
 * 1 tool:
 *   - ads_advise (low) — Get paid advertising strategy with campaigns, budget split, KPIs
 *
 * Uses Claude Haiku, falls back to OpenAI gpt-4o-mini.
 */

import type { ToolSchema } from './registry.js';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_VERSION = '2023-06-01';
const OPENAI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `You are a paid advertising strategist for small businesses in Latin America.
Google Ads, Meta (Facebook/Instagram) Ads, TikTok Ads. Optimize for ROAS with limited budgets.
WhatsApp as conversion channel. Mobile-first audiences. Default language: Spanish.

Respond with valid JSON:
{ "totalBudget": number, "campaigns": [{ "platform": string, "objective": string, "dailyBudget": number,
  "targeting": { "audiences": [string], "locations": [string] }, "creativeGuidelines": string,
  "expectedROAS": string }], "budgetSplit": object, "creativeIdeas": [string],
  "kpiTargets": object, "actionSteps": [string] }`;

async function callLLM(input: string): Promise<string> {
  if (CLAUDE_API_KEY) {
    try {
      const res = await fetch(CLAUDE_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': CLAUDE_API_VERSION }, body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1024, temperature: 0.3, system: SYSTEM_PROMPT, messages: [{ role: 'user', content: input }] }), signal: AbortSignal.timeout(15_000) });
      if (res.ok) { const d = await res.json() as { content: Array<{ type: string; text?: string }> }; return d.content?.find(c => c.type === 'text')?.text || ''; }
    } catch { /* fall through */ }
  }
  if (OPENAI_API_KEY) {
    try {
      const res = await fetch(OPENAI_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` }, body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: input }], max_tokens: 1024, temperature: 0.3 }), signal: AbortSignal.timeout(15_000) });
      if (res.ok) { const d = await res.json() as { choices?: Array<{ message?: { content?: string } }> }; return d.choices?.[0]?.message?.content || ''; }
    } catch { /* return error */ }
  }
  return JSON.stringify({ error: 'No AI available' });
}

export function getAllPaidAdsAdvisorTools(): ToolSchema[] {
  return [{
    name: 'ads_advise',
    description: 'Get paid advertising strategy: Google/Meta campaigns, budget allocation, creative ideas, ROAS targets, and optimization schedule for LatAm SMBs.',
    parameters: {
      type: 'object',
      properties: {
        business: { type: 'string', description: 'Business name' },
        product: { type: 'string', description: 'Product or service to advertise' },
        monthly_budget: { type: 'number', description: 'Monthly ad budget' },
        goal: { type: 'string', enum: ['sales', 'leads', 'traffic', 'awareness'], description: 'Campaign goal' },
        target_audience: { type: 'string', description: 'Target audience description' },
        country: { type: 'string', description: 'Target country' },
        currency: { type: 'string', description: 'Currency (default: USD)' },
      },
      required: ['business', 'product', 'monthly_budget', 'goal', 'target_audience', 'country'],
    },
    riskLevel: 'low',
    execute: async (args, traceId) => {
      const input = `Ads for: ${args.business}\nProduct: ${args.product}\nBudget: ${args.currency || 'USD'} ${args.monthly_budget}/mo\nGoal: ${args.goal}\nAudience: ${args.target_audience}\nCountry: ${args.country}`;
      const raw = await callLLM(input);
      let parsed;
      try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Could not parse' }; } catch { parsed = { raw_advice: raw }; }
      console.log(JSON.stringify({ ts: new Date().toISOString(), module: 'paidAdsAdvisorTools', trace_id: traceId }));
      return parsed;
    },
  }];
}
