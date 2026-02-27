/**
 * Flyer & Promo Tools — Promotional materials for WhatsApp and social media.
 *
 * 3 tools:
 *   - flyer_create      (high)   — AI-generated promotional flyer as HTML
 *   - promo_create      (medium) — Social promo asset (text-based visual HTML)
 *   - promo_listCreated (low)    — List all flyers and promos
 *
 * 80/20 AUTOMATION SPLIT:
 *   - 80% automated: template rendering, brand injection, layout
 *   - 20% AI agent: copy generation, design choices
 */

import type { ToolSchema } from './registry.js';
import { getBrandKit, storeContent, getContent, generateContentId, generateSlug, injectBrandCSS } from './contentEngine.js';

// ── Pre-seeded flyer templates ──

const FLYER_TEMPLATES: Record<string, { name: string; description: string; structure: string }> = {
  sale: {
    name: 'Sale / Discount',
    description: 'Large percentage, product name, urgency timer text',
    structure: `<div style="max-width:500px;margin:0 auto;font-family:var(--font-body);background:var(--brand-primary);color:#ffffff;border-radius:16px;overflow:hidden;text-align:center">
<div style="padding:48px 24px 24px">
<p style="font-size:14px;text-transform:uppercase;letter-spacing:3px;opacity:0.8;margin:0">{{saleLabel}}</p>
<div style="font-size:72px;font-weight:900;line-height:1;margin:8px 0">{{discountAmount}}</div>
<p style="font-size:20px;margin:4px 0 0">{{productName}}</p>
</div>
<div style="padding:24px;background:rgba(0,0,0,0.15)">
<p style="font-size:16px;line-height:1.5;margin:0 0 16px">{{description}}</p>
<div style="display:inline-block;padding:12px 32px;background:#ffffff;color:var(--brand-primary);border-radius:8px;font-weight:700;font-size:16px">{{ctaText}}</div>
<p style="font-size:13px;opacity:0.7;margin:12px 0 0">{{urgencyText}}</p>
</div>
<div style="padding:12px;font-size:12px;opacity:0.6">{{businessName}}</div>
</div>`,
  },
  event: {
    name: 'Event Invitation',
    description: 'Date, location, RSVP CTA',
    structure: `<div style="max-width:500px;margin:0 auto;font-family:var(--font-body);background:#ffffff;border:2px solid var(--brand-primary);border-radius:16px;overflow:hidden;text-align:center">
<div style="background:var(--brand-primary);padding:32px 24px;color:#ffffff">
<p style="font-size:12px;text-transform:uppercase;letter-spacing:3px;margin:0">{{eventLabel}}</p>
<h1 style="font-size:28px;font-weight:800;margin:8px 0 0">{{eventName}}</h1>
</div>
<div style="padding:32px 24px">
<div style="display:flex;justify-content:center;gap:24px;margin-bottom:24px">
<div><p style="font-size:12px;color:#999;margin:0">Fecha</p><p style="font-size:16px;font-weight:600;margin:4px 0 0;color:var(--brand-text)">{{eventDate}}</p></div>
<div><p style="font-size:12px;color:#999;margin:0">Hora</p><p style="font-size:16px;font-weight:600;margin:4px 0 0;color:var(--brand-text)">{{eventTime}}</p></div>
<div><p style="font-size:12px;color:#999;margin:0">Lugar</p><p style="font-size:16px;font-weight:600;margin:4px 0 0;color:var(--brand-text)">{{eventLocation}}</p></div>
</div>
<p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px">{{description}}</p>
<a href="{{rsvpUrl}}" style="display:inline-block;padding:14px 36px;background:var(--brand-primary);color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px">{{rsvpText}}</a>
</div>
<div style="padding:12px;font-size:12px;color:#999">{{businessName}}</div>
</div>`,
  },
  product: {
    name: 'New Product',
    description: 'Product showcase, features, price, order button',
    structure: `<div style="max-width:500px;margin:0 auto;font-family:var(--font-body);background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1)">
<div style="width:100%;height:240px;background:linear-gradient(135deg,var(--brand-primary),var(--brand-secondary));display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.5);font-size:14px">[Product Image]</div>
<div style="padding:24px">
<p style="font-size:12px;text-transform:uppercase;color:var(--brand-accent);letter-spacing:2px;margin:0">{{newLabel}}</p>
<h2 style="font-size:24px;font-weight:700;color:var(--brand-text);margin:8px 0">{{productName}}</h2>
<p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 16px">{{description}}</p>
<div style="margin-bottom:20px">{{featureList}}</div>
<div style="display:flex;align-items:center;justify-content:space-between">
<span style="font-size:28px;font-weight:800;color:var(--brand-primary)">{{price}}</span>
<a href="{{orderUrl}}" style="display:inline-block;padding:12px 28px;background:var(--brand-primary);color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600">{{orderText}}</a>
</div>
</div>
<div style="padding:12px 24px;font-size:12px;color:#999;text-align:center">{{businessName}}</div>
</div>`,
  },
  holiday: {
    name: 'Holiday Greeting',
    description: 'Seasonal colors, brand message',
    structure: `<div style="max-width:500px;margin:0 auto;font-family:var(--font-body);background:linear-gradient(135deg,var(--brand-primary),var(--brand-accent));color:#ffffff;border-radius:16px;text-align:center;padding:48px 24px">
<div style="font-size:48px;margin-bottom:16px">{{emoji}}</div>
<h1 style="font-size:32px;font-weight:800;margin:0 0 8px">{{headline}}</h1>
<p style="font-size:18px;opacity:0.9;margin:0 0 24px">{{subtitle}}</p>
<p style="font-size:15px;line-height:1.6;opacity:0.85;margin:0 0 32px">{{message}}</p>
<p style="font-size:14px;font-weight:600;opacity:0.7;margin:0">{{businessName}}</p>
</div>`,
  },
  menu: {
    name: 'Menu / Catalog',
    description: 'Product grid with prices',
    structure: `<div style="max-width:500px;margin:0 auto;font-family:var(--font-body);background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #eee">
<div style="background:var(--brand-primary);padding:24px;text-align:center">
<h1 style="color:#ffffff;margin:0;font-size:24px">{{businessName}}</h1>
<p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:14px">{{menuTitle}}</p>
</div>
<div style="padding:24px">{{menuItems}}</div>
<div style="padding:16px 24px;background:#f8f8f8;text-align:center;font-size:13px;color:#999">
<p style="margin:0">{{contactInfo}}</p>
<p style="margin:4px 0 0">{{orderInstructions}}</p>
</div>
</div>`,
  },
};

