/**
 * Deck / Presentation Tools — AI-generated pitch decks and presentations.
 *
 * 2 tools:
 *   - deck_create  (high)   — Generate branded slide deck from brief
 *   - deck_export  (medium) — Combine slides into print-ready HTML
 *
 * 80/20 AUTOMATION SPLIT:
 *   - 80% automated: template structure, brand injection, page-break CSS
 *   - 20% AI agent: content generation per slide from brief
 */

import type { ToolSchema } from './registry.js';
import { getBrandKit, storeContent, getContent, generateContentId, injectBrandCSS } from './contentEngine.js';

// ── Interfaces ──

interface SlideSpec {
  title: string;
  type: 'title' | 'content' | 'stats' | 'comparison' | 'quote' | 'cta';
  bullets?: string[];
  stats?: Array<{ label: string; value: string }>;
  leftColumn?: string[];
  rightColumn?: string[];
  quoteText?: string;
  attribution?: string;
  ctaText?: string;
}

interface DeckData {
  deckId: string;
  template: string;
  slideCount: number;
  slides: SlideSpec[];
  brief: string;
  createdAt: string;
}

const decks: Map<string, DeckData> = new Map();

// ── Pre-seeded template structures ──

const DECK_TEMPLATES: Record<string, SlideSpec[]> = {
  'investor-pitch': [
    { title: 'Company Name', type: 'title' },
    { title: 'The Problem', type: 'content', bullets: ['Pain point 1', 'Pain point 2', 'Pain point 3'] },
    { title: 'Our Solution', type: 'content', bullets: ['How we solve it', 'Key differentiator', 'Why now'] },
    { title: 'Market Size', type: 'stats', stats: [{ label: 'TAM', value: '$X B' }, { label: 'SAM', value: '$X M' }, { label: 'SOM', value: '$X M' }] },
    { title: 'The Product', type: 'content', bullets: ['Feature 1', 'Feature 2', 'Feature 3'] },
    { title: 'Traction', type: 'stats', stats: [{ label: 'Users', value: 'X' }, { label: 'MRR', value: '$X' }, { label: 'Growth', value: 'X%' }] },
    { title: 'Business Model', type: 'content', bullets: ['Revenue stream 1', 'Revenue stream 2', 'Pricing strategy'] },
    { title: 'The Team', type: 'content', bullets: ['Founder 1 — Role', 'Founder 2 — Role', 'Key hires'] },
    { title: 'Financials', type: 'stats', stats: [{ label: 'Revenue', value: '$X' }, { label: 'Burn Rate', value: '$X/mo' }, { label: 'Runway', value: 'X mo' }] },
    { title: 'The Ask', type: 'cta', ctaText: 'Contact us to invest' },
  ],
  'sales-proposal': [
    { title: 'Proposal', type: 'title' },
    { title: 'Your Challenge', type: 'content', bullets: ['Challenge 1', 'Challenge 2'] },
    { title: 'Our Approach', type: 'content', bullets: ['Step 1', 'Step 2', 'Step 3'] },
    { title: 'Key Features', type: 'comparison', leftColumn: ['Feature A', 'Feature B'], rightColumn: ['Benefit A', 'Benefit B'] },
    { title: 'Pricing', type: 'stats', stats: [{ label: 'Basic', value: '$X/mo' }, { label: 'Pro', value: '$X/mo' }] },
    { title: 'Timeline', type: 'content', bullets: ['Week 1-2: Discovery', 'Week 3-4: Implementation', 'Week 5: Launch'] },
    { title: 'What Our Clients Say', type: 'quote', quoteText: 'Testimonial here', attribution: 'Client Name' },
    { title: 'Next Steps', type: 'cta', ctaText: 'Schedule a call' },
  ],
  'business-overview': [
    { title: 'Business Name', type: 'title' },
    { title: 'About Us', type: 'content', bullets: ['Mission', 'Founded', 'Team size'] },
    { title: 'Our Services', type: 'content', bullets: ['Service 1', 'Service 2', 'Service 3'] },
    { title: 'Portfolio', type: 'stats', stats: [{ label: 'Projects', value: 'X+' }, { label: 'Clients', value: 'X+' }, { label: 'Years', value: 'X' }] },
    { title: 'Our Team', type: 'content', bullets: ['Team member 1', 'Team member 2'] },
    { title: 'Contact Us', type: 'cta', ctaText: 'Get in touch' },
  ],
};

// ── Slide HTML generators ──

