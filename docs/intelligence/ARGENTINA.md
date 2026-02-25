# Argentina Financial & Payment Infrastructure Intelligence

**Document type:** Strategic Intelligence Brief
**Last updated:** 2026-02-24
**Status:** Living document -- update as regulations, exchange rates, and integrations evolve
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

Argentina is the most technically complex market in Latin America for a business operating system. The country combines mandatory electronic invoicing (in production since 2015 with SOAP-based web services), a sophisticated but volatile economic environment (triple-digit inflation through 2023-2024, gradual stabilization under the Milei administration), capital controls ("cepo"), multiple exchange rates, province-level tax variations, and a highly digital-savvy population that has adopted fintech at rates exceeding most peers in the region. For Kitz, Argentina represents both a massive opportunity (600,000+ SMBs, strong fintech adoption) and a significant engineering challenge (AFIP/ARCA SOAP integration, per-province tax withholdings, inflation-aware pricing).

The AFIP (now rebranded ARCA -- Agencia de Recaudacion y Control Aduanero -- in late 2024) mandates electronic invoicing for all taxpayers. Every invoice Kitz generates must obtain a CAE (Codigo de Autorizacion Electronico) from ARCA's web services before it is legally valid. Unlike Panama's PAC-mediated XML model, Argentina requires direct SOAP integration with the government's servers, authenticated via digital certificate. This is non-negotiable and non-deferrable.

**Key takeaways:**

- Mercado Pago dominates digital payments with 40M+ users across LatAm, deep QR integration, and the largest checkout SDK in the region. Kitz's `paymentTools.ts` provider enum must add `'mercadopago'` as the highest-priority Argentina payment integration.
- Transferencias 3.0 (BCRA mandate) enables interoperable QR payments across all banks and wallets -- any wallet can pay any merchant QR. Kitz must support receiving payments via this interoperable rail.
- ARCA (formerly AFIP) e-invoicing uses SOAP web services (WSDL-based, not REST). Integration requires a digital certificate (`.p12`/`.pfx`), CUIT validation, and handling of three invoice letter types (A, B, C) based on the tax regime of issuer and receiver.
- IVA has four rates: 21% standard, 10.5% reduced, 27% utilities/telecom, 0% exempt. Per-line-item tax categories are mandatory on the e-invoice.
- Monotributo (simplified regime) covers ~4 million small taxpayers. Kitz must detect monotributo vs. responsable inscripto status to determine invoice letter type and tax handling.
- Currency display must handle large numbers -- a simple lunch can cost ARS 15,000+. The `$` symbol is used for ARS (not USD), which creates ambiguity that the UI must resolve.
- Provincial Ingresos Brutos tax (1-5%) varies by jurisdiction and activity. This adds a withholding/perception layer on top of IVA.

---

## 2. Payment Systems

### 2.1 Mercado Pago (Mercado Libre Ecosystem)

**What it is:**
Mercado Pago is Argentina's dominant payment platform, part of the Mercado Libre ecosystem (MELI, NASDAQ-listed). It provides a digital wallet, QR code payments, POS terminals (Point Smart, Point Pro), payment links, checkout SDKs (Checkout Pro, Checkout Bricks, Checkout API), and a full merchant gateway. As of 2025, it serves 40M+ users across Latin America, with Argentina as its home market and deepest penetration.

**Why Kitz needs it:**
Mercado Pago is the single most important payment integration for Kitz in Argentina. It is the default expectation for SMBs -- both for receiving payments and for the checkout experience customers expect. Its QR code system is interoperable with Transferencias 3.0, meaning a Mercado Pago merchant QR can receive payments from any bank or wallet.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Developer portal | https://www.mercadopago.com.ar/developers/ |
| SDKs | Node.js, Python, PHP, Java, .NET, Go, Ruby |
| Authentication | OAuth 2.0 with access tokens (per-application or per-user via marketplace mode) |
| Checkout Pro | Redirect-based, hosted by Mercado Pago, handles all payment methods |
| Checkout Bricks | Embeddable UI components (React, vanilla JS) |
| Checkout API | Server-to-server, full control over UX (PCI-DSS required for card data) |
| QR payments | Dynamic QR via API, integrates with Transferencias 3.0 |
| IPN (webhooks) | Instant Payment Notifications to merchant callback URL |
| Sandbox | Full sandbox environment with test credentials |

**Integration pattern for Kitz:**

```
1. Kitz workspace owner connects Mercado Pago account (OAuth flow)
   -> Kitz stores access_token per workspace
2. Kitz generates payment preference via Checkout Pro or QR
   -> Mercado Pago returns init_point (checkout URL) or QR data
3. Customer pays via Mercado Pago (wallet, card, cash, bank transfer)
4. Mercado Pago sends IPN webhook to Kitz callback URL
5. Kitz calls payments_processWebhook(provider: 'mercadopago', ...)
6. On completion: invoice status -> 'paid', CRM updated, WhatsApp receipt sent
```

**Key SDK configuration:**

```typescript
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!, // per-workspace
});

// Create a payment preference (Checkout Pro)
const preference = new Preference(mpClient);
const result = await preference.create({
  body: {
    items: [
      {
        id: invoiceNumber,
        title: `Factura ${invoiceNumber}`,
        quantity: 1,
        unit_price: grandTotal, // in ARS
        currency_id: 'ARS',
      },
    ],
    back_urls: {
      success: `https://kitz.app/payments/mp/success/${invoiceNumber}`,
      failure: `https://kitz.app/payments/mp/failure/${invoiceNumber}`,
      pending: `https://kitz.app/payments/mp/pending/${invoiceNumber}`,
    },
    notification_url: 'https://kitz.app/webhooks/mercadopago',
    auto_return: 'approved',
    external_reference: invoiceNumber,
  },
});
// result.init_point -> redirect customer here
// result.sandbox_init_point -> for testing
```

**Important implementation notes:**
- Access tokens are per-workspace. Each Kitz workspace owner must authorize Kitz via OAuth to connect their Mercado Pago account.
- Use `external_reference` to link payments back to Kitz invoice numbers.
- Mercado Pago holds funds and settles to the merchant's Mercado Pago account, then to their bank account. Settlement timing varies (instant for Mercado Pago balance, 2-14 days for bank withdrawal depending on plan).
- The IPN webhook sends a `topic` and `id` -- Kitz must call the Mercado Pago API to fetch full payment details (the webhook itself only contains a reference).
- QR payments via Mercado Pago are automatically interoperable with Transferencias 3.0.

**Compliance requirements:**
- Kitz must register as a Mercado Pago application (developer portal).
- OAuth consent flow required for marketplace/multi-vendor model.
- Transaction data retention per BCRA requirements (10 years for financial records).

**Implementation timeline:** NOW (Q1 2026) -- highest priority payment integration.

**Action items:**
1. Register Kitz as a Mercado Pago application at the developer portal.
2. Implement OAuth flow for per-workspace credential management.
3. Build Checkout Pro integration (fastest path to production).
4. Build IPN webhook receiver mapped to `payments_processWebhook`.
5. Implement QR code generation for in-person payments.
6. Test end-to-end in sandbox.

---

### 2.2 Transferencias 3.0 / DEBIN

**What it is:**
Transferencias 3.0 is the BCRA-mandated interoperable payment system that allows any digital wallet or banking app to pay any merchant QR code, regardless of which bank or fintech issued the wallet. It is built on the COELSA (Compensadora Electronica S.A.) and LINK/Banelco clearing networks. DEBIN (Debito Inmediato) is the pull-payment mechanism within this ecosystem -- a merchant can request an immediate debit from a customer's bank account (requires customer authorization).

**Why Kitz needs it:**
Transferencias 3.0 is the rails underneath QR payments in Argentina. When a Kitz merchant displays a QR code (via Mercado Pago, MODO, or their bank), the customer can pay from any wallet or bank app. Kitz does not need to integrate with Transferencias 3.0 directly (it operates through the payment provider), but understanding the rail is essential for architecture decisions.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Operator | COELSA + LINK + Banelco + Red Pagos |
| Standard | ISO 20022 messaging |
| QR format | EMVCo-based, interoperable |
| Clearing | Near-real-time (seconds) |
| DEBIN | Pull payment -- merchant initiates, customer approves in their bank app |
| Direct access | Bank/PSP only -- Kitz integrates through Mercado Pago or acquirer |

**DEBIN flow for Kitz (future):**

```
1. Kitz generates DEBIN request via acquirer API
   -> includes: amount, customer CBU/CVU, description
