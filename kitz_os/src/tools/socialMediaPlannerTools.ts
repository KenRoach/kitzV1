/**
 * Social Media Tools — Meta Graph API + advisory strategy planner.
 *
 * Tools:
 *   1. social_postFacebook   — Post to Facebook Page via Graph API
 *   2. social_postInstagram  — Post to Instagram via Graph API
 *   3. social_getInsights    — Get page/account insights
 *   4. social_plan           — Advisory: generate strategy + content calendar (original)
 *
 * Requires: META_PAGE_ACCESS_TOKEN, META_PAGE_ID, META_INSTAGRAM_ACCOUNT_ID
 */
import { createSubsystemLogger } from 'kitz-schemas';
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';

const log = createSubsystemLogger('socialMediaTools');

function getMetaConfig() {
  return {
    token: process.env.META_PAGE_ACCESS_TOKEN || '',
    pageId: process.env.META_PAGE_ID || '',
    igAccountId: process.env.META_INSTAGRAM_ACCOUNT_ID || '',
    configured: !!(process.env.META_PAGE_ACCESS_TOKEN && process.env.META_PAGE_ID),
  };
}

const GRAPH_API = 'https://graph.facebook.com/v21.0';

const STRATEGY_PROMPT = `You are a social media strategist for small businesses in Latin America.
Instagram, TikTok, WhatsApp Status, Facebook. Content that drives sales through DMs and WhatsApp.
Prioritize video content. Default language: Spanish.

Respond with valid JSON:
{ "platforms": [{ "platform": string, "postsPerWeek": number, "bestTimes": [string], "contentTypes": [string],
  "growthTactics": [string] }], "weeklyCalendar": [{ "day": string, "platform": string, "contentType": string,
  "topic": string }], "contentPillars": [string], "engagementStrategy": [string],
  "growthTargets": object, "actionSteps": [string] }`;

