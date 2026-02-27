/**
 * Website / Landing Page Tools — Landing pages, product catalogs, bio links.
 *
 * 4 tools:
 *   - website_createLanding  (high)   — AI landing page from brief
 *   - website_createCatalog  (high)   — Product catalog with WhatsApp order buttons
 *   - website_createBioLink  (medium) — Link-in-bio page (Linktree-style)
 *   - website_export         (medium) — Export as standalone HTML
 *
 * 80/20 AUTOMATION SPLIT:
 *   - 80% automated: template rendering, brand injection, responsive CSS
 *   - 20% AI agent: section content generation, copy, layout choices
 */

import type { ToolSchema } from './registry.js';
import { getBrandKit, storeContent, getContent, generateContentId, generateSlug, injectBrandCSS } from './contentEngine.js';

// ── Pre-seeded templates ──

const LANDING_SECTIONS = {
  hero: (brand: ReturnType<typeof getBrandKit>, heading: string, subtext: string, cta: string) =>
    `<section style="background:linear-gradient(135deg,var(--brand-primary),var(--brand-secondary));color:#ffffff;padding:80px 24px;text-align:center">
<h1 style="font-size:42px;font-weight:800;margin:0 0 12px">${heading}</h1>
<p style="font-size:18px;opacity:0.9;margin:0 0 32px;max-width:600px;margin-left:auto;margin-right:auto">${subtext}</p>
<a href="#contact" style="display:inline-block;padding:14px 36px;background:#ffffff;color:var(--brand-primary);text-decoration:none;border-radius:8px;font-weight:700;font-size:16px">${cta}</a>
</section>`,

  features: (items: Array<{ title: string; desc: string }>) =>
    `<section style="padding:60px 24px;max-width:900px;margin:0 auto">
<h2 style="text-align:center;font-size:28px;font-weight:700;color:var(--brand-text);margin:0 0 40px">Nuestros Servicios</h2>
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:24px">
${items.map(i => `<div style="padding:24px;border:1px solid #eee;border-radius:12px">
<h3 style="font-size:18px;font-weight:600;color:var(--brand-primary);margin:0 0 8px">${i.title}</h3>
<p style="font-size:14px;color:#666;margin:0;line-height:1.5">${i.desc}</p>
</div>`).join('\n')}
</div>
</section>`,

  testimonials: (items: Array<{ quote: string; author: string }>) =>
    `<section style="padding:60px 24px;background:#f8f8f8">
<div style="max-width:800px;margin:0 auto">
<h2 style="text-align:center;font-size:28px;font-weight:700;color:var(--brand-text);margin:0 0 40px">Lo Que Dicen Nuestros Clientes</h2>
${items.map(i => `<div style="background:#ffffff;padding:24px;border-radius:12px;margin-bottom:16px;border-left:4px solid var(--brand-primary)">
<p style="font-size:15px;color:#555;margin:0 0 8px;font-style:italic">"${i.quote}"</p>
<p style="font-size:13px;color:var(--brand-primary);font-weight:600;margin:0">— ${i.author}</p>
</div>`).join('\n')}
</div>
</section>`,

  contact: (brand: ReturnType<typeof getBrandKit>) =>
    `<section id="contact" style="padding:60px 24px;max-width:600px;margin:0 auto;text-align:center">
<h2 style="font-size:28px;font-weight:700;color:var(--brand-text);margin:0 0 12px">Contacto</h2>
<p style="font-size:15px;color:#666;margin:0 0 24px">Escríbenos para más información</p>
${brand.contactInfo?.phone ? `<p style="font-size:16px;margin:0 0 8px"><a href="https://wa.me/${brand.contactInfo.phone.replace(/\D/g, '')}" style="color:var(--brand-primary);text-decoration:none;font-weight:600">WhatsApp: ${brand.contactInfo.phone}</a></p>` : ''}
${brand.contactInfo?.email ? `<p style="font-size:16px;margin:0 0 8px"><a href="mailto:${brand.contactInfo.email}" style="color:var(--brand-primary);text-decoration:none">${brand.contactInfo.email}</a></p>` : ''}
${brand.contactInfo?.address ? `<p style="font-size:14px;color:#999;margin:8px 0 0">${brand.contactInfo.address}</p>` : ''}
</section>`,

  footer: (brand: ReturnType<typeof getBrandKit>) =>
    `<footer style="background:var(--brand-text);color:#ffffff;padding:24px;text-align:center;font-size:13px">
<p style="margin:0;opacity:0.8">${brand.businessName} &copy; ${new Date().getFullYear()}</p>
${brand.socialLinks ? `<div style="margin-top:8px">${Object.entries(brand.socialLinks).map(([k, v]) => `<a href="${v}" style="color:var(--brand-accent);text-decoration:none;margin:0 8px">${k}</a>`).join('')}</div>` : ''}
</footer>`,
};

