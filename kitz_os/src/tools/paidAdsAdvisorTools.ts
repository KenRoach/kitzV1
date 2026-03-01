/**
 * Paid Ads Advisor Tools — Google/Meta campaign strategy, budget allocation, ROAS.
 *
 * 1 tool:
 *   - ads_advise (low) — Get paid advertising strategy with campaigns, budget split, KPIs
 *
 * Uses Claude Haiku, falls back to OpenAI gpt-4o-mini.
 */

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('paidAdsAdvisorTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';


const SYSTEM_PROMPT = `You are a paid advertising strategist for small businesses in Latin America.
Google Ads, Meta (Facebook/Instagram) Ads, TikTok Ads. Optimize for ROAS with limited budgets.
WhatsApp as conversion channel. Mobile-first audiences. Default language: Spanish.

Respond with valid JSON:
{ "totalBudget": number, "campaigns": [{ "platform": string, "objective": string, "dailyBudget": number,
  "targeting": { "audiences": [string], "locations": [string] }, "creativeGuidelines": string,
  "expectedROAS": string }], "budgetSplit": object, "creativeIdeas": [string],
  "kpiTargets": object, "actionSteps": [string] }`;



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
      const raw = await callLLM(SYSTEM_PROMPT, input, { temperature: 0.3 });
      let parsed;
      try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Could not parse' }; } catch { parsed = { raw_advice: raw }; }
      log.info('executed', { trace_id: traceId });
      return parsed;
    },
  }];
}
