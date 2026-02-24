# Business Content Creation System — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build 24 new tools across 7 modules for generating invoices, quotes, decks, emails, flyers, websites, and bio links — with a shared content engine, brand kit, and preview→edit→ship workflow.

**Architecture:** Hybrid — shared `contentEngine.ts` (brand kit, HTML renderer, template registry) + specialized tool modules per content type. Universal `content_preview`, `content_edit`, `content_ship` tools handle the lifecycle. All tools return `{ contentId, html, type, data }` for UI CanvasPreview rendering.

**Tech Stack:** TypeScript/ESM, Fastify, Claude API (Sonnet for generation, Haiku for extraction), in-memory storage (Supabase in production).

---

## Task 1: Content Engine — Brand Kit + HTML Renderer

**Files:**
- Create: `kitz_os/src/tools/contentEngine.ts`

**Step 1: Create contentEngine.ts with brand kit store, template renderer, and 3 tools**

The content engine is the shared core. It provides:
- `brand_setup` (medium) — Create/update brand kit from data or AI suggestion
- `brand_get` (low) — Retrieve current brand kit
- `brand_update` (low) — Partial update to brand kit

Plus internal helpers:
- `renderTemplate(template, data, brandKit)` — variable substitution with `{{var}}`, conditionals `{{#if}}`, loops `{{#each}}`
- `injectBrandCSS(html, brandKit)` — inject brand colors/fonts into HTML
- `generateContentId()` — unique content ID generator
- Default brand kit seeded for users who skip setup

Key interfaces:
```typescript
interface BrandKit {
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

interface ContentItem {
  contentId: string;
  type: 'invoice' | 'quote' | 'deck' | 'email' | 'flyer' | 'promo' | 'landing' | 'catalog' | 'biolink';
  html: string;
  data: Record<string, unknown>;
  status: 'draft' | 'previewing' | 'editing' | 'approved' | 'shipped' | 'archived';
  createdAt: string;
  updatedAt: string;
}
```

Pattern reference: Follow `kitz_os/src/tools/mailMergeTools.ts` structure — `ToolSchema` interface, in-memory Map, seed defaults, `getAllXTools()` export.

**Step 2: Run typecheck**

Run: `cd kitz_os && npx tsc --noEmit`
Expected: clean exit

**Step 3: Commit**

```bash
git add kitz_os/src/tools/contentEngine.ts
git commit -m "feat: add content engine — brand kit, HTML renderer, template registry"
```

---

## Task 2: Universal Content Tools — Preview, Edit, Ship

**Files:**
- Modify: `kitz_os/src/tools/contentEngine.ts` (add 3 more tools to same file)

**Step 1: Add content_preview, content_edit, content_ship to contentEngine.ts**

- `content_preview` (low) — Retrieve a content item by ID, return `{ contentId, html, type, data, status }`
- `content_edit` (medium) — Takes `contentId` + natural language edit instruction. AI (Claude Sonnet) regenerates HTML with the edit applied. Updates in-memory store.
- `content_ship` (high) — Finalize content → send via WhatsApp/Email using existing outbound tools + archive in document archive. Draft-first enforced.

The `content_edit` tool should:
1. Retrieve the content item
2. Send current HTML + edit instruction to Claude Sonnet
3. Get back modified HTML
4. Update the store
5. Return the new `{ contentId, html }`

The `content_ship` tool should:
1. Set status to 'approved'
2. If channel is 'whatsapp', call `outbound_sendWhatsApp` (via registry invoke)
3. If channel is 'email', call `outbound_sendEmail` (via registry invoke)
4. Call `archive_store` to archive the document
5. Set status to 'shipped'

**Step 2: Run typecheck**

Run: `cd kitz_os && npx tsc --noEmit`
Expected: clean exit

**Step 3: Commit**

```bash
git add kitz_os/src/tools/contentEngine.ts
git commit -m "feat: add universal content tools — preview, edit, ship lifecycle"
```

