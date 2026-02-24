# Business Content Creation System — Design Doc

**Date**: 2026-02-24
**Status**: Approved
**Architecture**: Hybrid — Shared Content Engine + Specialized Tool Modules
**Output strategy**: HTML templates + AI generation (renderable in UI CanvasPreview, print-to-PDF ready)

## Problem

KITZ users (LatAm SMBs selling on WhatsApp/Instagram) need to create professional business documents — invoices, quotes, pitch decks, emails, flyers, and websites — without design skills or expensive software. Current KITZ tools handle text content (mail merge, marketing copy, drip messages) but lack visual document generation.

## Design Principles

- **80/20 split**: Templates + rendering handle 80%, AI handles 20% (content generation, personalization, layout decisions)
- **Draft-first**: All content starts as a preview draft. Nothing ships without user approval
- **Brand consistency**: Shared brand kit applied across all content types
- **Preview → Edit → Ship**: Users always see what they're creating, can request AI-driven edits via chat, then approve for delivery

## Content State Machine

```
draft → previewing → editing → approved → shipped → archived
```

Every create tool returns `{ contentId, html, type, data, status }`. The UI renders HTML in the CanvasPreview panel. Users edit via natural language ("make the header bigger", "change color to blue"). `content_ship` finalizes and delivers.

---

## Architecture

### Shared Core: `contentEngine.ts` (3 tools)

Foundation shared by all content types.

#### Brand Kit
```typescript
interface BrandKit {
  businessName: string;
  logo?: string;             // URL or base64
  colors: {
    primary: string;         // hex
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  tone: 'professional' | 'casual' | 'bold' | 'elegant';
  language: 'es' | 'en';
  tagline?: string;
  socialLinks?: Record<string, string>;
  contactInfo?: {
    phone?: string;
    email?: string;
    address?: string;
  };
}
```

#### Tools
| Tool | Complexity | Description |
|------|-----------|-------------|
| `brand_setup` | medium | Create/update brand kit. AI can suggest colors/tone from business description |
| `brand_get` | low | Retrieve current brand kit |
| `brand_update` | low | Partial update (e.g., just change colors) |

#### Template Registry
- HTML/CSS templates with `{{variable}}` placeholders
- Conditional blocks: `{{#if variable}}...{{/if}}`
- Repeat sections: `{{#each items}}...{{/each}}`
- Templates tagged by: type, industry, language, tone

#### HTML Renderer
- Template + data → final HTML string
- Variable substitution, conditionals, loops (line items)
- Brand kit CSS injection (colors, fonts, logo)
- Output: raw HTML for CanvasPreview + print-to-PDF

### Universal Content Tools (3 tools)

| Tool | Complexity | Description |
|------|-----------|-------------|
| `content_preview` | low | Returns `{ contentId, html, metadata }` — auto-called by all create tools |
| `content_edit` | medium | Takes contentId + natural language instruction → AI regenerates HTML |
| `content_ship` | high | Finalize → send via WhatsApp/Email + archive in document archive (draft-first) |

---

## Specialized Modules

### 1. `invoiceQuoteTools.ts` (6 tools)

Revenue documents — directly tied to getting paid.

| Tool | Complexity | Description |
|------|-----------|-------------|
| `invoice_create` | medium | Generate invoice from line items, tax, totals. AI fills missing fields. Branded HTML output |
| `invoice_fromOrder` | medium | Auto-generate from existing CRM order ID. Pulls products, prices, contact info |
| `quote_create` | medium | Quote/proposal with line items, validity period, terms. AI suggests pricing |
| `quote_toInvoice` | low | Convert accepted quote → invoice (copy data, mark quote accepted) |
| `invoice_list` | low | List invoices/quotes with status filter (draft/sent/paid/overdue) |
| `invoice_send` | high | Render + send via WhatsApp/Email. Delegates to content_ship |

#### Data Model
```typescript
interface InvoiceData {
  invoiceNumber: string;     // auto: INV-001, QUO-001
  type: 'invoice' | 'quote';
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'accepted' | 'rejected';
  contactId: string;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  lineItems: LineItem[];
  subtotal: number;
  taxRate: number;           // default: 0.07 (ITBMS Panama)
  taxTotal: number;
  discountPercent?: number;
  discountTotal?: number;
  grandTotal: number;
  currency: 'USD' | 'PAB';  // default: USD
  notes?: string;
  terms?: string;
  validUntil?: string;       // quotes only
  dueDate?: string;          // invoices only
  createdAt: string;
}

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  tax?: number;
  discount?: number;
  total: number;
}
```

#### Pre-seeded Templates
1. **Clean Professional** — minimal, black/white, suited for services
2. **Modern Minimal** — accent color, clean typography
3. **Bold Colorful** — vibrant brand colors, ideal for retail/food

### 2. `deckTools.ts` (2 tools)

Simplified — AI generates full deck from brief, export for printing.

| Tool | Complexity | Description |
|------|-----------|-------------|
| `deck_create` | high | AI generates multi-slide deck from brief. Claude Sonnet creates content. Brand kit applied. Returns array of HTML slides |
| `deck_export` | medium | Combine slides into single HTML with page-break CSS (print-to-PDF ready) |

#### Slide Types
- **Title**: Business name, tagline, logo
- **Content**: Heading + bullets/paragraphs
- **Image + Caption**: Placeholder for visual + descriptive text
- **Comparison**: 2-column layout (before/after, us vs them)
- **Stats/Numbers**: Key metrics, large numbers
- **Quote/Testimonial**: Customer quote with attribution
- **CTA/Contact**: Call-to-action with contact info

