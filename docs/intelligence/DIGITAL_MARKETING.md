# Digital Marketing Playbooks for LatAm SMBs

**Document type:** Strategic Intelligence Brief
**Last updated:** 2026-02-24
**Status:** Living document -- update as platforms evolve and Kitz tools expand
**Audience:** Kitz platform -- AI agents, content engine, marketing workflow system, and SMB owners

---

## Table of Contents

1. [WhatsApp Marketing](#1-whatsapp-marketing)
2. [Instagram & Facebook Marketing](#2-instagram--facebook-marketing)
3. [TikTok Marketing](#3-tiktok-marketing)
4. [Google Business Profile](#4-google-business-profile)
5. [SEO in Spanish](#5-seo-in-spanish)
6. [Customer Acquisition Cost Benchmarks](#6-customer-acquisition-cost-cac-benchmarks)
7. [Sales Funnel Templates](#7-sales-funnel-templates)
8. [Kitz Integration Map](#8-kitz-integration-map)
9. [Appendix: Reference Links](#9-appendix-reference-links)

---

## 1. WhatsApp Marketing

> **HIGHEST PRIORITY** -- WhatsApp has 420+ million users in Latin America with 95%+ penetration. In Brazil alone, 72% of WhatsApp users engage with businesses on the platform. WhatsApp is not just a messaging app in LatAm -- it IS the business operating system layer. Every Kitz marketing workflow begins and ends here.

### 1.1 WhatsApp Business Platform Overview

#### Three Tiers of WhatsApp Business

| Feature | WhatsApp Business App | WhatsApp Business API (On-Premise) | WhatsApp Cloud API |
|---|---|---|---|
| **Cost** | Free | BSP hosting fees + Meta per-message | Meta per-message only |
| **Target** | Solo operators, <5 employees | Mid-market, high volume | SMBs scaling up (Kitz sweet spot) |
| **Automation** | Basic quick replies, labels | Full programmatic control | Full programmatic control |
| **Multi-agent** | No (single device) | Yes | Yes |
| **Catalog** | Up to 500 products | Via Commerce API | Via Commerce API |
| **Broadcast** | 256 contacts max | Unlimited (template messages) | Unlimited (template messages) |
| **CRM integration** | Manual | Full API access | Full API access |
| **Kitz integration** | Baileys connector (current) | Future enterprise path | Recommended path |

**Kitz recommendation:** Most Kitz users start on the WhatsApp Business App. As they scale, Kitz should provide a seamless migration path to Cloud API via `outbound_sendWhatsApp` tool abstraction layer. The Baileys connector currently bridges this gap.

#### Message Types

| Type | Description | When to Use | Cost |
|---|---|---|---|
| **Session messages** | Free-form replies within 24-hour window after customer message | Customer support, answering inquiries | Free (service window) |
| **Template messages -- Marketing** | Pre-approved promotional content | Broadcasts, offers, cart recovery, announcements | Highest rate |
| **Template messages -- Utility** | Transaction-related notifications | Order confirmations, shipping updates, payment receipts | Mid-range rate |
| **Template messages -- Authentication** | OTP and verification codes | Login verification, account confirmation | Lowest rate |
| **Interactive messages** | Buttons, lists, product cards | In-conversation CTAs, product browsing | Depends on context |

#### Pricing Model (Effective July 1, 2025 -- Per-Message)

Meta shifted from conversation-based to per-message pricing on July 1, 2025. Every delivered template message is charged individually based on category and recipient country.

**LatAm Per-Message Rates (USD, 2026):**

| Country | Marketing | Utility | Authentication | Service (24h window) |
|---|---|---|---|---|
| **Brazil** | $0.0625 | $0.0068 (first 1K), $0.0065 (1K-10K) | ~$0.004 | Free |
| **Mexico** | ~$0.036 | ~$0.008 | ~$0.005 | Free |
| **Colombia** | ~$0.020 | ~$0.001 | ~$0.003 | Free |
| **Argentina** | ~$0.032 | ~$0.005 (reduced Oct 2025) | ~$0.004 (reduced Oct 2025) | Free |
| **Chile** | ~$0.055 | ~$0.009 | ~$0.005 | Free |
| **Peru** | ~$0.035 | ~$0.004 | ~$0.004 | Free |

**Volume discounts:** Starting July 1, 2025, Meta introduced automatic volume-based discounts for utility and authentication messages. Higher monthly volume to a specific country unlocks progressively lower rates.

**Local currency billing:** Mexico (MXN) available from January 1, 2026. More countries expected by April 2026.

**Kitz cost tracking:** The `campaign-performance-report` n8n workflow should track per-message costs by category and country, feeding into the daily summary sent to the business owner.

#### Quality Rating and Messaging Limits

WhatsApp assigns a quality rating (Green/Yellow/Red) based on:
- User blocks and reports
- Template message feedback
- Recent message quality signals

Messaging limits scale with quality:
- **Tier 1:** 1,000 unique contacts/24h (new accounts)
- **Tier 2:** 10,000 unique contacts/24h
- **Tier 3:** 100,000 unique contacts/24h
- **Tier 4:** Unlimited

**Kitz safeguard:** The `campaign-broadcast-scheduled` workflow must check current tier limits before executing broadcasts and alert the owner if approaching thresholds.

### 1.2 WhatsApp Marketing Playbooks

#### Broadcast Lists vs WhatsApp Channels vs Groups vs Communities

| Feature | Broadcast List | WhatsApp Channel | Group | Community |
|---|---|---|---|---|
| **Direction** | One-to-many (private) | One-to-many (public) | Many-to-many | Hub for multiple groups |
| **Max audience** | 256 contacts | Unlimited followers | 1,024 members | 2,000 members across 100 groups |
| **Requires opt-in** | Yes (must have your number saved) | No (follow to subscribe) | Invite/link | Invite/link |
| **Content types** | Text, media, interactive | Text, photos, videos, stickers, polls | All message types | All message types |
| **Cost** | Template message rates apply | Free (as of 2026) | Free | Free |
| **Analytics** | Delivery/read receipts | View counts | None | None |
| **Best for** | Personalized promotions, segmented offers | Brand announcements, content distribution | VIP customer clubs, loyalty groups | Organizing customer segments under one umbrella |

**Kitz strategy:** Use Channels for broad brand awareness (free), Communities to organize customer segments, and API template messages for personalized marketing. The `campaign-multi-touch` workflow should coordinate across all three.

#### Drip Campaign Workflows

**Welcome Sequence (New Customer)**

```
Day 0: Welcome message (WhatsApp template - utility)
  "Hola {{nombre}}, bienvenido/a a {{negocio}}! Gracias por elegirnos.
   Aqui tienes tu numero de cliente: {{id_cliente}}.
   Respondenos si necesitas algo. Estamos para servirte."

Day 1: Value delivery (WhatsApp template - marketing)
  "Hola {{nombre}}, sabias que en {{negocio}} tenemos {{beneficio_clave}}?
   Mira nuestro catalogo completo aqui: {{link_catalogo}}
   Cualquier duda, escribenos!"

Day 3: Social proof (WhatsApp template - marketing)
  "{{nombre}}, nuestros clientes nos califican con {{rating}} estrellas.
   Lee lo que dicen: {{link_resenas}}
   Tienes alguna pregunta sobre nuestros productos?"

Day 7: First offer (WhatsApp template - marketing)
  "{{nombre}}, tenemos algo especial para ti!
   {{descripcion_oferta}}
   Valido hasta {{fecha_vencimiento}}.
   Responde SI para aprovecharlo."

Day 14: Re-engagement check (WhatsApp template - marketing)
  "Hola {{nombre}}, te extrañamos en {{negocio}}.
   Tenemos novedades que te van a encantar.
   Responde MENU para ver lo nuevo."
```

**Kitz mapping:** This maps directly to the `lead-nurture-sequence` n8n workflow template (`/kitz-lead-nurture` webhook). The AI agent (Claude Sonnet) personalizes each message beyond `{{vars}}` using CRM contact data and purchase history.

#### Abandoned Cart Recovery via WhatsApp

Cart abandonment averages 70.19% globally. WhatsApp recovery messages achieve 20-30% higher recovery rates than email, with conversion rates exceeding 11% (up to 25% for optimized flows).

**Recovery Sequence:**

```
1 hour after abandonment:
  "Hola {{nombre}}, vimos que dejaste estos productos en tu carrito:
   {{lista_productos}}
   Total: {{moneda}}{{total}}
   Quieres completar tu compra? Te ayudamos aqui: {{link_carrito}}"

6 hours after abandonment:
  "{{nombre}}, tus productos todavia estan disponibles!
   {{producto_principal}} se esta agotando rapido.
   Completa tu pedido antes de que se acabe: {{link_carrito}}"

24 hours after abandonment (with incentive):
  "Ultima oportunidad, {{nombre}}!
   Te damos {{descuento}}% de descuento en tu carrito.
   Usa el codigo: {{codigo_descuento}}
   Valido por 24 horas. Compra aqui: {{link_carrito}}"
```

**Kitz implementation:** Create a custom n8n workflow via `toolFactory_createFromDescription` that listens for cart abandonment webhooks, waits the configured delays, and fires template messages. The AI agent decides whether to include the discount based on customer LTV and margin analysis.

#### Post-Purchase Follow-Up

```
Immediately after purchase:
  "Gracias por tu compra, {{nombre}}!
   Tu pedido #{{numero_orden}} esta confirmado.
   Monto: {{moneda}}{{total}}
   Te avisaremos cuando este listo para envio/entrega."

When shipped:
  "{{nombre}}, tu pedido #{{numero_orden}} ya esta en camino!
   Numero de rastreo: {{tracking}}
   Seguilo aqui: {{link_tracking}}
   Llegada estimada: {{fecha_estimada}}"

3 days after delivery:
  "Hola {{nombre}}, como te fue con tu compra?
   Nos encantaria saber tu opinion.
   Dejanos una resena: {{link_resena}}
   Tu feedback nos ayuda a mejorar."

14 days after delivery:
  "{{nombre}}, basado en tu compra de {{producto}},
   creemos que te puede interesar: {{producto_recomendado}}
   {{descripcion_breve}}
   Precio especial para ti: {{moneda}}{{precio_especial}}"
```

**Kitz mapping:** The `order-status-notify` n8n template handles shipping notifications. The post-delivery review request and cross-sell recommendation require a new custom workflow. The AI agent selects product recommendations using CRM purchase history and catalog data.

#### Appointment Reminders

```
24 hours before:
  "Hola {{nombre}}, te recordamos tu cita manana:
   Servicio: {{tipo_servicio}}
   Fecha: {{fecha}}
   Hora: {{hora}}
   Lugar: {{direccion}}
   Responde CONFIRMAR o CAMBIAR."

2 hours before:
  "{{nombre}}, tu cita es en 2 horas:
   {{hora}} en {{lugar}}
   Te esperamos!"

After appointment:
  "Gracias por visitarnos, {{nombre}}.
   Como fue tu experiencia?
   1 - Excelente
   2 - Buena
   3 - Regular
   4 - Necesita mejorar
   Responde con el numero."
```

#### Payment Reminders (Collections)

```
3 days before due:
  "Hola {{nombre}}, te recordamos que tu factura #{{num_factura}}
   por {{moneda}}{{monto}} vence el {{fecha_vencimiento}}.
   Puedes pagar aqui: {{link_pago}}
   Gracias por tu puntualidad."

Due date:
  "{{nombre}}, tu factura #{{num_factura}} vence hoy.
   Monto: {{moneda}}{{monto}}
   Paga ahora: {{link_pago}}
   Si ya pagaste, ignora este mensaje."

3 days overdue:
  "{{nombre}}, tu factura #{{num_factura}} esta vencida
   desde el {{fecha_vencimiento}}.
   Monto pendiente: {{moneda}}{{monto}}
   Por favor, realiza el pago lo antes posible: {{link_pago}}
   Si tienes dudas, respondenos."

7 days overdue:
  "Estimado/a {{nombre}},
   Tenemos un saldo pendiente de {{moneda}}{{monto}}
   correspondiente a la factura #{{num_factura}}.
   Es importante regularizar esta situacion.
   Contactanos para coordinar el pago: {{telefono_negocio}}"
```

**Kitz mapping:** The `payment-reminder` n8n template handles the first two touches. Overdue escalation requires integration with `invoiceQuoteTools.ts` to check invoice status and the AI agent to adjust tone based on relationship history and amount.

#### Product Catalogs in WhatsApp

WhatsApp Business API supports product catalogs via the Commerce API:
- Up to 500 products per catalog
- Multi-Product Messages (up to 30 items per message)
- Single Product Messages (Product Detail Page format)
- Managed via Meta Commerce Manager or API sync

**Catalog sync flow:**
```
Kitz CRM (products/inventory)
  → Meta Commerce Manager API
    → WhatsApp Product Catalog
      → Interactive product messages in chats
```

**Kitz implementation:** A new `catalog_sync` tool should push product data from Kitz's CRM product records to Meta Commerce Manager. Price, availability, and descriptions stay in sync automatically via a scheduled n8n workflow.

#### Click-to-WhatsApp Links for Social Ads

Click-to-WhatsApp ads on Facebook and Instagram achieve 45-60% conversion rates -- dramatically higher than traditional landing pages. They reduce CAC by 30%+ while increasing engagement by 40%+.

**Link format:** `https://wa.me/{{phone_number}}?text={{encoded_message}}`

**Example for Instagram bio:**
```
https://wa.me/5219991234567?text=Hola%2C%20me%20interesa%20saber%20mas%20sobre%20sus%20productos
```

**Kitz implementation:** The content engine should auto-generate Click-to-Chat links for every social media post that includes a CTA. The `content-social-post` n8n workflow can append these links automatically.

### 1.3 WhatsApp Compliance

#### Opt-In Requirements

Meta requires explicit opt-in before sending any template messages. Key rules:

1. **Permission must be clear:** Users must actively agree to receive messages (not pre-checked boxes)
2. **Category-specific opt-in recommended:** Separate consent for marketing vs. transactional messages
3. **Channel-specific consent:** Opt-in for WhatsApp specifically, not just "communications"
4. **Record keeping:** Store proof of opt-in (timestamp, method, categories consented)

**Opt-in collection methods for LatAm SMBs:**

| Method | Implementation | Conversion Rate |
|---|---|---|
| Website form | Checkbox: "Quiero recibir ofertas por WhatsApp" | 15-25% |
| In-store QR code | Scan to save number + auto-message opt-in | 30-40% |
| Purchase confirmation | "Deseas recibir actualizaciones de tu pedido por WhatsApp?" | 60-70% |
| Instagram/Facebook ads | Click-to-WhatsApp with welcome flow | 45-60% |
| Physical receipt | Printed QR code + "Siguenos en WhatsApp" | 10-15% |
| WhatsApp Click-to-Chat link | Social bio links, email signatures | 20-30% |

#### Opt-Out Handling

Businesses must honor opt-out requests immediately. Standard keywords:

- **Spanish:** PARAR, DETENER, CANCELAR, NO, BASTA, SALIR
- **Portuguese (Brazil):** PARAR, CANCELAR, SAIR, NAO

**Kitz implementation:** The `outbound_sendWhatsApp` tool must check opt-out status before every send. An inbound message handler should detect opt-out keywords and automatically update CRM contact preferences. The n8n workflows must query opt-in status as the first step of any broadcast.

#### Anti-Spam Regulations by Country

| Country | Regulation | Key Requirements |
|---|---|---|
| **Mexico** | Ley Federal de Proteccion de Datos Personales (LFPDPPP) | Privacy notice (aviso de privacidad) required. Explicit consent for marketing. ARCO rights (access, rectification, cancellation, opposition) |
| **Brazil** | LGPD (Lei Geral de Protecao de Dados) | Consent must be specific and informed. Data subject rights similar to GDPR. DPO appointment required for large-scale processing |
| **Colombia** | Ley 1581 de 2012 + Decreto 1377 | Explicit authorization required. National Registry of Databases (RNBD). Prior authorization for commercial messages |
| **Argentina** | Ley 25.326 (Proteccion de Datos Personales) | Consent required. National registry. Right to access and delete data |
| **Chile** | Ley 19.628 + new Ley 21.719 (2024) | Modernized framework similar to GDPR. Explicit consent. New Data Protection Agency |
| **Peru** | Ley 29733 | Consent for data processing. Registration with APDP |

#### Message Frequency Best Practices

- **Marketing messages:** Maximum 1-2 per week
- **Transactional messages:** As needed (triggered by events)
- **Reminder messages:** Maximum 3 per event (before, day-of, follow-up)
- **Re-engagement:** Maximum 1 per month for inactive contacts

**Kitz enforcement:** The `campaign-broadcast-scheduled` workflow must include frequency capping logic. The AI agent should flag campaigns that would exceed recommended frequencies.

---

## 2. Instagram & Facebook Marketing

### 2.1 Instagram for LatAm SMBs

#### Platform Statistics (2025-2026)

- Instagram has 23.4% usage share for product research in LatAm
- Latin America leads globally in social commerce engagement
- Average daily social media usage in LatAm: 214 minutes (3.5+ hours)
- Instagram Reels are the primary growth driver for organic reach

#### Reels Strategy (Algorithm Priority)

The 2025-2026 Instagram algorithm prioritizes:
1. **DM Shares** (strongest signal -- content people share privately)
2. **Saves** (content people want to revisit)
3. **Total Watch Time** (how long people watch your Reel)
4. **Likes** and Comments (still matter but less than above)

**Two distribution systems:**
- **Connected reach:** Content shown to existing followers
- **Unconnected reach:** Content shown to non-followers via Reels, Explore, and recommendations

**Reels best practices for LatAm SMBs:**

| Element | Recommendation |
|---|---|
| **Hook** | First 3 seconds must grab attention. Start with a question or surprising statement |
| **Length** | 15-30 seconds for maximum completion rate |
| **Cuts** | New visual every 1-2 seconds |
| **Captions** | Always include -- many viewers watch without sound |
| **Language** | Use local Spanish/Portuguese, not formal Castilian |
| **Music** | Use trending native sounds for algorithm boost |
| **Frequency** | 3-4 Reels per week minimum |
| **Posting time** | See country-specific table below |

**Optimal content mix:**
- 3-4 Reels per week (growth driver)
- 2-3 Carousels per week (saves and shares)
- 1-2 Static posts per week (brand consistency)

#### Best Posting Times by Country

| Country | Instagram | Facebook | TikTok |
|---|---|---|---|
| **Mexico** | 6:00 PM (Fridays best) | 10:00 AM - 12:00 PM | 5:00 PM - 9:00 PM |
| **Colombia** | 6:00 PM (Thursdays best) | 11:00 AM - 1:00 PM | 6:00 PM - 9:00 PM |
| **Brazil** | 6:00 PM (daily) | 10:00 AM - 12:00 PM | 5:00 PM - 9:00 PM |
| **Argentina** | 8:00 PM (Thursdays best) | 12:00 PM - 2:00 PM | 7:00 PM - 10:00 PM |
| **Chile** | 7:00 PM (Wednesdays best) | 11:00 AM - 1:00 PM | 6:00 PM - 9:00 PM |
| **Peru** | 6:00 PM (Tuesdays best) | 10:00 AM - 12:00 PM | 5:00 PM - 8:00 PM |

*All times local. Always verify with Instagram Insights for your specific audience.*

**Kitz implementation:** The `content-social-post` workflow should use these defaults when scheduling, but the AI agent should adjust based on the business's own Instagram Insights data when available.

#### Stories Best Practices

| Feature | Use Case | Engagement Boost |
|---|---|---|
| **Polls** | "Cual prefieres? A o B" -- product decisions | 2-3x replies |
| **Questions** | "Que producto quieres ver?" -- market research | High DM volume |
| **Countdowns** | Launch dates, sale deadlines | Creates urgency |
| **Links** | Direct to WhatsApp chat or product page | Conversion driver |
| **Location tags** | Tag your city/neighborhood | Local discovery |
| **Mention tags** | Tag collaborators and customers | Cross-promotion |

#### Hashtag Strategy for Spanish-Language Markets

Instagram capped hashtags at 5 per post (December 2025 update by Adam Mosseri). Strategy: 80% niche hashtags + 20% trending.

**By industry (examples):**

| Industry | Niche Hashtags | Trending/Broad |
|---|---|---|
| **Restaurant** | #ComidaCasera, #RestauranteMX, #FoodieLocal | #ComidaMexicana |
| **Beauty/Salon** | #SalonDeBelleza, #UnasMX, #MakeupArtistCO | #BellezaLatina |
| **Retail/Fashion** | #ModaLatina, #TiendaOnline, #RopaColombiana | #StyleLatam |
| **Services** | #ContadorMX, #AbogadoCO, #ConsultoriaEmpresarial | #Emprendedores |
| **Fitness** | #GymMexico, #EntrenadorPersonal, #FitLatam | #VidaSaludable |

**Kitz implementation:** The content engine should maintain a hashtag database by industry and country, updated monthly. The `content-social-post` workflow auto-suggests 5 relevant hashtags per post.

#### Instagram Shopping Setup

Requirements for LatAm markets:
1. Business or Creator account
2. Connected to a Facebook Page
3. Product catalog in Meta Commerce Manager
4. Compliance with Meta commerce policies
5. Available in: Mexico, Brazil, Colombia, Argentina, Chile, Peru, and more

**Integration with Kitz:** Product catalog sync from Kitz CRM to Meta Commerce Manager enables both Instagram Shopping and WhatsApp Product Catalogs from a single source of truth.

#### Instagram DM Automation (Meta-Approved)

Meta permits automation for:
- Auto-replies to specific keywords
- Welcome messages for new followers
- Story mention thank-yous
- FAQ responses

**Kitz flow:**
```
Instagram DM received
  → Meta Graph API webhook
    → n8n workflow routes to Kitz
      → AI agent classifies intent
        → Auto-reply if FAQ
        → Route to WhatsApp if sales inquiry
        → Flag for human review if complex
```

### 2.2 Facebook for LatAm SMBs

#### Facebook Shops and Marketplace

- Facebook has 31% usage share for product research in LatAm
- Facebook Marketplace is dominant for C2C commerce in LatAm
- Facebook Groups remain highly active for local business communities

**Facebook Shops setup:**
1. Create shop in Meta Commerce Manager
2. Sync product catalog (same catalog as Instagram Shopping and WhatsApp)
3. Configure checkout flow (on-site or redirect to WhatsApp)
4. Enable Messenger for customer inquiries

#### Facebook Ads for LatAm SMBs

**Cost Benchmarks (2025-2026):**

| Metric | Global Average | LatAm Average | Brazil (E-commerce) |
|---|---|---|---|
| **CPC** | $1.11 | $0.40-$0.70 | $0.38 |
| **CPM** | $19.81 | $5.00-$12.00 | $6.00-$10.00 |
| **CTR** | 1.5% | 1.2-2.0% | 1.5-2.5% |

LatAm markets offer 50-65% lower CPCs than global averages, making them highly cost-effective for SMB advertising.

**Budget Recommendations for LatAm SMBs:**

| Business Size | Monthly Ad Budget (USD) | Expected Results |
|---|---|---|
| Micro (1-5 employees) | $100-$300 | 250-750 clicks, 5-15 leads |
| Small (5-20 employees) | $300-$800 | 750-2,000 clicks, 15-40 leads |
| Medium (20-50 employees) | $800-$2,000 | 2,000-5,000 clicks, 40-100 leads |

**Lead Generation Ads to WhatsApp Flow:**

The highest-performing ad format for LatAm SMBs combines Facebook/Instagram ads with Click-to-WhatsApp CTAs:

```
Facebook/Instagram Ad (awareness/interest)
  → "Enviar mensaje por WhatsApp" CTA button
    → WhatsApp conversation opens with pre-filled message
      → Kitz AI agent qualifies lead
        → CRM contact created with lead source tag
          → Drip sequence enrolled
```

This flow achieves 45-60% conversion rates vs. 2-5% for traditional landing page forms.

**Ad Targeting for LatAm:**

| Targeting Type | Best For | Example |
|---|---|---|
| **Interest-based** | Broad awareness | "Emprendedores", "Negocios", industry terms |
| **Custom audiences** | Retargeting | Website visitors, WhatsApp contacts, customer list |
| **Lookalike audiences** | Scaling | 1-3% lookalike of best customers |
| **Location + radius** | Local businesses | 5-15km radius around business location |
| **Demographic** | Segment-specific | Age, income bracket, education |

### 2.3 Meta Business Suite

Meta Business Suite provides free unified management for Facebook, Instagram, WhatsApp, and Messenger.

**Key features relevant to Kitz users:**

| Feature | Description | Kitz Integration |
|---|---|---|
| **Unified inbox** | Messages from FB, IG, WA, Messenger in one place | Mirrors Kitz CRM inbox |
| **Content scheduling** | Plan posts up to 75 days ahead with drag-and-drop calendar | `content-social-post` workflow can push drafts |
| **Analytics** | Engagement, reach, follower demographics | Feed into `campaign-performance-report` |
| **Automated replies** | Basic keyword-triggered responses | Kitz AI provides more sophisticated automation |
| **Ad management** | Create and manage ads across platforms | Budget tracking in Kitz dashboard |
| **AI optimization** | Auto-optimizes captions, creative, placement, bidding | Complement with Kitz content engine |

**Meta Graph API integration points for Kitz:**

```
Kitz Content Engine → Meta Graph API → Publish to FB/IG
Meta Graph API → Webhooks → Kitz n8n workflows (message received, comment, etc.)
Meta Commerce Manager → Product catalog sync → Kitz CRM products
Meta Insights API → Analytics data → Kitz performance reports
```

---

## 3. TikTok Marketing

### 3.1 TikTok in LatAm (2025-2026)

#### Usage Statistics

- 173.3 million TikTok users in Latin America (2025)
- Fastest-growing platform in the region, especially in older demographics
- Average session time: 52 minutes/day
- Primary content discovery platform for Gen Z and younger Millennials

#### TikTok Shop Availability in LatAm

| Country | Status (2026) | Features Available |
|---|---|---|
| **Mexico** | Fully launched (2023) | Affiliate programs, product tags, live shopping, in-app payments |
| **Brazil** | Fully launched (May 2025) | Full Shop features. $46.1M GMV by Aug 2025 (79.4% MoM growth) |
| **Colombia** | Confirmed for 2025 | Testing phase, affiliate programs |
| **Chile** | Testing phase | Limited rollout, affiliate programs |
| **Argentina** | Soft launch | Affiliate programs |
| **Peru** | Not yet available | Expected 2026 |

**Kitz opportunity:** For businesses in Mexico and Brazil, TikTok Shop is a live sales channel that Kitz should integrate for product catalog sync and order management.

#### Content Strategy for SMBs

**What works on TikTok for LatAm businesses:**

| Content Type | Description | Example |
|---|---|---|
| **Behind-the-scenes** | Show how products are made/services delivered | Bakery showing bread-making process |
| **Before/after** | Transformation content | Salon showing hair transformation |
| **Tutorials** | How to use your product | "Como usar nuestro producto en 3 pasos" |
| **Day in the life** | Owner's daily routine | "Un dia en mi restaurante" |
| **Trending sounds** | Participate in viral trends | Adapt trends to your business context |
| **Customer reactions** | Film customer receiving product | Unboxing, first taste, reveal |
| **Price reveals** | Show product with price at end | "Cuanto cuesta este platillo?" |

**Posting frequency:** 1-3 videos per day for growth, minimum 3-5 per week for consistency.

#### TikTok Ads Manager

**Available ad formats:**
- **In-Feed Ads:** Native video ads in For You feed
- **Spark Ads:** Boost existing organic content (best for SMBs)
- **Lead Generation:** Collect leads within TikTok
- **Website Conversions:** Drive traffic to external sites/WhatsApp

**Budget range for LatAm SMBs:** $20-$50/day minimum for Spark Ads. CPMs are generally lower than Facebook/Instagram in LatAm markets.

**Kitz integration path:** TikTok content creation via the `content-social-post` workflow, with AI agent generating TikTok-specific captions and hashtag suggestions. Future: TikTok Shop API integration for order sync.

---

## 4. Google Business Profile

> **Critical for local SMBs** -- When someone searches "restaurante cerca de mi" or "peluqueria en [city]", Google Business Profile determines who shows up. This is the #1 free marketing tool for location-based businesses.

### 4.1 GBP Optimization Checklist

#### Complete Profile Setup

Businesses with complete profiles are 2x more likely to be considered reputable. 80% of consumers do not trust businesses with inconsistent contact details.

**Mandatory fields:**

| Field | Tips | Example |
|---|---|---|
| **Business name** | Exact legal name, no keyword stuffing | "Cafe Roma" not "Cafe Roma - Mejor Cafe en Mexico" |
| **Category (primary)** | Most specific match available | "Colombian Restaurant" not just "Restaurant" |
| **Categories (secondary)** | Add 2-5 relevant secondary categories | "Takeout Restaurant", "Catering Service" |
| **Address** | Exact, consistent with all other listings (NAP) | Match website, social media, directories |
| **Phone** | Local number preferred, WhatsApp-enabled | Include country code |
| **Hours** | Including holidays and special hours | Update for every holiday |
| **Website** | If no website, use WhatsApp Click-to-Chat link | Kitz can generate a simple landing page |
| **Description** | 750 characters. Include keywords naturally in Spanish | Describe services, location, specialties |
| **Attributes** | All applicable (Wi-Fi, wheelchair access, payment methods, etc.) | Check every relevant attribute |

#### Photo Optimization

Businesses with photos receive:
- **42% more direction requests** than those without photos
- **35% more clicks to their website**

**Photo strategy:**

| Photo Type | Quantity | Tips |
|---|---|---|
| **Cover photo** | 1, updated quarterly | Best representation of your business |
| **Logo** | 1 | Clean, recognizable |
| **Interior** | 3-5 | Well-lit, during business hours |
| **Exterior** | 2-3 | Showing signage, entrance |
| **Products/Services** | 5-10 | Professional quality, no stock images |
| **Team** | 2-3 | Shows the human side |
| **Customer photos** | Encourage UGC | "Sube tu foto y etiquetanos" |

**Technical specs:** 1200x900 pixels recommended, JPG or PNG, under 5MB.

#### Google Posts Strategy

Post at least weekly. Post types:

| Type | Use Case | CTA Options |
|---|---|---|
| **Update** | News, announcements | Learn more, Sign up, Call now |
| **Offer** | Discounts, promotions | Redeem offer, Order online |
| **Event** | Upcoming events, classes | Book, Learn more |
| **Product** | Highlight specific products | Order now, Buy |

**Spanish-language post examples:**

```
[Offer Post]
Titulo: 20% de descuento en cortes de cabello
Descripcion: Este fin de semana celebramos nuestro aniversario.
Todos los cortes tienen 20% de descuento.
Reserva tu cita por WhatsApp: [link]
Valido: viernes a domingo.

[Update Post]
Titulo: Nuevo menu de temporada
Descripcion: Preparamos un menu especial con ingredientes frescos
de temporada. Ven a probar nuestros nuevos platillos.
Reservaciones: [telefono]
```

**Kitz integration:** A new `gbp_post` tool could auto-generate Google Posts from Kitz content engine drafts, maintaining consistent messaging across WhatsApp, social media, and GBP.

#### Review Management

Reviews are the #1 local SEO signal and trust builder.

**Review response templates in Spanish:**

```
Positive review (5 stars):
"Muchas gracias por tu resena, {{nombre}}! Nos alegra mucho que
hayas disfrutado {{detalle_especifico}}. Te esperamos pronto
de vuelta. Un saludo de todo el equipo de {{negocio}}."

Neutral review (3-4 stars):
"Gracias por tu opinion, {{nombre}}. Valoramos mucho tu feedback.
Nos encantaria mejorar tu experiencia la proxima vez.
Contactanos al {{telefono}} para cualquier sugerencia."

Negative review (1-2 stars):
"Lamentamos mucho tu experiencia, {{nombre}}. Esto no refleja el
servicio que queremos ofrecer. Nos gustaria resolver esta
situacion personalmente. Por favor, contactanos al {{telefono}}
o por WhatsApp para solucionarlo."
```

**Kitz AI agent role:** Automatically draft review responses using the templates above, personalized based on review content. Queue for owner approval before posting (draft-first pattern).

### 4.2 Google Ads for Local LatAm

#### Local Services Ads

- Pay-per-lead model (only pay when customers contact you)
- Average cost per lead: $15-$100 depending on industry
- Currently limited availability in LatAm (mainly available via standard Google Ads)

#### Google Maps Advertising

Standard Google Ads with location extensions appear on Google Maps searches. Highly effective for local businesses.

**Budget recommendations for LatAm SMBs:**

| Tier | Monthly Budget (USD) | Strategy |
|---|---|---|
| **Starter** | $150-$400 | Location-based keywords only, 5km radius |
| **Growth** | $400-$1,000 | Expanded keywords + competitor terms |
| **Scale** | $1,000-$3,000 | Full keyword coverage + display remarketing |

**LatAm Google Ads CPCs** tend to be 40-60% lower than US rates, making them accessible for micro-businesses.

---

## 5. SEO in Spanish

### 5.1 Regional Keyword Variations

This is the most overlooked aspect of digital marketing for LatAm businesses. The same product or service uses different terms across countries.

**Critical vocabulary differences:**

| Concept | Mexico | Colombia | Argentina | Chile | Brazil (PT) |
|---|---|---|---|---|---|
| Car | Carro | Carro | Auto | Auto | Carro |
| Bus | Camion/Autobus | Bus | Colectivo | Micro/Bus | Onibus |
| T-shirt | Playera | Camiseta | Remera | Polera | Camiseta |
| Apartment | Departamento | Apartamento | Departamento | Departamento | Apartamento |
| Computer | Computadora | Computador | Computadora | Computador | Computador |
| Cell phone | Celular | Celular | Celular | Celular | Celular |
| Lawyer | Abogado | Abogado | Abogado | Abogado | Advogado |
| Store | Tienda | Tienda | Negocio/Local | Tienda/Local | Loja |
| Cheap | Barato | Barato/Economico | Barato | Barato | Barato |
| Cool/Great | Padre/Chido | Chevere/Bacano | Copado/Piola | Bakán/Filete | Legal/Massa |
| Money | Lana/Varo | Plata | Guita/Plata | Lucas/Plata | Grana/Dinheiro |
| Wi-Fi coffee shop | Cafe con WiFi | Cafe WiFi | Cafe WiFi | Cafe con WiFi | Cafe WiFi gratis |

**Kitz implementation:** The content engine must maintain a country-specific synonym dictionary. When generating SEO content, the AI agent should use the `language` and `country` fields from the business profile to select appropriate regional vocabulary.

### 5.2 Keyword Research Tools

| Tool | Free/Paid | Spanish Support | Best For |
|---|---|---|---|
| **Google Keyword Planner** | Free (with Ads account) | Full, by country | Volume and competition data |
| **Ubersuggest** | Freemium | Good | Long-tail keyword ideas |
| **SEMrush** | Paid ($119+/mo) | Full, by country | Competitor analysis |
| **Ahrefs** | Paid ($99+/mo) | Full, by country | Backlink analysis + keywords |
| **Google Trends** | Free | Full | Seasonal trends, regional interest |
| **Ranktracker** | Paid | Good | Spanish keyword tracking |
| **Google Search Console** | Free | Full | Actual search queries driving traffic |
| **AnswerThePublic** | Freemium | Spanish queries | Question-based keywords |

**Kitz AI agent approach:** For SMBs that cannot afford paid SEO tools, the AI agent can:
1. Use Google Keyword Planner data (free) to suggest keywords
2. Analyze Google Search Console data from the business's website
3. Generate keyword-optimized content using regional vocabulary
4. Monitor basic rankings via automated search queries

### 5.3 Local SEO for Spanish-Speaking Markets

**Local SEO ranking factors (2025-2026):**

1. **Google Business Profile** optimization (see Section 4)
2. **NAP consistency** across all online directories
3. **Local citations** in country-specific directories
4. **Reviews** quantity, quality, and recency
5. **On-page SEO** with local keywords
6. **Mobile-first** design (critical -- most LatAm users are mobile-first)
7. **Schema markup** (LocalBusiness, Product, FAQ)

**Country-specific directory listings:**

| Country | Key Directories |
|---|---|
| **Mexico** | Seccion Amarilla, MercadoLibre, INE business registry |
| **Colombia** | Paginas Amarillas, Directorio de Empresas, Camara de Comercio |
| **Argentina** | Paginas Amarillas, MercadoLibre, AFIP registry |
| **Brazil** | Paginas Amarelas, Google Meu Negocio, MercadoLivre |
| **Chile** | Amarillas, MercadoLibre, SII registry |
| **Peru** | Paginas Amarillas, MercadoLibre, SUNAT registry |

### 5.4 Technical SEO Checklist

```
[ ] Mobile-responsive design (required -- 70%+ LatAm traffic is mobile)
[ ] Page speed < 3 seconds on 3G connections (LatAm has varied connectivity)
[ ] SSL certificate (HTTPS)
[ ] hreflang tags for country targeting (es-MX, es-CO, es-AR, pt-BR)
[ ] Schema markup: LocalBusiness, Product, FAQ, Review
[ ] XML sitemap submitted to Google Search Console
[ ] Robots.txt properly configured
[ ] Meta titles and descriptions in local Spanish/Portuguese
[ ] Image alt text in target language
[ ] Clean URL structure with Spanish/Portuguese slugs
[ ] Internal linking with natural anchor text
[ ] 404 page with Spanish/Portuguese messaging
[ ] Canonical tags to avoid duplicate content
[ ] Core Web Vitals passing (LCP < 2.5s, FID < 100ms, CLS < 0.1)
```

### 5.5 Voice Search Optimization

Voice search is growing rapidly in LatAm, with nearly 50% of voice searches having local intent ("near me" queries). 57% of businesses have optimized for voice search in 2025.

**Voice search optimization for Spanish:**

| Strategy | Implementation |
|---|---|
| **Conversational keywords** | "Donde puedo encontrar..." instead of "tienda zapatos" |
| **Question-based content** | "Cuanto cuesta...", "Como llegar a...", "Que horario tiene..." |
| **FAQ schema** | Structured Q&A for Google to pull voice answers |
| **Local intent** | Include neighborhood, city, landmark references |
| **Natural language** | Write content as people speak, not formal writing |
| **Featured snippet optimization** | Direct answers in the first paragraph |

**Kitz implementation:** The content engine should generate FAQ sections for business websites optimized for voice search queries in the local Spanish variant.

### 5.6 YouTube SEO

YouTube is the #2 search engine globally and heavily used in LatAm for product research (28.7% of LatAm consumers use it for product discovery).

**YouTube SEO for LatAm SMBs:**

| Element | Best Practice |
|---|---|
| **Title** | Keyword-first, under 60 characters, in local Spanish |
| **Description** | 200+ words, keywords in first 2 sentences, WhatsApp link |
| **Tags** | 5-10 relevant tags in Spanish, include regional variants |
| **Thumbnail** | Custom, high-contrast, text overlay in Spanish |
| **Chapters** | Timestamps for key sections |
| **Cards/End screens** | Link to related videos and WhatsApp |
| **Captions** | Auto-generate + edit for accuracy (also helps SEO) |

---

## 6. Customer Acquisition Cost (CAC) Benchmarks

### 6.1 CAC by Channel

| Channel | Typical CAC (LatAm SMB) | Time to Convert | Scalability |
|---|---|---|---|
| **Organic WhatsApp** (word of mouth) | $0-$5 | 1-7 days | Low (limited by network) |
| **WhatsApp referral program** | $5-$15 | 1-3 days | Medium |
| **Organic Instagram/TikTok** | $10-$30 | 7-30 days | Medium (content effort) |
| **Google Business Profile** | $0-$10 | 1-14 days | Medium (local only) |
| **Facebook/Instagram Ads** | $15-$50 | 1-14 days | High |
| **Click-to-WhatsApp Ads** | $8-$25 | 1-3 days | High (best ROI) |
| **Google Ads (Search)** | $20-$80 | 1-7 days | High |
| **TikTok Ads** | $10-$40 | 7-14 days | High (growing) |
| **Influencer marketing** | $15-$60 | 7-30 days | Medium |
| **Email marketing** | $5-$20 | 7-30 days | Medium |

### 6.2 CAC by Industry (LatAm Context)

| Industry | Average CAC | Top Quartile CAC | Notes |
|---|---|---|---|
| **Restaurant/Food** | $5-$20 | $2-$8 | Lowest CAC, high repeat purchase |
| **Beauty/Salon** | $10-$30 | $5-$15 | Strong referral economics |
| **Retail/Fashion** | $15-$50 | $8-$25 | Ecommerce higher than local |
| **Professional services** | $50-$150 | $25-$75 | Longer sales cycles |
| **Health/Fitness** | $20-$60 | $10-$30 | Seasonal variation |
| **Education/Tutoring** | $30-$80 | $15-$40 | Word of mouth dominant |
| **B2B services** | $100-$300 | $50-$150 | Highest but highest LTV |
| **Home services** | $25-$70 | $12-$35 | Google Ads + referral dominant |

### 6.3 LTV:CAC Ratio Targets

The healthy benchmark across all industries is **3:1 to 4:1** (earn $3-$4 for every $1 spent on acquisition).

| Ratio | Interpretation | Action |
|---|---|---|
| **< 1:1** | Losing money on every customer | Immediately reduce spend or increase prices |
| **1:1 - 2:1** | Breaking even or slight profit | Optimize funnel, improve retention |
| **3:1** | Healthy, sustainable growth | Maintain and scale |
| **4:1 - 5:1** | Excellent unit economics | Invest more in acquisition |
| **> 5:1** | May be under-investing in growth | Increase marketing spend |

**Kitz CAC tracking implementation:**

```
Data sources:
  - Ad spend → Meta Ads API, Google Ads API
  - WhatsApp message costs → Meta Cloud API billing
  - Content costs → Kitz content engine usage
  - New customers → CRM contact creation with source tag

Calculation:
  CAC = Total marketing spend (period) / New customers acquired (period)

By channel:
  CAC_channel = Channel spend (period) / New customers from channel (period)

Kitz tools involved:
  - `campaign-performance-report` n8n workflow (daily aggregation)
  - CRM contact tagging with lead_source field
  - AI agent analysis and recommendations
```

### 6.4 How Kitz AI Optimizes CAC

| Optimization | Mechanism | Expected Impact |
|---|---|---|
| **Channel mix optimization** | AI analyzes CAC by channel and recommends budget shifts | 15-25% CAC reduction |
| **Message timing optimization** | Send at highest-engagement times per contact | 10-15% conversion improvement |
| **Content personalization** | AI tailors messages to individual contact context | 20-30% higher response rates |
| **Lead scoring** | Claude Haiku scores leads to focus on high-intent | 30-40% more efficient sales effort |
| **Automated follow-up** | n8n workflows ensure no lead is forgotten | 25-35% more conversions from existing leads |
| **A/B testing** | AI generates message variants, tracks performance | 10-20% continuous improvement |

---

## 7. Sales Funnel Templates

### 7.1 Service Business Funnel

> **For:** Salons, consultants, accountants, lawyers, fitness trainers, mechanics, cleaning services, tutors

#### Stages

```
Discovery → Consultation → Proposal → Close → Deliver → Upsell/Retain
```

| Stage | Definition | Key Metric | Benchmark | Kitz Pipeline Tag |
|---|---|---|---|---|
| **Discovery** | Prospect finds business (search, social, referral) | Impressions/Reach | Varies by channel | `funnel:discovery` |
| **Consultation** | First meaningful conversation (WhatsApp chat, call) | Consultation rate | 15-25% of discoveries | `funnel:consultation` |
| **Proposal** | Quote or service proposal sent | Proposal sent rate | 60-80% of consultations | `funnel:proposal` |
| **Close** | Customer accepts and pays/schedules | Close rate | 30-50% of proposals | `funnel:closed` |
| **Deliver** | Service delivered | Completion rate | 90-95% | `funnel:delivered` |
| **Upsell/Retain** | Repeat booking or additional service | Repeat rate | 30-50% target | `funnel:retained` |

**Overall funnel conversion: 2-6% from Discovery to Close**

#### WhatsApp-Native Workflow

```
Stage 1: Discovery
  Instagram post/ad → Click-to-WhatsApp link
  Google search → GBP → WhatsApp click-to-chat

Stage 2: Consultation
  WhatsApp auto-greeting:
  "Hola! Bienvenido/a a {{negocio}}. Soy {{nombre_agente}}.
   En que te puedo ayudar?
   1 - Conocer nuestros servicios
   2 - Agendar una cita
   3 - Pedir una cotizacion
   4 - Hablar con alguien"

  → Kitz AI agent qualifies and routes

Stage 3: Proposal
  Kitz AI generates quote via `quote_create`:
  "{{nombre}}, aqui tienes tu cotizacion:
   Servicio: {{servicio}}
   Precio: {{moneda}}{{precio}}
   Incluye: {{descripcion_detallada}}
   Valido hasta: {{fecha}}
   Responde ACEPTAR para confirmar."

Stage 4: Close
  Customer replies ACEPTAR →
  `quote_toInvoice` converts quote to invoice →
  Payment link sent via WhatsApp:
  "Excelente, {{nombre}}! Aqui tienes el link de pago:
   {{link_pago}}
   Una vez confirmado, te enviamos la confirmacion de tu cita."

Stage 5: Deliver
  Appointment reminder sequence (see Section 1.2)
  Post-service feedback collection

Stage 6: Upsell/Retain
  14 days later:
  "Hola {{nombre}}, como te fue con {{servicio}}?
   Tenemos una promocion especial en {{servicio_relacionado}}:
   {{descripcion_oferta}}
   Quieres agendar?"
```

**Kitz automation triggers:**
- CRM contact moves to `funnel:consultation` → AI agent generates personalized greeting
- CRM contact moves to `funnel:proposal` → `quote_create` tool generates and sends quote
- Quote accepted → `quote_toInvoice` + payment link + appointment scheduling
- Service delivered → 3-day delay → review request + 14-day delay → upsell message

### 7.2 Retail/E-commerce Funnel

> **For:** Clothing stores, food/beverage, electronics, artisan goods, specialty retail, online shops

#### Stages

```
Awareness → Interest → Cart → Purchase → Repeat → Advocate
```

| Stage | Definition | Key Metric | Benchmark | Kitz Pipeline Tag |
|---|---|---|---|---|
| **Awareness** | Prospect sees brand (ad, post, search) | Reach/Impressions | CPM $5-$12 (LatAm) | `funnel:awareness` |
| **Interest** | Engages (click, visit, save, share) | CTR | 1.5-2.5% (LatAm) | `funnel:interest` |
| **Cart** | Adds product to cart or inquires | Add-to-cart rate | 8-12% of visitors | `funnel:cart` |
| **Purchase** | Completes transaction | Conversion rate | 1.9-3% (ecommerce avg) | `funnel:purchased` |
| **Repeat** | Buys again within 90 days | Repeat purchase rate | 20-30% target | `funnel:repeat` |
| **Advocate** | Refers others, leaves reviews | NPS/Referral rate | 10-20% target | `funnel:advocate` |

#### Instagram to WhatsApp to Payment Flow

```
Stage 1: Awareness
  Instagram Reel showing product →
  Caption: "Disponible ahora! Escríbenos por WhatsApp para pedir."
  → wa.me link in bio

Stage 2: Interest
  WhatsApp catalog message:
  "Hola! Mira nuestros productos mas populares:"
  → Multi-Product Message (up to 30 items)
  → Customer browses catalog in WhatsApp

Stage 3: Cart
  Customer selects products →
  "Perfecto! Tu seleccion:
   1x {{producto_1}} - {{moneda}}{{precio_1}}
   2x {{producto_2}} - {{moneda}}{{precio_2}}
   Subtotal: {{moneda}}{{subtotal}}
   Envio: {{moneda}}{{envio}}
   Total: {{moneda}}{{total}}
   Confirmas tu pedido?"

Stage 4: Purchase
  Customer confirms →
  `invoice_create` generates invoice →
  Payment link or payment instructions sent:
  "Aqui tienes tu factura y link de pago:
   {{link_pago}}
   Metodos aceptados: {{metodos_pago}}
   Tu pedido sera procesado al recibir el pago."

Stage 5: Repeat
  Post-purchase sequence (Section 1.2) →
  Cross-sell recommendations via AI agent →
  VIP group invitation for repeat buyers

Stage 6: Advocate
  "{{nombre}}, refiere a un amigo y ambos reciben
   {{descuento}}% de descuento en su proxima compra.
   Comparte este link: {{link_referido}}"
```

**Cart abandonment recovery:** If customer browsed catalog but did not purchase within 1 hour, trigger abandoned cart sequence (Section 1.2).

### 7.3 B2B Funnel

> **For:** Consultants, agencies, accountants, lawyers, IT services, distributors, suppliers

#### Stages

```
Lead → Qualify → Demo/Meeting → Proposal → Negotiate → Close → Expand
```

| Stage | Definition | Key Metric | Benchmark | Kitz Pipeline Tag |
|---|---|---|---|---|
| **Lead** | Initial inquiry or inbound contact | Lead volume | Varies | `funnel:lead` |
| **Qualify** | Confirmed budget, authority, need, timeline | MQL→SQL rate | 15-21% (B2B avg) | `funnel:qualified` |
| **Demo/Meeting** | Presentation or discovery meeting | Demo rate | 40-60% of qualified | `funnel:demo` |
| **Proposal** | Formal proposal sent | Proposal rate | 70-80% of demos | `funnel:proposal` |
| **Negotiate** | Price/terms discussion | - | - | `funnel:negotiating` |
| **Close** | Contract signed, payment received | Win rate | 20-35% of proposals | `funnel:closed-won` |
| **Expand** | Upsell, cross-sell, renewal | Expansion rate | 15-25% | `funnel:expansion` |

#### LinkedIn + WhatsApp Workflow

```
Stage 1: Lead
  LinkedIn content → profile visit → connection request
  OR: Google Ads → landing page → WhatsApp CTA
  OR: Referral from existing client

Stage 2: Qualify
  WhatsApp qualification sequence:
  "Hola {{nombre}}, gracias por tu interes en {{servicio}}.
   Para darte la mejor asesoria, me cuentas:
   1. Que tipo de negocio tienes?
   2. Cuantos empleados tienen?
   3. Cual es el principal reto que quieres resolver?
   4. Tienes un presupuesto estimado?"

  → Kitz AI agent (Claude Haiku) scores lead based on responses
  → Tags: lead_score:high/medium/low, industry, size

Stage 3: Demo/Meeting
  "{{nombre}}, basado en lo que me compartes, creo que podemos
   ayudarte con {{solucion_especifica}}.
   Te gustaria agendar una reunion para mostrarte como funciona?
   Horarios disponibles: {{slots}}
   Responde con tu preferencia."

Stage 4: Proposal
  Kitz `quote_create` generates detailed proposal →
  `content_preview` shows branded PDF in CanvasPreview →
  Owner reviews and approves →
  `content_ship` delivers via WhatsApp/Email

Stage 5: Negotiate
  AI agent assists with:
  - Objection handling suggestions
  - Discount authorization within pre-set limits
  - Alternative package recommendations

Stage 6: Close
  "Excelente, {{nombre}}! Preparamos tu contrato.
   Te lo envio por WhatsApp para firma digital.
   Una vez firmado, generamos tu primera factura
   y comenzamos a trabajar."

  → `invoice_create` + payment processing

Stage 7: Expand
  Quarterly check-in:
  "Hola {{nombre}}, han pasado 3 meses desde que empezamos.
   Como va todo? Me gustaria revisar contigo los resultados
   y ver si hay algo mas en lo que te podamos apoyar."
```

### 7.4 Funnel Templates -- Automation Triggers for Kitz AI Agents

**Universal triggers across all funnels:**

| Trigger | n8n Workflow | AI Agent Action | Tool Used |
|---|---|---|---|
| New contact created in CRM | `lead-welcome-onboard` | Personalized welcome message | `outbound_sendWhatsApp` |
| Contact inactive 3+ days | `lead-followup` | Follow-up message based on last interaction | `outbound_sendWhatsApp` |
| Contact inactive 14+ days | `lead-reactivation` | Re-engagement offer | `outbound_sendWhatsApp` + `email_compose` |
| Quote sent, no response 48h | Custom workflow | Follow-up with value reinforcement | `outbound_sendWhatsApp` |
| Quote accepted | Custom workflow | Convert to invoice, send payment link | `quote_toInvoice` + `invoice_send` |
| Invoice overdue | `payment-reminder` | Escalating payment reminders | `outbound_sendWhatsApp` |
| Purchase completed | `order-status-notify` | Confirmation + shipping updates | `outbound_sendWhatsApp` |
| 3 days post-delivery | Custom workflow | Review request | `outbound_sendWhatsApp` |
| 14 days post-delivery | Custom workflow | Cross-sell recommendation | `outbound_sendWhatsApp` |
| Contact refers someone | Custom workflow | Thank referrer + welcome new lead | `outbound_sendWhatsApp` |
| Daily 8am | `daily-summary` | Business stats briefing to owner | `outbound_sendWhatsApp` |
| Daily 6pm | `campaign-performance-report` | Marketing performance summary | `outbound_sendWhatsApp` |

**Spanish-language templates for each funnel touchpoint:**

```
[Lead Welcome - Service]
"Hola {{nombre}}! Bienvenido/a a {{negocio}}.
Somos especialistas en {{servicio_principal}}.
En que te puedo ayudar hoy?"

[Lead Welcome - Retail]
"Hola {{nombre}}! Gracias por escribirnos.
Mira nuestro catalogo de productos: [catalogo]
Algo en particular que te interese?"

[Lead Welcome - B2B]
"Hola {{nombre}}, gracias por contactar a {{negocio}}.
Ayudamos a empresas como la tuya con {{propuesta_valor}}.
Me cuentas un poco de tu negocio para asesorarte mejor?"

[Follow-Up - Universal]
"Hola {{nombre}}, soy {{agente}} de {{negocio}}.
Queria dar seguimiento a nuestra conversacion.
Tienes alguna duda o pregunta adicional?"

[Quote Follow-Up]
"{{nombre}}, te enviamos una cotizacion hace unos dias.
La pudiste revisar? Con gusto te aclaro cualquier duda.
Recuerda que es valida hasta {{fecha_vencimiento}}."

[Payment Confirmation]
"{{nombre}}, confirmamos tu pago de {{moneda}}{{monto}}.
Factura #{{num_factura}} pagada.
Gracias por tu confianza en {{negocio}}."

[Review Request]
"{{nombre}}, tu opinion es muy importante para nosotros.
Nos ayudas con una resena rapida?
Solo toma 1 minuto: {{link_resena}}
Muchas gracias!"

[Referral Request]
"{{nombre}}, nos alegra que hayas tenido una buena experiencia.
Conoces a alguien que tambien pueda beneficiarse?
Comparte este link y ambos reciben un beneficio:
{{link_referido}}"

[Win-Back]
"Hola {{nombre}}, hace tiempo que no nos visitas.
Te extrañamos en {{negocio}}.
Tenemos algo nuevo que te puede interesar:
{{novedad}}
Respondenos para saber mas."
```

---

## 8. Kitz Integration Map

### 8.1 Existing Tools and Marketing Workflow Connections

| Kitz Tool/System | Marketing Application | Section Reference |
|---|---|---|
| `outbound_sendWhatsApp` | All WhatsApp marketing, drip campaigns, broadcasts | Section 1 |
| `outbound_sendVoiceNote` | Voice note follow-ups in drip sequences | Section 1.2 |
| `voice_speak` (ElevenLabs TTS) | Personalized voice greetings, VIP customer outreach | Section 1.2 |
| `email_compose` | Multi-channel drip campaigns, formal proposals | Section 7 |
| `invoice_create` / `invoice_send` | Post-purchase flow, payment collection | Section 7.2, 7.3 |
| `quote_create` / `quote_toInvoice` | Service and B2B funnel proposal stage | Section 7.1, 7.3 |
| `brand_setup` / `brand_get` | Consistent branding across all marketing content | Section 2, 4 |
| `content_preview` / `content_edit` / `content_ship` | Content creation, review, and multi-channel delivery | All sections |
| `toolFactory_createFromTemplate` | Deploy marketing automation workflows | Section 1.2 |
| `toolFactory_createFromDescription` | Custom automation for unique business needs | Section 1.2, 7.4 |
| CRM contact management | Lead tracking, segmentation, pipeline management | Section 6, 7 |
| CRM product records | Catalog sync to WhatsApp, Instagram, Facebook | Section 1.2, 2.1 |

### 8.2 n8n Marketing Workflow Templates

| Template | Marketing Use Case | Channels |
|---|---|---|
| `lead-nurture-sequence` | Welcome drip, value delivery, first offer | WA + Email + SMS |
| `lead-welcome-onboard` | New customer onboarding | WA + Voice |
| `lead-reactivation` | Win-back inactive contacts | WA + Email |
| `content-social-post` | Social media content creation and scheduling | WA (delivery) |
| `content-campaign-copy` | Multi-channel campaign copywriting | Email + WA + SMS |
| `content-translate` | Multilingual content for Brazil/LatAm | All |
| `campaign-multi-touch` | Full funnel multi-channel campaign | WA + Email + Voice + SMS |
| `campaign-broadcast-scheduled` | Segmented broadcast with personalization | WA + SMS |
| `campaign-performance-report` | Daily marketing analytics to owner | WA |
| `lead-followup` | Automated CRM-based lead follow-up | WA |
| `order-status-notify` | Post-purchase notifications | WA |
| `payment-reminder` | Invoice collection reminders | WA |
| `new-lead-welcome` | New contact welcome + CRM creation | WA |
| `daily-summary` | Morning business briefing | WA |

### 8.3 Recommended New Tools for Marketing

| Proposed Tool | Description | Priority |
|---|---|---|
| `catalog_sync` | Sync Kitz CRM products to Meta Commerce Manager (WhatsApp + Instagram + Facebook catalogs) | High |
| `gbp_post` | Create and publish Google Business Profile posts from Kitz content engine | High |
| `gbp_review_respond` | Draft and post review responses via Google Business API | Medium |
| `social_schedule` | Schedule posts to Instagram/Facebook via Meta Graph API | High |
| `hashtag_suggest` | AI-powered hashtag suggestions by industry, country, and language | Medium |
| `cac_calculate` | Calculate CAC by channel and period from CRM + ad spend data | Medium |
| `funnel_report` | Generate funnel conversion report by pipeline stage | High |
| `ab_test_create` | Create A/B test variants for WhatsApp template messages | Medium |
| `referral_link_create` | Generate trackable referral links for customer advocacy programs | Medium |

### 8.4 The 80/20 Split Applied to Digital Marketing

Following Kitz's core architecture principle:

**80% Automated (n8n workflows):**
- Message scheduling and delivery
- CRM stage updates and tagging
- Template message rendering
- Broadcast execution with frequency capping
- Catalog sync scheduling
- Performance data collection
- Payment reminder sequences
- Opt-in/opt-out status management

**20% AI Agent (Claude models):**
- Content generation and personalization (Claude Sonnet)
- Lead scoring and qualification (Claude Haiku)
- Review response drafting (Claude Haiku)
- A/B variant creation (Claude Sonnet)
- Channel mix optimization recommendations
- Exception handling (unusual customer requests)
- Performance analysis and strategic recommendations
- Regional vocabulary adaptation per country

---

## 9. Appendix: Reference Links

### WhatsApp Business Platform
- [WhatsApp Business Platform Pricing](https://business.whatsapp.com/products/platform-pricing)
- [WhatsApp Business Policy](https://business.whatsapp.com/policy)
- [WhatsApp Ads that Click to WhatsApp](https://business.whatsapp.com/products/ads-that-click-to-whatsapp)
- [WhatsApp API Pricing 2026 Complete Guide](https://flowcall.co/blog/whatsapp-business-api-pricing-2026)
- [WhatsApp Marketing Guide 2026 -- ActiveCampaign](https://www.activecampaign.com/blog/whatsapp-guide)
- [WhatsApp Opt-In Rules -- WUSeller](https://www.wuseller.com/whatsapp-business-knowledge-hub/whatsapp-business-opt-in-rules-prevent-bans-grow-lists/)
- [WhatsApp Template Categories -- Sanuker](https://sanuker.com/guideline-to-whatsapp-template-message-categories/)
- [WhatsApp Catalog API Guide -- Zixflow](https://zixflow.com/blog/whatsapp-catalog-api-for-ecommerce/)
- [WhatsApp Marketing -- Salesforce](https://www.salesforce.com/marketing/whatsapp-marketing/)

### Social Media and Advertising
- [Social Media Platforms in Latin America -- Awisee](https://awisee.com/blog/social-media-platforms-in-latin-america/)
- [Social Media Usage in LatAm -- Statista](https://www.statista.com/topics/6394/social-media-usage-in-latin-america/)
- [Facebook Ads Benchmarks 2025 -- WordStream](https://www.wordstream.com/blog/facebook-ads-benchmarks-2025)
- [Facebook Ads CPC Benchmarks -- SuperAds](https://www.superads.ai/facebook-ads-costs/cpc-cost-per-click)
- [Instagram Algorithm 2026 -- Hootsuite](https://blog.hootsuite.com/instagram-algorithm/)
- [Instagram Reels Reach Guide -- TrueFuture Media](https://www.truefuturemedia.com/articles/instagram-reels-reach-2026-business-growth-guide)
- [Best Time to Post on Instagram by Country -- Mention](https://mention.com/en/blog/best-time-to-post-on-instagram-2023/)
- [Best Times to Post on Social Media -- Sprout Social](https://sproutsocial.com/insights/best-times-to-post-on-social-media/)
- [Meta Business Suite Features -- WhiteBunnie](https://whitebunnie.com/blog/introduction-to-meta-business-suite-overview-features/)
- [Click-to-WhatsApp Ads Guide -- WANotifier](https://wanotifier.com/click-to-whatsapp-ads-guide/)

### TikTok
- [TikTok Shop Across LatAm -- M2E Cloud](https://blog.m2ecloud.com/tiktok-shop-across-latam-where-it-s-live-and-what-s-coming/)
- [TikTok Shop in Latin America 2025 -- Awisee](https://awisee.com/blog/tiktok-shop-in-latin-america/)
- [TikTok Shop Countries List 2025 -- DPL](https://dpl.company/countries-with-access-to-tiktok-shop-seller-center/)
- [TikTok Shop Mexico Expansion -- eMarketer](https://www.emarketer.com/content/tiktok-shop-launch-mexico-latin-america-expansion)

### Local SEO and Google
- [Google Business Profile Optimization -- Localo](https://localo.com/blog/google-business-profile-optimization)
- [Local SEO Google My Business Guide -- SEO Space](https://www.seospace.co/blog/local-seo-google-my-business)
- [Google Business Profile SEO Tips -- ZAG Interactive](https://www.zaginteractive.com/insights/june-2025/8-tips-to-improve-your-google-business-profile-seo)
- [Google Local Services Ads Cost Guide -- Accelerate Your Marketing](https://accelerateyourmarketing.com/blog/google-local-service-ads/google-local-service-ads-cost-2/)

### SEO in Spanish
- [Complete Guide to SEO in Spanish -- RankTracker](https://www.ranktracker.com/blog/a-complete-guide-for-doing-seo-in-spanish/)
- [SEO in South America 2025 -- AppLabX](https://blog.applabx.com/a-complete-guide-to-seo-in-south-america-in-2025/)
- [Multilingual SEO for LatAm -- Key Content](https://keycontent.com/mastering-multilingual-seo-strategies-for-latam/)
- [SEO in Latin America Complete Guide -- Blue Things](https://www.bluethings.co/blog/seo-in-latin-america-complete-guide)
- [Spanish SEO Services -- Maria Alonso](https://maria-alonso.com/spanish-seo-services/)

### CAC and Benchmarks
- [CAC Benchmarks -- Genesys Growth](https://genesysgrowth.com/blog/customer-acquisition-cost-benchmarks-for-marketing-leaders)
- [Average CAC by Industry -- DiMarketo](https://dimarketo.com/blog/average-cac/)
- [Sales Funnel Conversion Benchmarks -- First Page Sage](https://firstpagesage.com/seo-blog/sales-funnel-conversion-rate-benchmarks-2025-report/)
- [Ecommerce Conversion Rate Benchmarks -- Smart Insights](https://www.smartinsights.com/ecommerce/ecommerce-analytics/ecommerce-conversion-rates/)
- [Cart Abandonment Statistics -- Baymard](https://baymard.com/lists/cart-abandonment-rate)

### Voice Search
- [Voice Search Statistics 2025 -- Marketing LTB](https://marketingltb.com/blog/statistics/voice-search-statistics/)
- [Voice Search SEO Guide -- Synup](https://www.synup.com/en/voice-search-statistics)

---

*This document is maintained by the Kitz intelligence team. Data points should be verified quarterly as platform pricing, algorithms, and regulations change frequently. All Spanish-language templates should be reviewed by native speakers for regional appropriateness before deployment in each market.*
