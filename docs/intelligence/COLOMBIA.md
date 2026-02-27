# Colombia Financial & Payment Infrastructure Intelligence

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

Colombia is Kitz's highest-value expansion market after Panama. With 50+ million people, the second-largest economy in the Andean region, and an aggressive government push toward digitization, Colombia offers a massive SMB addressable market. The country has mandatory electronic invoicing (Facturacion Electronica) enforced by DIAN since November 2020, a sophisticated real-time interbank payment system (PSE + Transfiya), and two dominant digital wallets (Nequi with 17M+ users and Daviplata with 16M+ users) that have achieved deeper penetration than any single payment app in Central America.

Colombia's tax system is significantly more complex than Panama's. Beyond IVA (19% standard rate), Colombian B2B transactions require per-transaction withholding tax calculations across three separate dimensions: ReteFuente (income tax withholding), ReteIVA (IVA withholding), and ReteICA (municipal industry tax withholding). These withholdings are not optional -- they are legally required when the buyer meets certain threshold criteria, and they directly reduce the amount paid to the seller on each invoice. Kitz must compute and display these correctly or risk non-compliance for its users.

On the positive side, Colombia adopted the XML-UBL 2.1 international standard for e-invoicing (unlike Panama's custom DGI schema), which means Kitz's invoice generation layer can build on widely available libraries and tooling. The CUFE (Codigo Unico de Factura Electronica) concept is similar to Panama's but uses a SHA-384 hash algorithm with a different input structure.

**Key takeaways:**

- PSE (Pagos Seguros en Linea) dominates B2B and e-commerce payments. Operated by ACH Colombia, it is the equivalent of "pay by bank" and processes 70%+ of online B2B transactions. Kitz's `paymentTools.ts` provider enum needs `'pse'` added.
- Nequi (Bancolombia) and Daviplata (Davivienda) together cover 33M+ users. These are not just P2P apps -- they are primary financial accounts for millions of Colombians. Kitz must support both as payment acceptance methods. Provider enum needs `'nequi'` and `'daviplata'`.
- Wompi (Bancolombia's payment gateway for developers) is the recommended integration path for Kitz. It provides a single API that wraps PSE, Nequi, cards, and Bancolombia QR. Provider enum needs `'wompi'`.
- Withholding taxes (ReteFuente, ReteIVA, ReteICA) require Kitz to build a per-transaction tax computation engine that does not exist today. This is the single largest engineering challenge for Colombia launch.
- E-invoicing via XML-UBL 2.1 is mandatory for ALL taxpayers. No threshold exemption like Panama's B/. 36,000 -- every business in Colombia must issue electronic invoices. Kitz must integrate with a Proveedor Tecnologico authorized by DIAN.
- The Regimen Simple de Tributacion offers simplified tax filing for small businesses with annual revenue under 100,000 UVT (~COP 4,700M / ~USD 1.1M in 2026). Kitz should detect and apply this regime automatically.

---

## 2. Payment Systems

### 2.1 PSE (Pagos Seguros en Linea)

**What it is:**
PSE is Colombia's dominant online bank transfer system, operated by ACH Colombia. It allows customers to pay merchants directly from their bank accounts through a secure redirect flow. PSE connects to virtually every bank in Colombia (30+ financial institutions) and processes the majority of B2B and e-commerce transactions in the country. It is Colombia's equivalent of iDEAL (Netherlands) or PIX (Brazil) -- a bank-to-bank real-time payment rail.

**Why Kitz needs it:**
PSE is non-negotiable for Colombia. Any business that accepts online payments in Colombia must support PSE. It is the default payment method for B2B transactions, government payments, and a significant share of consumer e-commerce. Unlike card payments, PSE has no chargeback risk and settles in near real-time.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Operator | ACH Colombia S.A. |
| Integration | Via payment gateway (Wompi, PayU, ePayco) -- not direct |
| Flow | Redirect-based: customer selects bank, authenticates at bank site, confirms payment |
| Settlement | T+0 to T+1 (near real-time for most banks) |
| Transaction limits | Vary by bank; typically COP 5M-20M per transaction for business accounts |
| Fees | 0.5%-1.5% per transaction (gateway-dependent) |
| Supported banks | 30+ including Bancolombia, Davivienda, Banco de Bogota, BBVA, Banco de Occidente |

**Integration pattern for Kitz:**

```
1. Kitz generates PSE payment request via Wompi API
   -> Wompi returns PSE redirect URL with bank selection
2. Customer selects their bank from the PSE bank list
3. Customer is redirected to their bank's online portal
4. Customer authenticates and confirms payment at their bank
5. Bank processes transfer via ACH Colombia
6. Wompi receives confirmation from ACH Colombia
7. Wompi sends webhook to Kitz callback URL
8. Kitz calls payments_processWebhook(provider: 'pse', ...)
9. Invoice status -> 'paid', CRM updated, WhatsApp receipt sent
```

**Key implementation notes:**
- PSE is always accessed through a payment gateway (Wompi, PayU, ePayco). Kitz cannot connect to PSE directly.
- The redirect flow means Kitz must handle the customer leaving and returning to the Kitz/storefront page.
- PSE transactions are irrevocable once confirmed -- no chargebacks, no reversals (unlike card payments).
- Bank list must be fetched dynamically from the gateway (banks can be added/removed).

**Implementation timeline:** NOW (Q1-Q2 2026) -- highest priority payment integration for Colombia.

---

### 2.2 Nequi (Bancolombia)

**What it is:**
Nequi is Colombia's leading digital wallet, operated by Bancolombia (the country's largest bank). With 17M+ registered users, Nequi has become a primary financial account for millions of Colombians, particularly younger demographics and the previously unbanked. It supports P2P transfers, QR payments, online payments, savings pockets, and merchant acceptance.

**Why Kitz needs it:**
Nequi is the Yappy of Colombia -- but with 8x the user base. Many Colombian SMB customers, especially in the services and retail sectors, prefer paying via Nequi due to its simplicity and zero-fee P2P transfers. Kitz workspace owners themselves are likely Nequi users. Supporting Nequi payment acceptance is critical for B2C transactions.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Developer portal | https://conecta.nequi.com.co/ |
| API type | REST API with OAuth 2.0 authentication |
| Payment methods | QR code generation, push notifications, payment links |
| Settlement | Into Nequi account (instant) or linked Bancolombia account |
| Transaction limit | COP 2,000,000 per transaction (consumer) |
| Sandbox | Available via Nequi Conecta developer portal |

**Integration pattern for Kitz:**

```
1. Kitz generates Nequi payment request via Nequi Conecta API
   -> API returns QR code or push notification reference
2. Customer scans QR code or receives push notification in Nequi app
3. Customer confirms payment in Nequi app (biometric or PIN)
4. Nequi processes payment and sends webhook to Kitz
5. Kitz calls payments_processWebhook(provider: 'nequi', ...)
6. Invoice status -> 'paid', CRM updated, WhatsApp receipt sent
```

**Key SDK configuration:**

```typescript
// Nequi Conecta API client configuration
interface NequiConfig {
  clientId: string;       // From Nequi Conecta developer portal
  clientSecret: string;   // OAuth 2.0 client secret
  apiKey: string;         // API key for request signing
  authUrl: string;        // 'https://oauth.sandbox.nequi.com/token' (sandbox)
                          // 'https://oauth.nequi.com/token' (production)
  baseUrl: string;        // 'https://api.sandbox.nequi.com' (sandbox)
                          // 'https://api.nequi.com' (production)
}

// Example: Generate QR payment
async function createNequiQRPayment(config: NequiConfig, params: {
  amount: number;         // In COP, no decimals
  merchantId: string;
  invoiceNumber: string;
  description: string;
}): Promise<{ qrCode: string; transactionId: string }> {
  const token = await getOAuthToken(config);
  const response = await fetch(`${config.baseUrl}/payments/v2/-services-paymentservice-generateqrcode`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-api-key': config.apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      RequestMessage: {
        RequestHeader: {
          Channel: 'MF-001',
          RequestDate: new Date().toISOString(),
          MessageID: crypto.randomUUID(),
          ClientID: config.clientId,
        },
        RequestBody: {
          any: {
            generateCodeQRRQ: {
              code: params.merchantId,
              value: String(params.amount),
              reference1: params.invoiceNumber,
              reference2: params.description,
            },
          },
        },
      },
    }),
  });
  const data = await response.json();
  return {
    qrCode: data.ResponseMessage.ResponseBody.any.generateCodeQRRS.codeQR,
    transactionId: data.ResponseMessage.ResponseBody.any.generateCodeQRRS.transactionId,
  };
}
```

**Compliance requirements:**
- Kitz workspace owner must have a Nequi business account (Nequi Negocio).
- Nequi Conecta developer agreement must be active.
- Transaction data retention per SFC (Superintendencia Financiera de Colombia) requirements.

**Implementation timeline:** Q2 2026 -- second priority after PSE/Wompi integration.

---

### 2.3 Daviplata (Davivienda)

**What it is:**
Daviplata is Colombia's second-largest digital wallet, operated by Banco Davivienda. With 16M+ registered users, it is particularly strong in rural areas, government subsidy disbursements, and lower-income demographics. Daviplata was originally built to distribute government social payments (like Familias en Accion) and has evolved into a full digital wallet.

**Why Kitz needs it:**
Daviplata reaches demographics that Nequi does not fully cover, particularly in smaller cities and rural areas. For Kitz workspace owners serving these markets (agriculture, local commerce, services), Daviplata acceptance is essential. Together, Nequi + Daviplata cover 33M+ users -- roughly 65% of Colombia's adult population.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Integration type | Via Wompi gateway or direct Daviplata business API |
| Payment methods | Transfer by phone number, QR code |
| Settlement | Into linked Davivienda account |
| Target demographic | Rural, lower-income, government subsidy recipients |
| Transaction limit | COP 3,000,000 per month (individual) |

**Integration pattern for Kitz:**

```
1. Kitz generates Daviplata payment instruction (phone number + amount + reference)
2. Customer opens Daviplata app, enters Kitz workspace phone number
3. Customer confirms transfer
4. Daviplata processes transfer
5. Webhook/notification to Kitz (via Wompi if using gateway)
6. Kitz calls payments_processWebhook(provider: 'daviplata', ...)
```

**Implementation timeline:** Q3 2026 -- after Nequi, via Wompi gateway abstraction.

---

### 2.4 Wompi (Bancolombia)

**What it is:**
Wompi is Bancolombia's payment gateway built specifically for developers. It provides a single API that aggregates multiple Colombian payment methods: PSE, Nequi, credit/debit cards (Visa, Mastercard, AMEX, Diners), Bancolombia QR, cash payments (via Efecty/Baloto), and bank transfers. Wompi is the recommended "single integration point" for Kitz in Colombia.

**Why Kitz needs it:**
Instead of building separate integrations for PSE, Nequi, cards, and Bancolombia QR, Kitz can integrate Wompi once and get access to all major Colombian payment methods. This mirrors how Kitz uses Yappy in Panama but with broader coverage. Wompi's developer experience is excellent -- modern REST API, webhooks, sandbox environment, and clear documentation.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Developer portal | https://docs.wompi.co/ |
| API version | v1 (REST) |
| Authentication | Public key (frontend) + Private key (backend) + Integrity key (webhooks) |
| Sandbox | Full sandbox with test credentials |
| Webhook verification | HMAC-SHA256 with integrity secret |
| Payment methods | PSE, Nequi, cards, Bancolombia QR, Efecty, Baloto, bank transfer |
| Settlement | T+1 to T+3 depending on payment method |
| Pricing | Per-transaction fees vary by method (PSE ~1%, cards ~2.9% + IVA) |

**Key SDK configuration:**

```typescript
// Wompi API client for Kitz Colombia
interface WompiConfig {
  publicKey: string;      // 'pub_test_...' (sandbox) or 'pub_prod_...' (production)
  privateKey: string;     // 'prv_test_...' (sandbox) or 'prv_prod_...' (production)
  integritySecret: string; // For webhook HMAC verification
  eventsUrl: string;       // Kitz webhook endpoint
  sandbox: boolean;
}

const wompiConfig: WompiConfig = {
  publicKey: process.env.WOMPI_PUBLIC_KEY!,
  privateKey: process.env.WOMPI_PRIVATE_KEY!,
  integritySecret: process.env.WOMPI_INTEGRITY_SECRET!,
  eventsUrl: 'https://kitz.app/webhooks/wompi',
  sandbox: process.env.NODE_ENV !== 'production',
};

// Base URL selection
const WOMPI_BASE = wompiConfig.sandbox
  ? 'https://sandbox.wompi.co/v1'
  : 'https://production.wompi.co/v1';

// Create a payment transaction via Wompi
async function createWompiTransaction(params: {
  amount: number;              // In COP centavos (e.g., 5000000 = COP 50,000)
  currency: 'COP';
  paymentMethod: 'PSE' | 'NEQUI' | 'CARD' | 'BANCOLOMBIA_QR';
  customerEmail: string;
  reference: string;           // Kitz invoice number
  redirectUrl: string;         // Return URL after PSE redirect
  customerData?: {
    phoneNumber?: string;      // Required for Nequi
    fullName?: string;
    legalId?: string;          // Cedula or NIT
    legalIdType?: 'CC' | 'NIT' | 'CE' | 'PP';
  };
}): Promise<{ transactionId: string; redirectUrl?: string; qrCode?: string }> {
  // Step 1: Create acceptance token
  const merchantResp = await fetch(`${WOMPI_BASE}/merchants/${wompiConfig.publicKey}`);
  const merchant = await merchantResp.json();
  const acceptanceToken = merchant.data.presigned_acceptance.acceptance_token;

  // Step 2: Tokenize payment source (varies by method)
  let paymentSourceId: string;

  if (params.paymentMethod === 'PSE') {
    const tokenResp = await fetch(`${WOMPI_BASE}/payment_sources`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${wompiConfig.privateKey}` },
      body: JSON.stringify({
        type: 'PSE',
        customer_email: params.customerEmail,
        payment_description: params.reference,
      }),
    });
    const token = await tokenResp.json();
    paymentSourceId = token.data.id;
  } else if (params.paymentMethod === 'NEQUI') {
    const tokenResp = await fetch(`${WOMPI_BASE}/payment_sources`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${wompiConfig.privateKey}` },
      body: JSON.stringify({
        type: 'NEQUI',
        phone_number: params.customerData?.phoneNumber,
      }),
    });
    const token = await tokenResp.json();
    paymentSourceId = token.data.id;
  } else {
    // CARD and BANCOLOMBIA_QR handled similarly
    paymentSourceId = ''; // Tokenize accordingly
  }

  // Step 3: Create transaction
  const txnResp = await fetch(`${WOMPI_BASE}/transactions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${wompiConfig.privateKey}` },
    body: JSON.stringify({
      amount_in_cents: params.amount,
      currency: params.currency,
      customer_email: params.customerEmail,
      payment_method: { type: params.paymentMethod, installments: 1 },
      payment_source_id: paymentSourceId,
      reference: params.reference,
      acceptance_token: acceptanceToken,
      redirect_url: params.redirectUrl,
    }),
  });

  const txn = await txnResp.json();
  return {
    transactionId: txn.data.id,
    redirectUrl: txn.data.redirect_url,   // For PSE
    qrCode: txn.data.qr_code,            // For Bancolombia QR
  };
}
```

**Webhook processing for Kitz:**

```typescript
// kitz-payments/src/index.ts -- new webhook endpoint for Wompi
// Add to existing webhook infrastructure alongside Yappy/BAC

import { createHmac } from 'node:crypto';

const WOMPI_EVENTS_SECRET = process.env.WOMPI_EVENTS_SECRET || '';

function verifyWompiSignature(body: Record<string, unknown>, signature: string): boolean {
  // Wompi signature = SHA256(transaction.id + transaction.status + transaction.amount_in_cents + timestamp + integrity_secret)
  const event = body as {
    data: { transaction: { id: string; status: string; amount_in_cents: number } };
    timestamp: number;
  };
  const txn = event.data.transaction;
  const concat = `${txn.id}${txn.status}${txn.amount_in_cents}${event.timestamp}${WOMPI_EVENTS_SECRET}`;
  const computed = createHmac('sha256', '').update(concat).digest('hex');
  return computed === signature;
}

// POST /webhooks/wompi
app.post('/webhooks/wompi', async (req: any, reply) => {
  const traceId = String(req.headers['x-trace-id'] || randomUUID());
  const signature = String(req.headers['x-event-checksum'] || '');

  if (WOMPI_EVENTS_SECRET) {
    if (!verifyWompiSignature(req.body, signature)) {
      app.log.warn({ traceId, provider: 'wompi' }, 'webhook.signature.failed');
      return reply.code(401).send({ ok: false, message: 'Wompi signature invalid', traceId });
    }
  }

  const event = req.body;
  const txn = event.data?.transaction;
  recordWebhook('wompi', event.event || 'unknown', txn?.merchant_id || 'unknown', traceId);

  // Map Wompi status to Kitz status
  const statusMap: Record<string, string> = {
    APPROVED: 'completed',
    DECLINED: 'failed',
    VOIDED: 'refunded',
    ERROR: 'failed',
    PENDING: 'pending',
  };

  app.log.info({ traceId, provider: 'wompi', wompiStatus: txn?.status }, 'webhook.processed');
  return { ok: true, provider: 'wompi', kitzStatus: statusMap[txn?.status] || 'pending', traceId };
});
```

**Implementation timeline:** NOW (Q1-Q2 2026) -- primary payment gateway for Colombia launch.

**Action items:**
1. Register Kitz as a Wompi merchant at https://dashboard.wompi.co/
2. Obtain sandbox credentials and build integration against sandbox.
3. Implement webhook receiver endpoint at `/webhooks/wompi`.
4. Add `'wompi'`, `'pse'`, `'nequi'`, `'daviplata'` to the provider enum in `paymentTools.ts`.
5. Build per-workspace Wompi credential management in workspace settings.
6. Test end-to-end with PSE, Nequi, and card payment methods.

---

### 2.5 Bold (POS for SMBs)

**What it is:**
Bold is Colombia's leading POS terminal provider for SMBs. It offers portable card readers (similar to Square/SumUp) with competitive transaction fees and next-day settlement. Bold also provides a merchant dashboard, payment links, and basic inventory management.

**Why Kitz needs it:**
Many Kitz Colombia workspace owners will use Bold as their in-person payment terminal. Kitz should be able to reconcile Bold transactions with its CRM and invoicing data, even if direct API integration is not initially available.

**Technical integration:**
- Bold does not currently offer a public developer API.
- Reconciliation via CSV export from Bold's merchant dashboard.
- Future: monitor Bold for API/developer program launch.

**Implementation timeline:** Future -- reconciliation via data import.

---

### 2.6 Additional Payment Providers

| Provider | Type | Integration Path | Priority |
|---|---|---|---|
| **PayU Colombia** | Payment gateway (LatAm HQ in Bogota) | REST API, supports PSE/cards/cash | Alternative to Wompi |
| **ePayco** | Colombia-native gateway | REST API, supports PSE/cards/Nequi/Daviplata | Alternative to Wompi |
| **Mercado Pago** | Payment gateway + wallet | REST API, SDK | Q4 2026 |
| **dLocal** | Cross-border payments | REST API, for international payouts | Future |

---

## 3. Banking & Interbank Infrastructure

### 3.1 ACH Colombia (Interbank Clearing)

**What it is:**
ACH Colombia S.A. is the private interbank clearing house that operates the country's electronic payment infrastructure. It processes interbank transfers, direct debits, and -- critically -- operates PSE (Pagos Seguros en Linea). ACH Colombia connects 30+ financial institutions and processes millions of transactions daily.

**Why Kitz needs it:**
ACH Colombia is the backbone of B2B payments. When a Kitz user sends an invoice to a business customer, that customer will likely pay via PSE (which runs on ACH Colombia's rails) or via direct bank transfer through the ACH network. Understanding ACH Colombia's role is essential for payment reconciliation and settlement timing.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Operator | ACH Colombia S.A. (private company, owned by Colombian banks) |
| Key product | PSE (online bank transfers) |
| Other products | ACH Direct (batch transfers), Transfiya (real-time P2P) |
| Direct integration | Not available to non-bank entities; access via PSE through gateway |
| Standards | ISO 8583 (legacy), moving to ISO 20022 |

---

### 3.2 Transfiya (Real-Time Interbank P2P)

**What it is:**
Transfiya is ACH Colombia's real-time interbank P2P transfer system. It allows instant transfers between accounts at different banks using only the recipient's phone number. It is Colombia's answer to PIX (Brazil) and operates 24/7 with sub-second settlement.

**Why Kitz needs it:**
Transfiya enables frictionless payment for Kitz invoices -- customers can pay by entering the workspace owner's phone number, regardless of which bank either party uses. As Transfiya expands to merchant payments, it could become a direct PSE alternative for smaller transactions.

**Implementation timeline:** Future -- monitor for merchant payment capabilities.

---

### 3.3 Banking Landscape

Colombia has approximately 25 commercial banks. The key banks for Kitz's SMB market:

| Bank | Relevance to Kitz | Key Products |
|---|---|---|
| **Bancolombia** | #1 priority -- largest bank, operates Nequi and Wompi | Nequi, Wompi, Bancolombia QR, business banking |
| **Davivienda** | #2 priority -- operates Daviplata, strong SMB presence | Daviplata, business accounts, merchant services |
| **Banco de Bogota** (Grupo Aval) | Largest corporate bank, strong B2B | Corporate banking, ACH, trade finance |
| **Banco de Occidente** (Grupo Aval) | Strong in western Colombia (Cali, Medellin) | Business accounts, ACH |
| **BBVA Colombia** | International bank with digital focus | Mobile banking, business accounts |
| **Nu Colombia** (Nubank) | Fast-growing digital bank, younger demographics | Digital savings, credit cards, no-fee accounts |
| **Banco Agrario** | Government agricultural bank | Rural banking, agricultural loans |
| **Scotiabank Colpatria** | Canadian-owned, strong in credit | Cards, consumer/business lending |

**Typical SMB banking needs in Colombia:**
- Cuenta de Ahorros or Cuenta Corriente empresarial (business savings/checking account)
- Datafono (POS terminal) from Bold, Bancolombia, or Datacredi
- Nequi Negocio or Daviplata Negocio for digital payment acceptance
- PSE merchant registration for online payments
- Credito de libre inversion or capital de trabajo (working capital loans)
- Certificados bancarios for tax and business purposes

**Action items:**
1. Prioritize Wompi/Bancolombia integration (covers PSE + Nequi + cards + QR).
2. Add Daviplata as second-priority digital wallet integration.
3. Build bank-agnostic reconciliation using standardized imports (CSV, Excel).
4. Monitor Nu Colombia for developer API/banking-as-a-service offerings.

---

## 4. Government & Regulatory Bodies

### 4.1 Superintendencia Financiera de Colombia (SFC)

**What it is:**
The SFC is Colombia's combined banking, securities, and insurance regulator. It supervises all financial institutions, payment systems, and fintech companies that handle customer funds. Colombia has been proactive in fintech regulation through its regulatory sandbox (Sandbox Regulatorio).

**Why Kitz needs it:**
If Kitz facilitates payments in Colombia, it must understand SFC requirements. Colombia's fintech regulation is more developed than Panama's, with specific licensing categories for payment platforms, electronic deposits, and SEDPE (Sociedades Especializadas en Depositos y Pagos Electronicos).

**Relevant regulations:**

| Regulation | Description | Impact on Kitz |
|---|---|---|
| Decreto 1357 de 2018 | Fintech regulatory framework (crowdfunding) | May apply if Kitz expands to financing |
| Decreto 1234 de 2020 | SEDPE licensing (electronic payment entities) | Determines if Kitz needs an SFC license |
| Circular Basica Juridica | KYC/AML/SARLAFT requirements | KYC obligations for payment facilitation |
| Ley 1735 de 2014 | Electronic deposits and payments law | Foundation for digital wallet regulation |

**Compliance requirements:**
- **SARLAFT (AML/CFT):** Colombia's AML framework. If Kitz processes payments, it must implement risk-based KYC, transaction monitoring, and suspicious activity reporting to UIAF (Unidad de Informacion y Analisis Financiero).
- **Data protection (Ley 1581 de 2012):** Colombian data protection law -- requires explicit consent for personal data processing, SIC (Superintendencia de Industria y Comercio) registration of databases.
- **Licensing assessment:** Determine whether Kitz operates as a technology provider (no license needed) or as a payment facilitator (requires SFC authorization or SEDPE license).

**Implementation timeline:** NOW -- legal assessment required before Colombia payment features launch.

---

### 4.2 DIAN (Direccion de Impuestos y Aduanas Nacionales)

**What it is:**
DIAN is Colombia's national tax and customs authority. It administers all federal taxes (IVA, income tax, withholding taxes), the electronic invoicing system (Facturacion Electronica), taxpayer registration (RUT), and customs operations. DIAN is the single most important government entity for Kitz's Colombia operations.

**Why Kitz needs it:**
Every invoice Kitz generates for a Colombian workspace must comply with DIAN requirements. Unlike Panama (where e-invoicing has thresholds), Colombia requires ALL taxpayers to issue electronic invoices. The DIAN's Facturacion Electronica system is mature, well-documented, and strictly enforced.

**Key DIAN systems:**

| System | URL | Purpose |
|---|---|---|
| DIAN Portal | https://www.dian.gov.co/ | Tax filing, RUT, compliance |
| Facturacion Electronica | https://catalogo-vpfe.dian.gov.co/ | E-invoice validation and catalog |
| MUISCA | https://muisca.dian.gov.co/ | Tax information system (filing, payments, certificates) |
| Habilitacion FE | Via DIAN portal | E-invoicing authorization for businesses |

**Compliance requirements:**
- All Kitz-generated invoices must include: NIT of issuer, NIT of receiver (B2B), sequential invoice number, IVA breakdown, withholding tax breakdown, CUFE.
- IVA filing is bimonthly (every two months) for most taxpayers, or every four months for Regimen Simple.
- ReteFuente declarations are monthly.
- RUT must be current and active.
- Documento Soporte is required when purchasing from non-invoicing sellers.

---

### 4.3 Camara de Comercio (Chamber of Commerce)

**What it is:**
Colombian businesses are registered and renewed annually through their local Camara de Comercio (Chamber of Commerce). There are 57 Camaras de Comercio across the country (Bogota, Medellin, Cali, Barranquilla being the largest). The Camara de Comercio issues the Certificado de Existencia y Representacion Legal (certificate of legal existence) and manages the Registro Mercantil (commercial registry).

**Why Kitz needs it:**
During workspace onboarding, Kitz needs to verify that the business is legally registered. The Certificado de Existencia y Representacion Legal from the Camara de Comercio is the authoritative proof. Additionally, Kitz should remind workspace owners of annual Matricula Mercantil renewal (due March 31 each year).

**Registration details:**

| Business type | Description | Typical Kitz user |
|---|---|---|
| Persona Natural | Sole proprietor, simplest form | Freelancers, solo SMBs |
| S.A.S. (Sociedad por Acciones Simplificada) | Simplified stock corporation -- most popular in Colombia | Small businesses with partners |
| S.A. (Sociedad Anonima) | Traditional corporation | Larger established businesses |
| S.R.L. (Sociedad de Responsabilidad Limitada) | Limited liability company | Less common, older businesses |

**Process:**
1. Register at local Camara de Comercio (in person or online via RUES.org.co).
2. Obtain NIT from DIAN (automatic via CAE -- Centro de Atencion Empresarial).
3. Register RUT at DIAN.
4. Obtain Matricula Mercantil (commercial registration number).
5. Renew Matricula Mercantil annually before March 31.

**Implementation timeline:** Q2 2026 -- workspace onboarding for Colombia.

---

### 4.4 NIT & RUT (Tax Identification)

**NIT (Numero de Identificacion Tributaria):**
The NIT is Colombia's tax identification number for businesses and individuals. It is the primary identifier used on all invoices, tax filings, and commercial transactions.

**NIT format:** `XXX.XXX.XXX-Y` where Y is the verification digit (digito de verificacion).

**RUT (Registro Unico Tributario):**
The RUT is not a separate number -- it is a comprehensive registration document that contains the NIT plus all tax obligations, economic activities (CIIU codes), responsibilities (IVA, ReteFuente, etc.), and contact information. Think of RUT as the "tax profile" and NIT as the "tax ID number."

**NIT Validation with Verification Digit:**

```typescript
/**
 * Validate a Colombian NIT (Numero de Identificacion Tributaria).
 *
 * NIT format: XXXXXXXXX-Y (9 digits + 1 verification digit)
 * The verification digit uses a modulo-11 algorithm with prime weights.
 */

// Prime-number weights for NIT verification digit calculation
const NIT_WEIGHTS = [71, 67, 59, 53, 47, 43, 41, 37, 29, 23, 17, 13, 7, 3];

function calculateNITVerificationDigit(nitBase: string): number {
  const digits = nitBase.replace(/\D/g, '');
  if (digits.length === 0 || digits.length > 14) return -1;

  // Right-align digits against weights (weights are applied from right to left)
  let sum = 0;
  const paddedDigits = digits.padStart(NIT_WEIGHTS.length, '0');

  for (let i = 0; i < NIT_WEIGHTS.length; i++) {
    sum += parseInt(paddedDigits[i], 10) * NIT_WEIGHTS[i];
  }

  const remainder = sum % 11;

  // Special cases per DIAN algorithm
  if (remainder === 0) return 0;
  if (remainder === 1) return 1;
  return 11 - remainder;
}

function validateNIT(nit: string): {
  valid: boolean;
  normalized: string;
  base: string;
  verificationDigit: number;
  error?: string;
} {
  // Strip formatting: dots, dashes, spaces
  const cleaned = nit.replace(/[\s.\-]/g, '');

  // Expect format: base digits + verification digit
  // NIT can be 6-15 characters total (variable length base + 1 DV)
  const match = cleaned.match(/^(\d{5,14})(\d)$/);
  if (!match) {
    return {
      valid: false,
      normalized: cleaned,
      base: '',
      verificationDigit: -1,
      error: 'NIT must be 6-15 digits (base + verification digit)',
    };
  }

  const [, base, dvStr] = match;
  const providedDV = parseInt(dvStr, 10);
  const computedDV = calculateNITVerificationDigit(base);

  if (providedDV !== computedDV) {
    return {
      valid: false,
      normalized: `${base}-${providedDV}`,
      base,
      verificationDigit: providedDV,
      error: `Invalid verification digit: expected ${computedDV}, got ${providedDV}`,
    };
  }

  // Format with dots and dash: XXX.XXX.XXX-Y
  const formatted = base.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + `-${providedDV}`;

  return {
    valid: true,
    normalized: formatted,
    base,
    verificationDigit: providedDV,
  };
}

// Regex for quick format check (before full validation)
const NIT_QUICK_REGEX = /^\d{6,15}$/;  // Cleaned format
const NIT_FORMATTED_REGEX = /^\d{1,3}(\.\d{3})*-\d$/;  // Display format: XXX.XXX.XXX-Y

// Cedula de Ciudadania validation (individual tax ID)
const CEDULA_REGEX = /^\d{6,10}$/;

// Cedula de Extranjeria validation (foreign resident ID)
const CE_REGEX = /^\d{6,7}$/;
```

**Usage in Kitz workspace onboarding:**

```typescript
// Workspace onboarding for Colombia
interface ColombiaWorkspaceProfile {
  country: 'CO';
  nit: string;                    // Validated NIT with verification digit
  rutDocument?: string;            // URL to uploaded RUT PDF
  businessName: string;            // Razon social from RUT
  commercialName?: string;         // Nombre comercial (if different)
  economicActivities: string[];    // CIIU codes from RUT
  taxResponsibilities: string[];   // e.g., ['O-13', 'O-15', 'O-23'] (IVA, ReteFuente, ReteICA)
  taxRegime: 'ordinario' | 'simple'; // Regimen Ordinario vs Regimen Simple
  matriculaMercantil?: string;     // Commercial registration number
  camaraDeComercioCert?: string;   // URL to uploaded certificate
  estrato?: 1 | 2 | 3 | 4 | 5 | 6; // Socioeconomic stratum of business location
  municipio: string;               // Municipality (for ICA tax rate lookup)
  departamento: string;            // Department (state equivalent)
}
```

---

## 5. Invoice Compliance

### 5.1 IVA (Impuesto sobre el Valor Agregado)

IVA is Colombia's value-added tax. It is structurally similar to Panama's ITBMS but with different rates and more categories.

**Tax rates:**

| Rate | Application |
|---|---|
| **19%** | Standard rate -- most goods and services |
| **5%** | Reduced rate -- certain food items, hygiene products, agricultural inputs, some medical devices, bicycles, electric vehicles |
| **0%** | Zero-rated -- exports, basic food staples (rice, eggs, milk, bread), public transportation, agricultural inputs (specific list) |
| **Exempt** | Financial services, medical services, education, residential rent under certain thresholds, books |
| **Excluido** | Not part of IVA system -- no IVA charged, no IVA credit (different from 0% zero-rated) |

**Critical distinction: Exento vs. Excluido:**
- **Exento (0%):** IVA is charged at 0%, but the seller CAN claim IVA credits on inputs. Used for exports and specific goods.
- **Excluido:** No IVA applies at all, and the seller CANNOT claim IVA credits on inputs. Used for basic necessities.

This distinction affects Kitz's tax calculation engine:

```typescript
// IVA categories for Colombia
type IVACategory = 'standard' | 'reduced' | 'zero_rated' | 'exempt' | 'excluded';

const IVA_RATES: Record<IVACategory, number> = {
  standard: 0.19,
  reduced: 0.05,
  zero_rated: 0.00,
  exempt: 0.00,     // Generates IVA credit
  excluded: 0.00,   // Does NOT generate IVA credit
};

interface ColombiaLineItem {
  description: string;
  quantity: number;
  unitPrice: number;          // In COP (no decimals for consumer display)
  ivaCategory: IVACategory;
  ivaRate: number;            // 0.19, 0.05, or 0.00
  // Withholding flags (populated by tax engine based on buyer/seller profile)
  reteFuenteApplies: boolean;
  reteFuenteRate: number;
  reteIVAApplies: boolean;
  reteIVARate: number;
  reteICAApplies: boolean;
  reteICARate: number;
}
```

---

### 5.2 Withholding Taxes (Retenciones) -- CRITICAL

**This is the single most complex aspect of Colombian tax compliance for Kitz.** Unlike Panama, where tax is simply added to the invoice total, Colombian B2B transactions require the BUYER to withhold taxes from the payment amount and remit them directly to DIAN. The seller receives less than the invoice total, and both parties must track these withholdings for their tax filings.

**Three withholding taxes:**

```
+------------------------------------------------------------------+
|                    COLOMBIAN INVOICE TOTAL                        |
|                                                                  |
|  Subtotal (before IVA)              COP 10,000,000               |
|  + IVA (19%)                        COP  1,900,000               |
|  = Total before withholdings        COP 11,900,000               |
|                                                                  |
|  WITHHOLDINGS (deducted by buyer):                               |
|  - ReteFuente (2.5% of subtotal)   -COP    250,000               |
|  - ReteIVA (15% of IVA amount)     -COP    285,000               |
|  - ReteICA (varies by municipio)   -COP     69,300               |
|                                                                  |
|  = NET AMOUNT PAID TO SELLER        COP 11,295,700               |
+------------------------------------------------------------------+
```

#### 5.2.1 ReteFuente (Retencion en la Fuente)

**What it is:**
Withholding income tax. The buyer withholds a percentage of the payment and remits it to DIAN on behalf of the seller as an advance on the seller's income tax.

**Key rules:**
- Applies when the buyer is a "Gran Contribuyente" (large taxpayer) or "Agente de Retencion" (withholding agent designated by DIAN).
- Rate depends on the type of service/product (called "concepto de retencion").
- Minimum thresholds (bases minimas) apply -- below the threshold, no withholding.

**Common ReteFuente rates (2026, based on UVT):**

| Concepto | Rate | Base minima (UVT) | Base minima (COP approx.) |
|---|---|---|---|
| Honorarios (professional fees) | 10% or 11% | 0 UVT | COP 0 (always applies) |
| Servicios (general services) | 4% or 6% | 4 UVT | ~COP 188,000 |
| Compras (purchases of goods) | 2.5% | 27 UVT | ~COP 1,269,000 |
| Arrendamiento (rent) | 3.5% | 27 UVT | ~COP 1,269,000 |
| Contratos de obra (construction) | 2% | 0 UVT | COP 0 |
| Transporte de carga (freight) | 1% | 4 UVT | ~COP 188,000 |

*Note: UVT (Unidad de Valor Tributario) is Colombia's tax reference unit, adjusted annually. For 2026, estimated at ~COP 47,065.*

#### 5.2.2 ReteIVA (Retencion de IVA)

**What it is:**
Withholding on the IVA portion of the invoice. The buyer withholds a percentage of the IVA amount and remits it to DIAN.

**Key rules:**
- Standard rate: 15% of the IVA amount.
- Only applies when the buyer is a Gran Contribuyente or designated Agente de Retencion.
- Base minima: 4 UVT (~COP 188,000 in IVA amount).

#### 5.2.3 ReteICA (Retencion de Industria y Comercio)

**What it is:**
Withholding for the municipal industry and commerce tax (ICA). Rates vary by municipality (each of Colombia's 1,100+ municipalities sets its own ICA rates) and by economic activity.

**Key rules:**
- Rates range from 2 per mil (0.2%) to 14 per mil (1.4%) depending on municipality and activity.
- Bogota rates range from 4.14 to 13.8 per mil.
- Medellin rates range from 2 to 10 per mil.
- Cali rates range from 3 to 10 per mil.
- Base minima: 27 UVT (~COP 1,269,000) in most municipalities.

**Withholding tax calculation engine for Kitz:**

```typescript
/**
 * Colombian Withholding Tax Calculator
 *
 * This is the core tax computation engine for Colombia.
 * Each B2B invoice must compute three potential withholdings.
 */

// UVT value for 2026 (updated annually by DIAN in December)
const UVT_2026 = 47065; // COP -- must be updated each year

interface WithholdingProfile {
  isGranContribuyente: boolean;     // DIAN designation
  isAgenteRetencion: boolean;       // DIAN designation
  isRegimenSimple: boolean;         // Regimen Simple businesses do NOT apply ReteFuente
  isAutoRetenedor: boolean;         // Self-withholding entity (IVA)
}

interface ReteFuenteConcepto {
  code: string;
  description: string;
  rate: number;                     // Percentage (e.g., 0.025 for 2.5%)
  baseMinUVT: number;               // Minimum threshold in UVT
}

// Common ReteFuente conceptos
const RETEFUENTE_CONCEPTOS: ReteFuenteConcepto[] = [
  { code: '2301', description: 'Honorarios - declarante', rate: 0.10, baseMinUVT: 0 },
  { code: '2302', description: 'Honorarios - no declarante', rate: 0.11, baseMinUVT: 0 },
  { code: '2303', description: 'Servicios - declarante', rate: 0.04, baseMinUVT: 4 },
  { code: '2304', description: 'Servicios - no declarante', rate: 0.06, baseMinUVT: 4 },
  { code: '2305', description: 'Compras generales', rate: 0.025, baseMinUVT: 27 },
  { code: '2306', description: 'Arrendamiento inmuebles', rate: 0.035, baseMinUVT: 27 },
  { code: '2307', description: 'Contratos de obra', rate: 0.02, baseMinUVT: 0 },
  { code: '2308', description: 'Transporte de carga', rate: 0.01, baseMinUVT: 4 },
  { code: '2309', description: 'Compras combustible', rate: 0.001, baseMinUVT: 0 },
];

// ICA rates by major municipality (per mil -- divide by 1000 for rate)
const ICA_RATES: Record<string, Record<string, number>> = {
  'bogota': {
    'comercio': 0.00414,        // 4.14 per mil
    'servicios': 0.00966,       // 9.66 per mil
    'industrial': 0.00800,      // 8.0 per mil
    'financiero': 0.01380,      // 13.8 per mil
    'default': 0.00966,
  },
  'medellin': {
    'comercio': 0.00400,        // 4.0 per mil
    'servicios': 0.00700,       // 7.0 per mil
    'industrial': 0.00500,      // 5.0 per mil
    'default': 0.00700,
  },
  'cali': {
    'comercio': 0.00500,        // 5.0 per mil
    'servicios': 0.00800,       // 8.0 per mil
    'industrial': 0.00600,      // 6.0 per mil
    'default': 0.00800,
  },
  'barranquilla': {
    'comercio': 0.00500,
    'servicios': 0.00700,
    'industrial': 0.00500,
    'default': 0.00700,
  },
};

interface WithholdingCalculation {
  subtotal: number;
  ivaAmount: number;
  reteFuente: { applies: boolean; rate: number; base: number; amount: number; concepto: string };
  reteIVA: { applies: boolean; rate: number; base: number; amount: number };
  reteICA: { applies: boolean; rate: number; base: number; amount: number; municipio: string };
  totalWithholdings: number;
  netPayable: number;       // Total invoice - total withholdings
}

function calculateWithholdings(params: {
  subtotal: number;          // COP, before IVA
  ivaRate: number;           // 0.19 standard
  buyerProfile: WithholdingProfile;
  sellerProfile: WithholdingProfile;
  reteFuenteConcepto: string; // Concepto code (e.g., '2305')
  municipio: string;          // Municipio of the transaction
  economicActivity: string;   // For ICA rate lookup
}): WithholdingCalculation {
  const { subtotal, ivaRate, buyerProfile, sellerProfile } = params;
  const ivaAmount = Math.round(subtotal * ivaRate);
  const invoiceTotal = subtotal + ivaAmount;

  // ── ReteFuente ──
  let reteFuente = { applies: false, rate: 0, base: 0, amount: 0, concepto: '' };

  // ReteFuente does NOT apply if seller is Regimen Simple
  if (!sellerProfile.isRegimenSimple) {
    const concepto = RETEFUENTE_CONCEPTOS.find(c => c.code === params.reteFuenteConcepto);
    if (concepto && (buyerProfile.isGranContribuyente || buyerProfile.isAgenteRetencion)) {
      const baseMinCOP = concepto.baseMinUVT * UVT_2026;
      if (subtotal >= baseMinCOP) {
        const amount = Math.round(subtotal * concepto.rate);
        reteFuente = {
          applies: true,
          rate: concepto.rate,
          base: subtotal,
          amount,
          concepto: `${concepto.code} - ${concepto.description}`,
        };
      }
    }
  }

  // ── ReteIVA ──
  let reteIVA = { applies: false, rate: 0, base: 0, amount: 0 };

  if (buyerProfile.isGranContribuyente || buyerProfile.isAgenteRetencion) {
    const baseMinCOP = 4 * UVT_2026; // 4 UVT threshold on the IVA amount
    if (ivaAmount >= baseMinCOP) {
      const reteIVARate = 0.15; // 15% of IVA
      const amount = Math.round(ivaAmount * reteIVARate);
      reteIVA = { applies: true, rate: reteIVARate, base: ivaAmount, amount };
    }
  }

  // ── ReteICA ──
  let reteICA = { applies: false, rate: 0, base: 0, amount: 0, municipio: '' };

  if (buyerProfile.isGranContribuyente || buyerProfile.isAgenteRetencion) {
    const baseMinCOP = 27 * UVT_2026; // 27 UVT threshold
    if (subtotal >= baseMinCOP) {
      const municipioRates = ICA_RATES[params.municipio.toLowerCase()];
      if (municipioRates) {
        const rate = municipioRates[params.economicActivity.toLowerCase()] || municipioRates['default'] || 0;
        const amount = Math.round(subtotal * rate);
        reteICA = {
          applies: true,
          rate,
          base: subtotal,
          amount,
          municipio: params.municipio,
        };
      }
    }
  }

  const totalWithholdings = reteFuente.amount + reteIVA.amount + reteICA.amount;
  const netPayable = invoiceTotal - totalWithholdings;

  return {
    subtotal,
    ivaAmount,
    reteFuente,
    reteIVA,
    reteICA,
    totalWithholdings,
    netPayable,
  };
}
```

**Example calculation:**

```typescript
// Example: Kitz workspace owner (services company in Bogota) invoices a Gran Contribuyente
const result = calculateWithholdings({
  subtotal: 10_000_000,                    // COP 10,000,000
  ivaRate: 0.19,                           // 19% standard
  buyerProfile: {
    isGranContribuyente: true,
    isAgenteRetencion: true,
    isRegimenSimple: false,
    isAutoRetenedor: false,
  },
  sellerProfile: {
    isGranContribuyente: false,
    isAgenteRetencion: false,
    isRegimenSimple: false,
    isAutoRetenedor: false,
  },
  reteFuenteConcepto: '2303',              // Servicios - declarante (4%)
  municipio: 'Bogota',
  economicActivity: 'servicios',
});

// Result:
// subtotal:          COP 10,000,000
// ivaAmount:         COP  1,900,000
// reteFuente:        COP    400,000  (4% of 10,000,000)
// reteIVA:           COP    285,000  (15% of 1,900,000)
// reteICA:           COP     96,600  (9.66 per mil of 10,000,000)
// totalWithholdings: COP    781,600
// netPayable:        COP 11,118,400  (invoice total 11,900,000 - withholdings 781,600)
```

---

### 5.3 E-Invoice (Facturacion Electronica) Schema

**Colombia's e-invoicing uses XML-UBL 2.1** -- the universal standard adopted by many countries (unlike Panama's proprietary DGI schema). This means Kitz can leverage existing UBL libraries for XML generation and validation.

**Document types in the e-invoice system:**

| DIAN Code | Document Type | Kitz Mapping |
|---|---|---|
| 01 | Factura Electronica de Venta | Standard invoice (`invoice_create`) |
| 02 | Factura de Exportacion | Export invoice (future) |
| 03 | Documento Soporte | Purchase from non-invoicing seller |
| 04 | Factura de Contingencia | Offline/contingency invoice |
| 91 | Nota Credito | Credit note (returns/adjustments) |
| 92 | Nota Debito | Debit note |
| - | Nomina Electronica | Electronic payroll (separate system) |

**Mandatory XML-UBL 2.1 fields (Factura Electronica de Venta):**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"
         xmlns:sts="dian:gov:co:facturaelectronica:Structures-2-1"
         xmlns:ds="http://www.w3.org/2000/09/xmldsig#">

  <!-- DIAN Extensions -->
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent>
        <sts:DianExtensions>
          <!-- Software provider information -->
          <sts:InvoiceSource>
            <cbc:IdentificationCode listAgencyID="6" listAgencyName="United Nations Economic Commission for Europe"
              listSchemeURI="urn:oasis:names:specification:ubl:codelist:gc:CountryIdentificationCode-2.1">CO</cbc:IdentificationCode>
          </sts:InvoiceSource>
          <sts:SoftwareProvider>
            <sts:ProviderID schemeAgencyID="195" schemeAgencyName="CO, DIAN"
              schemeID="9" schemeName="31">KITZ_NIT_HERE</sts:ProviderID>
            <sts:SoftwareID schemeAgencyID="195" schemeAgencyName="CO, DIAN">KITZ_SOFTWARE_ID</sts:SoftwareID>
          </sts:SoftwareProvider>
          <sts:SoftwareSecurityCode schemeAgencyID="195" schemeAgencyName="CO, DIAN">
            <!-- SHA-384 hash of SoftwareID + PIN + InvoiceNumber -->
            {{softwareSecurityCode}}
          </sts:SoftwareSecurityCode>
          <sts:AuthorizationProvider>
            <sts:AuthorizationProviderID schemeAgencyID="195" schemeAgencyName="CO, DIAN"
              schemeID="4" schemeName="31">800197268</sts:AuthorizationProviderID>
          </sts:AuthorizationProvider>
          <sts:QRCode>{{qrCodeData}}</sts:QRCode>
        </sts:DianExtensions>
      </ext:ExtensionContent>
    </ext:UBLExtension>
    <ext:UBLExtension>
      <ext:ExtensionContent>
        <!-- XML Digital Signature (XAdES) goes here -->
        <ds:Signature Id="xmldsig-kitz">
          <!-- ... signature content ... -->
        </ds:Signature>
      </ext:ExtensionContent>
    </ext:UBLExtension>
  </ext:UBLExtensions>

  <!-- Invoice Header -->
  <cbc:UBLVersionID>UBL 2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>10</cbc:CustomizationID>        <!-- DIAN operation type -->
  <cbc:ProfileID>DIAN 2.1</cbc:ProfileID>
  <cbc:ProfileExecutionID>2</cbc:ProfileExecutionID>    <!-- 1=Production, 2=Test -->
  <cbc:ID>{{invoiceNumber}}</cbc:ID>                     <!-- SETP1234567890 -->
  <cbc:UUID schemeID="2" schemeName="CUFE-SHA384">
    {{cufe}}                                              <!-- CUFE hash -->
  </cbc:UUID>
  <cbc:IssueDate>{{issueDate}}</cbc:IssueDate>          <!-- YYYY-MM-DD -->
  <cbc:IssueTime>{{issueTime}}</cbc:IssueTime>          <!-- HH:MM:SS-05:00 -->
  <cbc:InvoiceTypeCode>01</cbc:InvoiceTypeCode>         <!-- 01=Factura de Venta -->
  <cbc:Note>{{notes}}</cbc:Note>
  <cbc:DocumentCurrencyCode>COP</cbc:DocumentCurrencyCode>
  <cbc:LineCountNumeric>{{lineCount}}</cbc:LineCountNumeric>

  <!-- Invoice Period -->
  <cac:InvoicePeriod>
    <cbc:StartDate>{{periodStart}}</cbc:StartDate>
    <cbc:EndDate>{{periodEnd}}</cbc:EndDate>
  </cac:InvoicePeriod>

  <!-- Supplier (Seller / Emisor) -->
  <cac:AccountingSupplierParty>
    <cbc:AdditionalAccountID>1</cbc:AdditionalAccountID>  <!-- 1=Persona Juridica, 2=Persona Natural -->
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>{{sellerCommercialName}}</cbc:Name>
      </cac:PartyName>
      <cac:PhysicalLocation>
        <cac:Address>
          <cbc:ID>{{municipioCode}}</cbc:ID>               <!-- DANE municipality code -->
          <cbc:CityName>{{city}}</cbc:CityName>
          <cbc:CountrySubentity>{{department}}</cbc:CountrySubentity>
          <cbc:CountrySubentityCode>{{departmentCode}}</cbc:CountrySubentityCode>
          <cac:AddressLine>
            <cbc:Line>{{sellerAddress}}</cbc:Line>          <!-- Carrera/Calle format -->
          </cac:AddressLine>
          <cac:Country>
            <cbc:IdentificationCode>CO</cbc:IdentificationCode>
            <cbc:Name languageID="es">Colombia</cbc:Name>
          </cac:Country>
        </cac:Address>
      </cac:PhysicalLocation>
      <cac:PartyTaxScheme>
        <cbc:RegistrationName>{{sellerLegalName}}</cbc:RegistrationName>
        <cbc:CompanyID schemeAgencyID="195" schemeAgencyName="CO, DIAN"
          schemeID="{{sellerDV}}" schemeName="31">{{sellerNIT}}</cbc:CompanyID>
        <cbc:TaxLevelCode listName="48">{{taxResponsibilities}}</cbc:TaxLevelCode>
        <cac:RegistrationAddress>
          <!-- Same as PhysicalLocation -->
        </cac:RegistrationAddress>
        <cac:TaxScheme>
          <cbc:ID>01</cbc:ID>           <!-- 01=IVA -->
          <cbc:Name>IVA</cbc:Name>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>{{sellerLegalName}}</cbc:RegistrationName>
        <cbc:CompanyID schemeAgencyID="195" schemeAgencyName="CO, DIAN"
          schemeID="{{sellerDV}}" schemeName="31">{{sellerNIT}}</cbc:CompanyID>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>

  <!-- Customer (Buyer / Receptor) -->
  <cac:AccountingCustomerParty>
    <cbc:AdditionalAccountID>{{buyerPersonType}}</cbc:AdditionalAccountID>
    <cac:Party>
      <!-- Similar structure to SupplierParty -->
      <cac:PartyTaxScheme>
        <cbc:RegistrationName>{{buyerLegalName}}</cbc:RegistrationName>
        <cbc:CompanyID schemeAgencyID="195" schemeAgencyName="CO, DIAN"
          schemeID="{{buyerDV}}" schemeName="31">{{buyerNIT}}</cbc:CompanyID>
        <cbc:TaxLevelCode listName="48">{{buyerTaxResponsibilities}}</cbc:TaxLevelCode>
        <cac:TaxScheme>
          <cbc:ID>01</cbc:ID>
          <cbc:Name>IVA</cbc:Name>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingCustomerParty>

  <!-- Payment Means -->
  <cac:PaymentMeans>
    <cbc:ID>1</cbc:ID>                <!-- 1=Contado (cash), 2=Credito -->
    <cbc:PaymentMeansCode>10</cbc:PaymentMeansCode>  <!-- 10=Cash, ZZZ=Other -->
    <cbc:PaymentDueDate>{{dueDate}}</cbc:PaymentDueDate>
  </cac:PaymentMeans>

  <!-- Withholding Taxes -->
  <cac:WithholdingTaxTotal>
    <cbc:TaxAmount currencyID="COP">{{reteFuenteAmount}}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="COP">{{reteFuenteBase}}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="COP">{{reteFuenteAmount}}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:Percent>{{reteFuentePercent}}</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>06</cbc:ID>       <!-- 06=ReteFuente -->
          <cbc:Name>ReteRenta</cbc:Name>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:WithholdingTaxTotal>

  <cac:WithholdingTaxTotal>
    <cbc:TaxAmount currencyID="COP">{{reteIVAAmount}}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="COP">{{reteIVABase}}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="COP">{{reteIVAAmount}}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:Percent>{{reteIVAPercent}}</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>05</cbc:ID>       <!-- 05=ReteIVA -->
          <cbc:Name>ReteIVA</cbc:Name>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:WithholdingTaxTotal>

  <cac:WithholdingTaxTotal>
    <cbc:TaxAmount currencyID="COP">{{reteICAAmount}}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="COP">{{reteICABase}}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="COP">{{reteICAAmount}}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:Percent>{{reteICAPercent}}</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>07</cbc:ID>       <!-- 07=ReteICA -->
          <cbc:Name>ReteICA</cbc:Name>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:WithholdingTaxTotal>

  <!-- Line Items -->
  <cac:InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cbc:InvoicedQuantity unitCode="EA">{{quantity}}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="COP">{{lineTotal}}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Description>{{description}}</cbc:Description>
      <cac:StandardItemIdentification>
        <cbc:ID schemeAgencyID="195" schemeID="001" schemeName="EAN13">{{productCode}}</cbc:ID>
      </cac:StandardItemIdentification>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="COP">{{unitPrice}}</cbc:PriceAmount>
      <cbc:BaseQuantity unitCode="EA">1</cbc:BaseQuantity>
    </cac:Price>
  </cac:InvoiceLine>

  <!-- Totals -->
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="COP">{{subtotal}}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="COP">{{subtotal}}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="COP">{{totalWithIVA}}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="COP">{{totalWithIVA}}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>

</Invoice>
```

---

### 5.4 CUFE (Codigo Unico de Factura Electronica) Generation

**CUFE is the unique hash that identifies each Colombian electronic invoice.** Unlike Panama's CUFE (generated by the PAC), Colombia's CUFE is generated by the issuer's software using a SHA-384 hash of specific invoice fields.

**CUFE computation algorithm:**

```typescript
import { createHash } from 'node:crypto';

interface CUFEInputs {
  invoiceNumber: string;         // e.g., 'SETP990000001'
  issueDate: string;             // 'YYYY-MM-DD'
  issueTime: string;             // 'HH:MM:SS-05:00'
  invoiceTotal: number;          // Total before withholdings (COP)
  taxSchemeCode01: string;       // '01' for IVA
  ivaAmount: number;             // IVA total (COP)
  taxSchemeCode04: string;       // '04' for ICA
  icaAmount: number;             // ICA amount (COP, or 0.00)
  taxSchemeCode03: string;       // '03' for Consumo
  consumoAmount: number;         // Consumption tax (COP, or 0.00)
  payableAmount: number;         // Total payable (COP)
  issuerNIT: string;             // Seller NIT
  receiverNIT: string;           // Buyer NIT (or CC for person natural)
  softwarePIN: string;           // DIAN-assigned PIN for the software
  profileExecutionID: string;    // '1' for production, '2' for test
}

function generateCUFE(inputs: CUFEInputs): string {
  // Concatenation order specified by DIAN Resolution 000012/2021
  const concat = [
    inputs.invoiceNumber,
    inputs.issueDate,
    inputs.issueTime,
    formatAmount(inputs.invoiceTotal),    // e.g., '11900000.00'
    inputs.taxSchemeCode01,                // '01'
    formatAmount(inputs.ivaAmount),        // e.g., '1900000.00'
    inputs.taxSchemeCode04,                // '04'
    formatAmount(inputs.icaAmount),        // e.g., '0.00'
    inputs.taxSchemeCode03,                // '03'
    formatAmount(inputs.consumoAmount),    // e.g., '0.00'
    formatAmount(inputs.payableAmount),    // e.g., '11900000.00'
    inputs.issuerNIT,
    inputs.receiverNIT,
    inputs.softwarePIN,
    inputs.profileExecutionID,
  ].join('');

  // SHA-384 hash (Colombia uses SHA-384, different from Panama)
  return createHash('sha384').update(concat, 'utf8').digest('hex');
}

function formatAmount(amount: number): string {
  // DIAN requires exactly 2 decimal places
  return amount.toFixed(2);
}

// Example usage:
const cufe = generateCUFE({
  invoiceNumber: 'SETP990000001',
  issueDate: '2026-02-24',
  issueTime: '10:30:00-05:00',
  invoiceTotal: 11900000,
  taxSchemeCode01: '01',
  ivaAmount: 1900000,
  taxSchemeCode04: '04',
  icaAmount: 0,
  taxSchemeCode03: '03',
  consumoAmount: 0,
  payableAmount: 11900000,
  issuerNIT: '900123456',
  receiverNIT: '800987654',
  softwarePIN: '12345',
  profileExecutionID: '2',  // Test
});

// cufe = 'a1b2c3d4e5f6...' (96 hex characters = 384 bits)
```

**Key differences from Panama's CUFE:**
- Colombia: SHA-384 hash, generated by issuer's software, included in the XML before submission.
- Panama: Generated by the PAC after validation, assigned to the invoice externally.
- Colombia's CUFE includes the software PIN, binding the invoice to the authorized software.

---

### 5.5 Invoice Numbering and Sequencing

**DIAN requirements:**
- Businesses must request a "Resolucion de Numeracion" from DIAN that authorizes a range of invoice numbers.
- Each resolution specifies: prefix (alphanumeric), starting number, ending number, and validity period.
- Format: `{prefix}{sequential_number}` (e.g., `SETP990000001` to `SETP990005000`).
- Invoice numbers must be sequential within the authorized range.
- When the range is exhausted or the resolution expires, a new resolution must be requested.
- Separate resolutions are needed for: invoices, credit notes, debit notes, and contingency invoices.

**Kitz implementation requirements:**

```typescript
interface DIANNumberingResolution {
  resolutionNumber: string;       // DIAN resolution identifier
  resolutionDate: string;         // Date resolution was granted
  prefix: string;                 // e.g., 'SETP'
  rangeStart: number;             // e.g., 990000001
  rangeEnd: number;               // e.g., 990005000
  validFrom: string;              // Resolution validity start
  validTo: string;                // Resolution validity end
  technicalKey: string;           // DIAN technical key for CUFE
}

interface NumberingSequence {
  workspaceId: string;
  resolution: DIANNumberingResolution;
  currentNumber: number;          // Last used number
  documentType: 'invoice' | 'credit_note' | 'debit_note';
}

function getNextInvoiceNumber(sequence: NumberingSequence): {
  number: string;
  remaining: number;
  warning?: string;
} {
  const next = sequence.currentNumber + 1;

  if (next > sequence.resolution.rangeEnd) {
    return {
      number: '',
      remaining: 0,
      warning: 'CRITICAL: Invoice numbering range exhausted. Request new resolution from DIAN immediately.',
    };
  }

  // Check resolution expiry
  const now = new Date();
  const validTo = new Date(sequence.resolution.validTo);
  if (now > validTo) {
    return {
      number: '',
      remaining: sequence.resolution.rangeEnd - next,
      warning: 'CRITICAL: DIAN numbering resolution has expired. Request renewal immediately.',
    };
  }

  const remaining = sequence.resolution.rangeEnd - next;
  const formatted = `${sequence.resolution.prefix}${String(next).padStart(10, '0')}`;

  // Warn when 80% of range is used
  const totalRange = sequence.resolution.rangeEnd - sequence.resolution.rangeStart;
  const warning = remaining < totalRange * 0.2
    ? `WARNING: Only ${remaining} invoice numbers remaining. Request new resolution from DIAN.`
    : undefined;

  return { number: formatted, remaining, warning };
}
```

---

### 5.6 Documento Soporte

**What it is:**
The Documento Soporte is a mandatory electronic document that a business must issue when purchasing goods or services from a seller who is NOT required to issue electronic invoices (e.g., Regimen Simple businesses under certain thresholds, or unregistered sellers). The buyer creates this document to support the expense deduction in their tax filing.

**Why Kitz needs it:**
Many Colombian SMBs purchase from informal suppliers, farmers, or micro-businesses that do not issue electronic invoices. Without a Documento Soporte, the buyer cannot deduct these expenses. Kitz should allow workspace owners to generate Documento Soporte for such purchases.

**Implementation timeline:** Q3 2026 -- after core invoice functionality.

---

### 5.7 Nomina Electronica (Electronic Payroll)

**What it is:**
Since 2021, Colombian employers must report payroll information electronically to DIAN via the Nomina Electronica system. This includes salary payments, social security contributions, benefits, and deductions for each employee. The format is XML-UBL based, similar to e-invoicing.

**Why Kitz needs it:**
For Kitz workspace owners who have employees, payroll compliance is a significant pain point. While full payroll processing is outside Kitz's current scope, the platform should at minimum be able to track payroll expenses and integrate with dedicated payroll providers.

**Implementation timeline:** Future -- partnership with payroll provider (Nominapp, Siigo Nomina).

---

## 6. Payment Flow Architecture

### 6.1 End-to-End Payment Flow (Colombia)

```
                        COLOMBIA PAYMENT FLOW
                        =====================

  Kitz Workspace Owner                          Customer
        |                                          |
        |  Creates invoice (invoice_create)        |
        |  with IVA + withholding tax breakdown    |
        |                                          |
        v                                          |
  +---------------+                                |
  | Invoice       |                                |
  | Generated     |-- XML-UBL 2.1 via -----------> | DIAN validates
  | (with CUFE)   |   Proveedor Tecnologico        | + assigns acceptance
  +---------------+                                |
        |                                          |
        |  Sends via WhatsApp/Email                |
        |  (invoice_send)                          |
        v                                          v
  +---------------+                          +---------------+
  | Payment       | <-- Customer chooses     | Customer      |
  | Options       |     payment method -->   | Selects       |
  | (via Wompi)   |                          | Method        |
  +---------------+                          +---------------+
        |                                          |
        +---------- PSE (bank transfer) ---+       |
        |                                  |       |
        +---------- Nequi QR/push --------+       |
        |                                  |       |
        +---------- Credit/Debit Card ----+       |
        |                                  |       |
        +---------- Bancolombia QR -------+       |
        |                                  |       |
        +---------- Daviplata -------------+       |
        |                                  v       |
        |                           +---------------+
        |                           | Wompi         |
        |                           | Processes     |
        |                           | Payment       |
        |                           +---------------+
        |                                  |        |
        v                                  v        |
  +---------------+               +---------------+ |
  | Wompi Webhook | <-- webhook   | Payment       | |
  | Received      |   callback    | Confirmed     | |
  +---------------+               +---------------+ |
        |                                           |
        v                                           |
  +-------------------------------+                 |
  | payments_processWebhook       |                 |
  | (provider: 'wompi')           |                 |
  | paymentTools.ts               |                 |
  +-------------------------------+                 |
        |                                           |
        +-- Invoice status -> 'paid'                |
        +-- CRM contact -> payment recorded         |
        +-- WhatsApp receipt sent ----------------->|
        +-- Revenue dashboard updated               |
        +-- IVA ledger updated                      |
        +-- Withholding tax ledger updated          |
```

### 6.2 Withholding Tax Flow (B2B Invoices)

```
  WITHHOLDING TAX FLOW (unique to Colombia)
  ==========================================

  Seller (Kitz User)                    Buyer (Gran Contribuyente)
        |                                       |
        | Issues invoice:                       |
        |   Subtotal:  COP 10,000,000           |
        |   + IVA 19%: COP  1,900,000           |
        |   = Total:   COP 11,900,000           |
        |                                       |
        v                                       v
  +------------------+                  +------------------+
  | Invoice sent     | --- email/WA -> | Invoice received |
  | via Kitz         |                 | by buyer         |
  +------------------+                  +------------------+
                                               |
                                               | Buyer calculates
                                               | withholdings:
                                               v
                                        +------------------+
                                        | ReteFuente: -400K|
                                        | ReteIVA:   -285K |
                                        | ReteICA:    -97K |
                                        | = Total WH: -782K|
                                        +------------------+
                                               |
                                               | Buyer pays NET
                                               | amount via PSE/transfer:
                                               v
  +------------------+                  +------------------+
  | Receives         | <--- COP        | Pays             |
  | COP 11,118,000   |    11,118,000   | COP 11,118,000   |
  +------------------+                  +------------------+
        |                                       |
        | Records in Kitz:                      | Remits to DIAN:
        | - Payment received                    | - ReteFuente: 400K
        | - Withholdings noted                  | - ReteIVA: 285K
        | - Partial payment = FULL              | - ReteICA: 97K
        |   (withholdings are not               |
        |    unpaid balance)                    |
        v                                       v
  +------------------+                  +------------------+
  | Kitz reconciles: |                  | DIAN receives    |
  | Invoice PAID     |                  | withholdings     |
  | Seller credits   |                  | on seller's      |
  | withholdings     |                  | tax account      |
  | against own tax  |                  +------------------+
  | obligations      |
  +------------------+
```

### 6.3 Multi-Provider Strategy (Colombia)

```
Priority 1 (Now):     Wompi (PSE + Nequi + Cards)  -- covers 85%+ of Colombian payments
Priority 2 (Q2 2026): Nequi Conecta direct         -- deeper Nequi integration
Priority 3 (Q3 2026): Daviplata direct              -- second wallet coverage
Priority 4 (Q4 2026): PayU/ePayco                   -- alternative gateway
Priority 5 (Future):  Mercado Pago                   -- marketplace integration
Priority 6 (Future):  dLocal                         -- cross-border collections
```

---

## 7. Currency & Localization

### 7.1 Currency

| Aspect | Detail |
|---|---|
| Official currency | Colombian Peso (COP) |
| ISO code | COP |
| Symbol | $ (same symbol as USD -- must disambiguate in UI) |
| Decimals | COP is displayed WITHOUT decimals for consumer-facing amounts |
| Smallest unit | COP 1 (centavos exist but are not used in practice) |
| Exchange rate | ~COP 4,200 per 1 USD (fluctuates, must not be hardcoded) |

**Display conventions:**

```typescript
// Colombian Peso formatting
function formatCOP(amount: number): string {
  // COP is displayed without decimals for consumer amounts
  // Thousands separator: period (.)
  // No decimal separator needed for consumer display
  return `$ ${Math.round(amount).toLocaleString('es-CO')}`;
  // e.g., formatCOP(11900000) => "$ 11.900.000"
}

// For tax documents and B2B (with decimals):
function formatCOPPrecise(amount: number): string {
  return `$ ${amount.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  // e.g., formatCOPPrecise(11900000) => "$ 11.900.000,00"
}

// CRITICAL: Currency in paymentTools.ts must NOT default to 'USD' for Colombia
// Need per-workspace currency configuration:
// currency: workspace.country === 'CO' ? 'COP' : args.currency || 'USD'
```

**Kitz codebase changes needed:**
- The `paymentTools.ts` currently defaults to `currency: args.currency || 'USD'` (line 76). For Colombia, this must default to `'COP'`.
- The `invoiceQuoteTools.ts` uses `$` prefix with USD formatting (e.g., `$${subtotal.toFixed(2)}`). For Colombia, this must use COP formatting (no decimals, period as thousands separator).
- Both tools need country-aware currency handling.

### 7.2 Date Format

| Context | Format | Example |
|---|---|---|
| User-facing display | DD/MM/YYYY | 24/02/2026 |
| DIAN XML invoices | YYYY-MM-DD | 2026-02-24 |
| DIAN XML time | HH:MM:SS-05:00 | 10:30:00-05:00 |
| Internal storage (ISO 8601) | YYYY-MM-DDTHH:mm:ssZ | 2026-02-24T15:30:00Z |
| Kitz implementation | `now.toLocaleDateString('es-CO')` | Uses Colombia locale |

**Timezone:** Colombia uses COT (Colombia Time, UTC-5) year-round. No daylight saving time.

### 7.3 Phone Numbers

| Aspect | Detail |
|---|---|
| Country code | +57 |
| Mobile format | +57 3XX XXX XXXX (10 digits, starts with 3) |
| Landline format | +57 (X) XXXXXXX (area code + 7 digits) |
| WhatsApp format | 573XXXXXXXXX (no + or spaces, for WhatsApp API) |

**Validation regex:**

```typescript
// Colombian mobile number (most common for SMB owners)
const COLOMBIA_MOBILE = /^\+?57\s?3[0-9]{2}\s?\d{3}\s?\d{4}$/;

// Colombian landline (with city code)
const COLOMBIA_LANDLINE = /^\+?57\s?\([1-8]\)\s?\d{7}$/;

// Quick mobile check (cleaned)
const COLOMBIA_MOBILE_CLEAN = /^573\d{9}$/;

// WhatsApp-ready format
function toWhatsAppFormat(phone: string): string {
  const cleaned = phone.replace(/[\s\-\+\(\)]/g, '');
  // Ensure starts with 57
  if (cleaned.startsWith('57')) return cleaned;
  if (cleaned.startsWith('3') && cleaned.length === 10) return `57${cleaned}`;
  return cleaned;
}

// Examples:
// +57 310 123 4567 -> 573101234567
// 3101234567       -> 573101234567
```

### 7.4 Address Format

Colombia uses the Carrera/Calle grid system for addresses, which is more structured than Panama's descriptive system.

**Typical format:**
```
{Carrera/Calle/Transversal/Diagonal} {number} #{cross_street}-{building_number}
{Barrio/Urbanizacion}
{Municipio}, {Departamento}
{Country}
```

**Examples:**
```
Carrera 7 #32-16, Oficina 801
Chapinero, Bogota D.C.
Cundinamarca, Colombia

Calle 10 #43A-37, Local 201
El Poblado, Medellin
Antioquia, Colombia
```

**Address components:**

```typescript
interface ColombiaAddress {
  streetType: 'Carrera' | 'Calle' | 'Transversal' | 'Diagonal' | 'Avenida' | 'Circular';
  streetNumber: string;           // e.g., '7' or '43A'
  crossStreet: string;            // e.g., '32' (after #)
  buildingNumber: string;         // e.g., '16' (after -)
  complement?: string;            // e.g., 'Oficina 801', 'Local 201', 'Apto 302'
  barrio?: string;                // Neighborhood
  municipio: string;              // Municipality (city)
  departamento: string;           // Department (state)
  codigoPostal?: string;          // Postal code (6 digits, not widely used)
  codigoDANE: string;             // DANE municipality code (required for e-invoicing)
}

// DANE codes for major cities
const DANE_CODES: Record<string, string> = {
  'bogota': '11001',
  'medellin': '05001',
  'cali': '76001',
  'barranquilla': '08001',
  'cartagena': '13001',
  'bucaramanga': '68001',
  'pereira': '66001',
  'manizales': '17001',
  'santa_marta': '47001',
  'ibague': '73001',
};
```

### 7.5 Estrato System

Colombia has a unique socioeconomic classification system called "Estratos" (strata 1-6) applied to residential properties. While primarily used for utility pricing, it provides useful market segmentation data for Kitz.

| Estrato | Classification | % of Population | Kitz Relevance |
|---|---|---|---|
| 1 | Bajo-bajo (lowest) | ~22% | Micro businesses, cash-heavy |
| 2 | Bajo (low) | ~42% | Core Kitz micro SMB target |
| 3 | Medio-bajo (lower-middle) | ~27% | Core Kitz SMB target |
| 4 | Medio (middle) | ~6% | Growth Kitz target |
| 5 | Medio-alto (upper-middle) | ~2% | Premium services |
| 6 | Alto (high) | ~1% | Premium services, professional firms |

### 7.6 Language

- All Kitz UI for Colombia: Spanish (Latin American, Colombian variant)
- Key vocabulary differences from Panama Spanish: "factura electronica" (same), "retencion en la fuente" (Colombia-specific), "RUT" (different from Panama's RUC), "NIT" (different from Panama's RUC)
- Invoice templates must use DIAN-standard terminology
- Legal terms must follow Colombian commercial code (Codigo de Comercio)

---

## 8. Competitive Landscape

### 8.1 Direct Competitors (Colombia SMB Software)

| Competitor | Strengths | Weaknesses | Kitz Differentiator |
|---|---|---|---|
| **Alegra** | HQ in **Medellin**, strong in Colombia, e-invoicing compliant, cloud-based, affordable (~$10-30/mo) | No AI features, no WhatsApp-native experience, limited CRM | Kitz is AI-native, WhatsApp-integrated, full business OS |
| **Siigo** | Largest Colombian accounting software (acquired Loggro), 900K+ users, DIAN e-invoicing certified | Heavy, complex UI, enterprise-oriented pricing, slow innovation | Kitz is lightweight, mobile-first, AI-powered |
| **Treinta** | Mobile-first, designed for tiendas (small shops), strong UX, Y Combinator backed | Limited to inventory and sales, no advanced invoicing, no B2B | Kitz offers complete business OS with AI |
| **Contabilizate** | Colombian cloud accounting, affordable, e-invoicing | Small team, limited features beyond accounting | Kitz's breadth: CRM + invoicing + payments + AI |
| **QuickBooks** | Global brand, robust accounting | Not localized for Colombia (no DIAN e-invoicing, no withholding taxes, no PSE/Nequi) | Kitz is built for Colombia from the ground up |
| **Tiendanube/Nuvemshop** | E-commerce platform, growing in Colombia | E-commerce only, no CRM, no accounting | Kitz is broader: full business OS |

### 8.2 E-Invoicing Providers (Potential Partners, Not Competitors)

| Provider | Type | Notes |
|---|---|---|
| **Carvajal Tecnologia y Servicios** | Proveedor Tecnologico, largest in Colombia | Potential PAC partner |
| **Gosocket** | Proveedor Tecnologico, multi-country | Already in Kitz Panama consideration |
| **EDICOM** | International e-invoicing provider | Strong in multi-country compliance |
| **The Factory HKA** | Proveedor Tecnologico | Growing presence in Colombia |
| **Sovos** | Tax compliance platform | Enterprise-focused |

### 8.3 Kitz's Competitive Advantages in Colombia

1. **AI-native operating system:** No Colombian SMB tool offers AI-powered business automation. Alegra and Siigo are traditional SaaS.
2. **WhatsApp-first:** WhatsApp has 96% penetration in Colombia. Kitz treats it as the primary business channel.
3. **Withholding tax automation:** The ReteFuente/ReteIVA/ReteICA calculation engine is a massive pain point for SMBs. Kitz automating this is a killer feature.
4. **All-in-one:** CRM + invoicing + payments + content + WhatsApp replaces Siigo + separate CRM + separate payment tool.
5. **SMB pricing:** Designed for businesses with revenue under COP 500M/year.

---

## 9. Implementation Roadmap

### Phase 1: Foundation (Q1-Q2 2026)

| Priority | Task | Owner | Status |
|---|---|---|---|
| P0 | Legal assessment: SFC licensing and data protection (Ley 1581) | Legal | Not started |
| P0 | Proveedor Tecnologico selection and partnership (DIAN e-invoicing) | Product + Legal | Not started |
| P0 | NIT validation with verification digit in workspace onboarding | Engineering | Not started |
| P0 | IVA multi-rate support (19%, 5%, 0%, exento, excluido) | Engineering | Not started |
| P1 | Wompi payment gateway integration (sandbox) | Engineering | Not started |
| P1 | Country-aware currency handling in `paymentTools.ts` and `invoiceQuoteTools.ts` | Engineering | Not started |
| P1 | CUFE generation (SHA-384) for e-invoicing | Engineering | Not started |
| P1 | DIAN numbering resolution management | Engineering | Not started |

### Phase 2: Core Colombia (Q2-Q3 2026)

| Priority | Task | Owner | Status |
|---|---|---|---|
| P0 | Wompi production integration (PSE + Nequi + Cards) | Engineering | Blocked by Phase 1 |
| P0 | XML-UBL 2.1 invoice generation via Proveedor Tecnologico API | Engineering | Blocked by partnership |
| P0 | Withholding tax engine (ReteFuente, ReteIVA, ReteICA) | Engineering | Not started |
| P1 | Nequi Conecta direct integration (QR + push) | Engineering | Not started |
| P1 | Invoice-to-payment linking with withholding reconciliation | Engineering | Not started |
| P1 | WhatsApp receipt automation (Colombia templates) | Engineering | Not started |
| P2 | Documento Soporte generation | Engineering | Not started |
| P2 | IVA bimonthly pre-filing report | Engineering | Not started |

### Phase 3: Growth & Optimization (Q3-Q4 2026)

| Priority | Task | Owner | Status |
|---|---|---|---|
| P1 | Daviplata integration (direct or via Wompi) | Engineering | Not started |
| P1 | ReteFuente monthly filing report | Engineering | Not started |
| P1 | ReteICA municipal rate database (top 20 cities) | Engineering | Not started |
| P2 | Nota Credito and Nota Debito support | Engineering | Not started |
| P2 | Bold POS reconciliation via CSV import | Engineering | Not started |
| P2 | Regimen Simple vs Ordinario automatic detection | Engineering | Not started |
| P3 | Nomina Electronica integration (via partner API) | Engineering | Not started |

### Phase 4: Future

| Priority | Task | Owner | Status |
|---|---|---|---|
| P2 | Mercado Pago Colombia integration | Engineering | Not started |
| P2 | dLocal cross-border payment support | Engineering | Not started |
| P2 | Recurring payment support via Wompi | Engineering | Not started |
| P3 | ICA rate database for all 1,100+ municipalities | Engineering | Not started |
| P3 | AI-powered tax classification (auto-detect ReteFuente concepto) | Engineering | Not started |
| P3 | Bank feed integration (Bancolombia API) | Engineering | Not started |

---

## 10. Compliance Checklist for Launch

Before Kitz can process payments and generate invoices in Colombia, the following must be verified:

### Legal & Regulatory

- [ ] SFC licensing assessment completed -- determination of whether Kitz needs a SEDPE license or can operate through licensed providers (Wompi/Bancolombia)
- [ ] Data protection compliance (Ley 1581 de 2012) -- privacy policy updated, SIC database registration
- [ ] Terms of service reviewed by Colombian attorney
- [ ] SARLAFT (AML/CFT) policy documented and KYC flow implemented
- [ ] Proveedor Tecnologico partnership agreement signed (for DIAN e-invoicing)
- [ ] Habilitacion de Facturacion Electronica obtained from DIAN (for Kitz as software)

### Tax Compliance

- [ ] IVA calculation supports all five categories (19%, 5%, 0% exento, 0% excluido, exempt)
- [ ] ReteFuente calculation engine implemented with all common conceptos and base minimas
- [ ] ReteIVA calculation implemented (15% of IVA when applicable)
- [ ] ReteICA calculation implemented for top 10 municipalities (Bogota, Medellin, Cali, Barranquilla, Cartagena, Bucaramanga, Pereira, Manizales, Ibague, Santa Marta)
- [ ] UVT value configurable and annually updatable
- [ ] Invoice numbering follows DIAN resolution (prefix + sequential within authorized range)
- [ ] NIT validation with modulo-11 verification digit implemented
- [ ] NIT/RUT capture for both seller (workspace owner) and buyer (B2B contacts)
- [ ] CUFE generated correctly using SHA-384 hash

### E-Invoice (Facturacion Electronica)

- [ ] XML-UBL 2.1 generation follows DIAN technical specification
- [ ] All mandatory UBL namespaces and DIAN extensions included
- [ ] XAdES digital signature integration functional
- [ ] Proveedor Tecnologico API integration tested (send, validate, receive acceptance/rejection)
- [ ] CUFE generated and included in XML before submission
- [ ] QR code data included in DIAN extensions
- [ ] Nota Credito (credit note) XML generation functional
- [ ] 5-year invoice archive infrastructure in place
- [ ] Contingency invoice process documented (for when DIAN services are unavailable)

### Payment Processing

- [ ] Wompi merchant account active (for Kitz platform)
- [ ] Wompi webhook receiver tested end-to-end with HMAC verification
- [ ] PSE payment flow tested (redirect + return + webhook)
- [ ] Nequi payment flow tested (QR + push notification)
- [ ] Payment-to-invoice linking functional (including withholding reconciliation)
- [ ] Transaction data retention policy (5+ years) implemented
- [ ] Currency correctly set to COP for Colombia workspaces
- [ ] Payment amounts in COP centavos for Wompi API (multiply by 100)

### User Experience

- [ ] Workspace onboarding captures: business name (razon social), NIT, RUT document, tax regime, municipio, departamento
- [ ] Currency displayed as `$ X.XXX.XXX` (COP format, no decimals for consumer)
- [ ] Dates displayed as DD/MM/YYYY in UI
- [ ] Phone numbers validated for Colombia format (+57 3XX XXX XXXX)
- [ ] Addresses support Carrera/Calle grid system
- [ ] All UI text in Spanish (Colombian variant)
- [ ] WhatsApp receipt templates localized for Colombia
- [ ] DANE municipality codes stored for e-invoicing addresses
- [ ] Estrato field available (optional) in workspace profile

---

## 11. Partnership Opportunities

### 11.1 Strategic Partnerships

| Partner | Type | Value to Kitz | Approach |
|---|---|---|---|
| **Bancolombia** | Payment infrastructure | Wompi gateway, Nequi integration, QR payments, SMB banking | Developer program, Wompi merchant agreement |
| **Davivienda** | Payment infrastructure | Daviplata integration, business banking | Commercial partnership |
| **Carvajal Tecnologia** | E-invoicing compliance | DIAN-certified Proveedor Tecnologico, largest in Colombia | API integration partnership |
| **ACH Colombia** | Payment rails | PSE access (via gateway), Transfiya future | Long-term, indirect via Wompi initially |
| **Confecamaras** | Distribution | Federation of all 57 Camaras de Comercio, access to every registered business | Co-branded digitization program |

### 11.2 Distribution Partnerships

| Partner | Channel | Opportunity |
|---|---|---|
| **iNNpulsa Colombia** | Government agency | Colombia's SMB innovation and scaling agency. Feature Kitz in digitization programs |
| **Bancolombia** | Bank branch network + Nequi app | Bundle Kitz with Nequi Negocio onboarding |
| **Camaras de Comercio** | Business registration | Recommend Kitz during Matricula Mercantil renewal (March each year) |
| **Contadores (accountants)** | Professional network | Referral program -- accountants are the #1 influencer for SMB software adoption in Colombia |
| **SENA** | Government training | National vocational training service. Integrate Kitz into digital entrepreneurship courses |
| **Rappi / Ifood partners** | Delivery ecosystem | Integration for restaurants/stores using Kitz for back-office |

### 11.3 Medellin Innovation Ecosystem

Medellin is a strategic city for Kitz's Colombia launch:
- **Ruta N:** Medellin's innovation center. Office space, networking, government connections.
- **Alegra HQ is in Medellin** -- understanding the competitive dynamics in the city is critical.
- **Startup ecosystem:** Large developer community, lower cost of living than Bogota, strong tech talent.
- Consider establishing Kitz's Colombia operations in Medellin.

---

## 12. Appendix: Reference Links

### Payment Systems
- PSE (ACH Colombia): https://www.pse.com.co/
- ACH Colombia: https://www.achcolombia.com.co/
- Transfiya: https://www.transfiya.com.co/
- Wompi (Bancolombia): https://docs.wompi.co/
- Wompi Dashboard: https://dashboard.wompi.co/
- Nequi Conecta: https://conecta.nequi.com.co/
- Nequi Developer Docs: https://docs.conecta.nequi.com.co/
- Daviplata: https://www.daviplata.com/
- Bold: https://bold.co/
- PayU Colombia: https://www.payulatam.com/co/
- ePayco: https://epayco.com/
- Mercado Pago Colombia: https://www.mercadopago.com.co/developers/

### Government & Tax
- DIAN Portal: https://www.dian.gov.co/
- DIAN MUISCA: https://muisca.dian.gov.co/
- DIAN E-Invoice Catalog: https://catalogo-vpfe.dian.gov.co/
- DIAN E-Invoice Technical Spec: https://www.dian.gov.co/fizcalizacioncontrol/herramienconsulta/FacturaElectronica/
- SFC (Superintendencia Financiera): https://www.superfinanciera.gov.co/
- SIC (Superintendencia de Industria y Comercio): https://www.sic.gov.co/
- RUES (Business Registry): https://www.rues.org.co/
- Confecamaras: https://confecamaras.org.co/
- iNNpulsa Colombia: https://www.innpulsacolombia.com/

### Banking
- Bancolombia: https://www.bancolombia.com/
- Davivienda: https://www.davivienda.com/
- Banco de Bogota: https://www.bancodebogota.com/
- BBVA Colombia: https://www.bbva.com.co/
- Nu Colombia: https://nu.com.co/

### Regulatory References
- Estatuto Tributario (Colombian Tax Code): https://estatuto.co/
- Resolucion 000042 de 2020 (E-invoicing technical requirements)
- Resolucion 000012 de 2021 (E-invoicing annexes and CUFE spec)
- Resolucion 000013 de 2021 (Documento Soporte)
- Decreto 1625 de 2016 (Unified tax regulatory decree -- DUR Tributario)
- Ley 1581 de 2012 (Data protection / Habeas Data)
- Ley 1735 de 2014 (Electronic deposits and payments)
- Decreto 1357 de 2018 (Fintech regulatory framework)
- Decreto 1234 de 2020 (SEDPE licensing)

### Market Intelligence
- Colombia Fintech Association: https://colombiafintech.co/
- Superintendencia de Sociedades: https://www.supersociedades.gov.co/
- DANE (National Statistics): https://www.dane.gov.co/
- Banco de la Republica (Central Bank): https://www.banrep.gov.co/

### Kitz Codebase References
- Payment tools: `kitz_os/src/tools/paymentTools.ts`
- Invoice/quote tools: `kitz_os/src/tools/invoiceQuoteTools.ts`
- Payment service: `kitz-payments/src/index.ts`
- Compliance agent types: `kitz-services/src/compliance-agent/types.ts`
- Workspace store: `ui/src/stores/workspaceStore.ts`

### Codebase Changes Required Summary

```typescript
// 1. paymentTools.ts -- Add Colombia providers
provider: {
  type: 'string',
  enum: ['stripe', 'paypal', 'yappy', 'bac', 'wompi', 'pse', 'nequi', 'daviplata'],
  description: 'Payment provider',
}

// 2. paymentTools.ts -- Country-aware currency default
currency: args.currency || (workspace.country === 'CO' ? 'COP' : 'USD'),

// 3. kitz-payments/src/index.ts -- Add Wompi webhook endpoint
const WOMPI_WEBHOOK_SECRET = process.env.WOMPI_WEBHOOK_SECRET || '';
app.post('/webhooks/wompi', async (req, reply) => { /* ... */ });

// 4. kitz-payments/src/index.ts -- Add 'wompi' to allowed providers
const allowedReceiveProviders = new Set(['stripe', 'paypal', 'yappy', 'bac', 'wompi']);

// 5. compliance-agent/types.ts -- Add Colombia
export type Country = 'Panama' | 'Colombia';
export type RegulatoryBody = 'DGI' | 'DIAN' | 'SFC' | 'SIC' | /* ... */;

// 6. invoiceQuoteTools.ts -- Country-aware tax default
tax_rate: {
  type: 'number',
  description: 'Tax rate (default: 0.07 for Panama ITBMS, 0.19 for Colombia IVA)',
}
// In execute:
const defaultTaxRate = workspace.country === 'CO' ? 0.19 : 0.07;
```

---

*This document should be reviewed and updated quarterly as Colombia's regulatory and payment landscape evolves. Key monitoring dates: DIAN resolution updates (ongoing), UVT annual update (December each year), SFC regulatory releases, Wompi/Nequi platform changes, and municipal ICA rate updates (January each year). Colombia's tax environment changes more frequently than Panama's -- budget for monthly compliance monitoring.*
