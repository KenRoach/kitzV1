/**
 * Offers Designer Tools — Alex Hormozi's $100M Offers + $100M Leads.
 *
 * 1 tool:
 *   - offers_design (medium) — Design a Grand Slam Offer with value equation, stacking, leads plan
 *
 * Uses Claude Sonnet, falls back to OpenAI gpt-4o.
 */

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('offersDesignerTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';


const SYSTEM = `You are an offers strategist trained on Alex Hormozi's $100M Offers and $100M Leads.
VALUE EQUATION: Value = (Dream Outcome × Perceived Likelihood) / (Time Delay × Effort & Sacrifice).
GRAND SLAM OFFER: So good people feel stupid saying no. Stack value until price is a fraction of perceived value.
Bonuses worth more than core offer. Real urgency. Real scarcity. Risk-reversing guarantee.
LEADS: (1) Warm outreach — DM people who know you. (2) Cold outreach — DM strangers at scale.
(3) Content — post valuable content. (4) Paid ads — buy attention.
LEAD MAGNETS: Solve a narrow problem for free, offer complete solution.
DREAM 100: List 100 people/platforms with your ideal audience.
Context: LatAm SMBs, WhatsApp-first. Be specific with numbers. Default language: Spanish.

Respond with valid JSON:
{ "grand_slam_offer": { "dream_outcome": string, "perceived_likelihood": number (0-10),
  "time_to_result": string, "effort_required": string, "value_score": number (0-100) },
  "offer_stack": [{ "item": string, "value": string, "type": "core"|"bonus"|"urgency"|"scarcity" }],
  "pricing": { "suggested_price": number, "value_to_price_ratio": string, "anchor_price": number },
  "guarantee": { "type": string, "description": string, "risk_reversal": string },
  "naming": { "offer_name": string, "tagline": string },
  "lead_magnet": { "title": string, "format": string, "promise": string },
  "lead_channels": [{ "channel": string, "strategy": string, "cost": string, "timeline": string }],
  "dream_100": ["string"], "action_steps": ["string"] }`;



export function getAllOffersDesignerTools(): ToolSchema[] {
  return [{
    name: 'offers_design',
    description: 'Design a Grand Slam Offer using Hormozi\'s $100M framework. Returns value equation analysis, offer stack with bonuses, pricing with anchor, guarantee, naming, lead magnet, lead channels, and Dream 100 list.',
    parameters: {
      type: 'object',
      properties: {
        product: { type: 'string', description: 'Product or service' },
        target_audience: { type: 'string', description: 'Who is this for' },
        current_price: { type: 'number', description: 'Current price point (USD)' },
        main_result: { type: 'string', description: 'The primary result/transformation delivered' },
        time_to_deliver: { type: 'string', description: 'How long to deliver the result' },
        competitors: { type: 'string', description: 'Key competitors' },
        language: { type: 'string', description: 'Response language (default: es)' },
      },
      required: ['product', 'target_audience'],
    },
    riskLevel: 'medium',
    execute: async (args, traceId) => {
      const product = String(args.product || '').trim();
      if (!product) return { error: 'Product is required.' };
      const input = `Design a Grand Slam Offer:\nProduct: ${product}\nAudience: ${args.target_audience}\nPrice: $${args.current_price ?? 'not set'}\nResult: ${args.main_result || 'unknown'}\nDelivery: ${args.time_to_deliver || 'unknown'}\nCompetitors: ${args.competitors || 'unknown'}\nLanguage: ${args.language || 'es'}`;
      const raw = await callLLM(SYSTEM, input, { temperature: 0.7 });
      let parsed;
      try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : null; } catch { parsed = null; }
      if (!parsed) parsed = { grand_slam_offer: { dream_outcome: product, value_score: 50 }, offer_stack: [], pricing: { suggested_price: 0 }, guarantee: { type: 'satisfaction' }, naming: { offer_name: product }, lead_magnet: {}, lead_channels: [], dream_100: [], action_steps: [] };
      log.info('executed', { trace_id: traceId });
      return parsed;
    },
  }];
}
