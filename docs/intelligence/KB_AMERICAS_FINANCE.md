# Americas Finance — KITZ Knowledge Base Intelligence

> Module: Americas Finance | Sources: 29 | Auto-generated from KITZ Knowledge Base

> Ingestion: Enriched with live web content + WebSearch intelligence

---


## Brazil Payments


### PIX — Banco Central do Brasil `[Critical]`

- **ID:** PKB-324
- **Type:** Government
- **URL:** https://www.bcb.gov.br/en/financialstability/pix_en
- **Why KITZ Needs It:** Instant payment system: 165M+ users, 63B transactions/year, benchmark for LATAM

**Intelligence (Enriched):**

PIX is Brazil's instant payment system launched by the Central Bank of Brazil (BCB) in November 2020. It is the most successful instant payment system globally by adoption rate. 165M+ registered users (~80% of adult population), 63B+ transactions/year, R$17+ trillion annually. Available 24/7/365, completing in under 10 seconds. Free for individuals; businesses pay R$0.01-R$0.10 per transaction. Business features include PIX Cobranca (payment requests with due dates), QR Codes (static/dynamic), PIX Automatico (recurring payments for subscriptions), and PIX Garantido (credit-backed installments, in development). APIs provided by each financial institution with standardized specification from BCB: RESTful, OAuth2, endpoints for /pix/, /cob/, /cobv/, /lotecobv/. PSPs like Mercado Pago, PagSeguro, Stone, Iugu offer developer-friendly PIX APIs. Critical for any KITZ user in Brazil -- the #1 payment method. KITZ's kitz-payments should support PIX via PSP integration.


### Mercado Pago — Developers `[Critical]`

- **ID:** PKB-325
- **Type:** Docs
- **URL:** https://www.mercadopago.com.br/developers
- **Why KITZ Needs It:** LATAM #1 digital wallet: payments API, QR, checkout, subscriptions, marketplace

**Intelligence (Enriched):**

LATAM's largest digital payment platform (Mercado Libre ecosystem). Developer portal offers comprehensive API docs. Products: Checkout Pro (hosted), Checkout Bricks (embedded components), Checkout API (full custom), Point Smart (POS), QR Code payments, Subscriptions (recurring billing), Marketplace Split Payments, Wallet Connect, PIX integration. REST API with OAuth2, base URL api.mercadopago.com, SDKs for Node.js/PHP/Java/.NET/Python/Ruby. New MCP Server for AI-assisted integration. Webhooks for payment events. Pricing (Brazil): credit card 4.98%, debit 1.99%, PIX ~1%, Boleto R$3.49. No monthly/setup fee. Available in Brazil, Mexico, Argentina, Colombia, Chile, Peru, Uruguay. Primary payment integration candidate for KITZ across LATAM -- single API covers 7 countries. Checkout Bricks for workspace checkout links, marketplace split for platform fees, subscriptions for AI Battery model.


## Brazil Fintech


### Nubank — About `[High]`

- **ID:** PKB-326
- **Type:** Platform
- **URL:** https://nubank.com.br/en/
- **Why KITZ Needs It:** Worlds largest digital bank: 100M+ customers, credit cards, loans, investments

**Intelligence (Enriched):**

World's largest digital bank by customer count (100M+ across Brazil, Mexico, Colombia). NYSE: NU, $45B+ market cap. Products: no-annual-fee credit card, NuConta digital account (free with PIX), personal loans (AI-underwritten), NuInvest (stocks, ETFs, crypto), insurance, NuPay for merchants. No public developer API for third-party integration, but Open Banking Brazil APIs available. NuPay checkout integration via SDK. Relevant to KITZ because most Brazilian users have Nubank accounts, setting UX expectations. NuPay could become a checkout payment method. Nubank's success validates LATAM fintech opportunity and informs KITZ's product strategy around simplicity and zero-fee models.


## Brazil E-commerce


### Mercado Libre — Developers `[Critical]`

- **ID:** PKB-327
- **Type:** Docs
- **URL:** https://developers.mercadolibre.com/
- **Why KITZ Needs It:** LATAM #1 e-commerce marketplace: product listing API, orders, shipping, ads

**Intelligence (Enriched):**

