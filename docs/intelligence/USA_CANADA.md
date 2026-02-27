# USA & Canada Financial & Payment Infrastructure Intelligence

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

The United States and Canada represent a secondary but strategically important market for Kitz. While Kitz is LatAm-first -- launching in Panama and expanding across Central and South America -- the North American market matters for three specific reasons:

1. **The US Hispanic/Latino SMB corridor.** There are 5M+ Latino-owned businesses in the United States, growing faster than any other demographic. Many of these entrepreneurs simultaneously operate businesses in both the US and their country of origin. A bakery owner in Miami may also supply a chain in Bogota. A consultant in Houston may invoice clients in Panama City. Kitz's LatAm-native DNA positions it to serve this bi-national entrepreneur better than any US-only or LatAm-only tool.

2. **Cross-border invoicing and payments.** US-to-LatAm remittances exceed $150B/year. Cross-border B2B payments between US/Canadian companies and LatAm suppliers are massive and growing. Kitz workspaces in Panama, Colombia, or Mexico will inevitably need to send invoices to or receive payments from US/Canadian counterparts.

3. **Revenue diversification.** The US SMB SaaS market is worth $100B+. Even a tiny slice -- serving the underserved Latino-owned segment -- represents significant revenue potential at US price points.

**Key takeaways for Kitz engineering:**

- Stripe is already in the `paymentTools.ts` provider enum (`['stripe', 'paypal', 'yappy', 'bac']`). It covers both US and Canada. No new provider integration is needed for basic North American payment acceptance.
- US sales tax is extraordinarily complex (state + county + city, nexus rules, 10,000+ jurisdictions). Kitz should integrate TaxJar or Avalara rather than build tax calculation. This is non-negotiable -- building sales tax logic in-house is a multi-year project.
- Canada's GST/HST/PST system is simpler than US sales tax but still requires province-level logic. It is tractable to implement in-house with a lookup table.
- The US has NO mandatory e-invoicing (unlike Panama's DGI mandate). Invoices are free-form. This makes US invoicing easier but also means Kitz's compliance advantage from Panama does not create a moat in the US.
- EIN (Employer Identification Number) validation for US businesses and BN (Business Number) validation for Canadian businesses should be added to workspace onboarding when North American support launches.
- Interac e-Transfer is Canada's dominant P2P/SMB payment method (analogous to Yappy in Panama). Integration would be through bank APIs or Interac's commercial platform.
- The `i18n.ts` foundation already supports `'es' | 'en'` locales. English support is architecturally ready. French (for Quebec) is a future addition.

**Strategic positioning:** Kitz serves LatAm entrepreneurs who also operate in the US/Canada. It is NOT a general-purpose US/Canadian SMB tool. The differentiator is seamless cross-border capability -- one workspace that handles Panama's DGI e-invoicing AND US sales tax AND Canadian GST, with payment acceptance across all three countries via Stripe + Yappy + local providers.

---

## 2. Payment Systems

### 2.1 Stripe (USA + Canada)

**What it is:**
Stripe is the dominant developer-first payment platform, processing hundreds of billions of dollars annually. It supports card payments, ACH transfers, wire transfers, and dozens of alternative payment methods. Stripe operates in both the US and Canada with full feature parity.

**Why Kitz needs it:**
Stripe is already in the `paymentTools.ts` provider enum. It is the single integration that covers both US and Canadian payment acceptance for Kitz workspaces. For North American operations, Stripe is the primary payment provider -- analogous to Yappy's role in Panama.

**Technical integration:**

| Aspect | Detail |
|---|---|
| API version | 2024-12-18.acacia (latest stable) |
| Node.js SDK | `stripe` (npm) -- official, well-maintained |
| Authentication | Secret key (`sk_live_xxx`) + publishable key (`pk_live_xxx`) |
| Webhook signing | `whsec_xxx` -- verify all webhooks with signature |
| Payment methods | Cards (Visa, MC, Amex, Discover), ACH, wire, Apple Pay, Google Pay, Link |
| Connect | Stripe Connect for marketplace/platform model (Kitz manages sub-accounts) |
| Tax | Stripe Tax for automatic tax calculation (alternative to TaxJar/Avalara) |
| Invoicing | Stripe Invoicing for hosted invoices (alternative to Kitz-native invoices) |
| Sandbox | Test mode with `sk_test_xxx` keys |

**Integration pattern for Kitz:**

```
1. Kitz workspace owner connects Stripe account (OAuth or API keys)
2. Kitz creates PaymentIntent via Stripe API for invoice amount
3. Customer receives payment link (via WhatsApp, email, or storefront)
4. Customer pays on Stripe-hosted checkout or embedded form
5. Stripe sends webhook to Kitz callback URL
6. Kitz calls payments_processWebhook(provider: 'stripe', ...)
7. Invoice status -> 'paid', CRM contact updated, receipt sent
```

**Key SDK configuration:**

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

// Create a PaymentIntent for an invoice
async function createPaymentForInvoice(
  invoiceId: string,
  amountCents: number,
  currency: 'usd' | 'cad',
  customerEmail: string
): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.create({
    amount: amountCents, // Stripe uses cents
    currency,
    receipt_email: customerEmail,
    metadata: {
      kitz_invoice_id: invoiceId,
      source: 'kitz_workspace',
    },
    automatic_payment_methods: { enabled: true },
  });
}

// Verify webhook signature
function verifyWebhook(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
}
```

**Stripe Connect for multi-workspace:**

Kitz operates as a platform -- each workspace owner has their own Stripe account. Stripe Connect enables this:

```typescript
// Option A: Standard Connect (recommended for Kitz)
// Workspace owner has their own Stripe account; Kitz redirects to it
async function createConnectAccountLink(workspaceId: string): Promise<string> {
  const account = await stripe.accounts.create({
    type: 'standard', // Owner manages their own Stripe dashboard
    metadata: { kitz_workspace_id: workspaceId },
  });

  const link = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `https://kitz.app/workspace/${workspaceId}/settings/stripe?refresh=1`,
    return_url: `https://kitz.app/workspace/${workspaceId}/settings/stripe?connected=1`,
    type: 'account_onboarding',
  });

  return link.url;
}

// Create payment on behalf of connected account
async function createConnectedPayment(
  connectedAccountId: string,
  amountCents: number,
  currency: 'usd' | 'cad',
  applicationFeeCents: number // Kitz platform fee
): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.create({
    amount: amountCents,
    currency,
    application_fee_amount: applicationFeeCents,
    transfer_data: { destination: connectedAccountId },
    automatic_payment_methods: { enabled: true },
  });
}
```

**Implementation timeline:** Q3 2026 -- after core LatAm markets are stable.

---

### 2.2 Square (Block) -- USA + Canada

**What it is:**
Square (now part of Block, Inc.) is the dominant SMB POS and payments ecosystem. It provides hardware (terminals, registers), software (POS, invoicing, payroll), and a complete payments API. Square has deep penetration in the US SMB market, particularly in food service, retail, and personal services.

**Why Kitz might need it:**
Many US Latino-owned businesses already use Square for in-person payments. Kitz could integrate with Square's API to pull transaction data into the Kitz workspace rather than replacing Square. This is a "meet them where they are" strategy.

**Technical integration:**

| Aspect | Detail |
|---|---|
| API | RESTful, well-documented |
| Node.js SDK | `square` (npm) -- official |
| Authentication | OAuth 2.0 (for third-party apps) or personal access token |
| Key capabilities | Payments, Orders, Invoices, Catalog, Customers, Inventory |
| Sandbox | Full sandbox environment |
| Webhook events | `payment.completed`, `invoice.payment_made`, `order.updated` |

**Integration pattern for Kitz:**

```
1. Kitz workspace owner connects Square account (OAuth)
2. Kitz subscribes to Square webhooks (payment.completed, etc.)
3. When customer pays at Square POS or via Square Invoice:
   -> Square sends webhook to Kitz
   -> Kitz calls payments_processWebhook(provider: 'square', ...)
   -> Kitz CRM and revenue dashboard updated
4. Kitz can also pull historical Square transactions for reconciliation
```

**Provider enum extension needed:**

```typescript
// Current: paymentTools.ts line 28
provider: { type: 'string', enum: ['stripe', 'paypal', 'yappy', 'bac'] }

// Extended for North America:
provider: {
  type: 'string',
  enum: ['stripe', 'paypal', 'yappy', 'bac', 'square', 'interac'],
  description: 'Payment provider'
}
```

**Implementation timeline:** Future -- only if US market traction justifies it.

---

### 2.3 PayPal / Venmo -- USA

**What it is:**
PayPal is the legacy digital wallet (400M+ accounts globally). Venmo (owned by PayPal) is the dominant peer-to-peer payment app among younger US consumers. PayPal Business enables merchant payment acceptance with invoicing, checkout buttons, and a business debit card.

**Why Kitz needs it:**
PayPal is already in the `paymentTools.ts` provider enum. Many LatAm entrepreneurs in the US receive payments via PayPal because it handles currency conversion and is trusted internationally. Venmo is increasingly used for SMB payments (Venmo for Business).

**Current Kitz status:** PayPal is listed in the provider enum but no deep integration exists yet. For North America, PayPal should be the second provider after Stripe.

**Implementation timeline:** Q4 2026 -- after Stripe Connect is operational.

---

### 2.4 Zelle -- USA

**What it is:**
Zelle is a bank-to-bank instant transfer network used by 8,000+ US financial institutions. It is embedded directly in banking apps (Chase, Bank of America, Wells Fargo, etc.) and enables instant P2P transfers with just an email or phone number.

**Why Kitz should monitor it:**
Zelle is the closest US equivalent to Yappy in terms of ubiquity for P2P payments. However, Zelle has NO merchant API -- it is purely consumer-to-consumer / consumer-to-small-business. There is no way to programmatically initiate or verify Zelle payments. Many US SMBs receive Zelle payments and manually reconcile them.

**Kitz approach:** Manual reconciliation only. Kitz could allow workspace owners to mark invoices as "Paid via Zelle" with a reference, but there is no automated webhook or API integration possible.

---

### 2.5 ACH (Automated Clearing House) -- USA

**What it is:**
ACH is the US interbank batch transfer system, operated by Nacha. It processes 30B+ transactions per year (~$80T in value). ACH handles direct deposits (payroll), bill payments, B2B transfers, and government payments.

**Technical details:**

| Aspect | Detail |
|---|---|
| Operator | Nacha (National Automated Clearing House Association) |
| Processing | Batch-based, same-day ACH available since 2016 |
| Same-day limit | $1M per transaction (raised from $100K in 2022) |
| Settlement | Same-day or next-day depending on submission window |
| Cost | $0.20-$1.50 per transaction (much cheaper than cards) |
| Access | Through banks or processors like Stripe, Dwolla, Plaid |

**Why Kitz needs it:**
ACH is critical for B2B payments in the US. When a Kitz workspace sends an invoice to a US business, that business often wants to pay via ACH (lower fees than card). Stripe supports ACH payments natively, so Kitz can offer ACH through Stripe without additional integration.

**ACH via Stripe for Kitz:**

```typescript
// ACH payment through Stripe (using Plaid for bank verification)
async function createACHPayment(
  customerId: string,
  bankAccountToken: string, // From Plaid Link
  amountCents: number
): Promise<Stripe.PaymentIntent> {
  // Attach bank account via Plaid token
  const paymentMethod = await stripe.paymentMethods.create({
    type: 'us_bank_account',
    us_bank_account: {
      financial_connections_account: bankAccountToken,
    },
  });

  return stripe.paymentIntents.create({
    amount: amountCents,
    currency: 'usd',
    payment_method: paymentMethod.id,
    payment_method_types: ['us_bank_account'],
    mandate_data: {
      customer_acceptance: {
        type: 'online',
        online: {
          ip_address: '0.0.0.0', // Customer's IP
          user_agent: 'Kitz/1.0',
        },
      },
    },
  });
}
```

---

### 2.6 FedNow -- USA

**What it is:**
FedNow is the Federal Reserve's instant payment system, launched in July 2023. It enables real-time, 24/7/365 bank-to-bank transfers with immediate settlement. It is the US government's answer to real-time payment systems that exist in other countries (PIX in Brazil, UPI in India, SPEI in Mexico).

**Current status (2026):** Growing adoption but still limited compared to ACH. ~1,000 financial institutions connected (out of 10,000+). Not yet available through standard payment processors like Stripe.

**Kitz approach:** Monitor FedNow adoption. When Stripe or another processor offers FedNow as a payment method, Kitz can enable it. No direct integration needed.

---

### 2.7 RTP (Real-Time Payments) -- USA

**What it is:**
RTP is The Clearing House's real-time payment network, launched in 2017 (before FedNow). It provides instant, irrevocable payments 24/7/365. Primarily used by larger banks and for B2B payments.

**Kitz approach:** Same as FedNow -- monitor and enable through Stripe when available. Not a direct integration priority.

---

### 2.8 Interac e-Transfer -- Canada

**What it is:**
Interac e-Transfer is Canada's dominant peer-to-peer and small business payment system. It is ubiquitous -- virtually every Canadian with a bank account can send and receive Interac e-Transfers. It is the Canadian equivalent of Yappy in Panama: the default way people pay small businesses.

**Key statistics:**
- 1B+ transactions per year
- Available through all major Canadian banks
- Instant transfer (real-time with Autodeposit enabled)
- Limit: $3,000-$10,000 per transaction (varies by bank)
- Cost: Free for personal use at most banks; $0.50-$1.50 for business accounts

**Why Kitz needs it:**
For Canadian workspaces, Interac e-Transfer is the most natural payment method. Customers expect to be able to pay via e-Transfer. This is analogous to Yappy in Panama -- the primary local payment method.

**Technical integration challenges:**
Interac does not offer a public developer API for third-party apps to initiate or verify e-Transfers. Integration options:

| Option | Feasibility | Description |
|---|---|---|
| **Interac for Business API** | Medium | Interac offers commercial APIs for larger merchants; requires partnership |
| **Bank API passthrough** | Medium | Some banks (RBC, TD) offer APIs that expose e-Transfer functionality |
| **Payment request via Interac** | High | Generate Interac Request Money links that customers can pay |
| **Manual reconciliation** | High (MVP) | Customer pays via e-Transfer; workspace owner marks invoice as paid |
| **Open Banking (future)** | High (2027+) | Canada's Consumer-Driven Banking framework (in development) will standardize bank APIs |

**Interac Request Money flow for Kitz:**

```
1. Kitz generates invoice for Canadian customer
2. Kitz creates Interac Request Money link (via bank API or manual)
3. Customer receives request via email/SMS
4. Customer approves payment in their banking app
5. Funds transfer instantly via Interac
6. Kitz receives confirmation (webhook from bank or manual marking)
7. Invoice status -> 'paid'
```

**Interac integration TypeScript sketch:**

```typescript
interface InteracPaymentRequest {
  recipientEmail: string;
  recipientName: string;
  amount: number; // CAD
  currency: 'CAD';
  message: string; // e.g., "Invoice #001-000001234 - Kitz Workspace"
  expiryDays: number; // Request expires after N days
  invoiceId: string; // Kitz internal reference
}

