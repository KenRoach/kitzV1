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

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_VERSION = '2023-06-01';
const OPENAI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `You are a social media strategist for small businesses in Latin America.
Instagram, TikTok, WhatsApp Status, Facebook. Content that drives sales through DMs and WhatsApp.
Prioritize video content. Default language: Spanish.

Respond with valid JSON:
{ "platforms": [{ "platform": string, "postsPerWeek": number, "bestTimes": [string], "contentTypes": [string],
  "growthTactics": [string] }], "weeklyCalendar": [{ "day": string, "platform": string, "contentType": string,
  "topic": string }], "contentPillars": [string], "engagementStrategy": [string],
  "growthTargets": object, "actionSteps": [string] }`;

async function callLLM(input: string): Promise<string> {
  if (CLAUDE_API_KEY) {
    try {
      const res = await fetch(CLAUDE_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': CLAUDE_API_VERSION }, body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1024, temperature: 0.3, system: SYSTEM_PROMPT, messages: [{ role: 'user', content: input }] }), signal: AbortSignal.timeout(15_000) });
      if (res.ok) { const d = await res.json() as { content: Array<{ type: string; text?: string }> }; return d.content?.find(c => c.type === 'text')?.text || ''; }
    } catch { /* fall through */ }
  }
  if (OPENAI_API_KEY) {
    try {
      const res = await fetch(OPENAI_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` }, body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: input }], max_tokens: 1024, temperature: 0.3 }), signal: AbortSignal.timeout(15_000) });
      if (res.ok) { const d = await res.json() as { choices?: Array<{ message?: { content?: string } }> }; return d.choices?.[0]?.message?.content || ''; }
    } catch { /* return error */ }
  }
  return JSON.stringify({ error: 'No AI available' });
}

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
      const raw = await callLLM(input);
      let parsed;
      try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Could not parse' }; } catch { parsed = { raw_plan: raw }; }
      log.info('executed', { trace_id: traceId });
      return parsed;
    },
  }];
}
