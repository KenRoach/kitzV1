/**
 * Lead qualification skill — score and qualify inbound leads.
 *
 * Scores leads based on: business type, revenue potential, channel engagement,
 * response speed, and fit with KITZ target persona.
 * Owner: CRO agent.
 */

import type { LLMClient } from './callTranscription.js';

export interface LeadScore {
  score: number;
  tier: 'hot' | 'warm' | 'cold';
  signals: string[];
  nextAction: string;
  estimatedValue: number;
  conversionProbability: number;
}

export interface LeadQualificationOptions {
  contactName: string;
  businessType?: string;
  channel: string;
  messageHistory?: string;
  responsiveness?: 'fast' | 'moderate' | 'slow';
  language?: string;
}

const LEAD_SYSTEM =
  'You are a lead qualification specialist for KITZ, targeting SMBs in Latin America. ' +
  'Score leads 0-100. Hot (70+): ready to activate. Warm (40-69): needs nurturing. Cold (<40): low priority. ' +
  'Signals: business type fit, engagement level, response speed, revenue potential. Default language: Spanish.';

const LEAD_FORMAT =
  'Respond with JSON: { "score": number (0-100), "tier": "hot"|"warm"|"cold", ' +
  '"signals": ["string"], "nextAction": string, "estimatedValue": number (monthly USD), ' +
  '"conversionProbability": number (0-1) }';

export async function qualifyLead(options: LeadQualificationOptions, llmClient?: LLMClient): Promise<LeadScore> {
  if (llmClient) {
    const prompt = `Qualify this lead:\nName: ${options.contactName}\nBusiness: ${options.businessType ?? 'unknown'}\n` +
      `Channel: ${options.channel}\nResponsiveness: ${options.responsiveness ?? 'unknown'}\n` +
      `History: ${options.messageHistory ?? 'none'}\n\n${LEAD_FORMAT}`;
    const response = await llmClient.complete({ prompt, system: LEAD_SYSTEM, tier: 'haiku' });
    try { return JSON.parse(response.text) as LeadScore; } catch { /* fall through */ }
  }
  return { score: 50, tier: 'warm', signals: ['no-data'], nextAction: 'Send welcome message', estimatedValue: 0, conversionProbability: 0.3 };
}
