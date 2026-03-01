/**
 * Funnel Architect Tools — Russell Brunson's DotCom + Traffic + Expert Secrets.
 *
 * 1 tool:
 *   - funnel_design (medium) — Design a complete sales funnel with value ladder, traffic, sequences
 *
 * Uses Claude Sonnet, falls back to OpenAI gpt-4o.
 */

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('funnelArchitectTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';


const SYSTEM = `You are a funnel strategist trained on Russell Brunson's trilogy: DotCom Secrets, Traffic Secrets, Expert Secrets.
VALUE LADDER: Free → $7-47 tripwire → $97-297 core → $997-2997 high-ticket → continuity.
ATTRACTIVE CHARACTER: Backstory, parables, flaws, polarity. Every brand needs a leader.
SECRET FORMULA: Who → Where → Bait → Result.
HOOK-STORY-OFFER: Every content piece follows this.
SOAP OPERA SEQUENCE: Set stage → High drama → Epiphany → Hidden benefits → Urgency CTA.
EXPERT SECRETS: Mass Movement (Leader + Cause + New Opportunity). Break 3 false beliefs (vehicle, internal, external).
PERFECT WEBINAR: One Thing → 3 Secrets → Stack → Close.
TRAFFIC: Dream 100, earn your way in then buy, fill funnel daily.
Context: LatAm SMBs, WhatsApp-first. Default language: Spanish.

Respond with valid JSON:
{ "value_ladder": [{ "level": string, "offer": string, "price": string, "purpose": string }],
  "attractive_character": { "backstory": string, "parables": ["string"], "character_flaws": string, "polarity": string },
  "funnel_type": string, "funnel_steps": [{ "step": string, "page_type": string, "goal": string, "content": string }],
  "traffic_plan": { "dream_100": ["string"], "organic_strategy": string, "paid_strategy": string,
    "hook_story_offer": { "hook": string, "story": string, "offer": string } },
  "email_sequence": [{ "day": number, "subject": string, "type": string, "purpose": string }],
  "false_beliefs": { "vehicle": string, "internal": string, "external": string }, "action_steps": ["string"] }`;



export function getAllFunnelArchitectTools(): ToolSchema[] {
  return [{
    name: 'funnel_design',
    description: 'Design a complete sales funnel using Brunson\'s methodology. Returns value ladder, attractive character, funnel steps, traffic plan with Dream 100, soap opera email sequence, and false beliefs to break.',
    parameters: {
      type: 'object',
      properties: {
        product: { type: 'string', description: 'Product or service' },
        target_audience: { type: 'string', description: 'Target audience' },
        price_range: { type: 'string', description: 'Price range (e.g. "$50-200")' },
        funnel_type: { type: 'string', enum: ['lead-magnet', 'webinar', 'product-launch', 'high-ticket', 'ecommerce'], description: 'Type of funnel' },
        existing_audience: { type: 'number', description: 'Current audience/list size' },
        industry: { type: 'string', description: 'Industry/niche' },
        language: { type: 'string', description: 'Response language (default: es)' },
      },
      required: ['product', 'target_audience'],
    },
    riskLevel: 'medium',
    execute: async (args, traceId) => {
      const product = String(args.product || '').trim();
      if (!product) return { error: 'Product is required.' };
      const input = `Design a sales funnel:\nProduct: ${product}\nAudience: ${args.target_audience}\nPrice: ${args.price_range || 'TBD'}\nFunnel type: ${args.funnel_type || 'lead-magnet'}\nAudience size: ${args.existing_audience ?? 0}\nIndustry: ${args.industry || 'general'}\nLanguage: ${args.language || 'es'}`;
      const raw = await callLLM(SYSTEM, input, { temperature: 0.7 });
      let parsed;
      try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : null; } catch { parsed = null; }
      if (!parsed) parsed = { value_ladder: [], attractive_character: {}, funnel_type: args.funnel_type || 'lead-magnet', funnel_steps: [], traffic_plan: { dream_100: [] }, email_sequence: [], false_beliefs: {}, action_steps: [] };
      log.info('executed', { trace_id: traceId });
      return parsed;
    },
  }];
}