2. Customer receives notification in their banking app
3. Customer approves the debit
4. Funds transfer immediately to merchant account
5. Kitz receives confirmation -> invoice marked paid
```

**Implementation timeline:** Q3 2026 -- after Mercado Pago and MODO integrations.

---

### 2.3 MODO

**What it is:**
MODO is a digital wallet created by a consortium of 40+ Argentine banks (including Galicia, Santander, BBVA, Macro, HSBC, and others). It allows users to pay from their existing bank accounts via QR codes, without needing a separate wallet balance. MODO acts as an interoperability layer for the traditional banking system to compete with Mercado Pago.

**Why Kitz needs it:**
MODO represents the banking sector's response to Mercado Pago. Many SMB customers who bank with traditional institutions use MODO rather than Mercado Pago. Supporting MODO payments ensures Kitz captures the bank-loyal customer segment. MODO payments clear through Transferencias 3.0, so a Kitz merchant with a Transferencias 3.0-compatible QR can already receive MODO payments indirectly.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Developer portal | https://developers.modo.com.ar/ |
| Integration model | API-based, merchant registration through a participating bank |
| QR type | Transferencias 3.0 interoperable |
| Settlement | Direct to merchant's bank account (via their bank) |
| Supported banks | 40+ banks, including all major retail banks |

**Implementation timeline:** Q2 2026 -- second priority after Mercado Pago.

**Action items:**
1. Evaluate whether Mercado Pago QR already captures MODO payments via Transferencias 3.0 interoperability (likely yes).
2. If direct MODO integration adds value beyond interoperable QR, contact MODO developer relations.
3. Add `'modo'` to `paymentTools.ts` provider enum.

---

### 2.4 Rapipago / Pago Facil

**What it is:**
Rapipago and Pago Facil are Argentina's dominant cash payment networks -- the equivalent of OXXO in Mexico or Boleto in Brazil. They operate through thousands of physical locations (kioscos, pharmacies, supermarkets) where customers can pay bills and invoices in cash using a barcode or payment code. Rapipago has 6,000+ collection points; Pago Facil has 4,000+.

**Why Kitz needs it:**
Despite Argentina's high fintech adoption, a significant portion of the population -- especially in smaller cities and provinces -- still relies on cash payments. Rapipago and Pago Facil integration allows Kitz merchants to accept payments from unbanked or cash-preferring customers. Mercado Pago's Checkout Pro already includes Rapipago/Pago Facil as payment methods, so integration may come "for free" through the Mercado Pago checkout.

**Integration pattern:**

```
1. Kitz generates payment via Mercado Pago Checkout Pro
   -> Customer selects "Rapipago" or "Pago Facil" as payment method
   -> Mercado Pago returns a payment voucher with barcode
2. Customer takes voucher to Rapipago/Pago Facil location
3. Cashier scans barcode, customer pays cash
4. Payment clears (24-72 hours)
5. Mercado Pago sends IPN webhook -> Kitz marks invoice as paid
```

**Important notes:**
- Cash payments have longer settlement times (24-72 hours vs. instant for digital).
- Payment vouchers expire (typically 3-5 days).
- No direct API integration needed if using Mercado Pago as the orchestrator.

**Implementation timeline:** Included in Mercado Pago integration (Q1 2026).

**Action items:**
1. Ensure Mercado Pago Checkout Pro configuration includes cash payment methods.
2. Add `'rapipago'` and `'pagofacil'` to `paymentTools.ts` provider enum for tracking/reporting.
3. Handle delayed settlement in invoice status (add `'processing'` status for cash payments in transit).

---

### 2.5 Uala

**What it is:**
Uala is a digital wallet and prepaid Mastercard issuer, very popular with younger demographics (18-35). Founded in Buenos Aires, it has grown to 8M+ users across Argentina, Mexico, and Colombia. It offers a prepaid card, bill payments, investments, crypto, and QR payments.

**Why Kitz needs it:**
Uala users can pay via Transferencias 3.0 QR codes, so they are already reachable through Mercado Pago or MODO merchant QRs. Direct Uala integration is lower priority but relevant for Kitz workspaces targeting younger demographics.

**Implementation timeline:** Future -- covered indirectly by Transferencias 3.0 interoperability.

---

### 2.6 Naranja X

**What it is:**
Naranja X is the digital evolution of Tarjeta Naranja, historically Argentina's most popular non-bank credit card (especially strong in the interior provinces -- Cordoba, Mendoza, Tucuman). It offers a digital wallet, prepaid card, QR payments, and consumer credit.

**Why Kitz needs it:**
Naranja X has strong penetration outside Buenos Aires, where many Kitz target SMBs operate. Its QR payments are Transferencias 3.0 interoperable. Naranja X also offers merchant acquiring services that could be relevant for SMBs that want card acceptance without Mercado Pago.

**Implementation timeline:** Future -- covered indirectly by Transferencias 3.0 interoperability.

---

### 2.7 Todo Pago (Prisma Medios de Pago)

**What it is:**
Todo Pago is a payment gateway operated by Prisma Medios de Pago (formerly Visa Argentina). It provides online payment processing, card-present terminals, and a checkout SDK. Prisma processes the majority of credit and debit card transactions in Argentina through the Visa and Mastercard networks.

**Why Kitz needs it:**
Todo Pago is the traditional card-acquiring alternative to Mercado Pago. Some SMBs prefer it for lower processing fees on card-present transactions. However, Mercado Pago's all-in-one approach has made Todo Pago less relevant for small businesses.

**Implementation timeline:** Q4 2026 / Future -- evaluate if Mercado Pago leaves gaps.

---

### 2.8 dLocal (Cross-Border)

**What it is:**
dLocal is a cross-border payment processor (Uruguay-based, NASDAQ-listed) that enables international businesses to accept payments in Argentina and other emerging markets. It handles FX conversion, local payment methods, and regulatory complexity for international merchants.

**Why Kitz needs it:**
dLocal is relevant if Kitz itself needs to collect subscription payments from Argentine SMBs while Kitz operates as a foreign entity. It is also relevant for Kitz workspaces that sell to international customers and need to receive USD/EUR payments settled in ARS.

**Implementation timeline:** Future -- depends on Kitz's corporate structure and billing model for Argentina.

---

## 3. Banking & Interbank Infrastructure

### 3.1 Banking Landscape

Argentina has approximately 80 banks (public, private domestic, and foreign). The key banks for Kitz's SMB market are:

| Bank | Type | Relevance to Kitz | Key Products |
|---|---|---|---|
| **Banco Nacion** | State-owned, largest | Massive SMB customer base, government programs, subsidized credit lines | Business accounts, subsidized loans, DEBIN |
| **Banco Galicia** | Private, largest private | Strong digital banking, MODO co-founder, developer-friendly | Online banking, MODO, APIs |
| **Banco Santander Rio** | Private (Spanish parent) | Large retail/SMB base, strong card business | Business banking, card acquiring |
| **BBVA Argentina** | Private (Spanish parent) | Good digital banking, MODO participant | Business accounts, FX services |
| **Banco Macro** | Private, domestic | Dominant in interior provinces (outside Buenos Aires) | SMB banking, regional strength |
| **HSBC Argentina** | Private (UK parent) | International trade focus, foreign companies | Trade finance, FX, business banking |
| **Brubank** | Digital bank (neobank) | Leading neobank, 100% digital, popular with younger SMB owners | Free accounts, instant transfers, competitive FX |
| **Wilobank** | Digital bank | Early Argentine neobank | Digital accounts, cards |
| **Reba** | Digital bank | Focus on financial inclusion | Digital accounts, investments |

### 3.2 Interbank Infrastructure

| System | Operator | Purpose |
|---|---|---|
| **COELSA** | Compensadora Electronica S.A. | Primary clearing house -- ACH, check clearing, Transferencias 3.0 |
| **LINK** | Red LINK S.A. | ATM network + debit card network (historically Banelco competitor, now merged clearing) |
| **Banelco** | Prisma Medios de Pago | ATM network + debit card network |
| **MEP (Medio Electronico de Pagos)** | BCRA | Real-time gross settlement for high-value interbank payments |
| **CVU** | BCRA-mandated | Clave Virtual Uniforme -- like CBU but for fintechs/wallets (Mercado Pago, Uala, etc.) |
| **CBU** | Banks | Clave Bancaria Uniforme -- standard 22-digit bank account identifier |

**CBU vs. CVU -- important distinction for Kitz:**

```
CBU (Clave Bancaria Uniforme) -- 22 digits
  Used by: Traditional banks
  Format:  BBBSSSSCCDDDDDDDDDDDD
           BBB   = Bank code (3 digits)
           SSSS  = Branch code (4 digits)
           CC    = Check digits
           DDD...= Account number (13 digits) + check digit

CVU (Clave Virtual Uniforme) -- 22 digits
  Used by: Fintechs, wallets (Mercado Pago, Uala, etc.)
  Format:  Same length as CBU, starts with "000" bank code
           Distinguishes fintech accounts from bank accounts