// ── Tools ──

const website_createLanding: ToolSchema = {
  name: 'website_createLanding',
  description: 'Generate a complete landing page from a brief. Includes hero, features, testimonials, contact, and footer sections. Full HTML/CSS with responsive design and brand kit.',
  parameters: {
    type: 'object',
    properties: {
      brief: { type: 'string', description: 'What the landing page is about — business, services, audience' },
      heading: { type: 'string', description: 'Hero heading (optional, AI generates if missing)' },
      sections: { type: 'array', description: 'Optional section order (default: hero, features, testimonials, contact, footer)' },
      org_id: { type: 'string', description: 'Organization ID' },
    },
    required: ['brief'],
  },
  riskLevel: 'high',
  execute: async (params: Record<string, unknown>) => {
    try {
      const brief = params.brief as string;
      const orgId = (params.org_id as string) ?? 'default';
      const brand = getBrandKit(orgId);

      // Use AI to generate section content
      let pageData: { heading: string; subtext: string; cta: string; features: Array<{ title: string; desc: string }>; testimonials: Array<{ quote: string; author: string }> };
      try {
        const { claudeChat } = await import('../llm/claudeClient.js');
        const prompt = `You are a landing page copywriter. Generate content for a business landing page.

Brief: ${brief}
Business: ${brand.businessName}
Tagline: ${brand.tagline ?? ''}
Tone: ${brand.tone}
Language: ${brand.language === 'es' ? 'Spanish' : 'English'}

Return valid JSON:
{
  "heading": "Hero heading (5-8 words max)",
  "subtext": "Hero subtext (1-2 sentences)",
  "cta": "CTA button text (2-3 words)",
  "features": [{"title": "Feature 1", "desc": "1-2 sentences"}, {"title": "Feature 2", "desc": "..."}, {"title": "Feature 3", "desc": "..."}],
  "testimonials": [{"quote": "Short testimonial", "author": "Name"}, {"quote": "Short testimonial", "author": "Name"}]
}`;

        const aiResp = await claudeChat(
          [{ role: 'user', content: prompt }],
          'sonnet',
        );
        const text = aiResp;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        pageData = jsonMatch ? JSON.parse(jsonMatch[0]) : {
          heading: brand.businessName,
          subtext: brief,
          cta: brand.language === 'es' ? 'Contactar' : 'Contact Us',
          features: [{ title: 'Service 1', desc: brief }],
          testimonials: [],
        };
      } catch {
        pageData = {
          heading: (params.heading as string) ?? brand.businessName,
          subtext: brief,
          cta: brand.language === 'es' ? 'Contactar' : 'Contact Us',
          features: [{ title: 'Our Service', desc: brief }],
          testimonials: [{ quote: 'Great service!', author: 'Customer' }],
        };
      }

      const html = injectBrandCSS(`<div style="font-family:var(--font-body);margin:0;padding:0">
${LANDING_SECTIONS.hero(brand, pageData.heading, pageData.subtext, pageData.cta)}
${LANDING_SECTIONS.features(pageData.features)}
${pageData.testimonials.length > 0 ? LANDING_SECTIONS.testimonials(pageData.testimonials) : ''}
${LANDING_SECTIONS.contact(brand)}
${LANDING_SECTIONS.footer(brand)}
</div>`, brand);

      const contentId = generateContentId();
      const now = new Date().toISOString();

      storeContent({
        contentId, slug: generateSlug(pageData.heading || 'Landing-Page', contentId), type: 'landing', html,
        data: { brief, heading: pageData.heading } as unknown as Record<string, unknown>,
        status: 'draft', createdAt: now, updatedAt: now,
      });

      return { contentId, html, heading: pageData.heading };
    } catch (err) {
      return { error: `website_createLanding failed: ${(err as Error).message}` };
    }
  },
};

