# Mexico Financial & Payment Infrastructure Intelligence

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

Mexico is Latin America's second-largest economy and represents the single largest addressable market for Kitz in the region. With over 4.9 million SMBs (99.8% of all businesses), a mature and mandatory electronic invoicing system (CFDI), and rapidly growing digital payment adoption, Mexico offers both massive opportunity and significant compliance complexity. Unlike Panama -- where e-invoicing is still being phased in -- Mexico pioneered mandatory electronic invoicing in 2004 and has iterated through multiple CFDI versions. The current standard, CFDI 4.0 (effective since January 2022), imposes strict structural, cryptographic, and tax-classification requirements on every invoice issued. This is non-negotiable: **no business in Mexico can legally operate without issuing CFDI-compliant invoices.**

The payment landscape is equally distinctive. SPEI (Sistema de Pagos Electronicos Interbancarios), operated by Banxico (Mexico's central bank), provides real-time interbank transfers 24/7 and is the backbone of digital payments. CoDi (Cobro Digital), built on top of SPEI, enables QR-based instant payments. For the ~60 million unbanked Mexicans, OXXO Pay -- a cash payment network spanning 20,000+ convenience stores -- is an irreplaceable channel. Mercado Pago dominates the digital wallet space, and Conekta serves as the Mexico-native payment gateway most aligned with local needs.

**Key takeaways for Kitz:**

- Kitz's `paymentTools.ts` provider enum `['stripe', 'paypal', 'yappy', 'bac']` must expand to include `'spei'`, `'codi'`, `'mercadopago'`, `'oxxo'`, `'conekta'`, and `'clip'` for Mexico market coverage.
- Kitz's `invoiceQuoteTools.ts` generates HTML invoices -- this is **legally insufficient** for Mexico. Every invoice must produce a CFDI 4.0-compliant XML document, digitally sealed, and stamped by a PAC (Proveedor Autorizado de Certificacion). The HTML becomes the representation visual (PDF/HTML), but the XML is the legal document.
- Kitz's `invoice_create` tool defaults to `tax_rate ?? 0.07` (Panama ITBMS). Mexico's standard IVA rate is **16%**, with 0% for food and medicine and exempt categories. The tax configuration system must become country-aware.
- The CFDI 4.0 XML schema requires over 40 mandatory fields including SAT product/service catalog codes (ClaveProdServ), fiscal regime codes, CFDI usage codes, and a standardized RFC format for both issuer and receiver. This is orders of magnitude more complex than Panama's DGI e-invoice.
- RESICO (Regimen Simplificado de Confianza), Mexico's simplified tax regime for small taxpayers earning under MXN 3.5M/year, is highly relevant to Kitz's target market and requires specific CFDI treatment.

**Market sizing:**

| Segment | Count | Annual Revenue Range (MXN) | Kitz Relevance |
|---|---|---|---|
| Micro enterprises | ~4.1M | Up to $2M | Core target -- largest segment, RESICO-eligible |
| Small enterprises | ~0.6M | $2M -- $50M | Growth target -- full CFDI compliance needs |
| Medium enterprises | ~0.2M | $50M -- $250M | Premium target -- multi-branch, Carta Porte |

---

## 2. Payment Systems

### 2.1 SPEI (Sistema de Pagos Electronicos Interbancarios)

**What it is:**
SPEI is Mexico's real-time gross settlement system operated by Banco de Mexico (Banxico), the country's central bank. It processes interbank electronic transfers in real time, 24 hours a day, 365 days a year. SPEI handles over 300 million transactions per month and is the foundational payment rail upon which most digital payment products in Mexico are built. It is the Mexican equivalent of the US Fedwire or UK Faster Payments, but with broader consumer adoption.

**Why Kitz needs it:**
SPEI is the dominant method for B2B payments in Mexico. When a Kitz user sends an invoice to another business, payment will overwhelmingly arrive via SPEI transfer. Kitz must:
- Generate CLABE (Clave Bancaria Estandarizada) numbers for payment instructions on invoices.
- Reconcile incoming SPEI transfers against outstanding invoices using reference numbers.
- Support STP (Sistema de Transferencias y Pagos) as a fintech-accessible SPEI gateway for automated webhook-driven reconciliation.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Operator | Banco de Mexico (Banxico) |
| Settlement | Real-time gross settlement (RTGS), irrevocable |
| Operating hours | 24/7/365 (since November 2004, expanded to 24/7 in 2020) |
| Participant count | 100+ direct participants (banks + fintechs via STP) |
| CLABE format | 18-digit standardized bank account number |
| Transfer limit | No hard limit for business accounts; personal accounts may have bank-imposed limits |
| Cost | Free or minimal for end users; banks charge B2B fees (typically MXN $3--$7 per transfer) |
| Reference | 7-digit numeric reference (clave de rastreo) for reconciliation |

**CLABE validation:**

```typescript
/**
 * Validates a Mexican CLABE (Clave Bancaria Estandarizada).
 * Format: 18 digits = 3 (bank) + 3 (plaza) + 11 (account) + 1 (check digit)
 *
 * The check digit uses modular arithmetic with weights [3, 7, 1] repeating.
 */
function validateCLABE(clabe: string): { valid: boolean; bank?: string; error?: string } {
  const cleaned = clabe.replace(/\s|-/g, '');

  if (!/^\d{18}$/.test(cleaned)) {
    return { valid: false, error: 'CLABE must be exactly 18 digits' };
  }

  // Verify check digit (position 18)
  const weights = [3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7];
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += (parseInt(cleaned[i]!) * weights[i]!) % 10;
  }
  const checkDigit = (10 - (sum % 10)) % 10;

  if (checkDigit !== parseInt(cleaned[17]!)) {
    return { valid: false, error: `Invalid check digit: expected ${checkDigit}, got ${cleaned[17]}` };
  }

  // Bank code lookup (first 3 digits)
  const BANK_CODES: Record<string, string> = {
    '002': 'BBVA Mexico',
    '012': 'BBVA Mexico',
    '014': 'Santander Mexico',
    '021': 'HSBC Mexico',
    '030': 'Citibanamex',  // Note: Citibanamex uses 002 and 030
    '036': 'Banorte',
    '044': 'Scotiabank Mexico',
    '058': 'Banregio',
    '072': 'Banorte',
    '106': 'Bank of America Mexico',
    '127': 'Azteca',
    '130': 'STP',
    '138': 'Nu Mexico',
    '646': 'STP',
    '659': 'Nu Mexico',
  };

  const bankCode = cleaned.substring(0, 3);
  const bankName = BANK_CODES[bankCode] || `Bank code ${bankCode}`;

  return { valid: true, bank: bankName };
}
```

**Integration pattern for Kitz via STP:**

```
1. Kitz workspace registers with STP (fintech SPEI gateway)
   -> STP assigns a dedicated CLABE per workspace
2. Kitz generates invoice with CLABE + reference number
3. Customer initiates SPEI transfer from their bank
   -> Uses CLABE + reference as payment instruction
4. STP receives the SPEI credit and fires webhook to Kitz
5. Kitz calls payments_processWebhook(provider: 'spei', ...)
6. Invoice status -> 'paid', CRM updated, CFDI Complemento de Pago issued
```

**Implementation timeline:** Q1 2026 -- highest priority for B2B payments.

**Action items:**
1. Register Kitz as an STP participant (or use STP through a licensed fintech partner).
2. Build CLABE generation/assignment per workspace.
3. Add SPEI reference number generation tied to invoice numbers.
4. Build STP webhook receiver mapped to `payments_processWebhook`.
5. Implement automatic invoice reconciliation by matching SPEI reference to invoice.

---

### 2.2 CoDi (Cobro Digital)

**What it is:**
CoDi (Cobro Digital) is Banxico's QR-based payment system built on top of SPEI. It enables instant point-of-sale and remote payments by scanning a QR code or tapping NFC. The payer's bank debits their account via SPEI and the merchant receives funds instantly. CoDi was launched in September 2019 and is free for all participants -- no transaction fees.

**Why Kitz needs it:**
CoDi is the Mexican equivalent of Panama's Yappy for in-person and storefront payments. It is bank-agnostic (works with any CoDi-enabled bank), free, and instant. For Kitz storefronts and point-of-sale scenarios, CoDi provides a zero-cost payment acceptance method.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Operator | Banxico (built on SPEI rails) |
| Transaction cost | Free (no merchant fees) |
| QR standard | EMV QR code format |
| NFC support | Yes (HCE-based) |
| Settlement | Instant via SPEI |
| Bank support | All major Mexican banks participate |
| API access | Through participating banks or STP |
| Limitations | Adoption still growing; ~20M registered users as of 2025 |

**QR generation for Kitz storefront:**

```typescript
interface CoDiPaymentRequest {
  amount: number;           // MXN amount
  concept: string;          // Payment description (max 40 chars)
  reference: string;        // Numeric reference for reconciliation
  clabeDestino: string;     // Merchant's CLABE
  expirationMinutes: number; // QR validity period
}

function generateCoDiQR(request: CoDiPaymentRequest): string {
  // CoDi uses EMV QR format with Banxico-specific tags
  // Tag 26: Merchant Account Information (CLABE)
  // Tag 54: Transaction Amount
  // Tag 62: Additional Data (reference, concept)
  const emvPayload = [
    '000201',                                           // Payload format indicator
    '010212',                                           // Static or dynamic QR
    `2658${encodeTLV('00', 'mx.codi')}${encodeTLV('01', request.clabeDestino)}`,
    `5406${request.amount.toFixed(2)}`,                 // Transaction amount
    '5802MX',                                           // Country code
    `6226${encodeTLV('05', request.reference)}${encodeTLV('08', request.concept)}`,
    '6304',                                             // CRC placeholder
  ].join('');

  // CRC16-CCITT checksum appended
  const crc = computeCRC16(emvPayload);
  return emvPayload + crc;
}

// Helper: Tag-Length-Value encoding for EMV QR
function encodeTLV(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${tag}${len}${value}`;
}
```

**Implementation timeline:** Q2 2026 -- after SPEI integration is established.

**Action items:**
1. Evaluate CoDi QR generation libraries for Node.js.
2. Build CoDi payment request flow in Kitz storefront module.
3. Map CoDi notifications to `payments_processWebhook` pipeline.
4. Display CoDi QR on invoice HTML/PDF for quick payment.

---

### 2.3 OXXO Pay

**What it is:**
OXXO Pay is a cash-based payment network operated by FEMSA (the company behind OXXO convenience stores). With over 20,000 OXXO locations across Mexico, it is the most important payment channel for the unbanked population. Customers receive a barcode or reference number, walk into any OXXO store, present it at the counter, and pay with cash. The payment is confirmed digitally within minutes.

**Why Kitz needs it:**
Approximately 60 million Mexicans (nearly half the population) remain unbanked or underbanked. For Kitz's micro-enterprise customers whose own clients pay in cash, OXXO Pay bridges the gap between cash payments and digital invoicing. It is accessible through payment gateways like Conekta, Stripe Mexico, and Mercado Pago.

**Technical integration (via Conekta):**

| Aspect | Detail |
|---|---|
| Integration method | Through Conekta, Stripe, or Mercado Pago APIs |
| Payment flow | Customer receives reference -> pays at OXXO counter -> webhook confirms |
| Settlement time | Real-time notification; funds settle in 24--48 hours |
| Reference format | 14-digit barcode number |
| Amount limits | MXN $1 -- MXN $10,000 per transaction |
| Expiration | Configurable (default: 72 hours) |
| Fees | 2.5--3.5% per transaction (charged by gateway) |

**Integration via Conekta (recommended gateway):**

```typescript
import Conekta from 'conekta';

Conekta.api_key = process.env.CONEKTA_PRIVATE_KEY!;
Conekta.api_version = '2.1.0';

