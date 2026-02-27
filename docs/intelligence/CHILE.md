# Chile Financial & Payment Infrastructure Intelligence

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

Chile represents the most technically mature e-invoicing market in Latin America and a strategically important expansion target for Kitz. The country's tax authority, the SII (Servicio de Impuestos Internos), pioneered mandatory electronic invoicing starting in 2003 with full universalization in 2014, years ahead of most LatAm peers. This means the API infrastructure is well-documented, REST-based, and battle-tested -- a significant advantage over markets like Argentina (AFIP SOAP) or Panama (still ramping up PAC adoption). The Chilean peso (CLP) is an integer-only currency with no decimal subdivision, which demands careful handling in Kitz's financial calculations that currently assume two decimal places (`toFixed(2)` calls throughout `invoiceQuoteTools.ts`).

**Key takeaways:**

- Chile's DTE (Documento Tributario Electronico) system is the gold standard in LatAm. Mandatory since 2014 for all businesses, it uses XML with X.509 digital signatures and well-documented REST APIs. Kitz's `invoice_create` tool must generate SII-compliant DTE XML with proper folio numbering, CAF (Codigo de Autorizacion de Folios) management, and Timbre Electronico.
- Transbank has historically been the monopoly card acquirer in Chile, but Getnet (Santander) and others are breaking this open. WebPay Plus is the dominant online payment gateway. The provider enum in `paymentTools.ts` must be extended with `'transbank'`, `'webpay'`, `'khipu'`, `'flow'`, and `'mercadopago'`.
- CLP is integer-only (no cents). All amounts must be whole numbers. The existing `$${amount.toFixed(2)}` pattern in `invoiceQuoteTools.ts` will produce incorrect output for Chile (e.g., `$15.000,00` instead of `$15.000`).
- UF (Unidad de Fomento) is an inflation-indexed unit critical for contracts, real estate, and certain tax calculations. Kitz must support UF-to-CLP conversion using daily values published by the Banco Central de Chile.
- IVA is 19% (one of the simpler VAT structures in LatAm -- single rate with exemptions, no multi-tier complexity like Panama's ITBMS).
- CuentaRUT (BancoEstado) provides near-universal financial inclusion -- almost every Chilean has one. This makes bank transfer payments viable for the broadest possible customer base.
- Regimen Pro-Pyme (revenue < 75,000 UF, approximately CLP 2.8 billion) is the simplified tax regime targeting Kitz's core SMB audience.

---

## 2. Payment Systems

### 2.1 Transbank (Card Acquiring)

**What it is:**
Transbank has been Chile's near-monopoly card acquirer for decades, processing Visa, Mastercard, American Express, and Diners Club transactions for the vast majority of Chilean merchants. While regulators have been pushing to break this monopoly since 2020, Transbank remains the dominant acquirer and the default integration for any business accepting card payments in Chile.

**Why Kitz needs it:**
Card payments are the primary electronic payment method for Chilean SMBs. Any Kitz workspace accepting online or in-person card payments will almost certainly route through Transbank. The company provides well-documented SDKs including a Node.js/TypeScript SDK, making integration straightforward.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Developer portal | https://www.transbankdevelopers.cl/ |
| Node.js SDK | `transbank-sdk` (npm) -- official SDK |
| Authentication | Commerce code + API key (issued by Transbank) |
| Environments | Integration (testing) and Production |
| API style | REST (modern) -- replaces older SOAP-based KCC |
| PCI compliance | Hosted payment page model -- card data never touches merchant |
| Settlement | T+2 business days into merchant's bank account |

**Key SDK configuration:**

```typescript
import { WebpayPlus, Environment } from 'transbank-sdk';

// Integration (testing) environment -- uses default test credentials
const tx = new WebpayPlus.Transaction({
  commerceCode: process.env.TRANSBANK_COMMERCE_CODE ?? '597055555532',
  apiKey: process.env.TRANSBANK_API_KEY ?? '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C',
  environment: process.env.NODE_ENV === 'production'
    ? Environment.Production
    : Environment.Integration,
});

// Create a transaction
async function createWebpayTransaction(
  orderId: string,
  amount: number, // CLP -- must be integer
  returnUrl: string,
) {
  const sessionId = `kitz-${orderId}-${Date.now()}`;
  const response = await tx.create(
    orderId,       // buyOrder
    sessionId,     // sessionId
    Math.round(amount), // amount -- MUST be integer for CLP
    returnUrl,     // returnUrl
  );
  return {
    token: response.token,
    url: response.url,       // redirect customer here
    fullUrl: `${response.url}?token_ws=${response.token}`,
  };
}

// Confirm a transaction (called when customer returns)
async function confirmWebpayTransaction(token: string) {
  const result = await tx.commit(token);
  return {
    approved: result.response_code === 0,
    amount: result.amount,
    authorizationCode: result.authorization_code,
    cardNumber: result.card_detail?.card_number, // last 4 digits
    transactionDate: result.transaction_date,
    buyOrder: result.buy_order,
    installments: result.installments_number,
  };
}
```

**Important implementation notes:**
- CLP amounts MUST be integers. `Math.round()` every amount before sending to Transbank.
- The integration environment uses well-known test credentials (commerce code `597055555532`). Never use these in production.
- Transbank supports installment payments (cuotas). Chilean consumers frequently pay in 3, 6, or 12 installments. This should be exposed in the checkout flow.
- The `token_ws` returned from `create()` is appended as a query parameter when redirecting the customer.

**Compliance requirements:**
- Merchant must have a Transbank commerce agreement (Contrato de Afiliacion).
- PCI-DSS compliance is handled by Transbank's hosted page.
- Commerce code and API key are issued after KYC and agreement signing.
- Transaction records must be retained for at least 5 years.

**Implementation timeline:** NOW (Q1 2026) -- highest priority payment integration for Chile.

**Action items:**
1. Register Kitz as a Transbank merchant (Contrato de Afiliacion).
2. Implement WebPay Plus flow using `transbank-sdk` npm package.
3. Build return URL handler that calls `commit()` and maps to `payments_processWebhook`.
4. Support installment selection in checkout UI.
5. Test end-to-end in Integration environment before production.

---

### 2.2 WebPay Plus (Online Payment Gateway)

**What it is:**
WebPay Plus is Transbank's flagship online payment gateway, used by the majority of Chilean e-commerce sites. It provides a hosted payment page where customers enter their card details, with Transbank handling all PCI-DSS compliance. It supports credit cards, debit cards (Redcompra), and prepaid cards.

**Why Kitz needs it:**
WebPay Plus is the standard checkout experience Chilean consumers expect. When a Kitz-generated invoice includes a "Pay Now" link, that link should lead to a WebPay Plus payment page. This is the online equivalent of Yappy in Panama -- the default digital payment method.

**Integration pattern for Kitz:**

```
1. Kitz generates invoice (invoice_create)
2. Customer clicks "Pagar" (Pay) link on invoice
3. Kitz backend calls WebpayPlus.Transaction.create()
   -> Returns token + redirect URL
4. Customer is redirected to Transbank's hosted payment page
5. Customer enters card details and confirms
6. Transbank redirects customer back to Kitz return URL with token_ws
7. Kitz backend calls WebpayPlus.Transaction.commit(token)
8. On success: payments_processWebhook(provider: 'transbank', ...)
9. Invoice status -> 'paid', CRM updated, receipt sent
```

**Supported payment methods within WebPay Plus:**

| Method | Description | Market share |
|---|---|---|
| Credit card (Visa/MC/Amex) | Standard credit card payment | ~45% of online payments |
| Debit card (Redcompra) | Bank debit card | ~30% of online payments |
| Prepaid card (MACH, Tenpo) | Digital wallet prepaid cards | Growing segment |

---

### 2.3 WebPay OneClick (Recurring Payments)

**What it is:**
WebPay OneClick is Transbank's tokenized recurring payment solution. It allows merchants to store a customer's card (via token, not actual card data) and charge it for subsequent purchases without the customer re-entering card details. This is essential for subscription-based businesses.

**Why Kitz needs it:**
Kitz workspaces offering subscription services, memberships, or recurring billing need OneClick. It also enables a smoother checkout for repeat customers.

**Technical integration:**

```typescript
import { WebpayPlus } from 'transbank-sdk';

// Step 1: Inscription -- customer authorizes card storage
async function inscribeCard(username: string, email: string, returnUrl: string) {
  const inscription = new WebpayPlus.MallInscription();
  const response = await inscription.start(username, email, returnUrl);
  return { token: response.token, urlWebpay: response.url_webpay };
}

// Step 2: After customer authorizes, confirm inscription
async function confirmInscription(token: string) {
  const inscription = new WebpayPlus.MallInscription();
  const result = await inscription.finish(token);
  return {
    tbkUser: result.tbk_user, // Store this -- used for future charges
    authorizationCode: result.authorization_code,
    cardType: result.card_type,
    cardNumber: result.card_number, // last 4 digits
  };
}

// Step 3: Charge the stored card
async function chargeStoredCard(
  tbkUser: string,
  username: string,
  buyOrder: string,
  amount: number, // CLP integer
) {
  const inscription = new WebpayPlus.MallInscription();
  const result = await inscription.authorize(
    username,
    tbkUser,
    buyOrder,
    Math.round(amount),
  );
  return {
    approved: result.response_code === 0,
    amount: result.amount,
    authorizationCode: result.authorization_code,
  };
}
```

**Implementation timeline:** Q2 2026 -- after WebPay Plus is stable.

---

### 2.4 Khipu (Bank Transfer Payments)

**What it is:**
Khipu is a Chilean fintech that enables payments via direct bank transfer. Instead of card payments, customers pay by logging into their bank's website and authorizing a transfer. Khipu acts as the intermediary, confirming the transfer to the merchant in near-real-time. It supports all major Chilean banks.

**Why Kitz needs it:**
Khipu provides a card-alternative payment method, especially valuable for:
- Customers without credit cards (common among micro-business owners).
- High-value B2B transactions where card limits are insufficient.
- Lower transaction fees compared to card payments.
- CuentaRUT holders who may not have a debit card enabled for online purchases.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Developer portal | https://khipu.com/page/api |
| API style | REST API v2 |
| Authentication | Receiver ID + Secret (per merchant) |
| Sandbox | Available for testing |
| Webhooks | POST callback on payment completion |
| Supported banks | All major Chilean banks (BancoEstado, Banco de Chile, Santander, BCI, etc.) |

**Integration pattern for Kitz:**

```typescript
// Khipu payment creation
async function createKhipuPayment(
  subject: string,
  amount: number,       // CLP integer
  currency: string,     // 'CLP'
  notifyUrl: string,    // webhook URL
  returnUrl: string,    // customer redirect after payment
  cancelUrl: string,
  transactionId: string,
) {
  const response = await fetch('https://khipu.com/api/2.0/payments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.KHIPU_SECRET}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      subject,
      amount: String(Math.round(amount)),
      currency,
      notify_url: notifyUrl,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      transaction_id: transactionId,
      body: `Pago factura Kitz #${transactionId}`,
    }),
  });
  const data = await response.json();
  return {
    paymentId: data.payment_id,
    paymentUrl: data.payment_url,  // redirect customer here
    simplifiedUrl: data.simplified_transfer_url,
    appUrl: data.app_url,
  };
}
```

**Implementation timeline:** Q2 2026 -- second priority after Transbank/WebPay.

---

### 2.5 Flow.cl (Chilean Payment Gateway)

**What it is:**
Flow.cl is a Chilean-built payment gateway that aggregates multiple payment methods: credit cards (via Transbank), bank transfers (via Khipu integration), and other local methods. It provides a unified API that simplifies multi-method payment acceptance.

**Why Kitz needs it:**
Flow.cl can serve as a single integration point for multiple Chilean payment methods, reducing the number of direct integrations Kitz needs to maintain. It also handles the complexity of Transbank's merchant onboarding for smaller merchants.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Developer portal | https://www.flow.cl/docs/api.html |
| API style | REST |
| Authentication | API key + Secret key |
| Payment methods | Cards (Transbank), bank transfer, Servipag, multicaja |
| Sandbox | Available |
| SDK | PHP (official), community wrappers for Node.js |

**Implementation timeline:** Q2-Q3 2026 -- evaluate as alternative to direct Transbank + Khipu.

---

### 2.6 Mercado Pago Chile

**What it is:**
Mercado Pago is MercadoLibre's payment platform, widely used across Latin America. In Chile, it supports card payments, bank transfers, and cash payments (via Servipag). It provides a well-documented API and SDKs for multiple languages including Node.js.

**Why Kitz needs it:**
Mercado Pago offers a familiar checkout experience for Chilean consumers who already use MercadoLibre. Its aggregator model means merchants can accept payments without a direct Transbank relationship, which is valuable for very small businesses or sole proprietors who may not qualify for a Transbank merchant account.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Developer portal | https://www.mercadopago.cl/developers |
| Node.js SDK | `mercadopago` (npm) -- official SDK |
| Authentication | Access token (OAuth 2.0) |
| Payment methods | Cards, bank transfer, Servipag cash |
| Checkout types | Checkout Pro (redirect), Checkout API (custom) |
| Sandbox | Full sandbox environment |

**Implementation timeline:** Q3 2026 -- third priority payment integration.

---

### 2.7 Digital Wallets (MACH, Tenpo, FPay)

**MACH (BCI):**
Digital wallet and prepaid Visa card issued by BCI. Users can load funds from any bank account and pay online or in-store. MACH cards work anywhere Visa is accepted, so they are automatically supported via Transbank/WebPay Plus integration.

**Tenpo:**
Digital wallet and prepaid Mastercard. Similar to MACH but issued by an independent fintech. Also works via standard card acceptance through Transbank.

**FPay (Falabella):**
Falabella's payment ecosystem, primarily for retail. Less relevant for B2B/SMB invoicing but present in the market.

**Impact on Kitz:**
No separate integration needed. MACH and Tenpo users pay with their prepaid cards through WebPay Plus. Kitz should recognize these as valid payment sources and not filter them out.

---

### 2.8 Getnet (Santander) -- Emerging Acquirer

**What it is:**
Getnet is Santander's acquiring arm, entering Chile to compete with Transbank's historical monopoly. It processes Visa and Mastercard transactions and is aggressively pursuing merchant acquisition.

**Why Kitz should monitor it:**
As Getnet gains market share, Kitz may need to support it as an alternative acquirer. For now, transactions routed through Getnet appear as standard Visa/MC transactions to the customer, so no immediate integration is needed. Monitor for API availability and merchant pricing advantages.

**Implementation timeline:** Future -- monitor market share and API availability.

---

## 3. Banking & Interbank Infrastructure

### 3.1 Banking Landscape

Chile has a well-regulated, concentrated banking sector supervised by the CMF (Comision para el Mercado Financiero). The key banks for Kitz's SMB market are:

| Bank | Relevance to Kitz | Key Products |
|---|---|---|
| **BancoEstado** | #1 for reach -- CuentaRUT (universal account), state-owned | CuentaRUT, SMB lending, Caja Vecina cash network |
| **Banco de Chile** | Largest private bank, strong SMB services | Business banking, card acquiring (via Transbank), online banking |
| **Santander Chile** | Major player, owns Getnet acquiring | Business accounts, Getnet card processing, trade finance |
| **BCI** | Strong digital presence, owns MACH wallet | MACH digital wallet, business banking, factoring |
| **Scotiabank Chile** | International bank with SMB focus | Business lending, trade finance, international transfers |
| **Itau Chile** | Growing digital banking offering | Business accounts, investment products |
| **Banco Falabella** | Retail banking, strong consumer card base | CMR Falabella card, consumer credit, FPay |

### 3.2 CuentaRUT (BancoEstado)

**What it is:**
CuentaRUT is a free, universal bank account provided by BancoEstado (state-owned bank) to every Chilean citizen and resident. It is linked to the person's RUT number (national/tax ID). Nearly 15 million accounts exist -- effectively every adult Chilean has one.

**Why Kitz needs it:**
CuentaRUT is the great equalizer for financial inclusion. When a Kitz workspace owner needs to receive a bank transfer, the customer can always pay from their CuentaRUT. This means bank transfer payments (via Khipu or manual transfer) have near-universal viability in Chile.

**Integration implications:**
- Support CuentaRUT as a transfer source in payment instructions on invoices.
- Display BancoEstado as a bank option in all bank transfer flows.
- RUT number doubles as the CuentaRUT account number -- simplify payment instructions.

### 3.3 Interbank Transfers

Chile's interbank transfer system operates through the Banco Central de Chile's LBTR (Liquidacion Bruta en Tiempo Real) for high-value transfers and the Combanc (Camara de Compensacion) for retail clearing. Key facts:

| System | Description | Relevance |
|---|---|---|
| **LBTR** | Real-time gross settlement (high value) | B2B payments above CLP 50 million |
| **Combanc** | Retail clearing house (ACH equivalent) | Standard interbank transfers |
| **TEF** (Transferencia Electronica de Fondos) | Online interbank transfer | Most common method for B2B and P2P |
| **CCA** (Camara de Compensacion Automatizada) | Batch clearing | Payroll, recurring payments |

**For Kitz:** Interbank transfers are common for B2B payments. Invoices should include clear bank transfer instructions: bank name, account type, account number, RUT of the recipient, and recipient name.

---

## 4. Government & Regulatory Bodies

### 4.1 SII (Servicio de Impuestos Internos)

**What it is:**
The SII is Chile's tax authority and one of the most technologically advanced tax administrations in Latin America. It manages taxpayer registration (RUT), electronic invoicing (DTE), tax declarations, and fiscal compliance. The SII has been issuing electronic invoices since 2003, making it a global pioneer.

**Why Kitz needs it:**
The SII is the central axis of all invoicing and tax compliance in Chile. Every DTE (electronic tax document) that Kitz generates must be submitted to and validated by the SII. The SII provides REST-based web services for DTE submission, status queries, and folio authorization.

**Key SII systems:**

| System | URL | Purpose |
|---|---|---|
| SII Portal | https://www.sii.cl/ | Tax filing, RUT management, DTE portal |
| SII DTE Web Services | https://palena.sii.cl/ (prod) / https://maullin.sii.cl/ (cert) | DTE submission and query APIs |
| SII Boleta Portal | https://www.sii.cl/boleta_electronica/ | Electronic receipt management |
| SII Digital Certificate | https://www.sii.cl/certificado_digital/ | X.509 certificate for DTE signing |

**SII Web Services -- Technical Overview:**

```
Production:    https://palena.sii.cl/rtc/RTC/RTCObtener.jhtml
Certification: https://maullin.sii.cl/cgi_dte/UPL/DTEUpload

