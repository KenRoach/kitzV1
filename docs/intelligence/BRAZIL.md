# Brazil Financial & Payment Infrastructure Intelligence

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

Brazil is by far the most complex and the most rewarding market for Kitz. With 200+ million people, 20+ million active small businesses (including 15+ million MEIs), and the world's most advanced instant payment system (PIX, 150M+ users), Brazil represents an enormous opportunity -- but one gated by arguably the most complex tax and invoicing regime in Latin America.

**Why Brazil is different from every other Kitz market:**

- **Tax complexity is extreme.** Brazil has federal, state, and municipal taxes that interact in non-trivial ways. A single product sold across state lines can trigger ICMS (state VAT, 7-25%), PIS/COFINS (federal social contributions), IPI (manufactured goods tax), and ISS (municipal services tax). The tax rate depends on the product NCM code, the seller's tax regime (Simples Nacional vs. Lucro Presumido vs. Lucro Real), the state of origin, and the state of destination. There are 27 different ICMS rate tables. Kitz's tax calculation engine must handle all of this.

- **E-invoicing is mature but fragmented.** NF-e (goods) has been mandatory since 2006 and is well-standardized via SEFAZ. NFS-e (services) is issued per-municipality -- and Brazil has 5,570+ municipalities, each with its own web service. The national NFS-e standard (ABRASF) is being adopted but is not yet universal. Kitz must either integrate with each municipality or use an aggregator (NFe.io, eNotas, Focus NFe).

- **PIX is revolutionary.** Launched in November 2020 by Banco Central do Brasil, PIX processes 4+ billion transactions per month, operates 24/7/365, settles in under 10 seconds, and is free for individuals. It has replaced cash and boleto for many use cases. PIX is the #1 payment integration priority for Kitz in Brazil.

- **Tax reform is underway.** Constitutional Amendment EC 132/2023 is replacing PIS/COFINS/ICMS/ISS with a dual VAT system: CBS (federal) and IBS (state/municipal). The transition runs 2026-2033. Kitz must support both the old and new tax regimes simultaneously during this period.

- **Language is Portuguese**, not Spanish. All UI, invoices, notifications, and support must be in Brazilian Portuguese. Currency uses comma as decimal separator (R$ 1.234,56) -- the opposite of all other LatAm markets Kitz serves.

**Key takeaways:**

- PIX dominates payments: free for individuals, near-instant, QR-code-based. Kitz's `paymentTools.ts` provider enum needs `'pix'` added. PIX is the equivalent of Yappy in Panama but 75x larger.
- Boleto Bancario remains essential for ~30% of e-commerce and is the only option for the unbanked. Provider enum needs `'boleto'`.
- NF-e (goods) requires XML generation, digital certificate (e-CNPJ), and authorization from SEFAZ (state tax authority). Each of 26 states + DF has its own SEFAZ.
- NFS-e (services) requires per-municipality integration or an aggregator API. This is the single hardest technical challenge.
- Simples Nacional (including MEI) is the simplified tax regime used by the vast majority of Kitz's target customers. It consolidates 8 taxes into a single monthly payment (DAS).
- LGPD (Lei Geral de Protecao de Dados) is Brazil's data protection law, modeled on GDPR. Compliance is mandatory.
- Open Finance Brasil is mandatory for large banks and creates opportunities for Kitz to access bank data via APIs.

**Market size comparison:**

| Metric | Panama | Brazil |
|---|---|---|
| Population | ~4.4M | ~215M |
| SMBs | ~90K | ~20M |
| GDP | ~$80B | ~$2.2T |
| Instant payment users | ~2M (Yappy) | ~150M (PIX) |
| E-invoice complexity | 1 PAC system | 27 SEFAZes + 5,570 municipalities |
| Tax regimes | 1 (ITBMS 7%) | 4+ regimes, 27 state rate tables |
| Language | Spanish | Portuguese |
| Decimal separator | Period (.) | Comma (,) |

---

## 2. Payment Systems

### 2.1 PIX (Banco Central do Brasil)

**What it is:**
PIX is Brazil's instant payment system, created and operated by Banco Central do Brasil (BCB). Launched in November 2020, it is the most successful instant payment system in the world by adoption metrics. PIX enables real-time transfers 24/7/365 between any bank accounts, digital wallets, or payment institutions. Transactions settle in under 10 seconds and are free for individuals. For businesses (Pessoa Juridica), fees are negotiable with the PSP (Payment Service Provider) but typically range from 0% to 1.5%.

**Why Kitz needs it:**
PIX is the single most important payment integration for Kitz in Brazil. Over 150 million Brazilians use PIX. It has surpassed credit cards, debit cards, boleto, and cash for many transaction types. Any Brazilian SMB that uses Kitz will expect to receive payments via PIX. Kitz's `paymentTools.ts` must add `'pix'` to its provider enum.

**PIX Key Types (Chaves PIX):**

| Key Type | Format | Example | Usage |
|---|---|---|---|
| CPF | 11 digits | `12345678901` | Personal tax ID |
| CNPJ | 14 digits | `12345678000195` | Business tax ID |
| Email | email address | `loja@empresa.com.br` | Business email |
| Phone | +55 + DDD + number | `+5511999887766` | Mobile number |
| Random (EVP) | UUID v4 | `a1b2c3d4-e5f6-...` | Anonymous key |

**Technical integration:**

| Aspect | Detail |
|---|---|
| Operator | Banco Central do Brasil (BCB) |
| Settlement time | < 10 seconds, 24/7/365 |
| Transaction limit | Configurable per account; nocturnal limits (R$1,000 default 8PM-6AM) |
| QR Code types | Static (reusable, fixed or open amount) and Dynamic (single-use, full transaction data) |
| API access | Via PSP (Payment Service Provider) -- banks and payment institutions |
| Key standards | Dict (Diretorio de Identificadores de Contas Transacionais) |
| EMV standard | QR codes follow EMV Co. standard (BR Code) |
| Pix Copia e Cola | Text-based payment string (alternative to QR scan) |

**PIX QR Code Architecture:**

```
                         PIX PAYMENT FLOW
                         ================

  Kitz Workspace (Merchant)              Customer
        |                                    |
        |  1. Creates PIX charge             |
        |     (via PSP API)                  |
        v                                    |
  +-----------+                              |
  | PSP API   | -- Returns QR code --------> |
  | (Bank/    |    + Pix Copia e Cola        |
  | Fintech)  |                              |
  +-----------+                              |
        |                                    v
        |                              +-----------+
        |                              | Customer  |
        |                              | scans QR  |
        |                              | or pastes |
        |                              | Copia e   |
        |                              | Cola      |
        |                              +-----------+
        |                                    |
        |                                    v
        |                              +-----------+
        |                              | Customer  |
        |                              | confirms  |
        |                              | in bank   |
        |                              | app       |
        |                              +-----------+
        |                                    |
        v                                    v
  +-----------+                        +-----------+
  | Webhook   | <-- BCB settles ---    | Payment   |
  | received  |    in < 10 sec        | debited   |
  | from PSP  |                        | from      |
  +-----------+                        | customer  |
        |                              +-----------+
        v
  +---------------------+
  | payments_process     |
  | Webhook              |
  | (paymentTools.ts)    |
  | provider: 'pix'      |
  +---------------------+
        |
        +-- Invoice status -> 'paid'
        +-- NF-e/NFS-e issued
        +-- WhatsApp receipt sent
        +-- Revenue dashboard updated
```

**PIX Key Validation (TypeScript):**

```typescript
interface PixKeyValidation {
  valid: boolean;
  type: 'cpf' | 'cnpj' | 'email' | 'phone' | 'evp';
  normalized: string;
  error?: string;
}

function validatePixKey(key: string): PixKeyValidation {
  const trimmed = key.trim();

  // CPF: 11 digits
  const cpfClean = trimmed.replace(/[\.\-]/g, '');
  if (/^\d{11}$/.test(cpfClean) && validateCPFCheckDigits(cpfClean)) {
    return { valid: true, type: 'cpf', normalized: cpfClean };
  }

  // CNPJ: 14 digits
  const cnpjClean = trimmed.replace(/[\.\-\/]/g, '');
  if (/^\d{14}$/.test(cnpjClean) && validateCNPJCheckDigits(cnpjClean)) {
    return { valid: true, type: 'cnpj', normalized: cnpjClean };
  }

  // Email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) && trimmed.length <= 77) {
    return { valid: true, type: 'email', normalized: trimmed.toLowerCase() };
  }

  // Phone: +55 + DDD (2 digits) + number (9 digits)
  const phoneClean = trimmed.replace(/[\s\-\(\)]/g, '');
  if (/^\+55\d{11}$/.test(phoneClean)) {
    return { valid: true, type: 'phone', normalized: phoneClean };
  }

  // EVP (Random key): UUID v4 format
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmed)) {
    return { valid: true, type: 'evp', normalized: trimmed.toLowerCase() };
  }

  return { valid: false, type: 'cpf', normalized: trimmed, error: 'Invalid PIX key format' };
}
```

**PIX for Kitz -- Implementation approach:**

Kitz cannot connect directly to BCB's PIX infrastructure (restricted to licensed PSPs). Instead, Kitz must integrate with a PSP that offers a PIX API. Recommended PSPs for SaaS/platform integration:

| PSP | API Quality | PIX Features | Pricing Model |
|---|---|---|---|
| **Mercado Pago** | Excellent, well-documented | QR, Copia e Cola, webhooks, refunds | % per transaction |
| **PagSeguro (PagBank)** | Good, large developer community | Full PIX, checkout page | % per transaction |
| **Stone** | Excellent for SMBs | PIX + banking | Monthly + per-tx |
| **Asaas** | Great for SaaS platforms | PIX, boleto, card, subscriptions | Per transaction |
| **iugu** | Built for platforms | PIX, split payments, marketplace | Per transaction |
| **Gerencianet (Efí)** | Official PIX integrator | Full PIX API, webhooks, QR | Per transaction |

**Recommended:** Start with Mercado Pago or Asaas for fastest time-to-market. Both offer well-documented PIX APIs with webhook support, QR code generation, and sandbox environments.

**Implementation timeline:** NOW (Q1 2026) -- highest priority payment integration.