function slideWrapper(inner: string, brand: ReturnType<typeof getBrandKit>, slideNum: number, total: number): string {
  return `<div style="width:100%;min-height:600px;padding:48px 56px;box-sizing:border-box;font-family:var(--font-body);background:var(--brand-bg);color:var(--brand-text);page-break-after:always;position:relative">
${inner}
<div style="position:absolute;bottom:16px;right:24px;font-size:11px;color:#aaa">${brand.businessName} &middot; ${slideNum}/${total}</div>
</div>`;
}

function renderSlide(spec: SlideSpec, brand: ReturnType<typeof getBrandKit>, idx: number, total: number): string {
  let inner = '';

  switch (spec.type) {
    case 'title':
      inner = `<div style="display:flex;flex-direction:column;justify-content:center;align-items:center;min-height:500px;text-align:center">
<h1 style="font-size:44px;font-weight:800;color:var(--brand-primary);margin:0">${spec.title}</h1>
${brand.tagline ? `<p style="font-size:20px;color:var(--brand-secondary);margin:12px 0 0">${brand.tagline}</p>` : ''}
<p style="font-size:14px;color:#999;margin:24px 0 0">${brand.businessName}</p>
</div>`;
      break;

    case 'content':
      inner = `<h2 style="font-size:32px;font-weight:700;color:var(--brand-primary);margin:0 0 24px">${spec.title}</h2>
<ul style="list-style:none;padding:0;margin:0">
${(spec.bullets ?? []).map(b => `<li style="padding:10px 0;font-size:18px;border-bottom:1px solid #f0f0f0;padding-left:16px;position:relative"><span style="position:absolute;left:0;color:var(--brand-accent)">&bull;</span>${b}</li>`).join('\n')}
</ul>`;
      break;

    case 'stats':
      inner = `<h2 style="font-size:32px;font-weight:700;color:var(--brand-primary);margin:0 0 32px">${spec.title}</h2>
<div style="display:flex;gap:24px;flex-wrap:wrap">
${(spec.stats ?? []).map(s => `<div style="flex:1;min-width:150px;text-align:center;padding:24px;border-radius:12px;background:var(--brand-primary);color:#fff">
<div style="font-size:36px;font-weight:800">${s.value}</div>
<div style="font-size:14px;opacity:0.8;margin-top:4px">${s.label}</div>
</div>`).join('\n')}
</div>`;
      break;

    case 'comparison':
      inner = `<h2 style="font-size:32px;font-weight:700;color:var(--brand-primary);margin:0 0 24px">${spec.title}</h2>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
<div><h3 style="color:var(--brand-secondary);margin:0 0 12px">Features</h3>
${(spec.leftColumn ?? []).map(l => `<p style="padding:8px 0;border-bottom:1px solid #eee;margin:0">${l}</p>`).join('\n')}
</div>
<div><h3 style="color:var(--brand-accent);margin:0 0 12px">Benefits</h3>
${(spec.rightColumn ?? []).map(r => `<p style="padding:8px 0;border-bottom:1px solid #eee;margin:0">${r}</p>`).join('\n')}
</div>
</div>`;
      break;

    case 'quote':
      inner = `<div style="display:flex;flex-direction:column;justify-content:center;min-height:400px;text-align:center;padding:0 40px">
<div style="font-size:64px;color:var(--brand-primary);line-height:1">&ldquo;</div>
<p style="font-size:24px;font-style:italic;color:var(--brand-text);margin:0">${spec.quoteText ?? ''}</p>
<p style="font-size:16px;color:var(--brand-secondary);margin:16px 0 0">&mdash; ${spec.attribution ?? ''}</p>
</div>`;
      break;

    case 'cta':
      inner = `<div style="display:flex;flex-direction:column;justify-content:center;align-items:center;min-height:400px;text-align:center">
<h2 style="font-size:36px;font-weight:700;color:var(--brand-primary);margin:0 0 16px">${spec.title}</h2>
<div style="display:inline-block;padding:14px 36px;background:var(--brand-primary);color:#fff;border-radius:8px;font-size:18px;font-weight:600">${spec.ctaText ?? 'Get Started'}</div>
${brand.contactInfo?.email ? `<p style="font-size:14px;color:#999;margin:20px 0 0">${brand.contactInfo.email}</p>` : ''}
${brand.contactInfo?.phone ? `<p style="font-size:14px;color:#999;margin:4px 0 0">${brand.contactInfo.phone}</p>` : ''}
</div>`;
      break;
  }

  return slideWrapper(inner, brand, idx + 1, total);
}

// ── Tools ──

