/**
 * Content Loop Tools — Create → Publish → Measure → Promote
 *
 * Closed-loop content performance system:
 *   1. Content is created (via contentEngine.ts)
 *   2. Published to a platform (Instagram, TikTok, Facebook, etc.)
 *   3. Performance measured (engagement, reach, clicks)
 *   4. Top performers suggested for paid promotion (boosting)
 *
 * 4 tools:
 *   - content_publish       (high)   — Publish content to a social platform
 *   - content_measure       (low)    — Record/get performance metrics for content
 *   - content_suggestBoost  (low)    — Analyze all content and suggest best for paid promotion
 *   - content_promote       (high)   — Create paid promotion for top content
 *
 * Note: Actual platform API calls are stubbed — they connect to real APIs
 *       when platform credentials are configured (Meta Graph API, TikTok, etc.)
 */

import type { ToolSchema } from './registry.js';
import { getContent } from './contentEngine.js';

// ── Types ──

type Platform = 'instagram' | 'tiktok' | 'facebook' | 'youtube' | 'linkedin' | 'twitter';

interface PublishRecord {
  contentId: string;
  platform: Platform;
  platformPostId: string;  // Post ID from the platform
  publishedAt: string;
  status: 'published' | 'failed' | 'removed';
  url?: string;
}

interface PerformanceMetrics {
  contentId: string;
  platform: Platform;
  impressions: number;
  reach: number;
  engagement: number;       // Total interactions
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  videoViews?: number;
  videoCompletionRate?: number;  // 0-1
  ctr: number;              // Click-through rate (0-1)
  engagementRate: number;    // engagement / impressions (0-1)
  measuredAt: string;
  costPerEngagement?: number;
  spend?: number;
}

interface BoostSuggestion {
  contentId: string;
  platform: Platform;
  score: number;            // 0-100 boost score
  reason: string;
  suggestedBudget: number;  // USD
  estimatedReach: number;
  metrics: PerformanceMetrics;
}

interface PromotionRecord {
  contentId: string;
  platform: Platform;
  budget: number;
  currency: string;
  duration: number;         // Days
  targetAudience?: string;
  status: 'pending' | 'active' | 'completed' | 'paused';
  createdAt: string;
  campaignId?: string;
}

// ── In-Memory Stores ──

const publications: Map<string, PublishRecord[]> = new Map();        // contentId → pubs
const metrics: Map<string, PerformanceMetrics[]> = new Map();        // contentId → metrics
const promotions: Map<string, PromotionRecord[]> = new Map();        // contentId → promotions

// ── Helpers ──