#### Pre-seeded Templates
1. **Investor Pitch** (10 slides) — Problem, Solution, Market, Product, Traction, Team, Financials, Ask
2. **Sales Proposal** (8 slides) — Intro, Problem, Solution, Features, Pricing, Timeline, Testimonials, CTA
3. **Business Overview** (6 slides) — About, Services, Portfolio, Team, Contact, CTA

### 3. `emailBuilderTools.ts` (3 tools)

Visual rich HTML emails (different from mail merge plain text templates).

| Tool | Complexity | Description |
|------|-----------|-------------|
| `email_buildTemplate` | high | AI generates styled, responsive HTML email from brief. Brand kit applied |
| `email_listTemplates` | low | List all visual email templates |
| `email_send` | high | Send visual email. Delegates to content_ship |

#### Pre-seeded Templates
1. **Welcome Email** — branded header, personalized greeting, CTA button
2. **Product Launch** — hero image area, feature highlights, order CTA
3. **Newsletter** — multi-section layout with articles/updates

### 4. `flyerPromoTools.ts` (3 tools)

Promotional materials for WhatsApp groups and social media.

| Tool | Complexity | Description |
|------|-----------|-------------|
| `flyer_create` | high | AI generates promotional flyer as HTML. Headline, body, image placeholder, CTA, contact info. Shareable, printable |
| `promo_create` | medium | Social promo asset — Instagram caption, WhatsApp status text, branded layout |
| `promo_listCreated` | low | List all flyers and promos |

#### Pre-seeded Templates
1. **Sale/Discount** — big percentage, product highlight, urgency
2. **Event Invitation** — date, location, RSVP CTA
3. **New Product** — product showcase, features, price, order CTA
4. **Holiday Greeting** — seasonal design, brand message
5. **Menu/Catalog Flyer** — grid of products with prices

### 5. `websiteTools.ts` (4 tools)

Web presence — landing pages, catalogs, bio links.

| Tool | Complexity | Description |
|------|-----------|-------------|
| `website_createLanding` | high | AI generates complete landing page (hero, features, testimonials, CTA, footer). Branded HTML/CSS |
| `website_createCatalog` | high | Product catalog page from CRM products. Grid layout, prices, WhatsApp order buttons |
| `website_createBioLink` | medium | Link-in-bio page (like Linktree). Profile, links to products/social/WhatsApp. Popular for IG bios |
| `website_export` | medium | Export as standalone HTML or push to Lovable via existing integration |

#### Pre-seeded Templates
1. **Business Landing Page** — hero, about, services, testimonials, contact
2. **Product Catalog** — grid with filters, WhatsApp order buttons
3. **Service Menu** — categories, descriptions, pricing
4. **Bio Link** — profile photo, business name, link buttons

---

## N8N Workflow Templates (7 new)

| Template | Trigger | What it automates |
|----------|---------|-------------------|
| `invoice-auto-generate.json` | Order confirmed webhook | Generate invoice → preview draft → notify owner |
| `quote-followup.json` | Cron: 3 days after quote sent | Check if quote responded → send follow-up if not |
| `monthly-invoice-batch.json` | Monthly cron (1st of month) | Batch generate invoices for recurring orders |
| `promo-blast.json` | Flyer approved webhook | Broadcast flyer to CRM segment via WhatsApp |
| `landing-page-deploy.json` | Landing page approved webhook | Push to Lovable project for hosting |
| `content-weekly-digest.json` | Weekly cron (Fri 5PM) | Summary of all content created this week |
| `bio-link-update.json` | Product added webhook | Auto-update catalog and bio link pages |

---

## AOS Agent Wiring

| Agent | Tools Connected |
|-------|----------------|
| **CMO** | `flyer_create`, `promo_create`, `email_buildTemplate`, `content_edit` |
| **QuoteGenerator** | `quote_create`, `quote_toInvoice`, `invoice_create` |
| **ContentCreator** (new) | `deck_create`, `website_createLanding`, `website_createBioLink` |
| **OutreachDrafter** | `email_buildTemplate`, `content_ship` |

---

## UI Integration (CanvasPreview — v1)

- All create tools return `{ contentId, html, type }` in response
- CanvasPreview panel detects `html` field → renders live preview via iframe/dangerouslySetInnerHTML
- User edits via chat: "make it blue", "add a discount line" → `content_edit` regenerates
- "Ship it" / "Send it" → triggers `content_ship`
- Multiple edit rounds supported (no limit)

### Future Phase: Visual Editor (v2)
- Click-to-edit text fields
- Drag-and-drop sections
- Color picker / font selector
- Image upload
- NOT built in v1

---

## Tool Count Summary

| Module | Tools |
|--------|-------|
| `contentEngine.ts` | 3 (brand kit) |
| Universal content tools | 3 (preview, edit, ship) |
| `invoiceQuoteTools.ts` | 6 |
| `deckTools.ts` | 2 |
| `emailBuilderTools.ts` | 3 |
| `flyerPromoTools.ts` | 3 |
| `websiteTools.ts` | 4 |
| **Total** | **24 new tools** |

Plus 7 n8n workflow templates and 3 agent wirings.

---

## 80/20 Split

**80% Automated (n8n + tools)**:
- Template rendering with brand kit
- Invoice calculation (subtotals, tax, discounts, totals)
- Variable substitution from CRM data
- Content delivery via WhatsApp/Email
- Document archiving after ship
- Scheduled follow-ups and batch generation

**20% AI (Claude Sonnet/Haiku)**:
- Content generation from briefs (decks, emails, flyers, landing pages)
- Invoice field inference from partial data
- Edit instruction interpretation ("make it more professional")
- Pricing suggestions for quotes
- Brand kit suggestion from business description
- Layout and design decisions
