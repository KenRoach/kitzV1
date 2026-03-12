/**
 * YouTube Tools — YouTube Data API v3 integration.
 *
 * Tools:
 *   1. youtube_search         — Search YouTube videos
 *   2. youtube_channel_stats  — Get channel statistics
 *   3. youtube_video_details  — Get video details
 *   4. youtube_trending        — Get trending videos in a region
 *   5. youtube_captions        — Get video captions/subtitles
 *
 * Auth: GOOGLE_ACCESS_TOKEN (OAuth) or GOOGLE_API_KEY / GOOGLE_MAPS_API_KEY (public).
 */

import { createSubsystemLogger } from 'kitz-schemas';
import type { ToolSchema } from './registry.js';

const log = createSubsystemLogger('youtubeTools');

const YT_API = 'https://www.googleapis.com/youtube/v3';

/** Build auth query param — OAuth token preferred, API key fallback. */
function getAuthParam(): { header?: Record<string, string>; query?: string } {
  const oauthToken = process.env.GOOGLE_ACCESS_TOKEN;
  if (oauthToken) {
    return { header: { Authorization: `Bearer ${oauthToken}` } };
  }
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (apiKey) {
    return { query: `key=${apiKey}` };
  }
  return {};
}

/** Make an authenticated GET request to YouTube Data API. */
async function ytFetch(path: string, params: Record<string, string>): Promise<unknown> {
  const auth = getAuthParam();
  if (!auth.header && !auth.query) {
    return { error: 'YouTube API not configured. Set GOOGLE_ACCESS_TOKEN or GOOGLE_API_KEY in env.' };
  }

  const qs = new URLSearchParams(params);
  if (auth.query) qs.append('key', (process.env.GOOGLE_API_KEY || process.env.GOOGLE_MAPS_API_KEY)!);
  const url = `${YT_API}/${path}?${qs.toString()}`;

  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      ...(auth.header || {}),
    },
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => 'unknown');
    throw new Error(`YouTube API error (${res.status}): ${errText.slice(0, 300)}`);
  }

  return res.json();
}

/** Convert ISO 8601 duration (PT1H2M3S) to human-readable string. */
function parseDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return iso;
  const h = match[1] ? `${match[1]}h ` : '';
  const m = match[2] ? `${match[2]}m ` : '';
  const s = match[3] ? `${match[3]}s` : '';
  return (h + m + s).trim() || '0s';
}

