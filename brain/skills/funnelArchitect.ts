/**
 * Funnel Architect — Russell Brunson's DotCom Secrets + Traffic Secrets + Expert Secrets.
 *
 * DotCom Secrets (PKB-390):
 *  - Value Ladder (free → low-ticket → mid → high → continuity)
 *  - Attractive Character (backstory, parables, flaws, polarity)
 *  - Soap Opera Sequences (email sequences that tell a story)
 *  - Secret Formula: Who → Where → Bait → Result
 *
 * Traffic Secrets (PKB-391):
 *  - Dream 100 framework
 *  - Work your way in vs Buy your way in
 *  - Hook → Story → Offer (every piece of content)
 *  - Fill your funnel daily
 *
 * Expert Secrets (PKB-392):
 *  - Mass Movement: Leader → Cause → New Opportunity
 *  - Break false beliefs (vehicle, internal, external)
 *  - Perfect Webinar (One Thing → 3 Secrets → Stack → Close)
 *  - Offer stacking and closing
 *
 * Source: KB_ECOMMERCE.md
 */

import type { LLMClient } from './callTranscription.js';

export interface FunnelDesign {
  value_ladder: Array<{ level: string; offer: string; price: string; purpose: string }>;
  attractive_character: { backstory: string; parables: string[]; character_flaws: string; polarity: string };
  funnel_type: string;
  funnel_steps: Array<{ step: string; page_type: string; goal: string; content: string }>;
  traffic_plan: {
    dream_100: string[];
    organic_strategy: string;
    paid_strategy: string;
    hook_story_offer: { hook: string; story: string; offer: string };
  };
  email_sequence: Array<{ day: number; subject: string; type: string; purpose: string }>;
  webinar_outline?: { one_thing: string; secret_1: string; secret_2: string; secret_3: string; stack: string; close: string };
  false_beliefs: { vehicle: string; internal: string; external: string };
  action_steps: string[];
}

export interface FunnelOptions {
  product: string;
  target_audience: string;
  price_range?: string;
  funnel_type?: 'lead-magnet' | 'webinar' | 'product-launch' | 'high-ticket' | 'ecommerce';
  existing_audience?: number;
  industry?: string;
  language?: string;
}

const SYSTEM =
  'You are a funnel strategist trained on Russell Brunson\'s trilogy: DotCom Secrets, Traffic Secrets, Expert Secrets. ' +
  'VALUE LADDER: Free → $7-47 (tripwire) → $97-297 (core) → $997-2997 (high-ticket) → continuity. ' +
  'ATTRACTIVE CHARACTER: Every brand needs a leader with a backstory, parables, flaws, and polarity. ' +
  'SECRET FORMULA: (1) Who is your dream customer? (2) Where do they congregate? (3) What bait will attract them? (4) What result do you want? ' +
  'HOOK-STORY-OFFER: Every content piece and ad follows this structure. ' +
  'SOAP OPERA SEQUENCE: Day 1: Set the stage. Day 2: High drama. Day 3: Epiphany. Day 4: Hidden benefits. Day 5: Urgency/CTA. ' +
  'EXPERT SECRETS: Create a mass movement. Break 3 false beliefs (vehicle, internal, external). Stack your offer. ' +
  'PERFECT WEBINAR: One Thing → 3 Secrets (each breaking a belief) → Stack → Close. ' +
  'TRAFFIC: Dream 100 list, earn your way in first, then buy. Fill your funnel daily. ' +
  'Context: LatAm SMBs, WhatsApp as primary channel. Default language: Spanish.';

export async function designFunnel(options: FunnelOptions, llmClient?: LLMClient): Promise<FunnelDesign> {
  if (llmClient) {
    const prompt = `Design a complete sales funnel (Brunson methodology):\nProduct: ${options.product}\n` +
      `Audience: ${options.target_audience}\nPrice range: ${options.price_range ?? 'TBD'}\n` +
      `Funnel type: ${options.funnel_type ?? 'lead-magnet'}\nExisting audience: ${options.existing_audience ?? 0}\n` +
      `Industry: ${options.industry ?? 'general'}\nLanguage: ${options.language ?? 'es'}\n\n` +
      'Respond with JSON: { "value_ladder": [{ "level": string, "offer": string, "price": string, "purpose": string }], ' +
      '"attractive_character": { "backstory": string, "parables": ["string"], "character_flaws": string, "polarity": string }, ' +
      '"funnel_type": string, "funnel_steps": [{ "step": string, "page_type": string, "goal": string, "content": string }], ' +
      '"traffic_plan": { "dream_100": ["string"], "organic_strategy": string, "paid_strategy": string, ' +
      '"hook_story_offer": { "hook": string, "story": string, "offer": string } }, ' +
      '"email_sequence": [{ "day": number, "subject": string, "type": string, "purpose": string }], ' +
      '"false_beliefs": { "vehicle": string, "internal": string, "external": string }, "action_steps": ["string"] }';
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'sonnet' });
    try { return JSON.parse(response.text) as FunnelDesign; } catch { /* fall through */ }
  }
  return {
    value_ladder: [
      { level: 'Free', offer: 'Lead magnet', price: '$0', purpose: 'Capture leads' },
      { level: 'Low', offer: 'Tripwire', price: '$7-47', purpose: 'Convert to buyer' },
      { level: 'Core', offer: options.product, price: options.price_range ?? 'TBD', purpose: 'Main revenue' },
    ],
    attractive_character: { backstory: '[Define your origin story]', parables: [], character_flaws: '[Be authentic]', polarity: '[Take a stand]' },
    funnel_type: options.funnel_type ?? 'lead-magnet',
    funnel_steps: [{ step: '1', page_type: 'opt-in', goal: 'Capture email/WhatsApp', content: 'Lead magnet offer' }],
    traffic_plan: { dream_100: ['List 100 influencers in your niche'], organic_strategy: 'Daily content', paid_strategy: 'Facebook/Instagram ads', hook_story_offer: { hook: '[Attention grabber]', story: '[Your journey]', offer: '[Your solution]' } },
    email_sequence: [{ day: 1, subject: 'Welcome', type: 'soap-opera', purpose: 'Set the stage' }],
    false_beliefs: { vehicle: '[What do they think won\'t work?]', internal: '[What do they think about themselves?]', external: '[What external excuse do they have?]' },
    action_steps: ['Build value ladder', 'Create lead magnet', 'Write soap opera sequence', 'Launch to Dream 100'],
  };
}