async function createOxxoPayment(args: {
  invoiceNumber: string;
  amount: number; // MXN in centavos (e.g., 15000 = MXN $150.00)
  customerName: string;
  customerEmail: string;
  expiresAt: number; // Unix timestamp
}): Promise<{ reference: string; barcodeUrl: string; expiresAt: string }> {
  const order = await Conekta.Order.create({
    currency: 'MXN',
    customer_info: {
      name: args.customerName,
      email: args.customerEmail,
    },
    line_items: [{
      name: `Pago factura ${args.invoiceNumber}`,
      unit_price: args.amount,
      quantity: 1,
    }],
    charges: [{
      payment_method: {
        type: 'oxxo_cash',
        expires_at: args.expiresAt,
      },
    }],
    metadata: {
      kitz_invoice_number: args.invoiceNumber,
    },
  });

  const charge = order.charges.data[0];
  return {
    reference: charge.payment_method.reference,
    barcodeUrl: charge.payment_method.barcode_url,
    expiresAt: new Date(charge.payment_method.expires_at * 1000).toISOString(),
  };
}
```

**Implementation timeline:** Q2 2026 -- via Conekta gateway integration.

**Action items:**
1. Select primary gateway for OXXO Pay (Conekta recommended; Stripe also supports it).
2. Build OXXO reference generation flow tied to invoices.
3. Add barcode/reference display to invoice PDF/HTML.
4. Implement webhook handler for OXXO payment confirmations.
5. Handle edge cases: partial payments, expired references, duplicate payments.

---

### 2.4 Mercado Pago

**What it is:**
Mercado Pago is Mercado Libre's fintech arm and the dominant digital wallet in Latin America. In Mexico, it offers QR payments, payment links, card processing, OXXO integration, bank transfers, and a full-featured checkout experience. It serves as both a consumer wallet and a merchant payment platform.

**Why Kitz needs it:**
Mercado Pago is the most recognized digital payment brand in Mexico. Its Checkout Pro product provides a hosted payment page that accepts cards, OXXO, bank transfers, and wallet balance -- covering all payment methods in a single integration. For Kitz merchants who want maximum payment acceptance with minimum integration effort, Mercado Pago is the "one integration, all methods" solution.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Developer portal | https://www.mercadopago.com.mx/developers |
| SDK languages | Node.js, Python, PHP, Java, .NET, Ruby |
| API version | v1 (REST) |
| Authentication | Access token (OAuth 2.0) |
| Checkout types | Checkout Pro (hosted), Checkout API (custom), Payment Link |
| Supported methods | Cards (Visa, MC, AMEX), OXXO, SPEI, Mercado Pago wallet |
| Webhook events | `payment.created`, `payment.updated` |
| Sandbox | Full sandbox with test credentials |
| Fees | 3.49% + MXN $4.00 per transaction (varies by plan) |

**Integration pattern for Kitz:**

```typescript
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

async function createMercadoPagoPreference(args: {
  invoiceNumber: string;
  items: Array<{ title: string; quantity: number; unitPrice: number }>;
  payerEmail: string;
  workspaceId: string;
}): Promise<{ preferenceId: string; initPoint: string; sandboxInitPoint: string }> {
  const preference = new Preference(mpClient);

  const result = await preference.create({
    body: {
      items: args.items.map(item => ({
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        currency_id: 'MXN',
      })),
      payer: { email: args.payerEmail },
      back_urls: {
        success: `https://kitz.app/payments/mp/success/${args.invoiceNumber}`,
        failure: `https://kitz.app/payments/mp/failure/${args.invoiceNumber}`,
        pending: `https://kitz.app/payments/mp/pending/${args.invoiceNumber}`,
      },
      auto_return: 'approved',
      external_reference: args.invoiceNumber,
      notification_url: `https://kitz.app/webhooks/mercadopago/${args.workspaceId}`,
      metadata: {
        kitz_invoice_number: args.invoiceNumber,
        kitz_workspace_id: args.workspaceId,
      },
    },
  });

  return {
    preferenceId: result.id!,
    initPoint: result.init_point!,
    sandboxInitPoint: result.sandbox_init_point!,
  };
}
```

**Implementation timeline:** Q2 2026 -- primary all-in-one gateway for Mexico.

**Action items:**
1. Register Kitz as a Mercado Pago developer application.
2. Build Checkout Pro integration for invoice payment links.
3. Implement IPN (Instant Payment Notification) webhook handler.
4. Map Mercado Pago payment statuses to Kitz invoice statuses.
5. Build per-workspace Mercado Pago credential management (OAuth flow).

---

### 2.5 Conekta

**What it is:**
Conekta is a Mexico-native payment gateway founded in 2012, purpose-built for the Mexican market. It supports credit/debit cards, OXXO Pay, SPEI transfers, and installment payments (meses sin intereses). Conekta is the preferred gateway for businesses that need deep Mexican payment method coverage with local support.

**Why Kitz needs it:**
Conekta understands the Mexican market better than international gateways. It provides native OXXO integration, SPEI transfer collection, installment plans with Mexican banks, and full CFDI-related metadata support. For Kitz's Mexico expansion, Conekta is the recommended primary payment gateway.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Developer portal | https://developers.conekta.com |
| SDK | `conekta` npm package |
| API version | 2.1.0 |
| Authentication | Private key + public key |
| Supported methods | Cards, OXXO, SPEI, installments (3/6/9/12 MSI) |
| Webhooks | `order.paid`, `order.pending_payment`, `charge.paid` |
| PCI compliance | SAQ-A (hosted tokenization) |
| Fees | 2.9% + MXN $2.50 (cards), 2.5% (OXXO), 1% (SPEI) |

**Implementation timeline:** Q1--Q2 2026 -- primary gateway for OXXO and SPEI collection.

---

### 2.6 Clip

**What it is:**
Clip is Mexico's leading card reader and POS solution for SMBs. It offers a portable card reader that connects via Bluetooth to a smartphone, enabling micro and small businesses to accept Visa, Mastercard, and AMEX payments without a traditional POS terminal or merchant bank account.

**Why Kitz needs it:**
Clip serves the same micro-enterprise segment that Kitz targets. Many Kitz users will already own a Clip reader. Integration with Clip would allow Kitz to reconcile Clip-processed payments against invoices. Clip also offers an online payments product (Clip Pages) that could complement Kitz storefronts.

**Technical integration:**

| Aspect | Detail |
|---|---|
| API availability | Limited -- Clip does not currently offer a full public API |
| Integration approach | CSV export reconciliation; monitor for API launch |
| Hardware | Clip Plus (Bluetooth reader), Clip Total (standalone POS) |
| Settlement | 2 business days to linked bank account |
| Fees | 3.6% per transaction (no monthly fee) |

**Implementation timeline:** Q3 2026 / Future -- monitor API availability.

---

### 2.7 Stripe Mexico & PayPal Mexico

**What it is:**
Stripe launched in Mexico with full local acquiring support, accepting Mexican cards and disbursing in MXN. PayPal Mexico is well-established for online payments and cross-border transactions.

**Why Kitz needs them:**
Both are already in Kitz's `paymentTools.ts` provider enum (`'stripe'`, `'paypal'`). Stripe Mexico can serve as a secondary card gateway and provides excellent developer experience. PayPal serves international customers and freelancers.

**Stripe Mexico specifics:**

| Aspect | Detail |
|---|---|
| Local acquiring | Yes -- MXN settlement |
| Supported methods | Cards, OXXO (via Stripe), SPEI (via Stripe) |
| OXXO via Stripe | Payment method type: `oxxo` |
| SPEI via Stripe | Payment method type: `customer_balance` with SPEI funding |
| Fees | 3.6% + MXN $3.00 per transaction |
| Installments | Supported (meses sin intereses) with participating banks |

**Implementation timeline:** Q2 2026 -- leverage existing Stripe integration, configure for Mexico.

---

## 3. Banking & Interbank Infrastructure

### 3.1 STP (Sistema de Transferencias y Pagos)

**What it is:**
STP is a licensed financial institution that provides direct access to the SPEI network for fintechs, payment companies, and non-bank entities. It acts as a SPEI gateway, allowing companies like Kitz to send and receive interbank transfers without being a bank. STP is regulated by Banxico and CNBV (Comision Nacional Bancaria y de Valores).

**Why Kitz needs it:**
STP is the critical infrastructure layer that enables Kitz to receive SPEI payments programmatically. Without STP (or a similar licensed intermediary), Kitz cannot automate SPEI payment collection and reconciliation. STP provides:
- Dedicated CLABE numbers per client/workspace.
- Real-time webhook notifications on incoming transfers.
- Outbound SPEI transfers for disbursements (future).
- API access for transaction queries and reconciliation.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Website | https://www.stp.mx |
| API type | REST + SOAP (legacy) |
| Authentication | Certificate-based (X.509) + API key |
| Webhook format | JSON POST to registered endpoint |
| CLABE assignment | STP assigns CLABEs from bank code `646` |
| Minimum volume | Negotiable -- contact STP commercial team |
| Regulatory requirement | Kitz must register as STP's client; STP handles CNBV compliance |

**STP webhook handler for Kitz:**

```typescript
interface STPWebhookPayload {
  id: number;
  fechaOperacion: string;      // YYYYMMDD
  institucionOrdenante: string; // Bank code of sender
  institucionBeneficiaria: string; // '646' (STP)
  claveRastreo: string;        // Tracking key (unique per transaction)
  monto: number;               // Amount in MXN
  nombreOrdenante: string;     // Sender name
  cuentaOrdenante: string;     // Sender CLABE
  rfcCurpOrdenante: string;    // Sender RFC or CURP
  cuentaBeneficiaria: string;  // Destination CLABE (our workspace CLABE)
  conceptoPago: string;        // Payment concept/description
  referenciaNumerica: string;  // 7-digit numeric reference
  empresa: string;             // STP company identifier
}