interface InteracConfig {
  bankProvider: 'rbc' | 'td' | 'bmo' | 'scotiabank' | 'cibc';
  businessAccountId: string;
  apiKey: string;
  autodeposit: boolean; // Auto-accept incoming payments
  securityAnswer?: string; // Required if autodeposit is off
}

// Generate an Interac Request Money (conceptual -- actual API varies by bank)
async function createInteracRequest(
  config: InteracConfig,
  request: InteracPaymentRequest
): Promise<{ requestId: string; requestUrl: string }> {
  // This would call the bank's specific API
  // Each bank has a different implementation
  const response = await fetch(`https://api.${config.bankProvider}.com/interac/request`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to_email: request.recipientEmail,
      amount: request.amount,
      currency: request.currency,
      message: request.message,
      expiry_days: request.expiryDays,
      reference: request.invoiceId,
    }),
  });

  return response.json();
}

// Webhook handler for Interac payment completion
async function handleInteracWebhook(payload: {
  requestId: string;
  status: 'completed' | 'declined' | 'expired';
  amount: number;
  senderName: string;
  senderEmail: string;
  timestamp: string;
}): Promise<void> {
  if (payload.status === 'completed') {
    // Map to Kitz payment processing
    await processWebhook({
      provider: 'interac',
      provider_transaction_id: payload.requestId,
      amount: payload.amount,
      currency: 'CAD',
      status: 'completed',
      buyer_name: payload.senderName,
      buyer_email: payload.senderEmail,
      metadata: payload,
    });
  }
}
```

**Implementation timeline:** Q4 2026 / Future -- when Canadian market launches.

---

### 2.9 Moneris -- Canada

**What it is:**
Moneris is Canada's largest payment processor, a joint venture between RBC and BMO. It processes over 3B transactions annually and is the dominant card processing platform for Canadian merchants. It provides POS terminals, e-commerce payment gateways, and merchant services.

**Why Kitz should consider it:**
Many Canadian SMBs already use Moneris for card acceptance. Like Square in the US, Kitz could integrate with Moneris to pull transaction data rather than replace it.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Gateway | Moneris Gateway (eSELECTplus) |
| API | RESTful + legacy HTTPS POST |
| Hosted page | Moneris Hosted Tokenization for PCI compliance |
| SDK | PHP (official), third-party Node.js wrappers |
| Tokenization | Vault for card-on-file |

**Implementation timeline:** Future -- only if Canadian market demands it.

---

### 2.10 Shopify Payments -- Canada

**What it is:**
Shopify is a Canadian company (Ottawa) and Shopify Payments is its integrated payment processor (powered by Stripe). Many Canadian SMBs use Shopify for e-commerce, making Shopify Payments their default processor.

**Why Kitz should consider it:**
Kitz could integrate with the Shopify Admin API to sync orders, products, and payments from Shopify stores into a Kitz workspace. This would let Canadian entrepreneurs who already have a Shopify store use Kitz for CRM, AI content, and WhatsApp communication while keeping Shopify for e-commerce.

**Implementation timeline:** Future -- partnership/integration play.

---

### 2.11 Additional Payment Infrastructure

| System | Country | Description | Kitz Relevance |
|---|---|---|---|
| **Apple Pay** | US + CA | NFC contactless via iPhone/Apple Watch | Supported through Stripe -- no additional integration |
| **Google Pay** | US + CA | NFC contactless via Android | Supported through Stripe -- no additional integration |
| **Plaid** | US + CA | Bank account linking and verification | Needed for ACH payments; Stripe integrates Plaid |
| **Marqeta** | US | Card issuing platform | Future -- if Kitz ever issues branded cards |
| **Adyen** | US + CA | Enterprise payments | Not relevant for SMB market |
| **Clover** | US | SMB POS (owned by Fiserv) | Similar to Square -- data sync opportunity |
| **Toast** | US | Restaurant POS/payments | Niche -- restaurant-specific |
| **Lightspeed** | Canada | POS/payments for retail and restaurants | Canadian alternative to Square |

---

## 3. Banking & Interbank Infrastructure

### 3.1 USA Banking Landscape

The US has over 4,000 banks and 5,000 credit unions. For Kitz's SMB market, the relevant banks fall into two categories: traditional large banks (where most SMBs have their primary account) and fintech/neobanks (where tech-savvy SMBs are migrating).

**Traditional banks (largest by assets):**

| Bank | Assets | SMB Relevance | Key Products |
|---|---|---|---|
| **JPMorgan Chase** | $3.9T | Largest US bank, massive SMB portfolio | Chase Business Complete, merchant services, QuickAccept |
| **Bank of America** | $3.2T | Strong SMB lending, Business Advantage | Merchant services, business credit cards, cash management |
| **Wells Fargo** | $1.9T | Deep SMB penetration, extensive branch network | Business checking, SBA loans, merchant services |
| **Citibank** | $1.7T | International focus (good for cross-border) | Global payments, trade finance, multi-currency |
| **US Bank** | $680B | Strong in Midwest/West, good SMB products | Business banking, merchant services |
| **Capital One** | $480B | Growing SMB focus, Spark Business cards | Business credit cards, business checking |

**Fintech/neobanks (tech-first, Kitz-relevant):**

| Bank/Fintech | Description | Why It Matters for Kitz |
|---|---|---|
| **Mercury** | Startup and SMB banking (FDIC-insured via Choice/Evolve) | API-first, popular with tech SMBs, potential integration partner |
| **Relay** | SMB banking with profit-first methodology | Growing among freelancers and micro businesses |
| **Brex** | Corporate cards and spend management | Popular with startups; not directly relevant for micro SMBs |
| **Novo** | Free business banking for freelancers and SMBs | Target overlap with Kitz audience |
| **Bluevine** | Business checking and credit line | Strong in SMB segment |
| **Lili** | Banking for freelancers with tax tools | Tax-integrated banking -- interesting model for Kitz |

**Kitz approach to US banking:** Unlike Panama (where Banco General/Yappy is a direct integration), US banking is fragmented. Kitz should use Plaid for bank account linking and Stripe for payment processing, avoiding direct bank integrations.

---

### 3.2 Canada Banking Landscape

Canada has a highly concentrated banking system dominated by the "Big Five," plus a large credit union sector.

**Big Five banks:**

| Bank | Assets (CAD) | SMB Relevance | Key Products |
|---|---|---|---|
| **RBC (Royal Bank of Canada)** | $2.0T | Largest Canadian bank, strong SMB services | RBC Business, Moneris (JV), business credit cards |
| **TD (Toronto-Dominion)** | $1.9T | Extensive US + Canada presence | TD Business, merchant services, cross-border banking |
| **Scotiabank** | $1.4T | Strong LatAm presence (Pacific Alliance) | International business banking, trade finance |
| **BMO (Bank of Montreal)** | $1.3T | US + Canada dual presence (owns BMO Harris) | BMO Business, Moneris (JV), business credit cards |
| **CIBC** | $1.0T | Growing SMB digital services | CIBC Business, Smart Business solutions |

**Other significant institutions:**

| Institution | Description | Kitz Relevance |
|---|---|---|
| **National Bank of Canada** | 6th largest, Quebec-focused | Important for Quebec market |
| **Desjardins** | Largest credit union federation in North America (Quebec) | Massive Quebec presence, SMB services |
| **EQ Bank** | Digital-first bank, high-interest savings | Growing with tech-savvy SMBs |
| **Tangerine** | Digital bank (Scotiabank subsidiary) | Consumer-focused |
| **Simplii** | Digital bank (CIBC subsidiary) | Consumer-focused |

**Scotiabank LatAm connection:**
Scotiabank has significant operations in Chile, Peru, Colombia, and Mexico through its Pacific Alliance strategy. This creates a natural cross-border banking corridor that aligns with Kitz's LatAm-first strategy. A Kitz user with a Scotiabank account in Canada and Scotiabank Chile/Colombia could potentially benefit from simplified cross-border transfers.

**Bank of Canada:**
Canada's central bank. Sets monetary policy, manages CAD. Relevant for Kitz only in terms of exchange rate policy (floating CAD/USD rate) and potential future digital currency (the Bank of Canada has explored but not committed to a CBDC).

---

### 3.3 Cross-Border Banking Infrastructure

**SWIFT / Wire transfers:**
Both US and Canadian banks use SWIFT for international wire transfers. Kitz workspaces doing cross-border invoicing will need to display SWIFT/BIC codes and IBAN-equivalent information on invoices.

**Wise (TransferWise):**
Many SMBs use Wise for cross-border payments (lower fees than bank wires). Wise offers a business API that Kitz could integrate for cross-border payment initiation.

**Cross-border payment flow (US/Canada to LatAm):**

```
  US/Canadian Customer                    Kitz Workspace (Panama/LatAm)
         |                                          |
         |  Receives invoice from Kitz workspace    |
         |  with payment options:                   |
         |  - Stripe (card or ACH)                  |
         |  - PayPal                                |
         |  - Wire transfer (SWIFT details shown)   |
         |  - Wise (if integrated)                  |
         |                                          |
         v                                          |
   +-------------+                                  |
   | Customer    |                                  |
   | pays via    |                                  |
   | Stripe/PayPal|                                 |
   +-------------+                                  |
         |                                          |
         | Payment in USD or CAD                    |
         |                                          |
         v                                          v
   +------------------+                    +------------------+
   | Stripe / PayPal  |  -->  webhook -->  | Kitz webhook     |
   | processes in     |                    | receiver         |
   | customer's       |                    | (paymentTools.ts)|
   | currency         |                    +------------------+
   +------------------+                             |
                                                    v
                                           +------------------+
                                           | Kitz records     |
                                           | payment:         |
                                           | - Original: USD  |
                                           | - Converted: PAB |
                                           | - FX rate stored |
                                           | - Invoice -> paid|
                                           +------------------+
