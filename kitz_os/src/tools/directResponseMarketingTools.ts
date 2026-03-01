/**
 * Direct Response Marketing Tools — Dan Kennedy's frameworks for SMBs.
 *
 * 2 tools:
 *   - dr_createCampaign (medium) — Create a direct response campaign using Results Triangle + 10 Rules
 *   - dr_writeSalesLetter (medium) — Write a sales letter using Kennedy's Ultimate Sales Letter methodology
 *
 * Uses Claude Sonnet, falls back to OpenAI gpt-4o.
 */

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('directResponseMarketingTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';


const DR_SYSTEM = `You are a direct response marketing strategist trained on Dan Kennedy's methodology.
Apply the Results Triangle (Market → Message → Media → Math) and the 10 Rules of Direct Marketing.
RULES: (1) Always have an offer. (2) Reason to respond NOW (urgency/scarcity).
(3) Clear instructions (tell them exactly what to do). (4) Track everything.
(5) No-cost brand building only. (6) Systematic follow-up. (7) Strong copy that sells.
(8) Proven formats. (9) Results rule. (10) Be disciplined.
Context: small businesses in Latin America, WhatsApp-first. Default language: Spanish.
No corporate fluff — direct, results-focused, No B.S.`;

const SALES_LETTER_SYSTEM = `You are a sales letter copywriter trained on Dan Kennedy's Ultimate Sales Letter methodology.
Structure: Headline → Opening Hook → Problem → Solution → Proof → Offer → Urgency → Guarantee → CTA → P.S.
Write like Kennedy: conversational, benefit-driven, urgency-loaded, proof-heavy.
Context: Latin American SMBs. Default language: Spanish.`;



export function getAllDirectResponseMarketingTools(): ToolSchema[] {
  return [
    {
      name: 'dr_createCampaign',
      description: 'Create a direct response marketing campaign using Dan Kennedy\'s Results Triangle (Market → Message → Media → Math) and 10 Rules. Returns headline, offer, urgency trigger, CTA, follow-up sequence, and tracking metrics.',
      parameters: {
        type: 'object',
        properties: {
          product: { type: 'string', description: 'Product or service being promoted' },
          target_market: { type: 'string', description: 'Target audience description' },
          price: { type: 'number', description: 'Price point (optional)' },
          channel: { type: 'string', enum: ['whatsapp', 'email', 'instagram', 'landing-page'], description: 'Primary marketing channel' },
          goal: { type: 'string', enum: ['lead-gen', 'sale', 'appointment', 'referral'], description: 'Campaign goal' },
          language: { type: 'string', description: 'Response language (default: es)' },
        },
        required: ['product', 'target_market', 'channel', 'goal'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const product = String(args.product || '').trim();
        if (!product) return { error: 'Product is required.' };
        const input = `Create a direct response campaign:\nProduct: ${product}\nMarket: ${args.target_market || 'general SMB'}\nPrice: ${args.price ?? 'TBD'}\nChannel: ${args.channel || 'whatsapp'}\nGoal: ${args.goal || 'sale'}\nLanguage: ${args.language || 'es'}\n\nRespond with JSON: { "headline": string, "offer": string, "urgencyTrigger": string, "callToAction": string, "followUpSequence": [{ "day": number, "channel": string, "message": string }], "trackingMetrics": ["string"], "kennedyRulesApplied": ["string"] }`;
        const raw = await callLLM(DR_SYSTEM, input, { temperature: 0.7 });
        let parsed;
        try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : null; } catch { parsed = null; }
        if (!parsed) parsed = { headline: `Campaign for ${product}`, offer: product, urgencyTrigger: 'Limited time', callToAction: '¡Escríbenos ahora!', followUpSequence: [], trackingMetrics: ['response_rate', 'conversion_rate'], kennedyRulesApplied: ['Rule 1: Always have an offer'] };
        log.info('executed', { trace_id: traceId });
        return parsed;
      },
    },
    {
      name: 'dr_writeSalesLetter',
      description: 'Write a sales letter using Dan Kennedy\'s Ultimate Sales Letter methodology. Structure: Headline → Hook → Problem → Solution → Proof → Offer → Urgency → Guarantee → CTA → P.S.',
      parameters: {
        type: 'object',
        properties: {
          product: { type: 'string', description: 'Product or service' },
          target_audience: { type: 'string', description: 'Who this letter is for' },
          price: { type: 'number', description: 'Price point' },
          main_benefit: { type: 'string', description: 'Primary benefit/transformation' },
          testimonials: { type: 'array', items: { type: 'string' }, description: 'Customer testimonials (optional)' },
          guarantee: { type: 'string', description: 'Guarantee offered (optional)' },
          language: { type: 'string', description: 'Response language (default: es)' },
        },
        required: ['product', 'target_audience', 'price', 'main_benefit'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const product = String(args.product || '').trim();
        if (!product) return { error: 'Product is required.' };
        const testimonials = Array.isArray(args.testimonials) ? (args.testimonials as string[]).join('; ') : 'none';
        const input = `Write a sales letter:\nProduct: ${product}\nAudience: ${args.target_audience}\nPrice: $${args.price}\nMain benefit: ${args.main_benefit}\nTestimonials: ${testimonials}\nGuarantee: ${args.guarantee || 'satisfaction guaranteed'}\nLanguage: ${args.language || 'es'}\n\nRespond with JSON: { "headline": string, "openingHook": string, "problemStatement": string, "solution": string, "proof": ["string"], "offer": string, "urgency": string, "guarantee": string, "callToAction": string, "ps": string }`;
        const raw = await callLLM(SALES_LETTER_SYSTEM, input, { maxTokens: 2048, temperature: 0.7 });
        let parsed;
        try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : null; } catch { parsed = null; }
        if (!parsed) parsed = { headline: `Sales letter for ${product}`, openingHook: '', problemStatement: '', solution: '', proof: [], offer: `$${args.price}`, urgency: 'Limited time', guarantee: args.guarantee || 'Satisfacción garantizada', callToAction: '¡Ordena ahora!', ps: '' };
        log.info('executed', { trace_id: traceId });
        return parsed;
      },
    },
  ];
}
