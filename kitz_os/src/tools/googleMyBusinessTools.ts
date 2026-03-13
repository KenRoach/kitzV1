/**
 * Google My Business Tools — Google Business Profile API integration.
 *
 * Tools:
 *   1. gmb_list_accounts      — List Google Business accounts
 *   2. gmb_list_locations     — List business locations for an account
 *   3. gmb_get_location       — Get full location details
 *   4. gmb_update_location    — Update business info (hours, description, phone)
 *   5. gmb_list_reviews       — List recent reviews
 *   6. gmb_reply_review       — Reply to a customer review
 *   7. gmb_create_post        — Create a Google Business post
 *   8. gmb_get_insights       — Get performance insights (advisory fallback)
 *
 * Requires: GOOGLE_ACCESS_TOKEN (same OAuth as Gmail/Calendar/Sheets)
 */
import { createSubsystemLogger } from 'kitz-schemas';
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';

const log = createSubsystemLogger('googleMyBusinessTools');

const GMB_API_BASE = 'https://mybusiness.googleapis.com/v4';
const GMB_BIZ_INFO_BASE = 'https://mybusinessbusinessinformation.googleapis.com/v1';

function getAccessToken(): string {
  return process.env.GOOGLE_ACCESS_TOKEN || '';
}

function authHeaders(token: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

const NO_TOKEN_ERROR = { error: 'Configure Google OAuth to manage your business profile' };

const INSIGHTS_ADVISORY_PROMPT = `You are a Google Business Profile optimization advisor for small businesses in Latin America.
Provide actionable tips on improving local search visibility, getting more reviews, optimizing business descriptions,
and leveraging Google Business posts for customer engagement. Focus on practical, low-cost tactics.
Default language: Spanish. Respond with valid JSON:
{ "tips": [string], "reviewStrategy": [string], "postIdeas": [string], "localSeoTips": [string], "actionSteps": [string] }`;

export function getAllGoogleMyBusinessTools(): ToolSchema[] {
  return [
    // ── 1. List Google Business Accounts ──
    {
      name: 'gmb_list_accounts',
      description: 'List your Google Business accounts.',
      parameters: {
        type: 'object',
        properties: {},
      },
      riskLevel: 'low',
      execute: async (_args, traceId) => {
        const token = getAccessToken();
        if (!token) return NO_TOKEN_ERROR;

        try {
          const res = await fetch(`${GMB_API_BASE}/accounts`, {
            method: 'GET',
            headers: authHeaders(token),
            signal: AbortSignal.timeout(15_000),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown');
            return { error: `Failed to list accounts (${res.status}): ${errText.slice(0, 200)}` };
          }

          const data = await res.json() as {
            accounts?: Array<{ name: string; accountName: string; type: string }>;
          };
          log.info('gmb_list_accounts', { count: data.accounts?.length || 0, trace_id: traceId });
          return { accounts: data.accounts || [], source: 'google_business_profile' };
        } catch (err) {
          return { error: `List accounts failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 2. List Locations for an Account ──
    {
      name: 'gmb_list_locations',
      description: 'List business locations for a Google Business account.',
      parameters: {
        type: 'object',
        properties: {
          accountId: { type: 'string', description: 'Google Business account ID (e.g., "accounts/123456789")' },
        },
        required: ['accountId'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const token = getAccessToken();
        if (!token) return NO_TOKEN_ERROR;

        const accountId = String(args.accountId);
        // Normalize: accept either "accounts/123" or just "123"
        const accountPath = accountId.startsWith('accounts/') ? accountId : `accounts/${accountId}`;

        try {
          const res = await fetch(`${GMB_BIZ_INFO_BASE}/${accountPath}/locations`, {
            method: 'GET',
            headers: authHeaders(token),
            signal: AbortSignal.timeout(15_000),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown');
            return { error: `Failed to list locations (${res.status}): ${errText.slice(0, 200)}` };
          }

          const data = await res.json() as {
            locations?: Array<{
              name: string;
              title: string;
              storefrontAddress?: unknown;
              phoneNumbers?: unknown;
              websiteUri?: string;
              metadata?: unknown;
            }>;
          };

          const locations = (data.locations || []).map((loc) => ({
            name: loc.name,
            title: loc.title,
            address: loc.storefrontAddress || null,
            phone: loc.phoneNumbers || null,
            websiteUri: loc.websiteUri || null,
            status: loc.metadata || null,
          }));

          log.info('gmb_list_locations', { count: locations.length, accountId: accountPath, trace_id: traceId });
          return { locations, source: 'google_business_profile' };
        } catch (err) {
          return { error: `List locations failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 3. Get Location Details ──
    {
      name: 'gmb_get_location',
      description: 'Get full details of a business location including categories, hours, and attributes.',
      parameters: {
        type: 'object',
        properties: {
          locationName: { type: 'string', description: 'Full resource name (e.g., "locations/123456789")' },
        },
        required: ['locationName'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const token = getAccessToken();
        if (!token) return NO_TOKEN_ERROR;

        const locationName = String(args.locationName);

        try {
          const res = await fetch(`${GMB_BIZ_INFO_BASE}/${locationName}`, {
            method: 'GET',
            headers: authHeaders(token),
            signal: AbortSignal.timeout(15_000),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown');
            return { error: `Failed to get location (${res.status}): ${errText.slice(0, 200)}` };
          }

          const loc = await res.json() as {
            title?: string;
            storefrontAddress?: unknown;
            phoneNumbers?: unknown;
            websiteUri?: string;
            categories?: unknown;
            regularHours?: unknown;
            attributes?: unknown;
            metadata?: unknown;
          };

          log.info('gmb_get_location', { locationName, trace_id: traceId });
          return {
            title: loc.title || null,
            address: loc.storefrontAddress || null,
            phone: loc.phoneNumbers || null,
            website: loc.websiteUri || null,
            categories: loc.categories || null,
            hours: loc.regularHours || null,
            attributes: loc.attributes || null,
            metadata: loc.metadata || null,
            source: 'google_business_profile',
          };
        } catch (err) {
          return { error: `Get location failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 4. Update Location ──
    {
      name: 'gmb_update_location',
      description: 'Update business info — description, phone, website, regular hours.',
      parameters: {
        type: 'object',
        properties: {
          locationName: { type: 'string', description: 'Full resource name (e.g., "locations/123456789")' },
          updates: {
            type: 'object',
            description: 'Fields to update: description, phone (primaryPhone string), websiteUri, regularHours',
            properties: {
              description: { type: 'string', description: 'Business description' },
              phone: { type: 'string', description: 'Primary phone number' },
              websiteUri: { type: 'string', description: 'Website URL' },
              regularHours: {
                type: 'object',
                description: 'Regular business hours object with periods array',
              },
            },
          },
        },
        required: ['locationName', 'updates'],
      },
      riskLevel: 'high',
      execute: async (args, traceId) => {
        const token = getAccessToken();
        if (!token) return NO_TOKEN_ERROR;

        const locationName = String(args.locationName);
        const updates = args.updates as Record<string, unknown> | undefined;
        if (!updates || Object.keys(updates).length === 0) {
          return { error: 'No updates provided' };
        }

        // Build the update body and field mask
        const body: Record<string, unknown> = {};
        const updateMaskFields: string[] = [];

        if (updates.description !== undefined) {
          body.profile = { description: String(updates.description) };
          updateMaskFields.push('profile.description');
        }
        if (updates.phone !== undefined) {
          body.phoneNumbers = { primaryPhone: String(updates.phone) };
          updateMaskFields.push('phoneNumbers.primaryPhone');
        }
        if (updates.websiteUri !== undefined) {
          body.websiteUri = String(updates.websiteUri);
          updateMaskFields.push('websiteUri');
        }
        if (updates.regularHours !== undefined) {
          body.regularHours = updates.regularHours;
          updateMaskFields.push('regularHours');
        }

        if (updateMaskFields.length === 0) {
          return { error: 'No recognized update fields provided' };
        }

        try {
          const updateMask = updateMaskFields.join(',');
          const res = await fetch(
            `${GMB_BIZ_INFO_BASE}/${locationName}?updateMask=${encodeURIComponent(updateMask)}`,
            {
              method: 'PATCH',
              headers: authHeaders(token),
              body: JSON.stringify(body),
              signal: AbortSignal.timeout(15_000),
            },
          );

          if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown');
            return { error: `Update location failed (${res.status}): ${errText.slice(0, 200)}` };
          }

          const location = await res.json();
          log.info('gmb_update_location', { locationName, fields: updateMaskFields, trace_id: traceId });
          return { updated: true, location, source: 'google_business_profile' };
        } catch (err) {
          return { error: `Update location failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 5. List Reviews ──
    {
      name: 'gmb_list_reviews',
      description: 'List recent Google reviews for a business location. Returns reviews, average rating, and total count.',
      parameters: {
        type: 'object',
        properties: {
          locationName: { type: 'string', description: 'Full resource name (e.g., "locations/123456789")' },
          pageSize: { type: 'number', description: 'Number of reviews to return (default: 20, max: 50)' },
        },
        required: ['locationName'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const token = getAccessToken();
        if (!token) return NO_TOKEN_ERROR;

        const locationName = String(args.locationName);
        const pageSize = Math.min(Number(args.pageSize) || 20, 50);

        try {
          const res = await fetch(
            `${GMB_API_BASE}/${locationName}/reviews?pageSize=${pageSize}`,
            {
              method: 'GET',
              headers: authHeaders(token),
              signal: AbortSignal.timeout(15_000),
            },
          );

          if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown');
            return { error: `List reviews failed (${res.status}): ${errText.slice(0, 200)}` };
          }

          const data = await res.json() as {
            reviews?: Array<{
              reviewId: string;
              reviewer: unknown;
              starRating: string;
              comment?: string;
              createTime: string;
              reviewReply?: { comment: string; updateTime: string };
            }>;
            averageRating?: number;
            totalReviewCount?: number;
          };

          const reviews = (data.reviews || []).map((r) => ({
            reviewId: r.reviewId,
            reviewer: r.reviewer,
            rating: r.starRating,
            comment: r.comment || null,
            createTime: r.createTime,
            reply: r.reviewReply || null,
          }));

          log.info('gmb_list_reviews', { locationName, count: reviews.length, trace_id: traceId });
          return {
            reviews,
            averageRating: data.averageRating || null,
            totalReviewCount: data.totalReviewCount || 0,
            source: 'google_business_profile',
          };
        } catch (err) {
          return { error: `List reviews failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 6. Reply to a Review ──
    {
      name: 'gmb_reply_review',
      description: 'Reply to a customer review on Google Business Profile.',
      parameters: {
        type: 'object',
        properties: {
          locationName: { type: 'string', description: 'Full resource name (e.g., "locations/123456789")' },
          reviewId: { type: 'string', description: 'Review ID to reply to' },
          comment: { type: 'string', description: 'Reply text' },
        },
        required: ['locationName', 'reviewId', 'comment'],
      },
      riskLevel: 'high',
      execute: async (args, traceId) => {
        const token = getAccessToken();
        if (!token) return NO_TOKEN_ERROR;

        const locationName = String(args.locationName);
        const reviewId = String(args.reviewId);
        const comment = String(args.comment);

        if (!comment.trim()) {
          return { error: 'Reply comment cannot be empty' };
        }

        try {
          const res = await fetch(
            `${GMB_API_BASE}/${locationName}/reviews/${reviewId}/reply`,
            {
              method: 'PUT',
              headers: authHeaders(token),
              body: JSON.stringify({ comment }),
              signal: AbortSignal.timeout(15_000),
            },
          );

          if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown');
            return { error: `Reply to review failed (${res.status}): ${errText.slice(0, 200)}` };
          }

          log.info('gmb_reply_review', { locationName, reviewId, trace_id: traceId });
          return { success: true, reviewId, source: 'google_business_profile' };
        } catch (err) {
          return { error: `Reply to review failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 7. Create a Google Business Post ──
    {
      name: 'gmb_create_post',
      description: 'Create a Google Business post (update, offer, event). Supports text, call-to-action, and optional image.',
      parameters: {
        type: 'object',
        properties: {
          locationName: { type: 'string', description: 'Full resource name (e.g., "locations/123456789")' },
          summary: { type: 'string', description: 'Post text (1500 chars max)' },
          callToAction: {
            type: 'object',
            description: 'Optional call-to-action button',
            properties: {
              actionType: {
                type: 'string',
                enum: ['LEARN_MORE', 'BOOK', 'ORDER', 'SHOP', 'SIGN_UP', 'CALL'],
                description: 'Action type for the CTA button',
              },
              url: { type: 'string', description: 'URL for the CTA (not required for CALL)' },
            },
            required: ['actionType'],
          },
          mediaUrl: { type: 'string', description: 'Public image URL to attach to the post (optional)' },
        },
        required: ['locationName', 'summary'],
      },
      riskLevel: 'high',
      execute: async (args, traceId) => {
        const token = getAccessToken();
        if (!token) return NO_TOKEN_ERROR;

        const locationName = String(args.locationName);
        const summary = String(args.summary).slice(0, 1500);

        const postBody: Record<string, unknown> = {
          languageCode: 'es',
          summary,
          topicType: 'STANDARD',
        };

        // Call to action
        const cta = args.callToAction as { actionType?: string; url?: string } | undefined;
        if (cta?.actionType) {
          postBody.callToAction = {
            actionType: cta.actionType,
            url: cta.url || undefined,
          };
        }

        // Media attachment
        if (args.mediaUrl) {
          postBody.media = [
            {
              mediaFormat: 'PHOTO',
              sourceUrl: String(args.mediaUrl),
            },
          ];
        }

        try {
          const res = await fetch(
            `${GMB_API_BASE}/${locationName}/localPosts`,
            {
              method: 'POST',
              headers: authHeaders(token),
              body: JSON.stringify(postBody),
              signal: AbortSignal.timeout(15_000),
            },
          );

          if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown');
            return { error: `Create post failed (${res.status}): ${errText.slice(0, 200)}` };
          }

          const data = await res.json() as { name?: string; state?: string };
          log.info('gmb_create_post', { locationName, postName: data.name, trace_id: traceId });
          return { postName: data.name || null, state: data.state || null, source: 'google_business_profile' };
        } catch (err) {
          return { error: `Create post failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 8. Get Insights (with advisory fallback) ──
    {
      name: 'gmb_get_insights',
      description: 'Get Google Business performance insights (queries, views, actions). Falls back to AI advisory if Google OAuth is not configured.',
      parameters: {
        type: 'object',
        properties: {
          locationName: { type: 'string', description: 'Full resource name (e.g., "locations/123456789")' },
          metricNames: {
            type: 'string',
            description: 'Comma-separated metric names (default: queries,views,actions). Options: queries, views, actions, photos, calls, messages, bookings, food_orders, direction_requests',
          },
        },
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const token = getAccessToken();

        // ── Advisory fallback when no token ──
        if (!token) {
          log.info('gmb_get_insights_advisory', { trace_id: traceId });
          const locationName = args.locationName ? String(args.locationName) : 'your business';
          const input = `Provide Google Business Profile optimization tips for: ${locationName}. Focus on LatAm small businesses that sell via WhatsApp and Instagram. Include review strategy, post ideas, and local SEO tips.`;
          const raw = await callLLM(INSIGHTS_ADVISORY_PROMPT, input, { temperature: 0.3 });
          let parsed;
          try {
            const m = raw.match(/\{[\s\S]*\}/);
            parsed = m ? JSON.parse(m[0]) : { advisory: raw };
          } catch {
            parsed = { advisory: raw };
          }
          parsed.source = 'advisory';
          return parsed;
        }

        // ── Real API call ──
        const locationName = String(args.locationName || '');
        if (!locationName) {
          return { error: 'locationName is required for insights' };
        }

        const metricsRaw = String(args.metricNames || 'queries,views,actions');
        const metricNames = metricsRaw.split(',').map((m) => m.trim()).filter(Boolean);

        try {
          // Business Profile Performance API uses reportInsights
          const requestBody = {
            locationNames: [locationName],
            basicRequest: {
              metricRequests: metricNames.map((metric) => ({ metric: metric.toUpperCase() })),
              timeRange: {
                // Default: last 30 days
                startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                endTime: new Date().toISOString(),
              },
            },
          };

          // Extract account path from locationName for the insights endpoint
          // locationName format: "accounts/123/locations/456" or "locations/456"
          const accountMatch = locationName.match(/^(accounts\/[^/]+)\//);
          const insightsUrl = accountMatch
            ? `${GMB_API_BASE}/${accountMatch[1]}/locations:reportInsights`
            : `${GMB_API_BASE}/${locationName}:reportInsights`;

          const res = await fetch(insightsUrl, {
            method: 'POST',
            headers: authHeaders(token),
            body: JSON.stringify(requestBody),
            signal: AbortSignal.timeout(15_000),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown');
            return { error: `Get insights failed (${res.status}): ${errText.slice(0, 200)}` };
          }

          const data = await res.json() as {
            locationMetrics?: Array<{
              locationName: string;
              metricValues: Array<{ metric: string; totalValue?: unknown; dimensionalValues?: unknown[] }>;
            }>;
          };

          const metrics = (data.locationMetrics || []).flatMap((lm) =>
            (lm.metricValues || []).map((mv) => ({
              name: mv.metric,
              values: mv.totalValue || mv.dimensionalValues || null,
            })),
          );

          log.info('gmb_get_insights', { locationName, metricCount: metrics.length, trace_id: traceId });
          return { metrics, source: 'google_business_profile' };
        } catch (err) {
          return { error: `Get insights failed: ${(err as Error).message}` };
        }
      },
    },
  ];
}