LATAM's largest e-commerce marketplace (NYSE: MELI), operating in 18 countries. APIs: Items (create/manage products), Orders (receive/manage), Shipping (Mercado Envios integration), Messages (buyer-seller comms), Questions (pre-sale Q&A), Advertising (Product Ads), Categories, Users. REST API with OAuth2, base URL api.mercadolibre.com, SDKs for PHP/Java/.NET/Python/Node.js. Webhooks for orders, questions, payments, shipments. Seller economics: 6-16% commission, Mercado Envios shipping, CPC ads, Fulfillment warehousing. Critical for KITZ users selling on Mercado Libre -- sync product catalog, pull orders into workspace, manage messages alongside WhatsApp, track shipping with customer notifications.


## Mexico Payments


### SPEI — Banco de Mexico `[Critical]`

- **ID:** PKB-328
- **Type:** Government
- **URL:** https://www.banxico.org.mx/sistemas-de-pago/servicios-transferencia-electronica-background.html
- **Why KITZ Needs It:** Mexico instant transfers: 24/7, interbank, real-time, benchmark system

**Intelligence (Enriched):**

Mexico's interbank electronic payment system operated by Banco de Mexico. Real-time transfers in seconds, 24/7/365. Uses 18-digit CLABE account numbers. CoDi (Cobro Digital) QR payment system built on SPEI for merchants. Free for individuals, businesses MXN $3-$7 per transfer. Integration via PSPs (Conekta, Stripe Mexico, EBANX). Backbone of Mexican digital payments -- every KITZ user in Mexico receives payments via SPEI. CoDi QR enables payment request generation for brick-and-mortar businesses.


### OXXO Pay — Conekta `[High]`

- **ID:** PKB-329
- **Type:** Platform
- **URL:** https://www.conekta.com/en
- **Why KITZ Needs It:** Cash payment at 20K+ stores: OXXO voucher for unbanked, Mexico #1 cash-in

**Intelligence (Enriched):**

Mexico's leading payment infrastructure. OXXO Pay generates payment vouchers for cash payment at 20,000+ OXXO stores -- the #1 cash-in method for e-commerce. Also offers card payments (3D Secure), SPEI transfers, subscriptions, payment links, hosted checkout. REST API v2 with Bearer token, base URL api.conekta.io, SDKs for Node.js/PHP/Ruby/Python/Java/.NET. PCI DSS Level 1 compliant. Pricing: cards 2.9% + MXN $2.50, OXXO 2.9% + MXN $4.00, SPEI 1.0%. No monthly/setup fees. Critical for reaching Mexico's unbanked (40%+ adults). KITZ checkout links should support OXXO Pay. Payment Links product comparable to KITZ workspace checkout links.


### Clip — Mexico POS `[High]`

- **ID:** PKB-330
- **Type:** Platform
- **URL:** https://www.clip.mx/
- **Why KITZ Needs It:** Mexico mobile card reader: POS for SMBs, no monthly fee, instant deposits

**Intelligence (Enriched):**

Mexico's leading mPOS provider. Products: Clip Plus (Bluetooth reader ~MXN $599), Clip Pro (standalone terminal ~MXN $2,499), Clip Total (all-in-one POS ~MXN $4,999), Clip Online (payment links). No monthly fee, same-day deposits, accepts Visa/MC/Amex/carnet, MSI installments (3-12 months), NFC contactless (Apple/Google/Samsung Pay). Dashboard with sales analytics, inventory, client management. ~3.6% + IVA commission. POS standard for Mexican micro-businesses. No direct API integration (closed ecosystem), but KITZ can help reconcile Clip sales with overall finances.


## Mexico Government


### SAT — Servicio de Administracion Tributaria `[Critical]`

- **ID:** PKB-331
- **Type:** Government
- **URL:** https://www.sat.gob.mx/
- **Why KITZ Needs It:** Mexico tax authority: RFC registration, electronic invoicing (CFDI), tax filing

**Intelligence (Enriched):**

Mexico's tax authority. Key services: RFC (tax ID required for all business), CFDI 4.0 electronic invoicing (mandatory for ALL transactions), e.firma digital certificate, Regimen Fiscal classification (RESICO for small businesses <$3.5M MXN revenue), monthly/bimonthly filing, annual declaration. CFDI requires PAC (Proveedor Autorizado de Certificacion) validation, XML format with digital signature. RESICO offers simplified 1%-2.5% rates on gross income. Critical for every KITZ user in Mexico. KITZ should help generate invoices via PAC providers (Facturapi, Facturama), provide RESICO guidance, and include tax calendar reminders in cadence reports.


## Colombia Payments


### Nequi — Bancolombia `[Critical]`