```

---

## 4. Government & Regulatory Bodies

### 4.1 IRS (Internal Revenue Service) -- USA

**What it is:**
The IRS is the US federal tax authority. It administers income tax, employment tax, excise tax, and issues tax identification numbers (EIN, ITIN). The IRS does NOT administer sales tax -- that is handled at the state level.

**Why Kitz needs it:**
Kitz workspaces for US-based businesses need to capture and validate the business's EIN (Employer Identification Number), handle 1099 reporting for contractor payments, and help with W-9 collection from vendors.

**Key IRS systems:**

| System | Purpose | Kitz Impact |
|---|---|---|
| EIN | Federal tax ID for businesses (9 digits: XX-XXXXXXX) | Required for workspace onboarding |
| SSN | Social Security Number (individuals) | Never store in Kitz -- too sensitive |
| ITIN | Individual Taxpayer Identification Number (non-residents) | Used by immigrant entrepreneurs without SSN |
| 1099-NEC | Report contractor payments >$600/year | Kitz could generate 1099 data for contractors paid through the platform |
| W-9 | Request for Taxpayer Identification Number | Kitz could facilitate W-9 collection from workspace's vendors |
| IRS e-file | Electronic tax filing | Future -- tax filing integration |

**EIN validation:**

```typescript
/**
 * Validate a US Employer Identification Number (EIN).
 *
 * EIN format: XX-XXXXXXX (9 digits total, hyphen after first 2)
 * The first two digits (prefix) indicate the IRS campus that issued the EIN.
 *
 * Valid prefixes (as of 2026):
 * 01-06, 10-16, 20-27, 30-39, 40-48, 50-68, 71-77, 80-88, 90-99
 * Note: Prefix 00 is invalid. Some prefixes are reserved for specific purposes.
 *
 * This validates FORMAT only -- not whether the EIN is actually issued.
 * For true validation, use IRS TIN matching service (requires enrollment).
 */
interface EINValidationResult {
  valid: boolean;
  formatted: string; // XX-XXXXXXX format
  prefix: string;
  campus: string;
  error?: string;
}

const EIN_CAMPUS_MAP: Record<string, string> = {
  '01': 'Andover', '02': 'Andover', '03': 'Andover', '04': 'Andover',
  '05': 'Andover', '06': 'Andover',
  '10': 'Atlanta', '11': 'Atlanta', '12': 'Atlanta', '13': 'Atlanta',
  '14': 'Atlanta', '15': 'Atlanta', '16': 'Atlanta',
  '20': 'Austin', '21': 'Austin', '22': 'Austin', '23': 'Austin',
  '24': 'Austin', '25': 'Austin', '26': 'Austin', '27': 'Austin',
  '30': 'Brookhaven', '31': 'Brookhaven', '32': 'Brookhaven',
  '33': 'Brookhaven', '34': 'Brookhaven', '35': 'Brookhaven',
  '36': 'Brookhaven', '37': 'Brookhaven', '38': 'Brookhaven', '39': 'Brookhaven',
  '40': 'Cincinnati', '41': 'Cincinnati', '42': 'Cincinnati', '43': 'Cincinnati',
  '44': 'Cincinnati', '45': 'Cincinnati', '46': 'Cincinnati', '47': 'Cincinnati',
  '48': 'Cincinnati',
  '50': 'Fresno', '51': 'Fresno', '52': 'Fresno', '53': 'Fresno',
  '54': 'Fresno', '55': 'Fresno', '56': 'Fresno', '57': 'Fresno',
  '58': 'Fresno', '59': 'Fresno',
  '60': 'Kansas City', '61': 'Kansas City', '62': 'Kansas City',
  '63': 'Kansas City', '64': 'Kansas City', '65': 'Kansas City',
  '66': 'Kansas City', '67': 'Kansas City', '68': 'Kansas City',
  '71': 'Memphis', '72': 'Memphis', '73': 'Memphis',
  '74': 'Memphis', '75': 'Memphis', '76': 'Memphis', '77': 'Memphis',
  '80': 'Ogden', '81': 'Ogden', '82': 'Ogden', '83': 'Ogden',
  '84': 'Ogden', '85': 'Ogden', '86': 'Ogden', '87': 'Ogden', '88': 'Ogden',
  '90': 'Philadelphia', '91': 'Philadelphia', '92': 'Philadelphia',
  '93': 'Philadelphia', '94': 'Philadelphia', '95': 'Philadelphia',
  '96': 'Philadelphia', '97': 'Philadelphia', '98': 'Philadelphia', '99': 'Philadelphia',
};

function validateEIN(ein: string): EINValidationResult {
  // Strip all non-digits
  const digits = ein.replace(/\D/g, '');

  // Must be exactly 9 digits
  if (digits.length !== 9) {
    return {
      valid: false,
      formatted: ein,
      prefix: '',
      campus: '',
      error: `EIN must be 9 digits. Got ${digits.length}.`,
    };
  }

  const prefix = digits.substring(0, 2);
  const formatted = `${prefix}-${digits.substring(2)}`;

  // Check for invalid prefix 00
  if (prefix === '00') {
    return {
      valid: false,
      formatted,
      prefix,
      campus: '',
      error: 'EIN prefix 00 is invalid.',
    };
  }

  // Check if prefix is in known campus map
  const campus = EIN_CAMPUS_MAP[prefix];
  if (!campus) {
    return {
      valid: false,
      formatted,
      prefix,
      campus: '',
      error: `EIN prefix ${prefix} is not a recognized IRS campus prefix.`,
    };
  }

  return { valid: true, formatted, prefix, campus };
}

// Usage examples:
// validateEIN('12-3456789')  -> { valid: true, formatted: '12-3456789', prefix: '12', campus: 'Atlanta' }
// validateEIN('123456789')   -> { valid: true, formatted: '12-3456789', prefix: '12', campus: 'Atlanta' }
// validateEIN('00-1234567')  -> { valid: false, error: 'EIN prefix 00 is invalid.' }
// validateEIN('99-1234567')  -> { valid: true, formatted: '99-1234567', prefix: '99', campus: 'Philadelphia' }
```

---

### 4.2 US Sales Tax -- The Complexity Monster

**Why this section is critical:**
US sales tax is the single most complex aspect of operating a business in the United States. Unlike Panama's clean 7% ITBMS or Canada's structured GST/HST system, the US has NO federal sales tax. Instead, sales tax is imposed by states, counties, cities, and special districts -- creating over 13,000 distinct tax jurisdictions with different rates, rules, and exemptions.

**The Wayfair decision (South Dakota v. Wayfair, Inc., 2018):**
This Supreme Court ruling established that states can require online sellers to collect sales tax even if the seller has no physical presence in the state. This means a Kitz workspace owner in Miami selling to a customer in California must collect California sales tax (if they exceed California's economic nexus threshold).

**Nexus rules (when you must collect sales tax):**

| Nexus Type | Description | Example |
|---|---|---|
| **Physical nexus** | You have employees, offices, warehouse, or inventory in the state | A Kitz workspace owner has a storefront in Texas -- must collect Texas sales tax |
| **Economic nexus** | You exceed the state's revenue or transaction threshold | Most states: $100,000 in sales OR 200 transactions in the state |
| **Click-through nexus** | You have affiliate/referral agreements in the state | Less relevant for typical Kitz SMBs |
| **Marketplace nexus** | You sell through a marketplace (Amazon, Etsy) | The marketplace usually handles tax; not directly Kitz's concern |

**States with NO sales tax:**

| State | Notes |
|---|---|
| Oregon | No sales tax at all |
| Montana | No general sales tax (some resort taxes) |
| Delaware | No sales tax (but has gross receipts tax) |
| New Hampshire | No sales tax |
| Alaska | No state sales tax, but local jurisdictions can impose up to ~7.5% |

**Sales tax rate ranges (2026):**

| State | State Rate | Max Combined Rate (state + local) | Notes |
|---|---|---|---|
| California | 7.25% | ~10.25% | Highest base state rate |
| Tennessee | 7.00% | ~9.75% | High combined rates |
| Louisiana | 4.45% | ~11.45% | Very high combined rates |
| New York | 4.00% | ~8.875% | NYC has highest local add-on |
| Texas | 6.25% | ~8.25% | Large economy, significant for Kitz |
| Florida | 6.00% | ~8.50% | Major Latino market |
| New Jersey | 6.625% | ~6.625% | No local additions |
| Colorado | 2.90% | ~11.20% | Extremely high local variation |

**Sales tax nexus determination logic for Kitz:**

```typescript
/**
 * Sales tax nexus determination for a Kitz workspace.
 *
 * A workspace has nexus in a state if:
 * 1. Physical presence (office, employees, inventory) in that state, OR
 * 2. Economic nexus: exceeded the state's revenue/transaction threshold
 *
 * Kitz should track per-workspace:
 * - Physical locations (user-declared)
 * - Revenue by state (calculated from invoices)
 * - Transaction count by state (calculated from invoices)
 */

interface StateNexusThreshold {
  state: string;
  stateCode: string;
  hasSalesTax: boolean;
  revenueThreshold: number | null; // USD -- null means no economic nexus law
  transactionThreshold: number | null; // Number of transactions -- null means no threshold
  effectiveDate: string; // When the state's economic nexus law took effect
}

// Simplified nexus thresholds (most common pattern is $100K / 200 transactions)
const STATE_NEXUS_THRESHOLDS: StateNexusThreshold[] = [
  { state: 'Alabama', stateCode: 'AL', hasSalesTax: true, revenueThreshold: 250000, transactionThreshold: null, effectiveDate: '2018-10-01' },
  { state: 'Alaska', stateCode: 'AK', hasSalesTax: false, revenueThreshold: null, transactionThreshold: null, effectiveDate: 'N/A' },
  { state: 'Arizona', stateCode: 'AZ', hasSalesTax: true, revenueThreshold: 100000, transactionThreshold: null, effectiveDate: '2019-10-01' },
  { state: 'Arkansas', stateCode: 'AR', hasSalesTax: true, revenueThreshold: 100000, transactionThreshold: 200, effectiveDate: '2019-07-01' },
  { state: 'California', stateCode: 'CA', hasSalesTax: true, revenueThreshold: 500000, transactionThreshold: null, effectiveDate: '2019-04-01' },
  { state: 'Colorado', stateCode: 'CO', hasSalesTax: true, revenueThreshold: 100000, transactionThreshold: null, effectiveDate: '2019-06-01' },
  { state: 'Connecticut', stateCode: 'CT', hasSalesTax: true, revenueThreshold: 100000, transactionThreshold: 200, effectiveDate: '2018-12-01' },
  { state: 'Delaware', stateCode: 'DE', hasSalesTax: false, revenueThreshold: null, transactionThreshold: null, effectiveDate: 'N/A' },
  { state: 'Florida', stateCode: 'FL', hasSalesTax: true, revenueThreshold: 100000, transactionThreshold: null, effectiveDate: '2021-07-01' },
  { state: 'Georgia', stateCode: 'GA', hasSalesTax: true, revenueThreshold: 100000, transactionThreshold: 200, effectiveDate: '2019-01-01' },
  // ... (all 50 states + DC -- abbreviated here, full table in implementation)
  { state: 'Montana', stateCode: 'MT', hasSalesTax: false, revenueThreshold: null, transactionThreshold: null, effectiveDate: 'N/A' },
  { state: 'New Hampshire', stateCode: 'NH', hasSalesTax: false, revenueThreshold: null, transactionThreshold: null, effectiveDate: 'N/A' },
  { state: 'New York', stateCode: 'NY', hasSalesTax: true, revenueThreshold: 500000, transactionThreshold: 100, effectiveDate: '2019-06-01' },
  { state: 'Oregon', stateCode: 'OR', hasSalesTax: false, revenueThreshold: null, transactionThreshold: null, effectiveDate: 'N/A' },
  { state: 'Texas', stateCode: 'TX', hasSalesTax: true, revenueThreshold: 500000, transactionThreshold: null, effectiveDate: '2019-10-01' },
];

