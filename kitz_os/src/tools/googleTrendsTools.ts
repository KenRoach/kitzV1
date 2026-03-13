/**
 * Google Trends Tools — Unofficial Google Trends API + LLM fallback.
 *
 * Tools:
 *   1. trends_interest_over_time  — Search interest for a keyword over time
 *   2. trends_related_queries     — Related search queries for a keyword
 *   3. trends_compare             — Compare search interest for multiple keywords
 *   4. trends_market_insight      — AI-powered market trend analysis
 *
 * Since Google Trends has no official stable API, these tools attempt the
 * unofficial endpoint pattern and fall back to callLLM for advisory analysis.
 */

import { createSubsystemLogger } from 'kitz-schemas';
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';

const log = createSubsystemLogger('googleTrendsTools');

// Unofficial Google Trends API base
const TRENDS_API = 'https://trends.google.com/trends/api';

/**
 * Attempt to fetch from the unofficial Google Trends endpoint.
 * Returns parsed data on success, or null on failure.
 */
async function trendsFetch(path: string, params: Record<string, string>): Promise<unknown | null> {
  try {
    const qs = new URLSearchParams(params);
    const url = `${TRENDS_API}/${path}?${qs.toString()}`;

    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; KitzOS/1.0)',
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) return null;

    // Google Trends API responses are prefixed with ")]}',\n" — strip it
    let text = await res.text();
    const prefixIndex = text.indexOf('\n');
    if (prefixIndex !== -1 && prefixIndex < 10) {
      text = text.slice(prefixIndex + 1);
    }

    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Map timeframe shorthand to Google Trends format. */
function normalizeTimeframe(tf?: string): string {
  if (!tf) return 'today 12-m';
  const lower = tf.toLowerCase().trim();
  if (lower === 'today 1-m' || lower === '1m' || lower === '1 month') return 'today 1-m';
  if (lower === 'today 3-m' || lower === '3m' || lower === '3 months') return 'today 3-m';
  if (lower === 'today 12-m' || lower === '12m' || lower === '1 year' || lower === '1y') return 'today 12-m';
  if (lower === 'today 5-y' || lower === '5y' || lower === '5 years') return 'today 5-y';
  return tf;
}

const TRENDS_SYSTEM_PROMPT = `You are a market research analyst specializing in Google search trends and consumer behavior in Latin America.
When asked about search trends, provide realistic trend data and analysis based on your knowledge.
Always respond with valid JSON matching the requested schema exactly. Do not wrap in markdown code blocks.`;