- **ID:** PKB-332
- **Type:** Platform
- **URL:** https://www.nequi.com.co/
- **Why KITZ Needs It:** Colombia #1 digital wallet: 54% penetration, P2P, payments, savings, no bank needed

**Intelligence (Enriched):**

Colombia's #1 digital wallet (Bancolombia). 18M+ users, 54% wallet penetration. Free account, P2P transfers by phone number, QR payments, online payments, savings goals (Bolsillos), bill payments. Nequi Negocio for businesses: REST API for payment acceptance, push notifications, QR codes. Top-up via bank transfer, PSE, cash at Bancolombia/Efecty/Baloto. Any KITZ user in Colombia must support Nequi. Bolsillos feature inspires KITZ financial management tools.


### PSE — ACH Colombia `[Critical]`

- **ID:** PKB-333
- **Type:** Platform
- **URL:** https://www.pse.com.co/
- **Why KITZ Needs It:** Colombia bank transfer: 63.9% of e-commerce, real-time, 34 banks connected

**Intelligence (Enriched):**

Colombia's online bank transfer system (ACH Colombia). Real-time debit, 34 banks connected, 63.9% of e-commerce market share. Customer selects bank, authenticates with own credentials, payment confirmed instantly. No card required. Integrated via payment gateways (PayU, Mercado Pago, EBANX, dLocal). Essential payment method for any e-commerce in Colombia -- KITZ checkout links must support PSE.


### Daviplata — Davivienda `[High]`

- **ID:** PKB-334
- **Type:** Platform
- **URL:** https://www.daviplata.com/
- **Why KITZ Needs It:** Colombia mobile wallet: 22% penetration, P2P, bills, purchases, no fees

**Intelligence (Enriched):**

Colombia's second digital wallet (Banco Davivienda). ~16M users, 22% penetration. Free account via app or USSD (*200#). P2P transfers, bill payments, mobile top-ups, QR payments. Government subsidy channel (Familias en Accion). Targets unbanked/underbanked. Integration typically via PSPs. Important for KITZ users targeting lower-income demographics in Colombia.


### Efecty `[High]`

- **ID:** PKB-335
- **Type:** Platform
- **URL:** https://www.efecty.com.co/
- **Why KITZ Needs It:** Colombia cash-in network: pay online orders at physical locations, unbanked reach

**Intelligence (Enriched):**

Colombia's largest cash payment network. 12,000+ physical locations. Services: cash-in for e-commerce (generate reference, customer pays at Efecty point), money transfers (giros), bill payments, government payments. Available via PSPs (PayU, Mercado Pago, EBANX). 24-72 hour payment window. Critical for reaching Colombia's unbanked. KITZ checkout links should support Efecty for Colombian users, especially in smaller cities.


## Colombia Government


### DIAN — Tax Authority Colombia `[Critical]`

- **ID:** PKB-336
- **Type:** Government
- **URL:** https://www.dian.gov.co/
- **Why KITZ Needs It:** Colombia tax: RUT registration, electronic invoicing, customs, tax calendar

**Intelligence (Enriched):**

Colombia's tax/customs authority. Key services: RUT (tax ID), Electronic Invoicing (mandatory, real-time DIAN validation, UBL 2.1 XML), IVA 19% (bimonthly/quarterly), Income Tax (annual), Regimen Simple (simplified for <COP $3.2B revenue). Electronic invoicing uses authorized technology providers (Siigo, Alegra, World Office). Tax calendar based on NIT last digits. KITZ should provide Regimen Simple guidance, integrate with invoicing providers, and include tax calendar reminders for Colombian users.


## Argentina Payments


### Mercado Pago Argentina — QR Payments `[Critical]`

- **ID:** PKB-337
- **Type:** Platform
- **URL:** https://www.mercadopago.com.ar/
- **Why KITZ Needs It:** Argentina #1 wallet: QR ubiquitous, Transferencias 3.0, interoperable payments

**Intelligence (Enriched):**

Argentina's dominant digital payment platform. QR payments ubiquitous at retailers/restaurants/kioscos, interoperable via Transferencias 3.0 standard. Digital wallet, card payments via POS/QR/online, Point card readers. Same APIs as MercadoPago Brazil. Key Argentine context: high inflation requires frequent price adjustments, installment payments (cuotas 3-12 months) are standard, debit growing due to IVA refund incentives, cash still significant, blue dollar/official rate divergence affects pricing. KITZ must handle inflation reality and support interoperable QR (Transferencias 3.0).