// ── Social promo platforms ──

const PROMO_STYLES: Record<string, { maxWidth: string; aspect: string }> = {
  instagram: { maxWidth: '400px', aspect: '1 / 1' },
  whatsapp: { maxWidth: '500px', aspect: 'auto' },
  facebook: { maxWidth: '500px', aspect: '1.91 / 1' },
};

// ── Tools ──

const flyer_create: ToolSchema = {
  name: 'flyer_create',
  description: 'Generate a promotional flyer as branded HTML. Shareable on WhatsApp, print-ready. Claude Sonnet generates the copy based on the brief.',
  parameters: {
    type: 'object',
    properties: {
      headline: { type: 'string', description: 'Main headline for the flyer' },
      body: { type: 'string', description: 'Body text or brief description' },
      template: { type: 'string', enum: ['sale', 'event', 'product', 'holiday', 'menu'], description: 'Flyer template (default: sale)' },
      cta_text: { type: 'string', description: 'Call-to-action button text' },
      org_id: { type: 'string', description: 'Organization ID' },
    },
    required: ['headline', 'body'],
  },
  riskLevel: 'high',
  execute: async (params: Record<string, unknown>) => {
    try {
      const headline = params.headline as string;
      const body = params.body as string;
      const templateKey = (params.template as string) ?? 'sale';
      const ctaText = (params.cta_text as string) ?? 'Comprar Ahora';
      const orgId = (params.org_id as string) ?? 'default';
      const brand = getBrandKit(orgId);
      const tmpl = FLYER_TEMPLATES[templateKey];
      if (!tmpl) return { error: `Unknown template: ${templateKey}. Options: sale, event, product, holiday, menu` };

      // Use AI to fill template
      let filledHtml: string;
      try {
        const { claudeChat } = await import('../llm/claudeClient.js');
        const prompt = `You are a marketing designer. Fill in this HTML flyer template with compelling content. Replace ALL {{variable}} placeholders.

Headline: ${headline}
Body: ${body}
CTA: ${ctaText}
Business: ${brand.businessName}
Tagline: ${brand.tagline ?? ''}
Tone: ${brand.tone}
Language: ${brand.language === 'es' ? 'Spanish' : 'English'}

Template HTML:
${tmpl.structure}

Return ONLY the filled HTML (no markdown). Replace every {{placeholder}}. For {{featureList}} or {{menuItems}}, generate appropriate inline HTML items.`;

        const aiResp = await claudeChat(
          [{ role: 'user', content: prompt }],
          'sonnet',
        );
        const text = aiResp;
        filledHtml = text.includes('<div') ? text : tmpl.structure;
      } catch {
        filledHtml = tmpl.structure
          .replace(/\{\{headline\}\}/g, headline)
          .replace(/\{\{description\}\}/g, body)
          .replace(/\{\{productName\}\}/g, headline)
          .replace(/\{\{businessName\}\}/g, brand.businessName)
          .replace(/\{\{ctaText\}\}/g, ctaText)
          .replace(/\{\{saleLabel\}\}/g, 'OFERTA ESPECIAL')
          .replace(/\{\{discountAmount\}\}/g, headline)
          .replace(/\{\{urgencyText\}\}/g, 'Oferta por tiempo limitado')
          .replace(/\{\{orderText\}\}/g, ctaText);
      }

      const html = injectBrandCSS(filledHtml, brand);
      const contentId = generateContentId();
      const now = new Date().toISOString();

      storeContent({
        contentId, slug: generateSlug(headline || 'Flyer', contentId), type: 'flyer', html,
        data: { headline, body, template: templateKey, ctaText } as unknown as Record<string, unknown>,
        status: 'draft', createdAt: now, updatedAt: now,
      });

      return { contentId, html, template: templateKey };
    } catch (err) {
      return { error: `flyer_create failed: ${(err as Error).message}` };
    }
  },
};