Alias: Human-readable alias (e.g., "mi.negocio.kitz") mapped to CBU/CVU
```

**Action items:**
1. Support both CBU and CVU in invoice payment instructions.
2. Allow workspace owners to set their CBU/CVU for bank transfer reception.
3. Display Alias alongside CBU/CVU for easier customer payments.

---

### 3.3 BCRA (Banco Central de la Republica Argentina)

**What it is:**
The BCRA is Argentina's central bank. It sets monetary policy, regulates banks, manages reserves, and oversees payment systems. The BCRA has been a key driver of fintech regulation and payment interoperability through Transferencias 3.0.

**Key regulatory areas for Kitz:**

| Regulation | Impact on Kitz |
|---|---|
| Comunicacion A 7514+ (PSP regulation) | Payment Service Provider requirements -- licensing, capital, AML |
| Transferencias 3.0 mandate | Interoperability requirement for QR payments |
| Cepo cambiario (capital controls) | Restrictions on USD purchases, impact on international payments |
| Tasa de politica monetaria | Interest rate that affects SMB financing costs |
| Comunicacion A 6885+ (fintech accounts) | CVU requirements for non-bank financial entities |

**Implementation timeline:** NOW -- legal assessment required before payment features launch.

---

## 4. Government & Regulatory Bodies

### 4.1 ARCA (formerly AFIP)

**What it is:**
ARCA (Agencia de Recaudacion y Control Aduanero) is Argentina's federal tax authority. Until late 2024 it was known as AFIP (Administracion Federal de Ingresos Publicos). ARCA administers federal taxes (IVA, Ganancias, Monotributo), customs, and social security contributions. It operates the electronic invoicing web services that are mandatory for all taxpayers.

**Why Kitz needs it:**
Every invoice Kitz generates in Argentina MUST obtain a CAE from ARCA's web services before it is legally valid. This is not optional and not deferrable. An invoice without a CAE is not a legal invoice -- it has no fiscal validity and cannot be used for tax deductions by the recipient.

**Key ARCA systems:**

| System | URL / Endpoint | Purpose |
|---|---|---|
| ARCA Portal | https://www.arca.gob.ar/ | Main portal (redirects from old afip.gob.ar) |
| Clave Fiscal | Via ARCA portal | Digital identity/authentication system for taxpayers |
| Web Services FE | https://wswhomo.afip.gov.ar/wsfev1/service.asmx (homologacion) | E-invoicing SOAP web service (test) |
| Web Services FE | https://servicios1.afip.gov.ar/wsfev1/service.asmx (production) | E-invoicing SOAP web service (production) |
| WSAA | https://wsaahomo.afip.gov.ar/ws/services/LoginCms (homologacion) | Authentication web service (test) |
| WSAA | https://wsaa.afip.gov.ar/ws/services/LoginCms (production) | Authentication web service (production) |
| Padron A13 | Web service | Taxpayer registry lookup (IVA condition, activity, etc.) |

**Authentication flow (WSAA -- Web Service de Autenticacion y Autorizacion):**

```
                    ARCA AUTHENTICATION FLOW
                    ========================

  Kitz Server                          ARCA WSAA
       |                                  |
       |  1. Generate TRA (Login Ticket   |
       |     Request) XML                 |
       |                                  |
       |  2. Sign TRA with digital        |
       |     certificate (.p12/.pfx)      |
       |     using CMS (PKCS#7)           |
       |                                  |
       |  3. Send signed TRA to WSAA ---->|
       |     (SOAP: loginCms)             |
       |                                  |
       |  4. WSAA validates signature  <--|
       |     Returns TA (Login Ticket     |
       |     Access) with:                |
       |     - token (valid ~12 hours)    |
       |     - sign                       |
       |     - expiration time            |
       |                                  |
       v                                  v
  +-----------+                    +-----------+
  | Cache TA  |                    | ARCA      |
  | (token +  |                    | validates |
  | sign)     |                    | cert      |
  +-----------+                    +-----------+
       |
       |  5. Use token + sign in all
       |     subsequent WSFEV1 calls
       v
  WSFEV1 (E-Invoice Web Service)
```

**Digital certificate requirements:**
- Each workspace owner must generate a CSR (Certificate Signing Request) through ARCA's portal.
- ARCA signs the CSR and returns a `.crt` certificate.
- Combined with the private key into a `.p12`/`.pfx` file.
- Certificate is tied to the CUIT and specific web services authorized.
- Must be renewed periodically (typically every 2 years).

**Implementation timeline:** NOW -- critical path. Without this, Kitz cannot issue legal invoices in Argentina.

**Action items:**
1. Build WSAA authentication client (SOAP, CMS signing).
2. Build WSFEV1 e-invoicing client (SOAP).
3. Implement per-workspace digital certificate storage (encrypted).
4. Create guided setup wizard for certificate generation and upload.
5. Build TA (token) caching with automatic refresh.

---

### 4.2 CUIT Validation

**What it is:**
The CUIT (Clave Unica de Identificacion Tributaria) is Argentina's tax identification number for businesses and individuals. The CUIL (Clave Unica de Identificacion Laboral) uses the same format but is for employees. Every invoice must include the CUIT of both issuer and receiver (for Factura A).

**CUIT format:** `XX-XXXXXXXX-X` (11 digits total)

```
Prefix (2 digits):
  20 = Male individual
  23 = Individual (either gender, special cases)
  24 = Individual (either gender, special cases)
  27 = Female individual
  30 = Legal entity (S.A., S.R.L., etc.)
  33 = Legal entity (government, associations)
  34 = Legal entity (special cases)

Body (8 digits):
  DNI number (for individuals) or entity registration number

Check digit (1 digit):
  Modulo 11 verification
```

**CUIT validation with check digit:**

```typescript
/**
 * Validates an Argentine CUIT/CUIL number.
 * Format: XX-XXXXXXXX-X (11 digits, dashes optional)
 * Uses modulo 11 algorithm for check digit verification.
 */
function validateCUIT(cuit: string): {
  valid: boolean;
  type: string;
  formatted: string;
  error?: string;
} {
  // Strip dashes, spaces, dots
  const cleaned = cuit.replace(/[-\s.]/g, '');

  // Must be exactly 11 digits
  if (!/^\d{11}$/.test(cleaned)) {
    return {
      valid: false,
      type: 'unknown',
      formatted: cuit,
      error: 'CUIT must be exactly 11 digits',
    };
  }

  const prefix = cleaned.substring(0, 2);
  const body = cleaned.substring(2, 10);
  const expectedCheck = parseInt(cleaned[10]!, 10);

  // Validate prefix
  const validPrefixes: Record<string, string> = {
    '20': 'persona_fisica_masculino',
    '23': 'persona_fisica_ambos',
    '24': 'persona_fisica_ambos',
    '27': 'persona_fisica_femenino',
    '30': 'persona_juridica',
    '33': 'persona_juridica_estatal',
    '34': 'persona_juridica_especial',
  };

  const type = validPrefixes[prefix];
  if (!type) {
    return {
      valid: false,
      type: 'unknown',
      formatted: cuit,
      error: `Invalid CUIT prefix: ${prefix}. Valid: 20, 23, 24, 27, 30, 33, 34`,
    };
  }

  // Modulo 11 check digit calculation
  const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i]!, 10) * multipliers[i]!;
  }
  const remainder = sum % 11;
  let checkDigit: number;

  if (remainder === 0) {
    checkDigit = 0;
  } else if (remainder === 1) {
    // Special case: check digit would be 10, which is invalid
    // In practice, ARCA assigns a different prefix to avoid this
    checkDigit = prefix === '23' ? 9 : 4;
  } else {
    checkDigit = 11 - remainder;
  }

  if (checkDigit !== expectedCheck) {
    return {
      valid: false,
      type,
      formatted: `${prefix}-${body}-${expectedCheck}`,
      error: `Invalid check digit. Expected ${checkDigit}, got ${expectedCheck}`,
    };
  }

  return {
    valid: true,
    type,
    formatted: `${prefix}-${body}-${cleaned[10]}`,
  };
}

// CUIT regex for quick format validation (without check digit)
const CUIT_REGEX = /^(20|23|24|27|30|33|34)-?\d{8}-?\d$/;