### MODO — Argentina Interoperable `[High]`

- **ID:** PKB-338
- **Type:** Platform
- **URL:** https://www.modo.com.ar/
- **Why KITZ Needs It:** Argentina bank wallet: interoperable QR across all banks, growing fast

**Intelligence (Enriched):**

Argentina's interoperable digital wallet backed by 35+ banks. Works with existing bank accounts (no separate balance). Interoperable QR via Transferencias 3.0, P2P transfers between banks, bill payments, bank-specific cashback. Represents bank-led approach vs. MercadoPago's fintech approach. KITZ users should accept both MercadoPago and MODO QR -- they are interoperable under Transferencias 3.0.


## Argentina Government


### AFIP/ARCA — Tax Authority Argentina `[Critical]`

- **ID:** PKB-339
- **Type:** Government
- **URL:** https://www.afip.gob.ar/
- **Why KITZ Needs It:** Argentina tax: CUIT registration, monotributo, electronic invoicing, tax filing

**Intelligence (Enriched):**

Argentina's tax authority (recently rebranded as ARCA). Key services: CUIT (tax ID), Monotributo (simplified regime for small taxpayers -- single monthly payment covering income tax, VAT, social security, categories A-K based on revenue), Factura Electronica (mandatory via AFIP web service or fiscal controllers), Factura A/B/C types. Monotributo is essential for KITZ's Argentine users -- most qualify. Electronic invoicing via AFIP's SOAP-based WSFE or newer REST APIs. Frequent regulatory changes due to inflation adjustments. Tax calendar reminders critical.


## Peru Payments


### Yape — BCP Peru `[High]`

- **ID:** PKB-340
- **Type:** Platform
- **URL:** https://www.yape.com.pe/
- **Why KITZ Needs It:** Peru #1 digital wallet: instant P2P, QR payments, bill pay, massive adoption

**Intelligence (Enriched):**

Peru's most popular digital wallet (BCP). 15M+ users (~50% adult population). Free P2P transfers by phone number, QR merchant payments, Yape Promos cashback, bill payments. Yape Business for payment acceptance. No bank account required (DNI only). Dominant payment method in Peru -- KITZ users must support Yape. Similar positioning to Nequi in Colombia.


### PLIN — Peru Interbank `[High]`

- **ID:** PKB-341
- **Type:** Platform
- **URL:** https://www.plin.pe/
- **Why KITZ Needs It:** Peru interbank transfers: instant, multi-bank, QR-based, growing fast

**Intelligence (Enriched):**

Peru's second digital wallet (Interbank, BBVA, Scotiabank, BanBif). Instant interbank transfers, QR payments (interoperable with Yape since 2023), free P2P, multi-bank. Yape-PLIN interoperability means KITZ QR codes work across both ecosystems. Important for users banking with Interbank, BBVA, or Scotiabank.


## Chile Payments


### Khipu — Chile Bank Transfer `[High]`

- **ID:** PKB-342
- **Type:** Platform
- **URL:** https://khipu.com/
- **Why KITZ Needs It:** Chile simplified bank transfer: e-commerce integration, instant confirmation

**Intelligence (Enriched):**

Chile's leading bank transfer payment platform. Simplified flow: customer selects bank, logs in, confirms, instant confirmation to merchant. 17 banks connected, no card required, competes with Transbank's WebPay. REST API for payment creation/verification/refunds, webhooks, SDKs for PHP/Ruby/Python/Node.js. ~1.5-2.5% commission. Important for Chilean users preferring bank transfers over cards. Lower fees than card processing.


## Costa Rica Payments


### SINPE Movil — Costa Rica `[High]`

- **ID:** PKB-343
- **Type:** Platform
- **URL:** https://www.sinpemovil.fi.cr/
- **Why KITZ Needs It:** Costa Rica instant mobile payments: phone-number based, interbank

**Intelligence (Enriched):**

Costa Rica's instant mobile payment system (Central Bank of Costa Rica). Phone-based transfers (no IBAN needed), instant, interbank, free for individuals, 24/7/365, QR payments, CRC 1M limit per transaction (~$1,800 USD). No direct third-party API -- integration via local PSPs or bank partnerships. Essential for Costa Rican KITZ users. Phone-number model is simple and widely adopted, similar to PIX in Brazil.


## USA Payments


### Stripe — Payment Infrastructure `[Critical]`