**Action items:**
1. Add `'pix'` to the provider enum in `paymentTools.ts`.
2. Select and integrate with a PIX PSP (recommend Mercado Pago or Asaas).
3. Build PIX QR code generation for invoices (static and dynamic).
4. Implement PIX Copia e Cola as fallback for environments where QR scanning is impractical.
5. Build webhook receiver for PIX payment confirmations.
6. Implement PIX key management per workspace (store merchant's PIX key).
7. Test end-to-end in PSP sandbox.

---

### 2.2 Boleto Bancario

**What it is:**
Boleto Bancario is a bank slip payment method unique to Brazil. It generates a document (physical or digital) with a barcode and a "linha digitavel" (typeable line of digits). The customer can pay the boleto at any bank branch, lottery house (Loteria), ATM, or through internet/mobile banking. Boletos have an expiration date and can include interest and late-payment penalties.

**Why Kitz needs it:**
Despite PIX's dominance, boleto still accounts for approximately 30% of e-commerce transactions in Brazil. It is essential for:
- Unbanked or underbanked customers who pay at lottery houses.
- B2B transactions where companies have established boleto-based payment workflows.
- Installment payments (boleto parcelado -- one boleto per installment).
- Customers who prefer not to use PIX for privacy or habit reasons.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Issuing bank | Boletos are issued through a bank or payment institution (registrado) |
| Registration | Since 2018, all boletos must be registered (boleto registrado) with CIP |
| Barcode standard | Febraban standard, 47 digits (linha digitavel) or 44 digits (barcode) |
| Settlement | D+1 to D+3 depending on the issuing bank |
| Expiration | Configurable (typically 3-7 days) |
| Late payment | Interest (mora) and fine (multa) can be configured |
| Cancellation | Can be cancelled before payment |

**Integration pattern for Kitz:**

```
1. Kitz generates boleto via PSP API (Asaas, iugu, PagSeguro, etc.)
   -> PSP returns boleto PDF, barcode, linha digitavel
2. Kitz sends boleto to customer via WhatsApp or email
3. Customer pays at bank/lottery/app within expiration period
4. PSP receives payment confirmation from banking network
5. PSP sends webhook to Kitz
6. Kitz calls payments_processWebhook(provider: 'boleto', ...)
7. Invoice updated, CRM updated, NF-e/NFS-e issued, receipt sent
```

**Implementation timeline:** Q2 2026 -- second priority after PIX.

**Action items:**
1. Add `'boleto'` to the provider enum in `paymentTools.ts`.
2. Implement boleto generation via selected PSP API.
3. Build boleto PDF/link delivery via WhatsApp and email.
4. Handle boleto expiration and automatic cancellation logic.
5. Implement late payment tracking (interest/penalty calculation).

---

### 2.3 Mercado Pago

**What it is:**
Mercado Pago is the payment arm of MercadoLibre, the largest e-commerce company in Latin America. In Brazil, Mercado Pago offers PIX, boleto, credit/debit card processing, QR code payments, and a digital wallet. It has 50M+ active users in Brazil and provides a comprehensive API for developers.

**Why Kitz needs it:**
Mercado Pago is the most practical "one API, all payment methods" solution for Kitz in Brazil. A single integration gives access to PIX, boleto, credit cards, debit cards, and the Mercado Pago wallet. The API is well-documented, has a robust sandbox, and offers marketplace/split payment features.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Developer portal | https://www.mercadopago.com.br/developers/ |
| SDKs | Node.js, Python, PHP, Java, .NET, Ruby |
| Authentication | OAuth 2.0 + access tokens |
| Sandbox | Full sandbox environment with test credentials |
| Webhooks | IPN (Instant Payment Notification) and Webhooks v2 |
| Payment methods | PIX, boleto, credit card, debit card, wallet |
| Marketplace | Split payments, marketplace model supported |

**Key SDK configuration:**

```typescript
import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

// Create a PIX payment
const payment = new Payment(client);
const pixCharge = await payment.create({
  body: {
    transaction_amount: 150.00,
    description: 'Invoice #001-000000042',
    payment_method_id: 'pix',
    payer: {
      email: 'cliente@email.com.br',
      first_name: 'Maria',
      last_name: 'Silva',
      identification: {
        type: 'CPF',
        number: '12345678901',
      },
    },
  },
});

// pixCharge.point_of_interaction.transaction_data.qr_code -> QR code string
// pixCharge.point_of_interaction.transaction_data.qr_code_base64 -> QR image
// pixCharge.point_of_interaction.transaction_data.ticket_url -> payment page
```

**Implementation timeline:** Q1-Q2 2026 -- primary PSP candidate.

**Action items:**
1. Add `'mercadopago'` to the provider enum in `paymentTools.ts`.
2. Implement Mercado Pago SDK integration for PIX, boleto, and cards.
3. Build webhook receiver for Mercado Pago IPN/webhook notifications.
4. Implement per-workspace credential management (OAuth access tokens).
5. Test all payment methods in sandbox environment.

---

### 2.4 PagSeguro (PagBank)

**What it is:**
PagSeguro, now operating under the PagBank brand, is one of Brazil's largest payment platforms. It is especially popular among small businesses for its POS terminals (maquininhas), online checkout, and PIX integration. PagBank also offers a full digital banking experience (account, card, investments).

**Why Kitz needs it:**
PagSeguro is the dominant payment solution for micro and small businesses in Brazil. Many Kitz target customers already have a PagSeguro maquininha. Integrating with PagSeguro allows Kitz to reconcile both online (PIX, boleto, card) and in-person (maquininha) transactions.

**Implementation timeline:** Q3 2026.

**Action items:**
1. Add `'pagseguro'` to the provider enum in `paymentTools.ts`.
2. Evaluate PagBank API for online payment integration.
3. Explore POS reconciliation features for brick-and-mortar Kitz users.

---

### 2.5 Stone

**What it is:**
Stone is a Brazilian fintech focused on SMB payments and banking. It offers POS terminals, online payment processing, PIX, banking (Stone conta), and credit products. Stone is known for its high-quality customer service and SMB focus.

**Why Kitz needs it:**
Stone's SMB-first positioning aligns with Kitz's target market. Stone's API supports PIX, card processing, and split payments. Many growing SMBs in Brazil use Stone for payment processing.

**Implementation timeline:** Q3 2026.

**Action items:**
1. Add `'stone'` to the provider enum in `paymentTools.ts`.
2. Evaluate Stone API capabilities and pricing.
3. Consider Stone as an alternative PSP for Kitz workspaces that already use Stone.

---

### 2.6 Additional Payment Players

| Provider | Role | Relevance to Kitz |
|---|---|---|
| **Cielo** | Largest card acquirer in Brazil | Legacy player; many SMBs still use Cielo terminals |
| **Nubank** | Largest digital bank globally (90M+ BR customers) | Customers may pay via Nubank PIX; no merchant API needed |
| **PicPay** | Digital wallet, social payments | Niche; lower priority |
| **iFood** | Marketplace payments for food SMBs | Relevant if Kitz targets food/restaurant vertical |
| **Pix Parcelado** | Installment payments via PIX | Newer feature; PSPs are adding support progressively |
| **Pix Garantido** | Guaranteed future PIX (scheduled) | BCB regulation in progress; will enable "buy now, pay later" via PIX |
| **Pix Automatico** | Recurring PIX charges (like direct debit) | Expected launch 2025-2026; critical for subscriptions |

---

## 3. Banking & Interbank Infrastructure

### 3.1 Banking Landscape

Brazil has one of the most sophisticated banking systems in Latin America, with a mix of large traditional banks, state-owned banks, and a rapidly growing digital bank ecosystem.

**Major Banks:**

| Bank | Type | Assets Rank | Relevance to Kitz |
|---|---|---|---|
| **Banco do Brasil** | State-owned | #1 by assets | Largest bank, social programs (Bolsa Familia), agribusiness |
| **Itau Unibanco** | Private | #1 private | Largest private bank, strong digital, Iti wallet |
| **Bradesco** | Private | #2 private | Large branch network, BradescoNext digital |
| **Caixa Economica Federal** | State-owned | #3 overall | Social programs, housing finance, lottery houses |
| **Santander Brasil** | Private (Spanish parent) | #3 private | Strong in corporate and SMB banking |
| **Nubank** | Digital | Largest digital bank globally | 90M+ customers in Brazil, no branches, mobile-first |
| **Inter** | Digital | Top 5 digital | Full digital bank, marketplace integration |
| **C6 Bank** | Digital | Growing fast | Carbon card, Tim partnership, aggressive growth |
| **BTG Pactual** | Digital/Investment | Top investment bank | BTG+ digital retail banking |

**Kitz integration implications:**
- Kitz does not need direct bank integrations for payment processing (handled via PSPs).
- Bank statement import (OFX, CSV) for reconciliation is a valuable feature.
- Open Finance Brasil APIs provide standardized access to bank data (see Section 4.5).
- PIX works across all banks -- no bank-specific PIX integration needed.

### 3.2 Banco Central do Brasil (BCB)

**What it is:**
The BCB is Brazil's central bank. It operates PIX, regulates the financial system, manages the Real (BRL), and drives Open Finance Brasil. Unlike many central banks, the BCB is highly innovative and technology-forward.

**Key BCB systems relevant to Kitz:**

| System | Description | Kitz Impact |
|---|---|---|
| **PIX** | Instant payment system | Primary payment rail |
| **Open Finance** | Open banking/finance APIs | Data access, payment initiation |
| **SPI** | Sistema de Pagamentos Instantaneos (PIX backend) | Infrastructure (not directly accessible) |
| **DICT** | PIX key directory | Key validation (via PSP) |
| **CCS** | Customer registry | KYC cross-reference |

### 3.3 Open Finance Brasil

**What it is:**
Open Finance Brasil is one of the most advanced open banking implementations in the world. Mandated by BCB, it requires large banks to share customer data (with consent) and enable payment initiation via standardized APIs. It covers banking, insurance, investments, pensions, and foreign exchange.

**Phases:**

| Phase | Scope | Status |
|---|---|---|
| Phase 1 | Institution and product data (public) | Live |
| Phase 2 | Customer data sharing (with consent) | Live |
| Phase 3 | Payment initiation (PIX via Open Finance) | Live |
| Phase 4 | Insurance, investments, pensions, FX | Rolling out |

**Why Kitz needs it:**
Open Finance enables Kitz to:
- Read customer bank statements for automatic reconciliation (with consent).
- Initiate PIX payments on behalf of the business owner (payment initiation).
- Access customer financial data for credit scoring and cash flow analysis.
- Aggregate data from multiple bank accounts into a single Kitz dashboard.

**Technical requirements:**
- Kitz would need to register as an Open Finance participant (regulated entity) or partner with a registered participant.
- API standard: FAPI (Financial-grade API) security profile.
- OAuth 2.0 with PKCE and mutual TLS.
- Consent management (explicit, granular, revocable).

**Implementation timeline:** Q4 2026 / Future -- requires regulatory participation.

---

## 4. Government & Regulatory Bodies

### 4.1 Receita Federal do Brasil (RFB)

**What it is:**
The Receita Federal is Brazil's federal tax authority, equivalent to the IRS in the US. It administers federal taxes (PIS, COFINS, IPI, IRPJ, CSLL), manages CNPJ and CPF registrations, oversees customs, and coordinates with state and municipal tax authorities.

**Why Kitz needs it:**
Every Kitz workspace representing a Brazilian business must have a valid CNPJ. The Receita Federal's systems are the authoritative source for business registration, tax regime classification, and tax filing. Kitz must validate CNPJ, determine the business's tax regime, and help with tax obligations.

**Key Receita Federal systems:**

| System | Purpose | Kitz Integration |
|---|---|---|
| CNPJ registry | Business registration and lookup | CNPJ validation on workspace setup |
| Simples Nacional portal | Simplified tax regime management | Tax regime detection |
| e-CAC (Centro de Atendimento Virtual) | Online tax services portal | Future: tax filing assistance |
| Siscomex | Import/export system | Not applicable for most SMBs |

**CNPJ Validation (TypeScript):**

```typescript
/**
 * Validates a Brazilian CNPJ (business tax ID).
 * Format: XX.XXX.XXX/XXXX-XX (14 digits)
 * Last 2 digits are check digits calculated via modular arithmetic.
 */
function validateCNPJ(cnpj: string): { valid: boolean; formatted: string; error?: string } {
  // Strip formatting
  const digits = cnpj.replace(/[^\d]/g, '');

  if (digits.length !== 14) {
    return { valid: false, formatted: cnpj, error: 'CNPJ must have 14 digits' };
  }

  // Reject known invalid patterns (all same digit)
  if (/^(\d)\1{13}$/.test(digits)) {
    return { valid: false, formatted: cnpj, error: 'Invalid CNPJ (repeated digits)' };
  }

  // Calculate first check digit
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i]) * weights1[i];
  }
  let remainder = sum % 11;
  const checkDigit1 = remainder < 2 ? 0 : 11 - remainder;

  if (parseInt(digits[12]) !== checkDigit1) {
    return { valid: false, formatted: cnpj, error: 'Invalid CNPJ check digit' };
  }

  // Calculate second check digit
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(digits[i]) * weights2[i];
  }
  remainder = sum % 11;
  const checkDigit2 = remainder < 2 ? 0 : 11 - remainder;

  if (parseInt(digits[13]) !== checkDigit2) {
    return { valid: false, formatted: cnpj, error: 'Invalid CNPJ check digit' };
  }

  // Format: XX.XXX.XXX/XXXX-XX
  const formatted = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  return { valid: true, formatted };
}
```

**CPF Validation (TypeScript):**

```typescript
/**
 * Validates a Brazilian CPF (personal tax ID).
 * Format: XXX.XXX.XXX-XX (11 digits)
 * Last 2 digits are check digits.
 */
function validateCPF(cpf: string): { valid: boolean; formatted: string; error?: string } {
  const digits = cpf.replace(/[^\d]/g, '');

  if (digits.length !== 11) {
    return { valid: false, formatted: cpf, error: 'CPF must have 11 digits' };
  }

  // Reject known invalid patterns
  if (/^(\d)\1{10}$/.test(digits)) {
    return { valid: false, formatted: cpf, error: 'Invalid CPF (repeated digits)' };
  }

  // Calculate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  const checkDigit1 = remainder === 10 ? 0 : remainder;

  if (parseInt(digits[9]) !== checkDigit1) {
    return { valid: false, formatted: cpf, error: 'Invalid CPF check digit' };
  }

  // Calculate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  const checkDigit2 = remainder === 10 ? 0 : remainder;

  if (parseInt(digits[10]) !== checkDigit2) {
    return { valid: false, formatted: cpf, error: 'Invalid CPF check digit' };
  }

  const formatted = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  return { valid: true, formatted };
}
```

---

### 4.2 SEFAZ (Secretaria da Fazenda) -- State Tax Authorities

**What it is:**
Each of Brazil's 26 states and the Distrito Federal has its own SEFAZ (Secretaria da Fazenda or Secretaria de Estado de Fazenda), which administers ICMS (the state-level VAT) and authorizes NF-e (electronic invoices for goods). The SEFAZes operate web services that receive, validate, and authorize NF-e XML documents.

**Why Kitz needs it:**
Any Kitz workspace that sells physical goods must issue NF-e, which requires authorization from the SEFAZ of the state where the business is registered. Kitz must integrate with the SEFAZ web services (or use an NF-e aggregator that handles this).

**SEFAZ Web Service Environments:**

| Environment | URL Pattern | Purpose |
|---|---|---|
| Production | `nfe.sefaz.{state}.gov.br` | Live NF-e authorization |
| Homologation | `homologacao.nfe.sefaz.{state}.gov.br` | Testing/sandbox |
| SEFAZ Virtual (SVRS) | Shared service for smaller states | Covers states without own infrastructure |
| SEFAZ Virtual (SVAN) | Alternative shared service | Additional coverage |

**States grouped by SEFAZ web service:**

```
Direct SEFAZ (own infrastructure):
  AM, BA, GO, MG, MS, MT, PE, PR, RS, SP

SVRS (SEFAZ Virtual Rio Grande do Sul):
  AC, AL, AP, CE, DF, ES, MA, PA, PB, PI, RJ, RN, RO, RR, SC, SE, TO

SVAN (SEFAZ Virtual Ambiente Nacional):
  (Backup/contingency for all states)
```

**Key implication:** Kitz needs to route NF-e requests to the correct SEFAZ web service based on the state where the business is registered. This is handled by maintaining a state-to-SEFAZ-URL mapping.

---

### 4.3 Prefeituras (Municipal Governments) -- ISS & NFS-e

**What it is:**
Brazil's 5,570+ municipalities (prefeituras) each administer ISS (Imposto Sobre Servicos) and issue NFS-e (Nota Fiscal de Servicos Eletronica). Each municipality historically had its own NFS-e system with its own API, schema, and rules. The ABRASF (Associacao Brasileira das Secretarias de Financas das Capitais) standard is being adopted to unify these systems, but adoption is incomplete.

**Why Kitz needs it:**
Any Kitz workspace that provides services (consulting, software, design, food preparation, etc.) must issue NFS-e through the municipality where the service is provided. This is the single most fragmented integration challenge in Brazilian tax compliance.

**The fragmentation problem:**

```
NFS-e INTEGRATION COMPLEXITY
=============================

  Panama:      1 PAC system          -> 1 integration
  Brazil:      5,570+ municipalities -> theoretically 5,570 integrations

  Reality:
  +------------------------------------------+
  | ~500 municipalities have electronic       |
  | NFS-e systems (covering ~90% of GDP)     |
  |                                          |
  | ~100+ different NFS-e system providers   |
  | (GINFES, BETHA, IPM, SIMPLISS, etc.)    |
  |                                          |
  | ABRASF standard covers ~300+ cities     |
  | but implementations vary                 |
  |                                          |
  | National NFS-e (nota.io) in rollout     |
  | since 2023 -- aims to unify all         |
  +------------------------------------------+

  RECOMMENDED: Use an NFS-e aggregator
  (NFe.io, eNotas, Focus NFe, Tecnospeed)
  that handles per-municipality integration
```

**Implementation approach:**
Do NOT attempt per-municipality integration directly. Use an NFS-e aggregator API.

| Aggregator | Coverage | API Quality | Pricing |
|---|---|---|---|
| **NFe.io** | 1,100+ municipalities | Excellent REST API | Per document |
| **eNotas** | 1,000+ municipalities | Good, well-documented | Per document |
| **Focus NFe** | 900+ municipalities | Good | Per document |
| **Tecnospeed** | 1,200+ municipalities | Good | Per document |
| **Notasoft** | 500+ municipalities | Adequate | Per document |

**Implementation timeline:** Q2-Q3 2026.

---

### 4.4 LGPD (Lei Geral de Protecao de Dados)

**What it is:**
LGPD (Law 13.709/2018) is Brazil's General Data Protection Law, modeled on the EU's GDPR. It regulates the collection, processing, storage, and sharing of personal data. Enforced by the ANPD (Autoridade Nacional de Protecao de Dados), it applies to any entity processing data of individuals located in Brazil.

**Why Kitz needs it:**
Kitz processes significant personal data: CPF/CNPJ, addresses, phone numbers, email addresses, financial data, transaction history. LGPD compliance is mandatory and violations can result in fines of up to 2% of revenue (capped at R$ 50 million per infraction).

**Key LGPD requirements for Kitz:**

| Requirement | Implementation |
|---|---|
| Legal basis for processing | Document lawful basis (consent, contract, legitimate interest) for each data type |
| Consent management | Explicit opt-in for marketing, data sharing; easy withdrawal |
| Data subject rights | Access, correction, deletion, portability requests |
| Data Protection Officer (DPO) | Appoint a DPO (Encarregado) |
| Data breach notification | Notify ANPD and affected individuals within "reasonable time" |
| Cross-border transfers | Ensure adequate protection for data leaving Brazil |
| Privacy policy | Portuguese-language privacy policy covering all processing activities |
| Data minimization | Collect only necessary data |

**Implementation timeline:** NOW -- mandatory for any operations in Brazil.

---

### 4.5 Tax Regime Classification

**Understanding Brazil's tax regimes is critical for Kitz.** The business's tax regime determines how every tax is calculated, what rates apply, and what obligations exist. Kitz must capture this during workspace setup.

**Tax Regimes:**

| Regime | Revenue Limit | Target | Tax Approach |
|---|---|---|---|
| **MEI** (Microempreendedor Individual) | R$ 81,000/year | Solo entrepreneurs | Fixed monthly fee (DAS-MEI): ~R$ 70-76/month |
| **Simples Nacional - ME** (Microempresa) | R$ 360,000/year | Small businesses | Single monthly payment (DAS) based on revenue band |
| **Simples Nacional - EPP** (Empresa de Pequeno Porte) | R$ 4,800,000/year | Small-medium businesses | Single monthly payment (DAS) based on revenue band |
| **Lucro Presumido** | R$ 78,000,000/year | Medium businesses | Taxes on "presumed" profit margin |
| **Lucro Real** | No limit (mandatory above R$ 78M) | Large businesses | Taxes on actual accounting profit |

**Simples Nacional -- The most relevant for Kitz:**

Simples Nacional consolidates 8 taxes into a single monthly payment called DAS (Documento de Arrecadacao do Simples Nacional):

```
Taxes consolidated in DAS:
  Federal:  IRPJ, CSLL, PIS, COFINS, IPI
  State:    ICMS
  Municipal: ISS
  Social:   CPP (employer social contribution)

Rate calculation:
  - Determined by Annex (I through V) based on business activity
  - Rate depends on trailing 12-month gross revenue (RBT12)
  - Effective rate = (RBT12 x nominal_rate - deduction) / RBT12
```

**Simples Nacional Tax Calculation (TypeScript):**

```typescript
/**
 * Simples Nacional tax calculation based on Annex and revenue bracket.
 * This covers Annex I (Comercio) as an example.
 * Full implementation requires all 5 annexes with their brackets.
 */

interface SimplesNacionalBracket {
  maxRevenue: number;  // R$ trailing 12 months
  nominalRate: number; // Percentage
  deduction: number;   // R$ deduction
}

// Annex I - Comercio (Trade/Retail)
const ANNEX_I: SimplesNacionalBracket[] = [
  { maxRevenue: 180_000.00,   nominalRate: 0.04,   deduction: 0 },
  { maxRevenue: 360_000.00,   nominalRate: 0.073,  deduction: 5_940.00 },
  { maxRevenue: 720_000.00,   nominalRate: 0.095,  deduction: 13_860.00 },
  { maxRevenue: 1_800_000.00, nominalRate: 0.107,  deduction: 22_500.00 },
  { maxRevenue: 3_600_000.00, nominalRate: 0.143,  deduction: 87_300.00 },
  { maxRevenue: 4_800_000.00, nominalRate: 0.19,   deduction: 378_000.00 },
];

// Annex III - Servicos (Services: maintenance, travel, accounting, etc.)
const ANNEX_III: SimplesNacionalBracket[] = [
  { maxRevenue: 180_000.00,   nominalRate: 0.06,   deduction: 0 },
  { maxRevenue: 360_000.00,   nominalRate: 0.112,  deduction: 9_360.00 },
  { maxRevenue: 720_000.00,   nominalRate: 0.135,  deduction: 17_640.00 },
  { maxRevenue: 1_800_000.00, nominalRate: 0.16,   deduction: 35_640.00 },
  { maxRevenue: 3_600_000.00, nominalRate: 0.21,   deduction: 125_640.00 },
  { maxRevenue: 4_800_000.00, nominalRate: 0.33,   deduction: 648_000.00 },
];

type AnnexType = 'I' | 'II' | 'III' | 'IV' | 'V';

const ANNEXES: Record<AnnexType, SimplesNacionalBracket[]> = {
  'I': ANNEX_I,
  'II': [], // Industria -- similar structure, different rates
  'III': ANNEX_III,
  'IV': [], // Servicos (construction, surveillance, etc.)
  'V': [], // Servicos (technology, engineering, advertising, etc.)
};

function calculateSimplesNacional(
  monthlyRevenue: number,
  trailing12MonthRevenue: number,
  annex: AnnexType,
): { effectiveRate: number; taxAmount: number; bracket: number } {
  const brackets = ANNEXES[annex];
  if (!brackets || brackets.length === 0) {
    throw new Error(`Annex ${annex} brackets not yet implemented`);
  }

  // Find the applicable bracket based on trailing 12-month revenue
  const bracket = brackets.find(b => trailing12MonthRevenue <= b.maxRevenue);
  if (!bracket) {
    throw new Error(
      `Revenue R$ ${trailing12MonthRevenue.toLocaleString('pt-BR')} exceeds Simples Nacional limit`
    );
  }

  // Effective rate formula: (RBT12 * nominal_rate - deduction) / RBT12
  const effectiveRate =
    (trailing12MonthRevenue * bracket.nominalRate - bracket.deduction) / trailing12MonthRevenue;

  const taxAmount = monthlyRevenue * effectiveRate;

  return {
    effectiveRate: Math.max(effectiveRate, 0), // Cannot be negative
    taxAmount: Math.max(taxAmount, 0),
    bracket: brackets.indexOf(bracket) + 1,
  };
}

// Example usage:
// A retail business (Annex I) with R$ 500,000 trailing 12-month revenue
// and R$ 45,000 in monthly revenue:
// const result = calculateSimplesNacional(45_000, 500_000, 'I');
// -> effectiveRate: ~0.0673 (6.73%), taxAmount: R$ 3,028.50
```

**MEI (Microempreendedor Individual):**

MEI is the simplest tax regime, designed for individual entrepreneurs:

| Aspect | Detail |
|---|---|
| Revenue limit | R$ 81,000/year (R$ 6,750/month) |
| Employees | Maximum 1 employee |
| Monthly payment (DAS-MEI) | R$ 70.60 (comercio/industria) or R$ 75.60 (servicos) -- 2025 values |
| NF-e obligation | Required only for B2B sales; exempt for B2C (but can issue voluntarily) |
| NFS-e obligation | Required for services to companies; exempt for individuals |
| CNPJ | Yes -- MEI receives a CNPJ upon registration |
| Tax filing | Annual declaration (DASN-SIMEI) due May 31 |

**Kitz must ask during workspace setup:**
1. What is your CNPJ?
2. What is your tax regime? (MEI / Simples Nacional / Lucro Presumido / Lucro Real)
3. If Simples Nacional, what Annex? (Based on business activity / CNAE code)
4. What is your trailing 12-month revenue? (For Simples Nacional rate calculation)

---

### 4.6 Tax Reform -- EC 132/2023 (CRITICAL)

**What is happening:**
Brazil is implementing the most significant tax reform in its history. Constitutional Amendment 132/2023 (Emenda Constitucional 132/2023) replaces the current fragmented tax system with a dual VAT:

```
CURRENT SYSTEM (being phased out 2026-2033):
  Federal:    PIS + COFINS  -> being replaced by CBS
  State:      ICMS          -> being replaced by IBS
  Municipal:  ISS           -> being replaced by IBS

NEW SYSTEM (being phased in):
  Federal:    CBS (Contribuicao sobre Bens e Servicos)
  State/Mun:  IBS (Imposto sobre Bens e Servicos)

Also introduces:
  IS (Imposto Seletivo) -- "sin tax" on harmful goods (tobacco, alcohol, etc.)
```

**Transition Timeline:**

| Year | Change |
|---|---|
| 2026 | CBS at test rate (0.9%); IBS at test rate (0.1%); PIS/COFINS/ICMS/ISS still in effect |
| 2027 | CBS fully replaces PIS/COFINS; IBS test rate increases |
| 2028 | State ICMS rate reduction begins |
| 2029-2032 | Gradual ICMS/ISS reduction, IBS increase |
| 2033 | ICMS and ISS fully extinguished; IBS at full rate |

**Impact on Kitz:**

```
TAX REFORM IMPACT ON KITZ
===========================

  2026 (NOW):
    Kitz must handle BOTH old taxes AND new CBS/IBS test rates
    -> 3 parallel tax calculations on each invoice

  2027-2032:
    Kitz must handle transitional rates that change each year
    -> Tax tables must be version-controlled and date-dependent

  2033+:
    Kitz can simplify to CBS + IBS only
    -> Significant simplification, but years away

  STRATEGY:
    Build tax calculation engine with date-aware rate tables
    from day one. Do NOT hardcode rates. Use configuration
    that can be updated as the reform progresses.
```

**Action items:**
1. Design tax calculation engine with date-dependent rate tables.
2. Track Receita Federal and Congresso Nacional for CBS/IBS implementing legislation (Lei Complementar).
3. Implement CBS (0.9% test) and IBS (0.1% test) alongside existing taxes for 2026.
4. Build a tax regime migration tool for businesses transitioning between regimes.
5. Subscribe to regulatory update feeds from major accounting firms (Deloitte, PwC, EY Brazil).

---

## 5. Invoice Compliance

### 5.1 NF-e (Nota Fiscal Eletronica) -- Electronic Invoice for Goods

**What it is:**
NF-e is Brazil's electronic invoice for the circulation of goods (mercadorias). It has been mandatory for most businesses since 2006 and is one of the most mature e-invoicing systems in the world. Each NF-e is an XML document digitally signed with an e-CNPJ certificate and authorized by the SEFAZ of the issuing state.

**Key concepts:**

| Concept | Description |
|---|---|
| **Chave de Acesso** | 44-digit unique key identifying each NF-e |
| **DANFE** | Documento Auxiliar da NF-e -- printable representation (PDF) of the NF-e |
| **e-CNPJ** | Digital certificate (A1 or A3) used to sign NF-e XML |
| **SEFAZ** | State tax authority that authorizes the NF-e |
| **NCM** | Nomenclatura Comum do Mercosul -- 8-digit product classification code |
| **CFOP** | Codigo Fiscal de Operacoes e Prestacoes -- 4-digit operation type code |
| **CST** | Codigo de Situacao Tributaria -- tax situation code for ICMS/PIS/COFINS |
| **CSOSN** | Codigo de Situacao da Operacao do Simples Nacional -- for Simples businesses |

**NF-e XML Structure (Simplified):**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe versao="4.00" Id="NFe{chave_acesso_44_digitos}">

      <!-- Identification -->
      <ide>
        <cUF>35</cUF>                      <!-- State code (35 = SP) -->
        <cNF>12345678</cNF>                 <!-- NF-e code (8 digits) -->
        <natOp>Venda de mercadoria</natOp>  <!-- Operation type description -->
        <mod>55</mod>                       <!-- Model (55 = NF-e) -->
        <serie>1</serie>                    <!-- Series number -->
        <nNF>42</nNF>                       <!-- NF-e number (sequential) -->
        <dhEmi>2026-02-24T10:30:00-03:00</dhEmi>  <!-- Issue datetime -->
        <tpNF>1</tpNF>                      <!-- 0=entrada, 1=saida -->
        <idDest>1</idDest>                  <!-- 1=intrastate, 2=interstate, 3=export -->
        <cMunFG>3550308</cMunFG>            <!-- Municipality code (IBGE) -->
        <tpImp>1</tpImp>                    <!-- DANFE print type -->
        <tpEmis>1</tpEmis>                  <!-- Emission type (1=normal) -->
        <tpAmb>1</tpAmb>                    <!-- 1=production, 2=homologation -->
        <finNFe>1</finNFe>                  <!-- 1=normal, 2=complementar, etc. -->
      </ide>

      <!-- Emitter (Seller) -->
      <emit>
        <CNPJ>12345678000195</CNPJ>
        <xNome>Empresa Exemplo Ltda</xNome>
        <xFant>Exemplo</xFant>              <!-- Trade name -->
        <enderEmit>
          <xLgr>Rua das Flores</xLgr>       <!-- Street -->
          <nro>123</nro>                     <!-- Number -->
          <xBairro>Centro</xBairro>          <!-- Neighborhood -->
          <cMun>3550308</cMun>               <!-- Municipality IBGE code -->
          <xMun>Sao Paulo</xMun>
          <UF>SP</UF>
          <CEP>01001000</CEP>
          <cPais>1058</cPais>                <!-- Country (1058 = Brazil) -->
        </enderEmit>
        <IE>123456789012</IE>                <!-- State registration (ICMS) -->
        <CRT>1</CRT>                         <!-- Tax regime (1=Simples, 2=excess, 3=normal) -->
      </emit>

      <!-- Recipient (Buyer) -->
      <dest>
        <CNPJ>98765432000198</CNPJ>          <!-- Or <CPF> for individuals -->
        <xNome>Cliente Exemplo SA</xNome>
        <enderDest>
          <!-- Same structure as enderEmit -->
        </enderDest>
        <indIEDest>1</indIEDest>             <!-- 1=ICMS taxpayer, 2=exempt, 9=non-taxpayer -->
      </dest>

      <!-- Line Items -->
      <det nItem="1">
        <prod>
          <cProd>SKU001</cProd>              <!-- Product code -->
          <cEAN>7891234567890</cEAN>         <!-- Barcode (EAN/GTIN) -->
          <xProd>Camiseta Algodao P</xProd>  <!-- Product description -->
          <NCM>61091000</NCM>                <!-- NCM code (8 digits) -->
          <CFOP>5102</CFOP>                  <!-- Operation code -->
          <uCom>UN</uCom>                    <!-- Unit of measure -->
          <qCom>10.0000</qCom>               <!-- Quantity -->
          <vUnCom>49.9000</vUnCom>           <!-- Unit price -->
          <vProd>499.00</vProd>              <!-- Total (qty * price) -->
          <cEANTrib>7891234567890</cEANTrib>
          <uTrib>UN</uTrib>
          <qTrib>10.0000</qTrib>
          <vUnTrib>49.9000</vUnTrib>
        </prod>
        <imposto>
          <!-- ICMS -->
          <ICMS>
            <ICMSSN102>                      <!-- Simples Nacional, no ICMS credit -->
              <orig>0</orig>                 <!-- Origin (0=national) -->
              <CSOSN>102</CSOSN>             <!-- Simples Nacional operation code -->
            </ICMSSN102>
          </ICMS>
          <!-- PIS -->
          <PIS>
            <PISNT>
              <CST>07</CST>                  <!-- Not taxed (Simples Nacional) -->
            </PISNT>
          </PIS>
          <!-- COFINS -->
          <COFINS>
            <COFINSNT>
              <CST>07</CST>
            </COFINSNT>
          </COFINS>
        </imposto>
      </det>

      <!-- Totals -->
      <total>
        <ICMSTot>
          <vBC>0.00</vBC>                   <!-- ICMS base -->
          <vICMS>0.00</vICMS>               <!-- ICMS value -->
          <vProd>499.00</vProd>              <!-- Products total -->
          <vNF>499.00</vNF>                 <!-- Invoice total -->
          <!-- ... additional total fields ... -->
        </ICMSTot>
      </total>

      <!-- Transport -->
      <transp>
        <modFrete>9</modFrete>               <!-- 0=seller, 1=buyer, 9=no freight -->
      </transp>

      <!-- Payment -->
      <pag>
        <detPag>
          <tPag>01</tPag>                    <!-- Payment method (01=cash, 17=PIX, etc.) -->
          <vPag>499.00</vPag>
        </detPag>
      </pag>

    </infNFe>
    <Signature><!-- XML digital signature (XMLDSig) --></Signature>
  </NFe>
  <protNFe versao="4.00">
    <!-- SEFAZ authorization protocol -->
    <infProt>
      <tpAmb>1</tpAmb>
      <chNFe>{44_digit_access_key}</chNFe>
      <dhRecbto>2026-02-24T10:30:05-03:00</dhRecbto>
      <nProt>135260000012345</nProt>         <!-- Authorization protocol number -->
      <cStat>100</cStat>                     <!-- 100 = authorized -->
      <xMotivo>Autorizado o uso da NF-e</xMotivo>
    </infProt>
  </protNFe>
</nfeProc>
```

**Chave de Acesso (44-digit access key) structure:**

```
Position  Length  Content
1-2       2      State code (UF - IBGE)
3-6       4      Year/Month (AAMM)
7-20      14     Emitter CNPJ
21-22     2      Model (55 = NF-e, 65 = NFC-e)
23-25     3      Series
26-34     9      NF-e number
35-35     1      Emission type (1=normal)
36-43     8      NF-e code (cNF)
44-44     1      Check digit (mod 11)
```

**NF-e payment method codes (tPag) -- Kitz must map:**

| Code | Method | Kitz Provider |
|---|---|---|
| 01 | Dinheiro (Cash) | manual |
| 02 | Cheque | manual |
| 03 | Cartao de Credito | card (via Mercado Pago, PagSeguro) |
| 04 | Cartao de Debito | card |
| 05 | Credito Loja (Store credit) | manual |
| 10 | Vale Alimentacao | not applicable |
| 15 | Boleto Bancario | boleto |
| 17 | PIX | pix |
| 99 | Outros | other |

---

### 5.2 NFS-e (Nota Fiscal de Servicos Eletronica)

**What it is:**
NFS-e is the electronic invoice for services, administered by each municipality. Unlike NF-e (which is state-level and well-standardized), NFS-e systems vary dramatically between municipalities.

**National NFS-e (Sistema Nacional NFS-e):**

The Receita Federal launched the Sistema Nacional NFS-e in 2023 (accessible at https://www.gov.br/nfse/) to unify NFS-e issuance across all municipalities. Key points:

- Mandatory for MEI since September 2023.
- Gradually being extended to all businesses.
- Uses a standardized API and XML schema.
- Aims to replace the 5,570+ municipal systems.
- Not yet universal -- many municipalities still require their own system.

**NFS-e Key Fields:**

| Field | Description | Example |
|---|---|---|
| Numero RPS | Recibo Provisorio de Servicos number | Sequential per workspace |
| Codigo do Servico | Municipal service code (Lista de Servicos LC 116/2003) | `1.05` (Licenciamento de software) |
| ISS Rate | Municipal services tax rate (2-5%) | `5.00` (Sao Paulo) |
| Local de Prestacao | Where the service was provided | Municipality code |
| Tomador | Service recipient (name, CPF/CNPJ, address) | Customer data |
| Valor dos Servicos | Total service value | R$ 5.000,00 |
| Base de Calculo ISS | ISS calculation base | R$ 5.000,00 |
| ISS Retido | Whether ISS is withheld by the buyer | `Sim` / `Nao` |
| Natureza da Operacao | Operation nature | `Tributacao no municipio` |

**ISS Rate Variation by City (examples):**

| City | ISS Rate (typical) | Notes |
|---|---|---|
| Sao Paulo | 2-5% (varies by service) | 2% for technology services |
| Rio de Janeiro | 2-5% | 5% for most services |
| Belo Horizonte | 2-5% | |
| Curitiba | 2-5% | |
| Brasilia (DF) | 2-5% | ISS administered by DF government |

**Recommended approach:** Use an NFS-e aggregator (NFe.io, eNotas, Focus NFe) that handles per-municipality variation. Kitz sends service data via a single API; the aggregator routes to the correct municipal system.

---

### 5.3 NFC-e (Nota Fiscal de Consumidor Eletronica)

**What it is:**
NFC-e is the electronic consumer receipt, replacing the old ECF (Emissor de Cupom Fiscal). It is used for point-of-sale retail transactions with end consumers. NFC-e follows the same SEFAZ authorization flow as NF-e but uses model 65 instead of 55.

**Why Kitz needs it:**
Kitz workspaces that operate retail stores or food businesses will need NFC-e for in-person consumer sales. Each NFC-e requires a CSC (Codigo de Seguranca do Contribuinte) issued by the state SEFAZ.

**Key differences from NF-e:**

| Aspect | NF-e (Model 55) | NFC-e (Model 65) |
|---|---|---|
| Use case | B2B, large B2C | POS retail, consumer |
| Buyer ID | Required (CNPJ/CPF) | Optional for sales < R$ 200 |
| DANFE | Full A4 page | Compact receipt (80mm) |
| CSC required | No | Yes (per state) |
| QR Code | Optional | Mandatory (for consumer verification) |
| Offline mode | Contingency available | SEFAZ contingency (offline mode) |

**Implementation timeline:** Q3-Q4 2026 (for Kitz workspaces with POS needs).

---

### 5.4 CT-e (Conhecimento de Transporte Eletronico)

**What it is:**
CT-e is the electronic transport document used for freight services. Relevant only for Kitz workspaces operating in logistics/transport.

**Implementation timeline:** Future (low priority unless Kitz targets transport vertical).

---

### 5.5 ICMS Calculation -- Interstate Complexity

**ICMS is the most complex individual tax in Brazil.** The rate depends on:

1. **Origin state** of the seller
2. **Destination state** of the buyer
3. **Product NCM code**
4. **Tax regime** of the seller (Simples Nacional vs. normal)
5. **Type of buyer** (taxpayer vs. non-taxpayer / end consumer)
6. **Special ICMS regimes** (substituicao tributaria, DIFAL, etc.)

**Interstate ICMS Rate Table:**

```
INTERSTATE ICMS RATES (between states)
=======================================

From / To:    S/SE states*    N/NE/CO states**
              (destination)   (destination)
S/SE origin*:     12%              7%
N/NE/CO origin**: 12%             12%

*  S/SE = Sul/Sudeste: SP, RJ, MG, ES, PR, SC, RS
** N/NE/CO = Norte/Nordeste/Centro-Oeste: all other states

Internal rates (within state): vary 17-20%+
  SP internal: 18%
  RJ internal: 20% (increased in 2025)
  MG internal: 18%
  RS internal: 17%
```

**DIFAL (Diferencial de Aliquota):**

When selling to a non-taxpayer end consumer in another state, the seller must calculate and collect DIFAL -- the difference between the destination state's internal rate and the interstate rate.

```typescript
/**
 * Calculate DIFAL for interstate sales to end consumers.
 * Required since EC 87/2015.
 */
function calculateDIFAL(
  originState: string,
  destinationState: string,
  productValue: number,
  destinationInternalRate: number,
): { difal: number; interestateRate: number; destinationRate: number } {
  // Determine interstate rate
  const southSoutheast = ['SP', 'RJ', 'MG', 'ES', 'PR', 'SC', 'RS'];
  const originIsSouthSE = southSoutheast.includes(originState);
  const destIsSouthSE = southSoutheast.includes(destinationState);

  let interstateRate: number;
  if (originState === destinationState) {
    // Same state -- no DIFAL
    return { difal: 0, interestateRate: 0, destinationRate: destinationInternalRate };
  } else if (originIsSouthSE && destIsSouthSE) {
    interstateRate = 0.12;
  } else if (originIsSouthSE && !destIsSouthSE) {
    interstateRate = 0.07;
  } else {
    interstateRate = 0.12;
  }

  // DIFAL = product_value * (destination_rate - interstate_rate)
  const difal = productValue * (destinationInternalRate - interstateRate);

  return {
    difal: Math.max(difal, 0),
    interestateRate: interstateRate,
    destinationRate: destinationInternalRate,
  };
}
```

**ICMS Substituicao Tributaria (ICMS-ST):**

For certain products (beverages, cigarettes, auto parts, cosmetics, etc.), the first seller in the supply chain collects ICMS for all subsequent transactions (substituicao tributaria). This adds another layer of complexity. The list of products subject to ST varies by state.

**Kitz approach:** For Simples Nacional businesses (the majority of Kitz users), ICMS is already included in the DAS payment and does not need to be calculated separately on most invoices. However, Kitz must handle:
- DIFAL for interstate consumer sales
- ICMS-ST for products subject to substituicao tributaria
- Correct CSOSN codes on NF-e for Simples Nacional businesses

---

## 6. Payment Flow Architecture

### 6.1 End-to-End Payment Flow (Brazil)

```
                       BRAZIL PAYMENT FLOW
                       ====================

  Kitz Workspace Owner                         Customer
        |                                         |
        |  Creates invoice (invoice_create)       |
        |  with line items + taxes                |
        |  (ICMS/ISS/PIS/COFINS or Simples)      |
        |                                         |
        v                                         |
  +-----------+                                   |
  | Invoice   |                                   |
  | Generated |                                   |
  +-----------+                                   |
        |                                         |
        +-- NF-e path (goods):                    |
        |   -> XML signed with e-CNPJ             |
        |   -> Sent to SEFAZ for authorization    |
        |   -> SEFAZ returns authorized NF-e      |
        |   -> DANFE (PDF) generated              |
        |                                         |
        +-- NFS-e path (services):                |
        |   -> Sent to municipal system           |
        |      (via aggregator API)               |
        |   -> Municipality returns NFS-e number  |
        |                                         |
        v                                         |
  +-----------+                                   |
  | Fiscal    |  Sends via WhatsApp/Email         |
  | Document  | ----- DANFE + Payment options --> |
  | Issued    |                                   |
  +-----------+                                   |
        |                                         v
        |                                   +-----------+
        |                                   | Customer  |
        |                                   | chooses   |
        |                                   | payment   |
        |                                   +-----------+
        |                                         |
        +--------- PIX QR Code -----------+       |
        |                                 |       |
        +--------- Boleto PDF  -----------+       |
        |                                 |       |
        +--------- Card Link  -----------+        |
        |                                 v       |
        |                           +-----------+ |
        |                           | Payment   | |
        |                           | Processed | |
        |                           | (PSP)     | |
        |                           +-----------+ |
        |                                 |       |
        v                                 v       |
  +-----------+                     +-----------+ |
  | Webhook   | <-- PSP callback    | PSP       | |
  | received  |                     | confirms  | |
  +-----------+                     +-----------+ |
        |                                         |
        v                                         |
  +---------------------+                        |
  | payments_process     |                        |
  | Webhook              |                        |
  | (paymentTools.ts)    |                        |
  | provider: 'pix' |    |                        |
  |   'boleto' | 'card'  |                        |
  +---------------------+                        |
        |                                         |
        +-- Invoice status -> 'paid'              |
        +-- NF-e/NFS-e: payment event recorded    |
        +-- CRM contact -> payment recorded       |
        +-- WhatsApp receipt sent --------------->|
        +-- Revenue dashboard updated             |
        +-- Tax ledger updated (for DAS calc)     |
```

### 6.2 Fiscal Document Issuance Flow

```
FISCAL DOCUMENT DECISION TREE
==============================

  Sale occurs
       |
       v
  Is it goods (mercadoria) or services (servico)?
       |                    |
    GOODS                SERVICES
       |                    |
       v                    v
  Issue NF-e            Issue NFS-e
  (SEFAZ auth)          (Municipal auth)
       |                    |
       v                    v
  +----------+         +----------+
  | Sign XML |         | Send to  |
  | with     |         | NFS-e    |
  | e-CNPJ   |         | aggregator|
  +----------+         | (NFe.io) |
       |                +----------+
       v                    |
  +----------+              v
  | Send to  |         +----------+
  | SEFAZ    |         | Municipal|
  | Web Svc  |         | system   |
  +----------+         | returns  |
       |                | NFS-e #  |
       v                +----------+
  +----------+
  | SEFAZ    |
  | returns  |
  | auth     |
  | protocol |
  +----------+
       |
       v
  Generate DANFE (PDF)
       |
       v
  Send to customer
  (WhatsApp/email)
```

### 6.3 Multi-Provider Strategy (Brazil)

```
Priority 1 (Now):     PIX              -- 70%+ of digital payments
Priority 2 (Q2 2026): Boleto           -- 30% of e-commerce, B2B, unbanked
Priority 3 (Q2 2026): Credit Card      -- via Mercado Pago/Asaas
Priority 4 (Q3 2026): Debit Card       -- via Mercado Pago/Asaas
Priority 5 (Future):  Pix Automatico   -- recurring PIX (when BCB launches)
Priority 6 (Future):  Pix Parcelado    -- PIX installments
```

### 6.4 Webhook Processing

```typescript
// Required update to paymentTools.ts provider enum for Brazil
provider: {
  type: 'string',
  enum: [
    'stripe', 'paypal',           // International
    'yappy', 'bac',               // Panama
    'pix', 'boleto', 'mercadopago', 'pagseguro', 'stone',  // Brazil
  ]
}

// Webhook handler must normalize data from different PSPs
interface BrazilPaymentWebhook {
  provider: 'pix' | 'boleto' | 'mercadopago' | 'pagseguro' | 'stone';
  provider_transaction_id: string;
  amount: number;
  currency: 'BRL';
  payer_name?: string;
  payer_cpf_cnpj?: string;
  payment_method: 'pix' | 'boleto' | 'credit_card' | 'debit_card';
  invoice_id?: string;
  workspace_id: string;
  timestamp: string;
  // PIX-specific
  pix_end_to_end_id?: string;  // E2E ID from BCB
  pix_key_used?: string;
  // Boleto-specific
  boleto_barcode?: string;
  boleto_due_date?: string;
  boleto_paid_date?: string;
  boleto_paid_amount?: number;  // May differ from original (interest/penalty)
}
```

---

## 7. Currency & Localization

### 7.1 Currency

| Aspect | Detail |
|---|---|
| Currency | Real brasileiro (BRL) |
| Symbol | R$ |
| ISO 4217 code | BRL |
| Subdivision | Centavos (1 Real = 100 centavos) |
| Thousands separator | Period (`.`) -- **OPPOSITE of USD/Panama** |
| Decimal separator | Comma (`,`) -- **OPPOSITE of USD/Panama** |

**CRITICAL DIFFERENCE FROM PANAMA:**

```
Panama:  $1,234.56   (comma = thousands, period = decimal)
Brazil:  R$ 1.234,56 (period = thousands, comma = decimal)

This MUST be handled in:
  - Invoice templates
  - Payment amount display
  - Tax calculation output
  - Reports and dashboards
  - Data input/validation
```

**Currency Formatting (TypeScript):**

```typescript
/**
 * Format a number as Brazilian Real (BRL).
 * Uses pt-BR locale which applies correct separators.
 */
function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  // Returns: "R$ 1.234,56"
}