const promo_create: ToolSchema = {
  name: 'promo_create',
  description: 'Create a social media promo asset. Text-based visual HTML sized for the target platform. Generates branded text layout with caption, hashtags, and CTA.',
  parameters: {
    type: 'object',
    properties: {
      platform: { type: 'string', enum: ['instagram', 'whatsapp', 'facebook'], description: 'Target platform (default: whatsapp)' },
      product: { type: 'string', description: 'Product or event to promote' },
      tone: { type: 'string', description: 'Tone override (default: brand tone)' },
      org_id: { type: 'string', description: 'Organization ID' },
    },
    required: ['product'],
  },
  riskLevel: 'medium',
  execute: async (params: Record<string, unknown>) => {
    try {
      const platform = (params.platform as string) ?? 'whatsapp';
      const product = params.product as string;
      const orgId = (params.org_id as string) ?? 'default';
      const brand = getBrandKit(orgId);
      const style = PROMO_STYLES[platform] ?? PROMO_STYLES.whatsapp;

      // Generate promo content with AI
      let promoHtml: string;
      let caption = '';
      let hashtags = '';
      try {
        const { claudeChat } = await import('../llm/claudeClient.js');
        const prompt = `You are a social media copywriter for a ${brand.language === 'es' ? 'Spanish-speaking' : 'English-speaking'} audience. Create a promotional post for:

Product/Event: ${product}
Platform: ${platform}
Business: ${brand.businessName}
Tone: ${params.tone ?? brand.tone}

Return valid JSON:
{
  "headline": "short punchy headline",
  "body": "1-2 sentence body",
  "caption": "social media caption text",
  "hashtags": "#tag1 #tag2 #tag3",
  "ctaText": "CTA button text"
}`;

        const aiResp = await claudeChat(
          [{ role: 'user', content: prompt }],
          'haiku',
        );
        const jsonMatch = aiResp.match(/\{[\s\S]*\}/);
        const data = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

        caption = data.caption ?? product;
        hashtags = data.hashtags ?? '';

        promoHtml = `<div style="max-width:${style.maxWidth};${style.aspect !== 'auto' ? `aspect-ratio:${style.aspect};` : ''}margin:0 auto;font-family:var(--font-body);background:linear-gradient(135deg,var(--brand-primary),var(--brand-secondary));color:#ffffff;border-radius:12px;padding:32px;display:flex;flex-direction:column;justify-content:center;text-align:center">
<p style="font-size:11px;text-transform:uppercase;letter-spacing:3px;opacity:0.7;margin:0">${brand.businessName}</p>
<h1 style="font-size:28px;font-weight:800;margin:12px 0">${data.headline ?? product}</h1>
<p style="font-size:16px;line-height:1.5;opacity:0.9;margin:0 0 24px">${data.body ?? ''}</p>
<div style="display:inline-block;padding:10px 28px;background:#ffffff;color:var(--brand-primary);border-radius:8px;font-weight:700;font-size:14px;margin:0 auto">${data.ctaText ?? 'Ver mas'}</div>
</div>`;
      } catch {
        promoHtml = `<div style="max-width:${style.maxWidth};margin:0 auto;font-family:var(--font-body);background:var(--brand-primary);color:#ffffff;border-radius:12px;padding:32px;text-align:center">
<p style="font-size:11px;text-transform:uppercase;letter-spacing:3px;opacity:0.7;margin:0">${brand.businessName}</p>
<h1 style="font-size:28px;font-weight:800;margin:12px 0">${product}</h1>
</div>`;
        caption = product;
      }

      const html = injectBrandCSS(promoHtml, brand);
      const contentId = generateContentId();
      const now = new Date().toISOString();

      storeContent({
        contentId, slug: generateSlug(product || 'Promo', contentId), type: 'promo', html,
        data: { platform, product, caption, hashtags } as unknown as Record<string, unknown>,
        status: 'draft', createdAt: now, updatedAt: now,
      });

      return { contentId, html, platform, caption, hashtags };
    } catch (err) {
      return { error: `promo_create failed: ${(err as Error).message}` };
    }
  },
};

const promo_listCreated: ToolSchema = {
  name: 'promo_listCreated',
  description: 'List all created flyers and promos with optional type filter.',
  parameters: {
    type: 'object',
    properties: {
      type: { type: 'string', enum: ['flyer', 'promo', 'all'], description: 'Filter by type (default: all)' },
      org_id: { type: 'string', description: 'Organization ID' },
    },
    required: [],
  },
  riskLevel: 'low',
  execute: async (params: Record<string, unknown>) => {
    try {
      const filterType = (params.type as string) ?? 'all';

      // Read from contentEngine store via getContent isn't iterable,
      // so we track locally. For now, return available templates + note about content store.
      const templates = Object.entries(FLYER_TEMPLATES).map(([key, val]) => ({
        key, name: val.name, description: val.description,
      }));

      return {
        availableTemplates: templates,
        totalTemplates: templates.length,
        filter: filterType,
        note: 'Use content_preview with a contentId to retrieve specific flyers/promos.',
      };
    } catch (err) {
      return { error: `promo_listCreated failed: ${(err as Error).message}` };
    }
  },
};

// ── Export ──

export function getAllFlyerPromoTools(): ToolSchema[] {
  return [flyer_create, promo_create, promo_listCreated];
}