// Examples:
// validateCUIT('20-12345678-3')  -> { valid: true, type: 'persona_fisica_masculino', ... }
// validateCUIT('30-71234567-9')  -> { valid: true, type: 'persona_juridica', ... }
// validateCUIT('20123456783')    -> { valid: true, ... } (dashes optional)
// validateCUIT('99-12345678-0')  -> { valid: false, error: 'Invalid CUIT prefix' }
```

---

### 4.3 Tax Regimes: Monotributo vs. Responsable Inscripto

**Monotributo (Regimen Simplificado):**
The Monotributo is a simplified tax regime for small taxpayers. It replaces IVA, Ganancias (income tax), and social security contributions with a single monthly fixed payment. Approximately 4 million taxpayers are enrolled. Categories are based on annual gross revenue, energy consumption, rent, and physical space.

**Monotributo categories (2025 values, updated periodically):**

| Category | Max Annual Revenue (ARS) | Approx. USD Equivalent | Monthly Payment (ARS) |
|---|---|---|---|
| A | 7,813,063 | ~$6,500 | ~$28,000 |
| B | 11,447,046 | ~$9,500 | ~$32,000 |
| C | 16,050,091 | ~$13,300 | ~$36,000 |
| D | 19,926,340 | ~$16,600 | ~$45,000 |
| E | 23,439,192 | ~$19,500 | ~$68,000 |
| F | 29,374,695 | ~$24,500 | ~$82,000 |
| G | 35,128,502 | ~$29,200 | ~$95,000 |
| H | 52,692,753 | ~$43,900 | ~$170,000 |
| I (services only) | 58,531,948 | ~$48,700 | ~$220,000 |
| J (goods only) | 67,176,117 | ~$55,900 | ~$250,000 |
| K (goods only) | 75,820,287 | ~$63,100 | ~$280,000 |

*Note: These thresholds are updated by ARCA periodically (usually annually) to account for inflation. The USD equivalents above use an approximate rate and will shift.*

**Responsable Inscripto (Regimen General):**
Businesses that exceed Monotributo thresholds, or choose to register in the general regime, are Responsable Inscripto. They must charge IVA on their invoices, file monthly IVA returns, and pay Ganancias (income tax). This is the standard regime for medium and larger SMBs.

**Impact on Kitz invoice types:**

| Issuer Regime | Receiver Regime | Invoice Type | IVA Treatment |
|---|---|---|---|
| Responsable Inscripto | Responsable Inscripto | **Factura A** | IVA discriminated (shown separately) |
| Responsable Inscripto | Monotributista | **Factura A** | IVA discriminated |
| Responsable Inscripto | Consumidor Final | **Factura B** | IVA included in price (not shown separately) |
| Responsable Inscripto | Exento | **Factura B** | IVA included |
| Monotributista | Any | **Factura C** | No IVA (monotributo does not charge IVA) |

**Kitz must:**
1. Store the tax regime of each workspace owner (Monotributo category or Responsable Inscripto).
2. Determine the receiver's tax condition for each invoice (via Padron A13 web service lookup or manual entry).
3. Automatically select the correct invoice letter type (A, B, or C).
4. Apply IVA calculation only when the issuer is Responsable Inscripto.

---

### 4.4 Ingresos Brutos (Provincial Turnover Tax)

**What it is:**
Ingresos Brutos (IIBB) is a provincial-level turnover tax levied on gross revenue. Each of Argentina's 24 jurisdictions (23 provinces + CABA -- Ciudad Autonoma de Buenos Aires) sets its own rates, which vary by economic activity. Rates typically range from 1% to 5%.

**Why it matters for Kitz:**
Ingresos Brutos creates a layer of tax withholdings (retenciones) and perceptions (percepciones) on commercial transactions. When a Kitz workspace owner receives a payment from a customer in a different province, the payment processor or bank may withhold IIBB on the transaction. Kitz must track these withholdings for the workspace owner's tax filing.

**Key complications:**
- **Convenio Multilateral:** Businesses operating in multiple provinces must apportion revenue across jurisdictions using a formula (coeficiente unificado). This affects which province gets IIBB revenue.
- **SIRE (Sistema Integral de Retenciones Electronicas):** The electronic system for reporting withholdings and perceptions. Kitz must generate SIRE-compatible reports for workspace owners.
- **SIFERE:** The system for declaring multi-jurisdictional IIBB payments.
- **Percepciones on payments:** Payment processors (Mercado Pago, banks) withhold IIBB on payments and report to provincial tax authorities. Kitz must reconcile these withholdings.

**Action items:**
1. Store province of registration for each workspace.
2. Track IIBB withholdings on incoming payments.
3. Generate IIBB withholding certificates (Certificado de Retencion).
4. Build SIRE export format for withholding reporting.

---

## 5. Invoice Compliance

### 5.1 IVA (Impuesto al Valor Agregado)

IVA is Argentina's federal value-added tax. It is the primary indirect tax and must be calculated, displayed, and reported correctly on every invoice issued by a Responsable Inscripto.

**Tax rates:**

| Rate | Application |
|---|---|
| **21%** | Standard rate -- most goods and services |
| **10.5%** | Reduced rate -- capital goods, certain foods, medical services, housing construction, public transport, newspapers/magazines |
| **27%** | Elevated rate -- telecommunications, electricity, gas, water (when buyer is Responsable Inscripto) |
| **0%** | Exempt -- exports, books, certain financial services, education, health (with conditions) |

**IVA calculation logic for Kitz:**

```typescript
type IVACategory =
  | 'general'       // 21%
  | 'reduced'       // 10.5%
  | 'elevated'      // 27%
  | 'exempt'        // 0%
  | 'not_taxed';    // 0% (no gravado -- different from exempt for reporting)

const IVA_RATES: Record<IVACategory, number> = {
  general: 0.21,
  reduced: 0.105,
  elevated: 0.27,
  exempt: 0.0,
  not_taxed: 0.0,
};

// ARCA uses numeric codes for IVA rates in the e-invoice
const IVA_ARCA_CODES: Record<IVACategory, number> = {
  not_taxed: 1,   // No gravado
  exempt: 2,      // Exento
  general: 5,     // 21%
  reduced: 4,     // 10.5%
  elevated: 6,    // 27%
  // Code 3 = 0% (tasa 0%, different from exempt/not_taxed)
  // Code 8 = 5%  (rarely used)
  // Code 9 = 2.5% (rarely used)
};

interface ArgentinaLineItem {
  description: string;
  quantity: number;
  unitPrice: number;          // Net price (sin IVA) for Factura A
  ivaCategory: IVACategory;
  ivaRate: number;            // Calculated from category
  ivaAmount: number;          // Calculated
  lineTotal: number;          // quantity * unitPrice
  lineTotalWithIVA: number;   // lineTotal + ivaAmount
}

interface IVASummary {
  netTotal: number;            // Sum of all line totals (sin IVA)
  ivaBreakdown: Array<{
    category: IVACategory;
    arcaCode: number;
    baseAmount: number;        // Taxable base for this rate
    ivaAmount: number;         // IVA amount for this rate
  }>;
  totalIVA: number;            // Sum of all IVA
  grandTotal: number;          // netTotal + totalIVA
}

function calculateIVA(items: ArgentinaLineItem[]): IVASummary {
  const breakdown = new Map<IVACategory, { base: number; iva: number }>();

  for (const item of items) {
    item.ivaRate = IVA_RATES[item.ivaCategory] ?? 0.21;
    item.lineTotal = item.quantity * item.unitPrice;
    item.ivaAmount = item.lineTotal * item.ivaRate;
    item.lineTotalWithIVA = item.lineTotal + item.ivaAmount;

    const existing = breakdown.get(item.ivaCategory) || { base: 0, iva: 0 };
    existing.base += item.lineTotal;
    existing.iva += item.ivaAmount;
    breakdown.set(item.ivaCategory, existing);
  }

  const ivaBreakdown = Array.from(breakdown.entries()).map(([category, { base, iva }]) => ({
    category,
    arcaCode: IVA_ARCA_CODES[category] ?? 5,
    baseAmount: Math.round(base * 100) / 100,
    ivaAmount: Math.round(iva * 100) / 100,
  }));

  const netTotal = Math.round(items.reduce((sum, i) => sum + i.lineTotal, 0) * 100) / 100;
  const totalIVA = Math.round(ivaBreakdown.reduce((sum, b) => sum + b.ivaAmount, 0) * 100) / 100;

  return {
    netTotal,
    ivaBreakdown,
    totalIVA,
    grandTotal: Math.round((netTotal + totalIVA) * 100) / 100,
  };
}
```

**IVA filing obligations:**
- Monthly filing via ARCA's "IVA Digital" system.
- Libro de IVA Digital (mandatory digital IVA ledger) -- all purchase and sales invoices must be reported monthly.
- Due dates vary by CUIT termination digit (0-1: day 18, 2-3: day 19, 4-5: day 20, 6-7: day 21, 8-9: day 22).
- Kitz must generate Libro de IVA Digital export in the required format.

---

### 5.2 E-Invoice (Factura Electronica) -- WSFEV1 Integration

**What it is:**
Argentina's electronic invoicing system requires all invoices to be authorized by ARCA via SOAP web services. The primary service is WSFEV1 (Web Service de Factura Electronica Version 1), which handles the most common invoice types. ARCA returns a CAE (Codigo de Autorizacion Electronico) that makes the invoice legally valid.

**Document types in WSFEV1:**

| Code | Document Type | Kitz Mapping |
|---|---|---|
| 1 | Factura A | B2B invoice (RI to RI) |
| 2 | Nota de Debito A | Debit note (B2B) |
| 3 | Nota de Credito A | Credit note (B2B) |
| 6 | Factura B | Invoice to consumer final |
| 7 | Nota de Debito B | Debit note (consumer) |
| 8 | Nota de Credito B | Credit note (consumer) |
| 11 | Factura C | Monotributo invoice |
| 12 | Nota de Debito C | Debit note (Monotributo) |
| 13 | Nota de Credito C | Credit note (Monotributo) |
| 51 | Factura M | Factura M (new RI, limited operations) |
| 201 | Factura de Credito MiPyMEs A | SMB credit invoice A |
| 206 | Factura de Credito MiPyMEs B | SMB credit invoice B |
| 211 | Factura de Credito MiPyMEs C | SMB credit invoice C |

**WSFEV1 SOAP integration pattern:**

```typescript
import * as soap from 'soap';
import * as forge from 'node-forge';
import * as fs from 'fs';

// ── Step 1: Authenticate with WSAA ──

interface LoginTicket {
  token: string;
  sign: string;
  expirationTime: Date;
}

async function authenticateWSAA(
  certPath: string,     // .pem certificate
  keyPath: string,      // .pem private key
  environment: 'homo' | 'prod'
): Promise<LoginTicket> {
  const wsaaUrl = environment === 'prod'
    ? 'https://wsaa.afip.gov.ar/ws/services/LoginCms?WSDL'
    : 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms?WSDL';

  // Build TRA (Ticket de Requerimiento de Acceso)
  const now = new Date();
  const expiration = new Date(now.getTime() + 600000); // 10 minutes
  const tra = `<?xml version="1.0" encoding="UTF-8"?>
<loginTicketRequest version="1.0">
  <header>
    <uniqueId>${Math.floor(Date.now() / 1000)}</uniqueId>
    <generationTime>${now.toISOString()}</generationTime>
    <expirationTime>${expiration.toISOString()}</expirationTime>
  </header>
  <service>wsfe</service>
</loginTicketRequest>`;

  // Sign TRA with CMS (PKCS#7)
  const cert = fs.readFileSync(certPath, 'utf8');
  const key = fs.readFileSync(keyPath, 'utf8');
  const signedCMS = signWithCMS(tra, cert, key); // Returns base64

  // Call WSAA
  const client = await soap.createClientAsync(wsaaUrl);
  const [result] = await client.loginCmsAsync({ in0: signedCMS });

  // Parse response (XML string containing token and sign)
  const loginTicketResponse = parseXML(result.loginCmsReturn);
  return {
    token: loginTicketResponse.token,
    sign: loginTicketResponse.sign,
    expirationTime: new Date(loginTicketResponse.expirationTime),
  };
}