Authentication:
  1. POST to https://palena.sii.cl/cgi_dte/UPL/DTEAuth
     -> Returns a session cookie (TOKEN)
  2. Use TOKEN cookie in all subsequent requests

Key Endpoints:
  - DTEUpload   -- Submit DTE XML envelope (Sobre de Envio)
  - DTEQuery    -- Query DTE status by folio
  - DTEDownload -- Download DTE XML
  - CAFRequest  -- Request folio authorization (CAF)
```

**SII API Authentication Flow:**

```typescript
// SII authentication -- obtain session token
async function authenticateSII(
  environment: 'certification' | 'production',
): Promise<string> {
  const baseUrl = environment === 'production'
    ? 'https://palena.sii.cl'
    : 'https://maullin.sii.cl';

  // Step 1: Get seed (semilla)
  const seedResponse = await fetch(
    `${baseUrl}/DTEWS/CrSeed.jxml`,
    { method: 'GET' },
  );
  const seedXml = await seedResponse.text();
  const seed = extractFromXml(seedXml, 'SEMILLA');

  // Step 2: Sign the seed with X.509 certificate
  const signedSeed = signWithCertificate(seed, certificate, privateKey);

  // Step 3: Exchange signed seed for token
  const tokenResponse = await fetch(
    `${baseUrl}/DTEWS/GetTokenFromSeed.jxml`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/xml' },
      body: signedSeed,
    },
  );
  const tokenXml = await tokenResponse.text();
  const token = extractFromXml(tokenXml, 'TOKEN');

  return token;
}
```

**Implementation timeline:** NOW -- prerequisite for all invoicing in Chile.

**Action items:**
1. Obtain SII digital certificate (Certificado Digital) for Kitz as a software provider.
2. Complete SII Set de Pruebas (certification test set) to become authorized DTE issuer.
3. Implement SII authentication flow (seed -> sign -> token).
4. Build DTE XML generation pipeline.
5. Implement folio management (CAF request and tracking).

---

### 4.2 RUT (Rol Unico Tributario) -- Validation

**What it is:**
The RUT is Chile's universal tax identification number, assigned to every individual and legal entity. It follows the format `XX.XXX.XXX-K` where K is a check digit (0-9 or 'K'). Unlike Colombia's RUT (same acronym), Chile's RUT has a well-defined, publicly documented check digit algorithm.

**Format:**
- Display format: `12.345.678-5` (dots as thousands separators, dash before check digit)
- Compact format: `12345678-5` (no dots)
- Raw format: `123456785` (no separators)

**Check digit algorithm (Modulo 11):**

```typescript
/**
 * Validate a Chilean RUT (Rol Unico Tributario).
 *
 * Algorithm:
 * 1. Take the numeric body (without check digit).
 * 2. Multiply each digit by a weight sequence [2, 3, 4, 5, 6, 7] cycling from right to left.
 * 3. Sum all products.
 * 4. Compute: 11 - (sum % 11).
 * 5. If result is 11 -> check digit is '0'.
 *    If result is 10 -> check digit is 'K'.
 *    Otherwise -> check digit is the result as a string.
 */