export function getAllSocialMediaPlannerTools(): ToolSchema[] {
  return [
    // ── 1. Post to Facebook Page ──
    {
      name: 'social_postFacebook',
      description: 'Post a message to your Facebook Page. Supports text + optional image URL.',
      parameters: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'Post text/caption' },
          image_url: { type: 'string', description: 'Public image URL to include (optional)' },
          link: { type: 'string', description: 'Link to share (optional)' },
        },
        required: ['message'],
      },
      riskLevel: 'high',
      execute: async (args, traceId) => {
        const { token, pageId, configured } = getMetaConfig();
        if (!configured) {
          return { error: 'Meta/Facebook not configured.', fix: 'Set META_PAGE_ACCESS_TOKEN and META_PAGE_ID in env.', source: 'advisory' };
        }
        try {
          const params: Record<string, string> = {
            message: String(args.message),
            access_token: token,
          };
          if (args.link) params.link = String(args.link);

          let endpoint = `${GRAPH_API}/${pageId}/feed`;

          // If image, use photos endpoint
          if (args.image_url) {
            endpoint = `${GRAPH_API}/${pageId}/photos`;
            params.url = String(args.image_url);
          }

          const body = new URLSearchParams(params);
          const res = await fetch(endpoint, {
            method: 'POST',
            body: body.toString(),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            signal: AbortSignal.timeout(15_000),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown');
            return { error: `Facebook post failed (${res.status}): ${errText.slice(0, 200)}` };
          }

          const data = await res.json() as { id: string; post_id?: string };
          log.info('facebook_posted', { postId: data.id || data.post_id, trace_id: traceId });
          return { success: true, postId: data.id || data.post_id, platform: 'facebook', source: 'meta_graph' };
        } catch (err) {
          return { error: `Facebook post failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 2. Post to Instagram ──
    {
      name: 'social_postInstagram',
      description: 'Post an image to Instagram Business. Requires a public image URL.',
      parameters: {
        type: 'object',
        properties: {
          image_url: { type: 'string', description: 'Public image URL (required)' },
          caption: { type: 'string', description: 'Post caption with hashtags' },
        },
        required: ['image_url', 'caption'],
      },
      riskLevel: 'high',
      execute: async (args, traceId) => {
        const { token, igAccountId } = getMetaConfig();
        if (!token || !igAccountId) {
          return { error: 'Instagram not configured.', fix: 'Set META_PAGE_ACCESS_TOKEN and META_INSTAGRAM_ACCOUNT_ID in env.', source: 'advisory' };
        }
        try {
          // Step 1: Create media container
          const createParams = new URLSearchParams({
            image_url: String(args.image_url),
            caption: String(args.caption || ''),
            access_token: token,
          });
          const createRes = await fetch(`${GRAPH_API}/${igAccountId}/media`, {
            method: 'POST',
            body: createParams.toString(),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            signal: AbortSignal.timeout(30_000),
          });
          if (!createRes.ok) {
            const errText = await createRes.text().catch(() => 'unknown');
            return { error: `Instagram container failed (${createRes.status}): ${errText.slice(0, 200)}` };
          }
          const container = await createRes.json() as { id: string };

          // Step 2: Publish
          const publishParams = new URLSearchParams({
            creation_id: container.id,
            access_token: token,
          });
          const publishRes = await fetch(`${GRAPH_API}/${igAccountId}/media_publish`, {
            method: 'POST',
            body: publishParams.toString(),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            signal: AbortSignal.timeout(30_000),
          });
          if (!publishRes.ok) {
            const errText = await publishRes.text().catch(() => 'unknown');
            return { error: `Instagram publish failed (${publishRes.status}): ${errText.slice(0, 200)}` };
          }
          const published = await publishRes.json() as { id: string };
          log.info('instagram_posted', { mediaId: published.id, trace_id: traceId });
          return { success: true, mediaId: published.id, platform: 'instagram', source: 'meta_graph' };
        } catch (err) {
          return { error: `Instagram post failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 3. Get Social Insights ──
    {
      name: 'social_getInsights',
      description: 'Get Facebook Page or Instagram insights — followers, reach, engagement.',
      parameters: {
        type: 'object',
        properties: {
          platform: { type: 'string', enum: ['facebook', 'instagram'], description: 'Platform (default: facebook)' },
          period: { type: 'string', enum: ['day', 'week', 'days_28'], description: 'Time period (default: week)' },
        },
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const { token, pageId, igAccountId, configured } = getMetaConfig();
        if (!configured) {
          return { error: 'Meta not configured.', fix: 'Set META_PAGE_ACCESS_TOKEN and META_PAGE_ID in env.' };
        }
        try {
          const platform = String(args.platform || 'facebook');
          const period = String(args.period || 'week');

          if (platform === 'instagram' && igAccountId) {
            const metrics = 'impressions,reach,profile_views';
            const res = await fetch(
              `${GRAPH_API}/${igAccountId}/insights?metric=${metrics}&period=${period}&access_token=${token}`,
              { signal: AbortSignal.timeout(15_000) },
            );
            if (res.ok) {
              const data = await res.json() as { data: unknown[] };
              log.info('instagram_insights', { trace_id: traceId });
              return { success: true, platform: 'instagram', insights: data.data, source: 'meta_graph' };
            }
          }

          // Facebook Page insights
          const metrics = 'page_impressions,page_engaged_users,page_fans';
          const res = await fetch(
            `${GRAPH_API}/${pageId}/insights?metric=${metrics}&period=${period}&access_token=${token}`,
            { signal: AbortSignal.timeout(15_000) },
          );
          if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown');
            return { error: `Insights failed (${res.status}): ${errText.slice(0, 200)}` };
          }
          const data = await res.json() as { data: unknown[] };
          log.info('facebook_insights', { trace_id: traceId });
          return { success: true, platform: 'facebook', insights: data.data, source: 'meta_graph' };
        } catch (err) {
          return { error: `Insights failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 4. Advisory: Strategy + Content Calendar (original) ──
    {
      name: 'social_plan',
      description: 'Generate social media strategy: platform plans, weekly content calendar, content pillars, engagement strategy, and growth targets.',
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
        const raw = await callLLM(STRATEGY_PROMPT, input, { temperature: 0.3 });
        let parsed;
        try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Could not parse' }; } catch { parsed = { raw_plan: raw }; }
        parsed.source = 'advisory';
        log.info('social_plan', { trace_id: traceId });
        return parsed;
      },
    },
  ];
}