- **ID:** PKB-344
- **Type:** Docs
- **URL:** https://stripe.com/docs
- **Why KITZ Needs It:** Global payment API: cards, ACH, wallets, subscriptions, Connect marketplace

**Intelligence (Enriched):**

World's leading payment infrastructure. Products: Payments (cards, wallets, bank transfers, OXXO, Boleto, PIX), Checkout (hosted page), Elements (embeddable components), Connect (marketplace split payments), Billing (subscriptions), Terminal (in-person), Atlas (company incorporation), Radar (fraud), Tax (automated), Identity (KYC), Financial Connections (bank linking). REST API, base URL api.stripe.com/v1/, SDKs for Node.js/Python/Ruby/PHP/Java/Go/.NET. Webhooks, idempotency keys, test mode. LATAM: direct acquiring in Mexico and Brazil, cross-border for others. Local methods: OXXO (Mexico), Boleto+PIX (Brazil). NOT available as direct acquirer in Colombia, Argentina, Peru, Chile, Panama. Pricing: US 2.9%+$0.30, Mexico 3.6%+MXN$3.00, Brazil 3.99%+R$0.39. Already in KITZ's payment stack. Best for US/global; Mercado Pago/EBANX better for LATAM-only. Connect enables marketplace model. Billing powers AI Battery subscriptions. Atlas helps users incorporate US entities.


### Plaid — Banking API `[High]`

- **ID:** PKB-345
- **Type:** Docs
- **URL:** https://plaid.com/docs/
- **Why KITZ Needs It:** Bank account connectivity: identity verification, balance checks, ACH transfers

**Intelligence (Enriched):**

Connects applications to bank accounts. Products: Auth (account/routing numbers), Identity (verify holder), Balance (real-time), Transactions (24-month categorized history), Transfer (ACH), Income verification, Asset reports. 12,000+ institutions in US/Canada. Limited LATAM coverage (Mexico Open Banking pilot). Pricing: $0.30-$1.50 per verification, $0.25-$0.50 per connection/month. Primarily US/Canada focused. Useful for KITZ users with US banking. Open Banking trends in Brazil and Mexico may create LATAM equivalents. Transaction categorization model inspires KITZ expense categorization.


## USA Government


### IRS — Small Business Tax Center `[High]`

- **ID:** PKB-346
- **Type:** Government
- **URL:** https://www.irs.gov/businesses/small-businesses-self-employed
- **Why KITZ Needs It:** US tax: EIN, quarterly filing, 1099, payroll tax, deductions guide

**Intelligence (Enriched):**

IRS Small Business & Self-Employed Tax Center. Key resources: EIN (online application, instant), Quarterly Estimated Taxes (Form 1040-ES, due Apr/Jun/Sep/Jan), Self-Employment Tax (15.3%), Business Deductions (home office, vehicle, meals, health insurance, retirement), 1099 Reporting ($600+ to contractors), Payroll Tax (FICA 7.65% each side, FUTA 6%). Critical for US-based or US-registered KITZ users. Tax calendar reminders, 1099 tracking, deduction guidance in KITZ's financial advisory.


## Canada Government


### CRA — Canada Business Registration `[High]`

- **ID:** PKB-347
- **Type:** Government
- **URL:** https://www.canada.ca/en/services/business.html
- **Why KITZ Needs It:** Canada: BN registration, GST/HST, payroll, corporate tax, grants for SMBs

**Intelligence (Enriched):**

Government of Canada business services. Key: Business Number (9-digit ID for all CRA accounts), GST/HST (registration required >$30K/year, 5% federal + provincial 0-10%), Payroll (CPP, EI), Corporate Tax (federal 15%, small business 9% on first $500K), SR&ED tax credit (35% refundable), Canada Small Business Financing Program (up to $1M). Important for KITZ users in Canada or LATAM entrepreneurs expanding north. GST/HST calculation for invoicing Canadian clients.


## Cross-Border


### EBANX — LATAM Payments `[Critical]`

- **ID:** PKB-348
- **Type:** Platform
- **URL:** https://www.ebanx.com/
- **Why KITZ Needs It:** All-in-one LATAM payment gateway: PIX, OXXO, PSE, boleto, 15+ countries

**Intelligence (Enriched):**

