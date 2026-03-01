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
import { callLLM } from './shared/callLLM.js';


const SYSTEM_PROMPT = `You are an SEO content strategist for small businesses in Latin America.
Focus on Spanish-language SEO, local SEO (Google My Business), and long-tail keywords.
Prioritize low-competition keywords that drive real business results.
Content should be WhatsApp-shareable. Consider voice search. Default language: Spanish.

Respond with valid JSON:
{ "pillars": [{ "topic": string, "targetKeyword": string, "subTopics": [string], "contentType": string }],
  "keywordClusters": [{ "pillar": string, "keywords": [{ "keyword": string, "intent": string, "difficulty": string, "priority": number }] }],
  "contentCalendar": [{ "week": number, "title": string, "keyword": string, "type": string, "platform": string }],
  "technicalSEO": [string], "localSEO": [string], "quickWins": [string], "actionSteps": [string] }`;



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
      const raw = await callLLM(SYSTEM_PROMPT, input, { temperature: 0.3 });
      let parsed;
      try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Could not parse response' }; } catch { parsed = { raw_plan: raw }; }
      log.info('executed', { trace_id: traceId });
      return parsed;
    },
  }];
}