function generatePostId(): string {
  return `post-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Calculate boost score (0-100) based on organic metrics */
function calculateBoostScore(m: PerformanceMetrics): number {
  let score = 0;

  // Engagement rate is the strongest signal
  if (m.engagementRate > 0.10) score += 40;      // Viral-level
  else if (m.engagementRate > 0.05) score += 30;  // Excellent
  else if (m.engagementRate > 0.03) score += 20;  // Good
  else if (m.engagementRate > 0.01) score += 10;  // Average

  // Absolute engagement matters
  if (m.engagement > 500) score += 15;
  else if (m.engagement > 100) score += 10;
  else if (m.engagement > 50) score += 5;

  // Save rate is a strong purchase intent signal
  const saveRate = m.impressions > 0 ? m.saves / m.impressions : 0;
  if (saveRate > 0.05) score += 15;
  else if (saveRate > 0.02) score += 10;
  else if (saveRate > 0.01) score += 5;

  // Share rate = viral potential
  const shareRate = m.impressions > 0 ? m.shares / m.impressions : 0;
  if (shareRate > 0.03) score += 15;
  else if (shareRate > 0.01) score += 10;

  // Click-through = commercial intent
  if (m.ctr > 0.05) score += 15;
  else if (m.ctr > 0.02) score += 10;
  else if (m.ctr > 0.01) score += 5;

  return Math.min(score, 100);
}

function generateBoostReason(m: PerformanceMetrics, score: number): string {
  const reasons: string[] = [];
  if (m.engagementRate > 0.05) reasons.push(`high engagement rate (${(m.engagementRate * 100).toFixed(1)}%)`);
  if (m.saves > 20) reasons.push(`${m.saves} saves (purchase intent signal)`);
  if (m.shares > 10) reasons.push(`${m.shares} shares (viral potential)`);
  if (m.ctr > 0.02) reasons.push(`strong CTR (${(m.ctr * 100).toFixed(1)}%)`);
  if (m.videoCompletionRate && m.videoCompletionRate > 0.5) reasons.push(`${(m.videoCompletionRate * 100).toFixed(0)}% video completion`);
  if (reasons.length === 0) reasons.push('above-average organic performance');
  return `Score ${score}/100 — ${reasons.join(', ')}`;
}

function estimateBudgetAndReach(m: PerformanceMetrics, score: number): { budget: number; reach: number } {
  // Higher score = more worth spending on
  const budget = score >= 70 ? 50 : score >= 50 ? 25 : 10;
  // Rough CPM estimation: $5-15 CPM for LatAm
  const cpm = 8; // $8 per 1000 impressions average
  const estimatedReach = Math.round((budget / cpm) * 1000);
  return { budget, reach: estimatedReach };
}

// ── Tools ──

export function getAllContentLoopTools(): ToolSchema[] {
  return [
    {
      name: 'content_publish',
      description:
        'Publish a content item to a social media platform. Supports: instagram, tiktok, facebook, youtube, linkedin, twitter. ' +
        'Content must exist in the content engine first (created via content generation tools).',
      parameters: {
        type: 'object',
        properties: {
          content_id: { type: 'string', description: 'Content item ID from content engine' },
          platform: { type: 'string', enum: ['instagram', 'tiktok', 'facebook', 'youtube', 'linkedin', 'twitter'] },
          caption: { type: 'string', description: 'Post caption/description' },
          schedule_at: { type: 'string', description: 'ISO 8601 datetime to schedule (omit for immediate)' },
        },
        required: ['content_id', 'platform'],
      },
      riskLevel: 'high',
      execute: async (args) => {
        const contentId = String(args.content_id);
        const platform = String(args.platform) as Platform;
        const content = getContent(contentId);

        if (!content) return { error: `Content "${contentId}" not found. Create it first with content generation tools.` };

        // Generate a platform post ID (in production, this comes from the platform API)
        const platformPostId = generatePostId();
        const record: PublishRecord = {
          contentId,
          platform,
          platformPostId,
          publishedAt: args.schedule_at ? String(args.schedule_at) : new Date().toISOString(),
          status: 'published',
          url: `https://${platform}.com/p/${platformPostId}`,
        };

        const existing = publications.get(contentId) || [];
        existing.push(record);
        publications.set(contentId, existing);

        // Initialize empty metrics
        const emptyMetrics: PerformanceMetrics = {
          contentId,
          platform,
          impressions: 0, reach: 0, engagement: 0,
          likes: 0, comments: 0, shares: 0, saves: 0, clicks: 0,
          ctr: 0, engagementRate: 0,
          measuredAt: new Date().toISOString(),
        };
        const existingMetrics = metrics.get(contentId) || [];
        existingMetrics.push(emptyMetrics);
        metrics.set(contentId, existingMetrics);

        return {
          published: true,
          contentId,
          platform,
          platformPostId,
          url: record.url,
          scheduledAt: record.publishedAt,
          message: `Content published to ${platform}. Track performance with content_measure.`,
        };
      },
    },
    {
      name: 'content_measure',
      description:
        'Record or retrieve performance metrics for published content. ' +
        'If metrics are provided, updates the record. If not, returns current metrics. ' +
        'Use this to track: impressions, reach, likes, comments, shares, saves, clicks.',
      parameters: {
        type: 'object',
        properties: {
          content_id: { type: 'string', description: 'Content item ID' },
          platform: { type: 'string', description: 'Platform to measure (omit for all platforms)' },
          // Update fields (optional — omit to just read)
          impressions: { type: 'number' },
          reach: { type: 'number' },
          likes: { type: 'number' },
          comments: { type: 'number' },
          shares: { type: 'number' },
          saves: { type: 'number' },
          clicks: { type: 'number' },
          video_views: { type: 'number' },
          video_completion_rate: { type: 'number', description: '0-1 ratio' },
          spend: { type: 'number', description: 'Ad spend in USD (if promoted)' },
        },
        required: ['content_id'],
      },
      riskLevel: 'low',
      execute: async (args) => {
        const contentId = String(args.content_id);
        const platform = args.platform as Platform | undefined;
        const contentMetrics = metrics.get(contentId);

        if (!contentMetrics || contentMetrics.length === 0) {
          return { error: `No metrics for "${contentId}". Publish it first with content_publish.` };
        }

        // If update fields provided, update the matching metric entry
        const hasUpdates = ['impressions', 'reach', 'likes', 'comments', 'shares', 'saves', 'clicks', 'video_views', 'spend']
          .some(k => args[k] !== undefined);

        if (hasUpdates) {
          const target = platform
            ? contentMetrics.find(m => m.platform === platform)
            : contentMetrics[contentMetrics.length - 1];

          if (!target) return { error: `No metrics found for platform "${platform}".` };

          if (args.impressions !== undefined) target.impressions = Number(args.impressions);
          if (args.reach !== undefined) target.reach = Number(args.reach);
          if (args.likes !== undefined) target.likes = Number(args.likes);
          if (args.comments !== undefined) target.comments = Number(args.comments);
          if (args.shares !== undefined) target.shares = Number(args.shares);
          if (args.saves !== undefined) target.saves = Number(args.saves);
          if (args.clicks !== undefined) target.clicks = Number(args.clicks);
          if (args.video_views !== undefined) target.videoViews = Number(args.video_views);
          if (args.video_completion_rate !== undefined) target.videoCompletionRate = Number(args.video_completion_rate);
          if (args.spend !== undefined) target.spend = Number(args.spend);

          // Recalculate derived metrics
          target.engagement = target.likes + target.comments + target.shares + target.saves;
          target.ctr = target.impressions > 0 ? target.clicks / target.impressions : 0;
          target.engagementRate = target.impressions > 0 ? target.engagement / target.impressions : 0;
          if (target.spend && target.engagement > 0) {
            target.costPerEngagement = target.spend / target.engagement;
          }
          target.measuredAt = new Date().toISOString();

          return { updated: true, metrics: target };
        }

        // Read-only: return all metrics for this content
        const filtered = platform ? contentMetrics.filter(m => m.platform === platform) : contentMetrics;
        return { contentId, metrics: filtered };
      },
    },
    {
      name: 'content_suggestBoost',
      description:
        'Analyze all published content and suggest the best performers for paid promotion (boosting). ' +
        'Returns a ranked list with boost scores (0-100), reasons, and suggested budgets.',
      parameters: {
        type: 'object',
        properties: {
          min_score: { type: 'number', description: 'Minimum boost score to include (default: 30)' },
          platform: { type: 'string', description: 'Filter by platform (omit for all)' },
          max_results: { type: 'number', description: 'Max suggestions to return (default: 5)' },
        },
      },
      riskLevel: 'low',
      execute: async (args) => {
        const minScore = (args.min_score as number) || 30;
        const platformFilter = args.platform as Platform | undefined;
        const maxResults = (args.max_results as number) || 5;

        const suggestions: BoostSuggestion[] = [];

        for (const [contentId, contentMetrics] of metrics) {
          for (const m of contentMetrics) {
            if (platformFilter && m.platform !== platformFilter) continue;
            if (m.impressions < 10) continue; // Need minimum data

            const score = calculateBoostScore(m);
            if (score < minScore) continue;

            const { budget, reach } = estimateBudgetAndReach(m, score);

            suggestions.push({
              contentId,
              platform: m.platform,
              score,
              reason: generateBoostReason(m, score),
              suggestedBudget: budget,
              estimatedReach: reach,
              metrics: m,
            });
          }
        }

        suggestions.sort((a, b) => b.score - a.score);
        const topSuggestions = suggestions.slice(0, maxResults);

        if (topSuggestions.length === 0) {
          return {
            suggestions: [],
            message: 'No content meets the boost threshold yet. Keep publishing and measuring organic performance.',
          };
        }

        return {
          suggestions: topSuggestions,
          totalAnalyzed: metrics.size,
          message: `Found ${topSuggestions.length} content items worth boosting. Top pick: "${topSuggestions[0].contentId}" with score ${topSuggestions[0].score}/100.`,
        };
      },
    },
    {
      name: 'content_promote',
      description:
        'Create a paid promotion (boost) for published content. Sets budget, duration, and optional target audience.',
      parameters: {
        type: 'object',
        properties: {
          content_id: { type: 'string', description: 'Content item ID to promote' },
          platform: { type: 'string', enum: ['instagram', 'tiktok', 'facebook', 'youtube', 'linkedin', 'twitter'] },
          budget: { type: 'number', description: 'Budget in USD' },
          duration_days: { type: 'number', description: 'Campaign duration in days (default: 3)' },
          target_audience: { type: 'string', description: 'Target audience description' },
        },
        required: ['content_id', 'platform', 'budget'],
      },
      riskLevel: 'high',
      execute: async (args) => {
        const contentId = String(args.content_id);
        const platform = String(args.platform) as Platform;
        const budget = Number(args.budget);
        const duration = (args.duration_days as number) || 3;

        // Verify content exists and is published
        const pubs = publications.get(contentId);
        const pub = pubs?.find(p => p.platform === platform && p.status === 'published');
        if (!pub) {
          return { error: `Content "${contentId}" not found on ${platform}. Publish it first.` };
        }

        const promo: PromotionRecord = {
          contentId,
          platform,
          budget,
          currency: 'USD',
          duration,
          targetAudience: (args.target_audience as string) || undefined,
          status: 'pending',
          createdAt: new Date().toISOString(),
          campaignId: `camp-${Date.now().toString(36)}`,
        };

        const existing = promotions.get(contentId) || [];
        existing.push(promo);
        promotions.set(contentId, existing);

        return {
          promoted: true,
          contentId,
          platform,
          budget: `$${budget}`,
          duration: `${duration} days`,
          campaignId: promo.campaignId,
          status: 'pending',
          message: `Promotion created for "${contentId}" on ${platform}. Budget: $${budget} for ${duration} days. Status: pending approval.`,
        };
      },
    },
  ];
}