interface NexusDetermination {
  state: string;
  stateCode: string;
  hasNexus: boolean;
  nexusType: 'physical' | 'economic' | 'none';
  reason: string;
  mustCollectSalesTax: boolean;
}

function determineNexus(
  stateCode: string,
  hasPhysicalPresence: boolean,
  revenueInState: number,
  transactionsInState: number
): NexusDetermination {
  const threshold = STATE_NEXUS_THRESHOLDS.find(t => t.stateCode === stateCode);

  if (!threshold) {
    return {
      state: 'Unknown',
      stateCode,
      hasNexus: false,
      nexusType: 'none',
      reason: `State code ${stateCode} not found in nexus table.`,
      mustCollectSalesTax: false,
    };
  }

  // No sales tax in this state
  if (!threshold.hasSalesTax) {
    return {
      state: threshold.state,
      stateCode,
      hasNexus: false,
      nexusType: 'none',
      reason: `${threshold.state} does not impose a general sales tax.`,
      mustCollectSalesTax: false,
    };
  }

  // Physical nexus always triggers obligation
  if (hasPhysicalPresence) {
    return {
      state: threshold.state,
      stateCode,
      hasNexus: true,
      nexusType: 'physical',
      reason: `Physical presence in ${threshold.state}.`,
      mustCollectSalesTax: true,
    };
  }

  // Economic nexus check
  const exceedsRevenue = threshold.revenueThreshold !== null
    && revenueInState >= threshold.revenueThreshold;
  const exceedsTransactions = threshold.transactionThreshold !== null
    && transactionsInState >= threshold.transactionThreshold;

  if (exceedsRevenue || exceedsTransactions) {
    const reasons: string[] = [];
    if (exceedsRevenue) {
      reasons.push(
        `Revenue $${revenueInState.toLocaleString()} >= threshold $${threshold.revenueThreshold!.toLocaleString()}`
      );
    }
    if (exceedsTransactions) {
      reasons.push(
        `Transactions ${transactionsInState} >= threshold ${threshold.transactionThreshold}`
      );
    }
    return {
      state: threshold.state,
      stateCode,
      hasNexus: true,
      nexusType: 'economic',
      reason: `Economic nexus in ${threshold.state}: ${reasons.join('; ')}.`,
      mustCollectSalesTax: true,
    };
  }

  return {
    state: threshold.state,
    stateCode,
    hasNexus: false,
    nexusType: 'none',
    reason: `No nexus in ${threshold.state}. Revenue $${revenueInState.toLocaleString()} < threshold $${(threshold.revenueThreshold ?? 0).toLocaleString()}.`,
    mustCollectSalesTax: false,
  };
}
```

**CRITICAL RECOMMENDATION: Do NOT build sales tax calculation in-house.**

Sales tax rates change constantly (hundreds of changes per year across US jurisdictions). Product taxability rules are insanely complex (e.g., a candy bar is taxable in New York but a Twix is not because it contains flour). Audit liability falls on the seller.

**Kitz must integrate a tax calculation service:**

| Service | Pricing | Integration | Pros | Cons |
|---|---|---|---|---|
| **TaxJar** | From $19/mo | REST API, Stripe integration | SMB-friendly pricing, good API | Acquired by Stripe (may sunset standalone) |
| **Avalara (AvaTax)** | From $50/mo | REST API, wide ecosystem | Industry standard, most accurate | More expensive, enterprise-oriented |
| **Vertex** | Enterprise | REST API | Largest tax engine | Way too expensive for SMBs |
| **Stripe Tax** | 0.5% of transaction | Built into Stripe | Zero additional integration | Only works with Stripe payments |
| **TaxCloud** | Free (for basic) | REST API | Free tier available | Less accurate than Avalara/TaxJar |

**Recommended approach for Kitz:**

```typescript
/**
 * US Sales Tax calculation via external service.
 *
 * Kitz should use Stripe Tax (if payment is through Stripe) or
 * TaxJar/Avalara for invoices paid through other methods.
 *
 * This is a thin wrapper -- the actual rate calculation is delegated
 * to the external service.
 */

interface TaxCalculationRequest {
  fromAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: 'US';
  };
  toAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: 'US';
  };
  lineItems: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    productTaxCode?: string; // e.g., '31000' for digital goods in TaxJar
    description: string;
  }>;
  shippingAmount?: number;
}

interface TaxCalculationResult {
  totalTax: number;
  taxableAmount: number;
  exemptAmount: number;
  rate: number; // Combined rate
  breakdown: {
    state: { rate: number; amount: number };
    county: { rate: number; amount: number };
    city: { rate: number; amount: number };
    special: { rate: number; amount: number };
  };
  lineItems: Array<{
    id: string;
    taxableAmount: number;
    taxAmount: number;
    rate: number;
  }>;
  jurisdiction: {
    state: string;
    county: string;
    city: string;
  };
}

// TaxJar integration example
async function calculateUSSalesTax(
  request: TaxCalculationRequest
): Promise<TaxCalculationResult> {
  const response = await fetch('https://api.taxjar.com/v2/taxes', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.TAXJAR_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from_country: 'US',
      from_zip: request.fromAddress.zip,
      from_state: request.fromAddress.state,
      from_city: request.fromAddress.city,
      from_street: request.fromAddress.street,
      to_country: 'US',
      to_zip: request.toAddress.zip,
      to_state: request.toAddress.state,
      to_city: request.toAddress.city,
      to_street: request.toAddress.street,
      shipping: request.shippingAmount || 0,
      line_items: request.lineItems.map(item => ({
        id: item.id,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        product_tax_code: item.productTaxCode,
      })),
    }),
  });

  const data = await response.json();
  // Transform TaxJar response to Kitz format
  return {
    totalTax: data.tax.amount_to_collect,
    taxableAmount: data.tax.taxable_amount,
    exemptAmount: data.tax.exempt_amount || 0,
    rate: data.tax.rate,
    breakdown: {
      state: { rate: data.tax.breakdown?.state_tax_rate || 0, amount: data.tax.breakdown?.state_tax_collectable || 0 },
      county: { rate: data.tax.breakdown?.county_tax_rate || 0, amount: data.tax.breakdown?.county_tax_collectable || 0 },
      city: { rate: data.tax.breakdown?.city_tax_rate || 0, amount: data.tax.breakdown?.city_tax_collectable || 0 },
      special: { rate: data.tax.breakdown?.special_tax_rate || 0, amount: data.tax.breakdown?.special_district_tax_collectable || 0 },
    },
    lineItems: (data.tax.breakdown?.line_items || []).map((li: any) => ({
      id: li.id,
      taxableAmount: li.taxable_amount,
      taxAmount: li.tax_collectable,
      rate: li.combined_tax_rate,
    })),
    jurisdiction: {
      state: data.tax.breakdown?.state || request.toAddress.state,
      county: data.tax.breakdown?.county || '',
      city: data.tax.breakdown?.city || request.toAddress.city,
    },
  };
}
```

---

### 4.3 US Business Entity Types

Understanding US entity types is important for Kitz workspace onboarding. The entity type determines tax treatment, liability, and filing requirements.

| Entity Type | Tax Treatment | Liability | Formation | Typical Kitz User |
|---|---|---|---|---|
| **Sole Proprietorship** | Pass-through (personal tax return) | Unlimited personal liability | No formal filing (just start operating) | Freelancers, solo consultants |
| **LLC (Limited Liability Company)** | Pass-through (default) or elect S-Corp/C-Corp treatment | Limited liability | File with state Secretary of State | Most common for small businesses |
| **S-Corporation** | Pass-through (avoids double taxation) | Limited liability | File with state + IRS S-election (Form 2553) | Growing SMBs wanting to save on self-employment tax |
| **C-Corporation** | Double taxation (corp tax + dividend tax) | Limited liability | File with state Secretary of State | Venture-backed startups, larger businesses |
| **Partnership** | Pass-through | General partners: unlimited; Limited partners: limited | Partnership agreement + state filing | Multi-owner businesses |

**State-level business registration:**
Every US state has its own Secretary of State (or equivalent) for business registration. There is no single federal registry. A business incorporated in Delaware (very common) that operates in California must also register as a "foreign entity" in California. This creates multi-state compliance complexity.

---

### 4.4 FinCEN BOI (Beneficial Ownership Information) -- USA

**What it is:**
The Corporate Transparency Act (CTA) requires most US companies (corporations, LLCs) to report their beneficial owners to FinCEN (Financial Crimes Enforcement Network). This became mandatory in 2024 for new entities and 2025 for existing entities.

**Impact on Kitz:**
Kitz could help workspace owners track and file their BOI reports. The reporting includes: each beneficial owner's name, date of birth, address, and a government-issued ID number.

**Implementation:** Future feature -- BOI filing reminder and data collection. Low priority for initial North American launch.

---

### 4.5 CRA (Canada Revenue Agency)

**What it is:**
The CRA is Canada's federal tax authority -- equivalent to the IRS. It administers income tax, GST/HST, payroll deductions, and issues Business Numbers (BN).

**Why Kitz needs it:**
Canadian workspaces need their BN validated, must calculate correct GST/HST/PST/QST on invoices, and need to file GST/HST returns (quarterly or annually).

**Key CRA systems:**

| System | Purpose | Kitz Impact |
|---|---|---|
| BN (Business Number) | 9-digit federal business identifier | Required for workspace onboarding |
| GST/HST Registration | Mandatory if revenue >$30,000 over 4 consecutive quarters | Determines if business must charge GST/HST |
| My Business Account | CRA online portal for businesses | Kitz could link to it for reminders |
| T4 / T4A | Employee / contractor income reporting | Future -- payroll integration |
| T2 | Corporate income tax return | Not Kitz's scope |

**Business Number (BN) validation:**

```typescript
/**
 * Validate a Canadian Business Number (BN).
 *
 * BN format: 9 digits (e.g., 123456789)
 * With program account: 123456789 RT 0001 (RT = GST/HST account)
 *
 * The BN uses the Luhn algorithm (mod 10) for check digit validation.
 */

interface BNValidationResult {
  valid: boolean;
  formatted: string; // 123456789 or 123456789RT0001
  baseNumber: string; // First 9 digits
  programType?: string; // RT (GST/HST), RP (Payroll), RC (Corporate Tax), RM (Import/Export)
  programAccount?: string; // 0001, 0002, etc.
  error?: string;
}

function validateBN(bn: string): BNValidationResult {
  // Strip whitespace and normalize
  const cleaned = bn.replace(/[\s-]/g, '').toUpperCase();

  // Extract base 9-digit number
  let baseNumber: string;
  let programType: string | undefined;
  let programAccount: string | undefined;

  // Full BN with program account: 123456789RT0001
  const fullMatch = cleaned.match(/^(\d{9})(RT|RP|RC|RM)(\d{4})$/);
  if (fullMatch) {
    baseNumber = fullMatch[1];
    programType = fullMatch[2];
    programAccount = fullMatch[3];
  } else {
    // Base BN only: 123456789
    const baseMatch = cleaned.match(/^(\d{9})$/);
    if (!baseMatch) {
      return {
        valid: false,
        formatted: bn,
        baseNumber: '',
        error: 'BN must be 9 digits, optionally followed by program type (RT/RP/RC/RM) and 4-digit account number.',
      };
    }
    baseNumber = baseMatch[1];
  }

  // Luhn check on the 9-digit base number
  if (!luhnCheck(baseNumber)) {
    return {
      valid: false,
      formatted: baseNumber,
      baseNumber,
      programType,
      programAccount,
      error: 'BN fails Luhn check digit validation.',
    };
  }

  const formatted = programType
    ? `${baseNumber} ${programType} ${programAccount}`
    : baseNumber;

  return {
    valid: true,
    formatted,
    baseNumber,
    programType,
    programAccount,
  };
}

function luhnCheck(number: string): boolean {
  let sum = 0;
  let isSecond = false;

  // Process digits from right to left
  for (let i = number.length - 1; i >= 0; i--) {
    let digit = parseInt(number[i], 10);

    if (isSecond) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    isSecond = !isSecond;
  }

  return sum % 10 === 0;
}