// ── Step 2: Request CAE via WSFEV1 ──

interface InvoiceRequest {
  cuit: string;              // Issuer CUIT (11 digits, no dashes)
  puntoDeVenta: number;      // Billing point (1-99998)
  tipoComprobante: number;   // Document type code (1, 6, 11, etc.)
  concepto: number;          // 1=Products, 2=Services, 3=Products+Services
  tipoDocReceptor: number;   // Receiver doc type (80=CUIT, 96=DNI, 99=Consumidor Final)
  nroDocReceptor: number;    // Receiver document number
  fechaComprobante: string;  // YYYYMMDD
  importeNeto: number;       // Net amount (before IVA)
  importeIVA: number;        // Total IVA
  importeTotal: number;      // Grand total
  ivaDetails: Array<{
    id: number;              // IVA code (3, 4, 5, 6)
    baseImp: number;         // Taxable base
    importe: number;         // IVA amount
  }>;
  // For services (concepto 2 or 3):
  fechaServDesde?: string;   // Service period start (YYYYMMDD)
  fechaServHasta?: string;   // Service period end (YYYYMMDD)
  fechaVtoPago?: string;     // Payment due date (YYYYMMDD)
}

interface CAEResponse {
  cae: string;               // Authorization code (14 digits)
  caeFchVto: string;         // CAE expiration date (YYYYMMDD)
  resultado: 'A' | 'R';     // A=Approved, R=Rejected
  observaciones?: string[];
  errores?: string[];
}

async function requestCAE(
  ticket: LoginTicket,
  invoice: InvoiceRequest,
  environment: 'homo' | 'prod'
): Promise<CAEResponse> {
  const wsfevUrl = environment === 'prod'
    ? 'https://servicios1.afip.gov.ar/wsfev1/service.asmx?WSDL'
    : 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx?WSDL';

  const client = await soap.createClientAsync(wsfevUrl);

  // Get last authorized invoice number for this punto de venta + tipo
  const [lastResult] = await client.FECompUltimoAutorizadoAsync({
    Auth: { Token: ticket.token, Sign: ticket.sign, Cuit: invoice.cuit },
    PtoVta: invoice.puntoDeVenta,
    CbteTipo: invoice.tipoComprobante,
  });
  const lastNumber = lastResult.FECompUltimoAutorizadoResult.CbteNro;
  const nextNumber = lastNumber + 1;

  // Build SOAP request
  const feRequest = {
    Auth: {
      Token: ticket.token,
      Sign: ticket.sign,
      Cuit: invoice.cuit,
    },
    FeCAEReq: {
      FeCabReq: {
        CantReg: 1,
        PtoVta: invoice.puntoDeVenta,
        CbteTipo: invoice.tipoComprobante,
      },
      FeDetReq: {
        FECAEDetRequest: [{
          Concepto: invoice.concepto,
          DocTipo: invoice.tipoDocReceptor,
          DocNro: invoice.nroDocReceptor,
          CbteDesde: nextNumber,
          CbteHasta: nextNumber,
          CbteFch: invoice.fechaComprobante,
          ImpTotal: invoice.importeTotal,
          ImpTotConc: 0,  // Non-taxable concepts
          ImpNeto: invoice.importeNeto,
          ImpOpEx: 0,      // Exempt operations
          ImpIVA: invoice.importeIVA,
          ImpTrib: 0,      // Other taxes
          MonId: 'PES',    // Currency: Argentine Peso
          MonCotiz: 1,     // Exchange rate (1 for ARS)
          ...(invoice.concepto >= 2 ? {
            FchServDesde: invoice.fechaServDesde,
            FchServHasta: invoice.fechaServHasta,
            FchVtoPago: invoice.fechaVtoPago,
          } : {}),
          Iva: {
            AlicIva: invoice.ivaDetails.map(iva => ({
              Id: iva.id,
              BaseImp: iva.baseImp,
              Importe: iva.importe,
            })),
          },
        }],
      },
    },
  };

  const [result] = await client.FECAESolicitarAsync(feRequest);
  const det = result.FECAESolicitarResult.FeDetResp.FECAEDetResponse[0];

  return {
    cae: det.CAE,
    caeFchVto: det.CAEFchVto,
    resultado: det.Resultado,
    observaciones: det.Observaciones?.Obs?.map((o: any) => `${o.Code}: ${o.Msg}`) || [],
    errores: result.FECAESolicitarResult.Errors?.Err?.map((e: any) => `${e.Code}: ${e.Msg}`) || [],
  };
}
```

**CAEA (Codigo de Autorizacion Electronico Anticipado):**
For businesses that need offline invoicing capability (unreliable internet), ARCA provides CAEA -- a pre-authorized code valid for a 15-day period. The business can issue invoices offline using the CAEA and must report them to ARCA before the period expires.

**Key validation rules:**
- Invoice numbers are sequential per punto de venta and invoice type. The next number is always `FECompUltimoAutorizado + 1`.
- Each workspace can have multiple puntos de venta (billing points). Punto de venta must be registered with ARCA beforehand.
- Dates must be in `YYYYMMDD` format (no dashes).
- Amounts use 2 decimal places and period as decimal separator in the SOAP request.
- For services (`concepto = 2 or 3`), service period dates and payment due date are mandatory.
- Factura C (Monotributo) does not include IVA details in the request.
- CAE is valid for 10 days after issuance. After that, the invoice can still be used but is flagged as "observed" by ARCA.

---

### 5.3 Controlador Fiscal

**What it is:**
A Controlador Fiscal is a government-certified fiscal printer or electronic fiscal controller that registers every retail transaction. It is mandatory for businesses that sell to consumers at physical locations (Factura B or ticket). The device has tamper-proof fiscal memory and reports directly to ARCA.

**Why Kitz needs to know:**
Kitz is primarily a digital platform, but some workspace owners may have physical retail locations. Kitz does not need to integrate with Controlador Fiscal hardware directly, but should be aware that:
- Retail transactions recorded via Controlador Fiscal do NOT also need CAE from WSFEV1 (they are already authorized by the fiscal controller).
- Kitz's e-invoice module covers online/remote invoicing. Physical POS invoicing remains with the Controlador Fiscal.
- Reconciliation between Controlador Fiscal sales and Kitz data may be needed for accounting.

---

### 5.4 Libro de IVA Digital

**What it is:**
The Libro de IVA Digital is a mandatory digital IVA ledger that all Responsable Inscripto taxpayers must file monthly with ARCA. It includes all purchase invoices received and all sales invoices issued during the period.

**Why Kitz needs it:**
Kitz can generate the sales portion of the Libro de IVA Digital automatically from the invoices issued through the platform. This is a significant value proposition -- saving workspace owners hours of manual data entry.

**Export format requirements:**
- CSV or fixed-width text file per ARCA specifications.
- Separate files for Compras (purchases) and Ventas (sales).
- Fields include: date, invoice type, punto de venta, invoice number, receiver CUIT, receiver name, net amount, IVA amounts per rate, total, CAE.

**Action items:**
1. Build automatic Libro de IVA Digital export from Kitz invoice data.
2. Support both Ventas (auto-generated) and Compras (manual entry or OCR scan).
3. Match ARCA's exact file format specifications.

---

### 5.5 Percepciones and Retenciones

**What it is:**
Argentina's tax system includes a complex web of withholdings (retenciones) and perceptions (percepciones) that are collected at the point of payment or sale. These are advance payments of taxes (IVA, Ganancias, IIBB) collected by designated "agentes de retencion/percepcion."

**Key types:**

| Type | When Applied | Who Collects | Tax |
|---|---|---|---|
| Retencion IVA | On payment to supplier | Buyer (if designated agent) | IVA |
| Percepcion IVA | On sale | Seller (if designated agent) | IVA |
| Retencion Ganancias | On payment to supplier | Buyer (if designated agent) | Income tax |
| Retencion/Percepcion IIBB | On payment or sale | Province-designated agents | IIBB (provincial) |
| Percepcion Mercado Pago | On payment to merchant | Mercado Pago (as designated agent) | IVA + IIBB |

**Impact on Kitz:**
When Mercado Pago settles funds to a merchant, it may withhold IVA and IIBB percepciones. The amount received is less than the invoice total. Kitz must:
1. Track the withheld amounts.
2. Display net settlement (amount received) vs. gross invoice total.
3. Generate withholding certificates for tax credit purposes.
4. Export withholding data in SIRE format.

---

## 6. Payment Flow Architecture

### 6.1 End-to-End Payment Flow (Argentina)

```
                      ARGENTINA PAYMENT FLOW
                      ======================

  Kitz Workspace Owner                        Customer
        |                                        |
        |  Creates invoice (invoice_create)      |
        |  with line items + IVA                 |
        |                                        |
        v                                        |
  +-----------+                                  |
  | Determine |  Issuer RI -> Receiver RI?       |
  | Invoice   |  -> Factura A (IVA discriminado) |
  | Type      |  Issuer RI -> Cons. Final?       |
  | (A/B/C)   |  -> Factura B (IVA incluido)     |
  |           |  Issuer Monotributo -> Any?       |
  |           |  -> Factura C (sin IVA)           |
  +-----------+                                  |
        |                                        |
        v                                        |
  +-----------+                                  |
  | Request   | -- SOAP to ARCA WSFEV1 --------> | ARCA validates
  | CAE       | <-- CAE + expiration returned --- | + assigns CAE
  +-----------+                                  |
        |                                        |
        |  CAE embedded in invoice               |
        |  QR code generated (ARCA format)       |
        |                                        |
        |  Sends via WhatsApp/Email              |
        |  (invoice_send)                        |
        v                                        v
  +-----------+                            +-----------+
  | Payment   | <-- Customer chooses       | Customer  |
  | Options   |     payment method ------> | Selects   |
  +-----------+                            +-----------+
        |                                        |
        +---- Mercado Pago QR -------+           |
        |                            |           |
        +---- Transferencia bancaria +           |
        |    (CBU/CVU/Alias)         |           |
        |                            |           |
        +---- MODO QR -------+      |           |
        |                    |      |           |
        +---- Rapipago/      |      |           |
        |     Pago Facil ----+      |           |
        |                    v      |           |
        |              +-----------+|           |
        |              | Payment   ||           |
        |              | Processed ||           |
        |              +-----------+|           |
        |                    |      |           |
        v                    v      |           |
  +-----------+        +-----------+|           |
  | Webhook   | <----  | Provider  ||           |
  | Received  | notify | Confirms  ||           |
  +-----------+        +-----------+            |
        |                                        |
        v                                        |
  +---------------------+                       |
  | payments_process    |                        |
  | Webhook             |                        |
  | (paymentTools.ts)   |                        |
  +---------------------+                        |
        |                                        |
        +-- Invoice status -> 'paid'             |
        +-- Withholdings tracked (IVA + IIBB)    |
        +-- CRM contact -> payment recorded      |
        +-- WhatsApp receipt sent --------------->|
        +-- Revenue dashboard updated (ARS)      |
        +-- Libro de IVA Digital updated         |
