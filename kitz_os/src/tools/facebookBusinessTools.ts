/**
 * Facebook / Meta Business Tools — Comprehensive Graph API integrations.
 *
 * Tools:
 *   1.  fb_page_info         — Get Facebook Page details
 *   2.  fb_publish_post      — Publish a post to Facebook Page
 *   3.  fb_schedule_post     — Schedule a future post
 *   4.  fb_get_posts         — List recent page posts
 *   5.  fb_post_insights     — Get post performance metrics
 *   6.  fb_page_insights     — Get page-level analytics
 *   7.  fb_get_conversations — Get recent Messenger conversations
 *   8.  fb_send_message      — Send a message via Messenger
 *   9.  fb_get_lead_forms    — List lead generation forms
 *   10. fb_get_leads         — Get leads from a form
 *   11. ig_get_profile       — Get Instagram Business profile
 *   12. ig_get_media         — Get recent Instagram posts
 *   13. ig_publish_post      — Publish to Instagram
 *   14. ig_get_insights      — Get Instagram account insights
 *
 * Requires: META_PAGE_ACCESS_TOKEN, META_PAGE_ID
 * Optional: META_INSTAGRAM_ACCOUNT_ID (for ig_* tools)
 */
import { createSubsystemLogger } from 'kitz-schemas';
import type { ToolSchema } from './registry.js';

const log = createSubsystemLogger('facebookBusiness');

const GRAPH_API = 'https://graph.facebook.com/v19.0';

function getMetaConfig() {
  return {
    token: process.env.META_PAGE_ACCESS_TOKEN || '',
    pageId: process.env.META_PAGE_ID || '',
    igAccountId: process.env.META_INSTAGRAM_ACCOUNT_ID || '',
    configured: !!(process.env.META_PAGE_ACCESS_TOKEN && process.env.META_PAGE_ID),
  };
}

/** Build a Graph API URL with access_token and optional extra query params. */
function graphUrl(path: string, token: string, params?: Record<string, string>): string {
  const qs = new URLSearchParams({ access_token: token, ...params });
  return `${GRAPH_API}/${path}?${qs.toString()}`;
}

/** Standard POST via URLSearchParams (Graph API pattern). */
async function graphPost(
  path: string,
  token: string,
  body: Record<string, string>,
  timeoutMs = 15_000,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; error: string }> {
  const params = new URLSearchParams({ ...body, access_token: token });
  const res = await fetch(`${GRAPH_API}/${path}`, {
    method: 'POST',
    body: params.toString(),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => 'unknown');
    return { ok: false, error: `Graph API error (${res.status}): ${errText.slice(0, 300)}` };
  }
  const data = (await res.json()) as Record<string, unknown>;
  return { ok: true, data };
}

/** Standard GET with timeout. */
async function graphGet(
  url: string,
  timeoutMs = 15_000,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; error: string }> {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) {
    const errText = await res.text().catch(() => 'unknown');
    return { ok: false, error: `Graph API error (${res.status}): ${errText.slice(0, 300)}` };
  }
  const data = (await res.json()) as Record<string, unknown>;
  return { ok: true, data };
}

// ────────────────────────────────────────────────────────────────────────────
// Exported registry function
// ────────────────────────────────────────────────────────────────────────────

