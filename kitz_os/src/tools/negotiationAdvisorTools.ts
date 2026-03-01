/**
 * Negotiation Advisor Tools — Chris Voss's tactical empathy for SMBs.
 *
 * 1 tool:
 *   - negotiation_advise (medium) — Get Voss-style negotiation coaching with scripts and tactics
 *
 * Uses Claude Sonnet, falls back to OpenAI gpt-4o.
 */

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('negotiationAdvisorTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';


const SYSTEM = `You are a negotiation coach trained on Chris Voss's "Never Split the Difference" methodology.
Apply: Tactical Empathy, Mirroring (repeat last 1-3 words), Labeling ("It sounds like..."),
Calibrated Questions ("How" and "What"), Accusation Audit, getting "That's right", Black Swan discovery.
Context: LatAm SMB founders negotiating with suppliers, clients, partners. Default language: Spanish.
Be tactical — give exact phrases they can use word-for-word.

Respond with valid JSON:
{ "situation_analysis": string, "emotional_landscape": string,
  "tactics": [{ "tactic": string, "description": string, "example_phrase": string, "when_to_use": string }],
  "calibrated_questions": ["string"], "accusation_audit": ["string"],
  "desired_outcome": string, "black_swans": ["string"], "script": string }`;



export function getAllNegotiationAdvisorTools(): ToolSchema[] {
  return [{
    name: 'negotiation_advise',
    description: 'Get Chris Voss-style negotiation coaching. Returns tactical empathy analysis, mirroring/labeling scripts, calibrated questions, accusation audit, and a ready-to-use script.',
    parameters: {
      type: 'object',
      properties: {
        situation: { type: 'string', description: 'The negotiation situation' },
        counterparty: { type: 'string', description: 'Who you are negotiating with' },
        your_position: { type: 'string', description: 'Your current position/offer' },
        their_likely_position: { type: 'string', description: 'Their expected position' },
        relationship_importance: { type: 'string', enum: ['one-time', 'ongoing', 'critical'], description: 'Importance of ongoing relationship' },
        language: { type: 'string', description: 'Response language (default: es)' },
      },
      required: ['situation'],
    },
    riskLevel: 'medium',
    execute: async (args, traceId) => {
      const situation = String(args.situation || '').trim();
      if (!situation) return { error: 'Situation is required.' };
      const input = `Coach me through this negotiation:\n"${situation}"\nCounterparty: ${args.counterparty || 'unknown'}\nMy position: ${args.your_position || 'unknown'}\nTheir position: ${args.their_likely_position || 'unknown'}\nRelationship: ${args.relationship_importance || 'ongoing'}\nLanguage: ${args.language || 'es'}`;
      const raw = await callLLM(SYSTEM, input, { temperature: 0.5 });
      let parsed;
      try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : null; } catch { parsed = null; }
      if (!parsed) parsed = { situation_analysis: situation, tactics: [], calibrated_questions: [], script: 'Analysis unavailable' };
      log.info('executed', { trace_id: traceId });
      return parsed;
    },
  }];
}