/**
 * Parse a Brazilian-formatted currency string to number.
 * Handles: "R$ 1.234,56" -> 1234.56
 *          "1.234,56" -> 1234.56
 *          "1234,56" -> 1234.56
 */
function parseBRL(value: string): number {
  const cleaned = value
    .replace(/R\$\s?/, '')  // Remove currency symbol
    .replace(/\./g, '')     // Remove thousands separators (periods)
    .replace(',', '.');     // Convert decimal comma to period
  return parseFloat(cleaned);
}
```

### 7.2 Date Format

| Context | Format | Example |
|---|---|---|
| User-facing display | DD/MM/YYYY | 24/02/2026 |
| NF-e XML | YYYY-MM-DDTHH:mm:ss-03:00 | 2026-02-24T10:30:00-03:00 |
| Internal storage (ISO 8601) | YYYY-MM-DDTHH:mm:ssZ | 2026-02-24T13:30:00Z |
| Locale | `pt-BR` | Use for `toLocaleDateString()` |

**Timezone:**
Brazil has multiple timezones, but the primary business timezone is:
- **BRT (Brasilia Time):** UTC-3 (no daylight saving time since 2019)
- IANA timezone: `America/Sao_Paulo`
- Other timezones: `America/Manaus` (UTC-4), `America/Rio_Branco` (UTC-5), `America/Noronha` (UTC-2)

### 7.3 Phone Numbers

| Aspect | Detail |
|---|---|
| Country code | +55 |
| DDD (area code) | 2 digits (e.g., 11 = Sao Paulo, 21 = Rio, 31 = BH) |
| Mobile format | +55 (DD) 9XXXX-XXXX (9 digits, always starts with 9) |
| Landline format | +55 (DD) XXXX-XXXX (8 digits) |
| WhatsApp format | 55DD9XXXXXXXX (no +, no dashes, 13 digits total) |

**Phone Validation (TypeScript):**

```typescript
const BRAZIL_MOBILE = /^\+?55\s?\(?(\d{2})\)?\s?9\d{4}[-\s]?\d{4}$/;
const BRAZIL_LANDLINE = /^\+?55\s?\(?(\d{2})\)?\s?\d{4}[-\s]?\d{4}$/;