// Usage examples:
// validateBN('123456782')          -> { valid: true, formatted: '123456782', ... }
// validateBN('123456782RT0001')    -> { valid: true, programType: 'RT', ... }
// validateBN('123456789')          -> { valid: false, error: 'BN fails Luhn check...' }
// validateBN('12345')              -> { valid: false, error: 'BN must be 9 digits...' }
```

**Program type codes:**

| Code | Program | Kitz Relevance |
|---|---|---|
| RT | GST/HST | Primary -- every business charging GST/HST needs this |
| RP | Payroll deductions | Future -- if Kitz adds payroll |
| RC | Corporate income tax | Low -- outside Kitz scope |
| RM | Import/Export | Low -- niche use case |

---

### 4.6 Canadian Tax System (GST/HST/PST/QST)

**Overview:**
Canada's consumption tax system is simpler than the US (federal + provincial vs. 13,000+ jurisdictions), but it still has provincial variation. The key tax types:

| Tax | Full Name | Rate | Where |
|---|---|---|---|
| **GST** | Goods and Services Tax | 5% | Federal -- applies nationwide |
| **HST** | Harmonized Sales Tax | 13-15% | Provinces that combine GST + PST into one tax |
| **PST** | Provincial Sales Tax | 6-7% | BC, Saskatchewan, Manitoba (charged separately from GST) |
| **QST** | Quebec Sales Tax | 9.975% | Quebec only (charged separately from GST) |

**Tax by province (2026):**

| Province/Territory | GST | PST/QST | HST | Total Rate |
|---|---|---|---|---|
| Alberta | 5% | None | -- | **5%** |
| British Columbia | 5% | 7% PST | -- | **12%** |
| Manitoba | 5% | 7% RST | -- | **12%** |
| New Brunswick | -- | -- | 15% HST | **15%** |
| Newfoundland & Labrador | -- | -- | 15% HST | **15%** |
| Northwest Territories | 5% | None | -- | **5%** |
| Nova Scotia | -- | -- | 15% HST | **15%** |
| Nunavut | 5% | None | -- | **5%** |
| Ontario | -- | -- | 13% HST | **13%** |
| Prince Edward Island | -- | -- | 15% HST | **15%** |
| Quebec | 5% | 9.975% QST | -- | **14.975%** |
| Saskatchewan | 5% | 6% PST | -- | **11%** |
| Yukon | 5% | None | -- | **5%** |

**GST/HST calculation logic for Kitz:**

```typescript
/**
 * Canadian tax calculation for Kitz invoices.
 *
 * Unlike US sales tax (which requires an external service),
 * Canadian tax can be calculated in-house with a lookup table
 * because there are only 13 provinces/territories with well-defined rates.
 *
 * Key rule: GST/HST registration is mandatory when revenue exceeds
 * $30,000 over 4 consecutive calendar quarters ("small supplier threshold").
 * Below this threshold, the business is a "small supplier" and does not
 * need to charge GST/HST (but can voluntarily register).
 */

type CanadianProvince =
  | 'AB' | 'BC' | 'MB' | 'NB' | 'NL' | 'NT'
  | 'NS' | 'NU' | 'ON' | 'PE' | 'QC' | 'SK' | 'YT';

type CanadianTaxType = 'GST' | 'HST' | 'PST' | 'QST' | 'RST';

interface CanadianTaxRate {
  province: CanadianProvince;
  provinceName: string;
  taxComponents: Array<{
    type: CanadianTaxType;
    rate: number;
    name: string;
  }>;
  totalRate: number;
  isHarmonized: boolean; // HST provinces have a single combined tax
}

const CANADIAN_TAX_RATES: Record<CanadianProvince, CanadianTaxRate> = {
  AB: {
    province: 'AB', provinceName: 'Alberta',
    taxComponents: [{ type: 'GST', rate: 0.05, name: 'GST' }],
    totalRate: 0.05, isHarmonized: false,
  },
  BC: {
    province: 'BC', provinceName: 'British Columbia',
    taxComponents: [
      { type: 'GST', rate: 0.05, name: 'GST' },
      { type: 'PST', rate: 0.07, name: 'BC PST' },
    ],
    totalRate: 0.12, isHarmonized: false,
  },
  MB: {
    province: 'MB', provinceName: 'Manitoba',
    taxComponents: [
      { type: 'GST', rate: 0.05, name: 'GST' },
      { type: 'RST', rate: 0.07, name: 'Manitoba RST' },
    ],
    totalRate: 0.12, isHarmonized: false,
  },
  NB: {
    province: 'NB', provinceName: 'New Brunswick',
    taxComponents: [{ type: 'HST', rate: 0.15, name: 'HST' }],
    totalRate: 0.15, isHarmonized: true,
  },
  NL: {
    province: 'NL', provinceName: 'Newfoundland and Labrador',
    taxComponents: [{ type: 'HST', rate: 0.15, name: 'HST' }],
    totalRate: 0.15, isHarmonized: true,
  },
  NT: {
    province: 'NT', provinceName: 'Northwest Territories',
    taxComponents: [{ type: 'GST', rate: 0.05, name: 'GST' }],
    totalRate: 0.05, isHarmonized: false,
  },
  NS: {
    province: 'NS', provinceName: 'Nova Scotia',
    taxComponents: [{ type: 'HST', rate: 0.15, name: 'HST' }],
    totalRate: 0.15, isHarmonized: true,
  },
  NU: {
    province: 'NU', provinceName: 'Nunavut',
    taxComponents: [{ type: 'GST', rate: 0.05, name: 'GST' }],
    totalRate: 0.05, isHarmonized: false,
  },
  ON: {
    province: 'ON', provinceName: 'Ontario',
    taxComponents: [{ type: 'HST', rate: 0.13, name: 'HST' }],
    totalRate: 0.13, isHarmonized: true,
  },
  PE: {
    province: 'PE', provinceName: 'Prince Edward Island',
    taxComponents: [{ type: 'HST', rate: 0.15, name: 'HST' }],
    totalRate: 0.15, isHarmonized: true,
  },
  QC: {
    province: 'QC', provinceName: 'Quebec',
    taxComponents: [
      { type: 'GST', rate: 0.05, name: 'GST' },
      { type: 'QST', rate: 0.09975, name: 'QST' },
    ],
    totalRate: 0.14975, isHarmonized: false,
  },
  SK: {
    province: 'SK', provinceName: 'Saskatchewan',
    taxComponents: [
      { type: 'GST', rate: 0.05, name: 'GST' },
      { type: 'PST', rate: 0.06, name: 'Saskatchewan PST' },
    ],
    totalRate: 0.11, isHarmonized: false,
  },
  YT: {
    province: 'YT', provinceName: 'Yukon',
    taxComponents: [{ type: 'GST', rate: 0.05, name: 'GST' }],
    totalRate: 0.05, isHarmonized: false,
  },
};

interface CanadianTaxCalculation {
  province: CanadianProvince;
  provinceName: string;
  subtotal: number;
  taxLines: Array<{
    name: string;
    type: CanadianTaxType;
    rate: number;
    amount: number;
  }>;
  totalTax: number;
  grandTotal: number;
}

function calculateCanadianTax(
  province: CanadianProvince,
  subtotal: number
): CanadianTaxCalculation {
  const rates = CANADIAN_TAX_RATES[province];

  if (!rates) {
    throw new Error(`Unknown Canadian province: ${province}`);
  }

  const taxLines = rates.taxComponents.map(component => ({
    name: component.name,
    type: component.type,
    rate: component.rate,
    amount: Math.round(subtotal * component.rate * 100) / 100, // Round to cents
  }));

  // Special case for Quebec: QST is calculated on subtotal (not on subtotal + GST)
  // This was changed in 2013 -- QST is now calculated on the same base as GST
  // (Previously QST was calculated on subtotal + GST, creating a "tax on tax")

  const totalTax = taxLines.reduce((sum, line) => sum + line.amount, 0);
  const grandTotal = Math.round((subtotal + totalTax) * 100) / 100;

  return {
    province,
    provinceName: rates.provinceName,
    subtotal,
    taxLines,
    totalTax: Math.round(totalTax * 100) / 100,
    grandTotal,
  };
}

// Usage examples:
// calculateCanadianTax('ON', 100)
// -> { taxLines: [{ name: 'HST', rate: 0.13, amount: 13.00 }], totalTax: 13.00, grandTotal: 113.00 }
//
// calculateCanadianTax('QC', 100)
// -> { taxLines: [{ name: 'GST', rate: 0.05, amount: 5.00 }, { name: 'QST', rate: 0.09975, amount: 9.98 }],
//      totalTax: 14.98, grandTotal: 114.98 }
//
// calculateCanadianTax('BC', 100)
// -> { taxLines: [{ name: 'GST', rate: 0.05, amount: 5.00 }, { name: 'BC PST', rate: 0.07, amount: 7.00 }],
//      totalTax: 12.00, grandTotal: 112.00 }

/**
 * Determine if a Canadian business must register for GST/HST.
 * Rule: Mandatory if revenue exceeds $30,000 in any 4 consecutive calendar quarters.
 */
function mustRegisterGSTHST(
  quarterlyRevenue: [number, number, number, number] // Last 4 quarters
): { mustRegister: boolean; totalRevenue: number; threshold: number } {
  const total = quarterlyRevenue.reduce((sum, q) => sum + q, 0);
  return {
    mustRegister: total > 30000,
    totalRevenue: total,
    threshold: 30000,
  };
}
```

---

### 4.7 Privacy & Data Protection

**USA:**
- No single federal privacy law (unlike GDPR or PIPEDA)
- Patchwork of state laws:
  - **CCPA/CPRA (California):** Most stringent -- right to know, delete, opt out of sale of personal information
  - **VCDPA (Virginia):** Similar to CCPA
  - **CPA (Colorado):** Similar to CCPA
  - Growing number of states enacting similar laws
- **PCI-DSS:** Required for any entity handling card payment data -- Kitz delegates to Stripe (hosted checkout model)
- **SOC 2:** Expected by enterprise customers for SaaS companies handling financial data

**Canada:**
- **PIPEDA (Personal Information Protection and Electronic Documents Act):** Federal privacy law governing commercial activity. Requires consent for data collection, purpose limitation, and right to access/correct personal information.
- **Bill C-27 (proposed):** Comprehensive overhaul of Canadian digital privacy law, including the Consumer Privacy Protection Act (CPPA), the Personal Information and Data Protection Tribunal Act, and the Artificial Intelligence and Data Act (AIDA). Expected to become law by 2026-2027.
- **Quebec Law 25:** Quebec has its own privacy law (Act respecting the protection of personal information in the private sector), amended in 2021 to add GDPR-like provisions. Full force as of September 2024.

**Kitz compliance approach:**
- Store minimum required personal data
- Implement data deletion on workspace closure
- Provide data export capability (CCPA right to know / PIPEDA right to access)
- Never store raw card numbers (PCI-DSS via Stripe hosted checkout)
- Cookie consent for web-facing storefront features
- Privacy policy that covers US state laws, PIPEDA, and Quebec Law 25

---

### 4.8 US/Canada Compliance Comparison to Panama

| Aspect | Panama | USA | Canada |
|---|---|---|---|
| **Tax ID** | RUC (varies by entity type) | EIN (9-digit: XX-XXXXXXX) | BN (9-digit, Luhn validated) |
| **Sales Tax** | ITBMS (7% standard, national) | 0-11%+ (state + local, 13K+ jurisdictions) | GST 5% + provincial 0-9.975% |
| **E-Invoicing** | MANDATORY (DGI, PAC, CUFE) | NOT mandatory (free-form) | NOT mandatory |
| **Business Registration** | Panama Emprende (national) | State-level (50 states + DC) | Provincial + federal |
| **Privacy Law** | Limited (new data protection law in progress) | Patchwork (CCPA/CPRA most stringent) | PIPEDA (federal) + Quebec Law 25 |
| **Payment Regulators** | SBP | Federal Reserve, OCC, CFPB, state regulators | OSFI, provincial regulators |
| **Dominant Payment** | Yappy (bank-specific) | Cards via Stripe/Square + ACH | Interac e-Transfer + cards |
| **Currency** | USD (PAB at 1:1) | USD | CAD (floating) |
| **Kitz Difficulty** | Medium (clear rules, single jurisdiction) | HIGH (state-level complexity) | Medium (federal + 13 provinces) |

---

## 5. Invoice Compliance

### 5.1 US Invoicing Requirements

The United States has NO mandatory e-invoicing system and NO standardized invoice format. This is a major difference from Panama (where DGI mandates XML e-invoices via PAC providers) and from the global trend toward mandatory e-invoicing.

**What IS required on a US invoice:**
There is no federal law mandating specific invoice fields. However, standard business practice and tax/audit requirements mean invoices should include:

| Field | Required By | Notes |
|---|---|---|
| Business name and address | Standard practice | Legal name of the issuing entity |
| EIN or SSN (for 1099 purposes) | Not required ON the invoice | But W-9 should be collected separately |
| Invoice number | Standard practice | Sequential recommended but not legally mandated |
| Invoice date | Standard practice | |
| Payment terms | Standard practice | Net 30, Due on Receipt, etc. |
| Line items with description | Standard practice | |
| Unit price and quantity | Standard practice | |
| Subtotal | Standard practice | |
| Sales tax (if applicable) | State law | Must show tax separately if collected |
| Total | Standard practice | |
| Payment instructions | Standard practice | Bank details, Stripe link, etc. |

**Kitz advantage:** Because the US has no mandated format, Kitz's existing invoice template (from `invoiceQuoteTools.ts`) works for US invoices with minimal changes. The key additions are:
1. Sales tax calculation (via TaxJar/Avalara integration)
2. Sales tax displayed as a separate line item
3. Payment terms in English
4. USD formatting ($1,234.56)

### 5.2 Canadian Invoicing Requirements

Canada also has no mandatory e-invoicing. However, GST/HST-registered businesses must include specific information on invoices for customers to claim Input Tax Credits (ITCs).

**Required fields for GST/HST invoices:**

| Amount | Required Fields |
|---|---|
| **Under $100** | Seller name (or trade name), invoice date, total amount with indication GST/HST was charged |
| **$100 to $999.99** | All of the above + seller's GST/HST registration number, buyer name (or trade name), payment terms, description of goods/services |
| **$1,000+** | All of the above + buyer's name and address, each tax shown separately or total with rate and indication of taxes |

**GST/HST registration number format:** BN followed by `RT` and 4-digit account number (e.g., `123456789RT0001`).

**Kitz invoice template for Canada:**

```typescript
interface CanadianInvoice {
  // Seller info
  sellerName: string;
  sellerAddress: string;
  sellerGSTHSTNumber: string; // e.g., '123456789RT0001'