function validateChileanRUT(rut: string): {
  valid: boolean;
  formatted: string;
  compact: string;
  body: number;
  checkDigit: string;
  error?: string;
} {
  // Normalize: remove dots, spaces, trim
  let cleaned = rut.trim().replace(/\./g, '').toUpperCase();

  // Extract body and check digit
  const match = cleaned.match(/^(\d{1,8})-?([\dK])$/);
  if (!match) {
    return {
      valid: false,
      formatted: rut,
      compact: cleaned,
      body: 0,
      checkDigit: '',
      error: 'Invalid RUT format. Expected: XX.XXX.XXX-K or XXXXXXXX-K',
    };
  }

  const body = parseInt(match[1], 10);
  const providedDigit = match[2];

  // Calculate check digit using Modulo 11
  const weights = [2, 3, 4, 5, 6, 7];
  let sum = 0;
  let bodyStr = String(body);

  for (let i = bodyStr.length - 1, w = 0; i >= 0; i--, w++) {
    sum += parseInt(bodyStr[i], 10) * weights[w % weights.length];
  }

  const remainder = 11 - (sum % 11);
  let expectedDigit: string;

  if (remainder === 11) {
    expectedDigit = '0';
  } else if (remainder === 10) {
    expectedDigit = 'K';
  } else {
    expectedDigit = String(remainder);
  }

  const valid = providedDigit === expectedDigit;

  // Format with dots and dash
  const bodyFormatted = String(body).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const formatted = `${bodyFormatted}-${expectedDigit}`;
  const compact = `${body}-${expectedDigit}`;

  return {
    valid,
    formatted,
    compact,
    body,
    checkDigit: expectedDigit,
    error: valid ? undefined : `Check digit mismatch: expected '${expectedDigit}', got '${providedDigit}'`,
  };
}

// Examples:
// validateChileanRUT('12.345.678-5') -> { valid: true, formatted: '12.345.678-5', ... }
// validateChileanRUT('76.XXX.XXX-K') -> depends on actual number
// validateChileanRUT('11.111.111-1') -> { valid: true, ... } (famous test RUT)
```

**RUT types in Chile:**

| Range | Entity type | Example |
|---|---|---|
| 1.000.000 -- 49.999.999 | Natural persons (individuals) | 12.345.678-5 |
| 50.000.000 -- 59.999.999 | Foreign natural persons | 55.123.456-7 |
| 60.000.000 -- 99.999.999 | Legal entities (companies) | 76.543.210-K |

**Action items:**
1. Implement `validateChileanRUT()` in workspace onboarding.
2. Store RUT in normalized compact format (`XXXXXXXX-X`).
3. Display RUT in dotted format (`XX.XXX.XXX-X`) in UI.
4. Validate customer RUT on B2B invoice creation.
5. Cross-reference RUT with SII's public taxpayer registry for active status.

---

### 4.3 Iniciacion de Actividades (Business Registration)

**What it is:**
Iniciacion de Actividades is the formal registration of a business's economic activities with the SII. It is the Chilean equivalent of Panama's Aviso de Operacion. Every business must complete this process before issuing invoices (DTEs).

**Process:**
1. Obtain RUT (if legal entity, register at Registro Civil or through online company formation).
2. Access SII website (https://www.sii.cl/).
3. Complete Iniciacion de Actividades form online.
4. Declare economic activities (CIIU codes -- Clasificacion Industrial Internacional Uniforme).
5. Declare tax regime (Regimen General or Regimen Pro-Pyme).
6. Receive authorization to issue DTEs.

**Tax regimes for SMBs:**

| Regime | Revenue threshold | Key benefits |
|---|---|---|
| **Regimen Pro-Pyme General** | < 75,000 UF annual (~CLP 2.8B) | Simplified accounting, immediate IVA credit, accelerated depreciation |
| **Regimen Pro-Pyme Transparente** | < 75,000 UF + only individual partners | No corporate income tax -- profits taxed directly at partner level |
| **Regimen General** | No limit | Full accounting requirements, standard corporate tax rates |

**For Kitz:** Capture the workspace owner's tax regime during onboarding. This affects:
- How income tax obligations are calculated (PPM rates).
- Whether the business qualifies for simplified accounting.
- The type of tax reports Kitz needs to generate.

---

### 4.4 CMF (Comision para el Mercado Financiero)

**What it is:**
The CMF is Chile's integrated financial regulator, overseeing banks, insurance companies, securities markets, and payment systems. It was created in 2017 by merging the former SVS (Superintendencia de Valores y Seguros) and SBIF (Superintendencia de Bancos e Instituciones Financieras).

**Why Kitz needs it:**
If Kitz facilitates payments, holds customer funds, or provides financial services, it may fall under CMF supervision. Chile's 2023 Fintech Law (Ley 21.521) established a regulatory framework for fintech companies, including payment initiators and e-money issuers.

**Relevant regulations:**

| Regulation | Description | Impact on Kitz |
|---|---|---|
| Ley 21.521 (Fintech Law) | Regulates fintech activities including payment services | Determines if Kitz needs a CMF license |
| Open Finance regulations | Mandates data sharing between financial institutions | Future opportunity for bank feed integration |
| AML/KYC requirements | Anti-money laundering and customer identification | KYC for workspace owners processing payments |

**Implementation timeline:** NOW -- legal assessment required before payment features launch.

**Action items:**
1. Engage a Chilean fintech attorney to assess CMF licensing requirements.
2. Determine if Kitz's payment facilitation model falls under Ley 21.521.
3. Implement KYC verification for payment-enabled workspaces.
4. Monitor Open Finance regulation timeline for bank feed opportunities.

---

## 5. Invoice Compliance

### 5.1 DTE (Documento Tributario Electronico) System

Chile's DTE system is the most mature electronic invoicing system in Latin America. All businesses must issue electronic tax documents since 2014 (started voluntary in 2003). The system uses XML documents with X.509 digital signatures, validated by the SII.

**DTE document types:**

| Code | Type | Spanish name | Kitz mapping |
|---|---|---|---|
| **33** | Invoice | Factura Electronica | Standard B2B invoice (`invoice_create`) |
| **34** | Exempt Invoice | Factura Exenta Electronica | Invoice without IVA |
| **39** | Receipt | Boleta Electronica | B2C receipt (consumer sales) |
| **41** | Exempt Receipt | Boleta Exenta Electronica | B2C receipt without IVA |
| **52** | Dispatch Guide | Guia de Despacho Electronica | Shipping/delivery document |
| **56** | Debit Note | Nota de Debito Electronica | Price increase, interest charges |
| **61** | Credit Note | Nota de Credito Electronica | Returns, discounts, corrections |

**DTE lifecycle:**

```
+------------------+     +------------------+     +------------------+
|  1. Generate DTE |---->|  2. Sign DTE     |---->|  3. Submit to    |
|  XML document    |     |  (X.509 cert)    |     |  SII via API     |
+------------------+     +------------------+     +------------------+
                                                         |
                                                         v
+------------------+     +------------------+     +------------------+
|  6. Deliver to   |<----|  5. Store signed  |<----|  4. SII validates |
|  customer        |     |  XML (5+ years)  |     |  and accepts/    |
+------------------+     +------------------+     |  rejects         |
        |                                         +------------------+
        v
