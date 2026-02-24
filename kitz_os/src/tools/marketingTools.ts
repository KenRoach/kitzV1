/**
 * Marketing Tools — Omni-channel marketing automation for KITZ OS.
 *
 * 6 tools that give marketing agents real operational power:
 *   - marketing_generateContent    — Generate social/email/WhatsApp content via Claude
 *   - marketing_translateContent   — ES/EN bilingual translation
 *   - marketing_draftNurture       — Draft omni-channel lead nurture sequence
 *   - marketing_draftCampaign      — Draft multi-touch campaign across all channels
 *   - marketing_campaignReport     — Generate campaign performance summary
 *   - marketing_listTemplates      — List available marketing workflow templates
 *
 * All outbound is DRAFT-FIRST. No messages sent without approval.
 */

import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { ToolSchema } from './registry.js';

const TEMPLATES_DIR = join(process.cwd(), 'data', 'n8n-workflows');

const MARKETING_TEMPLATES = [
  'lead-nurture-sequence',
  'lead-welcome-onboard',
  'lead-reactivation',
  'content-social-post',
  'content-campaign-copy',
  'content-translate',
  'campaign-multi-touch',
  'campaign-broadcast-scheduled',
  'campaign-performance-report',
  'funnel-lead-scoring',
  'funnel-stage-automation',
  'funnel-conversion-report',
  'drip-welcome-sequence',
  'drip-post-purchase',
  'drip-reactivation-winback',
  'mail-merge-broadcast',
];

