/**
 * Customer onboarding skill — guide new customers through activation.
 *
 * Target: <10 minutes to first value (biggest scale risk).
 * Breakthrough moment: when user sees their own data in the system.
 * Owner: HeadGrowth agent.
 */

import type { LLMClient } from './callTranscription.js';

export interface OnboardingStep {
  step: number;
  action: string;
  channel: 'whatsapp' | 'web' | 'email';
  messageDraft: string;
  waitMinutes: number;
  completionCheck: string;
}

export interface OnboardingResult {
  plan: OnboardingStep[];
  estimatedMinutes: number;
  firstValueAction: string;
  breakthroughMoment: string;
}

export interface OnboardingOptions {
  customerName: string;
  businessType?: string;
  channel: 'whatsapp' | 'web' | 'email';
  tier: 'starter' | 'hustler';
  language?: string;
}

const ONBOARDING_SYSTEM =
  'You are an onboarding specialist for KITZ, an AI business OS for Latin American SMBs. ' +
  'Create a personalized onboarding plan that gets the user to first value in <10 minutes. ' +
  'Breakthrough moment: when they see THEIR OWN data in the system. ' +
  'Steps should be concrete, with WhatsApp message drafts. Default language: Spanish.';

const ONBOARDING_FORMAT =
  'Respond with JSON: { "plan": [{ "step": number, "action": string, "channel": string, ' +
  '"messageDraft": string (5-15 words, warm), "waitMinutes": number, "completionCheck": string }], ' +
  '"estimatedMinutes": number, "firstValueAction": string, "breakthroughMoment": string }';

export async function createOnboardingPlan(options: OnboardingOptions, llmClient?: LLMClient): Promise<OnboardingResult> {
  if (llmClient) {
    const prompt = `Create onboarding plan for:\nName: ${options.customerName}\n` +
      `Business: ${options.businessType ?? 'unknown'}\nChannel: ${options.channel}\n` +
      `Tier: ${options.tier}\nLanguage: ${options.language ?? 'es'}\n\n${ONBOARDING_FORMAT}`;
    const response = await llmClient.complete({ prompt, system: ONBOARDING_SYSTEM, tier: 'sonnet' });
    try { return JSON.parse(response.text) as OnboardingResult; } catch { /* fall through */ }
  }
  return {
    plan: [
      { step: 1, action: 'Welcome message', channel: options.channel, messageDraft: `¡Hola ${options.customerName}! Bienvenido a KITZ 🚀`, waitMinutes: 0, completionCheck: 'message_sent' },
      { step: 2, action: 'Add first contact', channel: 'web', messageDraft: 'Agrega tu primer cliente al CRM', waitMinutes: 2, completionCheck: 'contact_created' },
      { step: 3, action: 'Create first order', channel: 'web', messageDraft: 'Crea tu primera orden', waitMinutes: 3, completionCheck: 'order_created' },
    ],
    estimatedMinutes: 8,
    firstValueAction: 'See your first contact in the CRM',
    breakthroughMoment: 'When they see their own customer data in the dashboard',
  };
}