+------------------+
|  7. Customer     |
|  sends AEC       |
|  (acknowledgment)|
+------------------+
```

### 5.2 DTE XML Structure

**Full DTE XML example (Factura Electronica, Type 33):**

```xml
<?xml version="1.0" encoding="ISO-8859-1"?>
<DTE version="1.0">
  <Documento ID="T33F123">
    <!-- === ENCABEZADO (Header) === -->
    <Encabezado>
      <!-- Document identification -->
      <IdDoc>
        <TipoDTE>33</TipoDTE>                    <!-- Document type: 33 = Factura -->
        <Folio>123</Folio>                        <!-- Folio number (from CAF) -->
        <FchEmis>2026-02-24</FchEmis>             <!-- Issue date -->
        <FmaPago>1</FmaPago>                      <!-- Payment method: 1=Contado, 2=Credito -->
        <FchVenc>2026-03-26</FchVenc>             <!-- Due date (if credit) -->
      </IdDoc>

      <!-- Issuer (Emisor) -->
      <Emisor>
        <RUTEmisor>76543210-K</RUTEmisor>         <!-- Issuer RUT -->
        <RznSoc>Mi Empresa SpA</RznSoc>           <!-- Legal name -->
        <GiroEmis>Servicios de Software</GiroEmis> <!-- Business activity -->
        <Acteco>620100</Acteco>                   <!-- CIIU code -->
        <DirOrigen>Av. Providencia 1234</DirOrigen>
        <CmnaOrigen>Providencia</CmnaOrigen>       <!-- Comuna (municipality) -->
        <CiudadOrigen>Santiago</CiudadOrigen>
      </Emisor>

      <!-- Receiver (Receptor) -->
      <Receptor>
        <RUTRecep>12345678-5</RUTRecep>           <!-- Receiver RUT -->
        <RznSocRecep>Cliente S.A.</RznSocRecep>   <!-- Receiver legal name -->
        <GiroRecep>Comercio</GiroRecep>            <!-- Receiver activity -->
        <DirRecep>Calle Huerfanos 567</DirRecep>
        <CmnaRecep>Santiago</CmnaRecep>
        <CiudadRecep>Santiago</CiudadRecep>
      </Receptor>

      <!-- Totals -->
      <Totales>
        <MntNeto>100000</MntNeto>                  <!-- Net amount (CLP integer) -->
        <TasaIVA>19</TasaIVA>                      <!-- IVA rate (19%) -->
        <IVA>19000</IVA>                           <!-- IVA amount -->
        <MntTotal>119000</MntTotal>                <!-- Total amount -->
      </Totales>
    </Encabezado>

    <!-- === DETALLE (Line Items) === -->
    <Detalle>
      <NroLinDet>1</NroLinDet>                     <!-- Line number -->
      <NmbItem>Servicio de consultoria</NmbItem>   <!-- Item description -->
      <QtyItem>10</QtyItem>                        <!-- Quantity -->
      <PrcItem>10000</PrcItem>                     <!-- Unit price (CLP integer) -->
      <MontoItem>100000</MontoItem>                <!-- Line total -->
    </Detalle>

    <!-- === TIMBRE ELECTRONICO (Digital Stamp) === -->
    <TED version="1.0">
      <DD>
        <RE>76543210-K</RE>                        <!-- Issuer RUT -->
        <TD>33</TD>                                <!-- Document type -->
        <F>123</F>                                 <!-- Folio -->
        <FE>2026-02-24</FE>                        <!-- Issue date -->
        <RR>12345678-5</RR>                        <!-- Receiver RUT -->
        <RSR>Cliente S.A.</RSR>                    <!-- Receiver name -->
        <MNT>119000</MNT>                          <!-- Total amount -->
        <IT1>Servicio de consultoria</IT1>          <!-- First item description -->
        <CAF version="1.0">
          <!-- CAF XML content (folio authorization) -->
          <DA>
            <RE>76543210-K</RE>
            <RS>Mi Empresa SpA</RS>
            <TD>33</TD>
            <RNG><D>1</D><H>200</H></RNG>          <!-- Authorized folio range -->
            <FA>2026-01-15</FA>                    <!-- Authorization date -->
            <RSAPK><!-- SII public key --></RSAPK>
            <IDK>100</IDK>
          </DA>
          <FRMA algoritmo="SHA1withRSA">
            <!-- SII signature of the CAF -->
          </FRMA>
        </CAF>
        <TSTED>2026-02-24T10:30:00</TSTED>         <!-- Timestamp -->
      </DD>
      <FRMT algoritmo="SHA1withRSA">
        <!-- Digital stamp signature -->
      </FRMT>
    </TED>

    <!-- === DOCUMENT SIGNATURE === -->
    <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
      <!-- X.509 XML Digital Signature -->
    </ds:Signature>
  </Documento>
</DTE>
```

### 5.3 CAF (Codigo de Autorizacion de Folios) Management

**What it is:**
The CAF is an XML file issued by the SII that authorizes a range of folio numbers for a specific DTE type. Before issuing any DTE, the business must request a CAF from the SII. The CAF contains the authorized folio range, the SII's public key, and a digital signature.

**How it works:**

```
+------------------+     +------------------+     +------------------+
| Request CAF from |---->| SII authorizes   |---->| Kitz stores CAF  |
| SII (per DTE     |     | folio range      |     | XML securely     |
| type)            |     | (e.g., 1-200)    |     | per workspace    |
+------------------+     +------------------+     +------------------+
                                                         |
                                                         v
                                                  +------------------+
                                                  | Kitz assigns     |
                                                  | folios from CAF  |
                                                  | range as DTEs    |
                                                  | are created      |
                                                  +------------------+
                                                         |
                                                         v
                                                  +------------------+
                                                  | When range is    |
                                                  | nearly exhausted |
                                                  | -> auto-request  |
                                                  | new CAF          |
                                                  +------------------+
```

**TypeScript implementation for folio management:**

```typescript
interface CAFData {
  rut: string;          // Issuer RUT
  dteType: number;      // DTE type (33, 34, 39, 41, 56, 61)
  rangeStart: number;   // First authorized folio
  rangeEnd: number;     // Last authorized folio
  nextFolio: number;    // Next folio to assign
  authDate: string;     // Authorization date
  cafXml: string;       // Raw CAF XML (needed for TED/Timbre)
  privateKey: string;   // RSA private key from CAF
}

class FolioManager {
  private cafStore: Map<string, CAFData> = new Map();

  private cafKey(rut: string, dteType: number): string {
    return `${rut}:${dteType}`;
  }

  /**
   * Get next available folio for a DTE type.
   * Throws if no folios are available (CAF exhausted).
   */
  getNextFolio(rut: string, dteType: number): {
    folio: number;
    cafXml: string;
    needsRefresh: boolean;
  } {
    const key = this.cafKey(rut, dteType);
    const caf = this.cafStore.get(key);

    if (!caf) {
      throw new Error(
        `No CAF found for RUT ${rut}, DTE type ${dteType}. ` +
        `Request a CAF from SII first.`
      );
    }

    if (caf.nextFolio > caf.rangeEnd) {
      throw new Error(
        `CAF exhausted for RUT ${rut}, DTE type ${dteType}. ` +
        `Range ${caf.rangeStart}-${caf.rangeEnd} fully used. ` +
        `Request a new CAF from SII.`
      );
    }

    const folio = caf.nextFolio;
    caf.nextFolio++;

    // Alert if less than 20% of folios remain
    const totalFolios = caf.rangeEnd - caf.rangeStart + 1;
    const remaining = caf.rangeEnd - caf.nextFolio + 1;
    const needsRefresh = remaining / totalFolios < 0.2;

    return { folio, cafXml: caf.cafXml, needsRefresh };
  }

  /**
   * Register a new CAF (received from SII).
   */
  registerCAF(caf: CAFData): void {
    const key = this.cafKey(caf.rut, caf.dteType);
    this.cafStore.set(key, { ...caf, nextFolio: caf.rangeStart });
  }

  /**
   * Get folio usage statistics.
   */
  getStats(rut: string, dteType: number): {
    total: number;
    used: number;
    remaining: number;
    percentUsed: number;
  } | null {
    const key = this.cafKey(rut, dteType);
    const caf = this.cafStore.get(key);
    if (!caf) return null;

    const total = caf.rangeEnd - caf.rangeStart + 1;
    const used = caf.nextFolio - caf.rangeStart;
    const remaining = total - used;

    return {
      total,
      used,
      remaining,
      percentUsed: Math.round((used / total) * 100),
    };
  }
}
```

### 5.4 IVA (Impuesto al Valor Agregado)

Chile's IVA is one of the simpler VAT systems in Latin America: a single standard rate with exemptions.

**Tax rates:**

| Rate | Application |
|---|---|
| **19%** | Standard rate -- applies to most goods and services |
| **0% (Exempt)** | Health services, education, residential rent, financial services, public transport |
| **0% (Export)** | Exports of goods and services (zero-rated, with IVA credit recovery) |

**Current Kitz implementation issue:**
The `invoice_create` tool defaults to `tax_rate ?? 0.07` (Panama's 7% ITBMS). For Chile, this must be `0.19`. The tax rate must be configurable per workspace based on country.

**Required enhancements:**

```typescript
// Country-aware tax defaults
const TAX_DEFAULTS: Record<string, { rate: number; name: string; display: string }> = {
  PA: { rate: 0.07, name: 'ITBMS', display: 'ITBMS (7%)' },
  CL: { rate: 0.19, name: 'IVA',   display: 'IVA (19%)' },
  CO: { rate: 0.19, name: 'IVA',   display: 'IVA (19%)' },
  MX: { rate: 0.16, name: 'IVA',   display: 'IVA (16%)' },
};

interface ChileanLineItem {
  description: string;
  quantity: number;
  unitPrice: number;          // CLP integer
  taxCategory: 'standard' | 'exempt' | 'export';
  // No need for per-item rate -- Chile is always 19% or 0%
}
```

**IVA filing obligations:**
- Monthly IVA declaration (Formulario 29 or F29) due by the 12th of each month.
- Libro de Compras y Ventas (Purchase and Sales Ledger) is auto-generated by SII from DTEs -- no manual ledger needed.
- PPM (Pagos Provisionales Mensuales) -- monthly provisional income tax payments, filed with the same F29.

### 5.5 Sobre de Envio (Submission Envelope)

DTEs are submitted to the SII wrapped in a "Sobre de Envio" (submission envelope). The envelope can contain one or more DTEs in a single XML document.

**Envelope structure:**

```xml
<?xml version="1.0" encoding="ISO-8859-1"?>
<EnvioDTE version="1.0">
  <SetDTE ID="SetDoc">
    <Caratula version="1.0">
      <RutEmisor>76543210-K</RutEmisor>
      <RutEnvia>12345678-5</RutEnvia>       <!-- RUT of person submitting -->
      <RutReceptor>60803000-K</RutReceptor> <!-- SII's RUT for submissions -->
      <FchResol>2026-01-15</FchResol>       <!-- Resolution date -->
      <NroResol>0</NroResol>                 <!-- Resolution number (0 for cert) -->
      <TmstFirmaEnv>2026-02-24T10:30:00</TmstFirmaEnv>
      <SubTotDTE>
        <TpoDTE>33</TpoDTE>                  <!-- DTE type -->
        <NroDTE>1</NroDTE>                   <!-- Count of DTEs of this type -->
      </SubTotDTE>
    </Caratula>

    <!-- One or more DTE documents -->
    <DTE version="1.0">
      <!-- ... full DTE XML as shown in 5.2 ... -->
    </DTE>
  </SetDTE>

  <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
    <!-- Envelope signature -->
  </ds:Signature>