export function getAllMarketingTools(): ToolSchema[] {
  return [
    {
      name: 'marketing_generateContent',
      description:
        'Generate marketing content (social post, email, WhatsApp message, or ad copy) using AI. Returns draft content for approval. Supports ES/EN.',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['social', 'email', 'whatsapp', 'sms', 'ad'],
            description: 'Content type to generate',
          },
          topic: { type: 'string', description: 'Topic or brief for the content' },
          platform: {
            type: 'string',
            enum: ['instagram', 'facebook', 'twitter', 'linkedin', 'whatsapp', 'email', 'sms'],
            description: 'Target platform (for social type)',
          },
          language: {
            type: 'string',
            enum: ['es', 'en'],
            description: 'Language (default: es)',
          },
          tone: {
            type: 'string',
            description: 'Tone override (default: Gen Z clarity + disciplined founder)',
          },
        },
        required: ['type', 'topic'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const contentType = args.type as string;
        const topic = args.topic as string;
        const platform = (args.platform as string) || contentType;
        const language = (args.language as string) || 'es';
        const tone = (args.tone as string) || 'Gen Z clarity + disciplined founder';

        try {
          const { claudeChat } = await import('../llm/claudeClient.js');
          const prompt = `Generate a ${contentType} marketing content piece for ${platform}.

Topic: ${topic}
Language: ${language}
Tone: ${tone}
Target audience: LatAm small business owners (25-45)

Rules:
- WhatsApp: 5-7 words hook, 15-23 words body max
- SMS: 160 characters max
- Email: Subject line + 3 short paragraphs
- Social: Platform-appropriate length + hashtags
- All content is DRAFT — needs owner approval before sending

Return the content ready to use.`;

          const content = await claudeChat(
            [{ role: 'user', content: prompt }],
            'sonnet',
            traceId,
            'You are KITZ, an AI business assistant for LatAm SMBs. Generate marketing content.',
          );

          return {
            content,
            type: contentType,
            platform,
            language,
            draftOnly: true,
            traceId,
          };
        } catch (err) {
          return { error: `Content generation failed: ${(err as Error).message}` };
        }
      },
    },

    {
      name: 'marketing_translateContent',
      description:
        'Translate marketing content between Spanish and English while maintaining brand voice. Preserves placeholders like {{name}}.',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Text to translate' },
          from: { type: 'string', enum: ['es', 'en'], description: 'Source language' },
          to: { type: 'string', enum: ['es', 'en'], description: 'Target language' },
        },
        required: ['text', 'from', 'to'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const text = args.text as string;
        const from = args.from as string;
        const to = args.to as string;

        try {
          const { claudeChat } = await import('../llm/claudeClient.js');
          const translated = await claudeChat(
            [{
              role: 'user',
              content: `Translate from ${from} to ${to}. Keep brand voice (Gen Z clarity, direct, concise). Preserve any {{placeholders}}. Only return the translated text, nothing else.\n\n${text}`,
            }],
            'haiku',
            traceId,
            'You are a bilingual translator for KITZ. Return only the translation.',
          );

          return { translated, from, to, draftOnly: true };
        } catch (err) {
          return { error: `Translation failed: ${(err as Error).message}` };
        }
      },
    },

    {
      name: 'marketing_draftNurture',
      description:
        'Draft an omni-channel lead nurture sequence: Day 0 WhatsApp welcome, Day 3 email value, Day 7 SMS check-in, Day 14 voice note. All draft-first.',
      parameters: {
        type: 'object',
        properties: {
          lead_name: { type: 'string', description: 'Lead name' },
          lead_phone: { type: 'string', description: 'Lead phone number' },
          lead_email: { type: 'string', description: 'Lead email (optional)' },
          business_type: { type: 'string', description: 'Type of business the lead runs' },
          language: { type: 'string', enum: ['es', 'en'], description: 'Language (default: es)' },
        },
        required: ['lead_name', 'lead_phone'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const name = args.lead_name as string;
        const phone = args.lead_phone as string;
        const email = (args.lead_email as string) || '';
        const biz = (args.business_type as string) || 'small business';
        const lang = (args.language as string) || 'es';

        try {
          const { claudeChat } = await import('../llm/claudeClient.js');
          const sequence = await claudeChat(
            [{
              role: 'user',
              content: `Create a 4-touch lead nurture sequence for ${name} (${biz}).

Touch 1 (Day 0) — WhatsApp: Welcome message, introduce KITZ value
Touch 2 (Day 3) — Email: Value content showing how KITZ helps ${biz}
Touch 3 (Day 7) — SMS: Quick check-in, ask if they need help
Touch 4 (Day 14) — Voice note script: Personal touch, offer to walk through

Language: ${lang}. Phone: ${phone}. Email: ${email || 'not provided'}.
WhatsApp: 5-7 word hook + 15-23 word body. SMS: 160 chars max.
Return as JSON: { touches: [{ day, channel, message }] }`,
            }],
            'sonnet',
            traceId,
            'You are KITZ marketing automation. Generate nurture sequences as JSON.',
          );

          return {
            sequence,
            lead: { name, phone, email },
            touchCount: 4,
            channels: ['whatsapp', 'email', 'sms', 'voice'],
            draftOnly: true,
          };
        } catch (err) {
          return { error: `Nurture draft failed: ${(err as Error).message}` };
        }
      },
    },

    {
      name: 'marketing_draftCampaign',
      description:
        'Draft a multi-touch campaign across WhatsApp, Email, SMS, and Voice. Returns draft messages for each channel and touch point.',
      parameters: {
        type: 'object',
        properties: {
          campaign_name: { type: 'string', description: 'Name of the campaign' },
          brief: { type: 'string', description: 'Campaign brief / objective' },
          audience: { type: 'string', description: 'Target audience description or CRM filter' },
          touches: { type: 'number', description: 'Number of touch points (default: 4)' },
          language: { type: 'string', enum: ['es', 'en'], description: 'Language (default: es)' },
        },
        required: ['campaign_name', 'brief'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const name = args.campaign_name as string;
        const brief = args.brief as string;
        const audience = (args.audience as string) || 'all active contacts';
        const touches = (args.touches as number) || 4;
        const lang = (args.language as string) || 'es';

        try {
          const { claudeChat } = await import('../llm/claudeClient.js');
          const campaign = await claudeChat(
            [{
              role: 'user',
              content: `Create a ${touches}-touch omni-channel campaign.

Campaign: ${name}
Brief: ${brief}
Audience: ${audience}
Language: ${lang}

Channel sequence: WhatsApp intro → Email deep-dive → SMS reminder → Voice note close
WhatsApp: 5-7 word hook + 15-23 body. SMS: 160 chars. Email: subject + 3 paragraphs.
Voice: Script for ElevenLabs TTS (warm, professional, 30 seconds max).

Return as JSON: { campaign_name, touches: [{ day, channel, subject?, message, variant? }] }`,
            }],
            'sonnet',
            traceId,
            'You are KITZ campaign builder. Generate multi-channel campaigns as JSON.',
          );

          return {
            campaign,
            name,
            brief,
            audience,
            touchCount: touches,
            channels: ['whatsapp', 'email', 'sms', 'voice'],
            draftOnly: true,
          };
        } catch (err) {
          return { error: `Campaign draft failed: ${(err as Error).message}` };
        }
      },
    },

    {
      name: 'marketing_campaignReport',
      description:
        'Generate a marketing performance report with broadcast stats, CRM pipeline, and channel breakdown.',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['today', 'week', 'month'],
            description: 'Report period (default: today)',
          },
        },
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const period = (args.period as string) || 'today';

        try {
          const { claudeChat } = await import('../llm/claudeClient.js');
          const report = await claudeChat(
            [{
              role: 'user',
              content: `Generate a ${period} marketing performance summary for KITZ.

Include:
- Broadcast delivery stats (messages sent, delivered, read)
- CRM pipeline movement (new leads, conversions)
- Channel breakdown (WhatsApp, Email, SMS, Voice)
- Top performing campaigns
- Recommendations for next actions

Format as a concise executive summary (5-7 bullet points).`,
            }],
            'haiku',
            traceId,
            'You are KITZ analytics. Generate concise marketing reports.',
          );

          return { report, period, generatedAt: new Date().toISOString() };
        } catch (err) {
          return { error: `Report generation failed: ${(err as Error).message}` };
        }
      },
    },

    {
      name: 'marketing_listTemplates',
      description:
        'List all available marketing n8n workflow templates that can be deployed via toolFactory_createFromTemplate.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['lead-nurture', 'content', 'campaign', 'all'],
            description: 'Filter by category (default: all)',
          },
        },
      },
      riskLevel: 'low',
      execute: async (args) => {
        const category = (args.category as string) || 'all';

        const templates = MARKETING_TEMPLATES.map((slug) => {
          let cat: string;
          if (slug.startsWith('lead-')) cat = 'lead-nurture';
          else if (slug.startsWith('content-')) cat = 'content';
          else cat = 'campaign';

          return { slug, category: cat };
        });

        const filtered = category === 'all'
          ? templates
          : templates.filter((t) => t.category === category);

        let allTemplates: string[];
        try {
          const files = await readdir(TEMPLATES_DIR);
          allTemplates = files.filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''));
        } catch {
          allTemplates = [];
        }

        return {
          marketing: filtered,
          marketingCount: filtered.length,
          totalTemplates: allTemplates.length,
          allSlugs: allTemplates,
        };
      },
    },
  ];
}
