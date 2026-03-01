/**
 * Referral Program Builder Tools — Incentive structures, viral loops, ambassador programs.
 *
 * 1 tool:
 *   - referral_build (low) — Design a referral/ambassador program with tiers, rewards, WhatsApp flow
 *
 * Uses Claude Haiku, falls back to OpenAI gpt-4o-mini.
 */

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('referralProgramBuilderTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';


const SYSTEM_PROMPT = `You are a growth strategist specializing in referral programs for small businesses in Latin America.
WhatsApp-first referral programs with simple mechanics. Word of mouth is king in LatAm.
Keep tracking simple (WhatsApp codes, not complex software). Default language: Spanish.

Respond with valid JSON:
{ "programName": string, "type": string,
  "tiers": [{ "name": string, "referralsNeeded": number, "reward": string, "rewardValue": number }],
  "referrerReward": string, "refereeReward": string, "mechanics": string,
  "whatsappFlow": [string], "messagingTemplates": [{ "trigger": string, "message": string }],
  "costPerReferral": string, "actionSteps": [string] }`;



export function getAllReferralProgramBuilderTools(): ToolSchema[] {
  return [{
    name: 'referral_build',
    description: 'Design a referral/ambassador program: tiered rewards, WhatsApp flow, messaging templates, tracking method. Optimized for word-of-mouth growth in LatAm.',
    parameters: {
      type: 'object',
      properties: {
        business: { type: 'string', description: 'Business name' },
        product: { type: 'string', description: 'Product or service' },
        average_order_value: { type: 'number', description: 'Average order value' },
        current_customers: { type: 'number', description: 'Number of current customers' },
        budget: { type: 'number', description: 'Monthly budget for referral rewards' },
        currency: { type: 'string', description: 'Currency (default: USD)' },
      },
      required: ['business', 'product', 'average_order_value'],
    },
    riskLevel: 'low',
    execute: async (args, traceId) => {
      const input = `Referral program for: ${args.business}\nProduct: ${args.product}\nAOV: ${args.currency || 'USD'} ${args.average_order_value}` +
        (args.current_customers ? `\nCustomers: ${args.current_customers}` : '') +
        (args.budget ? `\nBudget: ${args.currency || 'USD'} ${args.budget}` : '');
      const raw = await callLLM(SYSTEM_PROMPT, input, { temperature: 0.3 });
      let parsed;
      try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Could not parse' }; } catch { parsed = { raw_plan: raw }; }
      log.info('executed', { trace_id: traceId });
      return parsed;
    },
  }];
}