Brazilian fintech providing unified payment gateway for 15+ LATAM countries. Single API for ALL local payment methods: PIX, Boleto, OXXO, SPEI, PSE, Nequi, Efecty, Yape, PLIN, bank transfers, cards, wallets. Also offers payouts to LATAM bank accounts/wallets, FX conversion, hosted checkout, recurring billing. Countries: Brazil, Mexico, Colombia, Argentina, Chile, Peru, Ecuador, Bolivia, Uruguay, Paraguay, Guatemala, El Salvador, DR, Costa Rica, Panama. REST API, webhooks, sandbox. 2-5% per transaction (custom pricing). Top integration candidate for KITZ's cross-LATAM payment infrastructure -- single API covers all countries and methods, alternative to integrating separately.


### dLocal — Emerging Markets Payments `[High]`

- **ID:** PKB-349
- **Type:** Platform
- **URL:** https://dlocal.com/
- **Why KITZ Needs It:** Single API for 40 countries: LATAM, Africa, Asia — local payment methods

**Intelligence (Enriched):**

NASDAQ: DLO. Single payment API for 40 emerging market countries (LATAM + Africa + Asia). 600+ payment methods, pay-ins and payouts, cross-border and local processing, FX, smart routing for maximum approval rates. Alternative to EBANX with broader geographic coverage. Better if KITZ expands beyond LATAM to Africa/Asia. Smart routing maximizes approval rates in markets with high decline rates.


### Rebill — LATAM Subscriptions `[High]`

- **ID:** PKB-350
- **Type:** Platform
- **URL:** https://www.rebill.com/
- **Why KITZ Needs It:** LATAM recurring payments: subscriptions, local methods, multi-currency

**Intelligence (Enriched):**

Specializes in recurring payments for LATAM using local methods (PIX, OXXO, PSE, boleto, SPEI, cards). Multi-currency (BRL, MXN, COP, ARS, PEN, CLP, USD). Smart dunning management, plan management (trials, upgrades, prorations), hosted checkout. Countries: Brazil, Mexico, Colombia, Argentina, Chile, Peru, Uruguay. Directly relevant to KITZ AI Battery subscription model. Dunning management critical in LATAM where payment failures are common. Alternative to building custom subscription logic on Stripe/MercadoPago.


## LATAM Research


### PCMI — LATAM Payment Methods 2025 `[Critical]`

- **ID:** PKB-351
- **Type:** Research
- **URL:** https://paymentscmi.com/insights/main-payment-methods-latin-america-brazil-mexico-chile-peru-colombia-argentina/
- **Why KITZ Needs It:** Definitive report: payment trends, market share, digital wallets, A2A, by country

**Intelligence (Enriched):**

Definitive annual report on LATAM payment methods. Key findings: Digital wallets fastest-growing, A2A transfers (PIX, SPEI, PSE) displacing cards, cash declining (still 20-40%), credit installments (cuotas) are uniquely LATAM, QR payments growing (Argentina, Brazil). By country: Brazil = PIX dominates 40%+ e-commerce; Mexico = cards lead 55% but OXXO/SPEI growing; Colombia = PSE 64% e-commerce, Nequi/Daviplata for P2P; Argentina = high wallet adoption, installments critical; Peru = Yape explosion 50%+ adoption; Chile = debit cards growing, Khipu for transfers. KITZ should default to dominant method per market: PIX (BR), OXXO+SPEI (MX), PSE+Nequi (CO), MP QR (AR), Yape (PE), Khipu+WebPay (CL). Installments must be supported. Cash-in networks essential for unbanked.


## LATAM Fintech


### Rappi — Super App `[High]`

- **ID:** PKB-352
- **Type:** Platform
- **URL:** https://www.rappi.com/
- **Why KITZ Needs It:** LATAM super app: delivery+payments+banking, RappiPay, 9 countries, $5.25B

**Intelligence (Enriched):**

LATAM's leading super app ($5.25B valuation). Delivery (restaurants, groceries, pharmacy), RappiPay (wallet, debit card), RappiCard (credit in Colombia/Mexico), RappiPrime (subscription), Rappi Travel, Rappi for Business (B2B logistics). 9 countries: Colombia, Mexico, Brazil, Argentina, Chile, Peru, Ecuador, Uruguay, Costa Rica. Partners pay 15-30% commission, self-serve portal for catalog/promotions/analytics, Rappi Ads for promoted listings. Many KITZ target users are Rappi partners. High commissions (15-30%) are a pain point -- KITZ can help build direct channels (WhatsApp, website) to reduce dependency. RappiPay is another wallet to be aware of.

