# Panama Financial & Payment Infrastructure Intelligence

**Document type:** Strategic Intelligence Brief
**Last updated:** 2026-02-24
**Status:** Living document -- update as regulations and integrations evolve
**Audience:** Kitz engineering, product, and compliance teams

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Payment Systems](#2-payment-systems)
3. [Banking & Interbank Infrastructure](#3-banking--interbank-infrastructure)
4. [Government & Regulatory Bodies](#4-government--regulatory-bodies)
5. [Invoice Compliance](#5-invoice-compliance)
6. [Payment Flow Architecture](#6-payment-flow-architecture)
7. [Currency & Localization](#7-currency--localization)
8. [Competitive Landscape](#8-competitive-landscape)
9. [Implementation Roadmap](#9-implementation-roadmap)
10. [Compliance Checklist for Launch](#10-compliance-checklist-for-launch)
11. [Partnership Opportunities](#11-partnership-opportunities)
12. [Appendix: Reference Links](#12-appendix-reference-links)

---

## 1. Executive Summary

Panama presents a unique financial environment for Kitz. The country uses the US Dollar (alongside the Panamanian Balboa at 1:1 parity), has a large and sophisticated banking sector relative to its size, and is undergoing rapid digitization of its tax and invoicing systems. The electronic invoicing mandate, tightening in January 2026, creates both a compliance obligation and a market opportunity: small businesses that currently use the DGI's free invoicing tool are being forced to adopt paid PAC-provider solutions. Kitz, with its existing `invoice_create` tool and `paymentTools.ts` infrastructure that already supports `yappy` and `bac` as provider enums, is well-positioned to become the all-in-one operating system these businesses need.

**Key takeaways:**

- Yappy dominates consumer-to-business payments with 2M+ users across multiple banks. Kitz already references `yappy` in `paymentTools.ts` -- full QR and webhook integration is the top payment priority.
- The DGI's e-invoice mandate (Resolution 201-6299) forces businesses with >B/. 36,000 annual revenue or >100 monthly documents to use a PAC provider starting January 2026. This is already in effect. Kitz's `invoice_create` tool must evolve to generate DGI-compliant XML.
- ITBMS (7% VAT) is already the default tax rate in Kitz's `invoice_create` tool (`tax_rate ?? 0.07`). Correct, but additional tax rules (exemptions, special rates) need implementation.
- ACH Directo, modernized in 2021 by Telered with ISO 20022 and real-time 24/7 capability, is the backbone for B2B payments.
- AMPYME classification (micro/small/medium by revenue brackets) determines tax incentives and support programs -- Kitz should capture and use this classification per workspace.

---

## 2. Payment Systems

### 2.1 Yappy (Banco General)

**What it is:**
Yappy is Panama's dominant digital wallet and P2P payment platform, originally built by Banco General and now expanded to include users from Caja de Ahorros and other partner banks. It supports QR-based payments, instant person-to-person transfers, and merchant payment acceptance. As of 2025, it serves 2M+ users and 36,000+ affiliated businesses.

**Why Kitz needs it:**
Yappy is the single most important payment integration for Kitz in Panama. Most SMB customers will expect to pay via Yappy. Kitz's `paymentTools.ts` already includes `'yappy'` in its provider enum -- this confirms the architectural intent. The `payments_processWebhook` tool accepts Yappy transaction references and processes them through the standard flow.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Developer portal | https://yappy.com.pa/comercial/desarrolladores/ |
| Node.js SDK | `eprezto-yappy` (npm) -- community port of the official PHP SDK |
| Authentication | `merchantId` + `secretToken` (issued by Banco General for business accounts) |
| SSL requirement | Mandatory -- all endpoints must serve HTTPS |
| Sandbox mode | Supported via SDK configuration (`sandbox: true`) |
| Callback URLs | `successUrl`, `failUrl`, `domainUrl`, `checkoutUrl` -- no query strings (RFC 3986 limitation) |
| Official SDK languages | PHP (official), Node.js (community port), .NET (official) |

**Integration pattern for Kitz:**

```
1. Kitz generates Yappy payment request via SDK
   -> SDK returns QR code / payment link
2. Customer scans QR or clicks payment link
3. Customer confirms payment in Yappy app
4. Yappy sends webhook to Kitz callback URL
5. Kitz calls payments_processWebhook(provider: 'yappy', ...)
6. On completion: invoice status -> 'paid', CRM contact updated, WhatsApp receipt sent
```

**Key SDK configuration:**

```typescript
import YappyClient from 'eprezto-yappy';

const yappy = new YappyClient({
  secretToken: process.env.YAPPY_SECRET_TOKEN,
  merchantId: process.env.YAPPY_MERCHANT_ID,
  successUrl: 'https://kitz.app/payments/yappy/success/{orderId}',
  failUrl: 'https://kitz.app/payments/yappy/fail/{orderId}',
  domainUrl: 'https://kitz.app',
  checkoutUrl: 'https://kitz.app/checkout',
  sandbox: process.env.NODE_ENV !== 'production',
});
```

**Important implementation notes:**
- Include the `orderId` in the URL path, not as a query parameter. The SDK does not correctly handle query strings due to RFC 3986 encoding issues.
- The SDK is backend-only (Node.js). Do not attempt to use it in browser/frontend code.
- `merchantId` and `secretToken` are only issued to business accounts at Banco General. Each Kitz workspace owner must have their own Banco General business account.

**Compliance requirements:**
- Kitz workspace owner must have a registered Banco General business account.
- Yappy Comercial merchant agreement must be active.
- All transaction data must be retained for 5 years per SBP requirements.

**Implementation timeline:** NOW (Q1 2026) -- highest priority payment integration.

**Action items:**
1. Register Kitz as a Yappy Comercial merchant for the platform's own account.
2. Build webhook receiver endpoint mapped to `payments_processWebhook`.
3. Implement QR code generation flow in the storefront module.
4. Build per-workspace Yappy credential management (merchantId/secretToken storage via encrypted workspace settings).
5. Test end-to-end in sandbox before production rollout.

---

### 2.2 Yappy Comercial (Merchant Platform)

**What it is:**
Yappy Comercial is the merchant-facing side of Yappy. It allows businesses to accept Yappy payments at point-of-sale (POS), online, and through payment links. It provides a merchant dashboard with transaction history, settlement reports, and payment link generation.

**Why Kitz needs it:**
Every Kitz workspace that accepts payments in Panama should be a Yappy Comercial merchant. The platform provides the credential pair (`merchantId`/`secretToken`) required by the developer SDK. Without Yappy Comercial, there is no Yappy integration.

**Technical integration:**
- Onboarding is handled through Banco General's commercial banking portal.
- Merchants receive their API credentials after completing KYC and signing the merchant agreement.
- Settlement is into the merchant's Banco General business account.
- Banco General provides a merchant dashboard at https://www.bgeneral.com/yappynegocios/ for reconciliation.

**Compliance requirements:**
- Business must be registered in Panama (via Panama Emprende or traditional registry).
- Active RUC (tax ID) required.
- Business bank account at Banco General.

**Implementation timeline:** NOW (Q1 2026) -- prerequisite for Yappy payment integration.

**Action items:**
1. Document the Yappy Comercial onboarding flow for Kitz workspace owners.
2. Build a guided setup wizard in Kitz UI for entering Yappy Comercial credentials.
3. Add credential validation (test API call) during setup.

---

### 2.3 BAC Compra Click

**What it is:**
BAC Credomatic's Compra Click is a payment link system for SMBs. It allows merchants to generate payment links that can be shared via email, social media, or embedded in web pages. Customers pay using any credit or debit card (local or international) through a secure, hosted payment page. BAC also offers installment plans (0% interest cuotas) through this channel.

**Why Kitz needs it:**
Compra Click complements Yappy by accepting card payments from any bank, not just Banco General. International customers (tourists, foreign businesses) who do not have Yappy can pay via Compra Click. It also enables recurring payments and card-on-file scenarios that Yappy does not support. Kitz's `paymentTools.ts` already includes `'bac'` in its provider enum.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Integration type | Payment links (no direct API for custom checkout) |
| Card types accepted | Visa, Mastercard, AMEX (credit and debit, local and international) |
| Settlement | Into merchant's BAC Credomatic business account |
| Security | PCI-DSS compliant hosted page; card data never touches merchant |
| Notifications | Email notifications to both merchant and customer on payment |
| Installments | 0% interest installment plans available for local cards |
| Dashboard | Sales statistics and transaction history via BAC merchant portal |
| Third-party integration | Available through Tilopay (WooCommerce plugin) and similar gateways |

**Integration pattern for Kitz:**

```
1. Kitz generates Compra Click payment link via BAC merchant portal or API
2. Payment link is sent to customer (via WhatsApp, email, or storefront)
3. Customer enters card details on BAC-hosted secure page
4. BAC processes payment and sends confirmation
5. Kitz receives notification -> payments_processWebhook(provider: 'bac', ...)
6. Invoice updated, CRM updated, receipt sent
```

**Compliance requirements:**
- Merchant must have a BAC Credomatic business account.
- PCI-DSS compliance is handled by BAC (hosted payment page model).
- Merchant agreement with BAC Credomatic required.

**Implementation timeline:** Q2 2026 -- second priority after Yappy.

**Action items:**
1. Contact BAC Credomatic commercial team to explore direct API access (beyond payment links).
2. Build payment link generation flow in Kitz (manual or automated per invoice).
3. Implement webhook/notification receiver for BAC payment confirmations.
4. Evaluate Tilopay as an intermediary gateway if BAC does not offer direct API.

---

### 2.4 Stripe (International Card Payments)

**What it is:**
Stripe is the global leader in developer-first payment infrastructure. It supports card payments (Visa, Mastercard, AMEX, Discover), digital wallets (Apple Pay, Google Pay), bank debits, and 135+ currencies. Stripe launched support for Panama-based businesses, enabling local merchants to accept international card payments with direct payouts to Panamanian bank accounts.

**Why Kitz needs it:**
Stripe is essential for three scenarios that Yappy and BAC Compra Click cannot cover:
1. **International customers:** Tourists, foreign businesses, and diaspora customers paying with non-Panamanian cards get the best acceptance rates through Stripe.
2. **Recurring/subscription payments:** Stripe Billing handles subscription lifecycle (trials, upgrades, dunning) out of the box — critical for Kitz workspaces that sell subscription services.
3. **E-commerce/storefront:** Stripe Checkout and Payment Links integrate directly into Kitz's storefront module with minimal code.

Kitz's `paymentTools.ts` already includes `'stripe'` in its provider enum — this is the most mature integration path.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Developer docs | https://docs.stripe.com/ |
| Node.js SDK | `stripe` (npm) — official, well-maintained |
| Authentication | `STRIPE_SECRET_KEY` (per workspace) + `STRIPE_PUBLISHABLE_KEY` |
| Webhook signing | `STRIPE_WEBHOOK_SECRET` for signature verification |
| Panama support | Stripe Atlas or direct Panama entity registration |
| PCI compliance | Stripe.js / Stripe Elements handle card data — PCI SAQ-A eligible |
| Payout currency | USD (standard for Panama) |
| Settlement | T+2 to Panamanian bank account (USD) |
| Pricing | 2.9% + $0.30 per transaction (standard), volume discounts available |

**Integration pattern for Kitz:**

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
});

// Create a Payment Intent for an invoice
async function createPaymentForInvoice(invoiceId: string, amount: number, currency = 'usd') {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Stripe uses cents
    currency,
    metadata: { invoiceId, source: 'kitz' },
    automatic_payment_methods: { enabled: true },
  });
  return paymentIntent.client_secret;
}

// Webhook handler
async function handleStripeWebhook(payload: Buffer, sig: string) {
  const event = stripe.webhooks.constructEvent(
    payload,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!,
  );

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent;
    // -> payments_processWebhook(provider: 'stripe', provider_transaction_id: pi.id)
    // -> Invoice status -> 'paid'
    // -> CRM contact updated
    // -> WhatsApp receipt sent
  }
}
```

**Key Stripe products relevant to Kitz:**

| Product | Use Case | Priority |
|---|---|---|
| **Payment Intents** | One-time invoice payments | NOW |
| **Checkout** | Hosted payment page (lowest PCI burden) | NOW |
| **Payment Links** | No-code payment collection via WhatsApp/email | NOW |
| **Billing** | Recurring subscriptions for service-based SMBs | Q2 2026 |
| **Connect** | Marketplace payments (if Kitz facilitates payments between businesses) | Q3 2026 |
| **Invoicing** | Stripe-native invoicing (evaluate vs Kitz's own) | Evaluate |
| **Terminal** | In-person card payments with Stripe readers | Future |
| **Radar** | Fraud detection (included with payments) | Automatic |

**Multi-provider strategy with Stripe:**

```
Customer in Panama with Yappy    -> Yappy (fastest, cheapest, 0% fee)
Customer in Panama with card     -> BAC Compra Click (local acquirer, lower fees)
International customer with card -> Stripe (best acceptance, 135+ currencies)
Recurring subscription           -> Stripe Billing (lifecycle management)
E-commerce storefront            -> Stripe Checkout (hosted, PCI-free)
```

**Compliance requirements:**
- Kitz workspace owner needs a Stripe account linked to a Panama business entity.
- PCI-DSS: Handled by Stripe (use Stripe.js/Elements — never handle raw card numbers).
- SBP: Stripe operates as a licensed payment facilitator; Kitz does not need separate licensing for card processing via Stripe.
- Data retention: Stripe retains transaction data; Kitz should mirror key fields for local compliance.

**Implementation timeline:** NOW (Q1 2026) — highest priority for international payments; Stripe is already in the provider enum.

**Action items:**
1. Build Stripe Connect onboarding flow for per-workspace Stripe accounts (or use platform-level Stripe with transfers).
2. Implement Payment Intent creation in `paymentTools.ts` for invoice payments.
3. Add Stripe webhook receiver to `payments_processWebhook`.
4. Generate Stripe Payment Links for WhatsApp/email invoice delivery.
5. Evaluate Stripe Checkout vs custom payment form for storefront module.
6. Build Stripe Billing integration for workspace owners who sell subscriptions.

---

## 3. Banking & Interbank Infrastructure

### 3.1 ACH Directo (Interbank Clearing)

**What it is:**
ACH Directo is Panama's interbank automated clearing house, operated by Telered, S.A. through CIASA (Centro de Intercambio Automatizado, S.A.). Modernized in 2021, it now supports real-time 24/7 instant payments using the ISO 20022 messaging standard. It connects 46 member financial institutions and handles salary deposits, utility payments, B2B transfers, and direct debits.

**Why Kitz needs it:**
ACH Directo is essential for B2B payment workflows. When a Kitz user sends an invoice to another business, that business often pays via ACH bank transfer. Kitz needs to:
- Generate correct ACH payment references on invoices.
- Reconcile incoming ACH payments against outstanding invoices.
- Potentially initiate batch payment requests for payroll or supplier payments (future).

**Technical integration:**

| Aspect | Detail |
|---|---|
| Operator | Telered, S.A. |
| Messaging standard | ISO 20022 |
| Operating hours | 24/7 real-time (post-2021 modernization) |
| Member institutions | 46 banks |
| Standards basis | NACHA (US) standards, adapted for Panama |
| Direct integration | Not available to non-bank entities; must go through a member bank |
| For Kitz | Indirect: generate ACH-compatible references, reconcile via bank feeds |

**Compliance requirements:**
- Kitz cannot directly connect to ACH Directo (bank-only network).
- Must partner with a member bank for any ACH-related automation.
- Transaction records must comply with SBP retention requirements.

**Implementation timeline:** Q3 2026 / Future -- B2B payment reconciliation.

**Action items:**
1. Add ACH bank transfer as a payment instruction option on generated invoices (display bank name, account number, reference code).
2. Explore bank feed APIs (Banco General, BAC) for automated ACH reconciliation.
3. Evaluate Open Banking initiatives in Panama for future direct integration.

---

### 3.2 Banking Landscape

Panama has one of the largest banking sectors in Latin America relative to GDP, with 70+ banks operating in the country. The key banks for Kitz's SMB market are:

| Bank | Relevance to Kitz | Key Products |
|---|---|---|
| **Banco General** | #1 priority -- operates Yappy, largest retail bank | Yappy, Yappy Comercial, business banking, merchant services |
| **BAC Credomatic** | #2 priority -- Compra Click, strong card network | Compra Click, credit/debit card acceptance, business loans |
| **Banistmo** (Bancolombia subsidiary) | Large SMB customer base, growing digital services | Online banking, ACH, business accounts |
| **Global Bank** | Strong in commercial/SMB banking | Business accounts, trade finance, ACH |
| **Caja de Ahorros** | Government savings bank, now Yappy-connected (2025) | Savings accounts, Yappy integration, microfinance |
| **Multibank** | Growing digital presence | Online banking, card services |

**Typical SMB banking needs in Panama:**
- Business checking account (cuenta corriente empresarial)
- Point-of-sale terminal or digital payment acceptance
- Line of credit or working capital loan
- USD wire transfers (international trade)
- ACH for payroll and supplier payments
- Cash deposit services (many SMBs still handle significant cash)

**Action items:**
1. Prioritize integrations with Banco General (Yappy) and BAC (Compra Click).
2. Monitor Banistmo and Global Bank for API/developer program launches.
3. Consider bank-agnostic reconciliation features using standardized bank statement imports (MT940, CSV).

---

## 4. Government & Regulatory Bodies

### 4.1 Superintendencia de Bancos de Panama (SBP)

**What it is:**
The SBP is Panama's banking and financial services regulator. It supervises all banks, trust companies, and entities that hold client funds or issue electronic money. The SBP sets capital requirements, consumer protection rules, AML/KYC standards, and reporting obligations.

**Why Kitz needs it:**
If Kitz processes, holds, or transmits customer funds, it may fall under SBP supervision. Even if Kitz operates as a technology layer on top of existing payment providers (Yappy, BAC), it must understand SBP requirements to avoid inadvertently acting as an unlicensed payment processor.

**Relevant regulations:**

| Regulation | Description | Impact on Kitz |
|---|---|---|
| Rule 1-2026 | Updated AML/CFT/CPF provisions (January 2026) | KYC/AML requirements for any entity handling financial data |
| Rule 4-2025 | Information transparency for banking products | Consumer-facing disclosure requirements |
| Rule 9-2025 | Consumer complaint handling procedures | Customer support requirements if Kitz facilitates payments |
| General licensing | Payment license requirements for fintechs | Determines if Kitz needs an SBP license |

**Compliance requirements:**
- **KYC (Know Your Customer):** Kitz must verify the identity of workspace owners who process payments. At minimum: government-issued ID, RUC, proof of business registration.
- **AML (Anti-Money Laundering):** Transaction monitoring for suspicious patterns. Report suspicious transactions to UAF (Unidad de Analisis Financiero).
- **Data protection:** Customer payment data must be stored securely and retained per SBP guidelines.
- **Licensing assessment:** Determine whether Kitz's payment facilitation model requires an SBP payment license or if operating through licensed providers (Banco General, BAC) is sufficient.

**Implementation timeline:** NOW -- legal assessment required before payment features launch.

**Action items:**
1. Engage a Panamanian fintech attorney to assess whether Kitz requires an SBP license.
2. Implement KYC verification flow for workspace owners who enable payment acceptance.
3. Build transaction monitoring and reporting infrastructure.
4. Document Kitz's operating model as a technology provider (not a payment processor) to clarify regulatory positioning.

---

### 4.2 DGI (Direccion General de Ingresos)

**What it is:**
The DGI is Panama's tax authority, operating under the Ministry of Economy and Finance (MEF). It administers tax collection, taxpayer registration (RUC), ITBMS (VAT), income tax, and the electronic invoicing system (Factura Electronica).

**Why Kitz needs it:**
Every invoice Kitz generates through `invoice_create` must comply with DGI requirements. The DGI's electronic invoicing mandate directly affects Kitz's core invoicing functionality. Additionally, Kitz should help workspace owners comply with their tax obligations (ITBMS filing, RUC maintenance).

**Key DGI systems:**

| System | URL | Purpose |
|---|---|---|
| Factura Electronica portal | https://dgi-fep.mef.gob.pa/ | E-invoice generation and validation |
| DGI main portal | https://dgi.mef.gob.pa/ | Tax filing, RUC management |
| RUC registry | Via DGI portal | Taxpayer identification and validation |

**Compliance requirements:**
- All Kitz-generated invoices must include: RUC of issuer, sequential invoice number, ITBMS breakdown, CUFE (for e-invoices).
- ITBMS filing is due by the 15th of each month.
- Businesses with >B/. 36,000 annual revenue must use e-invoicing via a PAC provider.
- RUC must be current -- DGI mandated updates by December 31, 2025 (Resolution 201-4488). Non-compliance leads to fines of B/. 100 to B/. 500 and RUC suspension.

**Implementation timeline:** NOW -- invoicing compliance is critical path.

**Action items:**
1. Add RUC field to workspace setup (validated format).
2. Implement DGI-compliant invoice numbering (sequential, per-workspace, non-repeating).
3. Build ITBMS calculation with exemption support.
4. Investigate PAC provider partnership or become a PAC (see Section 5).
5. Add ITBMS filing reminder automation (monthly, by the 15th).

---

### 4.3 Factura Electronica (Electronic Invoicing)

**What it is:**
Panama's electronic invoicing system, established by Law 256 of 2021 and Executive Decree 766 of 2020, requires businesses to issue invoices as digitally signed XML documents validated by a PAC (Proveedor Autorizado Calificado). The DGI assigns a CUFE (Codigo Unico de Factura Electronica) to each valid electronic invoice.

**Why Kitz needs it:**
This is the single most impactful regulatory requirement for Kitz's invoicing feature. As of January 2026 (Resolution 201-6299), businesses exceeding either threshold must use a PAC:
- Annual gross income >B/. 36,000, OR
- More than 100 documents issued per month.

Most Kitz target customers (active SMBs) will exceed one or both thresholds. Kitz's `invoice_create` tool currently generates HTML invoices -- these are not DGI-compliant and cannot replace the legal requirement for PAC-validated XML invoices.

**Technical requirements:**

| Requirement | Detail |
|---|---|
| Document format | XML (DGI-specified schema) |
| Digital signature | Qualified electronic signature using a DGI-approved digital certificate |
| Validation | PAC validates the XML structure, mandatory fields, and formats |
| CUFE assignment | PAC generates the CUFE (Unique Electronic Invoice Code) |
| Storage | Both issuer and PAC must retain XML copies for 5 years minimum |
| Technical specification | Ficha Tecnica v1.10 (available from DGI portal) |

**PAC integration options for Kitz:**

| Option | Pros | Cons |
|---|---|---|
| **Become a PAC** | Full control, revenue from e-invoicing service | Lengthy DGI authorization process, significant compliance burden |
| **Partner with existing PAC** | Faster to market, reduced compliance burden | Dependency on third party, revenue sharing |
| **Integrate PAC API** | Best for Kitz -- issue invoices through PAC's validated pipeline | Must select and negotiate with a PAC partner |

**Recommended approach:** Integrate with an existing PAC provider via API. Kitz generates the invoice data, sends it to the PAC for XML generation, signing, and CUFE assignment, then stores the validated invoice. This keeps Kitz focused on the user experience while leveraging the PAC's compliance infrastructure.

**Implementation timeline:** NOW / Q2 2026 -- critical for legal compliance.

**Action items:**
1. Download and study the Ficha Tecnica v1.10 from https://dgi.mef.gob.pa/_7facturaelectronica/ftpiloto
2. Select a PAC partner (evaluate Gosocket, EDICOM, and local PAC providers).
3. Build XML generation layer that transforms `invoice_create` output into DGI-compliant XML.
4. Implement digital certificate management per workspace.
5. Add CUFE to the invoice data model and display on invoice HTML.
6. Build 5-year invoice archive infrastructure.

---

### 4.4 Panama Emprende

**What it is:**
Panama Emprende is the Ministry of Commerce and Industries' (MICI) digital platform for business registration. It allows entrepreneurs to register their businesses online in under 24 hours with minimal bureaucracy. The system generates a digital commercial license (Aviso de Operacion) upon approval.

**Why Kitz needs it:**
During workspace onboarding, Kitz needs to verify that the business is legally registered. Panama Emprende is the authoritative source for business registration data. Additionally, Kitz could guide new users who are not yet registered through the Panama Emprende process.

**Registration details:**

| Business type | Description | Typical Kitz user |
|---|---|---|
| Empresa Individual | Sole proprietor, simplest form | Freelancers, solo SMBs |
| S.R.L. (Sociedad de Responsabilidad Limitada) | Limited liability company | Small businesses with partners |
| S.A. (Sociedad Anonima) | Corporation | Larger SMBs, established businesses |

**Process:**
1. Access https://www.panamaemprende.gob.pa/
2. Create account with cedula (national ID) or passport.
3. Enter business details: name, economic activity (CIIU code), location.
4. Upload required documents: ID copy, proof of address, activity-specific permits.
5. Pay registration fees (vary by business type and location).
6. Receive digital Aviso de Operacion (commercial license).

**Technical integration:**
- No public API currently available.
- Kitz can validate business registration by asking users to upload their Aviso de Operacion.
- Future: monitor for API availability as Panama digitizes government services.

**Implementation timeline:** Q2 2026 -- workspace onboarding enhancement.

**Action items:**
1. Add Aviso de Operacion upload/verification step to workspace onboarding.
2. Build a "Register your business" guide within Kitz for unregistered users, linking to Panama Emprende.
3. Store business registration number and type in workspace settings.
4. Cross-reference with RUC validation for compliance completeness.

---

### 4.5 AMPYME (Autoridad de la Micro, Pequena y Mediana Empresa)

**What it is:**
AMPYME is Panama's government agency for micro, small, and medium enterprise development. It classifies businesses by revenue, offers seed capital grants, provides loan guarantees (PROFIPYME), delivers training programs, and administers tax incentives for new microenterprises.

**Revenue classification:**

| Category | Annual gross revenue | Relevance |
|---|---|---|
| Micro | Up to B/. 150,000 | Core Kitz target -- largest segment |
| Small | B/. 150,001 -- B/. 1,000,000 | Growth Kitz target |
| Medium | B/. 1,000,001 -- B/. 2,500,000 | Premium Kitz target |

**Why Kitz needs it:**
AMPYME classification determines:
- **Tax incentives:** Microenterprises are exempt from income tax for the first 2 fiscal years after AMPYME registration.
- **Financing access:** PROFIPYME provides 60-80% government-backed loan guarantees.
- **Seed capital:** Non-reimbursable grants of up to B/. 2,000 for new entrepreneurs.
- **Training:** Free workshops and courses that Kitz could integrate or complement.

**Partnership opportunity:**
AMPYME actively promotes tools and services that help SMBs digitize. Kitz could:
- Become an AMPYME-recommended technology provider.
- Integrate AMPYME training resources into the Kitz platform.
- Help AMPYME track SMB digitization metrics.
- Offer preferential pricing for AMPYME-registered businesses.

**Implementation timeline:** Q3 2026 -- partnership development.

**Action items:**
1. Add AMPYME classification (micro/small/medium) to workspace profile.
2. Auto-detect classification based on revenue data flowing through Kitz.
3. Surface relevant AMPYME programs and incentives to workspace owners.
4. Initiate partnership conversation with AMPYME leadership.
5. Explore co-branded SMB digitization program.

---

## 5. Invoice Compliance

### 5.1 ITBMS (Impuesto de Transferencia de Bienes Muebles y Servicios)

ITBMS is Panama's equivalent of VAT. It is charged on the transfer of goods, provision of services, and imports.

**Tax rates:**

| Rate | Application |
|---|---|
| **7%** | Standard rate -- most goods and services |
| **10%** | Alcoholic beverages, tobacco products |
| **15%** | Hotel and lodging services |
| **0%** | Exports, basic food items, medicines, educational materials |
| **Exempt** | Financial services, insurance, health services, residential rent |

**Current Kitz implementation:**
The `invoice_create` tool defaults to `tax_rate ?? 0.07` (7%). This is correct for the standard rate but does not account for the 10%, 15%, or 0% rates. Mixed-rate invoices (line items with different rates) are not supported.

**Required enhancements:**

```typescript
// Current: single tax rate per invoice
tax_rate: { type: 'number', description: 'Tax rate (default: 0.07 for Panama ITBMS)' }

// Needed: per-line-item tax rate with category
interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxCategory?: 'standard' | 'alcohol_tobacco' | 'hotel' | 'export' | 'exempt';
  taxRate?: number; // Override: 0.07, 0.10, 0.15, 0.00
}
```

**ITBMS filing obligations:**
- Monthly filing due by the 15th of each month.
- Businesses with annual revenue >B/. 36,000 must register as ITBMS taxpayers.
- The declaration includes: total sales, taxable sales by rate, exempt sales, tax collected, tax credits (input tax), net tax payable.

**Action items:**
1. Extend `LineItem` interface to support per-item tax categories and rates.
2. Implement tax calculation logic for all four rate tiers.
3. Add ITBMS summary section to invoice output (breakdown by rate).
4. Build monthly ITBMS pre-filing report (aggregate workspace invoices by rate).
5. Add ITBMS filing reminder to the workspace automation calendar.

---

### 5.2 E-Invoice (Factura Electronica) Schema Requirements

**Document types in the e-invoice system:**

| Code | Document type | Kitz mapping |
|---|---|---|
| 01 | Factura de operacion interna | Standard invoice (`invoice_create`) |
| 02 | Factura de importacion | Not applicable (future) |
| 03 | Factura de exportacion | Future |
| 04 | Nota de credito | Credit note (needed for returns/adjustments) |
| 05 | Nota de debito | Debit note |
| 06 | Nota de credito generico | Generic credit note |
| 07 | Factura de zona franca | Free zone invoice (future) |

**Mandatory XML fields (Factura de operacion interna):**

```xml
<rFE>
  <!-- Header -->
  <dVerForm>1.10</dVerForm>           <!-- Schema version -->
  <dId>{CUFE}</dId>                    <!-- Unique invoice code (from PAC) -->
  <dDT>01</dDT>                       <!-- Document type -->
  <dNroDF>{sequential_number}</dNroDF> <!-- Sequential document number -->
  <dPtoFacDF>{branch_code}</dPtoFacDF> <!-- Point of sale / branch code -->
  <dFechaEm>{date}</dFechaEm>         <!-- Issue date (YYYY-MM-DD) -->

  <!-- Issuer (Emisor) -->
  <dRucEm>{ruc}</dRucEm>              <!-- Issuer RUC -->
  <dNombEm>{business_name}</dNombEm>  <!-- Issuer business name -->
  <dSucEm>{branch}</dSucEm>           <!-- Branch code -->
  <dDirecEm>{address}</dDirecEm>      <!-- Business address -->

  <!-- Receiver (Receptor) -->
  <dRucRe>{customer_ruc}</dRucRe>     <!-- Customer RUC (if B2B) -->
  <dNombRe>{customer_name}</dNombRe>  <!-- Customer name -->

  <!-- Line Items (Detalle) -->
  <gItem>
    <dDescProd>{description}</dDescProd>
    <dCantCodInt>{quantity}</dCantCodInt>
    <dPrUnit>{unit_price}</dPrUnit>
    <dPrItem>{line_total}</dPrItem>
    <dTasaITBMS>{tax_rate}</dTasaITBMS>
    <dValITBMS>{tax_amount}</dValITBMS>
  </gItem>

  <!-- Totals -->
  <dTotNeto>{subtotal}</dTotNeto>
  <dTotITBMS>{total_tax}</dTotITBMS>
  <dTotGravado>{total_taxable}</dTotGravado>
  <dTotDesc>{total_discount}</dTotDesc>
  <dVTot>{grand_total}</dVTot>

  <!-- Digital Signature -->
  <Signature>...</Signature>
</rFE>
```

**Key validation rules:**
- Invoice numbers must be sequential and non-repeating per branch/point-of-sale.
- RUC format validation: `XX-XXXXXX-XX-XX` (entity type - number - DV - branch).
- Dates must be in `YYYY-MM-DD` format in XML.
- Amounts must use 2 decimal places.
- CUFE is generated by the PAC, not by the issuer.
- Digital signature must use a certificate approved by the Direccion Nacional de Firma Electronica.

---

### 5.3 RUC (Registro Unico de Contribuyente) Validation

**RUC format:**
The RUC is Panama's tax identification number. Its format varies by entity type:

| Entity type | RUC prefix | Example |
|---|---|---|
| Natural person (Panamanian) | Cedula-based | `8-123-456` |
| Natural person (foreign) | E or PE prefix | `E-8-12345` or `PE-123-456` |
| Legal entity (S.A., S.R.L.) | Folio/Ficha-based | `155678-1-12345 DV 67` |
| Government | NT prefix | `NT-1-12345` |

**Validation approach:**
- Strip whitespace and normalize dashes.
- Validate against known prefix patterns.
- Verify check digit (DV - digito verificador) where applicable.
- Cross-reference with DGI's RUC registry for active status.

**Implementation:**

```typescript
function validateRUC(ruc: string): { valid: boolean; type: string; error?: string } {
  const normalized = ruc.trim().replace(/\s+/g, '');

  // Natural person (Panamanian cedula)
  if (/^\d{1,2}-\d{1,4}-\d{1,6}$/.test(normalized)) {
    return { valid: true, type: 'natural_person_panamanian' };
  }

  // Natural person (foreign)
  if (/^(E|PE|N)-\d{1,4}-\d{1,6}$/.test(normalized)) {
    return { valid: true, type: 'natural_person_foreign' };
  }

  // Legal entity
  if (/^\d{1,7}-\d{1,4}-\d{1,6}(\s*DV\s*\d{1,2})?$/i.test(normalized)) {
    return { valid: true, type: 'legal_entity' };
  }

  return { valid: false, type: 'unknown', error: 'Invalid RUC format' };
}
```

---

### 5.4 Invoice Numbering and Sequencing Rules

**DGI requirements:**
- Invoice numbers must be sequential (no gaps in production use).
- Each point of sale (punto de facturacion) has its own numbering sequence.
- Format: `{branch_code}-{sequence_number}` (e.g., `001-000001234`).
- The numbering must restart only when authorized by DGI.
- Both physical and electronic invoices share the same numbering scheme within a branch.

**Current Kitz implementation issue:**
The `invoiceQuoteTools.ts` uses an in-memory counter (`let invoiceCounter = 0`) with format `INV-001`. This is:
- Not persistent across restarts.
- Not DGI-compliant (missing branch code, wrong format).
- Shared across all workspaces (no workspace isolation).

**Required changes:**
1. Per-workspace, per-branch sequential numbering stored in the database.
2. Format: `{branch_code}-{padded_sequence}` (e.g., `001-000000001`).
3. Gap detection and alerting.
4. Concurrency-safe increment (database-level atomic counter).
5. Separate sequences for invoices, credit notes, debit notes.

---

## 6. Payment Flow Architecture

### 6.1 End-to-End Payment Flow

```
                          PAYMENT INITIATION
                          ==================

  Kitz Workspace Owner                    Customer
        |                                    |
        |  Creates invoice (invoice_create)  |
        |  with line items + ITBMS           |
        |                                    |
        v                                    |
  +-----------+                              |
  | Invoice   | -- DGI XML via PAC --------> | DGI validates + CUFE assigned
  | Generated |                              |
  +-----------+                              |
        |                                    |
        |  Sends via WhatsApp/Email          |
        |  (invoice_send)                    |
        v                                    v
  +-----------+                        +-----------+
  | Payment   | <-- Customer chooses   | Customer  |
  | Options   |     payment method --> | Selects   |
  +-----------+                        +-----------+
        |                                    |
        +-------- Yappy QR ---------+        |
        |                           |        |
        +---- Compra Click Link ----+        |
        |                           |        |
        +---- ACH Bank Transfer ----+        |
        |                           v        |
        |                     +-----------+  |
        |                     | Payment   |  |
        |                     | Processed |  |
        |                     +-----------+  |
        |                           |        |
        v                           v        |
  +-----------+               +-----------+  |
  | Webhook   | <-- Provider  | Provider  |  |
  | Received  |    callback   | Confirms  |  |
  +-----------+               +-----------+  |
        |                                    |
        v                                    |
  +---------------------+                   |
  | payments_process    |                   |
  | Webhook             |                   |
  | (paymentTools.ts)   |                   |
  +---------------------+                   |
        |                                    |
        +-- Invoice status -> 'paid'         |
        +-- CRM contact -> payment recorded  |
        +-- WhatsApp receipt sent ---------->|
        +-- Revenue dashboard updated        |
        +-- ITBMS ledger updated             |
```

### 6.2 Webhook Processing Detail

The existing `payments_processWebhook` in `paymentTools.ts` provides the correct foundation. The flow is:

```typescript
// Existing: paymentTools.ts line 28-29
provider: { type: 'string', enum: ['stripe', 'paypal', 'yappy', 'bac'] }
provider_transaction_id: { type: 'string' } // e.g., Yappy reference code

// Webhook arrives from Yappy/BAC/Stripe/PayPal
// -> payments_processWebhook normalizes the payload
// -> Stores transaction in workspace DB
// -> If storefront_id is provided, marks storefront as paid
// -> Returns transaction record
```

**Enhancements needed:**
1. Link payment to specific invoice number (add `invoice_number` field to webhook payload).
2. Auto-update invoice status from `'sent'` to `'paid'` on successful payment.
3. Trigger WhatsApp receipt via the messaging tools.
4. Record payment for ITBMS ledger aggregation.

### 6.3 Multi-Provider Strategy

```
Priority 1 (Now):     Yappy         -- 70%+ of Panama P2P/P2B payments
Priority 2 (Now):     Stripe        -- International cards, subscriptions, e-commerce (already in provider enum)
Priority 3 (Q2 2026): BAC Compra    -- Local card payments, installments
Priority 4 (Q3 2026): ACH Directo   -- B2B bank transfers
Priority 5 (Future):  PayPal        -- International fallback
```

---

## 7. Currency & Localization

### 7.1 Currency

| Aspect | Detail |
|---|---|
| Official currency | Panamanian Balboa (PAB) and US Dollar (USD) |
| Exchange rate | PAB = USD at permanent 1:1 parity |
| Practical usage | USD bills circulate alongside PAB coins; all digital transactions are in USD |
| Kitz implementation | Use `USD` as the currency code; display as `B/.` or `$` based on user preference |
| Currency in paymentTools.ts | Already defaults to `'USD'` (line 42: `currency: args.currency \|\| 'USD'`) |

**Display conventions:**
- Primary format: `B/. 1,234.56` (formal Panamanian format)
- Alternative: `$1,234.56` (common informal usage, identical to USD)
- Thousands separator: comma (`,`)
- Decimal separator: period (`.`)
- The `invoiceQuoteTools.ts` currently uses `$` prefix (e.g., `$${subtotal.toFixed(2)}`). Consider adding `B/.` as an option for formal invoices.

### 7.2 Date Format

| Context | Format | Example |
|---|---|---|
| User-facing display | DD/MM/YYYY | 24/02/2026 |
| DGI XML invoices | YYYY-MM-DD | 2026-02-24 |
| Internal storage (ISO 8601) | YYYY-MM-DDTHH:mm:ssZ | 2026-02-24T15:30:00Z |
| Current Kitz implementation | `now.toLocaleDateString('es-PA')` | Correct -- uses Panama locale |

### 7.3 Phone Numbers

| Aspect | Detail |
|---|---|
| Country code | +507 |
| Mobile format | +507 6XXX-XXXX (8 digits, starts with 6) |
| Landline format | +507 2XX-XXXX or +507 3XX-XXXX (7 digits) |
| WhatsApp format | 507XXXXXXXX (no + or dashes, for WhatsApp API) |

**Validation regex:**

```typescript
// Mobile number (most common for SMB owners)
const PANAMA_MOBILE = /^\+?507\s?6\d{3}-?\d{4}$/;

// Landline
const PANAMA_LANDLINE = /^\+?507\s?[23]\d{2}-?\d{4}$/;

// WhatsApp-ready format
function toWhatsAppFormat(phone: string): string {
  return phone.replace(/[\s\-\+]/g, ''); // "507 6123-4567" -> "50761234567"
}
```

### 7.4 Address Format

Panama uses a descriptive address system. There are no standardized street numbers or postal codes in most areas.

**Typical format:**
```
{Calle/Avenida} {Name}, {Edificio/Local} {Number}
{Corregimiento}, {Distrito}
{Provincia}, Panama
```

**Example:**
```
Calle 50, Edificio Global Plaza, Piso 12
Bella Vista, Panama
Provincia de Panama, Panama
```

### 7.5 Language

- All Kitz UI for Panama: Spanish (Latin American, Panama variant)
- Invoice templates already use Spanish (`Factura`, `Cotizacion`, `Descripcion`, `Cant.`, `Precio`, `Subtotal`, `Impuesto`, `Descuento`, `Total`)
- The `invoiceQuoteTools.ts` correctly uses Spanish labels in templates
- Legal and tax terms must use official DGI terminology

---

## 8. Competitive Landscape

### 8.1 Direct Competitors (Panama SMB Software)

| Competitor | Strengths | Weaknesses | Kitz Differentiator |
|---|---|---|---|
| **Alegra** | Strong in LatAm, e-invoicing compliance in multiple countries, cloud-based, affordable | Generic LatAm focus -- not Panama-specialized; no AI-powered features; no WhatsApp-native experience | Kitz is Panama-first, AI-native, WhatsApp-integrated |
| **Siigo** | Large (3,000+ employees), acquired Alegra competitor Loggro, strong accounting features | Enterprise-oriented, heavy UI, expensive for micro businesses | Kitz is lightweight, mobile-first, built for micro/small businesses |
| **QuickBooks** (Intuit) | Global brand, robust accounting, large ecosystem | Not localized for Panama (no ITBMS, no e-invoicing, no Yappy), expensive | Kitz is built for Panama from the ground up |
| **Fygaro** | Panama-native, integrated payments (Yappy, cards), storefront builder | Limited CRM, no AI features, narrow feature set | Kitz offers full business OS (CRM + invoicing + payments + AI + WhatsApp) |
| **Tuvendor** | Panama-focused, e-commerce and invoicing | Primarily e-commerce, limited CRM and AI capabilities | Kitz's AI-powered assistant and WhatsApp integration |
| **Gosocket** | Strong in e-invoicing/PAC services across LatAm | Not an SMB operating system -- specialized in e-invoicing compliance | Potential PAC partner rather than competitor |

### 8.2 Kitz's Competitive Advantages

1. **AI-native operating system:** No other Panama SMB tool offers AI-powered content creation, customer communication, and business automation.
2. **WhatsApp-first:** WhatsApp is the primary business communication channel in Panama. Kitz treats it as a core channel, not an add-on.
3. **Panama-first localization:** Built with ITBMS, RUC, Yappy, and DGI compliance from the start.
4. **All-in-one:** CRM + invoicing + payments + content + WhatsApp in a single platform, replacing 3-5 separate tools.
5. **SMB pricing:** Designed for the micro/small business budget (B/. 150,000 and under).

---

## 9. Implementation Roadmap

### Phase 1: Foundation (NOW -- Q1 2026)

| Priority | Task | Owner | Status |
|---|---|---|---|
| P0 | Legal assessment: SBP licensing requirement | Legal | Not started |
| P0 | PAC provider selection and partnership agreement | Product + Legal | Not started |
| P0 | RUC validation in workspace onboarding | Engineering | Not started |
| P1 | Yappy SDK integration (sandbox) | Engineering | Not started |
| P1 | DGI-compliant invoice numbering (per-workspace, sequential) | Engineering | Not started |
| P1 | ITBMS multi-rate support in `invoice_create` | Engineering | Not started |
| P1 | KYC flow for payment-enabled workspaces | Engineering | Not started |

### Phase 2: Payment & Compliance (Q2 2026)

| Priority | Task | Owner | Status |
|---|---|---|---|
| P0 | Yappy production integration (QR + webhook) | Engineering | Blocked by Phase 1 |
| P0 | E-invoice XML generation via PAC API | Engineering | Blocked by PAC partnership |
| P1 | BAC Compra Click integration | Engineering | Not started |
| P1 | Invoice-to-payment linking (auto-mark paid) | Engineering | Not started |
| P1 | WhatsApp receipt automation | Engineering | Not started |
| P2 | ITBMS pre-filing report generation | Engineering | Not started |
| P2 | Panama Emprende onboarding guide | Product | Not started |

### Phase 3: Growth & Optimization (Q3 2026)

| Priority | Task | Owner | Status |
|---|---|---|---|
| P1 | ACH bank transfer reconciliation | Engineering | Not started |
| P1 | Multi-branch support (multiple puntos de facturacion) | Engineering | Not started |
| P2 | AMPYME partnership and integration | Business Dev | Not started |
| P2 | Bank feed import for payment reconciliation | Engineering | Not started |
| P2 | Credit note and debit note support | Engineering | Not started |
| P3 | AMPYME classification auto-detection | Engineering | Not started |

### Phase 4: Future

| Priority | Task | Owner | Status |
|---|---|---|---|
| P2 | Stripe integration for international payments | Engineering | Not started |
| P2 | Recurring payment support | Engineering | Not started |
| P3 | PayPal integration | Engineering | Not started |
| P3 | Open Banking / bank API direct integration | Engineering | Not started |
| P3 | Become a PAC (if volume justifies) | Legal + Engineering | Not started |
| P3 | Export invoice support (Factura de exportacion) | Engineering | Not started |

---

## 10. Compliance Checklist for Launch

Before Kitz can process payments and generate invoices in Panama, the following must be verified:

### Legal & Regulatory

- [ ] SBP licensing assessment completed -- determination of whether Kitz needs a payment license or can operate through licensed providers
- [ ] Privacy policy updated for Panamanian data protection requirements
- [ ] Terms of service reviewed by Panamanian attorney
- [ ] AML/KYC policy documented and implemented
- [ ] PAC partnership agreement signed (or PAC authorization obtained)

### Tax Compliance

- [ ] ITBMS calculation supports all four rate tiers (7%, 10%, 15%, 0%)
- [ ] Tax-exempt categories correctly identified and excluded
- [ ] Invoice numbering is sequential, per-workspace, per-branch, gap-free
- [ ] RUC validation implemented for workspace owners
- [ ] RUC capture implemented for B2B invoice recipients
- [ ] CUFE displayed on all electronic invoices (via PAC)

### E-Invoice (Factura Electronica)

- [ ] XML generation follows DGI Ficha Tecnica v1.10
- [ ] Digital signature integration functional
- [ ] PAC API integration tested and operational
- [ ] 5-year invoice archive infrastructure in place
- [ ] CUFE lookup/verification capability built

### Payment Processing

- [ ] Yappy Comercial merchant account active (for Kitz platform)
- [ ] Yappy webhook receiver tested end-to-end
- [ ] Payment-to-invoice linking functional
- [ ] Transaction data retention policy (5+ years) implemented
- [ ] Payment reconciliation reports available

### User Experience

- [ ] Workspace onboarding captures: business name, RUC, Aviso de Operacion, bank details
- [ ] Currency displayed as `B/.` or `$` per user preference
- [ ] Dates displayed as DD/MM/YYYY in UI
- [ ] Phone numbers validated for Panama format (+507)
- [ ] All UI text in Spanish (Panama variant)
- [ ] WhatsApp receipt templates reviewed for compliance

---

## 11. Partnership Opportunities

### 11.1 Strategic Partnerships

| Partner | Type | Value to Kitz | Approach |
|---|---|---|---|
| **Banco General** | Payment infrastructure | Yappy integration, merchant services, SMB banking | Developer program, commercial partnership |
| **BAC Credomatic** | Payment infrastructure | Card payment acceptance, Compra Click | Commercial merchant agreement |
| **AMPYME** | Distribution & credibility | Access to 100K+ registered SMBs, government endorsement | Propose co-branded digitization program |
| **PAC Provider** (Gosocket, EDICOM, or local) | E-invoicing compliance | DGI-compliant invoice generation, CUFE assignment | API integration partnership |
| **Telered** | Future payment infrastructure | Direct ACH access, real-time payment capabilities | Long-term partnership (requires scale) |

### 11.2 Distribution Partnerships

| Partner | Channel | Opportunity |
|---|---|---|
| AMPYME | Government agency | Feature Kitz in SMB digitization programs; reach micro/small businesses at registration |
| Banco General | Bank branch network | Bundle Kitz with Yappy Comercial onboarding; recommend to new business account holders |
| Contadores (accountants) | Professional network | Referral program for accountants who recommend Kitz to their clients |
| Panama Emprende | Government platform | Integration or recommendation during business registration flow |
| Chambers of Commerce | Business associations | Sindicato de Industriales, Camara de Comercio -- member benefit programs |

---

## 12. Appendix: Reference Links

### Payment Systems
- Yappy: https://www.bgeneral.com/yappy/
- Yappy Comercial: https://www.bgeneral.com/yappynegocios/
- Yappy Developer Portal: https://yappy.com.pa/comercial/desarrolladores/
- Yappy Node.js SDK (Banco General): https://www.bgeneral.com/desarrolladores/boton-de-pago-yappy/modulo-de-node-js/
- Yappy Node.js SDK (Community): https://github.com/joseabraham/eprezto-yappy-sdk
- BAC Compra Click: https://ayuda.baccredomatic.com/pymes/comercios_afiliados/compra-click?country=es-pa

### Government & Tax
- DGI Portal: https://dgi.mef.gob.pa/
- Factura Electronica Portal: https://dgi-fep.mef.gob.pa/
- Factura Electronica Technical Spec: https://dgi.mef.gob.pa/_7facturaelectronica/ftpiloto
- PAC Provider Information: https://dgi.mef.gob.pa/_7FacturaElectronica/Pcalificado
- Superintendencia de Bancos (SBP): https://www.superbancos.gob.pa/en
- SBP Banking Rules: https://www.superbancos.gob.pa/en/acuerdos/bancarios
- Panama Emprende: https://www.panamaemprende.gob.pa/
- AMPYME: https://ampyme.gob.pa/

### Banking
- Banco General: https://www.bgeneral.com/
- BAC Credomatic Panama: https://www.baccredomatic.com/es-pa
- Banistmo: https://www.banistmo.com/
- Global Bank: https://www.globalbank.com.pa/

### Regulatory References
- Law 256 of 2021 (E-invoicing foundation)
- Executive Decree 766 of 2020 (E-invoicing implementation)
- Resolution 201-6299 of July 29, 2025 (Free invoicing tool restrictions)
- Resolution 201-4488 of June 4, 2025 (Mandatory RUC update)
- SBP Rule 1-2026 (AML/CFT/CPF update)
- SBP Rule 4-2025 (Information transparency)

### Market Intelligence
- EDICOM E-Invoicing Guide: https://edicomgroup.com/blog/state-electronic-invoicing-panama
- Panama Payment Rails (Transfi): https://www.transfi.com/blog/panamas-payment-rails-how-they-work---ach-credit-cards-mobile-payments
- Panama Instant Payments (Lightspark): https://www.lightspark.com/knowledge/instant-payments-panama
- Fintech 2025 Panama (Chambers): https://practiceguides.chambers.com/practice-guides/fintech-2025/panama/trends-and-developments

### Payment Platforms
- Stripe Docs: https://docs.stripe.com/
- Stripe Panama: https://stripe.com/pa
- Stripe Node.js SDK: https://github.com/stripe/stripe-node
- Stripe Webhooks: https://docs.stripe.com/webhooks
- Stripe Connect (Marketplace): https://docs.stripe.com/connect
- Stripe Billing (Subscriptions): https://docs.stripe.com/billing

### Kitz Codebase References
- Payment tools: `kitz_os/src/tools/paymentTools.ts`
- Invoice/quote tools: `kitz_os/src/tools/invoiceQuoteTools.ts`
- Invoice workflow: `kitz_os/data/n8n-workflows/invoice-auto-generate.json`

---

*This document should be reviewed and updated quarterly as Panama's regulatory and payment landscape evolves. Key monitoring dates: DGI resolution updates (ongoing), SBP regulatory releases, Yappy platform expansions, and PAC provider market changes.*
