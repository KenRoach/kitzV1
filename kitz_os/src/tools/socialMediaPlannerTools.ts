/**
 * Social Media Planner Tools — Platform strategy, content calendar, engagement.
 *
 * 1 tool:
 *   - social_plan (low) — Generate social media strategy with calendar, pillars, growth tactics
 *
 * Uses Claude Haiku, falls back to OpenAI gpt-4o-mini.
 */

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('socialMediaPlannerTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';


const SYSTEM_PROMPT = `You are a social media strategist for small businesses in Latin America.
Instagram, TikTok, WhatsApp Status, Facebook. Content that drives sales through DMs and WhatsApp.
Prioritize video content. Default language: Spanish.

Respond with valid JSON:
{ "platforms": [{ "platform": string, "postsPerWeek": number, "bestTimes": [string], "contentTypes": [string],
  "growthTactics": [string] }], "weeklyCalendar": [{ "day": string, "platform": string, "contentType": string,
  "topic": string }], "contentPillars": [string], "engagementStrategy": [string],
  "growthTargets": object, "actionSteps": [string] }`;



export function getAllSocialMediaPlannerTools(): ToolSchema[] {
  return [{
    name: 'social_plan',
    description: 'Generate social media strategy: platform plans, weekly content calendar, content pillars, engagement strategy, and growth targets for Instagram/TikTok/WhatsApp.',
    parameters: {
      type: 'object',
      properties: {
        business: { type: 'string', description: 'Business name' },
        industry: { type: 'string', description: 'Industry/niche' },
        target_audience: { type: 'string', description: 'Target audience' },
        goal: { type: 'string', enum: ['grow_followers', 'drive_sales', 'build_brand', 'community'], description: 'Social media goal' },
        platforms: { type: 'string', description: 'Comma-separated platforms (default: Instagram, WhatsApp, TikTok)' },
      },
      required: ['business', 'industry', 'target_audience', 'goal'],
    },
    riskLevel: 'low',
    execute: async (args, traceId) => {
      const input = `Social plan for: ${args.business} (${args.industry})\nAudience: ${args.target_audience}\nGoal: ${args.goal}` + (args.platforms ? `\nPlatforms: ${args.platforms}` : '');
      const raw = await callLLM(SYSTEM_PROMPT, input, { temperature: 0.3 });
      let parsed;
      try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Could not parse' }; } catch { parsed = { raw_plan: raw }; }
      log.info('executed', { trace_id: traceId });
      return parsed;
    },
  }];
}
