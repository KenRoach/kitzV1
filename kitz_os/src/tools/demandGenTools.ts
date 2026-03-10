/**
 * Demand Gen Tools — Demand generation strategy for LATAM B2B.
 *
 * 1 tool:
 *   - demand_gen_strategy (low) — Build demand generation plays across WhatsApp, Email, LinkedIn, Social
 *
 * Uses Claude Haiku, falls back to OpenAI gpt-4o-mini.
 */

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('demandGenTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';


const SYSTEM_PROMPT = `You are the KitZ Demand Gen Strategist for LATAM B2B.
Build demand generation plays across WhatsApp, Email, LinkedIn, Social.
Always tie to business outcomes. WhatsApp is highest-converting in LATAM — recommend it first.
Spanish default. Reference KitZ tools where relevant. Be opinionated, not generic.

Respond with valid JSON:
{ "campaignBrief": string, "outreachSequence": [string], "contentCalendar": [string],
  "leadMagnetIdeas": [string], "kpis": [string] }`;



export function getAllDemandGenTools(): ToolSchema[] {
  return [{
    name: 'demand_gen_strategy',
    description: 'Build a demand generation strategy with outreach sequences, content calendar, lead magnets, and KPIs for LATAM B2B campaigns.',
    parameters: {
      type: 'object',
      properties: {
        offer: { type: 'string', description: 'What you are offering (product, service, or solution)' },
        icp: { type: 'string', description: 'Ideal Customer Profile (e.g., "SMB restaurantes en Panamá con 5-20 empleados")' },
        stage: { type: 'string', enum: ['awareness', 'consideration', 'decision'], description: 'Funnel stage to target' },
        channels: { type: 'array', items: { type: 'string' }, description: 'Channels to include (e.g., ["whatsapp", "email", "linkedin", "instagram"])' },
      },
      required: ['offer', 'icp', 'stage', 'channels'],
    },
    riskLevel: 'low',
    execute: async (args, traceId) => {
      const channelList = Array.isArray(args.channels) ? (args.channels as string[]).join(', ') : String(args.channels);
      const input = `Offer: ${args.offer}\nICP: ${args.icp}\nStage: ${args.stage}\nChannels: ${channelList}`;
      const raw = await callLLM(SYSTEM_PROMPT, input, { temperature: 0.3 });
      let parsed;
      try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Could not parse' }; } catch { parsed = { raw_plan: raw }; }
      log.info('executed', { trace_id: traceId });
      return parsed;
    },
  }];
}
