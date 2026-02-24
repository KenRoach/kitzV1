/**
 * Email Builder Tools — Visual rich HTML email generation.
 *
 * 3 tools:
 *   - email_buildTemplate  (high)   — AI generates responsive HTML email
 *   - email_listTemplates  (low)    — List all visual email templates
 *   - email_send           (high)   — Ship email via content_ship
 *
 * Different from mail merge (plain text templates) — these produce branded,
 * responsive HTML emails with inline CSS for email client compatibility.
 *
 * 80/20 AUTOMATION SPLIT:
 *   - 80% automated: template rendering, inline CSS, brand injection
 *   - 20% AI agent: content generation from brief
 */

import type { ToolSchema } from './registry.js';
import { getBrandKit, storeContent, getContent, generateContentId, injectBrandCSS } from './contentEngine.js';
import type { ContentItem } from './contentEngine.js';

// ── Pre-seeded email templates ──

const EMAIL_TEMPLATES: Record<string, { name: string; description: string; structure: string }> = {
  welcome: {
    name: 'Welcome Email',
    description: 'Branded header, personalized greeting, feature highlights, CTA button',
    structure: `<div style="max-width:600px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;background:#ffffff">
<div style="background:var(--brand-primary);padding:32px 24px;text-align:center">
<h1 style="color:#ffffff;margin:0;font-size:28px">{{businessName}}</h1>
<p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px">{{tagline}}</p>
</div>
<div style="padding:32px 24px">
<h2 style="color:var(--brand-text);margin:0 0 8px;font-size:24px">{{greeting}}</h2>
<p style="color:#555;font-size:16px;line-height:1.6;margin:0 0 24px">{{introText}}</p>
<div style="display:flex;flex-direction:column;gap:16px;margin-bottom:24px">{{featureBlocks}}</div>
<div style="text-align:center;margin:32px 0">
<a href="{{ctaUrl}}" style="display:inline-block;padding:14px 32px;background:var(--brand-primary);color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:16px">{{ctaText}}</a>
</div>
</div>
<div style="background:#f8f8f8;padding:20px 24px;text-align:center;font-size:12px;color:#999">
<p style="margin:0">{{businessName}} &middot; {{contactEmail}}</p>
</div>
</div>`,
  },
  'product-launch': {
    name: 'Product Launch',
    description: 'Hero image placeholder, feature grid, order CTA',
    structure: `<div style="max-width:600px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;background:#ffffff">
<div style="background:linear-gradient(135deg,var(--brand-primary),var(--brand-secondary));padding:48px 24px;text-align:center">
<p style="color:rgba(255,255,255,0.8);margin:0;font-size:14px;text-transform:uppercase;letter-spacing:2px">{{launchLabel}}</p>
<h1 style="color:#ffffff;margin:12px 0 0;font-size:32px">{{productName}}</h1>
<p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:16px">{{productTagline}}</p>
</div>
<div style="padding:32px 24px;text-align:center">
<div style="width:100%;height:200px;background:#f0f0f0;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#999;font-size:14px;margin-bottom:24px">[Product Image]</div>
<p style="color:#555;font-size:16px;line-height:1.6;margin:0 0 24px">{{description}}</p>
</div>
<div style="padding:0 24px 24px;display:flex;flex-direction:column;gap:12px">{{featureGrid}}</div>
<div style="padding:24px;text-align:center;background:var(--brand-primary)">
<a href="{{orderUrl}}" style="display:inline-block;padding:14px 40px;background:#ffffff;color:var(--brand-primary);text-decoration:none;border-radius:6px;font-weight:700;font-size:18px">{{orderCta}}</a>
<p style="color:rgba(255,255,255,0.8);margin:12px 0 0;font-size:14px">{{priceText}}</p>
</div>
<div style="padding:16px 24px;text-align:center;font-size:12px;color:#999">
<p style="margin:0">{{businessName}}</p>
</div>
</div>`,
  },
  newsletter: {
    name: 'Newsletter',
    description: 'Multi-section layout with article cards',
    structure: `<div style="max-width:600px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;background:#ffffff">
<div style="background:var(--brand-primary);padding:24px;display:flex;justify-content:space-between;align-items:center">
<h1 style="color:#ffffff;margin:0;font-size:22px">{{businessName}}</h1>
<span style="color:rgba(255,255,255,0.7);font-size:13px">{{issueDate}}</span>
</div>
<div style="padding:32px 24px">
<h2 style="color:var(--brand-text);margin:0 0 8px;font-size:22px">{{headlineTitle}}</h2>
<p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px">{{headlineIntro}}</p>
</div>
<div style="padding:0 24px 24px">{{articleCards}}</div>
<div style="padding:24px;background:var(--brand-primary);text-align:center">
<p style="color:#ffffff;margin:0 0 8px;font-size:16px">{{footerCta}}</p>
<a href="{{ctaUrl}}" style="display:inline-block;padding:10px 28px;background:#ffffff;color:var(--brand-primary);text-decoration:none;border-radius:6px;font-weight:600;font-size:14px">{{ctaText}}</a>
</div>
<div style="padding:16px 24px;text-align:center;font-size:12px;color:#999">
<p style="margin:0">{{businessName}} &middot; {{contactEmail}}</p>
<p style="margin:4px 0 0"><a href="{{unsubscribeUrl}}" style="color:#999">Cancelar suscripcion</a></p>
</div>
</div>`,
  },
};

const emailTemplates: Map<string, { contentId: string; templateKey: string; name: string; html: string; createdAt: string }> = new Map();

// ── Tools ──

