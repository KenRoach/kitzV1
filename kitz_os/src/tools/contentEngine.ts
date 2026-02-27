/**
 * Content Engine — Shared content engine for the KITZ platform.
 *
 * 6 tools:
 *   - brand_setup      (medium) — Create/update brand kit
 *   - brand_get         (low)    — Get current brand kit
 *   - brand_update      (low)    — Partial update to brand kit
 *   - content_preview   (low)    — Get a content item by ID
 *   - content_edit      (medium) — Edit content with AI (Claude Sonnet)
 *   - content_ship      (high)   — Ship content via channel (draft-first)
 *
 * Exports shared helpers used by other tool modules:
 *   - getBrandKit()       — returns the active brand kit
 *   - storeContent()      — stores a content item
 *   - getContent()        — retrieves a content item by ID
 *   - generateContentId() — generates cnt-{timestamp36}-{random}
 *   - renderTemplate()    — {{var}} substitution
 *   - injectBrandCSS()    — wraps HTML with brand CSS
 *
 * 80/20 AUTOMATION SPLIT:
 *   - 80% automated: template rendering, brand injection, variable substitution
 *   - 20% AI agent: brand suggestion from brief, content editing, generation
 */

import type { ToolSchema } from './registry.js';

// ── Interfaces ──

export interface BrandKit {
  businessName: string;
  logo?: string;
  colors: { primary: string; secondary: string; accent: string; background: string; text: string };
  fonts: { heading: string; body: string };
  tone: 'professional' | 'casual' | 'bold' | 'elegant';
  language: 'es' | 'en';
  tagline?: string;
  socialLinks?: Record<string, string>;
  contactInfo?: { phone?: string; email?: string; address?: string };
}

export interface ContentItem {
  contentId: string;
  type: 'invoice' | 'quote' | 'deck' | 'email' | 'flyer' | 'promo' | 'landing' | 'catalog' | 'biolink' | 'document';
  html: string;
  data: Record<string, unknown>;
  status: 'draft' | 'previewing' | 'editing' | 'approved' | 'shipped' | 'archived';
  createdAt: string;
  updatedAt: string;
}

// ── In-memory stores ──

const brandKits: Map<string, BrandKit> = new Map();
const contentItems: Map<string, ContentItem> = new Map();

// ── Seed default brand kit ──

brandKits.set('default', {
  businessName: 'Mi Negocio',
  colors: { primary: '#A855F7', secondary: '#7C3AED', accent: '#F59E0B', background: '#FFFFFF', text: '#0A0A0A' },
  fonts: { heading: 'Inter', body: 'Inter' },
  tone: 'professional',
  language: 'es',
  tagline: 'Tu negocio merece infraestructura',
});

// ── Exported helpers ──

export function getBrandKit(orgId = 'default'): BrandKit {
  return brandKits.get(orgId) || brandKits.get('default')!;
}

export function storeContent(item: ContentItem): void {
  contentItems.set(item.contentId, item);
}

export function getContent(contentId: string): ContentItem | undefined {
  return contentItems.get(contentId);
}

export function generateContentId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `cnt-${ts}-${rand}`;
}

export function renderTemplate(template: string, data: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  result = result.replace(/\{\{\w+\}\}/g, '');
  return result;
}

export function injectBrandCSS(html: string, brandKit: BrandKit): string {
  const css = `<style>
:root{--brand-primary:${brandKit.colors.primary};--brand-secondary:${brandKit.colors.secondary};--brand-accent:${brandKit.colors.accent};--brand-bg:${brandKit.colors.background};--brand-text:${brandKit.colors.text};--font-heading:'${brandKit.fonts.heading}',sans-serif;--font-body:'${brandKit.fonts.body}',sans-serif}
body,.kitz-content{font-family:var(--font-body);color:var(--brand-text);background:var(--brand-bg);margin:0;padding:0}
h1,h2,h3,h4,h5,h6{font-family:var(--font-heading);color:var(--brand-primary)}
a{color:var(--brand-primary);text-decoration:none}a:hover{color:var(--brand-secondary)}
.accent{color:var(--brand-accent)}
.btn-primary{background:var(--brand-primary);color:#fff;padding:10px 24px;border-radius:8px;border:none;font-family:var(--font-body);cursor:pointer;display:inline-block}
.btn-primary:hover{background:var(--brand-secondary)}
</style>`;
  return `<!DOCTYPE html><html lang="${brandKit.language}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${brandKit.businessName}</title>${css}</head><body><div class="kitz-content">${html}</div></body></html>`;
}

// ── Tools ──