---

## Task 3: Invoice & Quote Tools

**Files:**
- Create: `kitz_os/src/tools/invoiceQuoteTools.ts`

**Step 1: Create invoiceQuoteTools.ts with 6 tools**

Tools:
- `invoice_create` (medium) — Generate invoice from line items. Auto-calculate subtotal, tax (7% ITBMS default), discount, grandTotal. Auto-increment invoice number (INV-001). Generate branded HTML using contentEngine's `renderTemplate` + `injectBrandCSS`. Store as ContentItem.
- `invoice_fromOrder` (medium) — Takes orderId, calls CRM `orders_getOrder` to pull line items/contact, then generates invoice.
- `quote_create` (medium) — Same as invoice but with validity period, terms. Number format QUO-001.
- `quote_toInvoice` (low) — Copy quote data → create invoice, mark quote status 'accepted'.
- `invoice_list` (low) — List all invoices/quotes with optional status filter.
- `invoice_send` (high) — Render final HTML, delegate to `content_ship`.

Pre-seeded HTML templates (3):
1. **Clean Professional** — black/white, minimal, good for services
2. **Modern Minimal** — accent color from brand kit, clean typography
3. **Bold Colorful** — vibrant brand colors, good for retail

Each template is an HTML string with CSS, using `{{invoiceNumber}}`, `{{contactName}}`, `{{#each lineItems}}`, `{{grandTotal}}`, etc.

Data model: `InvoiceData` and `LineItem` interfaces from design doc.

**Step 2: Run typecheck**

Run: `cd kitz_os && npx tsc --noEmit`
Expected: clean exit

**Step 3: Commit**

```bash
git add kitz_os/src/tools/invoiceQuoteTools.ts
git commit -m "feat: add invoice & quote tools — create, from order, convert, list, send"
```

---

## Task 4: Deck/Presentation Tools

**Files:**
- Create: `kitz_os/src/tools/deckTools.ts`

**Step 1: Create deckTools.ts with 2 tools**

Tools:
- `deck_create` (high) — Takes brief (string), optional template ('investor-pitch' | 'sales-proposal' | 'business-overview'), optional slide count. Claude Sonnet generates structured slide content. Each slide gets branded HTML with page-break CSS. Returns array of slides as a single HTML document. Store as ContentItem.
- `deck_export` (medium) — Combine all slides into single HTML document with `@media print` CSS for page breaks. Ready for browser print-to-PDF.

Slide types (HTML components):
- Title slide: full-screen, logo, business name, tagline
- Content slide: heading + bullets
- Stats slide: large numbers in grid
- Comparison slide: 2-column
- Quote/testimonial slide: large quote text + attribution
- CTA slide: contact info + action button

Pre-seeded templates (3):
1. **Investor Pitch** (10 slides): Title, Problem, Solution, Market Size, Product, Traction, Business Model, Team, Financials, Ask
2. **Sales Proposal** (8 slides): Title, Problem, Solution, Features, Pricing, Timeline, Testimonials, CTA
3. **Business Overview** (6 slides): Title, About, Services, Portfolio, Team, Contact

**Step 2: Run typecheck**

Run: `cd kitz_os && npx tsc --noEmit`
Expected: clean exit

**Step 3: Commit**

```bash
git add kitz_os/src/tools/deckTools.ts
git commit -m "feat: add deck tools — AI pitch deck generation with 3 pre-seeded templates"
```

---

## Task 5: Email Builder Tools

**Files:**
- Create: `kitz_os/src/tools/emailBuilderTools.ts`

**Step 1: Create emailBuilderTools.ts with 3 tools**

These produce **visual** rich HTML emails — different from mail merge (plain text templates).

Tools:
- `email_buildTemplate` (high) — Takes brief (string), optional template name. Claude Sonnet generates responsive HTML email with brand kit styling. Inline CSS for email client compatibility. Store as ContentItem.
- `email_listTemplates` (low) — List all visual email templates.
- `email_send` (high) — Delegate to `content_ship` with channel='email'.