```

### 6.2 ARCA Invoice QR Code

ARCA requires a QR code on every electronic invoice. This QR encodes a URL to ARCA's invoice verification page. The format is:

```typescript
/**
 * Generate the ARCA-mandated QR code data for an electronic invoice.
 * RG 4892/2021 defines the QR format.
 */
function generateARCAInvoiceQR(params: {
  ver: 1;                      // Version (always 1)
  fecha: string;               // Invoice date YYYY-MM-DD
  cuit: number;                // Issuer CUIT (as number, no dashes)
  ptoVta: number;              // Punto de venta
  tipoCmp: number;             // Invoice type code
  nroCmp: number;              // Invoice number
  importe: number;             // Total amount
  moneda: string;              // Currency code ('PES' for ARS)
  ctz: number;                 // Exchange rate (1 for ARS)
  tipoDocRec: number;          // Receiver doc type
  nroDocRec: number;           // Receiver doc number
  tipoCodAut: 'E' | 'A';      // E=CAE, A=CAEA
  codAut: number;              // CAE or CAEA code
}): string {
  // Encode as JSON, then base64
  const payload = JSON.stringify(params);
  const base64 = Buffer.from(payload).toString('base64');
  return `https://www.afip.gob.ar/fe/qr/?p=${base64}`;
}

// Example:
// generateARCAInvoiceQR({
//   ver: 1,
//   fecha: '2026-02-24',
//   cuit: 20123456783,
//   ptoVta: 1,
//   tipoCmp: 1,
//   nroCmp: 42,
//   importe: 12100.00,
//   moneda: 'PES',
//   ctz: 1,
//   tipoDocRec: 80,
//   nroDocRec: 30712345679,
//   tipoCodAut: 'E',
//   codAut: 74012345678901,
// })
// -> "https://www.afip.gob.ar/fe/qr/?p=eyJ2ZXIiOjEsImZlY2..."
```

### 6.3 Webhook Processing Enhancement

The existing `payments_processWebhook` in `paymentTools.ts` needs enhancement for Argentina:

```typescript
// Current provider enum: ['stripe', 'paypal', 'yappy', 'bac']
// Required for Argentina:
provider: {
  type: 'string',
  enum: [
    'stripe', 'paypal', 'yappy', 'bac',    // Panama
    'mercadopago', 'modo',                    // Argentina
    'rapipago', 'pagofacil',                 // Argentina (cash networks)
    'transferencia_bancaria',                // Argentina (bank transfer)
  ],
  description: 'Payment provider',
}

// Additional fields needed for Argentina:
{
  // Withholding tracking
  gross_amount: { type: 'number', description: 'Gross payment amount (before withholdings)' },
  net_amount: { type: 'number', description: 'Net amount received (after withholdings)' },
  withholdings: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        tax_type: { type: 'string', enum: ['iva', 'ganancias', 'iibb'] },
        jurisdiction: { type: 'string', description: 'Province code for IIBB' },
        amount: { type: 'number' },
        certificate_number: { type: 'string' },
      },
    },
  },
  // Invoice linking
  invoice_cae: { type: 'string', description: 'CAE of the invoice being paid' },
}
```

### 6.4 Multi-Provider Strategy (Argentina)

```
Priority 1 (Now):     Mercado Pago     -- 60%+ of digital payments in Argentina
Priority 2 (Q2 2026): MODO             -- Bank consortium wallet, captures bank-loyal users
Priority 3 (Q2 2026): Transferencia    -- Bank transfers (CBU/CVU), common for B2B
Priority 4 (Q3 2026): Rapipago/PF      -- Cash payments (via Mercado Pago Checkout)
Priority 5 (Future):  Todo Pago        -- Traditional card acquiring
Priority 6 (Future):  dLocal           -- Cross-border / international
```

---

## 7. Currency & Localization

### 7.1 Currency

| Aspect | Detail |
|---|---|
| Official currency | Peso argentino (ARS) |
| ISO code | ARS |
| Symbol | $ (same as USD -- source of ambiguity) |
| Common disambiguation | AR$ or ARS to distinguish from USD |
| Subdivision | centavos (1/100, but effectively unused due to inflation) |

**The inflation problem:**
Argentina has experienced sustained high inflation. As of early 2026, a basic lunch costs ARS 10,000-20,000. Monthly rents for small commercial spaces are ARS 500,000-2,000,000. This means:
- Invoice amounts routinely reach millions of pesos.
- Centavos are economically meaningless for most transactions.
- Kitz must handle large number display gracefully.
- Price lists need frequent updates.
- Contracts and recurring invoices may use UVA (Unidad de Valor Adquisitivo) indexation.

**Display conventions:**

```typescript
/**
 * Format ARS currency for display.
 * Argentine convention: dot for thousands, comma for decimals.
 * Examples: $ 1.234,56  |  $ 15.000  |  $ 1.500.000
 */
function formatARS(amount: number, options?: {
  showDecimals?: boolean;  // Default true, but often false for large amounts
  prefix?: string;         // Default '$ ', can use 'AR$ ' for disambiguation
}): string {
  const { showDecimals = true, prefix = '$ ' } = options || {};

  const fixed = showDecimals ? amount.toFixed(2) : Math.round(amount).toString();
  const [intPart, decPart] = fixed.split('.');

  // Argentine format: dot as thousands separator
  const formattedInt = intPart!.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  if (showDecimals && decPart) {
    return `${prefix}${formattedInt},${decPart}`;
  }
  return `${prefix}${formattedInt}`;
}

// Examples:
// formatARS(1234.56)                    -> "$ 1.234,56"
// formatARS(15000, { showDecimals: false }) -> "$ 15.000"
// formatARS(1500000)                    -> "$ 1.500.000,00"
// formatARS(100, { prefix: 'AR$ ' })    -> "AR$ 100,00"

/**
 * Handle the "millions of pesos" problem for compact display.
 */
function formatARSCompact(amount: number): string {
  if (amount >= 1_000_000) {
    return `$ ${(amount / 1_000_000).toFixed(1).replace('.', ',')}M`;
  }
  if (amount >= 1_000) {
    return `$ ${(amount / 1_000).toFixed(1).replace('.', ',')}K`;
  }
  return formatARS(amount);
}

// formatARSCompact(1500000) -> "$ 1,5M"
// formatARSCompact(15000)   -> "$ 15,0K"
// formatARSCompact(500)     -> "$ 500,00"
```

**Exchange rate considerations:**

```
Official rate:  Set by BCRA, used for formal transactions
Blue/informal:  Parallel market rate (historically 50-100% premium over official)
MEP:            Dolar "bolsa" -- obtained by buying/selling bonds in ARS/USD
CCL:            Contado con liquidacion -- similar to MEP but via foreign settlement
Crypto/dollar:  Informal rate via stablecoin (USDT/USDC) purchases

Under the Milei administration (late 2023+):
  - Devaluation of official rate toward market rates
  - Gap between official and blue narrowed significantly (from 150%+ to <20%)
  - Gradual liberalization of capital controls ("cepo")
  - Target: full unification of exchange rates
```

**Kitz implications:**
- Kitz should display prices and invoices in ARS (legal requirement).
- For workspaces that also need USD reference, show an informational USD equivalent using the official BCRA rate.
- Never use the blue rate for official calculations.
- The BCRA publishes the official rate daily at https://www.bcra.gob.ar/PublicacionesEstadisticas/Principales_variables_datos.asp

### 7.2 Date Format

| Context | Format | Example |
|---|---|---|
| User-facing display | DD/MM/YYYY | 24/02/2026 |
| ARCA WSFEV1 SOAP | YYYYMMDD (no dashes) | 20260224 |
| Internal storage (ISO 8601) | YYYY-MM-DDTHH:mm:ssZ | 2026-02-24T15:30:00Z |
| Kitz implementation | `now.toLocaleDateString('es-AR')` | Uses Argentina locale |

### 7.3 Phone Numbers

| Aspect | Detail |
|---|---|
| Country code | +54 |
| Mobile format | +54 9 XX XXXX-XXXX (11 digits after +54, with 9 for mobile) |
| Landline (CABA) | +54 11 XXXX-XXXX |
| Landline (provinces) | +54 XXX XXX-XXXX (area code varies 2-4 digits) |
| WhatsApp format | 549XXXXXXXXXX (no + or dashes) |

**Validation regex:**

```typescript
// Argentine mobile number (national format with 9 prefix for mobile)
const ARGENTINA_MOBILE = /^\+?54\s?9?\s?\d{2,4}\s?\d{4}-?\d{4}$/;

