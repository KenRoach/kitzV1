/**
 * Onboarding Assistant Tools — Client-facing chatbot to walk new users through KITZ.
 *
 * 1 tool:
 *   - onboarding_chat (low) — Conversational onboarding, captures needs, routes to the right module
 *
 * Uses Claude Haiku, falls back to OpenAI gpt-4o-mini.
 */

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('onboardingAssistantTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';


const SYSTEM_PROMPT = `You are the KitZ Onboarding Assistant, a client-facing chatbot. Walk new clients through what KITZ does, capture their needs, route them to the right module.
Available modules: WhatsApp Bot (:3006), AI Workspace (:3001), Compliance Hub (:3010), Payments (:3005), Full AI Engine (:3012), Comms Layer (:3013), Scheduler (cron).
Be warm, helpful, concise. Spanish default. Output in JSON.`;


export function getAllOnboardingAssistantTools(): ToolSchema[] {
  return [{
    name: 'onboarding_chat',
    description: 'Conversational onboarding assistant. Walks new clients through KITZ, captures their needs, and routes them to the right module. Returns response, suggested module, and next step.',
    parameters: {
      type: 'object',
      properties: {
        user_message: { type: 'string', description: 'The user\'s message or question' },
        business_type: { type: 'string', description: 'Their business type (restaurant, store, consulting, etc.)' },
        current_step: { type: 'string', description: 'Current onboarding step (optional, e.g., "intro", "needs_capture", "module_selection")' },
      },
      required: ['user_message', 'business_type'],
    },
    riskLevel: 'low',
    execute: async (args, traceId) => {
      const input = `User message: ${args.user_message}\nBusiness type: ${args.business_type}\nCurrent step: ${args.current_step || 'intro'}\n\nRespond with valid JSON:\n{ "response": string, "suggestedModule": string, "nextStep": string, "isComplete": boolean }`;
      const raw = await callLLM(SYSTEM_PROMPT, input, { temperature: 0.3 });
      let parsed;
      try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Could not parse' }; } catch { parsed = { raw: raw }; }
      log.info('executed', { trace_id: traceId });
      return parsed;
    },
  }];
}