  // Buyer info
  buyerName: string;
  buyerAddress?: string; // Required for invoices >= $1,000

  // Invoice details
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD
  paymentTerms: string; // 'Net 30', 'Due on Receipt'
  dueDate: string;

  // Line items
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;

  // Tax calculation
  subtotal: number;
  taxCalculation: CanadianTaxCalculation; // From calculateCanadianTax()
  grandTotal: number;

  // Payment
  currency: 'CAD';
  paymentInstructions: string;
  stripePaymentLink?: string;
  interacEmail?: string; // For Interac e-Transfer payments
}

function generateCanadianInvoiceHTML(invoice: CanadianInvoice): string {
  const taxLines = invoice.taxCalculation.taxLines.map(line =>
    `<tr>
      <td colspan="3" style="text-align: right; padding: 6px;">${line.name} (${(line.rate * 100).toFixed(line.type === 'QST' ? 3 : 0)}%)</td>
      <td style="text-align: right; padding: 6px;">$${line.amount.toFixed(2)}</td>
    </tr>`
  ).join('\n');

  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 700px; margin: 0 auto;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
        <div>
          <h2 style="margin: 0;">${invoice.sellerName}</h2>
          <p style="color: #666; margin: 4px 0;">${invoice.sellerAddress}</p>
          <p style="color: #666; margin: 4px 0;">GST/HST: ${invoice.sellerGSTHSTNumber}</p>
        </div>
        <div style="text-align: right;">
          <h1 style="margin: 0; color: #333;">INVOICE</h1>
          <p style="margin: 4px 0;">#${invoice.invoiceNumber}</p>
          <p style="margin: 4px 0;">Date: ${invoice.invoiceDate}</p>
          <p style="margin: 4px 0;">Due: ${invoice.dueDate}</p>
          <p style="margin: 4px 0;">Terms: ${invoice.paymentTerms}</p>
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <strong>Bill To:</strong><br/>
        ${invoice.buyerName}<br/>
        ${invoice.buyerAddress || ''}
      </div>

      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f5f5f5;">
            <th style="text-align: left; padding: 8px;">Description</th>
            <th style="text-align: right; padding: 8px;">Qty</th>
            <th style="text-align: right; padding: 8px;">Price</th>
            <th style="text-align: right; padding: 8px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.lineItems.map(item => `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 8px;">${item.description}</td>
            <td style="text-align: right; padding: 8px;">${item.quantity}</td>
            <td style="text-align: right; padding: 8px;">$${item.unitPrice.toFixed(2)}</td>
            <td style="text-align: right; padding: 8px;">$${item.lineTotal.toFixed(2)}</td>
          </tr>`).join('\n')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="text-align: right; padding: 6px;"><strong>Subtotal</strong></td>
            <td style="text-align: right; padding: 6px;">$${invoice.subtotal.toFixed(2)}</td>
          </tr>
          ${taxLines}
          <tr style="border-top: 2px solid #333;">
            <td colspan="3" style="text-align: right; padding: 8px;"><strong>Total (CAD)</strong></td>
            <td style="text-align: right; padding: 8px;"><strong>$${invoice.grandTotal.toFixed(2)}</strong></td>
          </tr>
        </tfoot>
      </table>

      <div style="margin-top: 30px; padding: 15px; background: #f9f9f9; border-radius: 8px;">
        <strong>Payment Methods:</strong><br/>
        ${invoice.stripePaymentLink ? `<p>Pay online: <a href="${invoice.stripePaymentLink}">${invoice.stripePaymentLink}</a></p>` : ''}
        ${invoice.interacEmail ? `<p>Interac e-Transfer: Send to ${invoice.interacEmail}</p>` : ''}
        <p style="color: #666; font-size: 12px;">${invoice.paymentInstructions}</p>
      </div>
    </div>
  `;
}
```

### 5.3 1099 Reporting -- USA

**What it is:**
US businesses must report payments of $600+ to non-employee contractors on Form 1099-NEC (Non-Employee Compensation). This is filed with the IRS and a copy is sent to the contractor.

**Why Kitz should care:**
If a Kitz workspace owner pays contractors through the platform (future payroll feature), Kitz would need to track these payments for 1099 generation. Even without payroll, Kitz could help workspace owners track contractor payments and generate 1099 data at year-end.

**W-9 collection:**
Before paying a contractor, the business must collect a W-9 form (which includes the contractor's name, address, and TIN -- SSN or EIN). Kitz could facilitate W-9 collection and storage.

**Implementation timeline:** Future -- only when payroll or contractor payment features are built.

---

## 6. Payment Flow Architecture

### 6.1 Multi-Country Payment Flow

This is the core architectural diagram for how Kitz handles payments across countries. A single Kitz workspace may have customers in Panama, the US, and Canada.

```
                    KITZ MULTI-COUNTRY PAYMENT ARCHITECTURE
                    =======================================

  Workspace Owner (LatAm Entrepreneur)
  |
  |  Has business operations in:
  |  - Panama (primary)
  |  - USA (secondary -- serving US clients)
  |  - Canada (secondary -- serving Canadian clients)
  |
  v
  +--------------------------------------------------+
  |                KITZ WORKSPACE                     |
  |                                                   |
  |  Invoice Engine:                                  |
  |  - Detects customer country from address/profile  |
  |  - Applies correct tax logic per country:         |
  |    * Panama  -> ITBMS (7% default)               |
  |    * USA     -> TaxJar/Avalara API call           |
  |    * Canada  -> GST/HST lookup table              |
  |  - Generates country-appropriate invoice format   |
  |  - Offers country-appropriate payment methods     |
  |                                                   |
  +--------------------------------------------------+
            |                  |                  |
            v                  v                  v
    +-----------+      +-----------+      +-----------+
    |  PANAMA   |      |    USA    |      |  CANADA   |
    |  CUSTOMER |      |  CUSTOMER |      |  CUSTOMER |
    +-----------+      +-----------+      +-----------+
            |                  |                  |
    Payment options:   Payment options:   Payment options:
    - Yappy QR         - Stripe (card)    - Interac e-Transfer
    - BAC Compra Click - Stripe (ACH)     - Stripe (card)
    - ACH Directo      - PayPal           - PayPal
    - Wire transfer    - Wire transfer    - Wire transfer
            |                  |                  |
            v                  v                  v
    +-----------+      +-----------+      +-----------+
    | Yappy /   |      |  Stripe / |      | Interac / |
    | BAC       |      |  PayPal   |      | Stripe    |
    | webhook   |      |  webhook  |      | webhook   |
    +-----------+      +-----------+      +-----------+
            |                  |                  |
            +------------------+------------------+
                               |
                               v
                  +---------------------------+
                  | payments_processWebhook   |
                  | (paymentTools.ts)          |
                  |                           |
                  | Provider normalization:   |
                  | - provider: 'yappy' |     |
                  |           'bac'    |     |
                  |           'stripe' |     |
                  |           'paypal' |     |
                  |           'interac'|     |
                  |           'square' |     |
                  | - amount + currency       |
                  | - FX conversion if needed |
                  | - Invoice linkage         |
                  +---------------------------+
                               |
                               v
                  +---------------------------+
                  | UNIFIED WORKSPACE DATA    |
                  |                           |
                  | - All revenue in one view |
                  | - Multi-currency support  |
                  | - Tax reports by country  |
                  | - CRM contact updated     |
                  | - Receipt sent (WhatsApp) |
                  +---------------------------+
```

### 6.2 Cross-Border Invoice Flow

When a Panama-based Kitz workspace sends an invoice to a US client:

```
  Panama Workspace                         US Customer
  (LatAm Entrepreneur)                     (English-speaking)
        |                                       |
        |  1. Creates invoice                   |
        |     - Detects: customer is in USA     |
        |     - Language: English               |
        |     - Currency: USD                   |
        |     - Tax: "No sales tax" (B2B cross  |
        |       border -- generally not taxable |
        |       for services from Panama)       |
        |     - Payment: Stripe link + PayPal   |
        |     - Format: US-style free-form      |
        |                                       |
        |  2. Sends via email (not WhatsApp     |
        |     -- US clients prefer email)       |
        |                                       |
        v                                       v
  +-----------+                          +-----------+
  | Invoice   |  ---- email/link ------> | Customer  |
  | Generated |                          | Receives  |
  | (English, |                          | Invoice   |
  | USD, no   |                          +-----------+
  | ITBMS)    |                                |
  +-----------+                                |
        |                                      | 3. Pays via Stripe
        |                                      |    (card or ACH)
        |                                      v
        |                               +-----------+
        |                               | Stripe    |
        |                               | Processes |
        |                               | in USD    |
        |                               +-----------+
        |                                      |
        |  4. Webhook received                 |
        |     -> payments_processWebhook       |
        |        (provider: 'stripe')          |
        |                                      |
        v                                      |
  +-----------+                                |
  | Invoice   | <--- webhook ------------------|
  | -> 'paid' |                                |
  | CRM upd.  |                                |
  | Receipt   | ---- email receipt ----------->|
  +-----------+                                |
        |                                      |
        | 5. Funds settle in workspace         |
        |    owner's Stripe account (USD)      |
        |    -> Transfer to Panama bank        |
        |       account (still USD --          |
        |       Panama uses USD!)              |
        |                                      |
```

### 6.3 Currency Management

```typescript
/**
 * Multi-currency support for Kitz workspaces operating across countries.
 *
 * Current paymentTools.ts: currency defaults to 'USD' (line 42).
 * This works for Panama (USD) and USA (USD).
 * Canada requires CAD support.
 */

type KitzCurrency = 'USD' | 'CAD' | 'PAB'; // PAB = USD at 1:1

interface CurrencyConfig {
  code: KitzCurrency;
  symbol: string;
  name: string;
  decimalPlaces: number;
  thousandsSeparator: string;
  decimalSeparator: string;
  displayFormat: (amount: number) => string;
}