const website_createCatalog: ToolSchema = {
  name: 'website_createCatalog',
  description: 'Generate a product catalog page with WhatsApp order buttons. Grid layout with product cards. Pulls from provided product list or generates sample from brief.',
  parameters: {
    type: 'object',
    properties: {
      products: { type: 'array', description: 'Array of {name, price, description, imageUrl?}' },
      brief: { type: 'string', description: 'Brief for AI to generate sample products if none provided' },
      whatsapp_number: { type: 'string', description: 'WhatsApp number for order buttons (e.g. +507XXXXXXX)' },
      org_id: { type: 'string', description: 'Organization ID' },
    },
    required: [],
  },
  riskLevel: 'high',
  execute: async (params: Record<string, unknown>) => {
    try {
      const orgId = (params.org_id as string) ?? 'default';
      const brand = getBrandKit(orgId);
      const waNumber = (params.whatsapp_number as string) ?? brand.contactInfo?.phone ?? '';
      const cleanNumber = waNumber.replace(/\D/g, '');

      type ProductItem = { name: string; price: string; description: string; imageUrl?: string };
      let products: ProductItem[] = (params.products as ProductItem[]) ?? [];

      // Generate sample products with AI if none provided
      if (products.length === 0 && params.brief) {
        try {
          const { claudeChat } = await import('../llm/claudeClient.js');
          const prompt = `Generate 6 products for a catalog. Brief: ${params.brief}. Business: ${brand.businessName}. Language: ${brand.language === 'es' ? 'Spanish' : 'English'}.

Return valid JSON array: [{"name": "Product", "price": "$XX.XX", "description": "Short desc"}]`;

          const aiResp = await claudeChat(
            [{ role: 'user', content: prompt }],
            'haiku',
          );
          const jsonMatch = aiResp.match(/\[[\s\S]*\]/);
          products = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
        } catch {
          products = [{ name: 'Product 1', price: '$10.00', description: 'Sample product' }];
        }
      }

      if (products.length === 0) {
        products = [{ name: 'Product 1', price: '$10.00', description: 'Add your products' }];
      }

      const productCards = products.map(p => {
        const waLink = cleanNumber ? `https://wa.me/${cleanNumber}?text=${encodeURIComponent(`Hola! Quiero ordenar: ${p.name}`)}` : '#';
        return `<div style="border:1px solid #eee;border-radius:12px;overflow:hidden;background:#fff">
<div style="width:100%;height:160px;background:#f5f5f5;display:flex;align-items:center;justify-content:center;color:#ccc;font-size:13px">${p.imageUrl ? `<img src="${p.imageUrl}" style="width:100%;height:100%;object-fit:cover" alt="${p.name}">` : '[Imagen]'}</div>
<div style="padding:16px">
<h3 style="font-size:16px;font-weight:600;color:var(--brand-text);margin:0 0 4px">${p.name}</h3>
<p style="font-size:13px;color:#888;margin:0 0 12px;line-height:1.4">${p.description}</p>
<div style="display:flex;align-items:center;justify-content:space-between">
<span style="font-size:20px;font-weight:700;color:var(--brand-primary)">${p.price}</span>
<a href="${waLink}" style="display:inline-block;padding:8px 16px;background:#25D366;color:#fff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600">Pedir</a>
</div>
</div>
</div>`;
      }).join('\n');

      const html = injectBrandCSS(`<div style="font-family:var(--font-body);margin:0;padding:0">
<div style="background:var(--brand-primary);padding:32px 24px;text-align:center;color:#fff">
<h1 style="margin:0;font-size:28px;font-weight:800">${brand.businessName}</h1>
<p style="margin:4px 0 0;opacity:0.85;font-size:15px">${brand.tagline ?? 'Nuestros Productos'}</p>
</div>
<div style="padding:24px;max-width:900px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:20px">
${productCards}
</div>
${LANDING_SECTIONS.footer(brand)}
</div>`, brand);

      const contentId = generateContentId();
      const now = new Date().toISOString();

      storeContent({
        contentId, slug: generateSlug('Product-Catalog', contentId), type: 'catalog', html,
        data: { productCount: products.length, whatsappNumber: cleanNumber } as unknown as Record<string, unknown>,
        status: 'draft', createdAt: now, updatedAt: now,
      });

      return { contentId, html, productCount: products.length };
    } catch (err) {
      return { error: `website_createCatalog failed: ${(err as Error).message}` };
    }
  },
};

