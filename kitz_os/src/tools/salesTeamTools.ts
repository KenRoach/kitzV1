/**
 * Sales Team Tools — Lead qualification, objection handling, and follow-up generation.
 *
 * 3 tools:
 *   - sales_qualify_lead (low) — Score and tier a lead (0-100, hot/warm/cold)
 *   - sales_handle_objection (low) — Generate objection handling response
 *   - sales_generate_followup (low) — Generate follow-up message with channel and timing
 *
 * Uses Claude Haiku, falls back to OpenAI gpt-4o-mini.
 */

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('salesTeamTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';


const SYSTEM_PROMPT = `You are the KitZ Sales Team AI for LATAM businesses.
You handle qualification (score 0-100, tier), objection handling (acknowledge, reframe, prove, close),
and follow-up generation. Always reference KitZ capabilities. Yappy/BAC for payment. Spanish default. JSON output.`;



export function getAllSalesTeamTools(): ToolSchema[] {
  return [
    {
      name: 'sales_qualify_lead',
      description: 'Score and qualify a lead (0-100) with tier assignment (hot/warm/cold) and recommended next action for LATAM sales.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Lead contact name' },
          company: { type: 'string', description: 'Lead company name' },
          industry: { type: 'string', description: 'Industry vertical' },
          signals: { type: 'string', description: 'Buying signals observed (e.g., "visited pricing page, asked about Yappy integration, 20+ employees")' },
        },
        required: ['name', 'company', 'industry', 'signals'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const qualifyPrompt = SYSTEM_PROMPT + `\n\nQualify this lead. Respond with valid JSON:\n{ "score": number, "tier": "hot"|"warm"|"cold", "nextAction": string, "reasoning": string }`;
        const input = `Lead: ${args.name}\nCompany: ${args.company}\nIndustry: ${args.industry}\nSignals: ${args.signals}`;
        const raw = await callLLM(qualifyPrompt, input, { temperature: 0.3 });
        let parsed;
        try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Could not parse' }; } catch { parsed = { raw_plan: raw }; }
        log.info('executed sales_qualify_lead', { trace_id: traceId });
        return parsed;
      },
    },
    {
      name: 'sales_handle_objection',
      description: 'Generate an objection handling response using acknowledge-reframe-prove-close framework for LATAM sales.',
      parameters: {
        type: 'object',
        properties: {
          objection: { type: 'string', description: 'The objection raised (e.g., "es muy caro", "ya tenemos sistema", "no tengo tiempo")' },
          context: { type: 'string', description: 'Deal context — prospect info, stage, prior conversations' },
        },
        required: ['objection', 'context'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const objectionPrompt = SYSTEM_PROMPT + `\n\nHandle this sales objection. Respond with valid JSON:\n{ "response": string, "technique": string, "followUp": string }`;
        const input = `Objection: ${args.objection}\nContext: ${args.context}`;
        const raw = await callLLM(objectionPrompt, input, { temperature: 0.3 });
        let parsed;
        try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Could not parse' }; } catch { parsed = { raw_plan: raw }; }
        log.info('executed sales_handle_objection', { trace_id: traceId });
        return parsed;
      },
    },
    {
      name: 'sales_generate_followup',
      description: 'Generate a follow-up message with recommended channel, timing, and goal for LATAM sales prospects.',
      parameters: {
        type: 'object',
        properties: {
          prospect_name: { type: 'string', description: 'Prospect name' },
          last_interaction: { type: 'string', description: 'Summary of the last interaction' },
          deal_stage: { type: 'string', description: 'Current deal stage (e.g., "discovery", "demo", "proposal", "negotiation", "closing")' },
        },
        required: ['prospect_name', 'last_interaction', 'deal_stage'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const followupPrompt = SYSTEM_PROMPT + `\n\nGenerate a follow-up message. Respond with valid JSON:\n{ "message": string, "channel": string, "timing": string, "goal": string }`;
        const input = `Prospect: ${args.prospect_name}\nLast interaction: ${args.last_interaction}\nDeal stage: ${args.deal_stage}`;
        const raw = await callLLM(followupPrompt, input, { temperature: 0.3 });
        let parsed;
        try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Could not parse' }; } catch { parsed = { raw_plan: raw }; }
        log.info('executed sales_generate_followup', { trace_id: traceId });
        return parsed;
      },
    },
  ];
}