const CURRENCY_CONFIGS: Record<KitzCurrency, CurrencyConfig> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    displayFormat: (amount) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  },
  CAD: {
    code: 'CAD',
    symbol: 'CA$',
    name: 'Canadian Dollar',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    displayFormat: (amount) => `CA$${amount.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  },
  PAB: {
    code: 'PAB',
    symbol: 'B/.',
    name: 'Panamanian Balboa',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    displayFormat: (amount) => `B/. ${amount.toLocaleString('es-PA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  },
};

/**
 * Determine the default currency for a workspace based on country.
 */
function getDefaultCurrency(countryCode: string): KitzCurrency {
  switch (countryCode) {
    case 'US': return 'USD';
    case 'CA': return 'CAD';
    case 'PA': return 'USD'; // Panama uses USD
    default: return 'USD';
  }
}

/**
 * Format an amount for display with the correct currency symbol and locale.
 */
function formatCurrency(amount: number, currency: KitzCurrency): string {
  return CURRENCY_CONFIGS[currency].displayFormat(amount);
}

// formatCurrency(1234.56, 'USD')  -> '$1,234.56'
// formatCurrency(1234.56, 'CAD')  -> 'CA$1,234.56'
// formatCurrency(1234.56, 'PAB')  -> 'B/. 1,234.56'
```

---

## 7. Currency & Localization

### 7.1 Currency Details

| Country | Currency | Code | Symbol | Notes |
|---|---|---|---|---|
| USA | US Dollar | USD | $ | Reference currency for Kitz |
| Canada | Canadian Dollar | CAD | CA$ or C$ | Floating rate vs USD; typically 0.70-0.80 USD |
| Panama | US Dollar / Balboa | USD / PAB | $ / B/. | PAB = USD at permanent 1:1 parity |

**USD/CAD exchange rate management:**
Kitz workspaces that invoice in both USD and CAD need exchange rate awareness. Options:
1. **Display only:** Show amounts in the invoice currency; do not convert.
2. **Reference rate:** Show a reference USD equivalent on CAD invoices (informational only).
3. **Live rate integration:** Use an exchange rate API (e.g., Open Exchange Rates, Fixer.io) for real-time conversion in the revenue dashboard.

Recommended: Option 2 for MVP, Option 3 for growth.

### 7.2 Date Formats

| Country | User-facing | System | Notes |
|---|---|---|---|
| USA | MM/DD/YYYY | ISO 8601 (YYYY-MM-DD) | US uses month-first |
| Canada | YYYY-MM-DD (official) or MM/DD/YYYY or DD/MM/YYYY | ISO 8601 | Canada officially uses ISO 8601; in practice, regional variation |
| Panama | DD/MM/YYYY | ISO 8601 | Standard LatAm format |

**Kitz must handle this carefully.** A date displayed as "02/03/2026" means:
- In the US: February 3, 2026
- In Panama/most of the world: March 2, 2026

**Recommendation:** Use `toLocaleDateString()` with the workspace's locale, or always display the month name (e.g., "Feb 3, 2026" / "3 de febrero de 2026") to avoid ambiguity.

### 7.3 Phone Number Formats

| Country | Code | Mobile Format | Example | WhatsApp Format |
|---|---|---|---|---|
| USA | +1 | +1 (XXX) XXX-XXXX | +1 (305) 555-1234 | 13055551234 |
| Canada | +1 | +1 (XXX) XXX-XXXX | +1 (416) 555-1234 | 14165551234 |
| Panama | +507 | +507 6XXX-XXXX | +507 6123-4567 | 50761234567 |

**Note:** US and Canada share country code +1. Area code determines the country (but not reliably -- some area codes serve both). For Kitz, the workspace country setting determines phone formatting, not the phone number itself.

```typescript
// Phone validation and formatting for North America
const NORTH_AMERICA_PHONE = /^\+?1?\s?\(?(\d{3})\)?[\s.-]?(\d{3})[\s.-]?(\d{4})$/;

function formatNorthAmericanPhone(phone: string): {
  formatted: string;
  whatsapp: string;
  valid: boolean;
} {
  const match = phone.replace(/\D/g, '').match(/^1?(\d{3})(\d{3})(\d{4})$/);

  if (!match) {
    return { formatted: phone, whatsapp: '', valid: false };
  }

  return {
    formatted: `+1 (${match[1]}) ${match[2]}-${match[3]}`,
    whatsapp: `1${match[1]}${match[2]}${match[3]}`,
    valid: true,
  };
}
```

### 7.4 Address Formats

**USA:**
```
{Street Number} {Street Name} {Unit/Suite}
{City}, {State Abbreviation} {ZIP Code}
{Country (optional for domestic)}
```
Example:
```
1234 Calle Ocho Suite 200
Miami, FL 33135
```

**Canada:**
```
{Street Number} {Street Name} {Unit/Suite}
{City} {Province Abbreviation} {Postal Code}
{Country (optional for domestic)}
```
Example:
```
456 Dundas St W Unit 7
Toronto ON M5T 1G8
```

**Canadian postal code format:** `A1A 1A1` (letter-digit-letter space digit-letter-digit).

```typescript
// Canadian postal code validation
const CANADIAN_POSTAL_CODE = /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i;

// US ZIP code validation (5-digit or ZIP+4)
const US_ZIP_CODE = /^\d{5}(-\d{4})?$/;
```

### 7.5 Language

| Country | Primary | Secondary | Kitz Impact |
|---|---|---|---|
| USA | English | Spanish (41M+ native speakers) | English primary; Spanish for Latino market |
| Canada | English | French (official bilingual) | English primary; French required for Quebec |
| Panama | Spanish | English (business context) | Spanish primary (already implemented) |

**Kitz i18n current state:**
The `i18n.ts` supports `'es' | 'en'` locales. English is available as a fallback. For North America:
- English locale needs to be fully populated (many keys currently only have Spanish)
- French locale (`'fr'`) needs to be added for Quebec compliance
- Spanish should remain available for US Hispanic/Latino users

**Quebec language requirements (Bill 96 / Charter of the French Language):**
- Software used in the workplace in Quebec must be available in French
- Consumer-facing communications must be in French (or bilingual)
- This applies to Kitz if serving Quebec-based businesses

**i18n extension needed:**

```typescript
// Extension to i18n.ts for North America
type KitzLocale = 'es' | 'en' | 'fr';

const fr: Record<string, string> = {
  'loading': 'Chargement...',
  'save': 'Enregistrer',
  'cancel': 'Annuler',
  'workspace.leads': 'Contacts',
  'workspace.orders': 'Commandes',
  'workspace.tasks': 'Taches',
  'workspace.payments': 'Paiements',
  'workspace.products': 'Produits',
  'workspace.checkout': 'Liens de paiement',
  // ... (full French translation needed)
};
```

---

## 8. Competitive Landscape

### 8.1 US SMB Software Market

The US SMB software market is crowded but the Latino/Hispanic segment is underserved. Major competitors:

| Competitor | Category | Strengths | Weaknesses | Kitz Differentiator |
|---|---|---|---|---|
| **QuickBooks (Intuit)** | Accounting + invoicing | Market leader (7M+ SMBs), deep accounting, ecosystem | Complex, expensive ($30+/mo), no AI-native features, no LatAm capability | Kitz is simpler, cheaper, AI-native, cross-border LatAm-US |
| **FreshBooks** | Invoicing + time tracking | Clean UI, good for freelancers, affordable | Limited CRM, no WhatsApp, no LatAm integration | Kitz all-in-one (CRM + invoicing + payments + AI) |
| **Wave** | Free accounting | Free (ad-supported), good for micro businesses | Limited features, no AI, acquired by H&R Block | Kitz offers more automation, AI, WhatsApp |
| **HoneyBook** | Client management | Beautiful UI, contracts + invoicing, creative industry focus | Niche (creatives only), no LatAm, expensive | Kitz serves broader SMB market with cross-border capability |
| **Gusto** | Payroll + HR | Leading SMB payroll, great UX | Payroll-focused (narrow), expensive | Kitz covers more of the business stack |
| **Square** | POS + payments | Hardware + software integrated, free POS tier | Hardware-centric, limited online-only features | Kitz is digital-first, AI-native |
| **Shopify** | E-commerce | Dominant e-commerce platform, payments included | E-commerce only -- not a business OS | Kitz covers CRM, invoicing, content -- not just e-commerce |
| **Stripe** | Payments | Best developer payments API, global | Payments only -- not a business tool | Kitz uses Stripe as infrastructure, adds business layer |
| **Toast** | Restaurant POS | Best-in-class restaurant vertical | Restaurant only | Kitz is horizontal across SMB verticals |
| **Jobber** | Field services | Best for home services (plumbing, HVAC, etc.) | Vertical-specific | Kitz is horizontal |

### 8.2 Canadian SMB Software Market

| Competitor | Category | Strengths | Weaknesses | Kitz Differentiator |
|---|---|---|---|---|
| **Shopify** | E-commerce | Canadian company, dominant e-commerce | E-commerce focused | Kitz complements Shopify for CRM + content |
| **Lightspeed** | POS + e-commerce | Canadian company, strong in retail/restaurant | Hardware + POS focused | Kitz is AI-native, WhatsApp-integrated |
| **QuickBooks Canada** | Accounting | GST/HST compliance built in | Complex, no AI, no LatAm | Kitz simpler + cross-border |
| **FreshBooks** | Invoicing | Canadian company (Toronto), popular | Limited CRM | Kitz all-in-one |
| **Wave** | Free accounting | Canadian company (Toronto), free | Limited features | Kitz has AI + WhatsApp |
| **Wealthsimple** | Investing + tax | Growing into business banking | Not SMB-focused | Different segment |

### 8.3 The Underserved Niche: Latino Entrepreneurs in US/Canada

There is NO major software tool that specifically serves the cross-border LatAm-US/Canada entrepreneur. This is Kitz's unique positioning:

**The ideal Kitz user in North America:**
- Maria runs a catering business in Miami. She incorporated an LLC in Florida (EIN: 59-XXXXXXX). She invoices corporate clients in USD via Stripe. She also has a food distribution business in Panama City that she manages remotely, invoicing local restaurants via Yappy with DGI-compliant e-invoices.
- Carlos runs a digital marketing agency in Toronto (BN: 123456789RT0001). His clients are in Canada (pays GST/HST), the US (no Canadian tax), and Colombia (local tax rules). He needs one tool that handles invoicing for all three.
- Sofia is a freelance designer in Los Angeles who primarily works with clients in Mexico. She collects payments via Stripe (US clients) and PayPal (Mexican clients). She needs to track 1099 data for US tax purposes while managing her Mexican clients in Spanish.

**No existing tool serves all of these needs.** QuickBooks does not understand Yappy or DGI e-invoicing. Alegra does not handle US sales tax. Shopify does not do CRM. Kitz can be the bridge.

---

## 9. Implementation Roadmap

### Phase 0: Foundation -- Already Done

| Item | Status | Details |
|---|---|---|
| Stripe in provider enum | DONE | `paymentTools.ts` line 28: `enum: ['stripe', 'paypal', 'yappy', 'bac']` |
| PayPal in provider enum | DONE | Same line |
| USD as default currency | DONE | `paymentTools.ts` line 42: `currency: args.currency \|\| 'USD'` |
| English locale support | PARTIAL | `i18n.ts` has English keys but incomplete |
| Invoice generation | DONE | `invoiceQuoteTools.ts` -- generates HTML invoices |

### Phase 1: Cross-Border Invoicing (Q3 2026)

| Priority | Task | Owner | Status |
|---|---|---|---|
| P1 | Add customer country field to invoice model | Engineering | Not started |
| P1 | Implement invoice language switching (ES/EN) | Engineering | Not started |
| P1 | Add USD and CAD currency formatting | Engineering | Not started |
| P1 | Generate Stripe payment links on invoices | Engineering | Not started |
| P2 | EIN validation for US customers/workspace owners | Engineering | Not started |
| P2 | BN validation for Canadian customers/workspace owners | Engineering | Not started |
| P2 | Multi-currency revenue dashboard | Engineering | Not started |

### Phase 2: US Tax Integration (Q4 2026)

| Priority | Task | Owner | Status |
|---|---|---|---|
| P0 | Select and integrate TaxJar or Avalara for US sales tax | Engineering | Not started |
| P1 | Sales tax nexus tracking per workspace | Engineering | Not started |
| P1 | Sales tax displayed on US invoices | Engineering | Not started |
| P1 | Canadian GST/HST/PST/QST calculation (in-house) | Engineering | Not started |
| P2 | Stripe Tax evaluation (vs TaxJar/Avalara) | Product | Not started |
| P2 | Sales tax filing reminders | Engineering | Not started |

### Phase 3: North American Market (2027)

| Priority | Task | Owner | Status |
|---|---|---|---|
| P1 | Stripe Connect onboarding for US/CA workspaces | Engineering | Not started |
| P1 | English UI completion (all i18n keys) | Engineering | Not started |
| P2 | French locale for Quebec | Engineering | Not started |
| P2 | Add 'square' and 'interac' to provider enum | Engineering | Not started |
| P2 | Interac e-Transfer integration (request money) | Engineering | Not started |
| P2 | 1099 contractor payment tracking | Engineering | Not started |
| P3 | Square POS data sync | Engineering | Not started |
| P3 | Shopify store sync | Engineering | Not started |
| P3 | W-9 collection workflow | Engineering | Not started |
| P3 | FinCEN BOI reporting assistance | Engineering | Not started |

### Phase 4: Scale (2027+)

| Priority | Task | Owner | Status |
|---|---|---|---|
| P2 | ACH direct debit for subscription billing | Engineering | Not started |
| P2 | Moneris integration for Canadian merchants | Engineering | Not started |
| P3 | FedNow / RTP support via Stripe | Engineering | Not started |
| P3 | Cross-border remittance integration (Wise API) | Engineering | Not started |
| P3 | Multi-state US business registration guidance | Product | Not started |
| P3 | SOC 2 compliance certification | Security | Not started |

---

## 10. Compliance Checklist for Launch

Before Kitz accepts North American workspace registrations, the following must be verified:

### Legal & Regulatory

- [ ] US privacy compliance assessed (CCPA/CPRA at minimum for California users)
- [ ] Canadian PIPEDA compliance assessed
- [ ] Terms of service reviewed for US/Canadian law
- [ ] Money transmission license assessment (does Kitz need state-level MTL in the US?)
- [ ] Stripe Connect Terms of Service accepted and integrated
- [ ] PCI-DSS compliance via Stripe hosted checkout (no card data touches Kitz)

### Tax Compliance

- [ ] US sales tax calculation service integrated (TaxJar, Avalara, or Stripe Tax)
- [ ] Canadian GST/HST/PST/QST calculation implemented and tested for all 13 provinces
- [ ] EIN validation implemented for US workspaces
- [ ] BN validation implemented for Canadian workspaces
- [ ] Sales tax nexus determination logic implemented
- [ ] Tax-exempt customer handling implemented (B2B exemption certificates)

### Invoicing

- [ ] US invoice template: English, USD, sales tax line item, payment link
- [ ] Canadian invoice template: English (or French for QC), CAD, GST/HST registration number, tax breakdown
- [ ] Cross-border invoice template: English, USD/CAD, no foreign tax (generally)
- [ ] Invoice numbering is per-workspace and sequential
- [ ] Payment terms displayed in correct language

### Payment Processing

- [ ] Stripe Connect onboarding flow functional for US and Canadian workspace owners
- [ ] Stripe webhook receiver tested for all relevant event types
- [ ] Payment-to-invoice linking functional
- [ ] Multi-currency support (USD, CAD) in payment processing and dashboard
- [ ] PayPal integration tested for US payments

### User Experience

- [ ] English locale fully populated in `i18n.ts`
- [ ] Date format adapts to workspace locale (MM/DD/YYYY for US, YYYY-MM-DD for CA)
- [ ] Phone number formatting for +1 country code
- [ ] Address format adapts to US/Canadian standards
- [ ] Currency symbol adapts ($, CA$, B/.)
- [ ] French locale available for Quebec workspaces (can be partial for MVP)

---

## 11. Partnership Opportunities

### 11.1 Strategic Partnerships

| Partner | Type | Value to Kitz | Approach |
|---|---|---|---|
| **Stripe** | Payment infrastructure | Connect for multi-workspace, Tax for sales tax, global coverage | Already integrated -- deepen with Connect and Tax |
| **TaxJar / Avalara** | Tax compliance | US sales tax calculation, filing automation | API integration partnership |
| **Scotiabank** | Cross-border banking | LatAm-Canada banking corridor (Pacific Alliance) | Explore cross-border payment referral |
| **Mercury / Relay** | SMB banking | API-first banking for tech SMBs, potential integration | Bank account linking, financial data sync |
| **Wise** | Cross-border payments | Low-cost international transfers for LatAm-US/CA payments | API integration for cross-border payouts |
| **Plaid** | Bank connectivity | Bank account verification, financial data aggregation | Use through Stripe or direct integration |

### 11.2 Distribution Partnerships

| Partner | Channel | Opportunity |
|---|---|---|
| **US Hispanic Chamber of Commerce (USHCC)** | 200+ local chambers, 5M+ businesses | Position Kitz as the recommended business OS for Hispanic-owned businesses |
| **LULAC (League of United Latin American Citizens)** | Largest Latino civil rights org | Technology partnership for economic empowerment programs |
| **SBA (Small Business Administration)** | Federal agency | Kitz in SBA resource guides for minority-owned businesses |
| **SCORE** | Free business mentoring (SBA partner) | Kitz as recommended tool for mentees |
| **Shopify Partners** | App ecosystem | Kitz as a Shopify app for CRM + AI content alongside Shopify stores |
| **Toronto Business Development Centre** | Toronto immigrant entrepreneurs | Position Kitz for LatAm immigrants starting businesses in Canada |
| **BDC (Business Development Bank of Canada)** | Canadian SMB bank | Partnership for serving immigrant entrepreneurs |
| **Futurpreneur Canada** | Young entrepreneur funding | Kitz as recommended tool for young entrepreneurs |

### 11.3 The Cross-Border Ecosystem Play

Kitz's unique position is connecting the LatAm and North American SMB ecosystems. The partnership strategy should emphasize this bridge:

```
  LatAm Ecosystem                    Bridge (Kitz)                North America Ecosystem
  ===============                    ============                 ======================

  AMPYME (Panama)  ----+                                   +---- USHCC
  Banco General    ----+                                   +---- SBA/SCORE
  DGI e-invoicing  ----+----> KITZ WORKSPACE <----+---- Stripe Connect
  Yappy            ----+      (One platform,       +---- TaxJar/Avalara
  BAC Credomatic   ----+       both worlds)        +---- Mercury/Relay
  Alegra (future)  ----+                           +---- Shopify
                                                   +---- Scotiabank LatAm
```

---

## 12. Appendix: Reference Links

### US Payment Systems
- Stripe Documentation: https://stripe.com/docs
- Stripe Connect: https://stripe.com/docs/connect
- Stripe Tax: https://stripe.com/docs/tax
- Square Developer: https://developer.squareup.com/
- PayPal Developer: https://developer.paypal.com/
- Zelle: https://www.zellepay.com/ (no developer API)
- ACH / Nacha: https://www.nacha.org/
- FedNow: https://www.frbservices.org/financial-services/fednow
- RTP (The Clearing House): https://www.theclearinghouse.org/payment-systems/rtp
- Plaid: https://plaid.com/docs/

### Canadian Payment Systems
- Interac: https://www.interac.ca/
- Interac for Business: https://www.interac.ca/en/business/
- Moneris: https://www.moneris.com/
- Shopify Payments: https://www.shopify.com/payments
- Lightspeed: https://www.lightspeedhq.com/

### US Government & Tax
- IRS: https://www.irs.gov/
- EIN Application: https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online
- IRS TIN Matching: https://www.irs.gov/tax-professionals/taxpayer-identification-number-tin-matching
- FinCEN BOI: https://www.fincen.gov/boi
- State Sales Tax Nexus (TaxJar): https://www.taxjar.com/resources/sales-tax/nexus

### Canadian Government & Tax
- CRA: https://www.canada.ca/en/revenue-agency.html
- BN Registration: https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/registering-your-business/register.html
- GST/HST Info: https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses.html
- PIPEDA: https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/
- Bill C-27: https://www.parl.ca/legisinfo/en/bill/44-1/c-27

### Tax Calculation Services
- TaxJar: https://www.taxjar.com/
- TaxJar API: https://developers.taxjar.com/
- Avalara: https://www.avalara.com/
- Avalara AvaTax API: https://developer.avalara.com/
- Stripe Tax: https://stripe.com/docs/tax
- Vertex: https://www.vertexinc.com/
- TaxCloud: https://taxcloud.com/

### Banking
- JPMorgan Chase Business: https://www.chase.com/business
- Bank of America Business: https://www.bankofamerica.com/smallbusiness/
- Mercury: https://mercury.com/
- Relay: https://relayfi.com/
- Wise Business: https://wise.com/us/business/
- RBC Business: https://www.rbcroyalbank.com/business/
- TD Business: https://www.td.com/ca/en/business-banking
- Scotiabank Business: https://www.scotiabank.com/ca/en/small-business.html

### Privacy & Compliance
- CCPA/CPRA: https://oag.ca.gov/privacy/ccpa
- PCI-DSS: https://www.pcisecuritystandards.org/
- SOC 2: https://us.aicpa.org/interestareas/frc/assuranceadvisoryservices/sorhome
- PIPEDA: https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/
- Quebec Law 25: https://www.quebec.ca/en/government/governance-and-reform/modernization-act-personal-information-protection

### Market Intelligence
- US Hispanic-Owned Businesses (SBA): https://www.sba.gov/
- Stanford Latino Entrepreneurship Initiative: https://www.gsb.stanford.edu/faculty-research/centers-initiatives/slei
- US-LatAm Remittances (World Bank): https://www.worldbank.org/en/topic/migration/brief/migration-and-remittances
- USMCA: https://ustr.gov/trade-agreements/free-trade-agreements/united-states-mexico-canada-agreement

### Kitz Codebase References
- Payment tools: `kitz_os/src/tools/paymentTools.ts`
- Invoice/quote tools: `kitz_os/src/tools/invoiceQuoteTools.ts`
- Workspace store: `ui/src/stores/workspaceStore.ts`
- i18n: `ui/src/lib/i18n.ts`
- Automation catalog: `ui/src/content/automation-catalog.ts`
- Payment guardian: `aos/src/agents/guardians/guardian-kitz-payments.ts`

---

## Addendum: Key Decision Points

### Decision 1: US Sales Tax Strategy

**Question:** Build in-house or integrate external service?

**Answer: INTEGRATE. Do not build.**

| Option | Cost | Time | Accuracy | Maintenance |
|---|---|---|---|---|
| Build in-house | $200K+ engineering | 12+ months | Low (constantly outdated) | Continuous (100s of rate changes/year) |
| TaxJar | $19-99/mo | 2-4 weeks | High | Zero (they maintain rates) |
| Avalara | $50-200/mo | 2-4 weeks | Highest | Zero |
| Stripe Tax | 0.5% per transaction | 1 week (already on Stripe) | High | Zero |

**Recommendation:** Start with Stripe Tax (zero additional integration if using Stripe for payments). Fall back to TaxJar for invoices paid through non-Stripe methods.

### Decision 2: Stripe Connect Model

**Question:** Standard, Express, or Custom Connect accounts?

**Answer: Standard Connect.**

- Standard: Workspace owners manage their own Stripe dashboard. Kitz redirects them. Lowest Kitz liability.
- Express: Kitz manages a simplified onboarding. More control but more liability.
- Custom: Kitz manages everything. Maximum control, maximum liability and compliance burden.

Standard Connect is correct for Kitz because:
1. Workspace owners are business operators (not gig workers) -- they can manage a Stripe dashboard.
2. Kitz avoids money transmission licensing requirements in most states.
3. Lower compliance burden.

### Decision 3: When to Enter the North American Market

**Question:** When should Kitz actively market to US/Canadian entrepreneurs?

**Answer: Not before LatAm core is solid (Panama, Colombia, Mexico minimum).**

The North American market should be entered organically first:
1. Panama workspace owners send invoices to US clients -> cross-border invoicing works
2. US-based LatAm entrepreneurs discover Kitz through their LatAm business connections -> word of mouth
3. Kitz adds English UI and USD/CAD currency support -> minimal viable North American support
4. Formal US/Canadian market entry only after proving product-market fit with the cross-border use case

**Do not launch a US marketing campaign until at least 100 workspaces are actively using cross-border invoicing.**

---

*This document should be reviewed and updated quarterly as US/Canadian tax law, payment infrastructure, and Kitz's market strategy evolve. Key monitoring items: US state sales tax rate changes (ongoing), Canadian GST/HST rate updates, Stripe product launches, TaxJar/Avalara pricing changes, FedNow adoption milestones, and Canadian Open Banking framework progress.*