Pre-seeded templates (3):
1. **Welcome Email** — branded header, personalized greeting, feature highlights, CTA button
2. **Product Launch** — hero image placeholder, feature grid, order CTA
3. **Newsletter** — multi-section layout with article cards

Key: All templates use inline CSS (not stylesheet) for email client compatibility. Responsive via `max-width` + `@media` queries.

**Step 2: Run typecheck**

Run: `cd kitz_os && npx tsc --noEmit`
Expected: clean exit

**Step 3: Commit**

```bash
git add kitz_os/src/tools/emailBuilderTools.ts
git commit -m "feat: add visual email builder tools — responsive HTML email generation"
```

---

## Task 6: Flyer & Promo Tools

**Files:**
- Create: `kitz_os/src/tools/flyerPromoTools.ts`

**Step 1: Create flyerPromoTools.ts with 3 tools**

Tools:
- `flyer_create` (high) — AI generates promotional flyer as HTML. Takes: headline, body text, optional product/event, CTA text. Claude Sonnet generates design with brand kit colors. Output: shareable HTML (WhatsApp-friendly, print-ready with page-break CSS).
- `promo_create` (medium) — Social promo asset. Takes: platform ('instagram' | 'whatsapp' | 'facebook'), product/event, tone. Generates: branded text layout with caption, hashtags, CTA. Not image generation — text-based visual HTML.
- `promo_listCreated` (low) — List all flyers and promos with type filter.

Pre-seeded flyer templates (5):
1. **Sale/Discount** — large percentage, product name, urgency timer text
2. **Event Invitation** — date, location, RSVP CTA
3. **New Product** — product showcase, features, price, order button
4. **Holiday Greeting** — seasonal colors, brand message
5. **Menu/Catalog** — product grid with prices

**Step 2: Run typecheck**

Run: `cd kitz_os && npx tsc --noEmit`
Expected: clean exit

**Step 3: Commit**

```bash
git add kitz_os/src/tools/flyerPromoTools.ts
git commit -m "feat: add flyer and promo tools — promotional materials for WhatsApp and social"
```

---

## Task 7: Website/Landing Page Tools

**Files:**
- Create: `kitz_os/src/tools/websiteTools.ts`

**Step 1: Create websiteTools.ts with 4 tools**

Tools:
- `website_createLanding` (high) — AI generates complete landing page from brief. Sections: hero with CTA, features grid, testimonials, about, contact form placeholder, footer. Full HTML/CSS with responsive design. Brand kit applied.
- `website_createCatalog` (high) — Product catalog page from CRM data. Takes optional product list or pulls from CRM. Grid layout with product cards (image placeholder, name, price, WhatsApp order button `wa.me/PHONE?text=Quiero+PRODUCT`).
- `website_createBioLink` (medium) — Link-in-bio page (Linktree-style). Profile section (name, photo placeholder, tagline) + link buttons (products, WhatsApp, Instagram, etc). Popular for IG bios in LatAm.
- `website_export` (medium) — Export content as standalone HTML string or push to Lovable via `lovable_pushArtifact` tool.

Pre-seeded templates (4):
1. **Business Landing Page** — hero, about, services, testimonials, contact
2. **Product Catalog** — responsive grid, WhatsApp order buttons
3. **Service Menu** — categories with descriptions and pricing
4. **Bio Link** — profile photo area, business name, button stack

**Step 2: Run typecheck**

Run: `cd kitz_os && npx tsc --noEmit`
Expected: clean exit

**Step 3: Commit**

```bash
git add kitz_os/src/tools/websiteTools.ts
git commit -m "feat: add website tools — landing pages, product catalogs, bio links"
```

---

## Task 8: Register All Tools in Registry

**Files:**
- Modify: `kitz_os/src/tools/registry.ts`

**Step 1: Add 7 new tool modules to registerDefaults()**