function validateBrazilPhone(phone: string): {
  valid: boolean;
  type: 'mobile' | 'landline' | 'unknown';
  ddd: string;
  whatsappFormat: string;
} {
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');

  // Mobile: 55 + DD(2) + 9 + number(8) = 13 digits
  if (/^55\d{2}9\d{8}$/.test(cleaned)) {
    return {
      valid: true,
      type: 'mobile',
      ddd: cleaned.slice(2, 4),
      whatsappFormat: cleaned,
    };
  }

  // Landline: 55 + DD(2) + number(8) = 12 digits
  if (/^55\d{2}\d{8}$/.test(cleaned) && cleaned[4] !== '9') {
    return {
      valid: true,
      type: 'landline',
      ddd: cleaned.slice(2, 4),
      whatsappFormat: cleaned,
    };
  }

  return { valid: false, type: 'unknown', ddd: '', whatsappFormat: '' };
}

function toWhatsAppFormat(phone: string): string {
  return phone.replace(/[\s\-\(\)\+]/g, '');
  // "+55 (11) 99887-7665" -> "5511998877665"
}
```

### 7.4 Address Format

Brazilian addresses follow a standardized structure with CEP (Codigo de Enderecamento Postal -- zip code).

**Format:**
```
{Logradouro} (street type + name), {Numero}
{Complemento} (apartment, suite, etc.)
{Bairro} (neighborhood)
{Cidade} (city) - {UF} (state abbreviation, 2 letters)
CEP: {XXXXX-XXX}
```

**Example:**
```
Rua das Flores, 123
Sala 45, 4o andar
Centro
Sao Paulo - SP
CEP: 01001-000
```

**CEP Validation:**

```typescript
const CEP_REGEX = /^\d{5}-?\d{3}$/;