export function getAllGoogleTrendsTools(): ToolSchema[] {
  return [
    // ── 1. Interest Over Time ──
    {
      name: 'trends_interest_over_time',
      description: 'Get Google search interest for a keyword over time. Shows relative search volume (0-100) across dates. Falls back to AI analysis if the unofficial API is unavailable.',
      parameters: {
        type: 'object',
        properties: {
          keyword: { type: 'string', description: 'Search keyword or phrase' },
          geo: { type: 'string', description: 'Country code (default: PA for Panama). Use empty string for worldwide.' },
          timeframe: {
            type: 'string',
            description: 'Time range: "today 1-m" (1 month), "today 3-m" (3 months), "today 12-m" (1 year, default), "today 5-y" (5 years)',
          },
        },
        required: ['keyword'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const keyword = String(args.keyword);
        const geo = args.geo !== undefined ? String(args.geo) : 'PA';
        const timeframe = normalizeTimeframe(args.timeframe as string | undefined);

        try {
          // Attempt unofficial API
          const data = await trendsFetch('dailytrends', {
            hl: 'es',
            tz: '300',
            geo: geo || '',
            q: keyword,
          });

          if (data && typeof data === 'object') {
            log.info('trends_interest_api', { keyword, geo, trace_id: traceId });
            return {
              keyword,
              geo: geo || 'worldwide',
              data,
              source: 'google_trends_api',
              summary: `Search trend data for "${keyword}" in ${geo || 'worldwide'}.`,
            };
          }
        } catch {
          // Fall through to LLM
        }

        // LLM fallback: generate trend analysis
        const prompt = `Analyze the Google search trend for the keyword "${keyword}" in ${geo || 'worldwide'} over the timeframe "${timeframe}".
Provide your analysis as JSON:
{
  "keyword": "${keyword}",
  "geo": "${geo || 'worldwide'}",
  "data": [{"date": "YYYY-MM", "value": <0-100 relative interest>}],
  "summary": "<2-3 sentence analysis of the trend, seasonal patterns, and notable changes>"
}
Generate 6-12 realistic monthly data points based on your knowledge of this topic's search popularity.`;

        const raw = await callLLM(TRENDS_SYSTEM_PROMPT, prompt, { temperature: 0.3 });
        let parsed;
        try {
          const m = raw.match(/\{[\s\S]*\}/);
          parsed = m ? JSON.parse(m[0]) : { keyword, geo, data: [], summary: raw };
        } catch {
          parsed = { keyword, geo, data: [], summary: raw };
        }
        parsed.source = 'advisory';

        log.info('trends_interest_llm', { keyword, geo, trace_id: traceId });
        return parsed;
      },
    },

    // ── 2. Related Queries ──
    {
      name: 'trends_related_queries',
      description: 'Get related search queries for a keyword — both "rising" (breakout) and "top" (consistently popular) queries.',
      parameters: {
        type: 'object',
        properties: {
          keyword: { type: 'string', description: 'Search keyword or phrase' },
          geo: { type: 'string', description: 'Country code (default: PA for Panama)' },
        },
        required: ['keyword'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const keyword = String(args.keyword);
        const geo = args.geo !== undefined ? String(args.geo) : 'PA';

        try {
          // Attempt unofficial API for related queries
          const data = await trendsFetch('widgetdata/relatedsearches', {
            hl: 'es',
            tz: '300',
            geo: geo || '',
            q: keyword,
          });

          if (data && typeof data === 'object') {
            log.info('trends_related_api', { keyword, geo, trace_id: traceId });
            return { keyword, geo, ...data as object, source: 'google_trends_api' };
          }
        } catch {
          // Fall through to LLM
        }

        // LLM fallback
        const prompt = `For the search keyword "${keyword}" in ${geo || 'worldwide'}, provide related Google search queries.
Respond as JSON:
{
  "rising": [{"query": "<related query>", "value": "<percentage increase or 'Breakout'>"}],
  "top": [{"query": "<related query>", "value": <0-100 relative popularity>}]
}
Provide 5-8 rising queries and 5-8 top queries. Rising queries are trending up rapidly. Top queries are consistently popular.
Focus on queries relevant to the ${geo || 'global'} market and Spanish-speaking audiences where applicable.`;

        const raw = await callLLM(TRENDS_SYSTEM_PROMPT, prompt, { temperature: 0.3 });
        let parsed;
        try {
          const m = raw.match(/\{[\s\S]*\}/);
          parsed = m ? JSON.parse(m[0]) : { rising: [], top: [], raw: raw };
        } catch {
          parsed = { rising: [], top: [], raw: raw };
        }
        parsed.source = 'advisory';
        parsed.keyword = keyword;
        parsed.geo = geo || 'worldwide';

        log.info('trends_related_llm', { keyword, geo, trace_id: traceId });
        return parsed;
      },
    },

    // ── 3. Compare Keywords ──
    {
      name: 'trends_compare',
      description: 'Compare Google search interest for up to 5 keywords side by side. Returns average interest for each keyword and the winner.',
      parameters: {
        type: 'object',
        properties: {
          keywords: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of keywords to compare (max 5)',
          },
          geo: { type: 'string', description: 'Country code (default: PA for Panama)' },
          timeframe: {
            type: 'string',
            description: 'Time range: "today 1-m", "today 3-m", "today 12-m" (default), "today 5-y"',
          },
        },
        required: ['keywords'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const keywords = (args.keywords as string[])?.slice(0, 5) || [];
        const geo = args.geo !== undefined ? String(args.geo) : 'PA';
        const timeframe = normalizeTimeframe(args.timeframe as string | undefined);

        if (keywords.length < 2) {
          return { error: 'Provide at least 2 keywords to compare.' };
        }

        // LLM-based comparison (the unofficial comparison endpoint is complex to reverse-engineer)
        const keywordList = keywords.map((k, i) => `${i + 1}. "${k}"`).join('\n');
        const prompt = `Compare the Google search interest for these keywords in ${geo || 'worldwide'} over "${timeframe}":
${keywordList}

Respond as JSON:
{
  "comparison": [{"keyword": "<keyword>", "averageInterest": <0-100>}],
  "winner": "<keyword with highest average interest>",
  "analysis": "<2-3 sentences comparing the keywords, noting which is more popular and why>"
}
Order the comparison array from highest to lowest average interest.
Base your analysis on real-world search patterns and the relative popularity of these terms.`;

        const raw = await callLLM(TRENDS_SYSTEM_PROMPT, prompt, { temperature: 0.3 });
        let parsed;
        try {
          const m = raw.match(/\{[\s\S]*\}/);
          parsed = m ? JSON.parse(m[0]) : { comparison: [], winner: '', analysis: raw };
        } catch {
          parsed = { comparison: [], winner: '', analysis: raw };
        }
        parsed.source = 'advisory';
        parsed.geo = geo || 'worldwide';
        parsed.timeframe = timeframe;

        log.info('trends_compare', { keywords, geo, trace_id: traceId });
        return parsed;
      },
    },

    // ── 4. Market Insight (AI-powered) ──
    {
      name: 'trends_market_insight',
      description: 'AI-powered market trend analysis for a given industry and country. Provides trends, opportunities, risks, and actionable recommendations.',
      parameters: {
        type: 'object',
        properties: {
          industry: { type: 'string', description: 'Industry or business vertical (e.g. "e-commerce", "food delivery", "beauty products")' },
          country: { type: 'string', description: 'Target country (default: Panama)' },
        },
        required: ['industry'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const industry = String(args.industry);
        const country = String(args.country || 'Panama');

        const prompt = `Provide a comprehensive market trend analysis for the "${industry}" industry in ${country}.

Respond as JSON:
{
  "industry": "${industry}",
  "country": "${country}",
  "trends": [
    {"trend": "<trend name>", "direction": "up|down|stable", "impact": "high|medium|low", "description": "<1-2 sentence description>"}
  ],
  "opportunities": [
    {"opportunity": "<opportunity name>", "potential": "high|medium|low", "description": "<1-2 sentence description>"}
  ],
  "risks": [
    {"risk": "<risk name>", "severity": "high|medium|low", "description": "<1-2 sentence description>"}
  ],
  "recommendations": [
    "<actionable recommendation for a small business>"
  ],
  "searchTrends": [
    {"keyword": "<trending search term in this industry>", "growth": "rising|stable|declining"}
  ]
}

Provide 3-5 items per category. Focus on actionable insights for small businesses.
Consider the local market conditions in ${country}, consumer behavior, digital adoption, and competition.
Include Spanish-language search terms where relevant for Latin American markets.`;

        const raw = await callLLM(TRENDS_SYSTEM_PROMPT, prompt, {
          temperature: 0.4,
          maxTokens: 2048,
        });

        let parsed;
        try {
          const m = raw.match(/\{[\s\S]*\}/);
          parsed = m ? JSON.parse(m[0]) : {
            industry,
            country,
            trends: [],
            opportunities: [],
            risks: [],
            recommendations: [],
            searchTrends: [],
            raw: raw,
          };
        } catch {
          parsed = {
            industry,
            country,
            trends: [],
            opportunities: [],
            risks: [],
            recommendations: [],
            searchTrends: [],
            raw: raw,
          };
        }
        parsed.source = 'advisory';

        log.info('trends_market_insight', { industry, country, trace_id: traceId });
        return parsed;
      },
    },
  ];
}