// WhatsApp-ready format (must include 9 after 54)
function toWhatsAppFormatAR(phone: string): string {
  let cleaned = phone.replace(/[\s\-\+\(\)]/g, '');
  // Ensure starts with 549
  if (cleaned.startsWith('54') && !cleaned.startsWith('549')) {
    cleaned = '549' + cleaned.substring(2);
  }
  if (!cleaned.startsWith('54')) {
    cleaned = '549' + cleaned;
  }
  return cleaned;
}

// toWhatsAppFormatAR('+54 9 11 1234-5678') -> '5491112345678'
// toWhatsAppFormatAR('011 1234-5678')       -> '5491112345678'
```

### 7.4 Address Format

Argentina uses a structured address format with street name, number, floor/apartment, postal code, city, and province.

**Standard format:**
```
{Calle} {Numero}, {Piso} {Depto}
{Codigo Postal} {Ciudad}
{Provincia}, Argentina
```

**Example:**
```
Av. Corrientes 1234, Piso 8 Dto. A
C1043AAZ Ciudad Autonoma de Buenos Aires
Buenos Aires, Argentina
```

**Postal code format:**
- Old format: 4 digits (e.g., 1043)
- CPA (Codigo Postal Argentino): 1 letter + 4 digits + 3 letters (e.g., C1043AAZ)
- Both formats are still in use.

### 7.5 Language

- All Kitz UI for Argentina: Spanish (Rioplatense variant)
- Key difference from other Spanish: **voseo** (use of "vos" instead of "tu")
  - "Tu factura" -> "Tu factura" (no change in possessives)
  - "Crea tu factura" -> "Crea tu factura" (informal imperative is the same in this case)
  - "Puedes crear" -> "Podes crear" (verb conjugation changes)
- Invoice terminology: "Factura", "Presupuesto" (quote -- not "Cotizacion" as in Panama), "Nota de Credito", "Nota de Debito", "Recibo"
- Currency references: "pesos" (not "dolares"), "$ 1.500" (dot thousands), "IVA" (not "ITBMS")

### 7.6 Argentine Provinces (Jurisdictions)

| Code | Province | Capital | IIBB Relevance |
|---|---|---|---|
| C | Ciudad Autonoma de Buenos Aires (CABA) | Buenos Aires | AGIP (own tax authority) |
| B | Buenos Aires (province) | La Plata | ARBA (own tax authority) |
| K | Catamarca | S.F. del Valle de Catamarca | Standard |
| H | Chaco | Resistencia | Standard |
| U | Chubut | Rawson | Standard |
| X | Cordoba | Cordoba | DGR Cordoba |
| W | Corrientes | Corrientes | Standard |
| E | Entre Rios | Parana | Standard |
| P | Formosa | Formosa | Standard |
| Y | Jujuy | S.S. de Jujuy | Standard |
| L | La Pampa | Santa Rosa | Standard |
| F | La Rioja | La Rioja | Standard |
| M | Mendoza | Mendoza | ATM Mendoza |
| Q | Misiones | Posadas | Standard |
| R | Neuquen | Neuquen | Standard |
| A | Salta | Salta | Standard |
| J | San Juan | San Juan | Standard |
| D | San Luis | San Luis | Standard |
| Z | Santa Cruz | Rio Gallegos | Standard |
| S | Santa Fe | Santa Fe | API Santa Fe |
| G | Santiago del Estero | Santiago del Estero | Standard |
| V | Tierra del Fuego | Ushuaia | Standard (no IIBB) |
| T | Tucuman | S.M. de Tucuman | Standard |

*Note: Tierra del Fuego does not charge Ingresos Brutos, which is a significant advantage for businesses registered there.*

---

## 8. Competitive Landscape

### 8.1 Direct Competitors (Argentina SMB Software)

| Competitor | Strengths | Weaknesses | Kitz Differentiator |
|---|---|---|---|
| **Xubio** | Strong e-invoicing (ARCA integration), accounting, payroll, multi-country (AR, UY, CL, CO) | No AI features, no WhatsApp integration, traditional SaaS UX | Kitz is AI-native, WhatsApp-first |
| **Colppy** | Popular cloud accounting, e-invoicing, expense management, good UX | Accounting-focused, limited CRM, no payment processing | Kitz is all-in-one (CRM + invoicing + payments + WhatsApp) |
| **Alegra** | LatAm-wide, affordable, modern UI, e-invoicing | Generic LatAm -- not Argentina-specialized, no AI | Kitz is Argentina-aware, AI-powered |
| **Tango (Axoft)** | Market leader for medium businesses, full ERP (accounting, inventory, payroll, HR) | Expensive, complex, desktop-heavy (Tango Live is cloud), targets bigger companies | Kitz targets micro/small, mobile-first, simpler |
| **Bejerman** | Established ERP provider, strong in medium enterprises | Legacy UX, expensive, not SMB-friendly | Kitz is modern, affordable, AI-native |
| **QuickBooks** | Global brand, robust accounting | Poor Argentine localization (no ARCA integration, no IVA handling, no CUIT) | Kitz is built for Argentina from the ground up |
| **Tienda Nube** | Dominant e-commerce platform in Argentina, integrates with Mercado Pago | E-commerce only, no CRM, no invoicing beyond basic receipts | Kitz covers the full business lifecycle beyond online sales |

### 8.2 Kitz's Competitive Advantages in Argentina

1. **AI-native operating system:** No Argentine competitor offers AI-powered content creation, customer communication, and business automation.
2. **WhatsApp-first:** WhatsApp is the primary business communication channel in Argentina (even more than email). Kitz treats it as a core channel.
3. **ARCA integration:** Direct WSFEV1 integration for e-invoicing, with automatic invoice letter type selection (A/B/C) and CAE retrieval.
4. **Monotributo awareness:** Automatic category detection, invoice type selection, and regime-specific features.
5. **All-in-one:** CRM + invoicing + payments + content + WhatsApp in a single platform, replacing Xubio + Colppy + Mercado Pago dashboard + WhatsApp Business.
6. **Micro/small business pricing:** Designed for Monotributo and small RI businesses, not medium/large enterprises.

---

## 9. Implementation Roadmap

### Phase 1: Foundation (NOW -- Q1 2026)

| Priority | Task | Owner | Status |
|---|---|---|---|
| P0 | ARCA WSAA authentication client (SOAP + CMS signing) | Engineering | Not started |
| P0 | ARCA WSFEV1 e-invoicing client (SOAP) | Engineering | Not started |
| P0 | CUIT validation with modulo 11 check digit | Engineering | Not started |
| P0 | IVA multi-rate support (21%, 10.5%, 27%, 0%) in `invoice_create` | Engineering | Not started |
| P0 | Invoice type determination logic (A/B/C based on tax regime) | Engineering | Not started |
| P1 | Per-workspace digital certificate storage (encrypted .p12) | Engineering | Not started |
| P1 | Mercado Pago OAuth integration | Engineering | Not started |
| P1 | Legal assessment: BCRA PSP licensing requirement | Legal | Not started |
| P1 | Monotributo vs. Responsable Inscripto workspace classification | Engineering | Not started |

### Phase 2: Payment & Compliance (Q2 2026)

| Priority | Task | Owner | Status |
|---|---|---|---|
| P0 | Mercado Pago Checkout Pro integration (QR + webhook) | Engineering | Blocked by Phase 1 |
| P0 | CAE retrieval and QR code generation on invoices | Engineering | Blocked by WSFEV1 |
| P0 | ARCA invoice QR code (RG 4892 format) | Engineering | Not started |
| P1 | MODO integration (evaluate if needed beyond Transferencias 3.0) | Engineering | Not started |
| P1 | Invoice-to-payment linking (auto-mark paid) | Engineering | Not started |
| P1 | WhatsApp receipt automation | Engineering | Not started |
| P1 | Withholding tracking (IVA + IIBB percepciones from Mercado Pago) | Engineering | Not started |
| P2 | Bank transfer (CBU/CVU) payment instructions on invoices | Engineering | Not started |
| P2 | Libro de IVA Digital export | Engineering | Not started |

### Phase 3: Growth & Optimization (Q3-Q4 2026)

| Priority | Task | Owner | Status |
|---|---|---|---|
| P1 | SIRE export for withholding reporting | Engineering | Not started |
| P1 | Nota de Credito and Nota de Debito support | Engineering | Not started |
| P1 | Multi-punto de venta support | Engineering | Not started |
| P2 | Padron A13 integration (receiver CUIT lookup) | Engineering | Not started |
| P2 | CAEA (offline invoicing) support | Engineering | Not started |
| P2 | Ingresos Brutos per-province rate configuration | Engineering | Not started |
| P2 | Monotributo category auto-detection from revenue | Engineering | Not started |
| P3 | Factura de Credito MiPyMEs (electronic credit invoice) | Engineering | Not started |
| P3 | UVA-indexed contract/invoice support | Engineering | Not started |

### Phase 4: Future

| Priority | Task | Owner | Status |
|---|---|---|---|
| P2 | DEBIN (pull payment) integration | Engineering | Not started |
| P2 | dLocal cross-border payment support | Engineering | Not started |
| P3 | Controlador Fiscal reconciliation | Engineering | Not started |
| P3 | Payroll / CUIL integration | Engineering | Not started |
| P3 | Convenio Multilateral IIBB calculation | Engineering | Not started |
| P3 | Mercado Libre marketplace integration (sync orders) | Engineering | Not started |

---

## 10. Compliance Checklist for Launch

Before Kitz can process payments and generate invoices in Argentina, the following must be verified:

### Legal & Regulatory

- [ ] BCRA PSP licensing assessment completed -- determination of whether Kitz needs a PSP license or can operate through licensed providers (Mercado Pago)
- [ ] Privacy policy updated for Argentine data protection law (Ley 25.326 -- Proteccion de Datos Personales)
- [ ] Terms of service reviewed by Argentine attorney
- [ ] AML/KYC policy aligned with UIF (Unidad de Informacion Financiera) requirements
- [ ] ARCA web services authorization obtained (homologacion process)

### Tax Compliance

- [ ] IVA calculation supports all rate tiers (21%, 10.5%, 27%, 0%, exempt, no gravado)
- [ ] Invoice type determination (A/B/C) correctly implemented
- [ ] CUIT validation with modulo 11 check digit implemented
- [ ] Monotributo regime detection and Factura C generation working
- [ ] Punto de venta registration with ARCA documented for workspace owners
- [ ] CAE retrieval via WSFEV1 operational in production
- [ ] CAE displayed on all electronic invoices + ARCA QR code
- [ ] Invoice numbering is sequential per punto de venta and invoice type
- [ ] Percepciones/retenciones tracking implemented

### E-Invoice (Factura Electronica)

- [ ] WSAA authentication with digital certificate (.p12) functional
- [ ] WSFEV1 SOAP client tested in homologacion environment
- [ ] WSFEV1 SOAP client tested in production environment
- [ ] All mandatory fields populated per ARCA specification
- [ ] Service invoices include FchServDesde, FchServHasta, FchVtoPago
- [ ] Error handling for ARCA rejections (Resultado = 'R')
- [ ] CAE expiration monitoring (10-day validity)
- [ ] Libro de IVA Digital export functional

### Payment Processing

- [ ] Mercado Pago application registered
- [ ] Mercado Pago OAuth flow for workspace connection working
- [ ] IPN webhook receiver tested end-to-end
- [ ] Payment-to-invoice linking functional (via external_reference)
- [ ] Withholding deductions tracked and displayed
- [ ] Cash payment status handling (Rapipago/Pago Facil delayed settlement)
- [ ] Transaction data retention policy (10 years per BCRA) implemented

### User Experience

- [ ] Workspace onboarding captures: business name, CUIT, tax regime (Monotributo/RI), province, CBU/CVU
- [ ] Currency displayed as `$ X.XXX,XX` (dot thousands, comma decimal) per Argentine convention
- [ ] Dates displayed as DD/MM/YYYY in UI
- [ ] Phone numbers validated for Argentina format (+54)
- [ ] All UI text in Spanish (Rioplatense variant)
- [ ] Large number display handles millions of pesos gracefully
- [ ] WhatsApp receipt templates reviewed for Argentine terminology
- [ ] Invoice terminology uses "Presupuesto" (not "Cotizacion") for quotes

---

## 11. Partnership Opportunities

### 11.1 Strategic Partnerships

| Partner | Type | Value to Kitz | Approach |
|---|---|---|---|
| **Mercado Pago** | Payment infrastructure | Payment processing, QR, wallet, checkout | Developer program, marketplace integration |
| **MODO** | Payment infrastructure | Bank consortium wallet, 40+ banks | Developer API, commercial agreement |
| **Banco Galicia** | Banking + distribution | API-forward bank, large SMB base, MODO co-founder | Fintech partnership program |
| **Brubank** | Digital banking | Leading neobank, digital-native SMB owners | API integration, referral partnership |
| **CAME** (Confederacion Argentina de la Mediana Empresa) | Distribution + credibility | Access to 600K+ SMB members, advocacy | Co-branded digitization program |
| **Tienda Nube** | E-commerce complement | Dominant e-commerce platform, complementary (they sell, Kitz manages) | Integration partnership |
| **Xubio** | Potential acqui-hire or integration | Strong ARCA integration code, accounting expertise | Evaluate partnership vs. competition |

### 11.2 Distribution Partnerships

| Partner | Channel | Opportunity |
|---|---|---|
| CAME + CGERA | SMB confederations | Feature Kitz in member digitization programs |
| Contadores (accountants) | Professional network | Referral program -- accountants recommend Kitz to Monotributo clients |
| Mercado Libre | E-commerce ecosystem | Integration for sellers who need invoicing + CRM beyond Mercado Libre |
| Banco Nacion | State bank network | SMB development programs, subsidized tools |
| Secretaria de Economia del Conocimiento | Government program | Tax benefits for software companies (Ley de Economia del Conocimiento) |

### 11.3 Regulatory Partnerships

| Partner | Purpose |
|---|---|
| ARCA (formerly AFIP) | Web services homologation, technical support |
| BCRA | PSP licensing guidance, Transferencias 3.0 participation |
| CNV (Comision Nacional de Valores) | If Kitz handles investment/credit products |
| UIF | AML compliance guidance |

---

## 12. Appendix: Reference Links

### Payment Systems
- Mercado Pago Developers: https://www.mercadopago.com.ar/developers/
- Mercado Pago Checkout Pro: https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/landing
- MODO: https://www.modo.com.ar/
- MODO Developers: https://developers.modo.com.ar/
- Uala: https://www.uala.com.ar/
- Naranja X: https://www.naranjax.com/
- Todo Pago: https://www.todopago.com.ar/
- Rapipago: https://www.rapipago.com.ar/
- Pago Facil: https://www.pagofacil.com.ar/
- dLocal: https://dlocal.com/

### Government & Tax
- ARCA Portal: https://www.arca.gob.ar/
- ARCA Web Services (homologacion): https://wswhomo.afip.gov.ar/wsfev1/service.asmx
- ARCA Web Services (produccion): https://servicios1.afip.gov.ar/wsfev1/service.asmx
- ARCA WSAA (homologacion): https://wsaahomo.afip.gov.ar/ws/services/LoginCms
- ARCA WSAA (produccion): https://wsaa.afip.gov.ar/ws/services/LoginCms
- ARCA Padron A13: https://www.afip.gob.ar/ws/ws-padron/
- BCRA: https://www.bcra.gob.ar/
- BCRA Exchange Rates: https://www.bcra.gob.ar/PublicacionesEstadisticas/Principales_variables_datos.asp
- UIF: https://www.argentina.gob.ar/uif

### Banking
- Banco Nacion: https://www.bna.com.ar/
- Banco Galicia: https://www.galicia.ar/
- Banco Santander Rio: https://www.santander.com.ar/
- BBVA Argentina: https://www.bbva.com.ar/
- Banco Macro: https://www.macro.com.ar/
- Brubank: https://www.brubank.com.ar/

### Tax Authorities (Provincial)
- AGIP (CABA): https://www.agip.gob.ar/
- ARBA (Buenos Aires): https://www.arba.gov.ar/
- DGR Cordoba: https://www.cba.gov.ar/rentas/
- API Santa Fe: https://www.santafe.gov.ar/api/
- ATM Mendoza: https://www.atm.mendoza.gov.ar/

### Regulatory References
- Ley 11.683 (Procedimiento Tributario)
- Ley 20.631 (IVA)
- Ley 24.977 (Monotributo)
- Ley 25.326 (Proteccion de Datos Personales)
- RG 4291 (Factura Electronica -- current general resolution)
- RG 4892 (QR code on invoices)
- Comunicacion A 7514+ (BCRA -- PSP regulation)
- Ley de Economia del Conocimiento (tax benefits for software companies)

### Competitive Intelligence
- Xubio: https://xubio.com/ar/
- Colppy: https://www.colppy.com/
- Tango (Axoft): https://www.axoft.com/
- Bejerman: https://www.bejerman.com/
- Tienda Nube: https://www.tiendanube.com.ar/
- Alegra: https://www.alegra.com/ar/

### Kitz Codebase References
- Payment tools: `kitz_os/src/tools/paymentTools.ts`
- Invoice/quote tools: `kitz_os/src/tools/invoiceQuoteTools.ts`
- Invoice workflow: `kitz_os/data/n8n-workflows/invoice-auto-generate.json`

### Technical Libraries (ARCA Integration)
- `soap` (npm) -- SOAP client for Node.js
- `node-forge` -- PKI/certificate handling for CMS signing
- `xml2js` -- XML parsing for WSAA/WSFEV1 responses
- `afip.js` (npm) -- Community library for AFIP/ARCA integration (evaluate for production use)

---

*This document should be reviewed and updated monthly given Argentina's rapidly evolving economic and regulatory environment. Key monitoring areas: ARCA resolution updates (frequent), BCRA exchange rate policy (cepo liberalization timeline), Monotributo category thresholds (annual updates), inflation metrics (monthly CPI), and Mercado Pago SDK/API changes. The economic complexity of Argentina requires ongoing attention -- exchange rates, tax thresholds, and withholding rates can change with minimal notice.*