function validateCEP(cep: string): boolean {
  return CEP_REGEX.test(cep.trim());
}

function formatCEP(cep: string): string {
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) return cep;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

// CEP lookup: use ViaCEP API (free, public)
// GET https://viacep.com.br/ws/{CEP}/json/
// Returns: logradouro, complemento, bairro, localidade, uf, ibge, ddd
```

**State Codes (UF):**

| Code | State | Capital |
|---|---|---|
| AC | Acre | Rio Branco |
| AL | Alagoas | Maceio |
| AM | Amazonas | Manaus |
| AP | Amapa | Macapa |
| BA | Bahia | Salvador |
| CE | Ceara | Fortaleza |
| DF | Distrito Federal | Brasilia |
| ES | Espirito Santo | Vitoria |
| GO | Goias | Goiania |
| MA | Maranhao | Sao Luis |
| MG | Minas Gerais | Belo Horizonte |
| MS | Mato Grosso do Sul | Campo Grande |
| MT | Mato Grosso | Cuiaba |
| PA | Para | Belem |
| PB | Paraiba | Joao Pessoa |
| PE | Pernambuco | Recife |
| PI | Piaui | Teresina |
| PR | Parana | Curitiba |
| RJ | Rio de Janeiro | Rio de Janeiro |
| RN | Rio Grande do Norte | Natal |
| RO | Rondonia | Porto Velho |
| RR | Roraima | Boa Vista |
| RS | Rio Grande do Sul | Porto Alegre |
| SC | Santa Catarina | Florianopolis |
| SE | Sergipe | Aracaju |
| SP | Sao Paulo | Sao Paulo |
| TO | Tocantins | Palmas |

### 7.5 Language

- **Language:** Portuguese (Brazilian) -- `pt-BR`
- **NOT Spanish.** This is a fundamental difference from every other Kitz market.
- All UI text, invoice templates, notifications, error messages, and support content must be in Brazilian Portuguese.
- Currency terms: "Real" (singular), "Reais" (plural)
- Invoice terms: "Nota Fiscal" (not "Factura"), "Servico" (not "Servicio"), "Descricao" (not "Descripcion")

**Key business terms in Brazilian Portuguese:**

| English | Brazilian Portuguese | Used In |
|---|---|---|
| Invoice | Nota Fiscal | Invoice templates |
| Quote | Orcamento | Quote templates |
| Customer | Cliente | CRM |
| Supplier | Fornecedor | Purchases |
| Tax | Imposto | Tax calculations |
| Discount | Desconto | Invoice line items |
| Payment | Pagamento | Payment processing |
| Receipt | Recibo / Comprovante | Payment confirmation |
| Due date | Data de vencimento | Invoices, boletos |
| Overdue | Em atraso / Vencido | Collection workflows |
| Subtotal | Subtotal | Invoice totals |
| Total | Total / Valor total | Invoice totals |
| Quantity | Quantidade (Qtd.) | Line items |
| Unit price | Preco unitario | Line items |
| Description | Descricao | Line items |
| Company name | Razao social | Legal name |
| Trade name | Nome fantasia | Business display name |
| Tax ID (business) | CNPJ | Workspace setup |
| Tax ID (personal) | CPF | Customer records |
| State registration | Inscricao Estadual (IE) | ICMS taxpayer ID |
| Municipal registration | Inscricao Municipal (IM) | ISS taxpayer ID |

---

## 8. Competitive Landscape

### 8.1 Direct Competitors (Brazil SMB Software)

| Competitor | Strengths | Weaknesses | Kitz Differentiator |
|---|---|---|---|
| **Bling** | Popular SMB ERP, e-commerce integrations (Shopee, Mercado Livre, Amazon), NF-e/NFS-e, financial controls | No AI, no WhatsApp-native, traditional UI, no CRM focus | Kitz is AI-native, WhatsApp-first, CRM-integrated |
| **Tiny ERP** (now Olist ERP) | E-commerce focused, marketplace integrations, NF-e, inventory | Acquired by Olist, product direction uncertain; no AI | Kitz is independent, AI-powered, broader than e-commerce |
| **Conta Azul** | Strong accounting/bookkeeping, bank integration, NF-e/NFS-e, Simples Nacional support | Accounting-focused (not a full business OS), expensive for micro businesses, no AI | Kitz is full business OS with AI assistant |
| **Omie** | Complete ERP, strong accounting, NF-e/NFS-e, CRM module, multi-company | Complex (enterprise feel), expensive, steep learning curve | Kitz is lightweight, mobile-first, AI-guided |
| **NFe.io** | Best-in-class NF-e/NFS-e API, developer-friendly, 1,100+ municipalities | Not an end-user product -- API/infrastructure only | Potential NFS-e integration partner |
| **eNotas** | Strong NF-e/NFS-e automation, good API, SaaS-friendly | API-only (no end-user UI), limited beyond invoicing | Potential NFS-e integration partner |
| **Olist** | Marketplace aggregator, fulfillment, ERP (Tiny), capital | Focused on e-commerce sellers, not general SMBs | Kitz serves all SMB types, not just e-commerce |

### 8.2 Payment Infrastructure Competitors

| Competitor | Role | Overlap with Kitz |
|---|---|---|
| **iugu** | Payment infrastructure for SaaS platforms | Potential PSP partner, not direct competitor |
| **Asaas** | SMB financial management + payments | Overlaps with invoicing + payments; strong PIX/boleto |
| **Vindi** | Subscription/recurring billing platform | Niche overlap for subscription-based Kitz users |
| **Pagar.me** (Stone) | Payment gateway for developers | Potential PSP partner |
| **Wirecard (Moip/PagMoip)** | Online payments (being absorbed into PagSeguro ecosystem) | Low priority |

### 8.3 Kitz's Competitive Advantages in Brazil

1. **AI-native business operating system:** No Brazilian SMB tool offers AI-powered content creation, customer communication, and business automation.
2. **WhatsApp-first:** WhatsApp is the #1 communication channel in Brazil (120M+ users). Kitz treats it as core, not a plugin.
3. **Multi-country platform:** Kitz's architecture supports multiple LatAm markets. A Brazilian SMB expanding to other countries stays on one platform.
4. **Tax regime intelligence:** By capturing the business's tax regime (MEI/Simples/Lucro Presumido), Kitz can proactively guide tax obligations -- no competitor does this with AI.
5. **Modern tech stack:** Built on modern infrastructure (Supabase, Edge Functions, React), enabling faster iteration than legacy ERP systems built on older technology.
6. **SMB pricing:** Designed for micro and small business budgets, competing on value against expensive traditional ERPs.

---

## 9. Implementation Roadmap

### Phase 1: Foundation (NOW -- Q1 2026)

| Priority | Task | Owner | Status |
|---|---|---|---|
| P0 | Legal assessment: LGPD compliance review | Legal | Not started |
| P0 | Legal assessment: payment facilitation licensing (BCB) | Legal | Not started |
| P0 | Add `pt-BR` language support to UI and templates | Engineering | Not started |
| P0 | CNPJ validation in workspace onboarding | Engineering | Not started |
| P0 | CPF validation for customer records | Engineering | Not started |
| P0 | BRL currency formatting (comma decimal) throughout platform | Engineering | Not started |
| P1 | Tax regime capture during workspace setup (MEI/Simples/LP/LR) | Engineering | Not started |
| P1 | PIX PSP selection and sandbox integration | Engineering | Not started |
| P1 | Add `'pix'`, `'boleto'`, `'mercadopago'` to provider enum | Engineering | Not started |
| P1 | PIX key validation and storage per workspace | Engineering | Not started |

### Phase 2: Payment & Fiscal Compliance (Q2 2026)

| Priority | Task | Owner | Status |
|---|---|---|---|
| P0 | PIX production integration (QR + webhook) | Engineering | Blocked by Phase 1 |
| P0 | NF-e integration via aggregator API (NFe.io or Focus NFe) | Engineering | Not started |
| P0 | NFS-e integration via aggregator API | Engineering | Not started |
| P0 | Digital certificate (e-CNPJ) management per workspace | Engineering | Not started |
| P1 | Boleto generation and tracking | Engineering | Not started |
| P1 | Credit card payment via Mercado Pago | Engineering | Not started |
| P1 | DANFE (PDF) generation from authorized NF-e | Engineering | Not started |
| P1 | Simples Nacional tax calculation (all 5 Annexes) | Engineering | Not started |
| P2 | NCM code lookup and product classification | Engineering | Not started |
| P2 | CFOP code selection assistance (AI-guided) | Product | Not started |

### Phase 3: Growth & Optimization (Q3 2026)

| Priority | Task | Owner | Status |
|---|---|---|---|
| P1 | NFC-e integration for POS retail | Engineering | Not started |
| P1 | ICMS interstate calculation (DIFAL) | Engineering | Not started |
| P1 | Bank statement import (OFX/CSV) for reconciliation | Engineering | Not started |
| P1 | DAS payment reminder automation (Simples Nacional) | Engineering | Not started |
| P2 | CBS/IBS tax reform rates (2026 test rates) | Engineering | Not started |
| P2 | PagSeguro integration | Engineering | Not started |
| P2 | Stone integration | Engineering | Not started |
| P2 | Credit note (NF-e de devolucao) support | Engineering | Not started |
| P3 | Open Finance Brasil exploration | Engineering | Not started |

### Phase 4: Advanced (Q4 2026+)

| Priority | Task | Owner | Status |
|---|---|---|---|
| P1 | Pix Automatico integration (recurring PIX, when available) | Engineering | Not started |
| P2 | ICMS Substituicao Tributaria calculation | Engineering | Not started |
| P2 | Multi-state operation support (branches in different states) | Engineering | Not started |
| P2 | Inventory management with fiscal integration | Engineering | Not started |
| P3 | Open Finance data aggregation | Engineering | Not started |
| P3 | CT-e support (transport document) | Engineering | Not started |
| P3 | Tax reform full transition support (CBS/IBS) | Engineering | Not started |

---

## 10. Compliance Checklist for Launch

Before Kitz can operate in Brazil, the following must be verified:

### Legal & Regulatory

- [ ] LGPD compliance assessment completed
- [ ] Privacy policy in Portuguese (`Politica de Privacidade`)
- [ ] Terms of service in Portuguese (`Termos de Uso`)
- [ ] DPO (Encarregado de Dados) appointed
- [ ] BCB licensing assessment -- determine if Kitz needs a payment institution license or can operate through licensed PSPs
- [ ] Cookie consent banner (LGPD requirement)
- [ ] Data processing records (Registro de Atividades de Tratamento)

### Tax Compliance

- [ ] CNPJ validation implemented for workspace owners
- [ ] CPF validation implemented for customer/contact records
- [ ] Tax regime detection and storage (MEI/Simples/LP/LR)
- [ ] Simples Nacional tax calculation (Annexes I-V, all brackets)
- [ ] ICMS interstate rate table implemented
- [ ] ISS rate table by municipality (at least top 50 cities)
- [ ] CBS/IBS test rates implemented for 2026
- [ ] NCM code support for product classification
- [ ] CFOP code mapping for common operation types

### E-Invoice (NF-e)

- [ ] NF-e XML generation conforming to version 4.00
- [ ] Digital certificate (e-CNPJ) integration for signing
- [ ] SEFAZ web service routing by state
- [ ] Chave de Acesso (44-digit key) generation
- [ ] DANFE (PDF) generation
- [ ] NF-e authorization, cancellation, and correction letter (CC-e) flows
- [ ] Homologation (sandbox) testing completed for all target states
- [ ] Contingency emission mode (when SEFAZ is unavailable)
- [ ] NF-e storage for 5+ years

### E-Invoice (NFS-e)

- [ ] NFS-e aggregator integration (NFe.io, eNotas, or equivalent)
- [ ] Coverage verified for top 50 municipalities by GDP
- [ ] ISS calculation with per-municipality rates
- [ ] RPS (Recibo Provisorio de Servicos) numbering
- [ ] NFS-e cancellation flow
- [ ] National NFS-e system integration (for MEI)

### Payment Processing

- [ ] PIX integration via PSP -- QR code generation, Copia e Cola, webhook
- [ ] Boleto generation, tracking, expiration handling
- [ ] Credit card processing via PSP
- [ ] Payment-to-invoice linking (auto-mark paid)
- [ ] Payment reconciliation reports
- [ ] Transaction data retention (5+ years)
- [ ] Refund/chargeback handling

### User Experience

- [ ] All UI text in Brazilian Portuguese (`pt-BR`)
- [ ] BRL currency formatting: `R$ 1.234,56` (period thousands, comma decimal)
- [ ] Dates displayed as DD/MM/YYYY
- [ ] Phone numbers validated for Brazil format (+55 DD 9XXXX-XXXX)
- [ ] CEP (postal code) validation and auto-fill via ViaCEP
- [ ] Address format: Logradouro, Numero, Complemento, Bairro, Cidade-UF, CEP
- [ ] State (UF) selector with all 26 states + DF
- [ ] WhatsApp integration using Brazil phone format (55DDXXXXXXXXX)
- [ ] Invoice templates use correct Portuguese terminology (Nota Fiscal, Descricao, Quantidade, etc.)
- [ ] Razao Social and Nome Fantasia fields in workspace profile

---

## 11. Partnership Opportunities

### 11.1 Strategic Partnerships

| Partner | Type | Value to Kitz | Approach |
|---|---|---|---|
| **NFe.io** | NF-e/NFS-e infrastructure | Best-in-class API for fiscal document issuance across 1,100+ municipalities | API integration partnership |
| **eNotas** | NF-e/NFS-e infrastructure | Alternative to NFe.io, strong API, competitive pricing | Evaluate as alternative/backup |
| **Mercado Pago** | Payment infrastructure | Single API for PIX, boleto, cards; 50M+ users; sandbox environment | Developer program, commercial partnership |
| **Asaas** | Payment + financial management | PIX, boleto, cards, subscriptions; built for SaaS platforms | API integration partnership |
| **SEBRAE** | Distribution & credibility | Brazil's SMB support agency (like Panama's AMPYME); millions of registered SMBs; training programs, mentoring, events | Propose co-branded digitization program |
| **Banco Central do Brasil** | Regulatory & innovation | PIX ecosystem participation, Open Finance access, regulatory guidance | Regulatory sandbox participation |

### 11.2 Distribution Partnerships

| Partner | Channel | Opportunity |
|---|---|---|
| **SEBRAE** | Government SMB agency | Feature Kitz in digital transformation programs for MEI/ME/EPP |
| **Contadores (Accountants)** | Professional network | Referral program for accounting firms; Kitz reduces their manual work |
| **Simples Nacional ecosystem** | Tax regime community | Integration with accounting software used by Simples Nacional businesses |
| **Mercado Livre** | E-commerce marketplace | Kitz as back-office for Mercado Livre sellers (invoicing, CRM, payments) |
| **Associacoes Comerciais** | Business associations | Federacao das Associacoes Comerciais -- member benefit programs |
| **CDL (Camara de Dirigentes Lojistas)** | Retail associations | Local retailer networks, strong in interior cities |
| **Startup accelerators** | Innovation ecosystem | Cubo Itau, Inovabra, Distrito, ACE -- reach tech-savvy SMB founders |

### 11.3 SEBRAE Partnership (High Priority)

**What is SEBRAE:**
Servico Brasileiro de Apoio as Micro e Pequenas Empresas (SEBRAE) is Brazil's premier SMB support organization. It is a private, non-profit entity funded by a compulsory contribution from Brazilian businesses. SEBRAE provides training, consulting, market access, and technology adoption support to millions of SMBs.

**Why partner with SEBRAE:**
- SEBRAE has offices in all 27 states and the DF.
- It serves 15+ million MEIs and SMBs.
- SEBRAE actively promotes digital tools for SMBs.
- Co-branding with SEBRAE provides instant credibility.
- SEBRAE events (Feira do Empreendedor, workshops) are excellent distribution channels.

**Partnership model:**
1. Offer Kitz at preferential pricing for SEBRAE-registered businesses.
2. Integrate SEBRAE training content into Kitz's AI assistant.
3. Provide SEBRAE with anonymized adoption metrics for their digital transformation tracking.
4. Co-develop a "Digitalize seu Negocio" (Digitize your Business) program.

---

## 12. Appendix: Reference Links

### Payment Systems
- PIX (Banco Central): https://www.bcb.gov.br/estabilidadefinanceira/pix
- PIX Developer Docs: https://www.bcb.gov.br/estabilidadefinanceira/comunicacaodados
- Mercado Pago Developers: https://www.mercadopago.com.br/developers/
- PagSeguro Developers: https://dev.pagseguro.uol.com.br/
- Stone Developers: https://docs.openstone.com/
- Asaas API: https://docs.asaas.com/
- iugu Developers: https://dev.iugu.com/
- Gerencianet (Efi) PIX API: https://dev.efipay.com.br/

### Government & Tax
- Receita Federal: https://www.gov.br/receitafederal/
- Portal da Nota Fiscal Eletronica: https://www.nfe.fazenda.gov.br/
- NF-e Technical Manual (v4.00): https://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=33ol5hhSYZk=
- Sistema Nacional NFS-e: https://www.gov.br/nfse/
- Simples Nacional: http://www8.receita.fazenda.gov.br/SimplesNacional/
- MEI Portal: https://www.gov.br/empresas-e-negocios/pt-br/empreendedor
- LGPD (Law 13.709/2018): https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm
- ANPD: https://www.gov.br/anpd/
- Open Finance Brasil: https://openfinancebrasil.org.br/
- Tax Reform (EC 132/2023): https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc132.htm

### Banking
- Banco Central do Brasil: https://www.bcb.gov.br/
- Banco do Brasil: https://www.bb.com.br/
- Itau Unibanco: https://www.itau.com.br/
- Bradesco: https://www.bradesco.com.br/
- Caixa Economica Federal: https://www.caixa.gov.br/
- Santander Brasil: https://www.santander.com.br/
- Nubank: https://nubank.com.br/
- Inter: https://www.bancointer.com.br/
- C6 Bank: https://www.c6bank.com.br/

### NF-e/NFS-e Infrastructure
- NFe.io: https://nfe.io/
- eNotas: https://enotas.com.br/
- Focus NFe: https://focusnfe.com.br/
- Tecnospeed: https://www.tecnospeed.com.br/
- ViaCEP (address lookup): https://viacep.com.br/
- IBGE (municipality codes): https://www.ibge.gov.br/

### SMB Ecosystem
- SEBRAE: https://www.sebrae.com.br/
- ABRASF (NFS-e standard): https://abrasf.org.br/
- Febraban (banking federation): https://portal.febraban.org.br/

### Competitive Intelligence
- Bling: https://www.bling.com.br/
- Conta Azul: https://contaazul.com/
- Omie: https://www.omie.com.br/
- Olist: https://olist.com/
- Asaas: https://www.asaas.com/

### Regulatory References
- Lei Complementar 123/2006 (Simples Nacional)
- Lei Complementar 116/2003 (ISS services list)
- Lei 13.709/2018 (LGPD)
- Emenda Constitucional 132/2023 (Tax Reform)
- Emenda Constitucional 87/2015 (DIFAL)
- Ajuste SINIEF 07/2005 (NF-e creation)
- Manual de Orientacao do Contribuinte MOC NF-e v4.00
- Nota Tecnica 2019.001 (NF-e v4.00 updates)
- Resolucao BCB 1/2020 (PIX regulation)

### Kitz Codebase References
- Payment tools: `kitz_os/src/tools/paymentTools.ts`
- Invoice/quote tools: `kitz_os/src/tools/invoiceQuoteTools.ts`
- Invoice workflow: `kitz_os/data/n8n-workflows/invoice-auto-generate.json`

---

## Addendum: Brazil vs. Panama Complexity Matrix

This matrix illustrates why Brazil requires significantly more engineering effort than Panama:

| Dimension | Panama | Brazil | Multiplier |
|---|---|---|---|
| Tax authorities | 1 (DGI) | 27 SEFAZes + 5,570 prefeituras + Receita Federal | ~5,600x |
| Tax types | 1 (ITBMS 7%) | 6+ (ICMS, ISS, PIS, COFINS, IPI, CBS, IBS) | 6x |
| Tax rates | 4 tiers (0/7/10/15%) | 100s of combinations (state x product x regime) | 25x+ |
| Tax regimes | 1 | 4 (MEI, Simples, LP, LR) | 4x |
| E-invoice schemas | 1 (DGI XML) | 3+ (NF-e, NFS-e, NFC-e, CT-e) | 3x |
| E-invoice authorities | 1 PAC | 27 SEFAZes + 500+ municipal systems | 500x+ |
| Currency format | Same as USD | Inverted separators (comma/period) | Unique |
| Language | Spanish (shared) | Portuguese (new) | New language |
| Digital signature | PAC handles | Per-workspace e-CNPJ certificate | Complex |
| Payment methods | 2 (Yappy, BAC) | 5+ (PIX, boleto, card, debit, wallet) | 3x |
| Population/market | 4.4M | 215M | 49x |

**Bottom line:** Brazil is approximately 100x more complex than Panama from a tax/compliance perspective but represents approximately 50x more market opportunity. The investment is justified but must be approached with the right architecture (aggregator APIs, date-aware tax tables, per-state configuration).

---

*This document should be reviewed and updated monthly given the rapid pace of regulatory change in Brazil, especially during the 2026-2033 tax reform transition. Key monitoring: Receita Federal CBS/IBS implementing legislation, BCB PIX feature launches (Pix Automatico, Pix Garantido), SEFAZ technical updates, LGPD enforcement actions, and NFS-e national system expansion.*