export function getAllContentEngineTools(): ToolSchema[] {
  return [
    {
      name: 'brand_setup',
      description:
        'Create or update the brand kit for this business. Sets business name, colors, fonts, tone, ' +
        'and language. Can also accept a brief string which uses AI to suggest a brand kit.',
      parameters: {
        type: 'object',
        properties: {
          businessName: { type: 'string', description: 'Business name' },
          colors: { type: 'object', description: 'Brand colors: { primary, secondary, accent, background, text }' },
          fonts: { type: 'object', description: 'Fonts: { heading, body }' },
          tone: { type: 'string', enum: ['professional', 'casual', 'bold', 'elegant'] as const },
          language: { type: 'string', enum: ['es', 'en'] as const },
          tagline: { type: 'string' },
          logo: { type: 'string' },
          socialLinks: { type: 'object', description: 'Social links map' },
          contactInfo: { type: 'object', description: '{ phone?, email?, address? }' },
          brief: { type: 'string', description: 'Describe the business — AI suggests a brand kit' },
        },
        required: ['businessName'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const businessName = String(args.businessName);
        if (args.brief) {
          try {
            const { claudeChat } = await import('../llm/claudeClient.js');
            const result = await claudeChat(
              [{ role: 'user', content: `Generate a brand kit for a LatAm small business.\nBusiness: ${businessName}\nBrief: ${args.brief}\nReturn JSON: { "colors":{"primary":"#hex","secondary":"#hex","accent":"#hex","background":"#hex","text":"#hex"}, "fonts":{"heading":"Font","body":"Font"}, "tone":"professional|casual|bold|elegant", "tagline":"short tagline in Spanish", "language":"es" }` }],
              'sonnet', traceId, 'You are KITZ brand designer. Return only valid JSON.',
            );
            try {
              const parsed = JSON.parse(result.replace(/```json?\n?/g, '').replace(/```/g, '').trim());
              const kit: BrandKit = {
                businessName,
                colors: { primary: parsed.colors?.primary || '#A855F7', secondary: parsed.colors?.secondary || '#7C3AED', accent: parsed.colors?.accent || '#F59E0B', background: parsed.colors?.background || '#FFFFFF', text: parsed.colors?.text || '#0A0A0A' },
                fonts: { heading: parsed.fonts?.heading || 'Inter', body: parsed.fonts?.body || 'Inter' },
                tone: (['professional', 'casual', 'bold', 'elegant'].includes(parsed.tone) ? parsed.tone : 'professional') as BrandKit['tone'],
                language: parsed.language === 'en' ? 'en' : 'es',
                tagline: parsed.tagline || undefined,
                logo: (args.logo as string) || undefined,
                socialLinks: (args.socialLinks as Record<string, string>) || undefined,
                contactInfo: (args.contactInfo as BrandKit['contactInfo']) || undefined,
              };
              brandKits.set('default', kit);
              return { brandKit: kit, message: `Brand kit created for "${businessName}" via AI.` };
            } catch { return { error: 'AI returned invalid JSON for brand kit.' }; }
          } catch (err) { return { error: `AI brand generation failed: ${(err as Error).message}` }; }
        }
        const existing = brandKits.get('default');
        const colorsArg = args.colors as Record<string, string> | undefined;
        const fontsArg = args.fonts as Record<string, string> | undefined;
        const kit: BrandKit = {
          businessName,
          colors: { primary: colorsArg?.primary || existing?.colors.primary || '#A855F7', secondary: colorsArg?.secondary || existing?.colors.secondary || '#7C3AED', accent: colorsArg?.accent || existing?.colors.accent || '#F59E0B', background: colorsArg?.background || existing?.colors.background || '#FFFFFF', text: colorsArg?.text || existing?.colors.text || '#0A0A0A' },
          fonts: { heading: fontsArg?.heading || existing?.fonts.heading || 'Inter', body: fontsArg?.body || existing?.fonts.body || 'Inter' },
          tone: (['professional', 'casual', 'bold', 'elegant'].includes(args.tone as string) ? args.tone : existing?.tone || 'professional') as BrandKit['tone'],
          language: (args.language === 'en' ? 'en' : 'es') as 'es' | 'en',
          tagline: (args.tagline as string) || existing?.tagline || undefined,
          logo: (args.logo as string) || existing?.logo || undefined,
          socialLinks: (args.socialLinks as Record<string, string>) || existing?.socialLinks || undefined,
          contactInfo: (args.contactInfo as BrandKit['contactInfo']) || existing?.contactInfo || undefined,
        };
        brandKits.set('default', kit);
        return { brandKit: kit, message: `Brand kit created for "${businessName}".` };
      },
    },
    {
      name: 'brand_get',
      description: 'Get the current brand kit including colors, fonts, tone, and business info.',
      parameters: { type: 'object', properties: { orgId: { type: 'string', description: 'Organization ID (default: "default")' } } },
      riskLevel: 'low',
      execute: async (args) => {
        const kit = brandKits.get((args.orgId as string) || 'default') || brandKits.get('default');
        if (!kit) return { error: 'No brand kit found. Use brand_setup to create one.' };
        return { brandKit: kit };
      },
    },
    {
      name: 'brand_update',
      description: 'Partial update to the brand kit — merges provided fields with existing kit.',
      parameters: {
        type: 'object',
        properties: {
          businessName: { type: 'string' }, colors: { type: 'object' }, fonts: { type: 'object' },
          tone: { type: 'string', enum: ['professional', 'casual', 'bold', 'elegant'] as const },
          language: { type: 'string', enum: ['es', 'en'] as const },
          tagline: { type: 'string' }, logo: { type: 'string' }, socialLinks: { type: 'object' }, contactInfo: { type: 'object' },
        },
      },
      riskLevel: 'low',
      execute: async (args) => {
        const existing = brandKits.get('default');
        if (!existing) return { error: 'No brand kit found. Use brand_setup first.' };
        const c = args.colors as Record<string, string> | undefined;
        const f = args.fonts as Record<string, string> | undefined;
        const updated: BrandKit = {
          businessName: (args.businessName as string) || existing.businessName,
          logo: (args.logo as string) ?? existing.logo,
          colors: { primary: c?.primary || existing.colors.primary, secondary: c?.secondary || existing.colors.secondary, accent: c?.accent || existing.colors.accent, background: c?.background || existing.colors.background, text: c?.text || existing.colors.text },
          fonts: { heading: f?.heading || existing.fonts.heading, body: f?.body || existing.fonts.body },
          tone: (['professional', 'casual', 'bold', 'elegant'].includes(args.tone as string) ? args.tone : existing.tone) as BrandKit['tone'],
          language: (args.language === 'en' ? 'en' : args.language === 'es' ? 'es' : existing.language) as 'es' | 'en',
          tagline: (args.tagline as string) ?? existing.tagline,
          socialLinks: args.socialLinks ? { ...existing.socialLinks, ...(args.socialLinks as Record<string, string>) } : existing.socialLinks,
          contactInfo: args.contactInfo ? { ...existing.contactInfo, ...(args.contactInfo as Record<string, string>) } : existing.contactInfo,
        };
        brandKits.set('default', updated);
        return { brandKit: updated, message: 'Brand kit updated.' };
      },
    },
    {
      name: 'content_preview',
      description: 'Get a content item by ID — returns HTML, type, data, and status for preview.',
      parameters: { type: 'object', properties: { content_id: { type: 'string', description: 'Content item ID' } }, required: ['content_id'] },
      riskLevel: 'low',
      execute: async (args) => {
        const item = contentItems.get(String(args.content_id));
        if (!item) return { error: `Content "${args.content_id}" not found.` };
        return { contentId: item.contentId, html: item.html, type: item.type, data: item.data, status: item.status };
      },
    },
    {
      name: 'content_edit',
      description: 'Edit a content item using AI — provide a natural language instruction and Claude Sonnet regenerates the HTML.',
      parameters: { type: 'object', properties: { content_id: { type: 'string' }, instruction: { type: 'string', description: 'Natural language edit instruction' } }, required: ['content_id', 'instruction'] },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const contentId = String(args.content_id);
        const instruction = String(args.instruction);
        const item = contentItems.get(contentId);
        if (!item) return { error: `Content "${contentId}" not found.` };
        const bk = getBrandKit();
        try {
          const { claudeChat } = await import('../llm/claudeClient.js');
          const result = await claudeChat(
            [{ role: 'user', content: `Edit this ${item.type} for "${bk.businessName}".\n\nCurrent HTML:\n${item.html}\n\nBrand: primary=${bk.colors.primary}, secondary=${bk.colors.secondary}, accent=${bk.colors.accent}\nEdit: ${instruction}\n\nReturn ONLY the updated HTML. No markdown fences.` }],
            'sonnet', traceId, 'You are KITZ content editor. Return only valid HTML.',
          );
          const updatedHtml = result.replace(/```html?\n?/g, '').replace(/```/g, '').trim();
          const updatedItem: ContentItem = { ...item, html: updatedHtml, status: 'editing', updatedAt: new Date().toISOString() };
          contentItems.set(contentId, updatedItem);
          return { contentId, html: updatedHtml, type: item.type, status: 'editing', message: `Content edited: "${instruction.slice(0, 80)}".` };
        } catch (err) { return { error: `AI edit failed: ${(err as Error).message}` }; }
      },
    },
    {
      name: 'content_ship',
      description: 'Ship content — marks as approved for delivery. Draft-first: does NOT actually send.',
      parameters: { type: 'object', properties: { content_id: { type: 'string' }, channel: { type: 'string', enum: ['whatsapp', 'email'] as const }, recipient: { type: 'string' } }, required: ['content_id'] },
      riskLevel: 'high',
      execute: async (args) => {
        const contentId = String(args.content_id);
        const item = contentItems.get(contentId);
        if (!item) return { error: `Content "${contentId}" not found.` };
        const updated: ContentItem = { ...item, status: 'approved', updatedAt: new Date().toISOString() };
        contentItems.set(contentId, updated);
        return { contentId, type: item.type, status: 'approved', channel: (args.channel as string) || 'pending', recipient: (args.recipient as string) || 'pending', html: item.html, draftOnly: true, message: `Content "${contentId}" approved for shipping.` };
      },
    },
  ];
}
