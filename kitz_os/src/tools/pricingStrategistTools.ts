/**
 * Pricing Strategist Tools — Value-based pricing, tiers, competitive analysis.
 *
 * 1 tool:
 *   - pricing_advise (low) — Get pricing strategy with tiers, anchoring, and competitive analysis
 *
 * Uses Claude Haiku, falls back to OpenAI gpt-4o-mini.
 */

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('pricingStrategistTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';


const SYSTEM_PROMPT = `You are a pricing strategist for small businesses in Latin America.
Use value-based pricing frameworks (not cost-plus). Consider willingness-to-pay, perceived value, anchoring.
Recommend 2-3 tiers when appropriate. Be direct — tell them if they're undercharging.
Default language: Spanish.

Respond with valid JSON:
{ "recommendedPrice": number, "priceRange": { "low": number, "mid": number, "high": number },
  "strategy": string, "rationale": string,
  "tiers": [{ "name": string, "price": number, "features": [string], "margin": number }],
  "valueStack": [string], "anchoring": { "highAnchor": number, "revealPrice": number, "savings": string },
  "psychologicalPricing": [string], "actionSteps": [string] }`;



export function getAllPricingStrategistTools(): ToolSchema[] {
  return [{
    name: 'pricing_advise',
    description: 'Get pricing strategy: recommended price, 2-3 tiers, value stack, price anchoring, psychological pricing tips. Value-based framework for LatAm SMBs.',
    parameters: {
      type: 'object',
      properties: {
        product_or_service: { type: 'string', description: 'What you sell (e.g., "clases de yoga", "servicio de diseño")' },
        cost_per_unit: { type: 'number', description: 'Your cost per unit/service' },
        current_price: { type: 'number', description: 'Current price (if any)' },
        value_proposition: { type: 'string', description: 'Main value you deliver to customers' },
        target_margin: { type: 'number', description: 'Target profit margin % (default: 50)' },
        currency: { type: 'string', description: 'Currency (default: USD)' },
        market: { type: 'string', description: 'Market/country (default: Latin America)' },
      },
      required: ['product_or_service', 'cost_per_unit', 'value_proposition'],
    },
    riskLevel: 'low',
    execute: async (args, traceId) => {
      const input = `Pricing strategy for: ${args.product_or_service}\nCost: ${args.currency || 'USD'} ${args.cost_per_unit}\n` +
        (args.current_price ? `Current price: ${args.currency || 'USD'} ${args.current_price}\n` : '') +
        `Value: ${args.value_proposition}\nTarget margin: ${args.target_margin || 50}%\nMarket: ${args.market || 'Latin America'}`;
      const raw = await callLLM(SYSTEM_PROMPT, input, { temperature: 0.3 });
      let parsed;
      try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Could not parse response' }; } catch { parsed = { raw_advice: raw }; }
      log.info('executed', { trace_id: traceId });
      return parsed;
    },
  }];
}
