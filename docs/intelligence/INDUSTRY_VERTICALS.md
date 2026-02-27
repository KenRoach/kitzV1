# Industry Vertical Intelligence for LatAm SMBs

**Document type:** Strategic Intelligence Brief
**Last updated:** 2026-02-24
**Audience:** Kitz platform -- AI agents, vertical features, and SMB owners
**Classification:** Internal Strategy

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Vertical 1: Restaurant & Food Service](#vertical-1-restaurant--food-service)
3. [Vertical 2: Retail & E-commerce](#vertical-2-retail--e-commerce)
4. [Vertical 3: Professional Services](#vertical-3-professional-services)
5. [Vertical 4: Beauty & Wellness](#vertical-4-beauty--wellness)
6. [Cross-Vertical Feature Matrix](#cross-vertical-kitz-platform-feature-matrix)
7. [Integration Priority Roadmap](#integration-priority-roadmap)
8. [Sources & References](#sources--references)

---

## Executive Summary

Latin America's SMB landscape is undergoing a rapid digital transformation, driven by mobile-first
consumer behavior, the dominance of WhatsApp as a business communication channel, and the growth
of platform-based ecosystems (Mercado Libre, Rappi, iFood). This document provides research-backed
intelligence across four high-priority verticals for Kitz: Restaurant & Food Service, Retail &
E-commerce, Professional Services, and Beauty & Wellness.

**Key cross-vertical findings:**

- **WhatsApp is the operating system of LatAm SMBs.** 87% of companies in Latin America use
  WhatsApp to communicate with customers. 80% of SMBs in India and Brazil use it daily. For Kitz,
  WhatsApp-native workflows are not a feature -- they are the foundation.
- **E-commerce in LatAm is projected to surpass USD 215 billion**, with Brazil, Mexico, and
  Argentina accounting for 84.5% of retail e-commerce sales.
- **The beauty and personal care market** generated USD 67.89 billion in revenue in 2025, making
  LatAm one of the world's largest beauty markets.
- **Quick-service restaurants** alone represent a USD 94.61 billion market growing at 9.87% CAGR.
- **Digital adoption remains low in back-office operations**: LatAm accounts for only 4% of global
  restaurant management software usage, signaling massive opportunity for Kitz.

---

## Vertical 1: Restaurant & Food Service

### 1.1 Market Overview

**Market Size and Growth:**

- The Latin America and Caribbean quick-service restaurant market is projected to grow from
  USD 94.61 billion (2025) to USD 182.80 billion by 2032, a CAGR of 9.87%.
- The fast food segment alone was valued at USD 61.49 billion in 2025 and is expected to reach
  USD 94.98 billion by 2034.
- Brazil's food service market is the region's largest, followed by Mexico, Colombia, and Argentina.

**Digital Adoption:**

- Brazil leads digital adoption with 78% of fast food transactions involving delivery or mobile
  ordering.
- Online food delivery is the fastest-growing distribution channel, registering a CAGR of 14.8%
  (2026-2034).
- Despite this consumer-facing digitization, only 4% of global restaurant management software
  usage comes from LatAm -- indicating that back-of-house operations remain largely manual.
- Digital kiosks and self-ordering systems are rolling out across major chains in Chile, Argentina,
  and Brazil.

**Typical Restaurant Challenges in LatAm:**

- High delivery platform commissions (20-30%+) eating into thin margins.
- Manual inventory tracking leading to food waste (perishables).
- Fragmented order channels (walk-in, phone, WhatsApp, multiple delivery apps).
- Complex and variable food safety regulations across countries.
- High staff turnover and informal labor arrangements.
- Cash-heavy transactions complicating bookkeeping.
- Lack of integrated technology (separate POS, accounting, and delivery management).

### 1.2 Delivery Platform Integration

#### Rappi

**Coverage:** Colombia, Mexico, Brazil, Chile, Peru, Ecuador, Costa Rica, Argentina

**Commission Structure:**
- Standard commission: 15% to 30% depending on agreement terms.
- Exclusive partnerships (Rappi-only restaurants): typically 20-25%.
- Multi-platform restaurants: rates can reach up to 40%.
- Additional costs: payment processing fees, marketing/promotional charges, packaging fees.
- Note: Commissions are negotiable based on restaurant size, order volume, and location.

**API Integration (developer portal: dev-portal.rappi.com):**
- Order management: receive, accept, reject, and track orders.
- Menu management: create, update, and disable menu items.
- Store information: manage operating hours, store status.
- Item availability: real-time toggling of available/unavailable items.
- Webhook configuration: receive real-time updates on order status changes.
- **API quality requirement:** Integrations must maintain a 98% success rate or face revoked
  access, removal, or disabling of restaurant stores.

**Kitz Integration Opportunity:**
- Aggregate Rappi orders into Kitz's unified order management.
- Sync Kitz product catalog to Rappi menu automatically.
- Pull commission data into Kitz financial reporting.
- Auto-reconcile Rappi payouts against orders.

#### PedidosYa (Delivery Hero)

**Coverage:** Argentina, Uruguay, Chile, Bolivia, Paraguay, Dominican Republic, Panama, Ecuador,
Guatemala, Honduras, El Salvador, Nicaragua, Costa Rica, Peru, Venezuela (15 countries)

**Commission Structure:**
- Commission rates are negotiated locally and not publicly disclosed.
- Industry estimates place standard commissions at 20-30%, similar to Rappi.
- Delivery Hero's global average take rate is approximately 25%.
- Contact local Delivery Hero representative for exact rates.

**API Integration (developers.deliveryhero.com / developer.pedidosya.com):**

Two integration models:

1. **Indirect Integration:** Vendor uses a PedidosYa device to receive orders. Orders flow through
   Integration Middleware to the vendor's POS system.
2. **Direct Integration:** Orders are pushed directly from PedidosYa through Integration Middleware
   to the vendor's POS system (no PedidosYa device needed).

Key API capabilities:
- **Order Transmission API:** Receive and manage incoming orders, accept/reject, update preparation
  time.
- **Assortment API:** Manage purchasable items individually or in bulk -- amend price, status,
  quantity.
- **Store Management:** Update operating hours, delivery zones, store status.
- **Webhook support:** Real-time event notifications.

**Kitz Integration Opportunity:**
- Direct POS integration model maps well to Kitz's architecture.
- Assortment API enables two-way catalog sync with Kitz inventory.
- Coverage in 15 countries makes this the widest LatAm delivery platform for Kitz.

#### iFood

**Coverage:** Brazil (dominant -- approximately 87% market share)

**Market Position:**
- Latin America's largest restaurant delivery service.
- Over 80% market share in Brazilian food delivery.
- Strategic partnership with Uber (May 2025) enabling ride-hailing within the iFood app.
- Provides restaurants with demand forecasting and menu optimization insights.

**Integration Details:**
- iFood Portal for restaurants provides self-service menu and pricing management.
- API-enabled integration is a key growth driver (delivery CAGR of 10.07% to 2031).
- iFood leverages Kevel's API-based ad serving tools, growing monthly Food Delivery Ad revenue
  by 1900% in one year.
- Advanced data analytics engine provides restaurants with demand forecasting and menu optimization.

**Commission Structure:**
- Standard commission: approximately 12% to 27%, varying by plan and services.
- Lower rates for pickup orders.
- Premium plans with higher visibility carry higher commission.
- iFood's dominance in Brazil means restaurants have limited negotiating power.

**Kitz Integration Opportunity:**
- Essential for any Kitz restaurant customer in Brazil.
- Sync iFood analytics data into Kitz dashboards for unified business intelligence.
- Map iFood order data to Kitz inventory for automatic stock deductions.

#### DiDi Food

**Coverage:** Mexico (strong), Colombia, Brazil (relaunched)

**Commission Structure (Mexico 2025):**
- **Marketplace model** (DiDi's delivery fleet): approximately 18%.
- **Full Service model** (DiDi handles acquisition + delivery): 30% or more.
- Additional costs: 16% IVA (VAT) on commission amount, activation fees up to MXN 3,500,
  promotional co-financing costs.
- Rates vary by city, plan, sales volume, and direct negotiation with account executive.

**Integration:**
- DiDi Food can be integrated via third-party aggregators like Ordatic.
- Direct API access is more limited compared to Rappi or PedidosYa.

**Kitz Integration Opportunity:**
- Important for Mexico-focused restaurant customers.
- Aggregation through middleware (Ordatic, Deliverect) may be the initial path.
- Lower commissions than competitors make DiDi attractive for cost-conscious restaurants.

#### Uber Eats

**Coverage:** Present across LatAm but declining in some markets; merged with iFood in Brazil.

**Commission Structure:**
- **Lite Plan:** 15% (basic listing, pickup-friendly).
- **Plus Plan:** 25% (better visibility, Uber One perks).
- **Premium Plan:** 30% (maximum exposure, marketing support).
- Pickup orders: 15% across all plans.

**Integration:**
- Well-documented API with extensive developer resources.
- Integration with Toast, Square, and other POS systems available.
- Operates in 12,000+ cities across 50+ countries globally.

**Kitz Integration Opportunity:**
- Secondary priority given iFood dominance in Brazil and Rappi strength elsewhere.
- Useful for restaurants seeking maximum delivery platform coverage.
- Standard REST API makes integration straightforward.

### 1.3 Restaurant Operations Intelligence

#### Food Safety & Health Permits by Country

**Mexico -- COFEPRIS (Comision Federal para la Proteccion contra Riesgos Sanitarios):**
- Federal regulatory agency for health risks.
- Issues sanitary licenses (licencia sanitaria) for food establishments.
- Requires notification-based system for food manufacturing, import, and distribution.
- Sanctions: administrative fines, temporary/definitive closure, suspension of permits.
- Key regulation: NOM-251-SSA1-2009 (hygiene practices for food processing).
- Municipal permits also required (varying by state/city).

**Brazil -- ANVISA (Agencia Nacional de Vigilancia Sanitaria):**
- National Agency of Sanitary Surveillance under the Ministry of Health.
- Oversees safety of all processed food products.
- Requires compliance and registration of any food processing facility.
- Manages food additives, packaging, and contaminant standards.
- State and municipal health departments issue local operating permits (alvara sanitario).
- RDC 216/2004 establishes good practices for food services.

**Colombia -- INVIMA (Instituto Nacional de Vigilancia de Medicamentos y Alimentos):**
- Colombia's FDA equivalent, overseeing sanitary registrations for food products.
- Risk-based classification system:
  - **High Risk:** Sanitary Registration (RSA) -- valid 5 years.
  - **Medium Risk:** Sanitary Permit (PSA) -- valid 7 years.
  - **Low Risk:** Sanitary Notification (NSA) -- valid 10 years.
- New digital platform InvimAgil launched May 2025 for streamlined registration.
- Raw materials used by food service operators do NOT require INVIMA registration.
- Restaurants need local municipal health inspection approval (concepto sanitario).

**Kitz Compliance Feature Opportunity:**
- Track permit expiration dates and send renewal reminders.
- Store digital copies of health certificates and inspection reports.
- Country-specific compliance checklists for restaurant setup.
- Integration with local government digital platforms (InvimAgil, COFEPRIS portal).

#### Menu Engineering

The classic menu engineering matrix (Boston Consulting Group-style):

| Category | Popularity | Profitability | Strategy |
|---|---|---|---|
| **Stars** | High | High | Promote heavily, maintain quality |
| **Plowhorses** | High | Low | Re-engineer costs, raise prices carefully |
| **Puzzles** | Low | High | Reposition on menu, improve marketing |
| **Dogs** | Low | Low | Remove or completely redesign |

**Kitz AI Agent Opportunity:**
- Analyze sales data to auto-classify menu items.
- Suggest price adjustments based on food cost and popularity.
- Recommend menu placement and promotion strategies.
- Track seasonal trends and adjust menu engineering quarterly.

#### Food Cost Control

**Industry targets:**
- Food cost percentage target: 28-35% of revenue.
- Prime cost (food + labor) target: below 65% of revenue.
- Average food waste: 4-10% of food purchased (reducing this is a major margin opportunity).

**Kitz inventory features for food cost:**
- Track ingredient costs and link to menu items (recipe costing).
- Calculate theoretical vs. actual food cost.
- Flag items exceeding target food cost percentage.
- Perishable inventory alerts (expiration date tracking).
- Waste logging and analysis.
- Vendor price comparison across suppliers.

#### POS Integration Considerations

**Common POS systems in LatAm restaurants:**
- **Square:** Budget-friendly, growing in LatAm. Good for small restaurants.
- **Toast:** Restaurant-specific. Strong in US, emerging in LatAm.
- **Otter (formerly Ordermark):** Delivery order aggregation.
- **Poster POS:** Popular in LatAm, affordable, cloud-based.
- **Clip (Mexico):** Payment terminal widely used by Mexican SMBs.
- **SumUp (Brazil):** Low-cost card reader with POS functionality.
- **Local solutions:** Many restaurants still use basic cash registers or no POS.

**Kitz POS strategy:**
- Do not build a full POS. Instead, integrate with existing POS systems.
- Offer lightweight order management for restaurants without a POS.
- Focus on aggregating data FROM POS into Kitz's unified dashboard.

### 1.4 Kitz Features for Restaurants

| Feature | Description | Priority |
|---|---|---|
| **Menu-to-invoice flow** | Create invoices directly from menu items ordered | High |
| **Delivery platform aggregation** | Unified inbox for Rappi, PedidosYa, iFood, DiDi, Uber Eats | High |
| **Food cost tracking** | Link inventory to recipes, calculate real-time food cost % | High |
| **WhatsApp order taking** | Accept orders via WhatsApp, auto-create tickets | Critical |
| **Reservation management** | Table booking via WhatsApp or web widget | Medium |
| **Kitchen display integration** | Send orders to kitchen screens (future) | Low |
| **Customer loyalty** | Points/stamps programs via WhatsApp | Medium |
| **Staff scheduling** | Shift management with labor cost tracking | Medium |
| **Supplier management** | Track vendors, compare prices, auto-reorder | Medium |
| **Commission reconciliation** | Match delivery platform payouts to orders | High |
| **Compliance tracker** | Health permit expiration reminders, inspection logs | Medium |

---

## Vertical 2: Retail & E-commerce

### 2.1 Market Overview

**Market Size and Growth:**

- Latin America e-commerce retail sales surpassed USD 200 billion in 2025.
- Projected to exceed USD 215 billion in 2026.
- Growth rate above 12.2% year-over-year, making LatAm the fastest-growing e-commerce region
  globally.
- CAGR of 9.43% projected between 2025 and 2029.
- Brazil, Mexico, and Argentina account for 84.5% of all retail e-commerce sales.
- Mexico is on track to surpass US e-commerce penetration levels by 2026.

**E-commerce Logistics Market:**

- Latin America e-commerce logistics market expected to reach USD 6.28 billion in 2025, growing
  to USD 10.25 billion by 2030 (CAGR 10.30%).
- Last-mile delivery market: USD 11.85 billion (2024) growing to USD 43.66 billion by 2033
  (CAGR 15.60%).

### 2.2 Marketplace Integration

#### Mercado Libre -- Dominant LatAm Marketplace

**Coverage:** Argentina (HQ), Brazil, Mexico, Colombia, Chile, Uruguay, Peru, Ecuador, Venezuela,
Bolivia, Paraguay, Honduras, Guatemala, El Salvador, Nicaragua, Costa Rica, Dominican Republic, Panama

**Commission Structure:**
- Seller commissions range from 10% to 22% depending on product category.
- General range: 11-17% per sale.
- Varies by country, category, and seller tier.
- Publication types: free, gold_special, gold_pro (availability varies by site).
- Use the Listing Prices API to query exact fees for a given site, category, currency, and quantity.

**API Integration (developers.mercadolibre.com):**

Core API capabilities:
- **Listings API:** Create, update, and manage product listings.
- **Orders API:** Retrieve and manage sales orders.
- **Shipping API (Mercado Envios):** Print labels, track shipments, manage logistics.
- **Messaging API:** Communicate with buyers.
- **Payments API (Mercado Pago):** Process payments, manage refunds.
- **Categories API:** Browse and map product categories.
- **Listing Prices API:** Query exact fees before listing.
- **OAuth 2.0:** Authentication for seller accounts.
- **Rate limit:** 1,500 requests per minute per seller.

**Mercado Envios (Shipping):**

Two shipping modalities:
1. **ME2 (Fulfillment by Mercado Libre):** Mercado Libre handles everything -- storage, packing,
   shipping. Shipping statuses auto-update. Best for high-volume sellers.
2. **ME1 (Seller-managed shipping):** For heavy/bulky products. Seller manages logistics or uses
   third-party carriers. Must provide tracking numbers.

**Mercado Pago:**
- Integrated payment processing for all Mercado Libre transactions.
- Also available as standalone payment gateway (via Checkout Pro).
- OAuth-based integration: each seller obtains access token for backend requests.
- Supports credit cards, debit cards, bank transfers, cash payments (boleto in Brazil, OXXO
  in Mexico), and digital wallets.

**Mercado Shops:**
- Own-branded storefront within the Mercado Libre ecosystem.
- Allows customization while leveraging ML's traffic and payment infrastructure.
- Lower commission rates than standard marketplace listings.

**Kitz Integration Opportunity (CRITICAL PRIORITY):**
- Full catalog sync between Kitz product management and Mercado Libre listings.
- Order import with automatic invoice generation.
- Inventory sync (deduct stock when ML order is placed).
- Mercado Pago reconciliation in Kitz financial module.
- Shipping label generation and tracking within Kitz.
- ML is the single most important marketplace integration for Kitz.

#### Amazon LatAm

**Coverage:** Mexico (strong), Brazil (growing via Remote Fulfillment)

**Fulfillment Options:**

1. **FBA Mexico:** Full Fulfillment by Amazon with local warehousing.
   - Amazon handles storage, packing, shipping, and customer service.
   - Multi-Channel Fulfillment (MCF) available for non-Amazon orders.
2. **Remote Fulfillment with FBA (NARF):** Use US-based inventory to fulfill orders on
   Amazon.com.mx and Amazon.com.br.
   - No need to store inventory locally.
   - Sellers do not pay taxes in Mexico or Brazil for remote fulfillment.
   - Customers pay import duties.
   - Multi-Channel Fulfillment NOT available in Brazil.
3. **FBA Brazil:** Growing but more limited than Mexico.

**Market Opportunity:**
- Mexico + Brazil = 340 million people, rapidly growing online shopper base.
- Amazon Mexico is the second-largest marketplace in Mexico after Mercado Libre.
- Amazon Brazil is growing but iFood/Mercado Libre dominate respective categories.

**Kitz Integration Opportunity:**
- Catalog sync with Amazon Seller Central.
- Order import for unified financial reporting.
- Inventory management across Amazon + Mercado Libre + own channels.
- Lower priority than Mercado Libre for most LatAm SMBs.

#### Tienda Nube / Nuvemshop

**Coverage:** Argentina (origin), Brazil, Mexico, Colombia

**Market Position:**
- Largest LatAm-native e-commerce platform for SMBs.
- Over 125,000 customers.
- Valued at USD 3.1 billion.
- Known as "the brand behind the brands" in LatAm.

**API Integration (tiendanube.github.io/api-documentation):**

- Current API version: 2025-03.
- Base URLs: `https://api.tiendanube.com/2025-03/{store_id}` (Spanish markets),
  `https://api.nuvemshop.com.br/2025-03/{store_id}` (Brazil).
- OAuth 2.0 authentication framework.
- Key resources:
  - **Products API:** Full CRUD for products, variants, images.
  - **Orders API:** Manage orders, statuses, fulfillment.
  - **Customers API:** Customer data management.
  - **Webhooks:** Subscribe to events (order created, product updated, etc.) via HTTPS callbacks.
  - **Payment Provider API:** Build custom payment integrations.
  - **Shipping API:** Custom shipping rate calculations.

**DevHub and Ecosystem:**
- Tiendanube DevHub for app developers.
- GitHub-hosted open source documentation.
- Shopify-style app ecosystem (growing).

**Kitz Integration Opportunity:**
- Two-way product sync for SMBs using Tienda Nube as their storefront.
- Order import for unified invoicing and financial reporting.
- Inventory sync across Tienda Nube + Mercado Libre.
- Strong fit: Tienda Nube SMBs are exactly Kitz's target customer.

#### Shopify

**Coverage:** Growing across LatAm; approximately 5% of global Shopify merchants are in LatAm.

**Key LatAm Details:**
- **Brazil:** Leads regional adoption with localized payment methods (PIX, Boleto) and
  Portuguese-language support.
- **Mexico:** Strong growth. Shopify Payments available.
- **Colombia, Argentina, Chile:** Growing but smaller merchant bases.
- Shopify Plus available for larger merchants.

**Payment Localization:**
- Brazil's dropshipping market grew from USD 1.2 billion to USD 4.5 billion, driven by
  support for local payment methods (PIX, Boleto).
- Mercado Pago available as Shopify payment method across LatAm.

**Kitz Integration Opportunity:**
- Shopify has an extensive API and webhook system.
- Product, order, and customer sync straightforward.
- Many Kitz-target SMBs may graduate from Shopify to Tienda Nube or vice versa.
- Medium priority: useful but not dominant in LatAm.

#### Falabella / Linio

**Coverage:**
- **Linio:** Colombia, Mexico, Peru, Chile (acquired by Falabella in 2018).
- **Falabella:** Chile (HQ), Colombia, Peru, Argentina, Brazil.
- Combined market access: 270+ million people.

**Seller Integration:**
- Falabella Seller Center provides unified seller interface.
- Shopify integration plugin available for automated catalog and order sync.
- English-language seller interface with English-speaking support team.
- Content creation and translation services provided centrally.
- Categories include electronics, fashion, home, beauty, and more.

**Kitz Integration Opportunity:**
- Lower priority than Mercado Libre but relevant for multi-channel sellers.
- Falabella/Linio app for Shopify demonstrates feasibility of integration.
- Useful for SMBs selling mid-to-premium products.

### 2.3 Shipping & Logistics

#### Key Shipping Providers by Country

**Mexico:**
- **99minutos:** Handles 15+ million packages/year. Promises sub-99-minute delivery. Operates
  in 60 markets. Six verticals: express parcel, specialized (Tailor 99), fulfillment (Fulfill 99),
  physical pickup points (Punto 99), cargo (Freight 99), international (Cross 99).
- **Estafeta:** National carrier, strong in B2B and e-commerce.
- **DHL Express Mexico:** International and express domestic.
- **FedEx Mexico:** Premium logistics.
- **Mercado Envios:** Integrated into Mercado Libre ecosystem.

**Brazil:**
- **Loggi:** Brazilian unicorn. Serves nearly half the Brazilian population across 500 cities.
  Six distribution centers. Connects independent drivers with retailers.
- **Correios (national post):** Widest coverage but slower.
- **Jadlog:** Major private carrier.
- **Total Express:** E-commerce focused.
- **Mercado Envios:** Dominant for Mercado Libre sellers.
- **Kangu:** Pickup point aggregator.

**Colombia:**
- **Servientrega:** Largest private logistics company.
- **Coordinadora:** Strong in e-commerce fulfillment.
- **TCC:** Traditional carrier expanding to e-commerce.
- **Envia:** Multi-carrier aggregator.
- **99minutos Colombia:** Expanding from Mexico.

**Argentina:**
- **Andreani:** Largest private logistics company.
- **OCA:** National postal carrier with e-commerce services.
- **Mercado Envios:** Dominant for ML sellers.
- **Correo Argentino:** National post.

**Chile:**
- **Chilexpress:** Dominant private carrier.
- **Blue Express:** E-commerce focused.
- **Starken:** Growing in e-commerce.
- Smart lockers and electric trucks being piloted for urban last-mile.

#### Last-Mile Delivery Challenges

- Same-day delivery faces obstacles: poor roads, traffic, inconsistent addressing.
- Rural and semi-urban areas significantly underserved.
- Consumer shift from priority (fast/expensive) to deferred (slow/cheap) shipping due to
  macroeconomic conditions.
- Route optimization, automated warehousing, and real-time tracking being adopted.
- Returns management remains complex and costly.

#### Kitz Shipping Features

| Feature | Description |
|---|---|
| Multi-carrier rate comparison | Query rates from 99minutos, Loggi, Andreani, etc. |
| Label generation | Generate shipping labels from within Kitz |
| Tracking dashboard | Unified shipment tracking across carriers |
| Returns management | Process and track return shipments |
| Shipping cost calculator | Estimate costs before order confirmation |
| Carrier performance analytics | Track delivery times, damage rates by carrier |

### 2.4 Retail Operations

**Point of Sale:**
- Many LatAm SMBs still use basic cash registers or no POS.
- Mobile payment terminals (Clip in Mexico, SumUp in Brazil) are growing rapidly.
- Kitz should integrate with POS data rather than replace POS hardware.

**Inventory Management:**
- Multi-location inventory is critical for SMBs with physical store + online.
- Multi-channel sync (own store + Mercado Libre + Tienda Nube) prevents overselling.
- Barcode/SKU management needed for catalog consistency across channels.
- Seasonal planning: holidays (Navidad, Dia de las Madres), back-to-school, Buen Fin (Mexico),
  Black Friday, CyberDay (Chile).

**Loss Prevention:**
- Shrinkage tracking via inventory audits.
- Discrepancy reports between expected and actual stock.
- Employee access controls for inventory modifications.

### 2.5 Kitz Features for Retail

| Feature | Description | Priority |
|---|---|---|
| **Product catalog management** | Centralized catalog with variants, images, pricing | Critical |
| **Multi-channel inventory sync** | Real-time stock sync across ML, Tienda Nube, own store | Critical |
| **Marketplace listing automation** | Create/update listings on ML from Kitz catalog | High |
| **Shipping label generation** | Generate labels for major carriers | High |
| **Order aggregation** | Unified order view from all sales channels | High |
| **Customer loyalty tracking** | Repeat purchase analytics, loyalty programs | Medium |
| **Barcode/SKU management** | Standardized product identification | Medium |
| **Seasonal planning tools** | Inventory forecasting for key LatAm retail dates | Medium |
| **Returns processing** | Track returns, restock, issue refunds/credits | Medium |
| **Supplier management** | PO creation, delivery tracking, price comparison | Medium |

---

## Vertical 3: Professional Services

### 3.1 Service Types in LatAm

**Most common professional service SMBs:**

| Service Type | Spanish Term | Key Markets |
|---|---|---|
| Accounting / Bookkeeping | Contaduria / Contabilidad | All LatAm |
| Legal services | Bufete de abogados / Firma juridica | All LatAm |
| Marketing / Design agencies | Agencia de marketing / diseno | All LatAm |
| Management consulting | Consultoria | Brazil, Mexico, Colombia |
| IT services / Development | Servicios de TI | All LatAm (growing fast) |
| Architecture / Engineering | Arquitectura / Ingenieria | All LatAm |
| Real estate agents | Agentes inmobiliarios | Mexico, Colombia, Chile |
| Tax advisory | Asesoria fiscal / tributaria | All LatAm |
| Human resources consulting | Recursos humanos | Brazil, Mexico, Colombia |
| Insurance brokers | Corredores de seguros | All LatAm |

### 3.2 Competitive Landscape -- Accounting Software

**Existing cloud accounting tools targeting LatAm SMBs:**

**Alegra:**
- Cloud-based invoicing, accounting, and administrative management.
- Over 365,000 registered users (as of 2020, likely much higher now).
- Operates in 13 countries: USA, Argentina, Chile, Colombia, Costa Rica, Spain, Mexico, Panama,
  Peru, Dominican Republic, Kenya, South Africa, Nigeria.
- Targets Spanish-speaking business owners and accountants.
- Features: electronic invoicing (facturacion electronica), expense tracking, financial reports,
  payroll, inventory.
- Funded by Riverwood Capital.

**ContaAzul (Brazil):**
- Cloud-based accounting for Brazilian SMEs.
- Over 1 million users in Brazil.
- Features: automated invoicing (nota fiscal), expense tracking, inventory management.
- Deep compliance with Brazilian tax regulations (SPED, NF-e, NFC-e).
- Portuguese-language only.

**Siigo (Colombia/Mexico):**
- Cloud-based administrative and accounting software.
- Strong in Colombia, expanding to Mexico.
- Features: electronic invoicing, payroll, inventory, POS.
- Acquired by Grupo Buk (HR platform).

**Kitz Competitive Positioning:**
- Kitz is NOT trying to replace dedicated accounting software.
- Kitz provides the front-office layer (CRM, invoicing, WhatsApp, payments) that feeds
  data into or alongside accounting tools.
- Integration with Alegra, ContaAzul, or Siigo for seamless data flow is the strategy.
- Kitz's strength is the customer-facing workflow; accounting tools handle back-office compliance.

### 3.3 Professional Operations

#### Client Management (CRM-Heavy)

Professional services are fundamentally relationship-driven. Key CRM requirements:

- **Contact management:** Track clients, prospects, and referral sources.
- **Interaction history:** Log calls, meetings, emails, WhatsApp conversations.
- **Pipeline management:** Track opportunities from initial inquiry to signed engagement.
- **Client segmentation:** Categorize by service type, revenue, industry, engagement status.
- **Referral tracking:** Professional services grow primarily through referrals.

#### Time Tracking and Billing

- Hourly billing remains common for legal, consulting, and IT services.
- Project-based billing for marketing agencies and architecture firms.
- Retainer models (fixed monthly fee) growing in popularity.
- Key metric: billable utilization rate (target 65-80% for service firms).

#### Proposal / Quote Generation

- Professional proposals require branding, detailed scope, pricing tables, terms.
- Multi-currency support important for cross-border services.
- Approval workflows: draft -> internal review -> client review -> signed.
- Integration with electronic signature (DocuSign, or local alternatives).

#### Project Management

- Task tracking, milestones, deadlines.
- Client-facing project portals (transparency builds trust).
- Document versioning and collaboration.
- Budget tracking against project scope.

#### Professional Licensing Requirements

| Country | Key Requirements |
|---|---|
| **Mexico** | Cedula profesional (professional license) for accountants, lawyers, engineers. Issued by SEP. |
| **Brazil** | CRC (accountants), OAB (lawyers), CREA (engineers). Active registration required. |
| **Colombia** | Tarjeta profesional for accountants, lawyers. Regulated by respective councils. |
| **Chile** | Generally less regulated, but title protection exists for some professions. |
| **Argentina** | Matricula (registration) with respective professional council (Consejo Profesional). |

#### Retainer / Recurring Billing

- Monthly retainer agreements (iguala) are extremely common in LatAm professional services.
- Typical structure: fixed monthly fee covering a defined scope of work.
- Overage billing for work exceeding the retainer scope.
- Auto-invoicing on a set date each month.
- Payment tracking and dunning for overdue retainers.

### 3.4 Kitz Features for Professional Services

| Feature | Description | Priority |
|---|---|---|
| **Quote-to-invoice workflow** | Already exists in Kitz. Core feature. | Existing |
| **Time tracking** | Log billable hours, link to projects and clients | High |
| **Retainer management** | Recurring billing, scope tracking, overage alerts | High |
| **Client portal** | Secure area for clients to view invoices, projects, documents | Medium |
| **Document storage** | Store contracts, proposals, deliverables per client | Medium |
| **Professional license tracker** | Track expiration dates, renewal requirements | Low |
| **CRM pipeline** | Sales pipeline with probability weighting and forecasting | High |
| **Proposal templates** | Branded proposal/quote templates with e-signature | Medium |
| **Project billing dashboard** | Budget vs. actual spending per project | Medium |
| **Multi-currency invoicing** | Invoice in USD, MXN, BRL, COP, CLP, etc. | High |
| **Referral tracking** | Track client referral sources for business development | Low |
| **Integration with Alegra/ContaAzul** | Push invoices to accounting software | High |

---

## Vertical 4: Beauty & Wellness

### 4.1 Market Overview

**Market Size -- This vertical is enormous in LatAm:**

- Beauty & Personal Care market in LatAm: USD 67.89 billion in revenue (2025).
- Projected to reach USD 80.33 billion by 2029 (CAGR 4.30%).
- Latin America cosmetics market: USD 23.32 billion (2024) growing to USD 41.13 billion by 2033
  (CAGR 6.51%).
- Hair care is the fastest-growing segment (CAGR 9.2%).
- Spa market: USD 3.8 billion (2024) expected to reach USD 6.9 billion by 2033 (CAGR 6.3%).

**Cultural Context:**
- LatAm has a deeply ingrained beauty culture, with personal appearance being a significant
  part of social and professional life.
- Brazil is the world's third-largest beauty market (after the US and China).
- Colombia is known for its booming aesthetic clinic industry.
- Mexico has a large and growing salon/barbershop sector.

**Business Types:**
- Hair salons (peluquerias / salones de belleza)
- Barbershops (barberias) -- experiencing a renaissance
- Nail studios (estudios de unas)
- Spas and wellness centers
- Aesthetic/cosmetic clinics (clinicas esteticas)
- Gyms and fitness studios
- Massage therapy
- Makeup artists (maquillistas)
- Mobile beauty services (a domicilio)

**Digital Adoption:**
- 72% of salons globally now use online booking systems.
- Digital adoption leads to a 24% boost in appointment bookings.
- However, in LatAm, WhatsApp remains the dominant booking channel for most beauty SMBs.
- Professional salon management software adoption is still low in LatAm compared to US/Europe.

### 4.2 Booking & Scheduling

#### Global Platforms Present in LatAm

**Fresha (formerly Shedul):**
- World's largest beauty and wellness software/marketplace.
- 120,000+ salons, barbershops, and spas globally.
- Present in Brazil and Mexico.
- **Pricing model:** Freemium -- free basic software with ~20% commission on marketplace bookings.
- Features: online booking, POS, payment processing, CRM, inventory, marketing, reporting.
- Strength: zero subscription cost lowers barrier to entry.
- Weakness: commission on marketplace bookings can be expensive at scale.

**Booksy:**
- Founded 2014, US-based.
- **Pricing model:** Flat monthly subscription fee + additional marketplace promotion fees.
- Strong in barbershops and hair salons.
- Available in multiple LatAm countries.
- Features: booking, calendar management, POS, marketing, client management.

**SimplyBook.me:**
- General appointment scheduling (not beauty-specific).
- Available in Spanish and Portuguese.
- Lower cost option for small beauty businesses.

**Treatwell:**
- Primarily European; limited LatAm presence.
- Not a priority competitor in the region.

#### WhatsApp Booking -- The LatAm Reality

**This is the most important insight for this vertical:**

WhatsApp is the primary booking method for beauty businesses in Latin America. Not apps, not
websites, not phone calls -- WhatsApp.

**Statistics supporting this:**
- 87% of companies in LatAm use WhatsApp for customer communication.
- 80% of SMBs in Brazil use WhatsApp for customer interaction.
- 50% of WhatsApp Business users opt in for appointment notifications.
- WhatsApp Business adoption growing at 35%+ annually in LatAm.

**Current WhatsApp booking workflow (typical beauty SMB):**
1. Client sends WhatsApp message: "Hola, quiero una cita para corte y color"
2. Salon owner checks paper calendar or mental schedule.
3. Owner responds with available times.
4. Client confirms.
5. Owner manually adds to calendar (maybe).
6. Day before: owner sends WhatsApp reminder (maybe).
7. No-show happens ~15-25% of the time with no consequence.

**Kitz WhatsApp-native booking opportunity:**
1. Client sends WhatsApp message to salon's Kitz-powered number.
2. Kitz AI agent responds with available slots (checking real-time calendar).
3. Client selects time.
4. Kitz auto-confirms, creates calendar entry, assigns staff member.
5. Automated reminder 24h and 2h before appointment.
6. No-show tracking and client history updated.
7. Post-visit: automated follow-up and rebooking suggestion.

This is a massive competitive advantage over Fresha/Booksy, which require clients to
download an app or visit a website.

#### No-Show Management

- Average no-show rate for beauty services: 15-25%.
- Each no-show costs approximately 30-60 minutes of staff time + lost revenue.
- **Kitz mitigation strategies:**
  - Automated WhatsApp reminders (24h, 2h before).
  - Confirmation request (client must reply "Si" to confirm).
  - No-show scoring: track clients who frequently no-show.
  - Cancellation policy enforcement: require deposit for repeat no-show clients.
  - Waitlist management: fill cancelled slots automatically.

#### Service Menu and Duration Management

- Each service needs: name, description, duration, price, staff qualifications required.
- Services often have variable pricing (e.g., short hair vs. long hair, different color complexity).
- Combo packages (e.g., "corte + barba" or "manicure + pedicure").
- Duration buffers between appointments for cleanup/setup.

### 4.3 Beauty Operations

#### Product Inventory (Professional Products)

- Salons purchase professional products (shampoo, color, treatments) at wholesale.
- Retail products sold to clients at markup (significant revenue stream).
- Key inventory concerns:
  - Product expiration tracking.
  - Reorder alerts when stock is low.
  - Cost tracking per service (how much product is used per color treatment, etc.).
  - Vendor management (L'Oreal, Wella, Schwarzkopf distributors).

#### Commission Structures for Staff

Common compensation models in LatAm beauty businesses:

| Model | Description | Typical Rate |
|---|---|---|
| **Fixed salary + commission** | Base salary plus % of services performed | Base + 20-40% |
| **Pure commission** | No base salary, percentage of each service | 40-60% |
| **Chair rental** | Stylist rents their station, keeps all revenue | Fixed rent |
| **Tiered commission** | Higher % after reaching monthly targets | 30% base, 40% above target |

**Kitz staff management features needed:**
- Track services performed per staff member.
- Calculate commissions automatically based on configured model.
- Payroll summary reports.
- Performance dashboards (revenue per stylist, client retention per stylist).

#### Client History and Preferences

Beauty services are deeply personal. Clients expect their stylist to remember:
- Previous services and formulas (color formulas are critical).
- Product allergies or sensitivities.
- Style preferences.
- Conversation notes (relationship building).
- Before/after photos.

**Kitz CRM for beauty:**
- Detailed service history per client.
- Color formula storage (e.g., "6N + 7GV 1:1, 20 vol, 35 min").
- Allergy/sensitivity flags.
- Photo attachments per visit.
- Notes field for preferences and personal details.

#### Regulatory Requirements

**Colombia:**
- Cosmetology certification required: minimum 500 hours at a recognized institution.
- Licensed cosmetologists can provide hairstyling, nail technology, and facials.
- Invasive procedures require medical professional oversight.
- New technical resolution (December 2024) mandating all cosmetic packaging be labeled in Spanish.

**Brazil:**
- ANVISA regulates cosmetic products used in salons.
- Municipal health inspections required for salon operations.
- No national cosmetology licensing (varies by state/municipality).
- Aesthetic clinics with injectable procedures require medical oversight.

**Mexico:**
- COFEPRIS oversees cosmetic product safety.
- Municipal operating permits (licencia de funcionamiento) required.
- No standardized national cosmetology license.
- Health department inspections for hygiene compliance.

**Kitz compliance feature:**
- Track staff certifications and expiration dates.
- Store copies of licenses and permits.
- Country-specific compliance checklists.
- Reminder system for renewals.

### 4.4 Kitz Features for Beauty & Wellness

| Feature | Description | Priority |
|---|---|---|
| **WhatsApp-native booking** | AI-powered appointment scheduling via WhatsApp | Critical |
| **Client preference tracking** | Service history, formulas, allergies, photos in CRM | Critical |
| **Staff commission calculation** | Auto-calculate pay based on configured commission model | High |
| **Product inventory** | Track professional and retail products, reorder alerts | High |
| **No-show management** | Automated reminders, confirmation requests, scoring | High |
| **Service menu management** | Services, durations, pricing, staff assignment | High |
| **Instagram integration** | Share before/after photos, link portfolio to booking | Medium |
| **Loyalty programs** | Visit-based rewards via WhatsApp (e.g., 10th visit free) | Medium |
| **Online booking widget** | Web-based booking page for Instagram bio link | Medium |
| **Waitlist management** | Auto-fill cancelled slots from waitlist | Medium |
| **Gift cards / vouchers** | Digital gift cards purchasable via WhatsApp or web | Low |
| **Staff scheduling** | Shift management, availability, time-off requests | Medium |
| **Revenue per chair/station** | Analytics on station utilization and revenue | Low |

---

## Cross-Vertical: Kitz Platform Feature Matrix

### Core Feature Relevance by Vertical

| Feature | Restaurant | Retail | Professional | Beauty | Notes |
|---|---|---|---|---|---|
| **CRM / Contacts** | ** | ** | **** | *** | Professional services is most CRM-dependent |
| **Invoicing / Billing** | *** | *** | **** | ** | Professional services has complex billing needs |
| **WhatsApp Integration** | **** | ** | ** | **** | Restaurants and beauty are WhatsApp-heaviest |
| **Inventory Management** | **** | **** | -- | ** | Restaurants (perishables) and retail (SKUs) are inventory-heavy |
| **Booking / Scheduling** | * | -- | * | **** | Beauty is booking-dominant; restaurants have reservations |
| **Payments / POS** | **** | **** | ** | *** | Restaurants and retail process highest payment volume |
| **Delivery Platform Integration** | **** | -- | -- | -- | Restaurant-specific |
| **Marketplace Integration** | -- | **** | -- | -- | Retail-specific |
| **Shipping / Logistics** | * | **** | -- | -- | Retail-specific |
| **Time Tracking** | -- | -- | **** | -- | Professional services-specific |
| **Staff Commission** | * | -- | -- | **** | Beauty is commission-dominant |
| **Quote / Proposal** | -- | -- | **** | -- | Professional services-specific |
| **Document Management** | -- | -- | **** | * | Professional services-specific |
| **Product Catalog** | ** | **** | -- | ** | Retail needs the most robust catalog |
| **Multi-Currency** | -- | ** | **** | -- | Professional services has cross-border clients |
| **Compliance / Permits** | *** | * | ** | ** | Restaurants have heaviest compliance burden |
| **Loyalty Programs** | ** | ** | -- | *** | Beauty and restaurants benefit most |
| **Analytics / Reporting** | *** | *** | *** | *** | Universal need |
| **AI Agent (WhatsApp)** | **** | ** | ** | **** | Order-taking and booking automation |

Legend: **** = Critical, *** = Very Important, ** = Important, * = Useful, -- = Not Applicable

### Feature Development Priority by Vertical

**Tier 1 -- Build Now (serves 3+ verticals):**
- WhatsApp AI agent (order taking, booking, customer service)
- CRM with client history
- Invoicing with country-specific tax compliance
- Payment processing (Mercado Pago integration)
- Basic inventory management
- Analytics dashboard

**Tier 2 -- Build Next (serves 2 verticals or critical for 1):**
- Delivery platform aggregation (Rappi, PedidosYa, iFood)
- Marketplace integration (Mercado Libre)
- Appointment/booking management
- Staff commission calculation
- Multi-channel inventory sync
- Shipping label generation

**Tier 3 -- Build Later (vertical-specific):**
- Time tracking and billable hours
- Quote/proposal templates
- Kitchen display system
- Before/after photo management
- Menu engineering analytics
- Chair/station utilization analytics

---

## Integration Priority Roadmap

### Phase 1: Foundation (Months 1-3)

| Integration | Vertical | Rationale |
|---|---|---|
| **WhatsApp Business API** | All | 87% of LatAm businesses use WhatsApp. This is the platform. |
| **Mercado Pago** | All | Most widely used payment platform in LatAm. |
| **Mercado Libre** | Retail | Dominant marketplace. Every retail SMB sells on ML. |

### Phase 2: Vertical Expansion (Months 4-6)

| Integration | Vertical | Rationale |
|---|---|---|
| **Rappi** | Restaurant | Widest LatAm delivery coverage. Well-documented API. |
| **iFood** | Restaurant | 87% market share in Brazil. Essential for BR restaurants. |
| **PedidosYa** | Restaurant | 15-country coverage. Direct POS integration model. |
| **Tienda Nube / Nuvemshop** | Retail | Largest LatAm-native e-commerce platform. Perfect fit. |

### Phase 3: Deepening (Months 7-9)

| Integration | Vertical | Rationale |
|---|---|---|
| **DiDi Food** | Restaurant | Strong in Mexico. Lower commissions. |
| **Amazon (Mexico/Brazil)** | Retail | Second marketplace for multi-channel sellers. |
| **Alegra** | Professional | Leading LatAm cloud accounting. Data sync. |
| **ContaAzul** | Professional | 1M+ users in Brazil. Financial data integration. |
| **Uber Eats** | Restaurant | Additional delivery channel coverage. |

### Phase 4: Advanced Features (Months 10-12)

| Integration | Vertical | Rationale |
|---|---|---|
| **99minutos** | Retail | Advanced shipping for Mexico, Colombia, Chile, Peru. |
| **Loggi** | Retail | Brazilian last-mile logistics. |
| **Falabella / Linio** | Retail | Additional marketplace for premium products. |
| **Shopify** | Retail | Growing LatAm merchant base. |
| **Instagram API** | Beauty | Portfolio and booking link integration. |
| **Google Calendar** | Beauty / Professional | Calendar sync for appointments and meetings. |

---

## Strategic Recommendations for Kitz

### 1. Lead with WhatsApp, Not Apps

Every other platform (Fresha, Booksy, Toast, Shopify) asks the SMB owner and their customers to
adopt a new interface. Kitz should meet them where they already are: WhatsApp. The AI agent that
handles orders, bookings, and customer service via WhatsApp is the single most defensible feature
Kitz can build.

### 2. Mercado Libre is the Amazon of LatAm -- Integrate Deeply

For retail SMBs, Mercado Libre integration is not optional. Full catalog sync, order management,
inventory sync, and Mercado Pago reconciliation should be world-class. This alone could drive
significant Kitz adoption in the retail vertical.

### 3. Delivery Aggregation Solves a Real Pain

Restaurants managing orders across Rappi, PedidosYa, iFood, DiDi Food, and Uber Eats are
drowning in tablets and manual reconciliation. A unified order inbox with financial reconciliation
across all platforms is a high-value, high-retention feature.

### 4. Beauty is the Sleeper Vertical

With USD 67+ billion in market size and extremely low software adoption, beauty/wellness represents
the biggest "blue ocean" opportunity. WhatsApp-native booking + client CRM + commission tracking
could make Kitz the default operating system for LatAm salons.

### 5. Do Not Build Accounting -- Integrate with It

Alegra, ContaAzul, and Siigo already have deep tax compliance built in. Kitz should integrate
with these platforms rather than competing. Focus on the front-office (customers, orders, invoicing)
and let accounting tools handle the back-office (tax filing, financial statements, compliance).

### 6. Country Prioritization

| Priority | Country | Rationale |
|---|---|---|
| 1 | **Mexico** | Large market, strong e-commerce growth, Rappi + DiDi + Amazon presence |
| 2 | **Colombia** | Kitz's likely home market, Rappi HQ, Alegra presence, growing digital adoption |
| 3 | **Brazil** | Largest market, iFood dominance, but Portuguese localization required |
| 4 | **Argentina** | Mercado Libre HQ, Tienda Nube origin, but macroeconomic volatility |
| 5 | **Chile** | Advanced digital infrastructure, Falabella HQ, smaller market |
| 6 | **Peru** | Growing e-commerce, Rappi and PedidosYa present |

---

## Sources & References

### Restaurant & Food Service
- [Latin America Fast Food Market](https://www.marketdataforecast.com/market-reports/latin-america-fast-food-market)
- [LatAm Quick Service Restaurants Market](https://www.fortunebusinessinsights.com/latin-america-and-caribbean-quick-service-restaurants-market-108600)
- [Global Restaurant Industry Statistics 2025](https://www.restroworks.com/blog/global-restaurant-industry-statistics/)
- [Rappi Fees and Commissions for Restaurants](https://blog.menuviel.com/rappi-fees-and-commissions-for-restaurants/)
- [Rappi Developer Portal](https://dev-portal.rappi.com/)
- [Rappi API Reference](https://dev-portal.rappi.com/api/)
- [Rappi Integration Standards](https://dev-portal.rappi.com/en/integration-standards/)
- [iFood Market Data (Statista)](https://www.statista.com/statistics/1051639/brazil-key-figures-food-delivery-app-ifood/)
- [iFood and Kevel Partnership](https://www.kevel.com/customers/ifood)
- [Delivery Hero Developer Portal](https://developers.deliveryhero.com/)
- [PedidosYa Integration Documentation](https://integrar.pedidosya.com/es/documentation/)
- [PedidosYa Developer Documentation](https://developer.pedidosya.com/en/documentation/introduction)
- [DiDi Food Comisiones Mexico 2025](https://blog.polotab.com/comisiones-didi-restaurantes-mexico-2025/)
- [Uber Eats Commission Rates](https://www.upmenu.com/blog/uber-eats-commission/)

### Food Safety & Regulations
- [Mexico COFEPRIS Food Safety](https://www.digicomply.com/food-regulatory-bodies-standards-and-authorities/mexico)
- [Brazil ANVISA Food Standards](https://apps.fas.usda.gov/newgainapi/api/report/downloadreportbyfilename?filename=Food+and+Agricultural+Import+Regulations+and+Standards+Report_Sao+Paolo+ATO_Brazil_3-11-2019.pdf)
- [Colombia INVIMA Sanitary Registration](https://www.trade.gov/market-intelligence/colombia-food-and-drug-sanitary-registration)
- [Colombia Regulatory Affairs](https://www.affirmalaw.com/blog/regulatory-affairs-in-colombia/)

### Retail & E-commerce
- [Mercado Libre Selling Fees by Category](https://global-selling.mercadolibre.com/landing/selling-fee)
- [Mercado Libre API Essentials](https://rollout.com/integration-guides/mercado-libre/api-essentials)
- [Mercado Libre Developer Documentation](https://developers.mercadolibre.com.ni/en_us/introduction-services/fees-for-listing)
- [Mercado Envios Integration](https://global-selling.mercadolibre.com/devsite/manage-shipments)
- [Nuvemshop / Tienda Nube API Documentation](https://tiendanube.github.io/api-documentation/intro)
- [Nuvemshop API Resources](https://tiendanube.github.io/api-documentation/resources)
- [Tiendanube GitHub](https://github.com/TiendaNube)
- [Amazon Remote Fulfillment with FBA](https://sell.amazon.com/fulfillment-by-amazon/remote-fulfillment)
- [Amazon Latin America Selling](https://sell.amazon.com/global-selling/latin-america)
- [Falabella / Linio Developer Portal](https://developers.falabella.com/page/sell-in-latin-america-with-linio-marketplace)
- [Shopify Global Ecommerce](https://www.shopify.com/enterprise/blog/global-ecommerce-statistics)
- [LatAm E-commerce Growth (Digital Commerce 360)](https://www.digitalcommerce360.com/2026/01/28/latin-american-ecommerce-projection-215-billion/)
- [LatAm E-commerce Delivery (Parcel Perform)](https://www.parcelperform.com/insights/latin-americas-e-commerce-delivery-success)

### Shipping & Logistics
- [Latin America Last Mile Delivery Market](https://www.imarcgroup.com/latin-america-last-mile-delivery-market)
- [LatAm Logistics Trends 2025](https://americasmi.com/insights/latin-america-logistics-trends-2025/)
- [99minutos](https://www.99minutos.com/)
- [99minutos on Y Combinator](https://www.ycombinator.com/companies/99minutos)

### Professional Services
- [Top 8 Accounting Software in Latin America](https://satvasolutions.com/blog/top-8-accounting-software-in-latin-america)
- [Alegra About](https://www.alegra.com/en/about-us/)
- [Alegra Press](https://prensa.alegra.com/about-alegra)
- [Biz Latin Hub Services](https://www.bizlatinhub.com/)

### Beauty & Wellness
- [Beauty & Personal Care LatAm (Statista)](https://www.statista.com/outlook/cmo/beauty-personal-care/latam)
- [Latin America Cosmetics Market](https://www.marketdataforecast.com/market-reports/latin-america-cosmetics-market)
- [Latin America Spa Market](https://www.imarcgroup.com/latin-america-spa-market)
- [Fresha Platform](https://www.fresha.com/for-business)
- [Fresha Pricing](https://www.fresha.com/pricing)
- [Booksy Alternatives](https://biz.booksy.com/en-us/blog/booksy-alternatives-for-salons)
- [Colombia Cosmetics Registration](https://www.trade.gov/market-intelligence/colombia-cosmetics-registration-and-labeling-standards)
- [Colombia Beauty Regulations](https://www.beautycoursesonline.com/regulations/south-america/colombia/)

### WhatsApp Business
- [WhatsApp Business Statistics](https://zixflow.com/blog/whatsapp-business-statistics)
- [WhatsApp Business Guide for LatAm SMEs](https://www.aurorainbox.com/en/2025/07/21/whatsapp-empresarial-guia-completa-pymes-latinoamerica/)
- [WhatsApp Transforming E-commerce in LatAm](https://www.techloy.com/how-whatsapp-business-is-transforming-e-commerce-in-latin-america/)
- [WhatsApp Statistics 2025 (Infobip)](https://www.infobip.com/blog/whatsapp-statistics)

---

*This document should be reviewed and updated quarterly as platform APIs, commission structures,
and market dynamics evolve. All integration specifications should be validated against current
developer documentation before implementation begins.*