async function handleSTPWebhook(payload: STPWebhookPayload): Promise<void> {
  // 1. Validate signature (X.509 certificate verification)
  // 2. Find workspace by destination CLABE
  const workspace = await findWorkspaceByCLABE(payload.cuentaBeneficiaria);
  if (!workspace) throw new Error(`Unknown CLABE: ${payload.cuentaBeneficiaria}`);

  // 3. Match to invoice by reference number
  const invoice = await findInvoiceByReference(
    workspace.id,
    payload.referenciaNumerica
  );

  // 4. Process through standard payment pipeline
  await processPaymentWebhook({
    provider: 'spei',
    provider_transaction_id: payload.claveRastreo,
    amount: payload.monto,
    currency: 'MXN',
    status: 'completed', // SPEI transfers are irrevocable
    buyer_name: payload.nombreOrdenante,
    metadata: payload,
    invoice_number: invoice?.invoiceNumber,
  });

  // 5. If invoice matched, issue Complemento de Pago (CFDI)
  if (invoice) {
    await issueCFDIComplementoPago(workspace.id, invoice.invoiceNumber, {
      amount: payload.monto,
      paymentDate: parseSTPDate(payload.fechaOperacion),
      paymentMethod: '03', // Transferencia electronica de fondos
      senderRFC: payload.rfcCurpOrdenante,
      operationNumber: payload.claveRastreo,
    });
  }
}
```

**Implementation timeline:** Q1 2026 -- critical for automated payment collection.

---

### 3.2 Banking Landscape

Mexico has a concentrated banking sector dominated by large institutions. The key banks for Kitz's SMB market:

| Bank | Market Share (approx.) | Relevance to Kitz | Key Products |
|---|---|---|---|
| **BBVA Mexico** | ~25% of deposits | #1 priority -- largest bank, dominant in SMB banking | BBVA Net Cash, SPEI, POS terminals, business accounts |
| **Banorte** | ~15% | #2 priority -- largest Mexican-owned bank, strong SMB focus | Banorte Movil, CoDi, business banking, government payroll |
| **Santander Mexico** | ~14% | Major player, strong card business | SuperNet, SPEI, card acquiring |
| **Citibanamex** | ~12% | Legacy presence, being sold by Citi | Transfer, SPEI, branch network |
| **Banco Azteca** | ~5% | Critical for unbanked/underbanked; 2,000+ branches in Elektra stores | Cuenta Guardadito, money transfers, micro-lending |
| **Nu Mexico (Nubank)** | Growing rapidly | Digital-first bank targeting millennials, 5M+ customers in MX | Zero-fee accounts, credit cards, SPEI, CoDi |
| **HSBC Mexico** | ~7% | International commerce, trade finance | Business banking, SPEI, trade services |
| **Scotiabank Mexico** | ~5% | SMB lending, card services | Business accounts, lines of credit |
| **Banregio** | ~3% | Strong in northern Mexico, tech-forward | Hey Banco (digital bank), business accounts |

**Typical SMB banking needs in Mexico:**
- Business checking account (cuenta de cheques empresarial)
- SPEI for receiving client payments
- CLABE number for digital payment collection
- POS terminal or Clip reader for card acceptance
- Line of credit or capital de trabajo loan
- Payroll disbursement (nomina) via SPEI
- Tax payment processing (declaracion de impuestos via bank portal)

**Action items:**
1. Prioritize STP integration for bank-agnostic SPEI collection.
2. Monitor BBVA Mexico and Banorte developer programs for direct API access.
3. Build bank-agnostic reconciliation using CLABE + reference matching.
4. Support bank statement import (CSV, OFX) for manual reconciliation.

---

## 4. Government & Regulatory Bodies

### 4.1 SAT (Servicio de Administracion Tributaria)

**What it is:**
The SAT is Mexico's federal tax authority, equivalent to the IRS in the US or DGI in Panama. It administers all federal taxes (ISR, IVA, IEPS), operates the CFDI electronic invoicing system, manages the RFC (tax ID) registry, and enforces tax compliance. The SAT is one of the most technologically advanced tax authorities in Latin America.

**Why Kitz needs it:**
Every aspect of Kitz's invoicing and financial features in Mexico is governed by SAT regulations. The SAT:
- Defines and enforces the CFDI 4.0 standard.
- Authorizes PAC providers who stamp invoices.
- Issues and manages CSD (Certificado de Sello Digital) used for digital signing.
- Publishes mandatory product/service catalogs (ClaveProdServ) used in CFDI.
- Operates the SAT Portal for taxpayer services.
- Audits taxpayers and flags non-compliant invoices.

**Key SAT systems:**

| System | URL | Purpose |
|---|---|---|
| SAT Portal | https://www.sat.gob.mx | Main taxpayer portal |
| CFDI Validation | https://verificacfdi.facturaelectronica.sat.gob.mx | Validate CFDI by UUID |
| RFC Registration | Via SAT portal | Taxpayer ID management |
| CSD Management | Via SAT portal | Digital certificate issuance |
| Catalog Downloads | https://www.sat.gob.mx/consultas/35025/catalogo-de-productos-y-servicios | Product/service catalog |
| Cancelation Portal | Via SAT portal | CFDI cancelation management |

**SAT compliance calendar for Kitz workspace owners:**

| Date | Obligation | Kitz Feature |
|---|---|---|
| 17th of each month | IVA monthly declaration | IVA pre-filing report |
| 17th of each month | ISR provisional payment | ISR calculation helper |
| March 31 | Annual ISR declaration (personas morales) | Annual tax summary |
| April 30 | Annual ISR declaration (personas fisicas) | Annual tax summary |
| Per-transaction | CFDI issuance | Automatic via PAC integration |
| Within 24 hours | Complemento de Pago issuance (for PPD invoices) | Auto-trigger on payment receipt |

---

### 4.2 CNBV (Comision Nacional Bancaria y de Valores)

**What it is:**
The CNBV is Mexico's financial services regulator, overseeing banks, brokerage firms, and fintech companies. It administers the Ley Fintech (Fintech Law, enacted March 2018), which regulates crowdfunding platforms, electronic payment institutions (IFPEs), and cryptocurrency exchanges.

**Why Kitz needs it:**
If Kitz holds, transmits, or facilitates the movement of customer funds in Mexico, it may need to register as an IFPE (Institucion de Fondos de Pago Electronico) or operate under an existing IFPE license. Operating through licensed intermediaries (STP, Conekta, Mercado Pago) likely exempts Kitz from direct CNBV licensing, but a legal assessment is required.

**Relevant regulations:**

| Regulation | Description | Impact on Kitz |
|---|---|---|
| Ley Fintech (2018) | Regulates fintech companies in Mexico | Determines if Kitz needs an IFPE license |
| Circular 4/2019 (Banxico) | SPEI participant requirements | Applies if Kitz directly connects to SPEI |
| AML/KYC (CNBV) | Anti-money laundering requirements | KYC for workspace owners processing payments |
| Data protection (LFPDPPP) | Federal data protection law | Customer data handling requirements |

**Implementation timeline:** NOW -- legal assessment required before Mexico payment features launch.

---

### 4.3 RFC (Registro Federal de Contribuyentes)

**What it is:**
The RFC is Mexico's taxpayer identification number, equivalent to Panama's RUC. Every person and business that has tax obligations must have an RFC. It is required on every CFDI as both issuer (emisor) and receiver (receptor).

**RFC format:**

| Entity type | Format | Length | Example |
|---|---|---|---|
| Persona moral (company) | 3 letters + 6 digits (date) + 3 chars (homoclave) | 12 chars | `KIT260101ABC` |
| Persona fisica (individual) | 4 letters + 6 digits (date) + 3 chars (homoclave) | 13 chars | `GARA850101XYZ` |
| Generic (publico en general) | Fixed value | 13 chars | `XAXX010101000` |
| Foreign (extranjero) | Fixed value | 13 chars | `XEXX010101000` |

**RFC validation:**

```typescript
/**
 * Validates a Mexican RFC (Registro Federal de Contribuyentes).
 *
 * Persona moral: AAA000000XXX (12 chars: 3 letters + 6 digits + 3 alphanum)
 * Persona fisica: AAAA000000XXX (13 chars: 4 letters + 6 digits + 3 alphanum)
 */
function validateRFC(rfc: string): {
  valid: boolean;
  type: 'persona_moral' | 'persona_fisica' | 'generic_public' | 'foreign' | 'unknown';
  error?: string;
} {
  const cleaned = rfc.trim().toUpperCase();

  // Generic RFC for "publico en general" (cash sales / no RFC receiver)
  if (cleaned === 'XAXX010101000') {
    return { valid: true, type: 'generic_public' };
  }

  // Generic RFC for foreign entities
  if (cleaned === 'XEXX010101000') {
    return { valid: true, type: 'foreign' };
  }

  // Persona moral: 3 uppercase letters + 6 digits (YYMMDD) + 3 alphanumeric
  const moralRegex = /^[A-Z&Ñ]{3}\d{6}[A-Z0-9]{3}$/;
  if (moralRegex.test(cleaned) && cleaned.length === 12) {
    const dateStr = cleaned.substring(3, 9);
    if (isValidRFCDate(dateStr)) {
      return { valid: true, type: 'persona_moral' };
    }
    return { valid: false, type: 'persona_moral', error: 'Invalid date component in RFC' };
  }

  // Persona fisica: 4 uppercase letters + 6 digits (YYMMDD) + 3 alphanumeric
  const fisicaRegex = /^[A-Z&Ñ]{4}\d{6}[A-Z0-9]{3}$/;
  if (fisicaRegex.test(cleaned) && cleaned.length === 13) {
    const dateStr = cleaned.substring(4, 10);
    if (isValidRFCDate(dateStr)) {
      return { valid: true, type: 'persona_fisica' };
    }
    return { valid: false, type: 'persona_fisica', error: 'Invalid date component in RFC' };
  }

  return { valid: false, type: 'unknown', error: 'RFC does not match persona moral (12) or persona fisica (13) format' };
}

function isValidRFCDate(yymmdd: string): boolean {
  const yy = parseInt(yymmdd.substring(0, 2));
  const mm = parseInt(yymmdd.substring(2, 4));
  const dd = parseInt(yymmdd.substring(4, 6));
  return mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31;
}
```

**CURP (Clave Unica de Registro de Poblacion):**

The CURP is Mexico's personal identity number (18 alphanumeric characters). It is derived from the person's name, date of birth, sex, and state of birth. While not required on CFDI, it is used for KYC verification and government interactions.

```typescript
// CURP format: 4 letters + 6 digits (YYMMDD) + 1 letter (sex) + 2 letters (state) +
//              3 letters (consonants) + 1 digit (homoclave) + 1 digit (check)
const CURP_REGEX = /^[A-Z]{4}\d{6}[HM][A-Z]{2}[A-Z]{3}[A-Z0-9]\d$/;

function validateCURP(curp: string): boolean {
  return CURP_REGEX.test(curp.trim().toUpperCase());
}
```

---

### 4.4 Fiscal Regimes (Regimen Fiscal)

**What it is:**
Every RFC holder in Mexico must be registered under one or more fiscal regimes that determine their tax obligations, rates, and deduction rules. The fiscal regime is **mandatory on every CFDI 4.0 invoice** for both issuer and receiver.

**Key regimes relevant to Kitz users:**

| Code | Regime Name | Description | Kitz Target? |
|---|---|---|---|
| 601 | General de Ley Personas Morales | Standard corporate regime | Yes -- established businesses |
| 603 | Personas Morales con Fines No Lucrativos | Non-profit organizations | No |
| 605 | Sueldos y Salarios | Employees (not relevant for businesses) | No |
| 606 | Arrendamiento | Rental income | Yes -- landlords |
| 612 | Personas Fisicas con Actividades Empresariales y Profesionales | Individual with business/professional activity | Yes -- freelancers, professionals |
| 616 | Sin Obligaciones Fiscales | No fiscal obligations | No |
| 621 | Incorporacion Fiscal | Old simplified regime (phased out, replaced by RESICO) | Transitional |
| 625 | Regimen de las Actividades Empresariales con Ingresos a traves de Plataformas Tecnologicas | Platform economy regime (Uber drivers, Rappi, etc.) | Possibly |
| 626 | Regimen Simplificado de Confianza (RESICO) | **Simplified trust regime for small taxpayers** | **Yes -- core Kitz target** |

**RESICO (Regimen Simplificado de Confianza):**

RESICO is Mexico's most important tax regime for Kitz's target market. Introduced in 2022, it dramatically simplifies tax obligations for small taxpayers:

| Aspect | Detail |
|---|---|
| Eligibility (personas fisicas) | Annual income up to MXN $3,500,000 |
| Eligibility (personas morales) | Annual income up to MXN $35,000,000 |
| ISR rate (personas fisicas) | 1.00% to 2.50% of gross income (progressive, monthly) |
| ISR rate (personas morales) | Standard corporate rate of 30% (no special rate for morales in RESICO) |
| IVA obligation | Standard 16% IVA still applies |
| CFDI requirement | Full CFDI compliance required |
| Deductions | Limited -- RESICO uses gross income as the base |

**Implementation for Kitz:**

```typescript
// Fiscal regime configuration per workspace
interface MexicoFiscalConfig {
  rfc: string;
  regimenFiscal: string; // SAT catalog code (e.g., '626' for RESICO)
  regimenDescription: string;
  isRESICO: boolean;
  annualIncomeLimitMXN: number;
  isrRate: number; // For RESICO personas fisicas
  ivaRate: number; // Standard 16%
  domicilioFiscal: string; // Fiscal ZIP code (required on CFDI 4.0)
}

