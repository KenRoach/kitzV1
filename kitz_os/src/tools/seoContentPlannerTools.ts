/**
 * SEO Content Planner Tools — Keywords, topic clusters, content calendar, local SEO.
 *
 * 1 tool:
 *   - seo_plan (low) — Generate SEO content plan with keywords, pillars, calendar, local SEO tips
 *
 * Uses Claude Sonnet, falls back to OpenAI gpt-4o-mini.
 */

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('seoContentPlannerTools');
import type { ToolSchema } from './registry.js';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_VERSION = '2023-06-01';
const OPENAI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `You are an SEO content strategist for small businesses in Latin America.
Focus on Spanish-language SEO, local SEO (Google My Business), and long-tail keywords.
Prioritize low-competition keywords that drive real business results.
Content should be WhatsApp-shareable. Consider voice search. Default language: Spanish.

Respond with valid JSON:
{ "pillars": [{ "topic": string, "targetKeyword": string, "subTopics": [string], "contentType": string }],
  "keywordClusters": [{ "pillar": string, "keywords": [{ "keyword": string, "intent": string, "difficulty": string, "priority": number }] }],
  "contentCalendar": [{ "week": number, "title": string, "keyword": string, "type": string, "platform": string }],
  "technicalSEO": [string], "localSEO": [string], "quickWins": [string], "actionSteps": [string] }`;

async function callLLM(input: string): Promise<string> {
  if (CLAUDE_API_KEY) {
    try {
      const res = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': CLAUDE_API_VERSION },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1500, temperature: 0.3, system: SYSTEM_PROMPT, messages: [{ role: 'user', content: input }] }),
        signal: AbortSignal.timeout(20_000),
      });
      if (res.ok) { const d = await res.json() as { content: Array<{ type: string; text?: string }> }; return d.content?.find(c => c.type === 'text')?.text || ''; }
    } catch { /* fall through */ }
  }
  if (OPENAI_API_KEY) {
    try {
      const res = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: input }], max_tokens: 1500, temperature: 0.3 }),
        signal: AbortSignal.timeout(20_000),
      });
      if (res.ok) { const d = await res.json() as { choices?: Array<{ message?: { content?: string } }> }; return d.choices?.[0]?.message?.content || ''; }
    } catch { /* return error */ }
  }
  return JSON.stringify({ error: 'No AI available' });
}

export function getAllSeoContentPlannerTools(): ToolSchema[] {
  return [{
    name: 'seo_plan',
    description: 'Generate an SEO content plan: keyword clusters, content pillars, 4-week content calendar, technical SEO checklist, local SEO tips, and quick wins. Spanish-first for LatAm businesses.',
    parameters: {
      type: 'object',
      properties: {
        business: { type: 'string', description: 'Business name or type' },
        industry: { type: 'string', description: 'Industry/niche' },
        target_location: { type: 'string', description: 'City, country, or region to target' },
        current_website: { type: 'string', description: 'Website URL (optional)' },
        competitors: { type: 'string', description: 'Comma-separated competitor names' },
        target_keywords: { type: 'string', description: 'Comma-separated keywords to target' },
      },
      required: ['business', 'industry', 'target_location'],
    },
    riskLevel: 'low',
    execute: async (args, traceId) => {
      const input = `SEO plan for: ${args.business} (${args.industry})\nLocation: ${args.target_location}` +
        (args.current_website ? `\nWebsite: ${args.current_website}` : '') +
        (args.competitors ? `\nCompetitors: ${args.competitors}` : '') +
        (args.target_keywords ? `\nTarget keywords: ${args.target_keywords}` : '');
      const raw = await callLLM(input);
      let parsed;
      try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Could not parse response' }; } catch { parsed = { raw_plan: raw }; }
      log.info('executed', { trace_id: traceId });
      return parsed;
    },
  }];
}