</EnvioDTE>
```

### 5.6 Set de Pruebas (Certification Test Set)

Before going live with DTE issuance, the SII requires completion of a Set de Pruebas (test set). This involves:

1. **Receiving test cases from SII** -- a set of invoices, credit notes, debit notes, etc. with specific amounts and scenarios.
2. **Generating DTEs for each test case** -- using the certification environment.
3. **Submitting the test DTEs** to `maullin.sii.cl`.
4. **SII reviews and approves** -- if all test cases pass, the business is authorized for production DTE issuance.

**Test set categories:**
- Facturas with IVA
- Facturas exentas (exempt)
- Notas de credito (full and partial)
- Notas de debito
- Mixed scenarios (items with different tax treatments)

**Action items:**
1. Download Set de Pruebas from SII certification portal.
2. Build automated test suite that generates DTEs for each test case.
3. Submit and iterate until SII approves.
4. Document the certification process for future reference.

### 5.7 Cesion Electronica (Electronic Factoring)

**What it is:**
Cesion Electronica allows businesses to electronically assign (cede) their invoices to a factoring company or financial institution. This is Chile's electronic factoring system, enabling SMBs to get immediate cash for outstanding invoices.

**Why Kitz needs it:**
Many Chilean SMBs use factoring to manage cash flow. Kitz should support generating the AEC (Archivo Electronico de Cesion) that facilitates electronic assignment of invoices.

**Implementation timeline:** Q3 2026 -- after core DTE issuance is stable.

---

## 6. Payment Flow Architecture

### 6.1 End-to-End Payment Flow (Chile)

```
                          PAYMENT INITIATION
                          ==================

  Kitz Workspace Owner                    Customer
        |                                    |
        |  Creates DTE (invoice_create)     |
        |  with line items + IVA (19%)      |
        |                                    |
        v                                    |
  +-----------+                              |
  | DTE XML   | -- Submit to SII ---------> | SII validates + assigns trackId
  | Generated |    (Sobre de Envio)          |
  | + Signed  |                              |
  +-----------+                              |
        |                                    |
        |  Sends PDF + XML via email         |
        |  or WhatsApp                       |
        v                                    v
  +-----------+                        +-----------+
  | Payment   | <-- Customer chooses   | Customer  |
  | Options   |     payment method --> | Selects   |
  +-----------+                        +-----------+
        |                                    |
        +--- WebPay Plus (card) ------+      |
        |                             |      |
        +--- Khipu (bank transfer) ---+      |
        |                             |      |
        +--- Mercado Pago ------------+      |
        |                             |      |
        +--- Manual bank transfer ----+      |
        |                             v      |
        |                       +-----------+|
        |                       | Payment   ||
        |                       | Processed ||
        |                       +-----------+|
        |                             |      |
        v                             v      |
  +-----------+               +-----------+  |
  | Webhook/  | <-- Provider  | Provider  |  |
  | Return    |    callback   | Confirms  |  |
  | URL       |               +-----------+  |
  +-----------+                              |
        |                                    |
        v                                    |
  +---------------------+                   |
  | payments_process    |                   |
  | Webhook             |                   |
  | (paymentTools.ts)   |                   |
  +---------------------+                   |
        |                                    |
        +-- DTE status -> 'paid'            |
        +-- CRM contact -> payment recorded  |
        +-- Email/WhatsApp receipt --------->|
        +-- Revenue dashboard updated        |
        +-- IVA ledger updated (F29 prep)    |
```

### 6.2 Webhook Processing for Chilean Providers

The existing `payments_processWebhook` in `paymentTools.ts` needs extension for Chilean providers:

```typescript
// Extended provider enum for Chile
provider: {
  type: 'string',
  enum: ['stripe', 'paypal', 'yappy', 'bac', 'transbank', 'webpay', 'khipu', 'flow', 'mercadopago'],
  description: 'Payment provider',
}

// Chile-specific webhook normalization
function normalizeChileanWebhook(
  provider: string,
  rawPayload: Record<string, unknown>,
): {
  transactionId: string;
  amount: number;         // CLP integer
  currency: 'CLP';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  cardLast4?: string;
  installments?: number;
  paymentMethod?: string;
} {
  switch (provider) {
    case 'transbank':
    case 'webpay': {
      return {
        transactionId: String(rawPayload.buy_order),
        amount: Number(rawPayload.amount),
        currency: 'CLP',
        status: rawPayload.response_code === 0 ? 'completed' : 'failed',
        cardLast4: String(rawPayload.card_detail?.card_number ?? ''),
        installments: Number(rawPayload.installments_number ?? 0),
        paymentMethod: String(rawPayload.payment_type_code ?? 'VD'),
      };
    }
    case 'khipu': {
      return {
        transactionId: String(rawPayload.payment_id),
        amount: Number(rawPayload.amount),
        currency: 'CLP',
        status: rawPayload.status === 'done' ? 'completed' : 'pending',
        paymentMethod: 'bank_transfer',
      };
    }
    case 'flow': {
      return {
        transactionId: String(rawPayload.flowOrder),
        amount: Number(rawPayload.amount),
        currency: 'CLP',
        status: rawPayload.status === 2 ? 'completed' : 'failed',
        paymentMethod: String(rawPayload.paymentData?.media ?? 'unknown'),
      };
    }
    case 'mercadopago': {
      return {
        transactionId: String(rawPayload.id),
        amount: Number(rawPayload.transaction_amount),
        currency: 'CLP',
        status: rawPayload.status === 'approved' ? 'completed' : 'pending',
        paymentMethod: String(rawPayload.payment_method_id ?? 'unknown'),
      };
    }
    default:
      throw new Error(`Unknown Chilean provider: ${provider}`);
  }
}
```

### 6.3 Multi-Provider Strategy (Chile)

```
Priority 1 (Now):     Transbank/WebPay Plus  -- ~75% of online payments
Priority 2 (Q2 2026): Khipu                  -- Bank transfers, high-value B2B
Priority 3 (Q3 2026): Mercado Pago           -- Aggregator, small merchants
Priority 4 (Q3 2026): Flow.cl                -- Unified gateway alternative
Priority 5 (Future):  Getnet                 -- Monitor as Transbank alternative
```

---

## 7. Currency & Localization

### 7.1 Currency -- CLP (Peso Chileno)

| Aspect | Detail |
|---|---|
| Official currency | Peso chileno (CLP) |
| ISO code | CLP |
| Symbol | $ (same as USD -- context determines meaning) |
| Decimal places | **ZERO** -- CLP is an integer-only currency |
| Coins | $1, $5, $10, $50, $100, $500 |
| Banknotes | $1.000, $2.000, $5.000, $10.000, $20.000 |

**Critical implementation issue:**
Kitz's `invoiceQuoteTools.ts` uses `toFixed(2)` extensively for currency formatting. This is incorrect for CLP. Amounts must be whole integers with no decimal places.

**Required changes:**

```typescript
// Currency formatting by country
interface CurrencyConfig {
  code: string;
  symbol: string;
  decimals: number;
  thousandsSep: string;
  decimalSep: string;
  format: (amount: number) => string;
}

