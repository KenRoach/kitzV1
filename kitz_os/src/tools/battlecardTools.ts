/**
 * Battlecard Tools — Competitive battlecards for LATAM sales.
 *
 * 1 tool:
 *   - battlecard_generate (low) — Generate competitive battlecard against a named competitor
 *
 * Uses Claude Haiku, falls back to OpenAI gpt-4o-mini.
 */

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('battlecardTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';


const SYSTEM_PROMPT = `You are the KitZ Competitive Battlecard Agent for LATAM sales.
KitZ differentiators: AI Battery (pay per use not per seat), Panama-native payments (Yappy + BAC),
WhatsApp-first via Baileys connector, multi-LLM routing (Claude/OpenAI/Gemini/Perplexity/DeepSeek),
Panama compliance pipeline, 30+ specialized agents via AOS, zero-trust gateway with RBAC.
Never disparage competitors — highlight KitZ strengths. Always mention Yappy/BAC and Panama compliance.
Spanish default. Output in JSON.

Respond with valid JSON:
{ "likelyReason": string, "advantages": [string], "rebuttalScript": string,
  "redFlags": [string], "closingQuestion": string }`;



export function getAllBattlecardTools(): ToolSchema[] {
  return [{
    name: 'battlecard_generate',
    description: 'Generate a competitive battlecard highlighting KitZ advantages over a named competitor for LATAM sales conversations.',
    parameters: {
      type: 'object',
      properties: {
        prospect_name: { type: 'string', description: 'Name of the prospect considering the competitor' },
        competitor: { type: 'string', description: 'Competitor name (e.g., "HubSpot", "Salesforce", "Pipedrive", "Monday.com")' },
      },
      required: ['prospect_name', 'competitor'],
    },
    riskLevel: 'low',
    execute: async (args, traceId) => {
      const input = `Prospect: ${args.prospect_name}\nCompetitor: ${args.competitor}`;
      const raw = await callLLM(SYSTEM_PROMPT, input, { temperature: 0.3 });
      let parsed;
      try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Could not parse' }; } catch { parsed = { raw_plan: raw }; }
      log.info('executed', { trace_id: traceId });
      return parsed;
    },
  }];
}