const RESICO_ISR_RATES: Array<{ upTo: number; rate: number }> = [
  { upTo: 300000, rate: 0.01 },     // 1.00%
  { upTo: 600000, rate: 0.011 },    // 1.10%
  { upTo: 1000000, rate: 0.015 },   // 1.50%
  { upTo: 2500000, rate: 0.02 },    // 2.00%
  { upTo: 3500000, rate: 0.025 },   // 2.50%
];

function calculateRESICOISR(monthlyIncome: number): number {
  const annualized = monthlyIncome * 12;
  const bracket = RESICO_ISR_RATES.find(b => annualized <= b.upTo);
  if (!bracket) throw new Error('Income exceeds RESICO limit (MXN $3,500,000/year)');
  return monthlyIncome * bracket.rate;
}
```

---

## 5. Invoice Compliance

### 5.1 CFDI 4.0 (Comprobante Fiscal Digital por Internet)

**What it is:**
CFDI is Mexico's mandatory electronic invoicing standard. Version 4.0 has been effective since January 1, 2022, and is the current and only accepted version. Every business transaction in Mexico must produce a CFDI -- there is no threshold or opt-in; it is **universally mandatory**. CFDI 4.0 introduced stricter validation: the receiver's name and RFC must exactly match SAT records, the receiver's fiscal regime and postal code are now required, and the "uso de CFDI" (invoice usage) must match the receiver's fiscal regime.

**CFDI document lifecycle:**

```
+-------------+     +----------+     +---------+     +----------+
| Kitz builds |---->| XML      |---->| PAC     |---->| SAT      |
| invoice     |     | generated|     | stamps  |     | validates|
| data        |     | + sealed |     | (timbre)|     | & stores |
+-------------+     +----------+     +---------+     +----------+
      |                   |                |               |
      |              CSD seal         UUID assigned    Available for
      |           (sello digital)    (Folio Fiscal)    verification
      |                   |                |               |
      v                   v                v               v
+-------------+     +----------+     +---------+     +----------+
| HTML/PDF    |     | XML with |     | XML +   |     | 72-hour  |
| visual rep  |     | sello    |     | timbre  |     | cancel   |
| for display |     | digital  |     | fiscal  |     | window   |
+-------------+     +----------+     +---------+     +----------+
```

**CFDI 4.0 XML structure:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante
  xmlns:cfdi="http://www.sat.gob.mx/cfd/4"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.sat.gob.mx/cfd/4
    http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd"
  Version="4.0"
  Serie="A"
  Folio="00001234"
  Fecha="2026-02-24T10:30:00"
  Sello="{{base64_digital_seal}}"
  FormaPago="03"
  NoCertificado="00001000000512345678"
  Certificado="{{base64_CSD_certificate}}"
  SubTotal="10000.00"
  Descuento="0.00"
  Moneda="MXN"
  Total="11600.00"
  TipoDeComprobante="I"
  Exportacion="01"
  MetodoPago="PUE"
  LugarExpedicion="06600"
  >

  <!-- Issuer (Emisor) -->
  <cfdi:Emisor
    Rfc="KIT260101ABC"
    Nombre="KITZ OPERACIONES DE MEXICO SA DE CV"
    RegimenFiscal="601"
  />

  <!-- Receiver (Receptor) -->
  <cfdi:Receptor
    Rfc="GARA850101XYZ"
    Nombre="GARCIA RAMIREZ ALEJANDRO"
    DomicilioFiscalReceptor="01000"
    RegimenFiscalReceptor="626"
    UsoCFDI="G03"
  />

  <!-- Line Items (Conceptos) -->
  <cfdi:Conceptos>
    <cfdi:Concepto
      ClaveProdServ="43232408"
      NoIdentificacion="SERV-001"
      Cantidad="1"
      ClaveUnidad="E48"
      Unidad="Servicio"
      Descripcion="Servicio de consultoria en marketing digital - Febrero 2026"
      ValorUnitario="10000.00"
      Importe="10000.00"
      Descuento="0.00"
      ObjetoImp="02"
    >
      <cfdi:Impuestos>
        <cfdi:Traslados>
          <cfdi:Traslado
            Base="10000.00"
            Impuesto="002"
            TipoFactor="Tasa"
            TasaOCuota="0.160000"
            Importe="1600.00"
          />
        </cfdi:Traslados>
      </cfdi:Impuestos>
    </cfdi:Concepto>
  </cfdi:Conceptos>

  <!-- Invoice-Level Taxes -->
  <cfdi:Impuestos TotalImpuestosTrasladados="1600.00">
    <cfdi:Traslados>
      <cfdi:Traslado
        Base="10000.00"
        Impuesto="002"
        TipoFactor="Tasa"
        TasaOCuota="0.160000"
        Importe="1600.00"
      />
    </cfdi:Traslados>
  </cfdi:Impuestos>

  <!-- Digital Stamp from PAC (Timbre Fiscal Digital) -->
  <cfdi:Complemento>
    <tfd:TimbreFiscalDigital
      xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital"
      Version="1.1"
      UUID="6128E980-71F1-4A70-A192-4C1DCC2E80F9"
      FechaTimbrado="2026-02-24T10:30:05"
      RfcProvCertif="SPR190613I52"
      SelloCFD="{{base64_cfd_seal}}"
      NoCertificadoSAT="00001000000403258748"
      SelloSAT="{{base64_sat_seal}}"
    />
  </cfdi:Complemento>

</cfdi:Comprobante>
```

**Mandatory CFDI 4.0 fields breakdown:**

| Field | Description | Source in Kitz |
|---|---|---|
| `Version` | Always "4.0" | Hardcoded |
| `Serie` | Invoice series (e.g., "A", "B") | Per-workspace config |
| `Folio` | Sequential number within series | Per-workspace counter |
| `Fecha` | Issue date/time (ISO 8601, Mexico timezone) | System clock |
| `Sello` | Digital seal (SHA-256 + RSA with CSD private key) | Computed |
| `NoCertificado` | CSD certificate serial number | Workspace CSD |
| `Certificado` | Base64-encoded CSD public certificate | Workspace CSD |
| `SubTotal` | Sum of line item amounts before tax | Calculated |
| `Descuento` | Total discount amount | User input |
| `Moneda` | Currency code (SAT catalog: `MXN`, `USD`, etc.) | Workspace config |
| `Total` | Grand total (subtotal + taxes - discounts) | Calculated |
| `TipoDeComprobante` | `I`=Ingreso, `E`=Egreso, `T`=Traslado, `N`=Nomina, `P`=Pago | Based on document type |
| `MetodoPago` | `PUE` (Pago en Una sola Exhibicion) or `PPD` (Pago en Parcialidades o Diferido) | User selection |
| `FormaPago` | Payment form code from SAT catalog (see below) | Payment method |
| `LugarExpedicion` | ZIP code where invoice is issued | Workspace address |
| `Exportacion` | `01`=No export, `02`=Definitive, `03`=Temporary | Usually "01" |

**FormaPago (Payment Method) catalog -- key codes:**

| Code | Description | Kitz Mapping |
|---|---|---|
| 01 | Efectivo (Cash) | OXXO Pay, cash sales |
| 02 | Cheque nominativo | Legacy |
| 03 | Transferencia electronica de fondos | SPEI, bank transfer |
| 04 | Tarjeta de credito | Stripe, Conekta, Mercado Pago (credit) |
| 28 | Tarjeta de debito | Stripe, Conekta, Mercado Pago (debit) |
| 06 | Dinero electronico | Mercado Pago wallet, CoDi |
| 99 | Por definir | For PPD invoices (payment TBD) |

**UsoCFDI (Invoice Usage) catalog -- key codes:**

| Code | Description | Common Scenario |
|---|---|---|
| G01 | Adquisicion de mercancias | Purchasing goods |
| G03 | Gastos en general | General expenses (most common) |
| I01 | Construcciones | Construction expenses |
| I04 | Equipo de computo y accesorios | Computer equipment |
| P01 | Por definir | Undefined (for publico en general) |
| S01 | Sin efectos fiscales | No fiscal effects |
| CP01 | Pagos | For Complemento de Pago |

---

### 5.2 IVA (Impuesto al Valor Agregado)

IVA is Mexico's value-added tax, equivalent to Panama's ITBMS. It is charged on the sale of goods, provision of services, leasing, and imports.

**Tax rates:**

| Rate | Application |
|---|---|
| **16%** | Standard rate -- most goods and services in mainland Mexico |
| **8%** | Border region rate (Baja California, Sonora border strip, etc. under RESICO stimulus) |
| **0%** | Food, medicine, agricultural products, books, exports |
| **Exempt** | Medical services, education, residential rent, sale of used goods by non-habitual sellers |

**Current Kitz implementation issue:**
The `invoice_create` tool defaults to `tax_rate ?? 0.07` (7% Panama ITBMS). For Mexico:
- Standard rate must be **0.16** (16%).
- Must support per-line-item IVA rates (mixed invoices with 16%, 0%, and exempt items).
- Must handle IVA retention (retencion de IVA) for professional services.
- Must track IVA acreditable (input VAT) vs. IVA trasladado (output VAT).

**Required country-aware tax configuration:**

```typescript
// Country-aware tax configuration
interface CountryTaxConfig {
  country: 'PA' | 'MX' | 'CO' | 'CL'; // Extensible for future LatAm markets
  defaultRate: number;
  taxName: string;
  taxCode: string; // SAT tax code for Mexico
  rates: TaxRate[];
  retentions?: RetentionConfig[];
}

interface TaxRate {
  rate: number;
  label: string;
  applicability: string;
  satTipoFactor?: string; // 'Tasa' | 'Cuota' | 'Exento'
}

interface RetentionConfig {
  tax: string;        // 'IVA' or 'ISR'
  rate: number;
  applicability: string;
}

const MEXICO_TAX_CONFIG: CountryTaxConfig = {
  country: 'MX',
  defaultRate: 0.16,
  taxName: 'IVA',
  taxCode: '002', // SAT code for IVA
  rates: [
    { rate: 0.16, label: 'IVA 16%', applicability: 'Standard rate', satTipoFactor: 'Tasa' },
    { rate: 0.08, label: 'IVA 8%', applicability: 'Border region rate', satTipoFactor: 'Tasa' },
    { rate: 0.00, label: 'IVA 0%', applicability: 'Food, medicine, books, exports', satTipoFactor: 'Tasa' },
    { rate: 0.00, label: 'Exento', applicability: 'Medical, education, residential rent', satTipoFactor: 'Exento' },
  ],
  retentions: [
    { tax: 'IVA', rate: 2/3 * 0.16, applicability: 'Retencion IVA for professional services (2/3 of 16%)' },
    { tax: 'ISR', rate: 0.10, applicability: 'Retencion ISR for professional services (10%)' },
    { tax: 'ISR', rate: 0.0125, applicability: 'Retencion ISR RESICO for persona moral payer (1.25%)' },
  ],
};

const PANAMA_TAX_CONFIG: CountryTaxConfig = {
  country: 'PA',
  defaultRate: 0.07,
  taxName: 'ITBMS',
  taxCode: 'ITBMS',
  rates: [
    { rate: 0.07, label: 'ITBMS 7%', applicability: 'Standard rate' },
    { rate: 0.10, label: 'ITBMS 10%', applicability: 'Alcohol, tobacco' },
    { rate: 0.15, label: 'ITBMS 15%', applicability: 'Hotel, lodging' },
    { rate: 0.00, label: 'Exento', applicability: 'Food, medicine, exports' },
  ],
};

// Enhanced LineItem for multi-country support
interface MexicoLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  claveProdServ: string;    // SAT product/service code (mandatory)
  claveUnidad: string;       // SAT unit code (e.g., 'E48' = service, 'H87' = piece)
  noIdentificacion?: string; // Internal SKU/code
  objetoImp: '01' | '02' | '03'; // 01=No tax, 02=Yes tax, 03=Yes + exempt
  ivaRate: number;           // 0.16, 0.08, 0.00
  ivaTipoFactor: 'Tasa' | 'Exento';
  retencionIVA?: number;     // Retention rate if applicable
  retencionISR?: number;     // ISR retention rate if applicable
}
```

