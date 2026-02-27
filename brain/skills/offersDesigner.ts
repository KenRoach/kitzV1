/**
 * Offers Designer — Alex Hormozi's $100M Offers + $100M Leads frameworks.
 *
 * $100M Offers (PKB-361):
 *  - Value Equation: (Dream Outcome × Perceived Likelihood) / (Time × Effort)
 *  - Grand Slam Offer structure
 *  - Bonuses, urgency, scarcity, guarantees
 *  - Price-to-value disconnect (charge more, deliver more)
 *
 * $100M Leads (PKB-362):
 *  - 4 core lead generation methods: warm outreach, cold outreach, content, paid ads
 *  - Lead magnet design
 *  - Dream 100 (engage top influencers/partners)
 *  - Core 4 advertising methods
 *
 * Source: KB_ECOMMERCE.md
 */

import type { LLMClient } from './callTranscription.js';

export interface OfferDesign {
  grand_slam_offer: {
    dream_outcome: string;
    perceived_likelihood: number;
    time_to_result: string;
    effort_required: string;
    value_score: number;
  };
  offer_stack: Array<{ item: string; value: string; type: 'core' | 'bonus' | 'urgency' | 'scarcity' }>;
  pricing: { suggested_price: number; value_to_price_ratio: string; anchor_price?: number };
  guarantee: { type: string; description: string; risk_reversal: string };
  naming: { offer_name: string; tagline: string };
  lead_magnet: { title: string; format: string; promise: string };
  lead_channels: Array<{ channel: string; strategy: string; cost: string; timeline: string }>;
  dream_100: string[];
  action_steps: string[];
}

export interface OfferOptions {
  product: string;
  target_audience: string;
  current_price?: number;
  main_result?: string;
  time_to_deliver?: string;
  competitors?: string;
  language?: string;
}

const SYSTEM =
  'You are an offers strategist trained on Alex Hormozi\'s $100M Offers and $100M Leads methodology. ' +
  'VALUE EQUATION: Value = (Dream Outcome × Perceived Likelihood of Achievement) / (Time Delay × Effort & Sacrifice). ' +
  'To increase value: increase dream outcome, increase perceived likelihood, decrease time, decrease effort. ' +
  'GRAND SLAM OFFER: So good people feel stupid saying no. Stack value until price is a fraction of perceived value. ' +
  'BONUSES: Add bonuses worth more than the core offer. URGENCY: Real deadlines. SCARCITY: Limited quantity. ' +
  'GUARANTEE: Remove all risk from the buyer (conditional, unconditional, or anti-guarantee). ' +
  'LEADS: (1) Warm outreach — DM people who know you. (2) Cold outreach — DM strangers at scale. ' +
  '(3) Content — post valuable content to attract leads. (4) Paid ads — buy attention. ' +
  'LEAD MAGNETS: Solve a narrow problem for free, then offer the complete solution. ' +
  'DREAM 100: List 100 people/platforms with your ideal audience. Engage, give value, collaborate. ' +
  'Context: LatAm SMBs, WhatsApp-first market. Default language: Spanish. ' +
  'Be specific with numbers, stack value aggressively, make offers irresistible.';

export async function designOffer(options: OfferOptions, llmClient?: LLMClient): Promise<OfferDesign> {
  if (llmClient) {
    const prompt = `Design a Grand Slam Offer (Hormozi methodology):\nProduct: ${options.product}\n` +
      `Audience: ${options.target_audience}\nCurrent price: $${options.current_price ?? 'not set'}\n` +
      `Main result: ${options.main_result ?? 'unknown'}\nDelivery time: ${options.time_to_deliver ?? 'unknown'}\n` +
      `Competitors: ${options.competitors ?? 'unknown'}\nLanguage: ${options.language ?? 'es'}\n\n` +
      'Respond with JSON: { "grand_slam_offer": { "dream_outcome": string, "perceived_likelihood": number (0-10), ' +
      '"time_to_result": string, "effort_required": string, "value_score": number (0-100) }, ' +
      '"offer_stack": [{ "item": string, "value": string, "type": "core"|"bonus"|"urgency"|"scarcity" }], ' +
      '"pricing": { "suggested_price": number, "value_to_price_ratio": string, "anchor_price": number }, ' +
      '"guarantee": { "type": string, "description": string, "risk_reversal": string }, ' +
      '"naming": { "offer_name": string, "tagline": string }, ' +
      '"lead_magnet": { "title": string, "format": string, "promise": string }, ' +
      '"lead_channels": [{ "channel": string, "strategy": string, "cost": string, "timeline": string }], ' +
      '"dream_100": ["string"], "action_steps": ["string"] }';
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'sonnet' });
    try { return JSON.parse(response.text) as OfferDesign; } catch { /* fall through */ }
  }
  return {
    grand_slam_offer: { dream_outcome: options.main_result ?? options.product, perceived_likelihood: 5, time_to_result: 'unknown', effort_required: 'unknown', value_score: 50 },
    offer_stack: [{ item: options.product, value: `$${options.current_price ?? 0}`, type: 'core' }],
    pricing: { suggested_price: options.current_price ?? 0, value_to_price_ratio: 'unknown' },
    guarantee: { type: 'satisfaction', description: 'Satisfaction guaranteed', risk_reversal: 'Full refund if not satisfied' },
    naming: { offer_name: options.product, tagline: '[Generate with LLM]' },
    lead_magnet: { title: '[Design with LLM]', format: 'PDF guide', promise: 'Quick win' },
    lead_channels: [{ channel: 'whatsapp', strategy: 'Warm outreach', cost: 'Free', timeline: 'This week' }],
    dream_100: ['Identify 100 people/platforms with your ideal audience'],
    action_steps: ['Define dream outcome', 'Stack bonuses', 'Add guarantee', 'Launch to warm list'],
  };
}