const CURRENCY_CONFIGS: Record<string, CurrencyConfig> = {
  USD: {
    code: 'USD',
    symbol: '$',
    decimals: 2,
    thousandsSep: ',',
    decimalSep: '.',
    format: (amount) => `$${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`,
    // Example: $1,234.56
  },
  CLP: {
    code: 'CLP',
    symbol: '$',
    decimals: 0,
    thousandsSep: '.',
    decimalSep: '',  // No decimals
    format: (amount) => {
      const rounded = Math.round(amount);
      return `$${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
    },
    // Example: $1.234.567
  },
};

// Usage in invoice generation
function formatAmount(amount: number, countryCode: string): string {
  const config = CURRENCY_CONFIGS[countryCode === 'CL' ? 'CLP' : 'USD'];
  return config.format(amount);
}

// Examples:
// formatAmount(15000, 'CL')   -> '$15.000'
// formatAmount(1234567, 'CL') -> '$1.234.567'
// formatAmount(15000, 'PA')   -> '$15,000.00'
```

### 7.2 UF (Unidad de Fomento) -- Inflation-Indexed Unit

**What it is:**
The UF is a unique Chilean financial unit that is adjusted daily for inflation based on the CPI (IPC - Indice de Precios al Consumidor). It is widely used for real estate transactions, mortgage payments, insurance, contracts, and certain tax calculations. As of February 2026, 1 UF is approximately CLP 37,500 (this changes daily).

**Why Kitz needs it:**
- The Regimen Pro-Pyme threshold is defined in UF (75,000 UF).
- Many B2B contracts and rental agreements are denominated in UF.
- Tax penalties and thresholds are often stated in UF or UTM.
- Kitz workspaces may need to issue invoices in UF and show the CLP equivalent.

**UF conversion implementation:**

```typescript
/**
 * UF (Unidad de Fomento) conversion service.
 *
 * The daily UF value is published by the Banco Central de Chile
 * and the SII. Values are set for each day of the month and
 * published in advance (the 10th of each month through the 9th
 * of the next month).
 *
 * Source API: https://si3.bcentral.cl/SieteRestWS/SieteRestWS.ashx
 * Alternative: https://www.sii.cl/valores_y_fechas/uf/uf2026.htm
 */

interface UFValue {
  date: string;    // YYYY-MM-DD
  value: number;   // CLP per 1 UF (e.g., 37543.21)
}

class UFConverter {
  private cache: Map<string, number> = new Map();

  /**
   * Fetch UF value from Banco Central API.
   */
  async getUFValue(date: string): Promise<number> {
    if (this.cache.has(date)) {
      return this.cache.get(date)!;
    }

    // Banco Central de Chile REST API
    const url = new URL('https://si3.bcentral.cl/SieteRestWS/SieteRestWS.ashx');
    url.searchParams.set('user', process.env.BCCH_API_USER ?? '');
    url.searchParams.set('pass', process.env.BCCH_API_PASS ?? '');
    url.searchParams.set('firstdate', date);
    url.searchParams.set('lastdate', date);
    url.searchParams.set('timeseries', 'F073.UFF.PRE.Z.D');
    url.searchParams.set('function', 'GetSeries');

    const response = await fetch(url.toString());
    const data = await response.json();

    const value = parseFloat(data?.Series?.Obs?.[0]?.value ?? '0');
    if (value > 0) {
      this.cache.set(date, value);
    }

    return value;
  }

  /**
   * Convert UF to CLP.
   */
  async ufToCLP(ufAmount: number, date?: string): Promise<number> {
    const targetDate = date ?? new Date().toISOString().slice(0, 10);
    const ufValue = await this.getUFValue(targetDate);
    return Math.round(ufAmount * ufValue); // CLP is integer
  }

  /**
   * Convert CLP to UF.
   */
  async clpToUF(clpAmount: number, date?: string): Promise<number> {
    const targetDate = date ?? new Date().toISOString().slice(0, 10);
    const ufValue = await this.getUFValue(targetDate);
    return parseFloat((clpAmount / ufValue).toFixed(4)); // UF has 4 decimal places
  }
}

// Usage example:
// const converter = new UFConverter();
// const clp = await converter.ufToCLP(75000); // Pro-Pyme threshold
// console.log(`75,000 UF = $${clp.toLocaleString('es-CL')} CLP`);
// -> "75,000 UF = $2.815.740.000 CLP" (approximately)
```

### 7.3 UTM (Unidad Tributaria Mensual)

**What it is:**
The UTM is a tax calculation unit updated monthly, used by the SII for fines, thresholds, and tax brackets. Unlike UF (daily), UTM changes only once per month.

**Current value (approx):** CLP 66,000 (February 2026).

**Relevance to Kitz:**
- Tax penalties are expressed in UTM.
- Some SMB thresholds reference UTM.
- Kitz should display UTM values when showing tax-related notifications.

### 7.4 Number & Date Format

| Context | Format | Example |
|---|---|---|
| Currency (CLP) | $X.XXX (dot thousands, no decimals) | $1.234.567 |
| UF | X.XXX,XXXX (dot thousands, comma decimals, 4 places) | 37.543,2100 |
| Date (user-facing) | DD-MM-YYYY or DD/MM/YYYY | 24-02-2026 |
| Date (DTE XML) | YYYY-MM-DD | 2026-02-24 |
| Date (internal ISO 8601) | YYYY-MM-DDTHH:mm:ssZ | 2026-02-24T15:30:00Z |
| Percentage | XX% | 19% |

### 7.5 Phone Numbers

| Aspect | Detail |
|---|---|
| Country code | +56 |
| Mobile format | +56 9 XXXX XXXX (9 digits, starts with 9) |
| Landline (Santiago) | +56 2 XXXX XXXX (8 digits after area code 2) |
| Landline (regions) | +56 XX XXX XXXX (varies by region) |
| WhatsApp format | 569XXXXXXXX (no + or spaces, for WhatsApp API) |

**Validation regex:**

```typescript
// Chilean mobile number
const CHILE_MOBILE = /^\+?56\s?9\s?\d{4}\s?\d{4}$/;

// Chilean landline (Santiago)
const CHILE_LANDLINE_SCL = /^\+?56\s?2\s?\d{4}\s?\d{4}$/;

// WhatsApp-ready format
function toWhatsAppFormat(phone: string): string {
  return phone.replace(/[\s\-\+]/g, ''); // "+56 9 1234 5678" -> "56912345678"
}

// Validate and normalize Chilean phone
function validateChileanPhone(phone: string): {
  valid: boolean;
  type: 'mobile' | 'landline' | 'unknown';
  normalized: string;
  whatsapp: string;
} {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  const withCode = cleaned.startsWith('+56') ? cleaned
    : cleaned.startsWith('56') ? `+${cleaned}`
    : `+56${cleaned}`;

  if (CHILE_MOBILE.test(withCode)) {
    return {
      valid: true,
      type: 'mobile',
      normalized: withCode,
      whatsapp: withCode.replace(/[\s\-\+]/g, ''),
    };
  }

  if (CHILE_LANDLINE_SCL.test(withCode)) {
    return {
      valid: true,
      type: 'landline',
      normalized: withCode,
      whatsapp: '',
    };
  }

  return { valid: false, type: 'unknown', normalized: withCode, whatsapp: '' };
}
```

### 7.6 Address Format

Chile has a well-structured address system with standardized street names, numbers, and postal codes (though postal codes are not commonly used in daily commerce).

**Standard format:**
```
{Calle} {Numero}, {Departamento/Oficina} {Number}
{Comuna}
{Region}, Chile
```

**Example:**
```
Av. Providencia 1234, Oficina 501
Providencia
Region Metropolitana, Chile
```

**Administrative divisions:**
- Chile has 16 regions (regiones).
- Regions are divided into comunas (municipalities).
- The comuna is critical for DTE XML (`CmnaOrigen`, `CmnaRecep`).

### 7.7 Language

- All Kitz UI for Chile: Spanish (Chilean variant).
- Invoice templates should use DTE-standard terminology:
  - `Factura Electronica` (not just `Factura`)
  - `Boleta Electronica` (for B2C receipts)
  - `Nota de Credito` / `Nota de Debito`
  - `IVA` (not `Impuesto` generically)
  - `Neto` (net/subtotal before IVA)
  - `Total` (final amount including IVA)
- Legal and tax terms must match SII's official terminology.

---

## 8. Competitive Landscape

### 8.1 Direct Competitors (Chile SMB Software)

| Competitor | Strengths | Weaknesses | Kitz Differentiator |
|---|---|---|---|
| **Bsale** | Dominant Chilean SMB billing, native SII integration, POS system, inventory | No AI, limited CRM, no WhatsApp-native experience, billing-focused only | Kitz is AI-native, full business OS, WhatsApp-integrated |
| **Nubox** | Strong accounting + billing for SMBs, SII-compliant, affordable | Accounting-focused (not a business OS), no AI, traditional UI | Kitz offers AI automation, CRM, content -- not just accounting |
| **Defontana** | Full ERP, SII-compliant, established brand, multi-module | Enterprise-oriented, complex UI, expensive for micro businesses, heavy onboarding | Kitz is lightweight, mobile-first, designed for micro/small businesses |
| **Haulmer** | SII-certified DTE provider, electronic billing focus | Narrow feature set (billing only), no CRM or AI | Kitz provides full business operating system |
| **Alegra Chile** | LatAm-wide platform, cloud-based, affordable, SII integration | Generic LatAm approach -- not Chile-specialized, limited AI | Kitz is Chile-aware from the start, AI-native |
| **Facele** | SII-certified DTE provider, bulk invoicing | Infrastructure/API provider, not end-user focused | Potential integration partner rather than competitor |

### 8.2 Kitz's Competitive Advantages for Chile

1. **AI-native operating system:** No other Chilean SMB tool offers AI-powered content creation, automated customer communication, and intelligent business automation. Bsale and Nubox are traditional billing/accounting tools.
2. **WhatsApp-first:** Chilean SMBs heavily use WhatsApp for customer communication. Kitz treats WhatsApp as a core business channel, not an afterthought.
3. **Chile-aware localization:** CLP integer handling, UF conversion, SII DTE compliance, RUT validation, Chilean tax calendar -- built in from day one.
4. **All-in-one:** CRM + invoicing (DTE) + payments + content + WhatsApp in a single platform, replacing Bsale + a CRM + a WhatsApp tool + a content tool (4+ separate subscriptions).
5. **Pro-Pyme focused pricing:** Designed for the Chilean Pro-Pyme segment (revenue < 75,000 UF), where affordability and simplicity matter.
6. **Mature DTE model:** Chile's DTE system is the most mature in LatAm. A solid Chile implementation becomes the template for other countries.

---

## 9. Implementation Roadmap

### Phase 1: Foundation (NOW -- Q1 2026)

| Priority | Task | Owner | Status |
|---|---|---|---|
| P0 | Legal assessment: CMF licensing under Ley 21.521 | Legal | Not started |
| P0 | SII digital certificate acquisition | Engineering | Not started |
| P0 | RUT validation (Modulo 11 algorithm) in workspace onboarding | Engineering | Not started |
| P0 | CLP integer currency handling (remove `toFixed(2)` for Chile) | Engineering | Not started |
| P1 | Transbank WebPay Plus SDK integration (Integration env) | Engineering | Not started |
| P1 | DTE XML generation for Factura (type 33) and Boleta (type 39) | Engineering | Not started |
| P1 | IVA 19% as default tax rate for Chilean workspaces | Engineering | Not started |
| P1 | SII authentication flow (seed -> sign -> token) | Engineering | Not started |
| P1 | CAF (folio) management system | Engineering | Not started |

### Phase 2: Compliance & Payment (Q2 2026)

| Priority | Task | Owner | Status |
|---|---|---|---|
| P0 | Complete SII Set de Pruebas (certification) | Engineering | Blocked by Phase 1 |
| P0 | DTE submission to SII via Sobre de Envio | Engineering | Blocked by Phase 1 |
| P0 | Transbank production go-live | Engineering | Blocked by Phase 1 |
| P1 | Khipu bank transfer integration | Engineering | Not started |
| P1 | DTE-to-payment linking (auto-mark paid) | Engineering | Not started |
| P1 | Timbre Electronico (TED) generation and PDF rendering | Engineering | Not started |
| P1 | UF/CLP conversion service | Engineering | Not started |
| P2 | Credit Note (type 61) and Debit Note (type 56) support | Engineering | Not started |
| P2 | F29 IVA pre-filing report generation | Engineering | Not started |

### Phase 3: Growth & Optimization (Q3 2026)

| Priority | Task | Owner | Status |
|---|---|---|---|
| P1 | Mercado Pago integration | Engineering | Not started |
| P1 | Flow.cl evaluation and potential integration | Engineering | Not started |
| P1 | WebPay OneClick (recurring payments) | Engineering | Not started |
| P2 | Cesion Electronica (electronic factoring) support | Engineering | Not started |
| P2 | Guia de Despacho (type 52) support | Engineering | Not started |
| P2 | Bank feed import for reconciliation | Engineering | Not started |
| P3 | Multi-sucursal (multi-branch) DTE management | Engineering | Not started |
| P3 | Automatic CAF renewal when folios run low | Engineering | Not started |

### Phase 4: Future

| Priority | Task | Owner | Status |
|---|---|---|---|
| P2 | Getnet integration (when API available) | Engineering | Not started |
| P2 | Open Finance integration (CMF mandated data sharing) | Engineering | Not started |
| P3 | Boleta Electronica for B2C retail workspaces | Engineering | Not started |
| P3 | SII Libro de Compras y Ventas analytics | Engineering | Not started |
| P3 | Multi-currency support (UF-denominated invoices) | Engineering | Not started |
| P3 | SERNAC (consumer protection) compliance for e-commerce | Legal | Not started |

---

## 10. Compliance Checklist for Launch

Before Kitz can process payments and generate DTEs in Chile, the following must be verified:

### Legal & Regulatory

- [ ] CMF licensing assessment completed -- determination of whether Kitz needs a fintech license under Ley 21.521
- [ ] Privacy policy updated for Chilean data protection requirements (Ley 19.628)
- [ ] Terms of service reviewed by Chilean attorney
- [ ] AML/KYC policy documented and implemented (UAF -- Unidad de Analisis Financiero)
- [ ] SII authorization as DTE issuer obtained (Set de Pruebas completed)

### Tax Compliance

- [ ] IVA calculation at 19% implemented as default for Chilean workspaces
- [ ] IVA-exempt categories correctly identified and handled (Factura Exenta, type 34)
- [ ] DTE folio numbering is sequential, per-workspace, per-DTE-type, gap-free
- [ ] RUT validation (Modulo 11) implemented for workspace owners
- [ ] RUT validation implemented for invoice recipients (B2B)
- [ ] Timbre Electronico (TED) correctly generated and embedded in DTEs
- [ ] CAF management operational (request, store, track, auto-renew)

### DTE (Electronic Invoicing)

- [ ] XML generation follows SII DTE schema specification
- [ ] X.509 digital signature integration functional
- [ ] Sobre de Envio (submission envelope) correctly structured
- [ ] SII web service integration tested (certification and production)
- [ ] DTE XML archive infrastructure in place (6+ years retention per SII)
- [ ] Factura (33), Factura Exenta (34), and Boleta (39) types supported
- [ ] Credit Note (61) and Debit Note (56) types supported
- [ ] PDF representation of DTE with Timbre Electronico barcode generated

### Payment Processing

- [ ] Transbank WebPay Plus merchant agreement active
- [ ] WebPay return URL handler tested end-to-end
- [ ] CLP integer amounts enforced (no decimals sent to payment providers)
- [ ] Payment-to-DTE linking functional (auto-mark paid)
- [ ] Transaction data retention policy (5+ years) implemented
- [ ] Installment payment (cuotas) selection supported

### User Experience

- [ ] Workspace onboarding captures: business name (Razon Social), RUT, Giro (business activity), CIIU code, comuna, region
- [ ] Currency displayed as `$X.XXX` (dot as thousands separator, no decimals for CLP)
- [ ] UF values displayed where relevant (thresholds, contracts)
- [ ] Dates displayed as DD-MM-YYYY in UI
- [ ] Phone numbers validated for Chilean format (+56 9 XXXX XXXX)
- [ ] All UI text in Spanish (Chilean variant)
- [ ] DTE document types correctly labeled (Factura Electronica, Boleta, Nota de Credito, etc.)

---

## 11. Partnership Opportunities

### 11.1 Strategic Partnerships

| Partner | Type | Value to Kitz | Approach |
|---|---|---|---|
| **Transbank** | Payment infrastructure | WebPay Plus integration, card acceptance, installment payments | Developer program, merchant agreement |
| **Khipu** | Payment infrastructure | Bank transfer payments, universal bank coverage | API integration, commercial partnership |
| **BancoEstado** | Distribution & reach | Access to CuentaRUT holders (near-universal coverage), SMB lending | Explore fintech partnership programs |
| **SII** | Tax compliance | DTE certification, API access, SMB programs | Formal registration as DTE provider |
| **CORFO** | Government support | SMB digitization programs, subsidies for tech adoption | Apply for CORFO programs, propose partnership |
| **Sercotec** | Government distribution | Access to micro-enterprise network, training programs | Co-branded digitization initiative |
| **Facele** | DTE infrastructure | Certified DTE issuance as fallback/partner | API integration for DTE processing |

### 11.2 Distribution Partnerships

| Partner | Channel | Opportunity |
|---|---|---|
| **CORFO** | Government agency | Feature Kitz in SMB digitization and productivity programs; reach Pro-Pyme businesses |
| **Sercotec** | Government agency | Recommend Kitz to micro-enterprises receiving Sercotec support (Capital Semilla, etc.) |
| **BancoEstado** | Bank branch network (400+ branches) | Bundle Kitz with CuentaRUT Emprendedor products; reach 15M+ account holders |
| **Contadores** (accountants) | Professional network | Referral program for accountants who recommend Kitz to their SMB clients |
| **CPC / Camaras de Comercio** | Business associations | Member benefit programs with Chilean chambers of commerce |
| **Startup Chile** | Startup ecosystem | Integration into Chile's startup ecosystem; referrals from accelerated startups |

---

## 12. Appendix: Reference Links

### Payment Systems
- Transbank Developers: https://www.transbankdevelopers.cl/
- Transbank Node.js SDK: https://www.npmjs.com/package/transbank-sdk
- Transbank WebPay Plus Docs: https://www.transbankdevelopers.cl/producto/webpay#webpay-plus
- Khipu API: https://khipu.com/page/api
- Flow.cl API: https://www.flow.cl/docs/api.html
- Mercado Pago Chile: https://www.mercadopago.cl/developers
- MACH (BCI): https://www.somosmach.com/
- Tenpo: https://www.tenpo.cl/

### Government & Tax
- SII Portal: https://www.sii.cl/
- SII DTE Documentation: https://www.sii.cl/factura_electronica/
- SII Digital Certificate: https://www.sii.cl/certificado_digital/
- SII UF/UTM Values: https://www.sii.cl/valores_y_fechas/uf/uf2026.htm
- SII Certification Environment: https://maullin.sii.cl/
- SII Production Environment: https://palena.sii.cl/
- CMF (Comision para el Mercado Financiero): https://www.cmfchile.cl/
- Ley 21.521 (Fintech Law): https://www.bcn.cl/leychile/navegar?idNorma=1181853
- Banco Central de Chile: https://www.bcentral.cl/
- CORFO: https://www.corfo.cl/
- Sercotec: https://www.sercotec.cl/

### Banking
- BancoEstado: https://www.bancoestado.cl/
- BancoEstado CuentaRUT: https://www.bancoestado.cl/cuentarut/
- Banco de Chile: https://www.bancochile.cl/
- Santander Chile: https://www.santander.cl/
- BCI: https://www.bci.cl/
- Scotiabank Chile: https://www.scotiabank.cl/
- Itau Chile: https://www.itau.cl/
- Banco Falabella: https://www.bancofalabella.cl/

### Regulatory References
- DTE Schema Specification: SII website -> Factura Electronica -> Documentacion Tecnica
- IVA Law (DL 825): https://www.bcn.cl/leychile/navegar?idNorma=6369
- Income Tax Law (DL 824): https://www.bcn.cl/leychile/navegar?idNorma=6368
- Ley 21.210 (Tax Modernization 2020): https://www.bcn.cl/leychile/navegar?idNorma=1142667
- Ley 21.420 (Tax reform reducing exemptions): https://www.bcn.cl/leychile/navegar?idNorma=1175400
- Ley 19.628 (Data Protection): https://www.bcn.cl/leychile/navegar?idNorma=141599
- UAF (Unidad de Analisis Financiero): https://www.uaf.cl/

### Market Intelligence
- Chile e-invoicing maturity overview: SII annual reports
- Transbank market position and competition: CMF reports
- Chilean fintech ecosystem: FinteChile (https://www.fintechile.org/)
- Pro-Pyme regime details: SII -> Regimen Tributario Pro-Pyme

### Kitz Codebase References
- Payment tools: `kitz_os/src/tools/paymentTools.ts`
- Invoice/quote tools: `kitz_os/src/tools/invoiceQuoteTools.ts`
- Invoice workflow: `kitz_os/data/n8n-workflows/invoice-auto-generate.json`

---

## Appendix A: Complete DTE Generation Pipeline (TypeScript)

```typescript
/**
 * Chile DTE (Documento Tributario Electronico) generation pipeline.
 *
 * This module handles the complete flow from invoice data
 * to SII-submitted, signed DTE XML.
 */

import * as crypto from 'crypto';
import * as xml2js from 'xml2js';

// === TYPES ===

interface DTELineItem {
  nroLinDet: number;        // Line number (1-based)
  nmbItem: string;          // Item name/description
  qtyItem: number;          // Quantity
  prcItem: number;          // Unit price (CLP integer)
  montoItem: number;        // Line total (CLP integer)
  indExe?: number;          // Exemption indicator: 1=exempt
}

interface DTEHeader {
  tipoDTE: number;          // 33, 34, 39, 41, 52, 56, 61
  folio: number;            // From CAF
  fchEmis: string;          // YYYY-MM-DD
  fmaPago?: number;         // 1=cash, 2=credit, 3=free
  fchVenc?: string;         // Due date (YYYY-MM-DD)
}

interface DTEEmitter {
  rutEmisor: string;        // XX.XXX.XXX-X format
  rznSoc: string;           // Legal name
  giroEmis: string;         // Business activity description
  acteco: string;           // CIIU code
  dirOrigen: string;        // Street address
  cmnaOrigen: string;       // Comuna
  ciudadOrigen: string;     // City
}

interface DTEReceiver {
  rutRecep: string;         // XX.XXX.XXX-X or 66666666-6 (generic consumer)
  rznSocRecep: string;      // Legal name
  giroRecep?: string;       // Business activity
  dirRecep?: string;        // Address
  cmnaRecep?: string;       // Comuna
  ciudadRecep?: string;     // City
}

interface DTEDocument {
  header: DTEHeader;
  emitter: DTEEmitter;
  receiver: DTEReceiver;
  lineItems: DTELineItem[];
  mntNeto: number;          // Net total (CLP integer)
  tasaIVA: number;          // 19
  iva: number;              // IVA amount (CLP integer)
  mntTotal: number;         // Grand total (CLP integer)
  mntExe?: number;          // Exempt total (if any)
}

// === DTE XML BUILDER ===

function buildDTEXml(doc: DTEDocument, cafXml: string): string {
  const documentId = `T${doc.header.tipoDTE}F${doc.header.folio}`;

  const detailXml = doc.lineItems.map((item) => `
    <Detalle>
      <NroLinDet>${item.nroLinDet}</NroLinDet>
      <NmbItem>${escapeXml(item.nmbItem)}</NmbItem>
      ${item.indExe ? `<IndExe>${item.indExe}</IndExe>` : ''}
      <QtyItem>${item.qtyItem}</QtyItem>
      <PrcItem>${item.prcItem}</PrcItem>
      <MontoItem>${item.montoItem}</MontoItem>
    </Detalle>`).join('');

  const xml = `<?xml version="1.0" encoding="ISO-8859-1"?>
<DTE version="1.0">
  <Documento ID="${documentId}">
    <Encabezado>
      <IdDoc>
        <TipoDTE>${doc.header.tipoDTE}</TipoDTE>
        <Folio>${doc.header.folio}</Folio>
        <FchEmis>${doc.header.fchEmis}</FchEmis>
        ${doc.header.fmaPago ? `<FmaPago>${doc.header.fmaPago}</FmaPago>` : ''}
        ${doc.header.fchVenc ? `<FchVenc>${doc.header.fchVenc}</FchVenc>` : ''}
      </IdDoc>
      <Emisor>
        <RUTEmisor>${doc.emitter.rutEmisor}</RUTEmisor>
        <RznSoc>${escapeXml(doc.emitter.rznSoc)}</RznSoc>
        <GiroEmis>${escapeXml(doc.emitter.giroEmis)}</GiroEmis>
        <Acteco>${doc.emitter.acteco}</Acteco>
        <DirOrigen>${escapeXml(doc.emitter.dirOrigen)}</DirOrigen>
        <CmnaOrigen>${escapeXml(doc.emitter.cmnaOrigen)}</CmnaOrigen>
        <CiudadOrigen>${escapeXml(doc.emitter.ciudadOrigen)}</CiudadOrigen>
      </Emisor>
      <Receptor>
        <RUTRecep>${doc.receiver.rutRecep}</RUTRecep>
        <RznSocRecep>${escapeXml(doc.receiver.rznSocRecep)}</RznSocRecep>
        ${doc.receiver.giroRecep ? `<GiroRecep>${escapeXml(doc.receiver.giroRecep)}</GiroRecep>` : ''}
        ${doc.receiver.dirRecep ? `<DirRecep>${escapeXml(doc.receiver.dirRecep)}</DirRecep>` : ''}
        ${doc.receiver.cmnaRecep ? `<CmnaRecep>${escapeXml(doc.receiver.cmnaRecep)}</CmnaRecep>` : ''}
        ${doc.receiver.ciudadRecep ? `<CiudadRecep>${escapeXml(doc.receiver.ciudadRecep)}</CiudadRecep>` : ''}
      </Receptor>
      <Totales>
        <MntNeto>${doc.mntNeto}</MntNeto>
        ${doc.mntExe ? `<MntExe>${doc.mntExe}</MntExe>` : ''}
        <TasaIVA>${doc.tasaIVA}</TasaIVA>
        <IVA>${doc.iva}</IVA>
        <MntTotal>${doc.mntTotal}</MntTotal>
      </Totales>
    </Encabezado>
    ${detailXml}
    <TED version="1.0">
      <DD>
        <RE>${doc.emitter.rutEmisor}</RE>
        <TD>${doc.header.tipoDTE}</TD>
        <F>${doc.header.folio}</F>
        <FE>${doc.header.fchEmis}</FE>
        <RR>${doc.receiver.rutRecep}</RR>
        <RSR>${escapeXml(doc.receiver.rznSocRecep)}</RSR>
        <MNT>${doc.mntTotal}</MNT>
        <IT1>${escapeXml(doc.lineItems[0]?.nmbItem ?? '')}</IT1>
        ${cafXml}
        <TSTED>${doc.header.fchEmis}T${new Date().toTimeString().slice(0, 8)}</TSTED>
      </DD>
      <FRMT algoritmo="SHA1withRSA"><!-- TED signature placeholder --></FRMT>
    </TED>
  </Documento>
</DTE>`;

  return xml;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// === DTE FROM KITZ INVOICE ===

function kitzInvoiceToDTE(
  invoiceData: {
    contactName: string;
    contactRut: string;
    contactGiro?: string;
    contactAddress?: string;
    contactComuna?: string;
    contactCity?: string;
    lineItems: Array<{ description: string; quantity: number; unitPrice: number; exempt?: boolean }>;
    paymentMethod?: 'cash' | 'credit';
    dueDate?: string;
  },
  workspace: {
    rut: string;
    legalName: string;
    giro: string;
    ciiu: string;
    address: string;
    comuna: string;
    city: string;
  },
  folio: number,
  cafXml: string,
): DTEDocument {
  const lineItems: DTELineItem[] = invoiceData.lineItems.map((item, index) => ({
    nroLinDet: index + 1,
    nmbItem: item.description,
    qtyItem: item.quantity,
    prcItem: Math.round(item.unitPrice),  // CLP integer
    montoItem: Math.round(item.quantity * item.unitPrice),
    indExe: item.exempt ? 1 : undefined,
  }));

  const exemptTotal = lineItems
    .filter((li) => li.indExe === 1)
    .reduce((sum, li) => sum + li.montoItem, 0);

  const netTotal = lineItems
    .filter((li) => !li.indExe)
    .reduce((sum, li) => sum + li.montoItem, 0);

  const ivaAmount = Math.round(netTotal * 0.19);
  const grandTotal = netTotal + ivaAmount + exemptTotal;

  // Determine DTE type: 33 (standard) or 34 (exempt)
  const allExempt = lineItems.every((li) => li.indExe === 1);
  const tipoDTE = allExempt ? 34 : 33;

  return {
    header: {
      tipoDTE,
      folio,
      fchEmis: new Date().toISOString().slice(0, 10),
      fmaPago: invoiceData.paymentMethod === 'credit' ? 2 : 1,
      fchVenc: invoiceData.dueDate,
    },
    emitter: {
      rutEmisor: workspace.rut,
      rznSoc: workspace.legalName,
      giroEmis: workspace.giro,
      acteco: workspace.ciiu,
      dirOrigen: workspace.address,
      cmnaOrigen: workspace.comuna,
      ciudadOrigen: workspace.city,
    },
    receiver: {
      rutRecep: invoiceData.contactRut,
      rznSocRecep: invoiceData.contactName,
      giroRecep: invoiceData.contactGiro,
      dirRecep: invoiceData.contactAddress,
      cmnaRecep: invoiceData.contactComuna,
      ciudadRecep: invoiceData.contactCity,
    },
    lineItems,
    mntNeto: netTotal,
    tasaIVA: 19,
    iva: ivaAmount,
    mntTotal: grandTotal,
    mntExe: exemptTotal > 0 ? exemptTotal : undefined,
  };
}
```

---

## Appendix B: Complete Transbank WebPay Integration Flow

```
                    WEBPAY PLUS PAYMENT FLOW
                    ========================

  Kitz Backend                Transbank                Customer Browser
       |                         |                           |
       |  1. POST /create        |                           |
       |  (buyOrder, sessionId,  |                           |
       |   amount, returnUrl)    |                           |
       |------------------------>|                           |
       |                         |                           |
       |  2. { token, url }      |                           |
       |<------------------------|                           |
       |                         |                           |
       |  3. Redirect customer   |                           |
       |  to url?token_ws=token  |                           |
       |---------------------------------------------------->|
       |                         |                           |
       |                         |  4. Customer enters       |
       |                         |  card details on          |
       |                         |  Transbank hosted page    |
       |                         |<--------------------------|
       |                         |                           |
       |                         |  5. Transbank processes   |
       |                         |  payment with bank        |
       |                         |                           |
       |                         |  6. Redirect to returnUrl |
       |                         |  with token_ws            |
       |<----------------------------------------------------|
       |                         |                           |
       |  7. POST /commit        |                           |
       |  (token_ws)             |                           |
       |------------------------>|                           |
       |                         |                           |
       |  8. Transaction result  |                           |
       |  (amount, status,       |                           |
       |   authCode, card,       |                           |
       |   installments)         |                           |
       |<------------------------|                           |
       |                         |                           |
       |  9. Update DTE status   |                           |
       |  10. Send receipt       |                           |
       |---------------------------------------------------->|
       |                         |                           |
```

**Transbank payment type codes:**

| Code | Description | Notes |
|---|---|---|
| VD | Debit card (Redcompra) | Most common for low-value transactions |
| VN | Normal credit (sin cuotas) | Single payment |
| VC | Credit with installments | Customer selects cuotas |
| SI | 3 installments no interest | Specific promotion |
| S2 | 2 installments no interest | Specific promotion |
| NC | N installments no interest | Generic no-interest installments |

---

## Appendix C: Architecture Diagram -- Kitz Chile Integration

```
+------------------------------------------------------------------+
|                        KITZ PLATFORM                              |
+------------------------------------------------------------------+
|                                                                   |
|  +------------------+    +------------------+    +-------------+  |
|  | Workspace        |    | Invoice/DTE      |    | Payment     |  |
|  | Management       |    | Engine           |    | Processing  |  |
|  |                  |    |                  |    |             |  |
|  | - RUT validation |    | - DTE XML gen    |    | - Transbank |  |
|  | - Tax regime     |    | - X.509 signing  |    | - Khipu     |  |
|  | - Giro/CIIU      |    | - CAF/Folio mgmt |    | - Flow.cl   |  |
|  | - UF converter   |    | - TED generation |    | - MercadoP  |  |
|  | - CLP formatting |    | - Sobre de Envio |    | - Webhooks  |  |
|  +--------+---------+    +--------+---------+    +------+------+  |
|           |                       |                      |        |
+-----------+-----------------------+----------------------+--------+
            |                       |                      |
            v                       v                      v
+------------------------------------------------------------------+
|                     EXTERNAL SERVICES                             |
+------------------------------------------------------------------+
|                                                                   |
|  +------------------+    +------------------+    +-------------+  |
|  | SII              |    | Banco Central    |    | Transbank   |  |
|  | (Tax Authority)  |    | de Chile         |    | WebPay API  |  |
|  |                  |    |                  |    |             |  |
|  | - DTE submission |    | - UF daily value |    | - create()  |  |
|  | - CAF request    |    | - Exchange rates |    | - commit()  |  |
|  | - Status query   |    | - API access     |    | - refund()  |  |
|  | - Set de Pruebas |    |                  |    |             |  |
|  +------------------+    +------------------+    +-------------+  |
|                                                                   |
|  +------------------+    +------------------+    +-------------+  |
|  | Khipu            |    | Flow.cl          |    | Mercado     |  |
|  | (Bank Transfers) |    | (Gateway)        |    | Pago        |  |
|  |                  |    |                  |    |             |  |
|  | - Payment create |    | - Multi-method   |    | - Checkout  |  |
|  | - Status webhook |    | - Cards + bank   |    | - Webhooks  |  |
|  | - All CL banks   |    | - Unified API    |    | - Refunds   |  |
|  +------------------+    +------------------+    +-------------+  |
|                                                                   |
+------------------------------------------------------------------+
```

---

*This document should be reviewed and updated quarterly as Chile's regulatory and payment landscape evolves. Key monitoring dates: SII regulation updates (ongoing), CMF Open Finance rollout, Transbank competition dynamics (Getnet market share), UF/UTM value publications (monthly/daily), and fintech ecosystem developments via FinteChile.*