const website_createBioLink: ToolSchema = {
  name: 'website_createBioLink',
  description: 'Create a link-in-bio page (Linktree-style). Profile section with business name and tagline, plus customizable link buttons. Popular for Instagram bios in LatAm.',
  parameters: {
    type: 'object',
    properties: {
      links: { type: 'array', description: 'Array of {label, url, icon?} for link buttons' },
      bio: { type: 'string', description: 'Short bio text (optional)' },
      org_id: { type: 'string', description: 'Organization ID' },
    },
    required: ['links'],
  },
  riskLevel: 'medium',
  execute: async (params: Record<string, unknown>) => {
    try {
      const links = (params.links as Array<{ label: string; url: string; icon?: string }>) ?? [];
      const bio = (params.bio as string) ?? '';
      const orgId = (params.org_id as string) ?? 'default';
      const brand = getBrandKit(orgId);

      const linkButtons = links.map(l =>
        `<a href="${l.url}" style="display:block;padding:14px 20px;background:#ffffff;color:var(--brand-text);text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;text-align:center;transition:transform 0.2s;border:1px solid #eee">${l.icon ? `${l.icon} ` : ''}${l.label}</a>`
      ).join('\n');

      // Add social links from brand kit
      const socialButtons = brand.socialLinks
        ? Object.entries(brand.socialLinks).map(([platform, url]) =>
            `<a href="${url}" style="display:inline-block;padding:8px 16px;background:rgba(255,255,255,0.2);color:#ffffff;text-decoration:none;border-radius:20px;font-size:13px;margin:0 4px">${platform}</a>`
          ).join('\n')
        : '';

      const html = injectBrandCSS(`<div style="min-height:100vh;font-family:var(--font-body);background:linear-gradient(180deg,var(--brand-primary),var(--brand-secondary));display:flex;justify-content:center;padding:40px 16px">
<div style="width:100%;max-width:420px">
<div style="text-align:center;margin-bottom:32px">
<div style="width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.2);margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:32px;color:#fff;font-weight:800">${brand.businessName.charAt(0).toUpperCase()}</div>
<h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700">${brand.businessName}</h1>
${brand.tagline ? `<p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:14px">${brand.tagline}</p>` : ''}
${bio ? `<p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:13px;line-height:1.4">${bio}</p>` : ''}
</div>
<div style="display:flex;flex-direction:column;gap:12px">
${linkButtons}
</div>
${socialButtons ? `<div style="text-align:center;margin-top:24px">${socialButtons}</div>` : ''}
<p style="text-align:center;color:rgba(255,255,255,0.4);font-size:11px;margin-top:32px">Powered by Kitz</p>
</div>
</div>`, brand);

      const contentId = generateContentId();
      const now = new Date().toISOString();

      storeContent({
        contentId, slug: generateSlug('Bio-Link', contentId), type: 'biolink', html,
        data: { linkCount: links.length, bio } as unknown as Record<string, unknown>,
        status: 'draft', createdAt: now, updatedAt: now,
      });

      return { contentId, html, linkCount: links.length };
    } catch (err) {
      return { error: `website_createBioLink failed: ${(err as Error).message}` };
    }
  },
};

const website_export: ToolSchema = {
  name: 'website_export',
  description: 'Export a website/landing/catalog/biolink as standalone HTML. Can be saved as .html file or deployed.',
  parameters: {
    type: 'object',
    properties: {
      content_id: { type: 'string', description: 'Content ID to export' },
      title: { type: 'string', description: 'Page title for the HTML document' },
    },
    required: ['content_id'],
  },
  riskLevel: 'medium',
  execute: async (params: Record<string, unknown>) => {
    try {
      const contentId = params.content_id as string;
      const content = getContent(contentId);
      if (!content) return { error: `Content not found: ${contentId}` };

      const allowedTypes = ['landing', 'catalog', 'biolink'];
      if (!allowedTypes.includes(content.type)) {
        return { error: `Content ${contentId} is type '${content.type}'. website_export supports: ${allowedTypes.join(', ')}` };
      }

      const pageTitle = (params.title as string) ?? `Page — ${contentId}`;
      const exportHtml = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${pageTitle}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{min-height:100vh}</style>
</head>
<body>${content.html}</body>
</html>`;

      return { contentId, html: exportHtml, format: 'standalone-html', type: content.type, title: pageTitle };
    } catch (err) {
      return { error: `website_export failed: ${(err as Error).message}` };
    }
  },
};

// ── Export ──

export function getAllWebsiteTools(): ToolSchema[] {
  return [website_createLanding, website_createCatalog, website_createBioLink, website_export];
}