const email_buildTemplate: ToolSchema = {
  name: 'email_buildTemplate',
  description: 'Generate a responsive branded HTML email from a brief. Claude Sonnet creates the content; inline CSS ensures email client compatibility. Returns contentId and HTML.',
  parameters: {
    type: 'object',
    properties: {
      brief: { type: 'string', description: 'What the email is about — purpose, audience, key message' },
      template: { type: 'string', enum: ['welcome', 'product-launch', 'newsletter'], description: 'Email template (default: welcome)' },
      subject: { type: 'string', description: 'Email subject line' },
      org_id: { type: 'string', description: 'Organization ID' },
    },
    required: ['brief'],
  },
  riskLevel: 'high',
  execute: async (params: Record<string, unknown>) => {
    try {
      const brief = params.brief as string;
      const templateKey = (params.template as string) ?? 'welcome';
      const subject = (params.subject as string) ?? '';
      const orgId = (params.org_id as string) ?? 'default';
      const brand = getBrandKit(orgId);
      const tmpl = EMAIL_TEMPLATES[templateKey];
      if (!tmpl) return { error: `Unknown template: ${templateKey}. Options: welcome, product-launch, newsletter` };

      // Use AI to fill template variables
      let filledHtml: string;
      try {
        const { claudeChat } = await import('../llm/claudeClient.js');
        const prompt = `You are an email copywriter. Fill in this HTML email template with compelling content based on the brief. Replace ALL {{variable}} placeholders with real content.

Brief: ${brief}
Subject: ${subject || '(generate one)'}
Business: ${brand.businessName}
Tagline: ${brand.tagline ?? ''}
Contact: ${brand.contactInfo?.email ?? ''}
Tone: ${brand.tone}
Language: ${brand.language === 'es' ? 'Spanish' : 'English'}

Template HTML:
${tmpl.structure}

Return ONLY the filled HTML (no markdown, no explanation). Replace every {{placeholder}} with appropriate content. For {{featureBlocks}}, {{featureGrid}}, or {{articleCards}}, generate 2-4 inline HTML blocks matching the email style.`;

        const aiResp = await claudeChat(
          [{ role: 'user', content: prompt }],
          'sonnet',
        );
        const text = aiResp;
        filledHtml = text.includes('<div') ? text : tmpl.structure;
      } catch {
        // Fallback: basic variable substitution
        filledHtml = tmpl.structure
          .replace(/\{\{businessName\}\}/g, brand.businessName)
          .replace(/\{\{tagline\}\}/g, brand.tagline ?? '')
          .replace(/\{\{contactEmail\}\}/g, brand.contactInfo?.email ?? '')
          .replace(/\{\{greeting\}\}/g, brand.language === 'es' ? 'Hola!' : 'Hello!')
          .replace(/\{\{introText\}\}/g, brief)
          .replace(/\{\{ctaText\}\}/g, brand.language === 'es' ? 'Ver mas' : 'Learn More')
          .replace(/\{\{ctaUrl\}\}/g, '#');
      }

      const html = injectBrandCSS(filledHtml, brand);
      const contentId = generateContentId();
      const now = new Date().toISOString();

      emailTemplates.set(contentId, {
        contentId, templateKey, name: `${tmpl.name} — ${subject || brief.slice(0, 40)}`,
        html, createdAt: now,
      });

      storeContent({
        contentId, type: 'email', html,
        data: { templateKey, subject, brief } as unknown as Record<string, unknown>,
        status: 'draft', createdAt: now, updatedAt: now,
      });

      return { contentId, html, template: templateKey, subject };
    } catch (err) {
      return { error: `email_buildTemplate failed: ${(err as Error).message}` };
    }
  },
};

const email_listTemplates: ToolSchema = {
  name: 'email_listTemplates',
  description: 'List all available visual email templates and previously created emails.',
  parameters: {
    type: 'object',
    properties: {
      org_id: { type: 'string', description: 'Organization ID' },
    },
    required: [],
  },
  riskLevel: 'low',
  execute: async () => {
    try {
      const available = Object.entries(EMAIL_TEMPLATES).map(([key, val]) => ({
        key, name: val.name, description: val.description,
      }));
      const created = Array.from(emailTemplates.values()).map(e => ({
        contentId: e.contentId, name: e.name, templateKey: e.templateKey, createdAt: e.createdAt,
      }));
      return { availableTemplates: available, createdEmails: created, totalCreated: created.length };
    } catch (err) {
      return { error: `email_listTemplates failed: ${(err as Error).message}` };
    }
  },
};

const email_send: ToolSchema = {
  name: 'email_send',
  description: 'Send a created email via the content shipping pipeline. Draft-first enforced — requires approval before sending.',
  parameters: {
    type: 'object',
    properties: {
      content_id: { type: 'string', description: 'Content ID of the email to send' },
      to: { type: 'string', description: 'Recipient email address' },
      subject: { type: 'string', description: 'Email subject line' },
    },
    required: ['content_id', 'to'],
  },
  riskLevel: 'high',
  execute: async (params: Record<string, unknown>) => {
    try {
      const contentId = params.content_id as string;
      const to = params.to as string;
      const subject = (params.subject as string) ?? '';
      const content = getContent(contentId);
      if (!content) return { error: `Email not found: ${contentId}` };
      if (content.type !== 'email') return { error: `Content ${contentId} is not an email (type: ${content.type})` };

      // Delegate to content_ship (draft-first)
      return {
        contentId,
        action: 'content_ship',
        channel: 'email',
        to,
        subject,
        status: 'draft',
        draftOnly: true,
        message: `Email ready to send to ${to}. Call content_ship to finalize.`,
      };
    } catch (err) {
      return { error: `email_send failed: ${(err as Error).message}` };
    }
  },
};

// ── Export ──

export function getAllEmailBuilderTools(): ToolSchema[] {
  return [email_buildTemplate, email_listTemplates, email_send];
}