export function getAllFacebookBusinessTools(): ToolSchema[] {
  return [
    // ── 1. fb_page_info ─────────────────────────────────────────────────────
    {
      name: 'fb_page_info',
      description:
        'Get Facebook Page details including name, category, fan count, location, hours, and cover photo. ' +
        'Useful for LatAm businesses verifying their public presence or pulling store info for marketing materials.',
      parameters: {
        type: 'object',
        properties: {
          pageId: {
            type: 'string',
            description: 'Facebook Page ID (defaults to META_PAGE_ID env var)',
          },
        },
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const { token, pageId: defaultPageId, configured } = getMetaConfig();
        if (!configured) return { error: 'Set META_PAGE_ACCESS_TOKEN to use Facebook tools' };

        const pageId = String(args.pageId || defaultPageId);
        const fields =
          'name,about,category,fan_count,followers_count,link,website,phone,emails,hours,location,cover';
        const url = graphUrl(pageId, token, { fields });

        try {
          const result = await graphGet(url);
          if (!result.ok) return { error: result.error };
          log.info('fb_page_info', { pageId, trace_id: traceId });
          return { success: true, page: result.data, source: 'meta_graph' };
        } catch (err) {
          return { error: `fb_page_info failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 2. fb_publish_post ──────────────────────────────────────────────────
    {
      name: 'fb_publish_post',
      description:
        'Publish a post to your Facebook Page. Supports text, link shares, and photo uploads. ' +
        'Perfect for LatAm businesses announcing promotions, sharing product photos, or driving traffic to their WhatsApp.',
      parameters: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'Post text/caption' },
          link: { type: 'string', description: 'URL to share as a link post (optional)' },
          imageUrl: { type: 'string', description: 'Public image URL to upload as a photo post (optional)' },
        },
        required: ['message'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const { token, pageId, configured } = getMetaConfig();
        if (!configured) return { error: 'Set META_PAGE_ACCESS_TOKEN to use Facebook tools' };

        try {
          const body: Record<string, string> = { message: String(args.message) };
          let endpoint: string;

          if (args.imageUrl) {
            // Photo post
            endpoint = `${pageId}/photos`;
            body.url = String(args.imageUrl);
          } else {
            // Text / link post
            endpoint = `${pageId}/feed`;
            if (args.link) body.link = String(args.link);
          }

          const result = await graphPost(endpoint, token, body);
          if (!result.ok) return { error: result.error };

          const postId = String(result.data.id || result.data.post_id || '');
          const postUrl = `https://www.facebook.com/${postId.replace('_', '/posts/')}`;

          log.info('fb_publish_post', { postId, trace_id: traceId });
          return { success: true, id: postId, postUrl, source: 'meta_graph' };
        } catch (err) {
          return { error: `fb_publish_post failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 3. fb_schedule_post ─────────────────────────────────────────────────
    {
      name: 'fb_schedule_post',
      description:
        'Schedule a future post on your Facebook Page. The scheduled time must be between 10 minutes and 6 months in the future. ' +
        'Great for LatAm businesses planning weekend promotions or holiday campaigns in advance.',
      parameters: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'Post text' },
          scheduledTime: {
            type: 'number',
            description: 'Unix timestamp for publish time (must be 10 min to 6 months in the future)',
          },
          link: { type: 'string', description: 'URL to share (optional)' },
        },
        required: ['message', 'scheduledTime'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const { token, pageId, configured } = getMetaConfig();
        if (!configured) return { error: 'Set META_PAGE_ACCESS_TOKEN to use Facebook tools' };

        const scheduledTime = Number(args.scheduledTime);
        const nowSec = Math.floor(Date.now() / 1000);
        const tenMinFuture = nowSec + 600;
        const sixMonthsFuture = nowSec + 15_778_800; // ~6 months in seconds

        if (scheduledTime < tenMinFuture || scheduledTime > sixMonthsFuture) {
          return { error: 'scheduledTime must be between 10 minutes and 6 months in the future' };
        }

        try {
          const body: Record<string, string> = {
            message: String(args.message),
            published: 'false',
            scheduled_publish_time: String(scheduledTime),
          };
          if (args.link) body.link = String(args.link);

          const result = await graphPost(`${pageId}/feed`, token, body);
          if (!result.ok) return { error: result.error };

          log.info('fb_schedule_post', { postId: result.data.id, scheduledTime, trace_id: traceId });
          return {
            success: true,
            id: String(result.data.id || ''),
            scheduledTime,
            source: 'meta_graph',
          };
        } catch (err) {
          return { error: `fb_schedule_post failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 4. fb_get_posts ─────────────────────────────────────────────────────
    {
      name: 'fb_get_posts',
      description:
        'List recent posts from your Facebook Page with engagement data (shares, type, images). ' +
        'Helps LatAm businesses audit their content performance and identify top-performing posts.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of posts to return (default 25, max 100)' },
          since: { type: 'number', description: 'Unix timestamp — only return posts after this date (optional)' },
        },
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const { token, pageId, configured } = getMetaConfig();
        if (!configured) return { error: 'Set META_PAGE_ACCESS_TOKEN to use Facebook tools' };

        try {
          const limit = Math.min(Number(args.limit) || 25, 100);
          const fields = 'id,message,created_time,shares,permalink_url,full_picture,type';
          const params: Record<string, string> = { fields, limit: String(limit) };
          if (args.since) params.since = String(Number(args.since));

          const url = graphUrl(`${pageId}/posts`, token, params);
          const result = await graphGet(url);
          if (!result.ok) return { error: result.error };

          const rawPosts = (result.data.data || []) as Array<Record<string, unknown>>;
          const posts = rawPosts.map((p) => ({
            id: p.id,
            message: p.message || '',
            createdTime: p.created_time,
            shares: (p.shares as Record<string, unknown>)?.count || 0,
            permalink: p.permalink_url,
            picture: p.full_picture || null,
            type: p.type,
          }));

          log.info('fb_get_posts', { count: posts.length, trace_id: traceId });
          return { success: true, posts, source: 'meta_graph' };
        } catch (err) {
          return { error: `fb_get_posts failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 5. fb_post_insights ─────────────────────────────────────────────────
    {
      name: 'fb_post_insights',
      description:
        'Get performance metrics for a specific Facebook post — impressions, engagements, clicks, and reaction breakdown. ' +
        'Ideal for LatAm businesses measuring which promotions or product launches resonated most.',
      parameters: {
        type: 'object',
        properties: {
          postId: { type: 'string', description: 'Facebook post ID (format: pageId_postId)' },
        },
        required: ['postId'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const { token, configured } = getMetaConfig();
        if (!configured) return { error: 'Set META_PAGE_ACCESS_TOKEN to use Facebook tools' };

        try {
          const postId = String(args.postId);
          const metric =
            'post_impressions,post_engagements,post_clicks,post_reactions_by_type_total';
          const url = graphUrl(`${postId}/insights`, token, { metric });
          const result = await graphGet(url);
          if (!result.ok) return { error: result.error };

          const rawMetrics = (result.data.data || []) as Array<Record<string, unknown>>;
          const metrics: Record<string, unknown> = {};
          for (const m of rawMetrics) {
            const name = String(m.name || '').replace('post_', '');
            const values = m.values as Array<Record<string, unknown>> | undefined;
            metrics[name] = values?.[0]?.value ?? null;
          }

          log.info('fb_post_insights', { postId, trace_id: traceId });
          return {
            success: true,
            postId,
            impressions: metrics.impressions ?? null,
            engagements: metrics.engagements ?? null,
            clicks: metrics.clicks ?? null,
            reactions: metrics.reactions_by_type_total ?? null,
            source: 'meta_graph',
          };
        } catch (err) {
          return { error: `fb_post_insights failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 6. fb_page_insights ─────────────────────────────────────────────────
    {
      name: 'fb_page_insights',
      description:
        'Get page-level analytics — views, new fans, post engagements, and impressions over a period. ' +
        'Helps LatAm businesses track weekly/monthly growth and prove marketing ROI.',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['day', 'week', 'days_28'],
            description: 'Aggregation period (default: week)',
          },
          since: { type: 'number', description: 'Start time as Unix timestamp (optional)' },
          until: { type: 'number', description: 'End time as Unix timestamp (optional)' },
        },
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const { token, pageId, configured } = getMetaConfig();
        if (!configured) return { error: 'Set META_PAGE_ACCESS_TOKEN to use Facebook tools' };

        try {
          const period = String(args.period || 'week');
          const metric = 'page_views_total,page_fan_adds,page_post_engagements,page_impressions';
          const params: Record<string, string> = { metric, period };
          if (args.since) params.since = String(Number(args.since));
          if (args.until) params.until = String(Number(args.until));

          const url = graphUrl(`${pageId}/insights`, token, params);
          const result = await graphGet(url);
          if (!result.ok) return { error: result.error };

          const rawMetrics = (result.data.data || []) as Array<Record<string, unknown>>;
          const metrics = rawMetrics.map((m) => ({
            name: m.name,
            period: m.period,
            values: m.values,
          }));

          log.info('fb_page_insights', { period, trace_id: traceId });
          return { success: true, metrics, source: 'meta_graph' };
        } catch (err) {
          return { error: `fb_page_insights failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 7. fb_get_conversations ─────────────────────────────────────────────
    {
      name: 'fb_get_conversations',
      description:
        'Get recent Messenger conversations for your Facebook Page — see message counts, participants, and last update time. ' +
        'Essential for LatAm businesses that handle customer inquiries and orders through Messenger.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of conversations to return (default 20, max 100)' },
        },
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const { token, pageId, configured } = getMetaConfig();
        if (!configured) return { error: 'Set META_PAGE_ACCESS_TOKEN to use Facebook tools' };

        try {
          const limit = Math.min(Number(args.limit) || 20, 100);
          const fields = 'id,link,message_count,updated_time,participants';
          const url = graphUrl(`${pageId}/conversations`, token, { fields, limit: String(limit) });
          const result = await graphGet(url);
          if (!result.ok) return { error: result.error };

          const rawConvos = (result.data.data || []) as Array<Record<string, unknown>>;
          const conversations = rawConvos.map((c) => {
            const participantsData = c.participants as Record<string, unknown> | undefined;
            const participantsList = (participantsData?.data || []) as Array<Record<string, unknown>>;
            return {
              id: c.id,
              messageCount: c.message_count,
              updatedTime: c.updated_time,
              participants: participantsList.map((p) => ({
                name: p.name,
                id: p.id,
              })),
            };
          });

          log.info('fb_get_conversations', { count: conversations.length, trace_id: traceId });
          return { success: true, conversations, source: 'meta_graph' };
        } catch (err) {
          return { error: `fb_get_conversations failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 8. fb_send_message ──────────────────────────────────────────────────
    {
      name: 'fb_send_message',
      description:
        'Send a message to a user via Facebook Messenger (Page Messaging). Requires the recipient PSID. ' +
        'Useful for LatAm businesses following up on orders, answering product questions, or sending shipping updates.',
      parameters: {
        type: 'object',
        properties: {
          recipientId: { type: 'string', description: 'Page-scoped user ID (PSID) of the recipient' },
          message: { type: 'string', description: 'Message text to send' },
        },
        required: ['recipientId', 'message'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const { token, configured } = getMetaConfig();
        if (!configured) return { error: 'Set META_PAGE_ACCESS_TOKEN to use Facebook tools' };

        try {
          const payload = {
            messaging_type: 'RESPONSE',
            recipient: { id: String(args.recipientId) },
            message: { text: String(args.message) },
          };

          const res = await fetch(`${GRAPH_API}/me/messages?access_token=${token}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(15_000),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown');
            return { error: `Messenger send failed (${res.status}): ${errText.slice(0, 300)}` };
          }

          const data = (await res.json()) as Record<string, unknown>;
          log.info('fb_send_message', { recipientId: args.recipientId, messageId: data.message_id, trace_id: traceId });
          return {
            success: true,
            recipientId: String(args.recipientId),
            messageId: String(data.message_id || ''),
            source: 'meta_graph',
          };
        } catch (err) {
          return { error: `fb_send_message failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 9. fb_get_lead_forms ────────────────────────────────────────────────
    {
      name: 'fb_get_lead_forms',
      description:
        'List all lead generation forms on your Facebook Page — see form names, status, and lead counts. ' +
        'Crucial for LatAm businesses running Facebook Lead Ads to capture customer info for WhatsApp follow-up.',
      parameters: {
        type: 'object',
        properties: {},
      },
      riskLevel: 'low',
      execute: async (_args, traceId) => {
        const { token, pageId, configured } = getMetaConfig();
        if (!configured) return { error: 'Set META_PAGE_ACCESS_TOKEN to use Facebook tools' };

        try {
          const fields = 'id,name,status,leads_count,created_time';
          const url = graphUrl(`${pageId}/leadgen_forms`, token, { fields });
          const result = await graphGet(url);
          if (!result.ok) return { error: result.error };

          const rawForms = (result.data.data || []) as Array<Record<string, unknown>>;
          const forms = rawForms.map((f) => ({
            id: f.id,
            name: f.name,
            status: f.status,
            leadsCount: f.leads_count,
            createdTime: f.created_time,
          }));

          log.info('fb_get_lead_forms', { count: forms.length, trace_id: traceId });
          return { success: true, forms, source: 'meta_graph' };
        } catch (err) {
          return { error: `fb_get_lead_forms failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 10. fb_get_leads ────────────────────────────────────────────────────
    {
      name: 'fb_get_leads',
      description:
        'Get leads from a specific Facebook Lead Ad form — returns submitted field data and timestamps. ' +
        'Essential for LatAm businesses that run lead campaigns and want to pipe contacts into their CRM or WhatsApp.',
      parameters: {
        type: 'object',
        properties: {
          formId: { type: 'string', description: 'Lead form ID (get from fb_get_lead_forms)' },
          limit: { type: 'number', description: 'Number of leads to return (default 50, max 500)' },
        },
        required: ['formId'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const { token, configured } = getMetaConfig();
        if (!configured) return { error: 'Set META_PAGE_ACCESS_TOKEN to use Facebook tools' };

        try {
          const formId = String(args.formId);
          const limit = Math.min(Number(args.limit) || 50, 500);
          const fields = 'id,created_time,field_data';
          const url = graphUrl(`${formId}/leads`, token, { fields, limit: String(limit) });
          const result = await graphGet(url);
          if (!result.ok) return { error: result.error };

          const rawLeads = (result.data.data || []) as Array<Record<string, unknown>>;
          const leads = rawLeads.map((l) => ({
            id: l.id,
            createdTime: l.created_time,
            fields: l.field_data,
          }));

          log.info('fb_get_leads', { formId, count: leads.length, trace_id: traceId });
          return { success: true, leads, source: 'meta_graph' };
        } catch (err) {
          return { error: `fb_get_leads failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 11. ig_get_profile ──────────────────────────────────────────────────
    {
      name: 'ig_get_profile',
      description:
        'Get your Instagram Business profile — name, username, bio, follower/following counts, media count, and profile picture. ' +
        'Useful for LatAm businesses verifying their Instagram presence or pulling stats for reporting.',
      parameters: {
        type: 'object',
        properties: {},
      },
      riskLevel: 'low',
      execute: async (_args, traceId) => {
        const { token, igAccountId } = getMetaConfig();
        if (!token) return { error: 'Set META_PAGE_ACCESS_TOKEN to use Facebook tools' };
        if (!igAccountId) return { error: 'Set META_INSTAGRAM_ACCOUNT_ID to use Instagram tools' };

        try {
          const fields =
            'name,username,biography,followers_count,follows_count,media_count,profile_picture_url,website';
          const url = graphUrl(igAccountId, token, { fields });
          const result = await graphGet(url);
          if (!result.ok) return { error: result.error };

          log.info('ig_get_profile', { username: result.data.username, trace_id: traceId });
          return { success: true, profile: result.data, source: 'meta_graph' };
        } catch (err) {
          return { error: `ig_get_profile failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 12. ig_get_media ────────────────────────────────────────────────────
    {
      name: 'ig_get_media',
      description:
        'Get recent Instagram posts with engagement data — likes, comments, media URLs, and captions. ' +
        'Helps LatAm businesses audit their Instagram feed and identify top-performing content for reuse.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of posts to return (default 25, max 100)' },
        },
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const { token, igAccountId } = getMetaConfig();
        if (!token) return { error: 'Set META_PAGE_ACCESS_TOKEN to use Facebook tools' };
        if (!igAccountId) return { error: 'Set META_INSTAGRAM_ACCOUNT_ID to use Instagram tools' };

        try {
          const limit = Math.min(Number(args.limit) || 25, 100);
          const fields =
            'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count';
          const url = graphUrl(`${igAccountId}/media`, token, {
            fields,
            limit: String(limit),
          });
          const result = await graphGet(url);
          if (!result.ok) return { error: result.error };

          const rawPosts = (result.data.data || []) as Array<Record<string, unknown>>;
          const posts = rawPosts.map((p) => ({
            id: p.id,
            caption: p.caption || '',
            type: p.media_type,
            url: p.media_url || p.thumbnail_url || null,
            permalink: p.permalink,
            likes: p.like_count ?? 0,
            comments: p.comments_count ?? 0,
            timestamp: p.timestamp,
          }));

          log.info('ig_get_media', { count: posts.length, trace_id: traceId });
          return { success: true, posts, source: 'meta_graph' };
        } catch (err) {
          return { error: `ig_get_media failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 13. ig_publish_post ─────────────────────────────────────────────────
    {
      name: 'ig_publish_post',
      description:
        'Publish a photo post to Instagram Business. Requires a publicly accessible image URL. ' +
        'Two-step process: creates a media container then publishes it. ' +
        'Perfect for LatAm businesses posting product photos, promotions, or user-generated content.',
      parameters: {
        type: 'object',
        properties: {
          imageUrl: { type: 'string', description: 'Public image URL (must be accessible by Facebook servers)' },
          caption: { type: 'string', description: 'Post caption with hashtags' },
        },
        required: ['imageUrl', 'caption'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const { token, igAccountId } = getMetaConfig();
        if (!token) return { error: 'Set META_PAGE_ACCESS_TOKEN to use Facebook tools' };
        if (!igAccountId) return { error: 'Set META_INSTAGRAM_ACCOUNT_ID to use Instagram tools' };

        try {
          // Step 1: Create media container
          const containerResult = await graphPost(`${igAccountId}/media`, token, {
            image_url: String(args.imageUrl),
            caption: String(args.caption || ''),
          }, 30_000);

          if (!containerResult.ok) return { error: containerResult.error };
          const containerId = String(containerResult.data.id || '');

          // Step 2: Publish the container
          const publishResult = await graphPost(`${igAccountId}/media_publish`, token, {
            creation_id: containerId,
          }, 30_000);

          if (!publishResult.ok) return { error: publishResult.error };
          const mediaId = String(publishResult.data.id || '');

          // Fetch permalink for the published post
          let permalink = '';
          try {
            const mediaInfo = await graphGet(
              graphUrl(mediaId, token, { fields: 'permalink' }),
            );
            if (mediaInfo.ok) {
              permalink = String((mediaInfo.data as Record<string, unknown>).permalink || '');
            }
          } catch {
            // permalink is best-effort, not critical
          }

          log.info('ig_publish_post', { mediaId, trace_id: traceId });
          return {
            success: true,
            id: mediaId,
            permalink: permalink || `https://www.instagram.com/p/${mediaId}/`,
            source: 'meta_graph',
          };
        } catch (err) {
          return { error: `ig_publish_post failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 14. ig_get_insights ─────────────────────────────────────────────────
    {
      name: 'ig_get_insights',
      description:
        'Get Instagram Business account insights — impressions, reach, profile views over a period. ' +
        'Vital for LatAm businesses tracking their Instagram growth and proving social media ROI.',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['day', 'week', 'days_28'],
            description: 'Aggregation period (default: day)',
          },
          metric: {
            type: 'string',
            description: 'Comma-separated metrics (default: impressions,reach,profile_views)',
          },
        },
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const { token, igAccountId } = getMetaConfig();
        if (!token) return { error: 'Set META_PAGE_ACCESS_TOKEN to use Facebook tools' };
        if (!igAccountId) return { error: 'Set META_INSTAGRAM_ACCOUNT_ID to use Instagram tools' };

        try {
          const period = String(args.period || 'day');
          const metric = String(args.metric || 'impressions,reach,profile_views');
          const url = graphUrl(`${igAccountId}/insights`, token, { metric, period });
          const result = await graphGet(url);
          if (!result.ok) return { error: result.error };

          const rawMetrics = (result.data.data || []) as Array<Record<string, unknown>>;
          const metrics = rawMetrics.map((m) => ({
            name: m.name,
            period: m.period,
            values: m.values,
          }));

          log.info('ig_get_insights', { period, metric, trace_id: traceId });
          return { success: true, metrics, source: 'meta_graph' };
        } catch (err) {
          return { error: `ig_get_insights failed: ${(err as Error).message}` };
        }
      },
    },
  ];
}
