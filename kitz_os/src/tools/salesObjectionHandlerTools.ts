/**
 * Sales Objection Handler Tools — Chris Voss tactical empathy scripts.
 *
 * 1 tool:
 *   - objection_handle (low) — Get objection handling scripts with labeling, mirroring, calibrated questions
 *
 * Uses Claude Haiku, falls back to OpenAI gpt-4o-mini.
 */

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('salesObjectionHandlerTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';


const SYSTEM_PROMPT = `You are a sales coach using Chris Voss tactical empathy for Latin American businesses.
Handle objections with labels ("Parece que..."), mirrors, calibrated questions ("¿Cómo...?").
Never aggressive. Cover price, timing, trust, need, competition objections. Default language: Spanish.

Respond with valid JSON:
{ "scripts": [{ "objection": string, "category": string, "tacticalResponse": string,
  "vossLabel": string, "mirrorQuestion": string, "calibratedQuestion": string, "reframe": string }],
  "generalPrinciples": [string], "closingStrategies": [string], "actionSteps": [string] }`;



export function getAllSalesObjectionHandlerTools(): ToolSchema[] {
  return [{
    name: 'objection_handle',
    description: 'Get sales objection handling scripts using Chris Voss tactical empathy: labeling, mirroring, calibrated questions, and reframes for price/timing/trust/need/competition objections.',
    parameters: {
      type: 'object',
      properties: {
        product: { type: 'string', description: 'Product or service being sold' },
        price: { type: 'number', description: 'Price of product/service' },
        specific_objection: { type: 'string', description: 'The specific objection to handle (e.g., "Está muy caro")' },
        customer_type: { type: 'string', description: 'Type of customer' },
        currency: { type: 'string', description: 'Currency (default: USD)' },
      },
      required: ['product', 'price'],
    },
    riskLevel: 'low',
    execute: async (args, traceId) => {
      const input = `Objection handling for: ${args.product} (${args.currency || 'USD'} ${args.price})` +
        (args.specific_objection ? `\nObjection: "${args.specific_objection}"` : '') +
        (args.customer_type ? `\nCustomer: ${args.customer_type}` : '');
      const raw = await callLLM(SYSTEM_PROMPT, input, { temperature: 0.3 });
      let parsed;
      try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Could not parse' }; } catch { parsed = { raw_advice: raw }; }
      log.info('executed', { trace_id: traceId });
      return parsed;
    },
  }];
}
