# WhatsApp Commerce & Conversational Sales Intelligence

**Document type:** Strategic Intelligence Brief
**Last updated:** 2026-02-25
**Status:** Living document -- update as Meta API evolves and Kitz tools expand
**Audience:** Kitz platform -- AI agents, semantic router, WhatsApp connector, and SMB owners

---

## Table of Contents

1. [WhatsApp Business API Architecture](#1-whatsapp-business-api-architecture)
2. [Catalog API & Product Messages](#2-catalog-api--product-messages)
3. [WhatsApp Payments](#3-whatsapp-payments)
4. [Conversational Sales Funnels](#4-conversational-sales-funnels)
5. [Template Message Strategy](#5-template-message-strategy)
6. [Broadcast & Bulk Messaging](#6-broadcast--bulk-messaging)
7. [Customer Journey Mapping](#7-customer-journey-mapping)
8. [Media Rich Messages](#8-media-rich-messages)
9. [Automation Patterns](#9-automation-patterns)
10. [LatAm WhatsApp Patterns](#10-latam-whatsapp-patterns)
11. [Compliance & Privacy](#11-compliance--privacy)
12. [TypeScript Implementation](#12-typescript-implementation)

---

## 1. WhatsApp Business API Architecture

### 1.1 Cloud API vs On-Premise

Meta officially deprecated the On-Premise API on October 23, 2025. All new integrations must use the **WhatsApp Cloud API**, hosted by Meta. This is the only supported path for Kitz going forward.

| Aspect | Cloud API (Current) | On-Premise (Deprecated) |
|---|---|---|
| **Hosting** | Meta-managed infrastructure | Self-hosted Docker containers |
| **Maintenance** | Zero -- Meta handles updates | Manual upgrades required |
| **Scaling** | Auto-scales with Meta infra | Self-managed scaling |
| **Throughput** | 80 msg/sec default, up to 1,000/sec | Dependent on hardware |
| **Cost** | Per-message fees only | BSP hosting + per-message fees |
| **Setup** | Minutes via Meta Business Suite | Days/weeks with BSP |
| **Webhook** | HTTPS endpoint required | HTTPS endpoint required |
| **Media storage** | Meta CDN (temporary URLs) | Self-hosted |
| **Kitz recommendation** | Primary path | Do not use |

**Base URL for all Cloud API requests:**

```
https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages
```

**Authentication:** All requests require a Bearer token:

```
Authorization: Bearer {SYSTEM_USER_ACCESS_TOKEN}
```

### 1.2 Phone Number Types

| Type | Description | Use Case | Kitz Relevance |
|---|---|---|---|
| **Business phone** | Dedicated number registered to WABA | Primary business line | Main connector number |
| **Test phone** | Meta-provided number for dev | API testing only | Dev/staging environment |
| **Personal (migrated)** | Personal WA number migrated to API | Transition path for existing users | Baileys bridge for current users |
| **Virtual number** | VoIP/virtual numbers from providers | Scaling multiple lines | Multi-tenant expansion |

**Important constraints:**
- Each phone number can only be registered to ONE WhatsApp Business Account (WABA) at a time
- Migrating a number from WhatsApp Business App to API deletes all existing conversations
- A display name change requires Meta approval (24-72 hours)
- Numbers must be able to receive SMS or voice calls for initial verification

### 1.3 Message Types

#### Session Messages (Service Window)

When a customer messages a business, a **24-hour service window** opens. During this window, the business can send free-form messages without using templates. These messages are **free** (no per-message charge).

```
Customer sends message at 2:00 PM
  --> Service window opens: 2:00 PM to 2:00 PM next day
  --> Business can reply freely (text, media, interactive)
  --> After 24 hours: only template messages allowed
```

#### Template Messages

Pre-approved message formats required for business-initiated conversations (outside the 24-hour window). Three categories:

| Category | Purpose | Examples | Approval | Cost |
|---|---|---|---|---|
| **Marketing** | Promotions, offers, re-engagement | Sale announcements, cart recovery, product launches | Meta review required | Highest |
| **Utility** | Transaction updates, confirmations | Order status, shipping, payment receipts, appointment reminders | Meta review required | Medium |
| **Authentication** | OTP and verification | Login codes, account verification, 2FA | Meta review required | Lowest |

#### Interactive Messages

Rich message formats that enable user interaction within the chat:

| Type | Description | Max Options | Use Case |
|---|---|---|---|
| **Reply buttons** | Up to 3 tappable buttons | 3 buttons | Quick choices, confirmations |
| **List messages** | Expandable menu of options | 10 items in 10 sections | Product browsing, category selection |
| **CTA buttons** | URL or phone call buttons | 2 buttons | Website links, call-to-action |
| **Single product** | Product card from catalog | 1 product | Product spotlight |
| **Multi-product** | Product grid from catalog | 30 products in 10 sections | Catalog browsing |
| **Location request** | Ask user to share location | N/A | Delivery, nearest store |
| **Flow messages** | Multi-screen forms | 10 screens | Surveys, applications, bookings |

### 1.4 Rate Limits & Messaging Tiers

WhatsApp enforces messaging limits based on **business-initiated conversations** (template messages sent to unique customers in a rolling 24-hour period).

| Tier | Unique Contacts/24h | Requirements |
|---|---|---|
| **Unverified** | 250 | New account, no Meta Business verification |
| **Tier 1** | 1,000 | Verified business, connected phone number |
| **Tier 2** | 10,000 | Maintained quality rating, sufficient volume |
| **Tier 3** | 100,000 | Maintained quality rating, sufficient volume |
| **Tier 4** | Unlimited | Maintained quality rating, high volume |

**Tier advancement rules:**
- Must send at least 2x current tier limit within 7 days
- Quality rating must be Green or Yellow (not Red)
- Automatic advancement -- no manual request needed
- Tier downgrades happen when quality drops to Red

**API throughput limits (separate from messaging tiers):**
- Cloud API default: **80 messages/second** per phone number
- Eligible accounts: auto-upgrade up to **1,000 messages/second**
- Webhook delivery: Meta sends events as they occur (no batching guarantee)

### 1.5 Pricing Per Country (Effective January 2026)

Meta shifted from conversation-based to **per-message pricing** on July 1, 2025. Every delivered template message is charged individually based on category and recipient country. Service messages (replies within the 24-hour window) remain free.

| Country | Marketing (USD) | Utility (USD) | Authentication (USD) | Service |
|---|---|---|---|---|
| **Brazil** | $0.0625 | $0.0068 | ~$0.004 | Free |
| **Mexico** | ~$0.036 | ~$0.008 | ~$0.005 | Free |
| **Colombia** | ~$0.020 | ~$0.001 | ~$0.003 | Free |
| **Argentina** | ~$0.032 | ~$0.005 | ~$0.004 | Free |
| **Chile** | ~$0.055 | ~$0.009 | ~$0.005 | Free |
| **Peru** | ~$0.035 | ~$0.004 | ~$0.004 | Free |
| **Panama** | ~$0.030 | ~$0.005 | ~$0.004 | Free |
| **Costa Rica** | ~$0.030 | ~$0.005 | ~$0.004 | Free |
| **Ecuador** | ~$0.028 | ~$0.004 | ~$0.003 | Free |
| **Uruguay** | ~$0.028 | ~$0.004 | ~$0.003 | Free |
| **USA** | ~$0.025 | ~$0.004 | ~$0.004 | Free |
| **India** | ~$0.011 | ~$0.004 | ~$0.003 | Free |

**Volume discounts** (automatic, per-country):
- Utility and Authentication messages get progressively lower rates at higher monthly volumes
- First 1,000 utility messages to Brazil: $0.0068; messages 1,001-10,000: $0.0065
- Volume tiers reset monthly

**Local currency billing:**
- Mexico (MXN): Available since January 2026
- India (INR): Available since January 2026
- Brazil (BRL): Planned H2 2026

**Kitz cost tracking:** The `broadcast_send` tool and campaign workflows must track per-message costs by category and country. The AI Battery system should factor WhatsApp message costs into ROI calculations -- a marketing broadcast to 1,000 Brazilian contacts costs approximately $62.50 in API fees alone.

### 1.6 Quality Rating System

WhatsApp assigns a **quality rating** (Green / Yellow / Red) based on user feedback signals:

| Signal | Weight | Description |
|---|---|---|
| **Block rate** | High | Users blocking the business number |
| **Report rate** | High | Users reporting messages as spam |
| **Template feedback** | Medium | Negative reactions to template messages |
| **Read rate** | Low | How often messages are read |

**Quality rating impacts:**
- **Green:** Full messaging capacity. Eligible for tier upgrades.
- **Yellow:** Warning state. No tier downgrades yet but upgrades paused.
- **Red:** Active tier downgrade. May lose messaging ability for 7 days. Template submissions may be restricted.

**Kitz safeguards:**
- The `broadcast_send` tool must check quality rating before sending campaigns
- If quality is Yellow: warn the business owner and recommend reducing volume
- If quality is Red: block broadcasts entirely and alert owner
- Track block/report rates in the daily summary report

---

## 2. Catalog API & Product Messages

### 2.1 Product Catalog Management

The WhatsApp Commerce API allows businesses to create, manage, and share product catalogs directly within WhatsApp conversations. The catalog is hosted by Meta and synced with the Facebook Commerce Manager.

**Catalog hierarchy:**

```
Business Account (WABA)
  --> Commerce Manager Catalog
    --> Product Items (up to 10,000 SKUs)
      --> Variants (size, color, etc.)
      --> Images (up to 10 per product)
      --> Pricing (per-country)
```

**API endpoints:**

```
# List catalog products
GET https://graph.facebook.com/v21.0/{CATALOG_ID}/products

# Create a product
POST https://graph.facebook.com/v21.0/{CATALOG_ID}/products
Content-Type: application/json
{
  "retailer_id": "SKU-001",
  "name": "Empanadas de Carne (12 pack)",
  "description": "Docena de empanadas de carne de res, masa casera",
  "price": 1500,
  "currency": "COP",
  "url": "https://workspace.kitz.services/store/product/SKU-001",
  "image_url": "https://cdn.example.com/empanadas.jpg",
  "availability": "in stock"
}

# Update a product
POST https://graph.facebook.com/v21.0/{PRODUCT_ID}
{
  "price": 1800,
  "availability": "in stock"
}

# Delete a product
DELETE https://graph.facebook.com/v21.0/{PRODUCT_ID}
```

**Required product fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `retailer_id` | string | Yes | Unique SKU / product code |
| `name` | string | Yes | Product name (max 200 chars) |
| `description` | string | Yes | Product description (max 5,000 chars) |
| `price` | integer | Yes | Price in smallest currency unit (cents) |
| `currency` | string | Yes | ISO 4217 currency code |
| `url` | string | Yes | Product page URL |
| `image_url` | string | Yes | Primary product image URL |
| `availability` | string | Yes | "in stock", "out of stock", "preorder" |

**Optional fields:** `brand`, `category`, `condition`, `sale_price`, `sale_price_effective_date`, `gtin`, `additional_image_urls`

### 2.2 Multi-Product Messages

Send up to **30 products** organized in **up to 10 sections** in a single interactive message. The customer sees a browsable catalog within the chat.

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "5511999887766",
  "type": "interactive",
  "interactive": {
    "type": "product_list",
    "header": {
      "type": "text",
      "text": "Nuestro Menu del Dia"
    },
    "body": {
      "text": "Elige tus favoritos. Envio gratis en pedidos mayores a $30,000 COP"
    },
    "footer": {
      "text": "Precios incluyen IVA"
    },
    "action": {
      "catalog_id": "CATALOG_123",
      "sections": [
        {
          "title": "Platos Principales",
          "product_items": [
            { "product_retailer_id": "SKU-001" },
            { "product_retailer_id": "SKU-002" },
            { "product_retailer_id": "SKU-003" }
          ]
        },
        {
          "title": "Bebidas",
          "product_items": [
            { "product_retailer_id": "SKU-010" },
            { "product_retailer_id": "SKU-011" }
          ]
        },
        {
          "title": "Postres",
          "product_items": [
            { "product_retailer_id": "SKU-020" }
          ]
        }
      ]
    }
  }
}
```

### 2.3 Single-Product Messages

Spotlight a single product with full details, image, and CTA:

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "5511999887766",
  "type": "interactive",
  "interactive": {
    "type": "product",
    "body": {
      "text": "Este es nuestro producto mas vendido esta semana!"
    },
    "footer": {
      "text": "Disponibilidad limitada"
    },
    "action": {
      "catalog_id": "CATALOG_123",
      "product_retailer_id": "SKU-001"
    }
  }
}
```

### 2.4 Catalog Linking

Connect the WhatsApp Business catalog to the Facebook Commerce Manager:

1. Create catalog in Meta Commerce Manager (or via API)
2. Link catalog to WABA phone number in Business Settings
3. Products auto-sync to the WhatsApp Business profile
4. Customers can browse the catalog directly from the business profile

**Kitz integration path:**
- `products_create` tool creates products in Kitz workspace (Supabase)
- Future: sync Kitz products to Meta Commerce Manager via Catalog API
- Products in Kitz catalog map 1:1 to `product_retailer_id` in WhatsApp messages
- The `outbound_sendWhatsApp` tool should support `type: "product"` and `type: "product_list"` payloads

### 2.5 Product Compliance

Meta enforces strict commerce policies for WhatsApp catalogs:

| Rule | Description |
|---|---|
| **Prohibited items** | Alcohol, tobacco, weapons, drugs, adult content, gambling, animals, counterfeit goods |
| **Regulated items** | Supplements, cosmetics, financial products -- require disclaimers |
| **Pricing accuracy** | Listed prices must match actual checkout prices |
| **Image standards** | No watermarks, no promotional overlays, product must be clearly visible |
| **Description accuracy** | Must accurately describe the product; no misleading claims |
| **Country restrictions** | Some product categories vary by country |

**Kitz safeguard:** The `products_create` tool should validate product category against Meta's prohibited/restricted lists before allowing catalog sync. This prevents WABA suspension due to policy violations.

---

## 3. WhatsApp Payments

### 3.1 WhatsApp Pay Overview

WhatsApp Pay is currently available in two markets:

| Market | Payment Rails | Status | Kitz Relevance |
|---|---|---|---|
| **Brazil** | Visa, Mastercard via FBPAY (Meta Pay) | Live since May 2021 | High -- largest LatAm market |
| **India** | UPI (Unified Payments Interface) | Live since November 2020 | Low -- outside LatAm focus |

**Brazil WhatsApp Pay specifics:**
- Powered by Cielo (payment processor) and Visa/Mastercard networks
- Users link debit/credit cards from participating banks
- P2P transfers: free, instant, up to R$1,000 per transaction, R$20,000/month
- Business payments: merchants pay standard card processing fees (typically 2.5-3.5%)
- QR-code payments: introduced September 2025 for small businesses
- PIX integration: not yet available through WhatsApp Pay (separate integration needed)

**India WhatsApp Pay specifics:**
- Powered by UPI (National Payments Corporation of India)
- P2P transfers: free, instant, linked to bank account
- Business payments: UPI merchant fees (typically 0%)
- QR code support: live since September 2025

### 3.2 Payment Links via Messages

For markets where WhatsApp Pay is not available (most of LatAm), the primary payment pattern is sending **payment links** within WhatsApp messages. This is the core Kitz pattern.

**Payment link flow:**

```
1. Business creates invoice/checkout link via Kitz
   --> storefronts_create tool generates link
   --> Link format: https://workspace.kitz.services/pay/{storefrontId}

2. Business sends link to customer via WhatsApp
   --> outbound_sendWhatsApp or manual share
   --> Include amount, description, due date

3. Customer clicks link, lands on Kitz checkout page
   --> Supported providers: Stripe, PayPal, Yappy (Panama), BAC
   --> Customer pays via their preferred method

4. Payment webhook fires to kitz-payments service
   --> Webhook handler validates payment
   --> Order status updates to "paid"
   --> Confirmation message sent back via WhatsApp
```

**Payment link message format (within 24h window):**

```json
{
  "messaging_product": "whatsapp",
  "to": "50769524232",
  "type": "interactive",
  "interactive": {
    "type": "cta_url",
    "header": {
      "type": "text",
      "text": "Factura #INV-2026-0042"
    },
    "body": {
      "text": "Total: $85.00 USD\nConcepto: Servicio de diseno grafico\nVence: 28 Feb 2026\n\nHaz clic para pagar de forma segura."
    },
    "footer": {
      "text": "Pagos procesados por Kitz"
    },
    "action": {
      "name": "cta_url",
      "parameters": {
        "display_text": "Pagar Ahora",
        "url": "https://workspace.kitz.services/pay/sf_abc123"
      }
    }
  }
}
```

### 3.3 Invoice Delivery via WhatsApp

Send professional invoices as PDF documents through WhatsApp:

```json
{
  "messaging_product": "whatsapp",
  "to": "573001234567",
  "type": "document",
  "document": {
    "link": "https://workspace.kitz.services/api/invoices/INV-2026-0042.pdf",
    "caption": "Factura #INV-2026-0042 - $85.00 USD\nVencimiento: 28 Feb 2026\nPaga en: workspace.kitz.services/pay/sf_abc123",
    "filename": "Factura-INV-2026-0042.pdf"
  }
}
```

### 3.4 Payment Confirmation Flow

The 6-step transaction flow used by Kitz `storefronts_markPaid` tool:

```
Step 1: Payment webhook received (Stripe/PayPal/Yappy/BAC)
Step 2: Validate webhook signature (provider-specific)
Step 3: Match payment to storefront/invoice via metadata
Step 4: Update order status: "pending" --> "paid"
Step 5: Record transaction in kitz-payments ledger
Step 6: Send confirmation to customer AND business owner via WhatsApp

Owner notification:
  "Payment received! $85.00 from +573001234567
   Invoice: #INV-2026-0042
   Method: Stripe (Visa ending 4242)
   Balance updated."

Customer confirmation:
  "Gracias por tu pago de $85.00!
   Factura: #INV-2026-0042
   Estado: Pagado
   Recibo enviado a tu correo."
```

### 3.5 LatAm Payment Integration Matrix

| Country | Primary Method | Kitz Provider | WhatsApp Pay | PIX/Local |
|---|---|---|---|---|
| **Panama** | Yappy, BAC, cards | Yappy + Stripe | No | N/A |
| **Brazil** | PIX, boleto, cards | Stripe + PIX API | Yes (cards only) | Yes (separate) |
| **Colombia** | PSE, Nequi, cards | Stripe + PSE | No | N/A |
| **Mexico** | SPEI, OXXO, cards | Stripe + Conekta | No | N/A |
| **Argentina** | Mercado Pago, transfers | MercadoPago API | No | N/A |
| **Chile** | Webpay, Khipu, transfers | Stripe + Khipu | No | N/A |
| **Peru** | Yape, Plin, transfers | Stripe + Culqi | No | N/A |
| **Costa Rica** | SINPE Movil, cards | Stripe | No | N/A |

---

## 4. Conversational Sales Funnels

### 4.1 Lead Qualification via Chat

WhatsApp is the primary sales channel for LatAm SMBs. Over 70% of Latin American SMEs use WhatsApp as their main sales channel, with 98% open rates versus 20% for email. The qualification funnel must happen entirely within the chat.

**Qualification stages:**

```
LEAD (Raw inbound)
  --> First message received, contact captured in CRM
  --> Auto-reply sent, CRM contact tagged "new-lead"
  --> Response SLA: < 4 hours (normal), < 15 min (urgent)

MQL (Marketing Qualified Lead)
  --> Has expressed interest in a specific product/service
  --> Has responded to at least one question
  --> Has been qualified on NEED (Necesidad)
  --> CRM tag updated: "mql"

SQL (Sales Qualified Lead)
  --> Has been qualified on BUDGET (Presupuesto) + TIMELINE (Tiempo)
  --> Ready for quote/proposal
  --> CRM tag updated: "sql"
  --> Draft quote generated via storefronts_create

CUSTOMER
  --> Has made a payment
  --> CRM tag updated: "customer"
  --> Onboarding flow triggered
```

### 4.2 Decision Tree Design

Effective WhatsApp sales funnels use branching logic based on user responses. The key design principle: **each message should lead to exactly one next action**.

**Qualification decision tree:**

```
User sends first message
  |
  v
[Auto-reply + greeting]
"Hola! Gracias por escribirnos. Soy [nombre] de [negocio]. En que te puedo ayudar?"
  |
  v
[Quick Reply Buttons]
  [1] "Ver productos"  --> Product catalog flow
  [2] "Tengo una pregunta"  --> FAQ/support flow
  [3] "Quiero un presupuesto"  --> Quote flow
  |
  v (if "Quiero un presupuesto")
[Qualification: NEED]
"Perfecto! Para darte el mejor precio, cuentame: Que servicio necesitas?"
  |
  v
[Qualification: BUDGET]
"Tienes un presupuesto estimado para esto?"
  [1] "Menos de $500"
  [2] "$500 - $2,000"
  [3] "Mas de $2,000"
  [4] "No estoy seguro"
  |
  v
[Qualification: TIMELINE]
"Para cuando lo necesitas?"
  [1] "Esta semana"
  [2] "Este mes"
  [3] "No tengo prisa"
  |
  v
[SQL - Generate Quote]
"Listo! Basado en lo que me cuentas, te preparo una cotizacion.
 Te la envio por aqui en unos minutos."
```

### 4.3 Quick Reply Buttons

Maximum 3 buttons per message. Each button has a unique ID for backend routing.

```json
{
  "messaging_product": "whatsapp",
  "to": "573001234567",
  "type": "interactive",
  "interactive": {
    "type": "button",
    "header": {
      "type": "text",
      "text": "Cotizacion Lista"
    },
    "body": {
      "text": "Tu cotizacion por $1,200 USD esta lista.\nIncluye: Diseno de logo + Manual de marca\nValidez: 7 dias\n\nQuieres continuar?"
    },
    "footer": {
      "text": "Responde para continuar"
    },
    "action": {
      "buttons": [
        {
          "type": "reply",
          "reply": { "id": "accept_quote", "title": "Acepto" }
        },
        {
          "type": "reply",
          "reply": { "id": "negotiate", "title": "Negociar" }
        },
        {
          "type": "reply",
          "reply": { "id": "decline", "title": "No gracias" }
        }
      ]
    }
  }
}
```

### 4.4 List Messages

Expandable menus for product browsing, category selection, or multi-option choices. Up to 10 items across 10 sections.

```json
{
  "messaging_product": "whatsapp",
  "to": "573001234567",
  "type": "interactive",
  "interactive": {
    "type": "list",
    "header": {
      "type": "text",
      "text": "Servicios Disponibles"
    },
    "body": {
      "text": "Selecciona el servicio que te interesa para ver precios y disponibilidad."
    },
    "footer": {
      "text": "Kitz - Tu negocio, automatizado"
    },
    "action": {
      "button": "Ver Servicios",
      "sections": [
        {
          "title": "Diseno",
          "rows": [
            {
              "id": "svc_logo",
              "title": "Diseno de Logo",
              "description": "Logo profesional + 3 propuestas. Desde $200"
            },
            {
              "id": "svc_branding",
              "title": "Manual de Marca",
              "description": "Identidad visual completa. Desde $500"
            }
          ]
        },
        {
          "title": "Marketing Digital",
          "rows": [
            {
              "id": "svc_social",
              "title": "Redes Sociales",
              "description": "Gestion mensual de Instagram + Facebook. Desde $300/mes"
            },
            {
              "id": "svc_web",
              "title": "Pagina Web",
              "description": "Sitio web profesional. Desde $800"
            }
          ]
        }
      ]
    }
  }
}
```

### 4.5 CTA Buttons

Call-to-action buttons that open a URL or initiate a phone call:

```json
{
  "messaging_product": "whatsapp",
  "to": "573001234567",
  "type": "interactive",
  "interactive": {
    "type": "cta_url",
    "body": {
      "text": "Tu pedido #ORD-2026-088 esta listo para recoger.\nDireccion: Calle 85 #15-23, Bogota\nHorario: 9am - 6pm"
    },
    "action": {
      "name": "cta_url",
      "parameters": {
        "display_text": "Ver en Google Maps",
        "url": "https://maps.google.com/?q=4.6782,-74.0482"
      }
    }
  }
}
```

---

## 5. Template Message Strategy

### 5.1 Template Categories

| Category | Purpose | Cost Tier | Approval Speed | Restrictions |
|---|---|---|---|---|
| **Marketing** | Promotions, offers, re-engagement, cart recovery | Highest | 24-48h typical | Max 10 emojis, no misleading content |
| **Utility** | Order updates, shipping, receipts, appointment reminders | Medium | Minutes to hours | Must be transactional, not promotional |
| **Authentication** | OTP codes, login verification, account confirmation | Lowest | Minutes | Fixed format, one-time codes only |

**Category selection matters.** Submitting a marketing template as "utility" is the #1 cause of template rejection. Meta uses AI-based classification to verify categories match content.

### 5.2 Template Approval Best Practices

**Naming conventions:**
- Use only lowercase letters, numbers, and underscores
- Descriptive names: `order_confirmation_v2`, `weekly_promo_es`, `payment_reminder_30d`
- Never: spaces, capital letters, special characters

**Content rules for fast approval:**
1. **Match the category.** If it promotes anything, it is Marketing.
2. **No URL shorteners.** Use full, branded URLs only.
3. **Variables cannot be first or last.** `{{1}}` cannot start or end the template body.
4. **Max 10 emojis** in marketing templates.
5. **No consecutive spaces.** No tabs, no extra line breaks beyond standard formatting.
6. **Provide sample values** for all variables during submission.
7. **One language per template.** Submit separate templates for `es`, `pt_BR`, `en`.
8. **Avoid prohibited content:** alcohol, gambling, political, adult, cryptocurrency in marketing templates.

**Character limits:**

| Component | Limit |
|---|---|
| Template name | 512 characters |
| Header (text) | 60 characters |
| Body | 1,024 characters |
| Footer | 60 characters |
| Button text | 25 characters per button |
| URL button | 2,000 characters for URL |
| Quick reply button text | 25 characters |
| Variables | No character limit per variable, but total body must be under 1,024 |

**Approval timeline:**
- Authentication: minutes (auto-approved in most cases)
- Utility: minutes to a few hours
- Marketing: 24-72 hours (manual Meta review for new accounts)

### 5.3 Variable Personalization

Templates use double-curly-bracket placeholders: `{{1}}`, `{{2}}`, etc. Variables are positional in the body but can also appear in the header and URL buttons.

**Template example (Utility -- Order Confirmation):**

```
Template name: order_confirmation_es
Category: UTILITY
Language: es

Header: Pedido Confirmado #{{1}}
Body: Hola {{1}}, tu pedido por {{2}} ha sido confirmado.

Fecha de entrega estimada: {{3}}
Metodo de pago: {{4}}

Gracias por tu compra!
Footer: Kitz - Tu negocio inteligente
Buttons: [URL] "Ver Pedido" -> https://workspace.kitz.services/orders/{{1}}
```

**Sending the template via API:**

```json
{
  "messaging_product": "whatsapp",
  "to": "573001234567",
  "type": "template",
  "template": {
    "name": "order_confirmation_es",
    "language": { "code": "es" },
    "components": [
      {
        "type": "header",
        "parameters": [
          { "type": "text", "text": "ORD-2026-088" }
        ]
      },
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "Maria" },
          { "type": "text", "text": "$85,000 COP" },
          { "type": "text", "text": "28 de febrero, 2026" },
          { "type": "text", "text": "Nequi" }
        ]
      },
      {
        "type": "button",
        "sub_type": "url",
        "index": "0",
        "parameters": [
          { "type": "text", "text": "ORD-2026-088" }
        ]
      }
    ]
  }
}
```

### 5.4 Language & Locale Handling

Kitz serves a multi-language audience across LatAm. Templates must be submitted in each target language.

| Language Code | Language | Markets |
|---|---|---|
| `es` | Spanish | Mexico, Colombia, Argentina, Chile, Peru, Panama, Costa Rica, Ecuador, etc. |
| `es_MX` | Spanish (Mexico) | Mexico -- for region-specific phrasing |
| `es_AR` | Spanish (Argentina) | Argentina -- for vos/voseo forms |
| `pt_BR` | Portuguese (Brazil) | Brazil |
| `en` | English | USA, Belize, Trinidad, Jamaica |

**Best practices:**
- Always submit `es` as the primary Spanish template (broadest reach)
- Add `pt_BR` for all templates used in Brazil -- **never** send Spanish to Brazilian contacts
- Use `es_MX` only when Mexican-specific terminology is needed (e.g., "IVA" vs "impuesto")
- Include `en` for bilingual markets (Panama, Puerto Rico)
- Variable values are language-aware: format dates as "28 de febrero" (es) vs "28 de fevereiro" (pt_BR)
- Currency formatting: `$85.000 COP` (es) vs `R$ 85.000,00` (pt_BR) -- note comma/period swap

### 5.5 Essential Template Library for Kitz

| Template Name | Category | Trigger | Language |
|---|---|---|---|
| `welcome_new_lead_es` | Marketing | New contact captured | es, pt_BR |
| `order_confirmation_es` | Utility | Order created | es, pt_BR |
| `payment_reminder_es` | Utility | Invoice overdue 3 days | es, pt_BR |
| `payment_received_es` | Utility | Payment webhook confirmed | es, pt_BR |
| `shipping_update_es` | Utility | Order status changed | es, pt_BR |
| `appointment_reminder_es` | Utility | 24h before calendar event | es, pt_BR |
| `weekly_promo_es` | Marketing | Weekly scheduled broadcast | es, pt_BR |
| `cart_recovery_es` | Marketing | Abandoned storefront (24h) | es, pt_BR |
| `review_request_es` | Marketing | 7 days post-purchase | es, pt_BR |
| `reengagement_30d_es` | Marketing | No contact for 30 days | es, pt_BR |
| `otp_verification_es` | Authentication | Login attempt | es, pt_BR |

---

## 6. Broadcast & Bulk Messaging

### 6.1 Opt-In Requirements

As of November 2024, Meta requires businesses to obtain **explicit opt-in** before sending marketing messages. This is enforced at the platform level and by local data protection laws.

**Opt-in methods (all valid):**

| Method | Description | Kitz Implementation |
|---|---|---|
| **WhatsApp thread** | Customer messages business first | Auto-captured by Baileys connector |
| **Website form** | Checkbox on web form | Kitz checkout page, workspace sign-up |
| **QR code** | Scan to start WhatsApp chat | Business card, storefront, flyer |
| **Click-to-WhatsApp ad** | Facebook/Instagram ad that opens WhatsApp | Marketing tool integration |
| **SMS opt-in** | Text message with WhatsApp consent | Future comms-api integration |
| **In-person verbal** | Customer verbally agrees (document it) | Manual CRM note |

**Opt-in rules:**
1. Consent must be **active** (pre-checked boxes are not valid in Brazil/LGPD)
2. Business must clearly state they will communicate via WhatsApp
3. Consent must be **specific** to the message category (marketing vs transactional)
4. Business must provide easy opt-out at any time
5. Records of consent must be maintained (timestamp, method, content)

**Opt-out handling:**
- Users can opt out by replying "PARAR" (Portuguese), "STOP" (English/Spanish), or blocking the number
- Meta's "Offers and Announcements" setting lets users control marketing message frequency
- Kitz CRM must respect opt-out: `contact.whatsapp_marketing_opt_in = false`
- Sending to opted-out contacts risks quality rating downgrade and account suspension

### 6.2 Frequency Caps

**Recommended sending frequency by category:**

| Category | Recommended Max | Why |
|---|---|---|
| Marketing | 2-4 messages/month per contact | More than 4/month significantly increases block rates |
| Utility | As needed (event-driven) | Users expect transactional updates |
| Authentication | As needed (event-driven) | Users initiated the action |

**Kitz broadcast safeguards (implemented in `broadcast_send` tool):**
- Maximum 200 recipients per broadcast (current limit)
- Preview filter required before sending (`broadcast_preview` first)
- Minimum 24 hours between marketing broadcasts to the same audience
- Block rate monitoring: pause if > 2% blocks on a single broadcast
- Auto-exclude contacts who haven't opened last 3 marketing messages (engagement-based filtering)

### 6.3 Audience Segmentation

Effective segmentation dramatically reduces block rates and increases conversion:

| Segment | Criteria | Best Template Type |
|---|---|---|
| **Hot leads** | Messaged in last 7 days, no purchase yet | Cart recovery, limited offer |
| **New customers** | First purchase in last 30 days | Onboarding, cross-sell |
| **Repeat customers** | 2+ purchases | Loyalty rewards, VIP offers |
| **Dormant contacts** | No interaction for 30-90 days | Re-engagement, "we miss you" |
| **Churned** | No interaction for 90+ days | Win-back offers (careful -- high block risk) |
| **By product interest** | Viewed specific products/categories | Targeted product promotions |
| **By location** | City/region from CRM | Local events, regional offers |
| **By language** | pt_BR vs es | Language-matched templates |

**Kitz segmentation via CRM tags:**
```
broadcast_preview --filter "tag:hot-lead AND last_contact_days:<7"
broadcast_preview --filter "tag:customer AND purchases:>1"
broadcast_preview --filter "tag:dormant AND last_contact_days:>30"
broadcast_preview --filter "country:BR AND language:pt_BR"
```

### 6.4 A/B Testing Templates

Test different template versions to optimize open rates and conversion:

**A/B testing framework:**

```
Template A: weekly_promo_es_v1
  "Hola {{1}}! Esta semana tenemos 20% de descuento en todos nuestros servicios.
   Valido hasta el domingo. Quieres saber mas?"

Template B: weekly_promo_es_v2
  "{{1}}, solo esta semana: servicios desde $99.
   3 clientes ya lo aprovecharon hoy.
   Te reservo tu lugar?"

Split: 50/50 on matching audience segments
Measure: Reply rate, link clicks, conversions within 48h
Winner: Use for remaining audience + future broadcasts
```

**Key metrics to track per broadcast:**
- Delivery rate (should be > 95%)
- Read rate (WhatsApp blue ticks)
- Reply rate (engagement signal)
- Link click rate (if CTA included)
- Block rate (must stay below 2%)
- Conversion rate (payment within 7 days)
- Revenue attributed (total payment value from broadcast recipients)

### 6.5 Deliverability Optimization

**Sending practices:**
1. **Warm up new numbers.** Start with 50-100 messages/day, increase 20% daily
2. **Send during business hours.** 9am-6pm local time has 40% higher open rates
3. **Personalize aggressively.** Use contact name, last purchase, last interaction date
4. **Avoid "salesy" language.** WhatsApp users expect conversational tone
5. **Include clear CTA.** Every message should have one obvious next step
6. **Monitor quality dashboard.** Check Meta Business Suite quality metrics daily

**Anti-spam checklist before every broadcast:**
- [ ] Audience has valid opt-in
- [ ] Template is approved and active
- [ ] No broadcast to this audience in last 24 hours
- [ ] Quality rating is Green
- [ ] Message includes opt-out instruction
- [ ] Variables are populated (no blank `{{1}}`)
- [ ] Total recipients is within messaging tier limit

---

## 7. Customer Journey Mapping

### 7.1 Full Journey: Discovery to Retention via WhatsApp

The entire customer lifecycle can and should happen within WhatsApp for LatAm SMBs. Here is the 7-stage journey with Kitz tool mappings:

```
STAGE 1: DISCOVERY
  Customer finds business via Instagram, Google, referral, or WA Status
  |
  v
STAGE 2: FIRST CONTACT
  Customer sends first WhatsApp message
  --> Baileys connector receives message
  --> Auto-reply sent (autoReplyConfig.ts)
  --> Contact captured in CRM (crm_createContact)
  --> Tagged "new-lead" in workspace
  |
  v
STAGE 3: QUALIFICATION
  Business owner responds (within SLA from whatsapp-response-sla-v1)
  --> PNT qualification: Presupuesto, Necesidad, Tiempo
  --> Interactive buttons guide conversation
  --> Lead tagged as MQL then SQL
  --> Kitz AI suggests next question via semantic router
  |
  v
STAGE 4: QUOTE / PROPOSAL
  --> storefronts_create generates payment link
  --> Quote sent via WhatsApp with CTA button
  --> Follow-up reminder at 24h, 72h, 7d if no response
  --> Kitz AI tracks quote pipeline in dashboard_metrics
  |
  v
STAGE 5: CLOSE / PAYMENT
  --> Customer clicks payment link
  --> Pays via local method (Stripe, Yappy, PIX, etc.)
  --> Webhook triggers storefronts_markPaid (6-step flow)
  --> Confirmation sent to customer + owner via WhatsApp
  --> CRM tag updated: "customer"
  |
  v
STAGE 6: ONBOARD
  --> Welcome message sent (template: welcome_customer_es)
  --> Delivery/service timeline communicated
  --> Shipping updates sent (template: shipping_update_es)
  --> "How was your experience?" follow-up at delivery + 3 days
  |
  v
STAGE 7: RETAIN
  --> Review request at 7 days post-purchase
  --> Cross-sell suggestions based on purchase history
  --> Monthly engagement: tips, value content, exclusive offers
  --> Re-engagement if dormant for 30 days
  --> Loyalty program progression
  --> Referral request to generate new Stage 1 contacts
```

### 7.2 Journey Timing & SLA Table

| Stage | Kitz SLA | Message Type | Tool |
|---|---|---|---|
| First contact response | < 4h (normal), < 15min (urgent) | Service message | Auto-reply + forwardToKitzOs |
| Qualification | Within same conversation | Interactive buttons | routeWithAI |
| Quote generation | < 2h after SQL qualification | CTA URL message | storefronts_create |
| Quote follow-up #1 | 24h after quote sent | Template (utility) | Scheduled reminder |
| Quote follow-up #2 | 72h after quote sent | Template (marketing) | Scheduled reminder |
| Payment confirmation | Instant (webhook-driven) | Service message | storefronts_markPaid |
| Onboarding message | Within 1h of payment | Template (utility) | Welcome flow |
| Delivery update | Real-time (event-driven) | Template (utility) | orders_updateOrder |
| Review request | 7 days post-delivery | Template (marketing) | Scheduled |
| Re-engagement | 30 days inactive | Template (marketing) | Segment-based broadcast |

### 7.3 Conversation Flow State Machine

```
States:
  NEW_LEAD        --> First message received, no qualification
  QUALIFYING      --> PNT questions in progress
  QUALIFIED_MQL   --> Need identified, budget/timeline unknown
  QUALIFIED_SQL   --> Need + budget + timeline confirmed
  QUOTE_SENT      --> Payment link/proposal delivered
  NEGOTIATING     --> Customer requested changes to quote
  PAYMENT_PENDING --> Customer initiated but did not complete payment
  CUSTOMER        --> Payment confirmed
  ONBOARDING      --> Post-payment service delivery in progress
  ACTIVE          --> Ongoing customer relationship
  DORMANT         --> No interaction for 30+ days
  CHURNED         --> No interaction for 90+ days
  OPTED_OUT       --> Customer opted out of marketing

Transitions:
  NEW_LEAD        + responds to qualification question  --> QUALIFYING
  QUALIFYING      + need identified                     --> QUALIFIED_MQL
  QUALIFIED_MQL   + budget + timeline confirmed         --> QUALIFIED_SQL
  QUALIFIED_SQL   + quote sent                          --> QUOTE_SENT
  QUOTE_SENT      + accepts quote                       --> PAYMENT_PENDING
  QUOTE_SENT      + negotiates                          --> NEGOTIATING
  NEGOTIATING     + new quote sent                      --> QUOTE_SENT
  PAYMENT_PENDING + payment confirmed                   --> CUSTOMER
  CUSTOMER        + onboarding started                  --> ONBOARDING
  ONBOARDING      + delivery complete                   --> ACTIVE
  ACTIVE          + 30 days no interaction              --> DORMANT
  DORMANT         + 90 days no interaction              --> CHURNED
  DORMANT         + re-engages                          --> ACTIVE
  ANY             + opts out                            --> OPTED_OUT
```

---

## 8. Media Rich Messages

### 8.1 Supported Media Types

| Type | Max Size | Formats | Use Case |
|---|---|---|---|
| **Image** | 5 MB | JPEG, PNG | Product photos, promos, receipts |
| **Video** | 16 MB | MP4 (H.264 + AAC) | Product demos, tutorials, testimonials |
| **Audio** | 16 MB | AAC, MP3, OGG, AMR | Voice notes, audio messages |
| **Document** | 100 MB | PDF, DOCX, XLSX, PPTX | Invoices, contracts, catalogs, reports |
| **Sticker** | 500 KB (static), 100 KB (animated) | WEBP | Brand engagement, fun interactions |
| **Location** | N/A | lat/long coordinates | Store location, delivery address |
| **Contact** | N/A | vCard | Share business card, referral contacts |

### 8.2 When to Use Each Media Type

**Images:**
- Product photos with price overlays
- Before/after showcases (services)
- Infographics with pricing tiers
- Receipts and payment confirmations (screenshot)
- QR codes for payments

**Videos:**
- Product demonstrations (keep under 60 seconds)
- Customer testimonials (30-90 seconds)
- How-to tutorials for service businesses
- Behind-the-scenes content (builds confianza)
- Promotional reels repurposed from Instagram

**Documents:**
- PDF invoices (primary use case for Kitz)
- Product catalogs in PDF format
- Contracts and proposals
- Excel price lists for B2B customers
- Event tickets / confirmation PDFs

**Audio / Voice Notes:**
- Personal follow-ups (much higher engagement than text in LatAm)
- Quick responses that are faster to record than type
- Kitz voice replies via ElevenLabs (`voice_speak` + `outbound_sendVoiceNote`)
- Product descriptions in audio format
- Voice-based brain dumps from business owner

**Stickers:**
- Brand-awareness sticker packs (create via WhatsApp sticker API)
- Reaction stickers for engagement
- Thank-you stickers after purchase
- Use sparingly -- overuse feels unprofessional

**Location:**
- Physical store address for pickup orders
- Delivery tracking (current location of driver)
- "Visit us" messages with map pin
- Event locations

**Contacts (vCard):**
- Share business contact card with new leads
- Referral sharing -- "Send this to a friend"
- Team member contact sharing for escalation

### 8.3 Media Message API Formats

**Image with caption:**

```json
{
  "messaging_product": "whatsapp",
  "to": "573001234567",
  "type": "image",
  "image": {
    "link": "https://cdn.example.com/product-001.jpg",
    "caption": "Empanadas de Carne (12 pack)\nPrecio: $15,000 COP\nPedido minimo: 2 packs\n\nEscribe 'pedir' para ordenar"
  }
}
```

**Video with caption:**

```json
{
  "messaging_product": "whatsapp",
  "to": "573001234567",
  "type": "video",
  "video": {
    "link": "https://cdn.example.com/demo-video.mp4",
    "caption": "Mira como funciona nuestro servicio en 30 segundos"
  }
}
```

**Location:**

```json
{
  "messaging_product": "whatsapp",
  "to": "573001234567",
  "type": "location",
  "location": {
    "latitude": 4.6782,
    "longitude": -74.0482,
    "name": "Tienda Principal",
    "address": "Calle 85 #15-23, Zona T, Bogota"
  }
}
```

**Contact (vCard):**

```json
{
  "messaging_product": "whatsapp",
  "to": "573001234567",
  "type": "contacts",
  "contacts": [
    {
      "name": {
        "formatted_name": "Maria Garcia - Ventas",
        "first_name": "Maria",
        "last_name": "Garcia"
      },
      "phones": [
        { "phone": "+573001234567", "type": "WORK" }
      ],
      "emails": [
        { "email": "maria@negocio.com", "type": "WORK" }
      ],
      "org": {
        "company": "Mi Negocio SAS"
      }
    }
  ]
}
```

---

## 9. Automation Patterns

### 9.1 Auto-Reply Rules

Kitz currently implements auto-reply via `autoReplyConfig.ts` in the WhatsApp connector. The system sends a configurable auto-reply to external senders with a per-sender cooldown (default 4 hours).

**Current auto-reply architecture:**

```
External message arrives
  --> Is sender in cooldown period? (4h default)
    --> YES: Log message to CRM, skip reply
    --> NO: Send auto-reply, set cooldown, log to CRM
```

**Recommended auto-reply tiers (expansion):**

| Tier | Trigger | Response | Cooldown |
|---|---|---|---|
| **Instant greeting** | First message from new contact | Welcome + menu buttons | Once per contact lifetime |
| **Business hours** | Message during 9am-6pm local | "Te respondo en minutos" | 4 hours |
| **After hours** | Message after 6pm or weekends | "Recibido! Te respondo manana a las 9am" | 8 hours |
| **FAQ auto-answer** | Keyword match (precio, horario, ubicacion) | Specific answer from FAQ database | 1 hour per topic |
| **Vacation mode** | Manual toggle by owner | Extended away message with alt contact | 24 hours |

### 9.2 Keyword Triggers

The Kitz command parser (`commandParser.ts`) already handles regex-based routing for structured commands. For conversational commerce, extend with keyword-based triggers:

**Recommended keyword triggers for commerce:**

| Keyword (es) | Keyword (pt_BR) | Action | Response |
|---|---|---|---|
| precio, costo, cuanto | preco, quanto | Show price list | Product catalog or list message |
| comprar, pedir, ordenar | comprar, pedir | Start order flow | Quick reply buttons for products |
| pagar, pago | pagar, pagamento | Payment flow | Payment link CTA |
| horario, abierto | horario, aberto | Show hours | Business hours text |
| ubicacion, donde, direccion | localizacao, onde, endereco | Show location | Location message with map |
| envio, delivery, domicilio | entrega, frete | Delivery info | Shipping rates and zones |
| factura, recibo | nota fiscal, recibo | Request invoice | PDF document message |
| devolucion, cambio | devolucao, troca | Return/exchange policy | Policy text + escalation to human |
| gracias, thanks | obrigado | Acknowledge | Reaction emoji + engagement prompt |
| queja, problema, reclamo | reclamacao, problema | Complaint handling | Priority escalation to human |

### 9.3 Business Hours Routing

```
Message received
  --> Check local time (use contact timezone from CRM or WABA timezone)
  --> Is it within business hours?
    --> YES: Route to normal processing (semantic router)
    --> NO: Send after-hours auto-reply, queue for morning

Business hours matrix (configurable per-business):
  Default: Mon-Fri 9am-6pm, Sat 9am-1pm, Sun closed
  Restaurant: Mon-Sun 11am-10pm
  Retail: Mon-Sat 10am-8pm, Sun 11am-5pm

After-hours queue behavior:
  - Log message to CRM with "after-hours" tag
  - Send after-hours template message
  - Queue response for next business hours start
  - If urgent keywords detected: escalate to owner phone notification
```

### 9.4 Human Handoff / Chatbot-to-Agent Escalation

The Kitz architecture handles this through the semantic router's 5-phase pipeline. The escalation pattern:

```
Phase 1-3: AI processes intent and plans strategy
  --> Can AI resolve this autonomously?
    --> YES: Execute tools, send response
    --> NO: Escalation triggers

Escalation triggers:
  1. Complaint / negative sentiment detected
  2. User explicitly requests "hablar con alguien" / "human" / "persona"
  3. AI confidence below threshold (< 60% on intent classification)
  4. Repeat question (user asked same thing 2+ times)
  5. Payment dispute or refund request
  6. Legal or regulatory question
  7. Custom product/service configuration beyond standard offerings

Escalation flow:
  --> Tag conversation as "needs-human" in CRM
  --> Send acknowledgment: "Te comunico con [nombre] en unos minutos"
  --> Notify business owner via:
      - Push notification (workspace.kitz.services)
      - Self-chat WhatsApp message
      - Email alert (if configured)
  --> Set escalation timer:
      - If no human response in 15 min: re-notify
      - If no human response in 1 hour: send apology template to customer
  --> Human takes over the conversation
  --> AI monitors for conversation close signal
  --> When human marks conversation as resolved:
      - CRM updated with resolution notes
      - Satisfaction survey sent (template)
      - AI learns from the interaction
```

### 9.5 Multi-Step Flow Automation

Complex business processes that span multiple messages:

**Order Flow Example:**

```
Step 1: Customer says "quiero pedir"
  --> Reply with product catalog (list message)

Step 2: Customer selects product
  --> Reply with quantity question (quick reply: 1, 2, 5+)

Step 3: Customer selects quantity
  --> Reply with delivery question (quick reply: "Recoger", "A domicilio")

Step 4: If delivery selected
  --> Ask for delivery address (location request message)

Step 5: Confirm order
  --> Show order summary with total
  --> Quick reply: "Confirmar", "Cambiar", "Cancelar"

Step 6: Customer confirms
  --> Create order (orders_createOrder)
  --> Create payment link (storefronts_create)
  --> Send payment CTA button

Step 7: Payment received (webhook)
  --> Send confirmation (template: order_confirmation_es)
  --> Start delivery/fulfillment flow
```

---

## 10. LatAm WhatsApp Patterns

### 10.1 Usage Statistics by Country

WhatsApp dominates messaging across Latin America with near-universal adoption. These numbers reflect 2025-2026 data:

| Country | Penetration | Monthly Active Users | Avg. Daily Time | Business Usage |
|---|---|---|---|---|
| **Brazil** | 98.9% | ~150 million | 25h 30min/month | 72% interact with businesses |
| **Colombia** | ~97% | ~38 million | 25h 45min/month | 70% interact with businesses |
| **Argentina** | ~96% | ~35 million | 22h 15min/month | 65% interact with businesses |
| **Mexico** | ~95% | ~80 million | 18h 17min/month | 68% interact with businesses |
| **Chile** | ~92% | ~15 million | 20h/month | 60% interact with businesses |
| **Peru** | ~91% | ~25 million | 19h 30min/month | 65% interact with businesses |
| **Panama** | ~89% | ~3.5 million | 18h/month | 60% interact with businesses |
| **Ecuador** | ~88% | ~13 million | 17h/month | 58% interact with businesses |
| **Costa Rica** | ~87% | ~4 million | 17h/month | 55% interact with businesses |
| **Uruguay** | ~85% | ~2.8 million | 16h/month | 55% interact with businesses |

**Key insight:** In LatAm, WhatsApp IS the internet for many users. Mobile carriers offer unlimited WhatsApp data plans, meaning WhatsApp works even when regular data is exhausted. This makes WhatsApp the most reliable communication channel for SMBs -- more reliable than email, SMS, or even web.

### 10.2 Cultural Communication Norms

**Relationship before transaction (confianza):**
- LatAm buyers need to trust the seller as a person before purchasing
- Small talk is not wasted time -- it IS the sale
- The Kitz auto-reply should be warm, not corporate
- Use first names, not "estimado cliente"
- A personal recommendation ("te lo manda fulano") can compress a 30-day cycle into 3 days

**Communication style by country:**

| Country | Style | Negotiation | Formality | Typical Sales Greeting |
|---|---|---|---|---|
| **Mexico** | Warm, formal initially | Moderate haggling | High at first | "A sus ordenes" |
| **Colombia** | Very warm, friendly | Flexible on terms | Medium | "Con mucho gusto" |
| **Brazil** | Enthusiastic, optimistic | Extended negotiation | Medium-low | "Oi! Tudo bem?" |
| **Argentina** | Direct, intellectual | Price-sensitive | Low-medium | "Dale, contame" |
| **Chile** | Reserved, professional | Data-driven | Higher | "Quedamos en eso" |
| **Peru** | Respectful, patient | Relationship-dependent | High | "A la orden" |
| **Panama** | Casual, friendly | Moderate | Low-medium | "Que xopa!" |

### 10.3 Voice Note Culture

Voice notes are the **dominant communication medium** in LatAm WhatsApp, especially in Brazil and Colombia. This is a critical insight for Kitz.

**Why voice notes dominate:**
- Many users find typing on mobile slower and more error-prone
- Voice feels more personal and trustworthy (confianza)
- Literacy levels vary -- voice is more accessible
- Multi-tasking: users can record while doing other things
- Emotional nuance is conveyed better through voice

**Stats:**
- Brazil: 80% of WhatsApp users send voice notes daily
- Colombia: 75% send voice notes daily
- Mexico: 65% send voice notes daily
- Voice notes average 15-45 seconds in LatAm business contexts

**Kitz voice note strategy:**
1. **Inbound:** Baileys connector receives audio, forwards to kitz_os for transcription and processing
2. **Outbound:** Kitz generates voice replies via ElevenLabs TTS (`voice_speak` + `outbound_sendVoiceNote`)
3. **Brain dump:** Voice notes processed as brain dumps -- extract key points, action items, decisions
4. **Sales follow-up:** AI-generated voice notes for follow-ups feel 3x more personal than text

### 10.4 WhatsApp Groups for Commerce

WhatsApp Groups are heavily used for commerce in LatAm:

| Group Type | Description | Typical Size | Use Case |
|---|---|---|---|
| **Customer community** | Loyal customers + business owner | 50-200 | Exclusive offers, first-to-know |
| **Neighborhood commerce** | Local buyers and sellers | 100-500 | Local marketplace, referrals |
| **Wholesale buyers** | B2B repeat customers | 10-50 | Price lists, bulk orders |
| **Product announcements** | One-directional (admin-only) | 100-1,000 | New products, promotions |
| **Vendor coordination** | Suppliers + business | 5-20 | Supply chain management |

**Kitz group interaction model (current):**
- Kitz responds in groups ONLY when @mentioned or "kitz" is named
- This prevents noise and respects group dynamics
- Group messages that @mention Kitz are processed through the full semantic router

### 10.5 WhatsApp Status for Business

WhatsApp Status (Stories equivalent) is an underutilized marketing channel:

**Usage patterns in LatAm:**
- 65% of WhatsApp users view Status updates daily
- Business Status posts get 15-30% view rates (much higher than Instagram Stories for SMBs)
- Status disappears after 24 hours -- creates urgency
- No algorithm: all contacts see your Status

**Recommended Status content for Kitz users:**

| Day | Content Type | Example |
|---|---|---|
| **Monday** | Product spotlight | Photo + price + "Escribeme para pedir" |
| **Tuesday** | Customer testimonial | Screenshot of thank-you message (with permission) |
| **Wednesday** | Behind-the-scenes | Photo/video of production/service delivery |
| **Thursday** | Special offer | "Solo hoy: 2x1 en..." |
| **Friday** | Social proof | "Ya vendimos 50 unidades esta semana" |
| **Saturday** | Weekend promo | "Ultimo dia para..." |
| **Sunday** | Personal/brand story | Owner story, values, why they started |

**Kitz integration opportunity (future):**
- `content_publish` tool could auto-publish to WhatsApp Status
- Track Status view analytics via WhatsApp Business API
- Suggest optimal Status posting times based on audience timezone

---

## 11. Compliance & Privacy

### 11.1 LGPD (Brazil) -- Lei Geral de Protecao de Dados

Brazil's comprehensive data protection law (Law 13.709/2018), effective since August 2020. Applies to ALL processing of Brazilian personal data, regardless of where the processor is located.

**Key requirements for Kitz WhatsApp operations:**

| Requirement | Description | Kitz Implementation |
|---|---|---|
| **Legal basis** | Must have one of 10 legal bases for processing | Consent (marketing), Contract (utility), Legitimate interest (CRM) |
| **Consent** | Active, informed, specific, unambiguous | Opt-in checkbox on workspace sign-up; WhatsApp opt-in message |
| **Data minimization** | Collect only what is necessary | CRM stores only: name, phone, email, tags, interaction history |
| **Purpose limitation** | Use data only for stated purpose | Separate consent for marketing vs transactional messaging |
| **Access rights** | Data subject can request all stored data | Kitz must provide data export tool |
| **Deletion rights** | Data subject can request erasure | CRM must support contact deletion with cascade |
| **Data breach** | Notify ANPD within "reasonable timeframe" | Incident response runbook |
| **DPO** | Required for certain data volumes | Designate DPO when scaling to Brazil |

**LGPD-specific WhatsApp rules:**
- Pre-checked consent checkboxes are NOT valid
- Marketing messages require explicit opt-in SEPARATE from transactional consent
- User must be informed of purpose BEFORE data collection
- Consent must be revocable at any time with same ease as it was given
- Data retention: define and enforce maximum retention periods

**Penalties:** Up to 2% of annual revenue (capped at R$50 million per violation).

### 11.2 Ley 1581 (Colombia) -- Habeas Data

Colombia's data protection law (Law 1581/2012), enforced by the Superintendencia de Industria y Comercio (SIC).

**Key requirements for Kitz WhatsApp operations:**

| Requirement | Description | Kitz Implementation |
|---|---|---|
| **Authorization** | Prior, explicit, informed consent | Written/digital consent before first marketing message |
| **Privacy notice** | Inform data subject of collection purpose | Privacy notice in auto-reply or first contact |
| **Data subject rights** | Know, update, rectify, revoke, delete | CRM must support all ARCO rights |
| **Data transfer** | International transfers require adequate protection | Supabase hosting region must have adequate protection |
| **Database registration** | Register databases with SIC (RNBD) | Required when operating in Colombia with user data |

**Colombia-specific:** Consent must be obtained for EACH purpose (marketing, profiling, analytics). A general "I accept terms" is not sufficient.

### 11.3 Mexico -- LFPDPPP

Federal Law on Protection of Personal Data Held by Private Parties (2010). Enforced by INAI.

**Key requirements:**
- Privacy notice (Aviso de Privacidad) must be provided BEFORE data collection
- Must include ARCO rights (Access, Rectification, Cancellation, Opposition)
- Consent can be implied for utility messages but MUST be explicit for marketing
- Cross-border transfers require consent or adequate protection

### 11.4 Opt-In / Opt-Out Implementation

**Kitz consent management system:**

```
CONSENT RECORD:
{
  contactId: "ct_abc123",
  phone: "+573001234567",
  consents: [
    {
      type: "whatsapp_transactional",
      granted: true,
      timestamp: "2026-02-25T14:30:00Z",
      method: "first_message_inbound",
      source: "whatsapp_auto_capture"
    },
    {
      type: "whatsapp_marketing",
      granted: true,
      timestamp: "2026-02-25T14:31:00Z",
      method: "quick_reply_button",
      source: "opt_in_flow_v1",
      message_id: "wamid.abc123"
    }
  ],
  optOuts: [],
  country: "CO",
  applicableLaw: "ley_1581"
}
```

**Opt-in collection flow:**

```
After auto-reply and first interaction:

"Por cierto, te gustaria recibir ofertas y novedades por WhatsApp?
Puedes cancelar cuando quieras."

[Quick Reply Buttons]
  [1] "Si, quiero ofertas"  --> Set whatsapp_marketing = true
  [2] "Solo pedidos"        --> Set whatsapp_marketing = false
  [3] "No gracias"          --> Set whatsapp_marketing = false
```

**Opt-out handling:**

| Trigger | Action |
|---|---|
| User sends "STOP", "PARAR", "NO MAS" | Set all marketing consent to false |
| User blocks the number | Detected via quality signals; mark as opted out |
| User replies "No quiero mas mensajes" | AI detects intent; sets marketing consent to false |
| User uses WhatsApp "Offers & Announcements" setting | Meta handles; reduces marketing delivery |
| Email/web opt-out request | Update CRM; cascade to WhatsApp consent |

### 11.5 Data Retention

| Data Type | Retention Period | Justification |
|---|---|---|
| Contact info | Active + 2 years after last interaction | Contractual + legitimate interest |
| Conversation history | 1 year | Customer support + dispute resolution |
| Payment records | 5-10 years (varies by country) | Tax and legal compliance |
| Marketing consent records | Indefinite (as long as consent is valid) | Proof of consent |
| Opt-out records | Indefinite | Must never re-contact opted-out users |
| Voice notes (transcribed) | 90 days original, transcript indefinite | Storage optimization |
| Media files | 30 days | Storage optimization; URLs expire anyway |

### 11.6 Meta Business Verification

Required for accessing higher messaging tiers and certain API features:

**Verification steps:**
1. Create a Meta Business Account at business.facebook.com
2. Submit business documents (registration, tax ID, utility bills)
3. Meta verifies business identity (1-5 business days)
4. Once verified: messaging limit increases to Tier 1 (1,000/day)
5. Display name approval for WhatsApp Business Profile

**Required documents by country:**

| Country | Business Registration | Tax ID | Additional |
|---|---|---|---|
| **Brazil** | CNPJ registration | CNPJ card | State registration (IE) |
| **Colombia** | Camara de Comercio certificate | RUT / NIT | N/A |
| **Mexico** | Acta constitutiva | RFC (Constancia de Situacion Fiscal) | N/A |
| **Argentina** | IGJ registration | CUIT | Monotributo certificate if applicable |
| **Chile** | Escritura social | RUT | N/A |
| **Peru** | SUNARP registration | RUC | N/A |
| **Panama** | Registro Publico | RUC / NIT | Aviso de Operacion |

---

## 12. TypeScript Implementation

### 12.1 Message Builder

A type-safe message builder for constructing WhatsApp Cloud API payloads:

```typescript
// ── whatsapp-message-builder.ts ──

/** WhatsApp Cloud API message types */
export type WaMessageType =
  | 'text' | 'image' | 'video' | 'audio' | 'document'
  | 'sticker' | 'location' | 'contacts' | 'interactive' | 'template';

export type InteractiveType =
  | 'button' | 'list' | 'product' | 'product_list' | 'cta_url' | 'flow';

export interface WaTextMessage {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'text';
  text: { preview_url?: boolean; body: string };
}

export interface WaImageMessage {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'image';
  image: { link?: string; id?: string; caption?: string };
}

export interface WaDocumentMessage {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'document';
  document: { link?: string; id?: string; caption?: string; filename?: string };
}

export interface WaLocationMessage {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'location';
  location: { latitude: number; longitude: number; name?: string; address?: string };
}

export interface ReplyButton {
  type: 'reply';
  reply: { id: string; title: string };
}

export interface ListRow {
  id: string;
  title: string;
  description?: string;
}

export interface ListSection {
  title: string;
  rows: ListRow[];
}

export interface WaInteractiveButtonMessage {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'interactive';
  interactive: {
    type: 'button';
    header?: { type: 'text'; text: string };
    body: { text: string };
    footer?: { text: string };
    action: { buttons: ReplyButton[] };
  };
}

export interface WaInteractiveListMessage {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'interactive';
  interactive: {
    type: 'list';
    header?: { type: 'text'; text: string };
    body: { text: string };
    footer?: { text: string };
    action: { button: string; sections: ListSection[] };
  };
}

export interface WaInteractiveCtaMessage {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'interactive';
  interactive: {
    type: 'cta_url';
    header?: { type: 'text'; text: string };
    body: { text: string };
    footer?: { text: string };
    action: {
      name: 'cta_url';
      parameters: { display_text: string; url: string };
    };
  };
}

export interface TemplateParameter {
  type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';
  text?: string;
  currency?: { fallback_value: string; code: string; amount_1000: number };
  date_time?: { fallback_value: string };
  image?: { link: string };
  document?: { link: string };
  video?: { link: string };
}

export interface TemplateComponent {
  type: 'header' | 'body' | 'button';
  sub_type?: 'quick_reply' | 'url';
  index?: string;
  parameters: TemplateParameter[];
}

export interface WaTemplateMessage {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'template';
  template: {
    name: string;
    language: { code: string };
    components?: TemplateComponent[];
  };
}

export type WaMessage =
  | WaTextMessage
  | WaImageMessage
  | WaDocumentMessage
  | WaLocationMessage
  | WaInteractiveButtonMessage
  | WaInteractiveListMessage
  | WaInteractiveCtaMessage
  | WaTemplateMessage;

// ── Builder Functions ──

export function textMessage(to: string, body: string, previewUrl = false): WaTextMessage {
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { preview_url: previewUrl, body },
  };
}

export function imageMessage(to: string, link: string, caption?: string): WaImageMessage {
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'image',
    image: { link, caption },
  };
}

export function documentMessage(
  to: string, link: string, filename: string, caption?: string,
): WaDocumentMessage {
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'document',
    document: { link, filename, caption },
  };
}

export function locationMessage(
  to: string, lat: number, lng: number, name?: string, address?: string,
): WaLocationMessage {
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'location',
    location: { latitude: lat, longitude: lng, name, address },
  };
}

export function buttonMessage(
  to: string,
  body: string,
  buttons: Array<{ id: string; title: string }>,
  header?: string,
  footer?: string,
): WaInteractiveButtonMessage {
  if (buttons.length > 3) throw new Error('Maximum 3 reply buttons allowed');
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      ...(header ? { header: { type: 'text', text: header } } : {}),
      body: { text: body },
      ...(footer ? { footer: { text: footer } } : {}),
      action: {
        buttons: buttons.map(b => ({
          type: 'reply' as const,
          reply: { id: b.id, title: b.title.slice(0, 25) },
        })),
      },
    },
  };
}

export function listMessage(
  to: string,
  body: string,
  buttonLabel: string,
  sections: ListSection[],
  header?: string,
  footer?: string,
): WaInteractiveListMessage {
  const totalRows = sections.reduce((n, s) => n + s.rows.length, 0);
  if (totalRows > 10) throw new Error('Maximum 10 rows across all sections');
  if (sections.length > 10) throw new Error('Maximum 10 sections');
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'list',
      ...(header ? { header: { type: 'text', text: header } } : {}),
      body: { text: body },
      ...(footer ? { footer: { text: footer } } : {}),
      action: { button: buttonLabel.slice(0, 20), sections },
    },
  };
}

export function ctaUrlMessage(
  to: string,
  body: string,
  displayText: string,
  url: string,
  header?: string,
  footer?: string,
): WaInteractiveCtaMessage {
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'cta_url',
      ...(header ? { header: { type: 'text', text: header } } : {}),
      body: { text: body },
      ...(footer ? { footer: { text: footer } } : {}),
      action: {
        name: 'cta_url',
        parameters: { display_text: displayText.slice(0, 25), url },
      },
    },
  };
}

export function templateMessage(
  to: string,
  templateName: string,
  languageCode: string,
  components?: TemplateComponent[],
): WaTemplateMessage {
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      ...(components ? { components } : {}),
    },
  };
}
```

### 12.2 Template Manager

Manages template registration, status tracking, and rendering:

```typescript
// ── whatsapp-template-manager.ts ──

export type TemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
export type TemplateStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAUSED' | 'DISABLED';

export interface TemplateRecord {
  name: string;
  category: TemplateCategory;
  language: string;
  status: TemplateStatus;
  headerText?: string;
  bodyText: string;
  footerText?: string;
  buttons?: Array<{ type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER'; text: string; url?: string }>;
  variableCount: number;
  createdAt: string;
  lastUsed?: string;
  deliveryRate?: number;
  readRate?: number;
  replyRate?: number;
  blockRate?: number;
}

/**
 * In-memory template registry.
 * Production: persist to Supabase `whatsapp_templates` table.
 */
const templates = new Map<string, TemplateRecord>();

// ── Cost lookup table (USD per delivered message, LatAm countries) ──
const COST_TABLE: Record<string, Record<TemplateCategory, number>> = {
  BR: { MARKETING: 0.0625, UTILITY: 0.0068, AUTHENTICATION: 0.004 },
  MX: { MARKETING: 0.036, UTILITY: 0.008, AUTHENTICATION: 0.005 },
  CO: { MARKETING: 0.020, UTILITY: 0.001, AUTHENTICATION: 0.003 },
  AR: { MARKETING: 0.032, UTILITY: 0.005, AUTHENTICATION: 0.004 },
  CL: { MARKETING: 0.055, UTILITY: 0.009, AUTHENTICATION: 0.005 },
  PE: { MARKETING: 0.035, UTILITY: 0.004, AUTHENTICATION: 0.004 },
  PA: { MARKETING: 0.030, UTILITY: 0.005, AUTHENTICATION: 0.004 },
  CR: { MARKETING: 0.030, UTILITY: 0.005, AUTHENTICATION: 0.004 },
  EC: { MARKETING: 0.028, UTILITY: 0.004, AUTHENTICATION: 0.003 },
  UY: { MARKETING: 0.028, UTILITY: 0.004, AUTHENTICATION: 0.003 },
  US: { MARKETING: 0.025, UTILITY: 0.004, AUTHENTICATION: 0.004 },
};

export function registerTemplate(record: TemplateRecord): void {
  templates.set(`${record.name}:${record.language}`, record);
}

export function getTemplate(name: string, language: string): TemplateRecord | undefined {
  return templates.get(`${name}:${language}`);
}

export function listTemplates(category?: TemplateCategory): TemplateRecord[] {
  const all = Array.from(templates.values());
  return category ? all.filter(t => t.category === category) : all;
}

export function estimateBroadcastCost(
  templateName: string,
  language: string,
  recipientCountries: string[],
): { totalCost: number; breakdown: Array<{ country: string; count: number; costPerMsg: number; subtotal: number }> } {
  const tpl = getTemplate(templateName, language);
  if (!tpl) throw new Error(`Template not found: ${templateName}:${language}`);

  const countryGroups = new Map<string, number>();
  for (const cc of recipientCountries) {
    countryGroups.set(cc, (countryGroups.get(cc) || 0) + 1);
  }

  let totalCost = 0;
  const breakdown: Array<{ country: string; count: number; costPerMsg: number; subtotal: number }> = [];

  for (const [country, count] of countryGroups) {
    const costs = COST_TABLE[country];
    const costPerMsg = costs ? costs[tpl.category] : 0.04; // Default fallback
    const subtotal = costPerMsg * count;
    totalCost += subtotal;
    breakdown.push({ country, count, costPerMsg, subtotal });
  }

  return { totalCost, breakdown };
}

/**
 * Check if a template body conforms to WhatsApp requirements.
 * Returns array of validation errors (empty = valid).
 */
export function validateTemplateBody(body: string, category: TemplateCategory): string[] {
  const errors: string[] = [];

  if (body.length > 1024) {
    errors.push(`Body exceeds 1024 character limit (${body.length} chars)`);
  }

  if (/\t/.test(body)) {
    errors.push('Body contains tab characters (not allowed)');
  }

  if (/\s{5,}/.test(body)) {
    errors.push('Body contains more than 4 consecutive spaces');
  }

  // Count variables
  const variables = body.match(/\{\{\d+\}\}/g) || [];
  if (variables.length > 0) {
    if (body.startsWith('{{')) {
      errors.push('Body cannot start with a variable placeholder');
    }
    if (body.endsWith('}}')) {
      errors.push('Body cannot end with a variable placeholder');
    }
  }

  // Marketing-specific: max 10 emojis
  if (category === 'MARKETING') {
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    const emojis = body.match(emojiRegex) || [];
    if (emojis.length > 10) {
      errors.push(`Marketing templates cannot have more than 10 emojis (found ${emojis.length})`);
    }
  }

  return errors;
}
```

### 12.3 Conversation State Machine

Tracks conversation state per contact for structured sales flows:

```typescript
// ── whatsapp-conversation-state.ts ──

export type ConversationState =
  | 'NEW_LEAD'
  | 'QUALIFYING'
  | 'QUALIFIED_MQL'
  | 'QUALIFIED_SQL'
  | 'QUOTE_SENT'
  | 'NEGOTIATING'
  | 'PAYMENT_PENDING'
  | 'CUSTOMER'
  | 'ONBOARDING'
  | 'ACTIVE'
  | 'DORMANT'
  | 'CHURNED'
  | 'OPTED_OUT';

export interface QualificationData {
  need?: string;
  budget?: string;
  timeline?: string;
  productInterest?: string[];
}

export interface ConversationContext {
  contactId: string;
  phone: string;
  state: ConversationState;
  qualification: QualificationData;
  quoteId?: string;
  quoteAmount?: number;
  orderId?: string;
  lastInteraction: string;
  interactionCount: number;
  tags: string[];
  language: string;
  country: string;
  marketingOptIn: boolean;
  pendingAction?: string;
}

/**
 * In-memory conversation state store.
 * Production: persist to Supabase `conversation_state` table.
 */
const conversations = new Map<string, ConversationContext>();

const DORMANT_THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000;  // 30 days
const CHURNED_THRESHOLD_MS = 90 * 24 * 60 * 60 * 1000;  // 90 days

export function getOrCreateConversation(phone: string, country = 'PA', language = 'es'): ConversationContext {
  let ctx = conversations.get(phone);
  if (!ctx) {
    ctx = {
      contactId: `ct_${Date.now().toString(36)}`,
      phone,
      state: 'NEW_LEAD',
      qualification: {},
      lastInteraction: new Date().toISOString(),
      interactionCount: 0,
      tags: ['new-lead'],
      language,
      country,
      marketingOptIn: false,
    };
    conversations.set(phone, ctx);
  }
  return ctx;
}

export function updateConversation(
  phone: string,
  updates: Partial<ConversationContext>,
): ConversationContext | null {
  const ctx = conversations.get(phone);
  if (!ctx) return null;
  Object.assign(ctx, updates, { lastInteraction: new Date().toISOString() });
  ctx.interactionCount++;
  return ctx;
}

export type TransitionEvent =
  | 'responds_to_qualification'
  | 'need_identified'
  | 'budget_timeline_confirmed'
  | 'quote_sent'
  | 'quote_accepted'
  | 'negotiation_started'
  | 'payment_confirmed'
  | 'onboarding_started'
  | 'delivery_complete'
  | 'inactivity_30d'
  | 'inactivity_90d'
  | 're_engaged'
  | 'opted_out';

const TRANSITIONS: Record<string, Partial<Record<TransitionEvent, ConversationState>>> = {
  NEW_LEAD:        { responds_to_qualification: 'QUALIFYING', opted_out: 'OPTED_OUT' },
  QUALIFYING:      { need_identified: 'QUALIFIED_MQL', opted_out: 'OPTED_OUT' },
  QUALIFIED_MQL:   { budget_timeline_confirmed: 'QUALIFIED_SQL', opted_out: 'OPTED_OUT' },
  QUALIFIED_SQL:   { quote_sent: 'QUOTE_SENT', opted_out: 'OPTED_OUT' },
  QUOTE_SENT:      { quote_accepted: 'PAYMENT_PENDING', negotiation_started: 'NEGOTIATING', opted_out: 'OPTED_OUT' },
  NEGOTIATING:     { quote_sent: 'QUOTE_SENT', opted_out: 'OPTED_OUT' },
  PAYMENT_PENDING: { payment_confirmed: 'CUSTOMER', opted_out: 'OPTED_OUT' },
  CUSTOMER:        { onboarding_started: 'ONBOARDING', opted_out: 'OPTED_OUT' },
  ONBOARDING:      { delivery_complete: 'ACTIVE', opted_out: 'OPTED_OUT' },
  ACTIVE:          { inactivity_30d: 'DORMANT', opted_out: 'OPTED_OUT' },
  DORMANT:         { re_engaged: 'ACTIVE', inactivity_90d: 'CHURNED', opted_out: 'OPTED_OUT' },
  CHURNED:         { re_engaged: 'ACTIVE', opted_out: 'OPTED_OUT' },
};

export function transition(phone: string, event: TransitionEvent): ConversationContext | null {
  const ctx = conversations.get(phone);
  if (!ctx) return null;

  const allowed = TRANSITIONS[ctx.state];
  if (!allowed || !allowed[event]) {
    console.warn(`[conversation] Invalid transition: ${ctx.state} + ${event} for ${phone}`);
    return ctx;
  }

  const newState = allowed[event]!;
  ctx.state = newState;
  ctx.lastInteraction = new Date().toISOString();
  ctx.interactionCount++;

  // Update tags based on state
  ctx.tags = ctx.tags.filter(t => !['new-lead', 'mql', 'sql', 'customer', 'dormant', 'churned'].includes(t));
  const stateTagMap: Partial<Record<ConversationState, string>> = {
    NEW_LEAD: 'new-lead',
    QUALIFIED_MQL: 'mql',
    QUALIFIED_SQL: 'sql',
    CUSTOMER: 'customer',
    ACTIVE: 'customer',
    DORMANT: 'dormant',
    CHURNED: 'churned',
    OPTED_OUT: 'opted-out',
  };
  const tag = stateTagMap[newState];
  if (tag && !ctx.tags.includes(tag)) ctx.tags.push(tag);

  return ctx;
}

/**
 * Periodic job: check all conversations for dormancy/churn transitions.
 * Call this from a cron job (e.g., daily at midnight).
 */
export function checkInactivity(): { dormant: number; churned: number } {
  const now = Date.now();
  let dormant = 0;
  let churned = 0;

  for (const [phone, ctx] of conversations) {
    const inactiveMs = now - new Date(ctx.lastInteraction).getTime();

    if (ctx.state === 'ACTIVE' && inactiveMs > DORMANT_THRESHOLD_MS) {
      transition(phone, 'inactivity_30d');
      dormant++;
    } else if (ctx.state === 'DORMANT' && inactiveMs > CHURNED_THRESHOLD_MS) {
      transition(phone, 'inactivity_90d');
      churned++;
    }
  }

  return { dormant, churned };
}

export function getConversationsByState(state: ConversationState): ConversationContext[] {
  return Array.from(conversations.values()).filter(c => c.state === state);
}

export function getConversationStats(): Record<ConversationState, number> {
  const stats: Partial<Record<ConversationState, number>> = {};
  for (const ctx of conversations.values()) {
    stats[ctx.state] = (stats[ctx.state] || 0) + 1;
  }
  return stats as Record<ConversationState, number>;
}
```

### 12.4 Webhook Handler

Handles incoming WhatsApp Cloud API webhook events:

```typescript
// ── whatsapp-webhook-handler.ts ──

/**
 * WhatsApp Cloud API Webhook Handler
 *
 * Handles:
 * - Webhook verification (GET request from Meta)
 * - Incoming messages (text, media, interactive replies, location, contacts)
 * - Message status updates (sent, delivered, read, failed)
 * - Errors and system notifications
 */

export interface WebhookVerifyQuery {
  'hub.mode': string;
  'hub.verify_token': string;
  'hub.challenge': string;
}

export interface WebhookMessage {
  from: string;
  id: string;
  timestamp: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker'
    | 'location' | 'contacts' | 'interactive' | 'button' | 'order' | 'reaction';
  text?: { body: string };
  image?: { id: string; mime_type: string; sha256: string; caption?: string };
  video?: { id: string; mime_type: string; sha256: string; caption?: string };
  audio?: { id: string; mime_type: string; sha256: string; voice?: boolean };
  document?: { id: string; mime_type: string; sha256: string; filename?: string; caption?: string };
  location?: { latitude: number; longitude: number; name?: string; address?: string };
  contacts?: Array<{
    name: { formatted_name: string; first_name?: string; last_name?: string };
    phones?: Array<{ phone: string; type?: string }>;
  }>;
  interactive?: {
    type: 'button_reply' | 'list_reply';
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string; description?: string };
  };
  order?: {
    catalog_id: string;
    product_items: Array<{
      product_retailer_id: string;
      quantity: number;
      item_price: number;
      currency: string;
    }>;
  };
  reaction?: { message_id: string; emoji: string };
  context?: { from: string; id: string };
}

export interface WebhookStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  errors?: Array<{ code: number; title: string; message: string; error_data?: { details: string } }>;
  pricing?: { billable: boolean; pricing_model: string; category: string };
}

export interface WebhookEntry {
  id: string;
  changes: Array<{
    value: {
      messaging_product: 'whatsapp';
      metadata: { display_phone_number: string; phone_number_id: string };
      contacts?: Array<{ profile: { name: string }; wa_id: string }>;
      messages?: WebhookMessage[];
      statuses?: WebhookStatus[];
      errors?: Array<{ code: number; title: string; message: string }>;
    };
    field: string;
  }>;
}

export interface WebhookPayload {
  object: 'whatsapp_business_account';
  entry: WebhookEntry[];
}

// ── Verification Handler ──

export function handleVerification(
  query: WebhookVerifyQuery,
  expectedToken: string,
): { status: number; body: string } {
  if (
    query['hub.mode'] === 'subscribe' &&
    query['hub.verify_token'] === expectedToken
  ) {
    console.log('[webhook] Verification successful');
    return { status: 200, body: query['hub.challenge'] };
  }
  console.warn('[webhook] Verification failed — token mismatch');
  return { status: 403, body: 'Forbidden' };
}

// ── Event Extraction ──

export interface ParsedWebhookEvent {
  type: 'message' | 'status' | 'error';
  phoneNumberId: string;
  displayPhoneNumber: string;
  message?: WebhookMessage & { senderName?: string; senderWaId?: string };
  status?: WebhookStatus;
  error?: { code: number; title: string; message: string };
}

export function parseWebhookPayload(payload: WebhookPayload): ParsedWebhookEvent[] {
  const events: ParsedWebhookEvent[] = [];

  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      if (change.field !== 'messages') continue;
      const value = change.value;
      const phoneNumberId = value.metadata.phone_number_id;
      const displayPhoneNumber = value.metadata.display_phone_number;

      // Process messages
      if (value.messages) {
        for (const msg of value.messages) {
          const contact = value.contacts?.find(c => c.wa_id === msg.from);
          events.push({
            type: 'message',
            phoneNumberId,
            displayPhoneNumber,
            message: {
              ...msg,
              senderName: contact?.profile?.name,
              senderWaId: contact?.wa_id,
            },
          });
        }
      }

      // Process statuses
      if (value.statuses) {
        for (const status of value.statuses) {
          events.push({
            type: 'status',
            phoneNumberId,
            displayPhoneNumber,
            status,
          });
        }
      }

      // Process errors
      if (value.errors) {
        for (const error of value.errors) {
          events.push({
            type: 'error',
            phoneNumberId,
            displayPhoneNumber,
            error,
          });
        }
      }
    }
  }

  return events;
}

// ── Status Tracking ──

export interface MessageDeliveryStats {
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  failedErrors: Array<{ code: number; message: string; count: number }>;
}

const deliveryStats = new Map<string, MessageDeliveryStats>();

export function trackMessageStatus(status: WebhookStatus): void {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  let stats = deliveryStats.get(date);
  if (!stats) {
    stats = { sent: 0, delivered: 0, read: 0, failed: 0, failedErrors: [] };
    deliveryStats.set(date, stats);
  }

  switch (status.status) {
    case 'sent': stats.sent++; break;
    case 'delivered': stats.delivered++; break;
    case 'read': stats.read++; break;
    case 'failed': {
      stats.failed++;
      if (status.errors) {
        for (const err of status.errors) {
          const existing = stats.failedErrors.find(e => e.code === err.code);
          if (existing) {
            existing.count++;
          } else {
            stats.failedErrors.push({ code: err.code, message: err.title, count: 1 });
          }
        }
      }
      break;
    }
  }
}

export function getDeliveryStats(date?: string): MessageDeliveryStats | undefined {
  const key = date || new Date().toISOString().slice(0, 10);
  return deliveryStats.get(key);
}
```

### 12.5 WhatsApp Cloud API Client

HTTP client for sending messages through the WhatsApp Cloud API:

```typescript
// ── whatsapp-cloud-client.ts ──

import type { WaMessage } from './whatsapp-message-builder.js';

export interface CloudApiConfig {
  accessToken: string;
  phoneNumberId: string;
  apiVersion?: string;
  baseUrl?: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: { code: number; message: string; details?: string };
}

export interface MediaUploadResult {
  id: string;
}

const DEFAULT_API_VERSION = 'v21.0';
const DEFAULT_BASE_URL = 'https://graph.facebook.com';

export class WhatsAppCloudClient {
  private config: Required<CloudApiConfig>;

  constructor(config: CloudApiConfig) {
    this.config = {
      ...config,
      apiVersion: config.apiVersion || DEFAULT_API_VERSION,
      baseUrl: config.baseUrl || DEFAULT_BASE_URL,
    };
  }

  private get messagesUrl(): string {
    return `${this.config.baseUrl}/${this.config.apiVersion}/${this.config.phoneNumberId}/messages`;
  }

  private get mediaUrl(): string {
    return `${this.config.baseUrl}/${this.config.apiVersion}/${this.config.phoneNumberId}/media`;
  }

  private get headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.accessToken}`,
    };
  }

  /** Send any WhatsApp message (text, template, interactive, media, etc.) */
  async sendMessage(message: WaMessage): Promise<SendResult> {
    try {
      const res = await fetch(this.messagesUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(message),
        signal: AbortSignal.timeout(30_000),
      });

      const data = await res.json() as any;

      if (!res.ok) {
        return {
          success: false,
          error: {
            code: data.error?.code || res.status,
            message: data.error?.message || 'Unknown error',
            details: data.error?.error_data?.details,
          },
        };
      }

      return {
        success: true,
        messageId: data.messages?.[0]?.id,
      };
    } catch (err) {
      return {
        success: false,
        error: {
          code: 0,
          message: (err as Error).message,
        },
      };
    }
  }

  /** Upload media (image, video, audio, document) and get a media ID */
  async uploadMedia(
    buffer: Buffer,
    mimeType: string,
    filename?: string,
  ): Promise<MediaUploadResult | { error: string }> {
    const formData = new FormData();
    const blob = new Blob([buffer], { type: mimeType });
    formData.append('file', blob, filename || 'file');
    formData.append('type', mimeType);
    formData.append('messaging_product', 'whatsapp');

    try {
      const res = await fetch(this.mediaUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.config.accessToken}` },
        body: formData,
        signal: AbortSignal.timeout(60_000),
      });

      const data = await res.json() as any;

      if (!res.ok) {
        return { error: data.error?.message || 'Upload failed' };
      }

      return { id: data.id };
    } catch (err) {
      return { error: (err as Error).message };
    }
  }

  /** Download media by ID (returns temporary URL) */
  async getMediaUrl(mediaId: string): Promise<string | null> {
    try {
      const res = await fetch(
        `${this.config.baseUrl}/${this.config.apiVersion}/${mediaId}`,
        { headers: this.headers, signal: AbortSignal.timeout(10_000) },
      );
      const data = await res.json() as any;
      return data.url || null;
    } catch {
      return null;
    }
  }

  /** Mark a message as read (sends blue ticks) */
  async markAsRead(messageId: string): Promise<boolean> {
    try {
      const res = await fetch(this.messagesUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /** Get business profile */
  async getBusinessProfile(): Promise<Record<string, unknown> | null> {
    try {
      const res = await fetch(
        `${this.config.baseUrl}/${this.config.apiVersion}/${this.config.phoneNumberId}/whatsapp_business_profile?fields=about,address,description,email,profile_picture_url,websites,vertical`,
        { headers: this.headers, signal: AbortSignal.timeout(10_000) },
      );
      const data = await res.json() as any;
      return data.data?.[0] || null;
    } catch {
      return null;
    }
  }
}
```

### 12.6 Broadcast Orchestrator

Coordinates bulk message sending with rate limiting, quality monitoring, and cost tracking:

```typescript
// ── whatsapp-broadcast-orchestrator.ts ──

import type { WhatsAppCloudClient, SendResult } from './whatsapp-cloud-client.js';
import { templateMessage, type TemplateComponent } from './whatsapp-message-builder.js';
import { estimateBroadcastCost, getTemplate } from './whatsapp-template-manager.js';

export interface BroadcastRecipient {
  phone: string;
  country: string;
  variables?: Record<string, string>;
  language?: string;
}

export interface BroadcastConfig {
  templateName: string;
  defaultLanguage: string;
  recipients: BroadcastRecipient[];
  components?: TemplateComponent[];
  /** Max messages per second (default: 40 -- half of Cloud API limit for safety) */
  rateLimit?: number;
  /** Max block rate before auto-pausing (default: 0.02 = 2%) */
  maxBlockRate?: number;
  /** Dry run -- estimate cost without sending */
  dryRun?: boolean;
}

export interface BroadcastResult {
  totalRecipients: number;
  sent: number;
  failed: number;
  estimatedCost: number;
  errors: Array<{ phone: string; error: string }>;
  paused: boolean;
  pauseReason?: string;
  durationMs: number;
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function executeBroadcast(
  client: WhatsAppCloudClient,
  config: BroadcastConfig,
): Promise<BroadcastResult> {
  const startTime = Date.now();
  const {
    templateName,
    defaultLanguage,
    recipients,
    rateLimit = 40,
    maxBlockRate = 0.02,
    dryRun = false,
  } = config;

  // Validate template exists and is approved
  const tpl = getTemplate(templateName, defaultLanguage);
  if (!tpl) {
    return {
      totalRecipients: recipients.length,
      sent: 0, failed: 0, estimatedCost: 0,
      errors: [{ phone: 'N/A', error: `Template not found: ${templateName}:${defaultLanguage}` }],
      paused: false, durationMs: 0,
    };
  }

  if (tpl.status !== 'APPROVED') {
    return {
      totalRecipients: recipients.length,
      sent: 0, failed: 0, estimatedCost: 0,
      errors: [{ phone: 'N/A', error: `Template status is ${tpl.status}, must be APPROVED` }],
      paused: false, durationMs: 0,
    };
  }

  // Estimate cost
  const countries = recipients.map(r => r.country);
  const costEstimate = estimateBroadcastCost(templateName, defaultLanguage, countries);

  if (dryRun) {
    return {
      totalRecipients: recipients.length,
      sent: 0, failed: 0,
      estimatedCost: costEstimate.totalCost,
      errors: [],
      paused: false,
      durationMs: Date.now() - startTime,
    };
  }

  // Send messages with rate limiting
  let sent = 0;
  let failed = 0;
  const errors: Array<{ phone: string; error: string }> = [];
  let paused = false;
  let pauseReason: string | undefined;
  const delayMs = Math.ceil(1000 / rateLimit);

  for (let i = 0; i < recipients.length; i++) {
    // Check block rate every 50 messages
    if (sent > 0 && sent % 50 === 0) {
      const blockRate = failed / sent;
      if (blockRate > maxBlockRate) {
        paused = true;
        pauseReason = `Block rate ${(blockRate * 100).toFixed(1)}% exceeds ${maxBlockRate * 100}% threshold after ${sent} messages`;
        break;
      }
    }

    const recipient = recipients[i];
    const lang = recipient.language || defaultLanguage;
    const msg = templateMessage(recipient.phone, templateName, lang, config.components);

    const result: SendResult = await client.sendMessage(msg);

    if (result.success) {
      sent++;
    } else {
      failed++;
      errors.push({
        phone: recipient.phone,
        error: result.error?.message || 'Unknown error',
      });
    }

    // Rate limiting delay
    if (i < recipients.length - 1) {
      await sleep(delayMs);
    }
  }

  return {
    totalRecipients: recipients.length,
    sent,
    failed,
    estimatedCost: costEstimate.totalCost,
    errors,
    paused,
    pauseReason,
    durationMs: Date.now() - startTime,
  };
}
```

---

## Appendix A: API Quick Reference

### Essential Cloud API Endpoints

| Action | Method | Endpoint |
|---|---|---|
| Send message | POST | `/{PHONE_NUMBER_ID}/messages` |
| Upload media | POST | `/{PHONE_NUMBER_ID}/media` |
| Get media URL | GET | `/{MEDIA_ID}` |
| Download media | GET | `{MEDIA_URL}` (with auth header) |
| Get business profile | GET | `/{PHONE_NUMBER_ID}/whatsapp_business_profile` |
| Update business profile | POST | `/{PHONE_NUMBER_ID}/whatsapp_business_profile` |
| Register phone number | POST | `/{PHONE_NUMBER_ID}/register` |
| Create template | POST | `/{WABA_ID}/message_templates` |
| Get templates | GET | `/{WABA_ID}/message_templates` |
| Delete template | DELETE | `/{WABA_ID}/message_templates?name={NAME}` |
| Get phone numbers | GET | `/{WABA_ID}/phone_numbers` |
| Get quality rating | GET | `/{WABA_ID}/phone_numbers?fields=quality_rating` |

**Base URL:** `https://graph.facebook.com/v21.0`
**Auth:** `Authorization: Bearer {SYSTEM_USER_ACCESS_TOKEN}`

### Webhook Event Types

| Event | Field | Description |
|---|---|---|
| Message received | `messages` | Inbound message from customer |
| Message status | `statuses` | Delivery status (sent, delivered, read, failed) |
| Error | `errors` | API or system errors |
| Template status | `message_template_status_update` | Template approved/rejected |
| Phone number quality | `phone_number_quality_update` | Quality rating change |
| Account update | `account_update` | WABA-level changes |

---

## Appendix B: Kitz Integration Map

### Current State (Baileys Connector)

```
WhatsApp User
  --> Baileys WASocket (kitz-whatsapp-connector, port 3006)
    --> sessions.ts (multi-user session manager)
      --> commandParser.ts (Tier 1: regex-based routing)
      --> semanticRouter.ts (Tier 2: AI-powered 5-phase pipeline)
        --> 68+ tools via OsToolRegistry
          --> Workspace MCP (Supabase CRM, orders, storefronts)
          --> Direct tools (email, calendar, voice, web, broadcast)
    --> autoReplyConfig.ts (external sender auto-reply)
```

### Future State (Cloud API Migration Path)

```
WhatsApp User
  --> WhatsApp Cloud API (Meta-hosted)
    --> Webhook endpoint (kitz-gateway or kitz-whatsapp-connector)
      --> whatsapp-webhook-handler.ts (event parsing)
      --> whatsapp-conversation-state.ts (state machine)
      --> commandParser.ts (Tier 1: regex-based routing)
      --> semanticRouter.ts (Tier 2: AI-powered 5-phase pipeline)
        --> 68+ tools via OsToolRegistry
      --> whatsapp-cloud-client.ts (outbound message sending)
        --> whatsapp-message-builder.ts (type-safe payloads)
        --> whatsapp-template-manager.ts (template rendering)
        --> whatsapp-broadcast-orchestrator.ts (bulk sending)
```

### Migration Strategy

1. **Phase 1 (Current):** Baileys connector for organic, self-chat-based interaction
2. **Phase 2:** Add Cloud API webhook handler alongside Baileys (dual-mode)
3. **Phase 3:** Cloud API for outbound (templates, broadcasts), Baileys for inbound
4. **Phase 4:** Full Cloud API migration when all users have WABA accounts

---

## Appendix C: Reference Links

- [WhatsApp Cloud API Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [WhatsApp Business Platform Pricing](https://business.whatsapp.com/products/platform-pricing)
- [WhatsApp Message Template Guidelines](https://developers.facebook.com/docs/whatsapp/message-templates/guidelines)
- [WhatsApp Interactive Messages](https://developers.facebook.com/docs/whatsapp/guides/interactive-messages)
- [WhatsApp Commerce API](https://developers.facebook.com/docs/whatsapp/guides/commerce)
- [WhatsApp Webhook Events](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks)
- [Meta Business Verification](https://www.facebook.com/business/help/2058515294227817)
- [WhatsApp Business Policy](https://business.whatsapp.com/policy)
- [LGPD Full Text (Portuguese)](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [Colombia Ley 1581 (Spanish)](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981)
- [WhatsApp Node.js SDK](https://whatsapp.github.io/WhatsApp-Nodejs-SDK/)
- [Infobip WhatsApp Compliance Guide](https://www.infobip.com/docs/whatsapp/compliance)