**IVA filing obligations:**
- Monthly declaration due by the 17th of each month.
- Declaration includes: IVA trasladado (collected), IVA acreditable (paid to suppliers), IVA retenido (retained from payments to third parties), net IVA payable or balance in favor.
- Filed via SAT portal or bank portal (declaraciones y pagos).

---

### 5.3 CFDI Complementos (Complements)

CFDI supports "complementos" -- XML extensions that attach additional structured data to a standard CFDI. Two are critical for Kitz:

**Complemento de Pago (Payment Complement):**

When a CFDI is issued with `MetodoPago="PPD"` (payment in installments or deferred), the actual payment must be documented with a separate CFDI of type `TipoDeComprobante="P"` containing a Complemento de Pago. This is mandatory.

```xml
<!-- CFDI Pago (TipoDeComprobante="P") with Complemento de Pago 2.0 -->
<cfdi:Comprobante
  Version="4.0"
  Serie="P"
  Folio="00000567"
  Fecha="2026-02-24T14:00:00"
  SubTotal="0"
  Moneda="XXX"
  Total="0"
  TipoDeComprobante="P"
  Exportacion="01"
  LugarExpedicion="06600"
  Sello="{{seal}}"
  NoCertificado="{{cert_number}}"
  Certificado="{{cert}}"
>
  <cfdi:Emisor Rfc="KIT260101ABC" Nombre="KITZ SA DE CV" RegimenFiscal="601"/>
  <cfdi:Receptor Rfc="GARA850101XYZ" Nombre="GARCIA RAMIREZ" DomicilioFiscalReceptor="01000" RegimenFiscalReceptor="626" UsoCFDI="CP01"/>

  <cfdi:Conceptos>
    <cfdi:Concepto ClaveProdServ="84111506" Cantidad="1" ClaveUnidad="ACT" Descripcion="Pago" ValorUnitario="0" Importe="0" ObjetoImp="01"/>
  </cfdi:Conceptos>

  <cfdi:Complemento>
    <pago20:Pagos
      xmlns:pago20="http://www.sat.gob.mx/Pagos20"
      Version="2.0"
    >
      <pago20:Totales
        TotalTrasladosBaseIVA16="10000.00"
        TotalTrasladosImpuestoIVA16="1600.00"
        MontoTotalPagos="11600.00"
      />
      <pago20:Pago
        FechaPago="2026-02-24T14:00:00"
        FormaDePagoP="03"
        MonedaP="MXN"
        Monto="11600.00"
        NumOperacion="{{spei_clave_rastreo}}"
        RfcEmisorCtaOrd="{{sender_bank_rfc}}"
        NomBancoOrdExt=""
        CtaOrdenante="{{sender_clabe}}"
        RfcEmisorCtaBen="{{receiver_bank_rfc}}"
        CtaBeneficiario="{{receiver_clabe}}"
      >
        <pago20:DoctoRelacionado
          IdDocumento="{{uuid_of_original_cfdi}}"
          Serie="A"
          Folio="00001234"
          MonedaDR="MXN"
          NumParcialidad="1"
          ImpSaldoAnt="11600.00"
          ImpPagado="11600.00"
          ImpSaldoInsoluto="0.00"
          ObjetoImpDR="02"
          EquivalenciaDR="1"
        >
          <pago20:ImpuestosDR>
            <pago20:TrasladosDR>
              <pago20:TrasladoDR BaseDR="10000.00" ImpuestoDR="002" TipoFactorDR="Tasa" TasaOCuotaDR="0.160000" ImporteDR="1600.00"/>
            </pago20:TrasladosDR>
          </pago20:ImpuestosDR>
        </pago20:DoctoRelacionado>
      </pago20:Pago>
    </pago20:Pagos>
  </cfdi:Complemento>
</cfdi:Comprobante>
```

**Carta Porte (Transport Document):**

The Carta Porte complement is mandatory for any CFDI that involves the transport of goods on federal roads (autotransporte federal). This affects businesses that ship physical products.

| Aspect | Detail |
|---|---|
| Effective | January 2022 (v2.0), currently v3.1 |
| When required | Any transport of goods on federal roads and highways |
| Key data | Origin/destination, vehicle/driver info, merchandise description, weight, packaging |
| Impact on Kitz | Required for e-commerce businesses shipping products |

**Implementation timeline:** Carta Porte is Q4 2026 / Future. Complemento de Pago is Q2 2026 (critical).

---

### 5.4 PAC (Proveedor Autorizado de Certificacion)

**What it is:**
A PAC is a SAT-authorized entity that validates, seals (timbra), and certifies CFDI documents. When Kitz generates a CFDI XML and signs it with the workspace's CSD (Certificado de Sello Digital), the PAC validates the XML structure, verifies the digital seal, adds the Timbre Fiscal Digital (SAT's stamp), assigns the UUID (Folio Fiscal), and sends the certified CFDI to the SAT.

**PAC providers to evaluate for Kitz:**

| PAC | Strengths | API Quality | Pricing Model | Kitz Fit |
|---|---|---|---|---|
| **Facturapi** | Developer-first, modern REST API, Mexico-native | Excellent -- modern REST, Node.js SDK | Per-invoice (starting MXN $0.40/invoice) | **Top recommendation** |
| **Digilog** | Full-service PAC, enterprise ready | Good REST API | Volume-based | Good for scale |
| **Edicom** | International, multi-country e-invoicing | Enterprise API (SOAP + REST) | Enterprise pricing | If multi-country needed |
| **Aspel (Sage)** | Established, strong in SMB accounting | Legacy API | Bundle with Aspel products | Competitor -- avoid |
| **Contpaqi** | Dominant in Mexican SMB accounting | Limited API, desktop-first | License-based | Competitor -- avoid |
| **SW SmartWeb** | Pure PAC service, API-focused | Good REST API | Volume-based | Good alternative |
| **Finkok** | Developer-friendly, competitive pricing | REST API | Per-stamp | Viable option |

**Facturapi integration (recommended):**

```typescript
import Facturapi from 'facturapi';

const facturapi = new Facturapi(process.env.FACTURAPI_API_KEY!);

interface KitzCFDIRequest {
  workspaceId: string;
  invoiceNumber: string;
  customer: {
    rfc: string;
    name: string;
    fiscalRegime: string;
    fiscalZip: string;
    email?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    productKey: string;     // ClaveProdServ from SAT catalog
    unitKey: string;        // ClaveUnidad from SAT catalog
    taxIncluded?: boolean;
  }>;
  paymentMethod: 'PUE' | 'PPD';
  paymentForm: string;        // FormaPago code
  series?: string;
  currency?: string;
  cfdiUse?: string;           // UsoCFDI code
}

async function issueCFDI(request: KitzCFDIRequest): Promise<{
  uuid: string;
  xml: string;
  pdfUrl: string;
  status: string;
}> {
  // 1. Create or find customer in Facturapi
  let customer;
  try {
    const customers = await facturapi.customers.list({ search: request.customer.rfc });
    customer = customers.data.find((c: any) => c.tax_id === request.customer.rfc);
  } catch { /* not found */ }

  if (!customer) {
    customer = await facturapi.customers.create({
      legal_name: request.customer.name,
      tax_id: request.customer.rfc,
      tax_system: request.customer.fiscalRegime,
      address: { zip: request.customer.fiscalZip },
      email: request.customer.email,
    });
  }

  // 2. Create the CFDI invoice via Facturapi
  const invoice = await facturapi.invoices.create({
    type: 'I', // Ingreso
    customer: customer.id,
    payment_method: request.paymentMethod,
    payment_form: request.paymentForm,
    use: request.cfdiUse || 'G03',
    currency: request.currency || 'MXN',
    series: request.series || 'A',
    folio_number: parseInt(request.invoiceNumber.replace(/\D/g, '')),
    items: request.items.map(item => ({
      product: {
        description: item.description,
        product_key: item.productKey,
        unit_key: item.unitKey,
        unit_name: getUnitName(item.unitKey),
        price: item.unitPrice,
        tax_included: item.taxIncluded ?? false,
        taxes: [{ type: 'IVA', rate: 0.16 }],
      },
      quantity: item.quantity,
    })),
  });

  // 3. Download XML for archival
  const xmlBuffer = await facturapi.invoices.downloadXml(invoice.id);

  return {
    uuid: invoice.uuid,
    xml: xmlBuffer.toString('utf-8'),
    pdfUrl: `https://www.facturapi.io/v2/invoices/${invoice.id}/pdf`,
    status: invoice.status,
  };
}

function getUnitName(unitKey: string): string {
  const UNIT_NAMES: Record<string, string> = {
    'E48': 'Unidad de servicio',
    'H87': 'Pieza',
    'KGM': 'Kilogramo',
    'LTR': 'Litro',
    'XBX': 'Caja',
    'ACT': 'Actividad',
    'DAY': 'Dia',
    'MON': 'Mes',
  };
  return UNIT_NAMES[unitKey] || 'Pieza';
}
```

**CSD (Certificado de Sello Digital) management:**

Every Mexican business needs a CSD to digitally sign CFDI. The CSD is issued by the SAT and consists of a .cer file (public certificate) and a .key file (private key, protected by a password).

```typescript
interface CSDConfiguration {
  workspaceId: string;
  certificateBase64: string;  // .cer file content, base64 encoded
  privateKeyBase64: string;   // .key file content, base64 encoded (encrypted)
  privateKeyPassword: string; // Password to decrypt .key file
  serialNumber: string;       // 20-digit certificate serial number
  validFrom: Date;
  validTo: Date;
  rfc: string;                // RFC associated with the CSD
}

// CSD must be securely stored -- encrypt at rest
// CSD expires every 4 years -- Kitz must alert workspace owners before expiration
// Multiple CSDs can be active; newest is preferred
```

---

### 5.5 CFDI Cancelation Rules

Since January 2022, CFDI cancelation has strict rules:

| Scenario | Rule |
|---|---|
| Within 24 hours of issuance | Can be canceled without receiver acceptance |
| After 24 hours | Requires receiver acceptance (receiver has 72 hours to accept/reject) |
| If receiver does not respond in 72 hours | Cancelation is automatically accepted |
| Cancelation motives | `01`=Invoice with errors (replacement), `02`=Invoice with errors (no replacement), `03`=Operation not carried out, `04`=Nominative operation related to a prior invoice |

**Cancelation flow for Kitz:**

```typescript
interface CFDICancelation {
  uuid: string;                       // UUID of CFDI to cancel
  motivo: '01' | '02' | '03' | '04'; // Cancelation motive
  folioSustitucion?: string;          // UUID of replacement CFDI (required if motivo='01')
}