Add to the `modules` array:
```typescript
import('./contentEngine.js'),
import('./invoiceQuoteTools.js'),
import('./deckTools.js'),
import('./emailBuilderTools.js'),
import('./flyerPromoTools.js'),
import('./websiteTools.js'),
```

Note: `contentEngine.ts` exports both brand kit tools AND universal content tools in a single `getAllContentEngineTools()`.

Add to `getterNames` array:
```typescript
'getAllContentEngineTools',
'getAllInvoiceQuoteTools',
'getAllDeckTools',
'getAllEmailBuilderTools',
'getAllFlyerPromoTools',
'getAllWebsiteTools',
```

**Step 2: Run typecheck**

Run: `cd kitz_os && npx tsc --noEmit`
Expected: clean exit

**Step 3: Commit**

```bash
git add kitz_os/src/tools/registry.ts
git commit -m "feat: register content creation tools — 24 new tools in 6 modules"
```

---

## Task 9: Wire AOS Agents

**Files:**
- Modify: `aos/src/agents/teams/content-brand/CopyWriter.ts`
- Modify: `aos/src/agents/teams/sales-crm/QuoteGenerator.ts`
- Create: `aos/src/agents/teams/content-brand/ContentCreator.ts`

**Step 1: Update CopyWriter agent (CMO proxy)**

Add methods:
- `createFlyer(headline, body, traceId)` → invokes `flyer_create`
- `createPromo(platform, product, traceId)` → invokes `promo_create`
- `buildEmail(brief, traceId)` → invokes `email_buildTemplate`

Update `handleMessage()` to call `flyer_create` instead of `marketing_generateContent`.

**Step 2: Update QuoteGenerator agent**

Change `generateQuote()` to call `quote_create` instead of `merge_renderMessage`:
```typescript
async generateQuote(contactId: string, amount: number, traceId?: string): Promise<unknown> {
  return this.invokeTool('quote_create', {
    contact_id: contactId,
    line_items: [{ description: 'Service', quantity: 1, unitPrice: amount }],
  }, traceId)
}
```

**Step 3: Create ContentCreator agent**

New agent in `content-brand` team:
```typescript
export class ContentCreatorAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('ContentCreator', bus, memory)
    this.team = 'content-brand'
    this.tier = 'team'
  }

  async createDeck(brief: string, template?: string, traceId?: string) {
    return this.invokeTool('deck_create', { brief, template }, traceId)
  }

  async createLanding(brief: string, traceId?: string) {
    return this.invokeTool('website_createLanding', { brief }, traceId)
  }

  async createBioLink(links: Array<{label: string; url: string}>, traceId?: string) {
    return this.invokeTool('website_createBioLink', { links }, traceId)
  }
}
```

**Step 4: Run typecheck for both kitz_os and aos**

Run: `cd kitz_os && npx tsc --noEmit && cd ../aos && npx tsc --noEmit`
Expected: both clean

**Step 5: Commit**

```bash
git add aos/src/agents/teams/content-brand/ContentCreator.ts
git add aos/src/agents/teams/content-brand/CopyWriter.ts
git add aos/src/agents/teams/sales-crm/QuoteGenerator.ts
git commit -m "feat: wire AOS agents to content creation tools — CMO, QuoteGen, ContentCreator"
```

---

## Task 10: N8N Workflow Templates

**Files:**
- Create: `kitz_os/data/n8n-workflows/invoice-auto-generate.json`
- Create: `kitz_os/data/n8n-workflows/quote-followup.json`
- Create: `kitz_os/data/n8n-workflows/monthly-invoice-batch.json`
- Create: `kitz_os/data/n8n-workflows/promo-blast.json`
- Create: `kitz_os/data/n8n-workflows/landing-page-deploy.json`
- Create: `kitz_os/data/n8n-workflows/content-weekly-digest.json`
- Create: `kitz_os/data/n8n-workflows/bio-link-update.json`

**Step 1: Create 7 n8n workflow JSON files**