export function getAllYoutubeTools(): ToolSchema[] {
  return [
    // ── 1. Search YouTube Videos ──
    {
      name: 'youtube_search',
      description: 'Search YouTube videos by query. Returns video IDs, titles, channels, publish dates, thumbnails, and view counts.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          maxResults: { type: 'number', description: 'Max results to return (default 10, max 50)' },
          order: {
            type: 'string',
            enum: ['relevance', 'date', 'viewCount'],
            description: 'Sort order (default: relevance)',
          },
        },
        required: ['query'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        try {
          const query = String(args.query);
          const maxResults = Math.min(Number(args.maxResults) || 10, 50);
          const order = String(args.order || 'relevance');

          // Step 1: Search for videos
          const searchData = await ytFetch('search', {
            part: 'snippet',
            q: query,
            type: 'video',
            maxResults: String(maxResults),
            order,
          }) as { items?: Array<{ id: { videoId: string }; snippet: { title: string; channelTitle: string; publishedAt: string; thumbnails: { medium?: { url: string } } } }> };

          if ((searchData as { error?: string }).error) return searchData;

          const items = searchData.items || [];
          if (items.length === 0) {
            return { videos: [], message: `No videos found for "${query}".` };
          }

          // Step 2: Get view counts via videos endpoint
          const videoIds = items.map(i => i.id.videoId).join(',');
          let viewCounts: Record<string, string> = {};
          try {
            const statsData = await ytFetch('videos', {
              part: 'statistics',
              id: videoIds,
            }) as { items?: Array<{ id: string; statistics: { viewCount?: string } }> };
            for (const v of (statsData.items || [])) {
              viewCounts[v.id] = v.statistics.viewCount || '0';
            }
          } catch {
            // View counts are optional — continue without them
          }

          const videos = items.map(item => ({
            id: item.id.videoId,
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt,
            thumbnail: item.snippet.thumbnails?.medium?.url || '',
            viewCount: viewCounts[item.id.videoId] || 'N/A',
          }));

          log.info('youtube_search', { query, count: videos.length, trace_id: traceId });
          return { videos };
        } catch (err) {
          return { error: `YouTube search failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 2. Channel Statistics ──
    {
      name: 'youtube_channel_stats',
      description: 'Get YouTube channel statistics — subscribers, total views, video count, description, and thumbnail.',
      parameters: {
        type: 'object',
        properties: {
          channelId: { type: 'string', description: 'YouTube channel ID (starts with UC...)' },
          username: { type: 'string', description: 'YouTube username/handle (alternative to channelId)' },
        },
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        try {
          const channelId = args.channelId as string | undefined;
          const username = args.username as string | undefined;

          if (!channelId && !username) {
            return { error: 'Provide either channelId or username.' };
          }

          const params: Record<string, string> = {
            part: 'snippet,statistics',
          };
          if (channelId) {
            params.id = channelId;
          } else {
            params.forHandle = username!;
          }

          const data = await ytFetch('channels', params) as {
            items?: Array<{
              snippet: { title: string; description: string; thumbnails: { medium?: { url: string } } };
              statistics: { subscriberCount?: string; viewCount?: string; videoCount?: string; hiddenSubscriberCount?: boolean };
            }>;
          };

          if ((data as { error?: string }).error) return data;

          const items = data.items || [];
          if (items.length === 0) {
            return { error: 'Channel not found.' };
          }

          const ch = items[0];
          log.info('youtube_channel_stats', { channel: ch.snippet.title, trace_id: traceId });
          return {
            name: ch.snippet.title,
            subscribers: ch.statistics.hiddenSubscriberCount ? 'hidden' : (ch.statistics.subscriberCount || '0'),
            totalViews: ch.statistics.viewCount || '0',
            videoCount: ch.statistics.videoCount || '0',
            description: ch.snippet.description?.slice(0, 500) || '',
            thumbnail: ch.snippet.thumbnails?.medium?.url || '',
          };
        } catch (err) {
          return { error: `Channel stats failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 3. Video Details ──
    {
      name: 'youtube_video_details',
      description: 'Get detailed information about a YouTube video — title, description, views, likes, comments, duration, tags, and publish date.',
      parameters: {
        type: 'object',
        properties: {
          videoId: { type: 'string', description: 'YouTube video ID (11-char string from URL)' },
        },
        required: ['videoId'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        try {
          const videoId = String(args.videoId);

          const data = await ytFetch('videos', {
            part: 'snippet,statistics,contentDetails',
            id: videoId,
          }) as {
            items?: Array<{
              snippet: { title: string; description: string; publishedAt: string; tags?: string[] };
              statistics: { viewCount?: string; likeCount?: string; commentCount?: string };
              contentDetails: { duration: string };
            }>;
          };

          if ((data as { error?: string }).error) return data;

          const items = data.items || [];
          if (items.length === 0) {
            return { error: `Video "${videoId}" not found.` };
          }

          const v = items[0];
          log.info('youtube_video_details', { videoId, title: v.snippet.title, trace_id: traceId });
          return {
            title: v.snippet.title,
            description: v.snippet.description?.slice(0, 1000) || '',
            viewCount: v.statistics.viewCount || '0',
            likeCount: v.statistics.likeCount || '0',
            commentCount: v.statistics.commentCount || '0',
            duration: parseDuration(v.contentDetails.duration),
            tags: v.snippet.tags?.slice(0, 20) || [],
            publishedAt: v.snippet.publishedAt,
          };
        } catch (err) {
          return { error: `Video details failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 4. Trending Videos ──
    {
      name: 'youtube_trending',
      description: 'Get trending YouTube videos for a region. Default region: PA (Panama). Supports category filtering.',
      parameters: {
        type: 'object',
        properties: {
          regionCode: { type: 'string', description: 'ISO 3166-1 alpha-2 country code (default: PA for Panama)' },
          categoryId: { type: 'string', description: 'YouTube video category ID (e.g. 10=Music, 20=Gaming, 22=People&Blogs, 24=Entertainment, 25=News)' },
        },
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        try {
          const regionCode = String(args.regionCode || 'PA');
          const params: Record<string, string> = {
            part: 'snippet,statistics',
            chart: 'mostPopular',
            regionCode,
            maxResults: '25',
          };
          if (args.categoryId) {
            params.videoCategoryId = String(args.categoryId);
          }

          const data = await ytFetch('videos', params) as {
            items?: Array<{
              id: string;
              snippet: { title: string; channelTitle: string };
              statistics: { viewCount?: string };
            }>;
          };

          if ((data as { error?: string }).error) return data;

          const items = data.items || [];
          if (items.length === 0) {
            return { videos: [], message: `No trending videos found for region "${regionCode}".` };
          }

          const videos = items.map(item => ({
            id: item.id,
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            viewCount: item.statistics.viewCount || '0',
          }));

          log.info('youtube_trending', { regionCode, count: videos.length, trace_id: traceId });
          return { videos };
        } catch (err) {
          return { error: `Trending fetch failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 5. Video Captions ──
    {
      name: 'youtube_captions',
      description: 'Get video captions/subtitles from a YouTube video. Returns timestamped caption segments.',
      parameters: {
        type: 'object',
        properties: {
          videoId: { type: 'string', description: 'YouTube video ID' },
          language: { type: 'string', description: 'Caption language code (default: es for Spanish)' },
        },
        required: ['videoId'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        try {
          const videoId = String(args.videoId);
          const language = String(args.language || 'es');

          // Step 1: List available caption tracks
          const listData = await ytFetch('captions', {
            part: 'snippet',
            videoId,
          }) as {
            items?: Array<{
              id: string;
              snippet: { language: string; name: string; trackKind: string };
            }>;
          };

          if ((listData as { error?: string }).error) return listData;

          const tracks = listData.items || [];
          if (tracks.length === 0) {
            return { captions: [], message: 'No captions available for this video.', availableLanguages: [] };
          }

          // Find matching language track or fall back to first available
          const availableLanguages = tracks.map(t => t.snippet.language);
          let targetTrack = tracks.find(t => t.snippet.language === language);
          if (!targetTrack) {
            // Try English fallback
            targetTrack = tracks.find(t => t.snippet.language === 'en');
          }
          if (!targetTrack) {
            targetTrack = tracks[0]; // Use whatever is available
          }

          // Step 2: Try to download captions via the timedtext endpoint (public, no auth needed)
          // The captions.download API requires OAuth with the video owner scope, so we use
          // the public timedtext XML endpoint instead.
          try {
            const ttUrl = `https://www.youtube.com/api/timedtext?lang=${targetTrack.snippet.language}&v=${videoId}&fmt=srv3`;
            const ttRes = await fetch(ttUrl, { signal: AbortSignal.timeout(10_000) });

            if (ttRes.ok) {
              const xml = await ttRes.text();
              // Parse basic XML captions: <p t="startMs" d="durationMs">text</p>
              const captions: Array<{ start: string; duration: string; text: string }> = [];
              const regex = /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
              let match;
              while ((match = regex.exec(xml)) !== null) {
                const startMs = parseInt(match[1], 10);
                const durationMs = parseInt(match[2], 10);
                const text = match[3]
                  .replace(/<[^>]+>/g, '') // Strip inner XML/HTML tags
                  .replace(/&amp;/g, '&')
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>')
                  .replace(/&quot;/g, '"')
                  .replace(/&#39;/g, "'")
                  .trim();

                if (text) {
                  captions.push({
                    start: (startMs / 1000).toFixed(1),
                    duration: (durationMs / 1000).toFixed(1),
                    text,
                  });
                }
              }

              // If srv3 format didn't work, try srv1 format: <text start="s" dur="s">text</text>
              if (captions.length === 0) {
                const srv1Url = `https://www.youtube.com/api/timedtext?lang=${targetTrack.snippet.language}&v=${videoId}`;
                const srv1Res = await fetch(srv1Url, { signal: AbortSignal.timeout(10_000) });
                if (srv1Res.ok) {
                  const srv1Xml = await srv1Res.text();
                  const srv1Regex = /<text\s+start="([\d.]+)"\s+dur="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g;
                  let srv1Match;
                  while ((srv1Match = srv1Regex.exec(srv1Xml)) !== null) {
                    const text = srv1Match[3]
                      .replace(/<[^>]+>/g, '')
                      .replace(/&amp;/g, '&')
                      .replace(/&lt;/g, '<')
                      .replace(/&gt;/g, '>')
                      .replace(/&quot;/g, '"')
                      .replace(/&#39;/g, "'")
                      .trim();
                    if (text) {
                      captions.push({
                        start: srv1Match[1],
                        duration: srv1Match[2],
                        text,
                      });
                    }
                  }
                }
              }

              if (captions.length > 0) {
                log.info('youtube_captions', { videoId, language: targetTrack.snippet.language, segments: captions.length, trace_id: traceId });
                return {
                  captions,
                  language: targetTrack.snippet.language,
                  availableLanguages,
                };
              }
            }
          } catch {
            // Timedtext endpoint failed — fall through to metadata-only response
          }

          // Fallback: return track metadata without the actual text
          log.info('youtube_captions_metadata_only', { videoId, trace_id: traceId });
          return {
            captions: [],
            message: 'Caption tracks exist but could not be downloaded. The video owner may have disabled caption downloads.',
            language: targetTrack.snippet.language,
            availableLanguages,
            trackInfo: {
              id: targetTrack.id,
              language: targetTrack.snippet.language,
              name: targetTrack.snippet.name,
              kind: targetTrack.snippet.trackKind,
            },
          };
        } catch (err) {
          return { error: `Captions fetch failed: ${(err as Error).message}` };
        }
      },
    },
  ];
}