async function cancelCFDI(
  workspaceId: string,
  cancelation: CFDICancelation
): Promise<{ status: 'accepted' | 'pending_acceptance' | 'rejected'; message: string }> {
  // Validate: if motivo is '01', folioSustitucion must be provided
  if (cancelation.motivo === '01' && !cancelation.folioSustitucion) {
    throw new Error('Replacement UUID (folioSustitucion) required when motivo is 01');
  }

  // Call PAC cancelation API
  const result = await facturapi.invoices.cancel(cancelation.uuid, {
    motive: cancelation.motivo,
    substitution: cancelation.folioSustitucion,
  });

  return {
    status: result.status,
    message: result.status === 'pending_acceptance'
      ? 'Cancelation sent to receiver for acceptance. They have 72 hours to respond.'
      : `CFDI ${cancelation.uuid} has been ${result.status}.`,
  };
}
```

---

### 5.6 ClaveProdServ (Product/Service Catalog)

The SAT maintains a catalog of over 50,000 product and service codes (ClaveProdServ) that must be included on every CFDI line item. This is one of the most complex aspects of Mexican invoicing.

**Common codes for Kitz's target market:**

| ClaveProdServ | Description | Kitz Use Case |
|---|---|---|
| 43232408 | Software as a service (SaaS) | Kitz subscription billing |
| 80111600 | Temporary staffing services | Freelance/consulting |
| 80101500 | Management advisory services | Consulting firms |
| 90101501 | Restaurants and catering | Food businesses |
| 60101700 | Arts and crafts supplies | Artisan businesses |
| 50202200 | Beverages | Cafes, bars |
| 53101600 | Clothing | Retail fashion |
| 81112100 | Internet services | Tech businesses |
| 84111506 | Billing services | For Complemento de Pago |
| 01010101 | No matching catalog code | Fallback (use sparingly, may trigger SAT review) |

**Kitz should provide:**
1. A searchable ClaveProdServ catalog within the invoice creation flow.
2. Per-product default ClaveProdServ assignment (save once, reuse).
3. Most-used codes surfaced first based on workspace industry.
4. Validation that the code exists in the SAT catalog before CFDI generation.

---

## 6. Payment Flow Architecture

### 6.1 End-to-End Payment Flow (Mexico)

```
                        CFDI + PAYMENT LIFECYCLE
                        ========================

  Kitz Workspace Owner                    Customer
        |                                    |
        |  Creates invoice (invoice_create)  |
        |  with line items + IVA 16%         |
        |  + ClaveProdServ + RFC receptor    |
        |                                    |
        v                                    |
  +-----------+                              |
  | Invoice   |                              |
  | Data      |                              |
  | Assembled |                              |
  +-----------+                              |
        |                                    |
        v                                    |
  +-----------+       +-----------+          |
  | CFDI XML  |------>| PAC       |          |
  | Generated |       | (e.g.,    |          |
  | + CSD     |       | Facturapi)|          |
  | Sealed    |       +-----------+          |
  +-----------+            |                 |
        |             UUID assigned          |
        |             Timbre Fiscal          |
        |             SAT notified           |
        v                                    |
  +-----------+                              |
  | Timbrada  | -- PDF/HTML visual rep ----> | Customer receives
  | CFDI      |    sent via WhatsApp/Email   | invoice + payment
  | (UUID)    |                              | instructions
  +-----------+                              |
        |                                    |
        +-------- SPEI (via STP) -----+      |
        |                             |      |
        +---- OXXO Pay (via Conekta) -+      |
        |                             |      |
        +---- Mercado Pago -----------+      |
        |                             |      |
        +---- CoDi QR ----------------+      |
        |                             |      |
        +---- Card (via Stripe/Conekta)+     |
        |                             v      |
        |                       +-----------+|
        |                       | Customer  ||
        |                       | Pays      ||
        |                       +-----------+|
        |                             |      |
        v                             v      |
  +-----------+               +-----------+  |
  | Webhook   | <-- Provider  | Payment   |  |
  | Received  |    callback   | Confirmed |  |
  +-----------+               +-----------+  |
        |                                    |
        v                                    |
  +---------------------------+              |
  | payments_processWebhook   |              |
  | (provider: 'spei'|'oxxo' |              |
  |  |'mercadopago'|'conekta' |              |
  |  |'stripe'|'codi')       |              |
  +---------------------------+              |
        |                                    |
        +-- Invoice status -> 'paid'         |
        +-- CRM contact -> payment recorded  |
        +-- WhatsApp receipt sent ---------->|
        +-- Revenue dashboard updated        |
        |                                    |
        v                                    |
  +---------------------------+              |
  | IF MetodoPago was 'PPD':  |              |
  |   Issue Complemento de    |              |
  |   Pago (CFDI type 'P')   |              |
  |   via PAC                 |              |
  +---------------------------+              |
        |                                    |
        +-- IVA ledger updated               |
        +-- ISR calculation updated          |
        +-- Monthly tax pre-report updated   |
```

### 6.2 Webhook Processing -- Mexico Provider Expansion

The existing `payments_processWebhook` in `paymentTools.ts` needs to expand its provider enum:

```typescript
// Current: paymentTools.ts line 28
provider: {
  type: 'string',
  enum: ['stripe', 'paypal', 'yappy', 'bac'],
  description: 'Payment provider',
}

// Required for Mexico:
provider: {
  type: 'string',
  enum: [
    // Panama
    'stripe', 'paypal', 'yappy', 'bac',
    // Mexico
    'spei', 'codi', 'mercadopago', 'oxxo', 'conekta', 'clip',
  ],
  description: 'Payment provider',
}

// Currency must also become country-aware:
currency: {
  type: 'string',
  description: 'ISO currency code (default: workspace currency -- USD for Panama, MXN for Mexico)',
}
```

### 6.3 Multi-Provider Strategy (Mexico)

```
Priority 1 (Q1 2026):  SPEI via STP       -- B2B payments, free, instant
Priority 2 (Q2 2026):  Conekta            -- OXXO + cards + SPEI collection in one gateway
Priority 3 (Q2 2026):  Mercado Pago       -- All-in-one consumer gateway, wallet payments
Priority 4 (Q2 2026):  CoDi               -- Free QR payments for storefront
Priority 5 (Q3 2026):  Stripe Mexico      -- International cards, secondary gateway
Priority 6 (Future):   Clip               -- POS reconciliation when API available
Priority 7 (Future):   PayPal Mexico      -- International fallback
```

---

## 7. Currency & Localization

### 7.1 Currency

| Aspect | Detail |
|---|---|
| Official currency | Mexican Peso (MXN) |
| ISO code | `MXN` |
| Symbol | `$` (same as USD -- **disambiguation is critical**) |
| Common disambiguation | `MXN $1,234.56` or `$1,234.56 MXN` or `M.N.` (Moneda Nacional) |
| Thousands separator | Comma (`,`) |
| Decimal separator | Period (`.`) |
| Kitz `paymentTools.ts` change | Default currency must switch from `'USD'` to workspace-configured currency |
| Exchange rates | MXN/USD fluctuates (~MXN $17--20 per USD in 2025--2026) |

**Display conventions:**

```typescript
function formatMexicanCurrency(amount: number, options?: { showCode?: boolean }): string {
  const formatted = amount.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  // Use MXN prefix to disambiguate from USD
  return options?.showCode ? `MXN $${formatted}` : `$${formatted}`;
}

// Examples:
// formatMexicanCurrency(1234.56)                   -> "$1,234.56"
// formatMexicanCurrency(1234.56, { showCode: true }) -> "MXN $1,234.56"
```

**Current Kitz code in `invoiceQuoteTools.ts` uses:**
```typescript
subtotal: `$${subtotal.toFixed(2)}`
```
This must become country-aware:
```typescript
subtotal: formatCurrency(subtotal, workspace.country) // "$1,234.56" for PA, "MXN $1,234.56" for MX
```

### 7.2 Date Format

| Context | Format | Example |
|---|---|---|
| User-facing display | DD/MM/YYYY | 24/02/2026 |
| CFDI XML | YYYY-MM-DDTHH:mm:ss | 2026-02-24T10:30:00 |
| Internal storage (ISO 8601) | YYYY-MM-DDTHH:mm:ssZ | 2026-02-24T16:30:00Z |
| Timezone | America/Mexico_City (UTC-6, CST / UTC-5, CDT) | |
| Current Kitz | `now.toLocaleDateString('es-PA')` | Must use `'es-MX'` for Mexico |

**CFDI requires Mexico timezone, not UTC:**

```typescript
function getCFDITimestamp(): string {
  // CFDI Fecha must be in Mexico City timezone (no Z suffix, no UTC)
  const now = new Date();
  const mexicoTime = now.toLocaleString('sv-SE', {
    timeZone: 'America/Mexico_City',
    hour12: false,
  });
  // sv-SE locale gives YYYY-MM-DD HH:mm:ss format
  return mexicoTime.replace(' ', 'T');
  // Result: "2026-02-24T10:30:00"
}
```

### 7.3 Phone Numbers

| Aspect | Detail |
|---|---|
| Country code | +52 |
| Mobile format | +52 (area code)(7 digits) -- 10 digits total after country code |
| Area codes | 2--3 digits (55 = Mexico City, 33 = Guadalajara, 81 = Monterrey) |
| WhatsApp format | `521XXXXXXXXXX` (country code + 1 + 10 digits) |
| Landline | Same 10-digit format since 2019 reform |

**Validation regex:**

```typescript
// Mexican phone number (10 digits after country code)
const MEXICO_PHONE = /^\+?52\s?1?\s?\d{2,3}\s?\d{3,4}\s?\d{4}$/;

// Strict format: +52 followed by exactly 10 digits
const MEXICO_PHONE_STRICT = /^\+?52\d{10}$/;

// WhatsApp-ready format
function toMexicoWhatsApp(phone: string): string {
  const digits = phone.replace(/[\s\-\+\(\)]/g, '');
  // Ensure format: 521XXXXXXXXXX (13 digits)
  if (digits.startsWith('52') && digits.length === 12) {
    return `521${digits.substring(2)}`; // Insert the '1' for WhatsApp
  }
  if (digits.startsWith('521') && digits.length === 13) {
    return digits; // Already correct
  }
  if (digits.length === 10) {
    return `521${digits}`; // Prepend country code + 1
  }
  throw new Error(`Cannot parse Mexican phone number: ${phone}`);
}

// Examples:
// toMexicoWhatsApp('+52 55 1234 5678')   -> '5215512345678'
// toMexicoWhatsApp('5512345678')          -> '5215512345678'
// toMexicoWhatsApp('+521 55 1234 5678')   -> '5215512345678'
```

### 7.4 Address Format

Mexico uses a structured address format with the unique concept of "colonia" (neighborhood). Addresses also include a 5-digit postal code (codigo postal), which is mandatory on CFDI 4.0.

**Standard format:**
```
{Calle} {Numero Exterior} {Numero Interior (optional)}
{Colonia}
{Municipio/Alcaldia}, {Estado}
C.P. {Codigo Postal}
Mexico
```

**Example:**
```
Av. Paseo de la Reforma 505, Piso 12
Col. Cuauhtemoc
Cuauhtemoc, Ciudad de Mexico
C.P. 06500
Mexico
```

**Address interface for Kitz:**

```typescript
interface MexicoAddress {
  calle: string;             // Street name
  numeroExterior: string;    // External number
  numeroInterior?: string;   // Internal number (apt, suite, floor)
  colonia: string;           // Neighborhood (critical in Mexico)
  municipio: string;         // Municipality or alcaldia (CDMX)
  estado: string;            // State (32 states)
  codigoPostal: string;      // 5-digit ZIP code (required for CFDI)
  pais: string;              // 'MEX'
}

// Codigo postal validation
const MEXICO_ZIP = /^\d{5}$/;