Follow the pattern from `drip-welcome-sequence.json`:
- Each workflow has: trigger node → kitz_os HTTP request node(s) → response node
- All kitz_os calls use `POST http://kitz-os:3012/api/kitz` with `x-service-secret` header
- Webhook triggers use `/kitz-<workflow-name>` paths
- Cron triggers use n8n cron expressions

Workflows:
1. `invoice-auto-generate.json` — Webhook `/kitz-invoice-create` → `invoice_fromOrder` → `content_preview` → respond with HTML
2. `quote-followup.json` — Cron every 3 days → `invoice_list` (status=sent, type=quote) → for each old quote → `content_ship` follow-up
3. `monthly-invoice-batch.json` — Cron 1st of month 8AM → `invoice_list` recurring → batch `invoice_create` → notify owner
4. `promo-blast.json` — Webhook `/kitz-promo-blast` → `broadcast_preview` → `broadcast_send` with flyer HTML
5. `landing-page-deploy.json` — Webhook `/kitz-deploy-landing` → `website_export` with Lovable push
6. `content-weekly-digest.json` — Cron Fri 5PM → `content_preview` list all week's content → AI summary → WA to owner
7. `bio-link-update.json` — Webhook `/kitz-bio-update` → `website_createBioLink` with new links → `website_export`

**Step 2: Update toolFactoryTools.ts and marketingTools.ts template arrays**

Add 7 new template slugs to `MARKETING_TEMPLATES` in `marketingTools.ts` and to `toolFactory_createFromTemplate` description in `toolFactoryTools.ts`.

**Step 3: Run typecheck**

Run: `cd kitz_os && npx tsc --noEmit`
Expected: clean exit

**Step 4: Commit**

```bash
git add kitz_os/data/n8n-workflows/invoice-auto-generate.json
git add kitz_os/data/n8n-workflows/quote-followup.json
git add kitz_os/data/n8n-workflows/monthly-invoice-batch.json
git add kitz_os/data/n8n-workflows/promo-blast.json
git add kitz_os/data/n8n-workflows/landing-page-deploy.json
git add kitz_os/data/n8n-workflows/content-weekly-digest.json
git add kitz_os/data/n8n-workflows/bio-link-update.json
git add kitz_os/src/tools/toolFactoryTools.ts
git add kitz_os/src/tools/marketingTools.ts
git commit -m "feat: add 7 n8n workflow templates for content creation automation"
```

---

## Task 11: Update Automation Catalog (UI)

**Files:**
- Modify: `ui/src/content/automation-catalog.ts`

**Step 1: Change content-creation items from 'coming-soon' to 'live'**

Update all items in the `content-creation` category to `status: 'live'`. Also update items in `invoices-payments` that reference the new tools (Invoice Generator, Quote Builder, Auto-Invoice on Sale, Quote Follow-Up) to `status: 'live'`.

**Step 2: Run typecheck + build**

Run: `cd ui && npx tsc --noEmit && npm run build`
Expected: both clean

**Step 3: Commit**

```bash
git add ui/src/content/automation-catalog.ts
git commit -m "feat: update automation catalog — content creation and invoices now live"
```

---

## Task 12: Final Typecheck — Full Stack

**Files:** None (verification only)

**Step 1: Typecheck all modified services**

Run:
```bash
cd kitz_os && npx tsc --noEmit
cd ../aos && npx tsc --noEmit
cd ../ui && npx tsc --noEmit && npm run build
```
Expected: all pass clean

**Step 2: Commit all remaining changes and push**

```bash
git add -A
git status  # verify only expected files
git commit -m "feat: business content creation system — 24 tools, 7 n8n workflows, 3 agents

Content engine with brand kit, HTML renderer, and preview→edit→ship lifecycle.
Modules: invoices/quotes, decks, email builder, flyer/promo, websites/bio links.
7 n8n workflow templates for automation. 3 AOS agents wired.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
git push origin main
```