const deck_create: ToolSchema = {
  name: 'deck_create',
  description: 'Generate a branded slide deck from a brief. Claude Sonnet fills slide content based on the brief and template structure. Returns HTML document with branded slides.',
  parameters: {
    type: 'object',
    properties: {
      brief: { type: 'string', description: 'Description of the deck purpose and content' },
      template: { type: 'string', enum: ['investor-pitch', 'sales-proposal', 'business-overview'], description: 'Deck template (default: business-overview)' },
      slide_count: { type: 'number', description: 'Optional override for number of slides' },
      org_id: { type: 'string', description: 'Organization ID' },
    },
    required: ['brief'],
  },
  riskLevel: 'high',
  execute: async (params: Record<string, unknown>) => {
    try {
      const brief = params.brief as string;
      const templateKey = (params.template as string) ?? 'business-overview';
      const orgId = (params.org_id as string) ?? 'default';
      const brand = getBrandKit(orgId);
      const templateSlides = DECK_TEMPLATES[templateKey];
      if (!templateSlides) return { error: `Unknown template: ${templateKey}. Options: investor-pitch, sales-proposal, business-overview` };

      // Use AI to fill slide content from brief
      let filledSlides: SlideSpec[];
      try {
        const { claudeChat } = await import('../llm/claudeClient.js');
        const prompt = `You are a presentation designer. Given this brief and slide structure, fill in the slide content with real, compelling text based on the brief. Return valid JSON array of slides.

Brief: ${brief}

Template structure (fill in the placeholder content):
${JSON.stringify(templateSlides, null, 2)}

Return ONLY a valid JSON array of slides matching the same structure. Keep type and structure, replace placeholder text with brief-relevant content. Use Spanish if the brief is in Spanish.`;

        const aiResp = await claudeChat(
          [{ role: 'user', content: prompt }],
          'sonnet',
        );
        const text = aiResp;
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        filledSlides = jsonMatch ? JSON.parse(jsonMatch[0]) : templateSlides;
      } catch {
        filledSlides = templateSlides;
      }

      // Apply slide count override
      const count = (params.slide_count as number) ?? filledSlides.length;
      const slides = filledSlides.slice(0, count);

      // Render slides to HTML
      const slidesHtml = slides.map((s, i) => renderSlide(s, brand, i, slides.length)).join('\n');
      const html = injectBrandCSS(`<div style="max-width:960px;margin:0 auto">${slidesHtml}</div>`, brand);

      // Store
      const contentId = generateContentId();
      const deckData: DeckData = {
        deckId: contentId,
        template: templateKey,
        slideCount: slides.length,
        slides,
        brief,
        createdAt: new Date().toISOString(),
      };
      decks.set(contentId, deckData);
      storeContent({
        contentId, type: 'deck', html,
        data: deckData as unknown as Record<string, unknown>,
        status: 'draft',
        createdAt: deckData.createdAt,
        updatedAt: deckData.createdAt,
      });

      return { contentId, html, slideCount: slides.length, template: templateKey };
    } catch (err) {
      return { error: `deck_create failed: ${(err as Error).message}` };
    }
  },
};

const deck_export: ToolSchema = {
  name: 'deck_export',
  description: 'Export a deck as a single print-ready HTML document with @media print page breaks. Ready for browser print-to-PDF.',
  parameters: {
    type: 'object',
    properties: {
      content_id: { type: 'string', description: 'Content ID of the deck' },
    },
    required: ['content_id'],
  },
  riskLevel: 'medium',
  execute: async (params: Record<string, unknown>) => {
    try {
      const contentId = params.content_id as string;
      const content = getContent(contentId);
      if (!content) return { error: `Deck not found: ${contentId}` };
      if (content.type !== 'deck') return { error: `Content ${contentId} is not a deck (type: ${content.type})` };

      const printCss = `<style>
@media print {
  body { margin: 0; padding: 0; }
  div[style*="page-break-after"] { page-break-after: always; min-height: 100vh; }
}
@page { size: landscape; margin: 0; }
</style>`;

      const deckData = content.data as unknown as DeckData;
      const exportHtml = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Deck — ${deckData?.brief?.slice(0, 50) ?? 'Presentation'}</title>
${printCss}
</head>
<body style="margin:0;padding:0;background:#f5f5f5">${content.html}</body>
</html>`;

      return { contentId, html: exportHtml, format: 'html-print-ready', slideCount: deckData?.slideCount };
    } catch (err) {
      return { error: `deck_export failed: ${(err as Error).message}` };
    }
  },
};

// ── Export ──

export function getAllDeckTools(): ToolSchema[] {
  return [deck_create, deck_export];
}