// The codigo postal is MANDATORY on CFDI 4.0 for:
// - LugarExpedicion (issuer's ZIP)
// - DomicilioFiscalReceptor (receiver's fiscal ZIP)
// SAT validates these against their postal code catalog
```

### 7.5 Language

- All Kitz UI for Mexico: Spanish (Mexican variant, `es-MX`)
- Invoice templates already use Spanish (`Factura`, `Cotizacion`, etc.) -- compatible
- SAT-specific terminology that differs from Panama:
  - "CFDI" instead of "Factura Electronica"
  - "RFC" instead of "RUC"
  - "IVA" instead of "ITBMS"
  - "Timbre Fiscal" instead of "CUFE"
  - "Regimen Fiscal" (no Panama equivalent)
  - "ClaveProdServ" (no Panama equivalent)
  - "Complemento de Pago" (no Panama equivalent)
- Locale: `es-MX` for date/number formatting

---

## 8. Competitive Landscape

### 8.1 Direct Competitors (Mexico SMB Software)

| Competitor | Strengths | Weaknesses | Kitz Differentiator |
|---|---|---|---|
| **Alegra** | Strong LatAm presence, cloud-based, affordable, CFDI-compliant | Generic LatAm -- not Mexico-optimized; no AI features; limited payment integration | Kitz is AI-native, WhatsApp-first, deep payment integration |
| **Siigo** | Large company, acquired Contabilizate (Mexico), CFDI support | Enterprise-oriented, complex UI, expensive for micro businesses | Kitz is lightweight, mobile-first, micro-SMB pricing |
| **QuickBooks Mexico** | Global brand recognition, robust accounting, CFDI via third-party | Expensive (MXN $599+/month), not natively Mexican, clunky CFDI workflow | Kitz: native CFDI, lower price, AI automation |
| **Aspel (Sage)** | Dominant legacy player in Mexican accounting, own PAC | Desktop-first, dated UX, no AI, no WhatsApp integration | Kitz: cloud-native, AI-powered, modern UX |
| **Contpaqi** | Market leader in Mexican SMB accounting/invoicing, CFDI compliant | Desktop-heavy, expensive licenses, steep learning curve | Kitz: zero-install, conversational interface, AI-first |
| **Bind ERP** | Cloud-native Mexican ERP, inventory management, CFDI | Complex (full ERP), pricing targets medium businesses, no AI | Kitz: simpler, SMB-focused, AI-native |
| **Facturapi** | Excellent CFDI API, developer-friendly, modern | API-only -- not an end-user product; no CRM/payments/content | **Partner, not competitor** -- use as PAC |
| **Bling** | Brazilian cloud ERP expanding to Mexico, affordable | New to Mexico, limited CFDI maturity, Portuguese-first development | Kitz: Mexico-aware from start, LatAm-native Spanish |

### 8.2 Kitz's Competitive Advantages for Mexico

1. **AI-native business OS:** No Mexican SMB tool offers AI-powered content creation, customer communication, and business automation. Contpaqi and Aspel are desktop software with zero AI capability.
2. **WhatsApp-first:** WhatsApp is the primary business communication channel in Mexico (90%+ smartphone penetration). Kitz treats it as a core channel.
3. **CFDI as a feature, not a product:** Competitors sell CFDI compliance as their main product. Kitz bundles CFDI within a complete business OS (CRM + invoicing + payments + content + WhatsApp), making compliance automatic rather than a chore.
4. **Payment integration breadth:** SPEI + OXXO + Mercado Pago + CoDi + cards in one platform. No competitor offers this depth of payment integration alongside CRM and invoicing.
5. **RESICO-optimized:** Target the millions of RESICO taxpayers with simplified tax workflows, automatic ISR calculation, and monthly declaration preparation.
6. **Multi-country from birth:** Same platform serves Panama, Mexico, Colombia -- workspace-level country configuration rather than separate products.

---

## 9. Implementation Roadmap

### Phase 1: CFDI Foundation (Q1 2026)

| Priority | Task | Owner | Status |
|---|---|---|---|
| P0 | Legal assessment: CNBV/Fintech Law licensing requirement | Legal | Not started |
| P0 | PAC provider selection and API integration (Facturapi recommended) | Engineering | Not started |
| P0 | RFC validation in workspace onboarding | Engineering | Not started |
| P0 | Country-aware tax configuration (`MX_TAX_CONFIG` with 16% IVA) | Engineering | Not started |
| P1 | CFDI 4.0 XML generation pipeline (Ingreso type) | Engineering | Not started |
| P1 | CSD (digital certificate) management per workspace | Engineering | Not started |
| P1 | ClaveProdServ catalog integration and search | Engineering | Not started |
| P1 | STP partnership initiation for SPEI collection | Business Dev | Not started |
| P1 | Expand `paymentTools.ts` provider enum for Mexico | Engineering | Not started |
| P2 | CLABE validation utility | Engineering | Not started |

### Phase 2: Payment & Compliance (Q2 2026)

| Priority | Task | Owner | Status |
|---|---|---|---|
| P0 | SPEI payment collection via STP (webhook + reconciliation) | Engineering | Blocked by STP partnership |
| P0 | Conekta gateway integration (OXXO + cards + SPEI) | Engineering | Not started |
| P0 | Complemento de Pago automatic issuance on payment receipt | Engineering | Blocked by PAC integration |
| P1 | Mercado Pago Checkout Pro integration | Engineering | Not started |
| P1 | CoDi QR generation for storefront | Engineering | Not started |
| P1 | CFDI cancelation flow (with receiver acceptance) | Engineering | Not started |
| P1 | Invoice-to-payment linking via reference/UUID matching | Engineering | Not started |
| P2 | IVA monthly pre-filing report generation | Engineering | Not started |
| P2 | ISR provisional payment calculation (RESICO + general) | Engineering | Not started |
| P2 | WhatsApp CFDI delivery (PDF + XML attachment) | Engineering | Not started |

### Phase 3: Growth & Optimization (Q3 2026)

| Priority | Task | Owner | Status |
|---|---|---|---|
| P1 | Stripe Mexico configuration (secondary card gateway) | Engineering | Not started |
| P1 | Multi-series invoice support (Serie A, B, etc.) | Engineering | Not started |
| P1 | Credit note (Nota de Credito) CFDI generation | Engineering | Not started |
| P2 | RESICO dashboard (monthly income tracking vs. limit) | Engineering | Not started |
| P2 | Bank statement import for reconciliation (CSV, OFX) | Engineering | Not started |
| P2 | Annual tax declaration preparation helper | Engineering | Not started |
| P3 | Clip POS reconciliation (when API available) | Engineering | Not started |

### Phase 4: Advanced Compliance (Q4 2026+)

| Priority | Task | Owner | Status |
|---|---|---|---|
| P2 | Carta Porte complement for shipping businesses | Engineering | Not started |
| P2 | Payroll CFDI (Nomina) for businesses with employees | Engineering | Not started |
| P2 | Multi-currency CFDI (USD invoices with MXN equivalent) | Engineering | Not started |
| P3 | Addenda support (custom XML extensions for large buyers like Walmart, FEMSA) | Engineering | Not started |
| P3 | Automatic SAT catalog updates (ClaveProdServ, postal codes) | Engineering | Not started |
| P3 | Direct Banxico CoDi integration (bypass bank intermediary) | Engineering | Not started |

---

## 10. Compliance Checklist for Launch

Before Kitz can generate invoices and process payments in Mexico, the following must be verified:

### Legal & Regulatory

- [ ] CNBV/Fintech Law assessment completed -- determination of licensing requirements
- [ ] Privacy policy updated for LFPDPPP (Mexican data protection law) compliance
- [ ] Terms of service reviewed by Mexican attorney
- [ ] AML/KYC policy documented and implemented per CNBV requirements
- [ ] PAC partnership agreement signed (or Kitz authorized as PAC -- unlikely for launch)
- [ ] STP client registration completed (for SPEI payment collection)

### Tax Compliance (CFDI)

- [ ] CFDI 4.0 XML generation fully implemented and validated against SAT XSD schema
- [ ] CSD digital certificate management functional (upload, validate, rotate, expiration alerts)
- [ ] PAC API integration tested -- invoices successfully timbradas in sandbox
- [ ] UUID (Folio Fiscal) stored and displayed on all invoices
- [ ] Complemento de Pago automatic issuance on PPD invoice payment
- [ ] CFDI cancelation flow implemented with receiver acceptance workflow
- [ ] ClaveProdServ catalog loaded and searchable
- [ ] SAT fiscal regime codes configured and validated
- [ ] UsoCFDI options presented based on receiver's fiscal regime
- [ ] IVA calculation supports 16%, 8% (border), 0%, and exempt
- [ ] IVA retention calculation for professional services
- [ ] ISR retention calculation for applicable scenarios
- [ ] RFC validation for both persona moral (12 chars) and persona fisica (13 chars)
- [ ] RESICO-specific tax calculations implemented
- [ ] 5-year CFDI archive infrastructure in place (XML + PDF)

### Payment Processing

- [ ] STP CLABE assignment per workspace functional
- [ ] SPEI webhook receiver tested end-to-end
- [ ] Conekta gateway integration tested (OXXO, cards, SPEI)
- [ ] Mercado Pago Checkout Pro integration tested
- [ ] Payment-to-invoice linking via reference/UUID matching functional
- [ ] Transaction data retention policy (5+ years) implemented
- [ ] Payment reconciliation reports available
- [ ] Multi-provider fallback handling (if primary gateway down)

### User Experience

- [ ] Workspace onboarding captures: business name, RFC, fiscal regime, CSD files, fiscal ZIP code
- [ ] Currency displayed as `$` with `MXN` disambiguation where needed
- [ ] Dates displayed as DD/MM/YYYY in UI, YYYY-MM-DDTHH:mm:ss in CFDI
- [ ] Phone numbers validated for Mexico format (+52)
- [ ] All UI text in Spanish (Mexican variant, `es-MX`)
- [ ] Address form includes colonia, municipio, estado, codigo postal
- [ ] ClaveProdServ search/selection integrated into invoice line items
- [ ] WhatsApp delivery of CFDI (PDF representation + XML download link)
- [ ] Fiscal regime selector during onboarding with RESICO highlighted

---

## 11. Partnership Opportunities

### 11.1 Strategic Partnerships

| Partner | Type | Value to Kitz | Approach |
|---|---|---|---|
| **Facturapi** | PAC / e-invoicing infrastructure | CFDI generation, stamping, validation, XML archival | API integration partnership; volume pricing negotiation |
| **STP** | Payment infrastructure | SPEI access, CLABE assignment, real-time payment notifications | Client registration; dedicated account manager |
| **Conekta** | Payment gateway | OXXO + cards + SPEI in one API; Mexico-native support | Developer partnership; co-marketing opportunity |
| **Mercado Pago** | Payment gateway + wallet | Largest digital wallet in Mexico; maximum payment acceptance | Marketplace partnership; API integration |
| **BBVA Mexico** | Banking | Largest bank, API banking program, SMB lending | Explore BBVA Open Platform (API banking) |
| **Banorte** | Banking | Largest Mexican-owned bank, strong SMB focus, government payroll | Commercial partnership |
| **Nu Mexico** | Digital banking | Fast-growing, tech-forward, same target demographic as Kitz | Co-marketing to digital-first SMBs |

### 11.2 Distribution Partnerships

| Partner | Channel | Opportunity |
|---|---|---|
| **INADEM / SE** | Government agency | Feature Kitz in SMB digitization programs; Secretaria de Economia programs |
| **CONCANACO-SERVYTUR** | Business chamber | National confederation of chambers of commerce -- access to 700K+ member businesses |
| **CANACINTRA** | Industrial chamber | Access to manufacturing SMBs |
| **Accountants (Contadores)** | Professional network | Referral program for contadores who recommend Kitz to clients |
| **SAT / PRODECON** | Government / ombudsman | Position Kitz as CFDI-simplification tool; partnership with taxpayer defense office |
| **Startup Mexico** | Accelerator network | Access to early-stage businesses needing Kitz from day one |
| **OXXO / FEMSA** | Retail network | Co-branded OXXO Pay promotion for Kitz merchants |

### 11.3 Technology Partnerships

| Partner | Integration | Value |
|---|---|---|
| **SAT Web Services** | Direct CFDI validation | Verify CFDIs directly with SAT for reconciliation |
| **Banxico (SPEI/CoDi)** | Payment rails | Direct access to payment infrastructure (via STP) |
| **Postal code catalog (SEPOMEX)** | Address validation | Validate codigo postal against SEPOMEX database |
| **INE / RENAPO** | Identity verification | CURP/INE validation for KYC during onboarding |

---

## 12. Appendix: Reference Links

### Payment Systems
- SPEI (Banxico): https://www.banxico.org.mx/sistemas-de-pago/
- CoDi (Banxico): https://www.banxico.org.mx/sistemas-de-pago/codi-702702.html
- STP: https://www.stp.mx
- Conekta: https://www.conekta.com & https://developers.conekta.com
- Mercado Pago: https://www.mercadopago.com.mx/developers
- OXXO Pay: https://conekta.com/en/payments/cash (via Conekta)
- Clip: https://clip.mx
- Stripe Mexico: https://stripe.com/mx
- PayPal Mexico: https://www.paypal.com/mx

### Government & Tax
- SAT Portal: https://www.sat.gob.mx
- CFDI 4.0 Technical Annex: https://www.sat.gob.mx/consultas/43074/formato-de-factura-electronica-(anexo-20)
- CFDI Validation: https://verificacfdi.facturaelectronica.sat.gob.mx
- SAT Catalogs (ClaveProdServ): https://www.sat.gob.mx/consultas/35025/catalogo-de-productos-y-servicios
- CNBV: https://www.gob.mx/cnbv
- Fintech Law: https://www.diputados.gob.mx/LeyesBiblio/pdf/LRITF.pdf
- LFPDPPP (Data Protection): https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf
- RENAPO (CURP): https://www.gob.mx/curp/
- SEPOMEX (Postal Codes): https://www.correosdemexico.gob.mx/SSLServicios/ConsultaCP/

### Banking
- BBVA Mexico: https://www.bbva.mx
- Banorte: https://www.banorte.com
- Santander Mexico: https://www.santander.com.mx
- Citibanamex: https://www.banamex.com
- Banco Azteca: https://www.bancoazteca.com.mx
- Nu Mexico: https://nu.com.mx
- HSBC Mexico: https://www.hsbc.com.mx
- Banregio / Hey Banco: https://www.heybanco.com

### PAC Providers
- Facturapi: https://www.facturapi.io & https://docs.facturapi.io
- Finkok: https://www.finkok.com
- Digilog: https://www.digilog.mx
- SW SmartWeb: https://sw.com.mx
- Edicom: https://www.edicomgroup.com
- SAT PAC list: https://www.sat.gob.mx/consultas/20585/conoce-la-lista-de-proveedores-autorizados-de-certificacion

### Regulatory References
- CFDI 4.0 (Anexo 20, version 4.0): SAT technical annex defining XML schema
- Resolucion Miscelanea Fiscal 2026: Annual tax rules and procedures
- Ley del ISR (Income Tax Law): Federal income tax regulations
- Ley del IVA (VAT Law): Federal value-added tax regulations
- Codigo Fiscal de la Federacion (CFF): Federal tax code
- Ley para Regular las Instituciones de Tecnologia Financiera (Fintech Law, 2018)
- RESICO: Articles 113-E through 113-J of the ISR Law (personas fisicas) and Title VII, Chapter XII (personas morales)

### Market Intelligence
- INEGI (National Statistics): https://www.inegi.org.mx
- ENAPROCE (SMB Census): https://www.inegi.org.mx/programas/enaproce/
- Banxico Payment Statistics: https://www.banxico.org.mx/SieInternet/
- Mexican Fintech Association: https://www.fintechmexico.org

### Kitz Codebase References
- Payment tools: `kitz_os/src/tools/paymentTools.ts` -- provider enum expansion needed
- Invoice/quote tools: `kitz_os/src/tools/invoiceQuoteTools.ts` -- CFDI XML pipeline needed
- Content engine: `kitz_os/src/tools/contentEngine.ts` -- country-aware brand/locale config
- Invoice workflow: `kitz_os/data/n8n-workflows/invoice-auto-generate.json`

---

## Appendix A: Country Configuration Architecture

To support both Panama and Mexico (and future LatAm markets) from the same codebase, Kitz needs a workspace-level country configuration system:

```typescript
interface WorkspaceCountryConfig {
  country: 'PA' | 'MX'; // Extensible: 'CO', 'CL', 'AR', etc.
  currency: string;       // 'USD' for PA, 'MXN' for MX
  locale: string;         // 'es-PA', 'es-MX'
  timezone: string;       // 'America/Panama', 'America/Mexico_City'
  taxConfig: CountryTaxConfig;
  invoiceConfig: CountryInvoiceConfig;
  paymentProviders: string[];    // Available providers for this country
  phoneCountryCode: string;      // '+507', '+52'
  idType: string;                // 'RUC' for PA, 'RFC' for MX
  idValidationRegex: RegExp;
}

interface CountryInvoiceConfig {
  requiresEInvoice: boolean;
  eInvoiceFormat: 'DGI_XML' | 'CFDI_XML' | 'HTML_ONLY';
  requiresPAC: boolean;
  pacProvider?: string;          // 'facturapi', 'gosocket', etc.
  requiresDigitalSeal: boolean;
  invoiceNumberFormat: string;   // '{serie}-{folio}' for MX, '{branch}-{seq}' for PA
  mandatoryFields: string[];     // Country-specific required fields
}

const MEXICO_CONFIG: WorkspaceCountryConfig = {
  country: 'MX',
  currency: 'MXN',
  locale: 'es-MX',
  timezone: 'America/Mexico_City',
  taxConfig: MEXICO_TAX_CONFIG,
  invoiceConfig: {
    requiresEInvoice: true,
    eInvoiceFormat: 'CFDI_XML',
    requiresPAC: true,
    pacProvider: 'facturapi',
    requiresDigitalSeal: true,
    invoiceNumberFormat: '{serie}-{folio}',
    mandatoryFields: [
      'rfc_emisor', 'rfc_receptor', 'regimen_fiscal_emisor',
      'regimen_fiscal_receptor', 'domicilio_fiscal_receptor',
      'uso_cfdi', 'clave_prod_serv', 'clave_unidad',
      'metodo_pago', 'forma_pago', 'lugar_expedicion',
    ],
  },
  paymentProviders: ['spei', 'codi', 'mercadopago', 'oxxo', 'conekta', 'clip', 'stripe', 'paypal'],
  phoneCountryCode: '+52',
  idType: 'RFC',
  idValidationRegex: /^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/,
};

const PANAMA_CONFIG: WorkspaceCountryConfig = {
  country: 'PA',
  currency: 'USD',
  locale: 'es-PA',
  timezone: 'America/Panama',
  taxConfig: PANAMA_TAX_CONFIG,
  invoiceConfig: {
    requiresEInvoice: true,
    eInvoiceFormat: 'DGI_XML',
    requiresPAC: true,
    pacProvider: 'gosocket',
    requiresDigitalSeal: true,
    invoiceNumberFormat: '{branch}-{seq}',
    mandatoryFields: [
      'ruc_emisor', 'ruc_receptor', 'cufe', 'punto_facturacion',
    ],
  },
  paymentProviders: ['yappy', 'bac', 'stripe', 'paypal'],
  phoneCountryCode: '+507',
  idType: 'RUC',
  idValidationRegex: /^(\d{1,2}-\d{1,4}-\d{1,6}|(E|PE|N)-\d{1,4}-\d{1,6}|\d{1,7}-\d{1,4}-\d{1,6})$/,
};
```

## Appendix B: CFDI XML Generation Pipeline (Architecture)

```
+------------------+     +-------------------+     +------------------+
| Kitz invoice_    |     | CFDI Builder      |     | PAC API          |
| create() tool    |---->| Service           |---->| (Facturapi)      |
|                  |     |                   |     |                  |
| - contact_name   |     | 1. Validate RFC   |     | 1. Validate XML  |
| - line_items     |     | 2. Map to CFDI    |     | 2. Apply timbre  |
| - tax_rate       |     |    structure      |     | 3. Return UUID   |
| - notes          |     | 3. Add SAT codes  |     | 4. Send to SAT   |
| + rfc_receptor   |     | 4. Calculate taxes|     |                  |
| + regimen_fiscal |     | 5. Generate XML   |     +------------------+
| + uso_cfdi       |     | 6. Sign with CSD  |            |
| + forma_pago     |     |                   |            v
| + metodo_pago    |     +-------------------+     +------------------+
| + clave_prod_srv |            |                  | Response:        |
+------------------+            |                  | - UUID           |
                                v                  | - XML (timbrado) |
                         +-------------------+     | - PDF URL        |
                         | Content Engine    |     | - Status         |
                         | (HTML/PDF visual) |     +------------------+
                         |                   |
                         | Generates visual  |
                         | representation    |
                         | using brand kit + |
                         | CFDI data         |
                         +-------------------+
                                |
                                v
                         +-------------------+
                         | Storage           |
                         | - XML (5yr archive)|
                         | - PDF (visual rep) |
                         | - UUID index       |
                         | - Payment link     |
                         +-------------------+
```

## Appendix C: Mexico vs. Panama Comparison Matrix

| Dimension | Panama | Mexico |
|---|---|---|
| Currency | USD / PAB (1:1) | MXN |
| Tax ID | RUC (variable format) | RFC (12 or 13 chars) |
| E-invoice standard | DGI Factura Electronica (v1.10) | CFDI 4.0 |
| E-invoice authority | DGI (under MEF) | SAT |
| PAC authorization | DGI-authorized PAC | SAT-authorized PAC |
| Unique invoice ID | CUFE | UUID (Folio Fiscal) |
| VAT name | ITBMS | IVA |
| Standard VAT rate | 7% | 16% |
| VAT filing | Monthly, by 15th | Monthly, by 17th |
| Digital certificate | DGI-approved cert | CSD (Certificado de Sello Digital) |
| Primary payment rail | ACH Directo (Telered) | SPEI (Banxico) |
| Dominant digital wallet | Yappy | Mercado Pago |
| QR payments | Yappy QR | CoDi |
| Cash payment network | N/A (small market) | OXXO Pay (20K+ stores) |
| Unbanked solutions | Limited need (high banking penetration) | Critical (60M+ unbanked) |
| Simplified tax regime | AMPYME micro classification | RESICO |
| Product/service catalog | None required on invoice | ClaveProdServ (mandatory, 50K+ codes) |
| Payment complement | Not required | Complemento de Pago (mandatory for PPD) |
| Transport document | Not required | Carta Porte (for goods transport) |
| Cancelation rules | Simple | Strict (receiver acceptance after 24h) |
| Population | ~4.4M | ~130M |
| SMB count | ~100K | ~4.9M |
| Kitz `paymentTools.ts` providers | `yappy`, `bac`, `stripe`, `paypal` | `spei`, `codi`, `mercadopago`, `oxxo`, `conekta`, `clip`, `stripe`, `paypal` |
| Kitz `invoice_create` default tax | `0.07` | `0.16` |
| Kitz invoice output | HTML (need XML) | HTML + CFDI XML (mandatory) |

---

*This document should be reviewed and updated quarterly as Mexico's regulatory and payment landscape evolves. Key monitoring dates: SAT Resolucion Miscelanea Fiscal updates (annual, December/January), CFDI version changes, Banxico SPEI/CoDi updates, CNBV Fintech Law regulatory releases, and PAC provider market changes. The next major regulatory event to monitor is the potential CFDI 4.1 update and any changes to RESICO eligibility thresholds for 2027.*
