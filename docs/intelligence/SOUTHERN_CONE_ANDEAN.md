# Southern Cone & Andean Markets — Financial & Payment Infrastructure Intelligence
## Uruguay, Paraguay, Bolivia, Venezuela

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

This document covers four markets that span a wide spectrum of operational complexity: from Uruguay (Latin America's most stable and digitally advanced small economy) to Venezuela (a high-risk, high-reward market defined by hyperinflation history, dual currency operation, and regulatory instability). Paraguay and Bolivia sit between these extremes, each with distinct characteristics that shape how Kitz must operate.

**Market-by-market summary:**

**Uruguay** is the natural first entry point. It has mandatory electronic invoicing (CFE) since 2012 -- the longest-running e-invoicing system in the region. Its economy is stable, rule of law is strong, and fintech adoption is accelerating. Mercado Pago and Prex dominate digital payments. The 22% IVA rate (the highest in Latin America) makes tax calculation accuracy critical. dLocal, one of LatAm's most successful payment companies, is headquartered here -- a signal of the country's fintech ecosystem maturity.

**Paraguay** offers a modern e-invoicing system (SIFEN) that launched in 2021 and is well-designed from a technical standpoint. Tigo Money dominates mobile payments in a market where financial inclusion through mobile wallets is more advanced than traditional banking penetration. The Guarani (PYG) uses no decimal places and trades at roughly 7,500 PYG per 1 USD, requiring careful handling of large integer amounts in all financial calculations.

**Bolivia** has a state-controlled economy with limited fintech ecosystem. The ASFI-mandated QR Simple interoperability standard for payments is a notable innovation, but the dual formal/informal economy and heavy state involvement in banking create operational constraints. The SIN (tax authority) is rolling out electronic invoicing through its SFV portal, but the system is less mature than Uruguay's or Paraguay's.

**Venezuela** presents the highest operational complexity of any LatAm market. Hyperinflation history has led to multiple currency redenominations (most recently in 2021, removing six zeros). De facto dollarization means businesses operate in both VES and USD simultaneously. Pago Movil (interbank mobile transfers) is the dominant digital payment method, while Zelle and cryptocurrency (particularly Binance) serve as USD-denominated alternatives. International sanctions, unstable regulations, and price controls create significant operational risk -- but also a massive underserved SMB market where entrepreneurs are remarkably resourceful.

**Key strategic takeaways:**

- Uruguay first: stable, well-regulated, mature e-invoicing, Mercado Pago integration
- Paraguay second: modern SIFEN e-invoicing, growing mobile payments, low tax rates
- Bolivia cautiously: state-controlled economy requires careful regulatory navigation
- Venezuela long-term: high-risk/high-reward, requires specialized dual-currency architecture
- All four markets share WhatsApp as the dominant business communication channel
- Mercado Libre/Mercado Pago is present in Uruguay and Paraguay (limited in Bolivia, absent in Venezuela)

---

## 2. Payment Systems

### 2.1 Uruguay

#### 2.1.1 Mercado Pago Uruguay

**What it is:**
Mercado Pago is the payments arm of Mercado Libre, the dominant e-commerce platform in Latin America. In Uruguay, Mercado Pago functions as a digital wallet, payment gateway, and QR-based payment acceptance platform. It is the most widely adopted digital payment method for SMBs.

**Why Kitz needs it:**
Mercado Pago is Uruguay's equivalent of Yappy in Panama -- the single most important payment integration. SMB customers expect to pay via Mercado Pago QR codes, payment links, or through the Mercado Pago wallet. Its developer API is mature and well-documented, with official SDKs in multiple languages including Node.js.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Developer portal | https://www.mercadopago.com.uy/developers |
| Node.js SDK | `mercadopago` (npm -- official SDK) |
| Authentication | OAuth 2.0 with `access_token` per merchant |
| Sandbox mode | Full sandbox environment with test credentials |
| Webhook (IPN) | Instant Payment Notification via configurable URL |
| Payment methods | QR code, payment link, checkout redirect, card tokenization |
| Settlement | Into merchant's Mercado Pago account, transferable to bank |

**Integration pattern for Kitz:**

```
1. Kitz workspace owner connects Mercado Pago via OAuth
2. Kitz creates payment preference via Mercado Pago API
   -> API returns checkout URL / QR code data
3. Customer pays via Mercado Pago (wallet, card, or bank transfer)
4. Mercado Pago sends IPN webhook to Kitz
5. Kitz calls payments_processWebhook(provider: 'mercadopago', ...)
6. Invoice status -> 'paid', CRM updated, WhatsApp receipt sent
```

**Key SDK configuration:**

```typescript
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN_UY,
  options: { timeout: 5000 },
});

const preference = new Preference(mpClient);

// Create a payment preference for an invoice
async function createPaymentPreference(invoice: KitzInvoice) {
  const result = await preference.create({
    body: {
      items: invoice.lineItems.map(item => ({
        title: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        currency_id: 'UYU',
      })),
      back_urls: {
        success: `https://kitz.app/payments/mp/success/${invoice.id}`,
        failure: `https://kitz.app/payments/mp/failure/${invoice.id}`,
        pending: `https://kitz.app/payments/mp/pending/${invoice.id}`,
      },
      notification_url: `https://kitz.app/webhooks/mercadopago/${invoice.workspaceId}`,
      external_reference: invoice.invoiceNumber,
    },
  });
  return result;
}
```

#### 2.1.2 Prex (Digital Wallet)

**What it is:**
Prex is a Uruguayan-born digital wallet and prepaid card platform. It provides a Mastercard-linked prepaid card, P2P transfers, QR payments, and bill payment services. It has expanded to Argentina and other markets but retains a strong base in Uruguay.

**Why Kitz needs it:**
Prex serves a younger demographic and users who may not have traditional bank accounts. As a payment acceptance channel, it expands Kitz's reach to underbanked SMB customers. Prex payments are processed through the Mastercard network, so they can be accepted via standard card acquirers.

**Technical integration:**
- Prex payments via the Mastercard network are captured through standard card acquirers (no special integration needed).
- P2P transfers within Prex require sender to initiate from the Prex app.
- No public merchant API at this time -- payment acceptance is through card network.

#### 2.1.3 OCA (Uruguay-Specific Card Network)

**What it is:**
OCA is a Uruguayan payment card network, historically the dominant local card brand. It operates credit, debit, and prepaid cards. OCA cards are widely accepted throughout Uruguay. OCA also operates an acquiring business for merchants.

**Why Kitz needs it:**
Many Uruguayan consumers and businesses hold OCA cards. Unlike Visa/Mastercard, OCA is locally processed, meaning settlement and dispute resolution are handled within Uruguay. For Kitz, OCA acceptance is needed through POS or e-commerce acquirers.

**Technical integration:**
- OCA acquiring is handled through integrations with OCA's merchant services or through payment aggregators like Mercado Pago (which accepts OCA).
- No direct API for third-party developers -- integration is via acquirer relationships.

#### 2.1.4 Abitab / RedPagos (Cash Payment Networks)

**What it is:**
Abitab and RedPagos are Uruguay's two dominant cash payment and collection networks. They operate thousands of physical locations across the country where consumers can pay bills, make government payments, send remittances, and top up prepaid services. Together, they cover virtually every town in Uruguay.

**Why Kitz needs it:**
Despite Uruguay's advanced digital infrastructure, cash remains significant for certain segments. Abitab and RedPagos allow Kitz users to generate payment vouchers that customers can pay at any physical location. This is critical for SMBs whose customers prefer or require cash payment.

**Integration pattern:**
```
1. Kitz generates a payment barcode/reference for an invoice
2. Customer takes reference to any Abitab or RedPagos location
3. Customer pays cash at the counter
4. Abitab/RedPagos notifies Kitz via settlement file or API
5. Kitz marks invoice as 'paid'
```

**Implementation timeline:** Q3 2026 -- after digital payment integrations are established.

---

### 2.2 Paraguay

#### 2.2.1 Tigo Money (Dominant Mobile Money)

**What it is:**
Tigo Money is Paraguay's leading mobile money platform, operated by Millicom (Tigo). It allows users to send money, pay bills, receive salaries, and make merchant payments using their mobile phone number as an account identifier. It has driven financial inclusion in Paraguay, reaching populations without traditional bank accounts.

**Why Kitz needs it:**
Tigo Money is the single most important payment method in Paraguay for the SMB segment. Its user base far exceeds traditional digital banking users. For Kitz to succeed in Paraguay, Tigo Money acceptance is essential.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Integration model | API-based merchant integration via Tigo Business |
| Authentication | Merchant credentials issued by Tigo |
| Payment flow | Customer initiates payment from Tigo Money app using merchant code |
| Settlement | Into merchant's Tigo Money account or linked bank account |
| Notifications | Callback URL for payment confirmation |

**Integration pattern for Kitz:**

```
1. Kitz displays Tigo Money payment option with merchant code
2. Customer opens Tigo Money app, enters merchant code + amount
3. Customer confirms with Tigo Money PIN
4. Tigo sends payment confirmation to Kitz webhook
5. Kitz calls payments_processWebhook(provider: 'tigo_money', ...)
6. Invoice marked as paid, receipt sent via WhatsApp
```

#### 2.2.2 Bancard (Card Network)

**What it is:**
Bancard S.A. is Paraguay's interbank card processing network. It processes Visa, Mastercard, and local debit card transactions for Paraguayan banks. Bancard also operates vPOS (virtual POS) for e-commerce and Infonet for ATM and POS terminal networks.

**Why Kitz needs it:**
Bancard's vPOS is the gateway for online card payments in Paraguay. Any Kitz merchant that wants to accept credit or debit cards online must integrate through Bancard or a Bancard-connected acquirer.

**Technical integration:**

| Aspect | Detail |
|---|---|
| E-commerce gateway | Bancard vPOS API |
| Authentication | Merchant credentials via acquiring bank |
| Card types | Visa, Mastercard, local debit |
| Security | 3D Secure supported, PCI-DSS compliant |

#### 2.2.3 Personal Money / Billetera Personal

**What it is:**
Personal Money (operated by Personal, a Telecom subsidiary) is the second mobile money platform in Paraguay. It offers similar services to Tigo Money -- P2P transfers, bill payments, and merchant payments.

**Why Kitz needs it:**
To maximize payment acceptance coverage in Paraguay, Kitz should support both Tigo Money and Personal Money. Together they cover the vast majority of mobile money users.

**Implementation timeline:** Q4 2026 -- after Tigo Money integration.

---

### 2.3 Bolivia

#### 2.3.1 QR Simple (ASFI-Mandated Interoperability)

**What it is:**
QR Simple is Bolivia's interoperable QR payment system, mandated by ASFI (Autoridad de Supervision del Sistema Financiero). It standardizes QR-based payments across all banks and financial institutions, allowing any customer with a bank account at any participating institution to scan and pay a single QR code. This is a notable regulatory innovation -- rather than each bank having its own QR system, ASFI required interoperability.

**Why Kitz needs it:**
QR Simple is Bolivia's most accessible digital payment method. A single QR integration covers all participating banks. For Kitz, this simplifies the payment integration story in Bolivia significantly.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Standard | EMVCo QR Code Specification (adapted for Bolivia) |
| Mandated by | ASFI (financial regulator) |
| Participants | All regulated banks and financial institutions |
| Integration | Through acquiring bank or payment aggregator |
| Settlement | Into merchant's bank account |

**Integration pattern for Kitz:**

```
1. Kitz generates QR Simple code for invoice amount
   -> QR contains: merchant ID, amount, reference, bank routing
2. Customer scans QR with any participating bank's mobile app
3. Customer confirms payment in their bank app
4. Acquiring bank settles payment and notifies Kitz
5. Kitz calls payments_processWebhook(provider: 'qr_simple', ...)
6. Invoice marked as paid
```

#### 2.3.2 Tigo Money Bolivia

**What it is:**
Tigo Money also operates in Bolivia as a mobile money platform, offering similar services to its Paraguayan counterpart. It serves the significant unbanked and underbanked population.

**Why Kitz needs it:**
In Bolivia's informal economy, many SMB customers may not have bank accounts but do have Tigo Money. Supporting Tigo Money extends Kitz's payment acceptance reach beyond the formal banking system.

#### 2.3.3 Bank Transfers

Traditional bank transfers remain the primary method for B2B payments in Bolivia. Kitz invoices should include full bank details (bank name, account number, account type, account holder name, NIT) for manual transfer reconciliation.

---

### 2.4 Venezuela (HIGH COMPLEXITY)

#### 2.4.1 Pago Movil (Interbank Mobile Transfers)

**What it is:**
Pago Movil is Venezuela's interbank mobile payment system, enabling instant transfers between any bank accounts using the recipient's phone number, national ID (cedula), and bank code. It has become the dominant digital payment method in Venezuela, far exceeding card payments or traditional bank transfers in daily usage. Transactions are processed in VES (Bolivar digital).

**Why Kitz needs it:**
Pago Movil is the single most important payment method in Venezuela for domestic VES-denominated transactions. It is ubiquitous -- virtually every Venezuelan with a bank account uses it daily. For Kitz to accept bolivar-denominated payments, Pago Movil integration is essential.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Operator | Sudeban (banking regulator) through participating banks |
| Authentication | Phone number + cedula + bank code |
| Direct API | Not publicly available to non-bank entities |
| Integration path | Through a partner bank's merchant API |
| Settlement | Instant into merchant's bank account |
| Currency | VES only |
| Limits | Transaction limits set by Sudeban (frequently adjusted due to inflation) |

**Integration pattern for Kitz:**

```
1. Kitz displays Pago Movil payment details:
   - Phone: 0412-XXXXXXX
   - Cedula: V-XXXXXXXX
   - Bank: 0134 (Banesco) / 0102 (Banco de Venezuela)
   - Amount: VES X,XXX,XXX.XX
   - Reference: Invoice number
2. Customer opens their bank app -> Pago Movil
3. Customer enters details and confirms transfer
4. Customer sends screenshot/reference to Kitz via WhatsApp
5. Kitz (manual or automated) verifies payment via bank statement
6. Invoice marked as paid

NOTE: Automated reconciliation is difficult in Venezuela.
Most SMBs verify payments manually via bank app screenshots.
```

#### 2.4.2 Zelle (USD Transactions)

**What it is:**
Zelle is a US-based P2P payment platform, but it has been widely adopted in Venezuela for USD-denominated transactions. Due to de facto dollarization, many Venezuelan businesses and individuals hold US bank accounts (often through family in the diaspora) and use Zelle as a primary USD payment method.

**Why Kitz needs it:**
For the dollarized side of Venezuelan commerce, Zelle is the dominant payment method. Many SMBs quote prices in USD and accept Zelle as a primary payment channel. Kitz must support dual-currency invoicing with Zelle as a USD payment option.

**Integration considerations:**
- Zelle has no public merchant API -- it is a P2P platform.
- Payment verification is manual (screenshot or confirmation email).
- Kitz should support Zelle as a "manual payment method" where the merchant enters the Zelle confirmation after receiving it.
- USD amount must be displayed alongside the VES equivalent at the current exchange rate.

#### 2.4.3 Binance / Crypto Payments

**What it is:**
Venezuela has one of the highest cryptocurrency adoption rates in the world, driven by hyperinflation and currency controls. Binance P2P is the most widely used platform for converting between VES, USD, and USDT. Many businesses accept USDT (Tether) as a payment method.

**Why Kitz needs it:**
In Venezuela's complex monetary environment, crypto provides a stable store of value and a payment method that bypasses currency controls. Kitz should support crypto as an optional payment channel, particularly USDT on popular networks (Tron TRC-20 is the most common in Venezuela due to low fees).

**Integration pattern:**

```
1. Kitz generates a USDT payment request:
   - USDT amount (equivalent to invoice total)
   - TRC-20 wallet address (merchant's)
   - QR code for wallet address
2. Customer sends USDT from their wallet/Binance
3. Kitz monitors blockchain for incoming transaction (or merchant confirms manually)
4. Invoice marked as paid
```

**Risk considerations:**
- Regulatory uncertainty around crypto in Venezuela
- Exchange rate volatility between VES and USDT
- International sanctions may affect certain crypto flows
- Kitz should consult legal counsel before enabling crypto payments

#### 2.4.4 Bank Transfers (VES)

Traditional bank transfers in VES remain common for larger B2B transactions. The flow is similar to Pago Movil but uses account numbers rather than phone numbers. Settlement is same-day for intra-bank transfers, next-day for interbank.

---

## 3. Banking & Interbank Infrastructure

### 3.1 Uruguay

Uruguay has a stable, well-regulated banking system overseen by the BCU (Banco Central del Uruguay).

| Bank | Relevance to Kitz | Key Products |
|---|---|---|
| **BROU (Banco Republica)** | State-owned, largest bank, most SMBs have accounts | Business accounts, payment processing, government payment channels |
| **Santander Uruguay** | Major private bank, strong digital banking | Online banking, card acquiring, business lending |
| **Itau Uruguay** | Brazilian-owned, strong in commercial banking | Business accounts, trade finance, corporate cards |
| **Scotiabank Uruguay** | International presence, trade finance | International transfers, USD accounts, trade services |
| **BBVA Uruguay** | Growing digital presence | Digital banking, business accounts |

**Interbank infrastructure:**
- **BEVSA (Bolsa Electronica de Valores):** Operates the interbank clearing system and foreign exchange market.
- **RedBROU:** BROU's electronic payment network connecting ATMs and POS terminals.
- **SISTAR:** Interbank real-time gross settlement system operated by BCU.

**Typical SMB banking needs in Uruguay:**
- Cuenta corriente (checking account) in UYU and/or USD
- POS terminal or digital payment acceptance (OCA, Visa, Mastercard)
- Mercado Pago merchant account
- Abitab/RedPagos collection agreements for cash payments
- Working capital lines of credit

### 3.2 Paraguay

Paraguay's banking system is supervised by the BCP (Banco Central del Paraguay).

| Bank | Relevance to Kitz | Key Products |
|---|---|---|
| **Banco Nacional de Fomento** | State development bank, SMB lending | Development loans, SMB credit lines |
| **Itau Paraguay** | Largest private bank, strong digital | Digital banking, Bancard acquiring, business accounts |
| **BBVA Paraguay** | International bank, corporate focus | Business banking, international trade |
| **Banco Continental** | Major local bank | Business accounts, POS services |
| **Vision Banco** | Microfinance leader, serves underbanked | Microloans, mobile banking, financial inclusion |

**Interbank infrastructure:**
- **SPI (Sistema de Pagos Instantaneos):** Real-time interbank payment system operated by BCP.
- **Bancard:** Card processing network connecting all banks for card transactions.
- **SIPAP:** Large-value payment system for interbank settlements.

**Special consideration:** Vision Banco is particularly relevant for Kitz because its customer base overlaps heavily with Kitz's target SMB segment (micro and small businesses, many informal or semi-formal).

### 3.3 Bolivia

Bolivia's banking system is regulated by ASFI (Autoridad de Supervision del Sistema Financiero) and features significant state involvement.

| Bank | Relevance to Kitz | Key Products |
|---|---|---|
| **Banco Union** | State-owned, dominant, handles government payments | Business accounts, government vendor payments, QR Simple |
| **BNB (Banco Nacional de Bolivia)** | Major private bank | Business banking, digital channels, QR Simple |
| **Banco Mercantil Santa Cruz** | Largest private bank by assets | Corporate banking, trade finance, QR Simple |
| **BancoSol** | Microfinance pioneer (world-renowned) | Microloans, SMB lending, mobile banking |
| **Banco FIE** | Microfinance-origin bank | SMB focused, micro/small business lending |

**Key characteristic:** Bolivia's government mandates that certain payments (taxes, government vendor payments, salary deposits for public employees) flow through Banco Union. This gives the state bank outsized influence in the financial system.

**Interbank infrastructure:**
- **LBTR (Liquidacion Bruta en Tiempo Real):** Real-time gross settlement system.
- **ACH Bolivia:** Automated clearing house for batch payments.
- **QR Simple:** ASFI-mandated interoperable QR payments (see Section 2.3.1).

### 3.4 Venezuela

Venezuela's banking system operates under Sudeban (Superintendencia de las Instituciones del Sector Bancario) in a highly regulated and unstable environment.

| Bank | Relevance to Kitz | Key Products |
|---|---|---|
| **Banco de Venezuela** | State-owned, largest, handles government payments | Pago Movil, business accounts, government transactions |
| **Banesco** | Largest private bank by customers | Pago Movil, digital banking, business accounts |
| **Mercantil** | Major private bank, strong digital | Online banking, Pago Movil, business services |
| **BBVA Provincial** | International bank, corporate focus | Business banking, international operations |
| **Banco Nacional de Credito (BNC)** | Growing mid-size bank | Business accounts, Pago Movil |

**Key challenges for banking in Venezuela:**
- **Transaction limits:** Sudeban frequently adjusts daily transaction limits to keep pace with inflation, requiring constant system updates.
- **System instability:** Bank platforms experience frequent outages, particularly during high-traffic periods.
- **Multiple account requirement:** Many businesses maintain accounts at multiple banks to mitigate single-bank outage risk and access different Pago Movil channels.
- **Dual currency operations:** Businesses effectively run two parallel accounting systems -- one in VES, one in USD.

**Interbank infrastructure:**
- **Pago Movil:** Interbank mobile payment system (see Section 2.4.1).
- **Cenit:** Venezuela's RTGS (real-time gross settlement) system.
- **Suiche 7B:** Interbank ATM and POS network.

---

## 4. Government & Regulatory Bodies

### 4.1 Uruguay

#### 4.1.1 DGI (Direccion General Impositiva)

**What it is:**
Uruguay's tax authority, responsible for tax collection, taxpayer registration (RUT), IVA administration, and the CFE (Comprobante Fiscal Electronico) electronic invoicing system.

**Key systems:**

| System | Purpose | URL |
|---|---|---|
| CFE (e-invoicing) | Mandatory electronic invoicing since 2012 | https://www.dgi.gub.uy |
| RUT registry | Taxpayer identification | Via DGI portal |
| IVA filing | Monthly VAT declarations | Via DGI portal |
| eFactura portal | E-invoice validation and consultation | https://efactura.dgi.gub.uy |

**Tax structure:**

| Tax | Rate | Description |
|---|---|---|
| **IVA** | **22% standard** | Highest in LatAm -- Value Added Tax |
| **IVA reduced** | **10%** | Basic food items, medicines, hotel services, passenger transport |
| **IVA exempt** | **0%** | Exports, certain financial services, education, health |
| **IRAE** | **25%** | Corporate/business income tax |
| **IRPF** | **Progressive** | Personal income tax (for sole proprietors) |
| **BPS contributions** | **Variable** | Social security (employer + employee contributions) |
| **IP** | **Variable** | Wealth tax (Impuesto al Patrimonio) |

**RUT (Registro Unico Tributario) format:**
- 12-digit number for legal entities
- Cedula-based for natural persons
- Format: `XXXXXXXXXXXX` (12 digits with check digit)

```typescript
function validateRUT_Uruguay(rut: string): { valid: boolean; type: string; error?: string } {
  const cleaned = rut.replace(/[\s\-\.]/g, '');

  // Legal entity: 12 digits
  if (/^\d{12}$/.test(cleaned)) {
    // Validate check digit (modulo 11 algorithm)
    const digits = cleaned.split('').map(Number);
    const weights = [4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 11; i++) {
      sum += digits[i] * weights[i];
    }
    const remainder = sum % 11;
    const checkDigit = remainder <= 1 ? 0 : 11 - remainder;
    if (checkDigit !== digits[11]) {
      return { valid: false, type: 'legal_entity', error: 'Invalid check digit' };
    }
    return { valid: true, type: 'legal_entity' };
  }

  // Natural person: cedula format (X.XXX.XXX-X)
  const cedulaMatch = cleaned.match(/^(\d{1})(\d{3})(\d{3})(\d{1})$/);
  if (cedulaMatch || /^\d{7,8}$/.test(cleaned)) {
    return { valid: true, type: 'natural_person' };
  }

  return { valid: false, type: 'unknown', error: 'Invalid RUT format' };
}
```

#### 4.1.2 BCU (Banco Central del Uruguay)

**What it is:**
The central bank, responsible for monetary policy, financial system regulation, and payment system oversight. The BCU regulates fintechs under Law 19.210 (Financial Inclusion Law, 2014), which created a framework for electronic money institutions (IEDE -- Instituciones Emisoras de Dinero Electronico).

**Relevance to Kitz:**
If Kitz holds or processes funds in Uruguay, it may need to register as an IEDE or operate through a licensed IEDE. The Financial Inclusion Law is progressive and fintech-friendly -- Uruguay was a regional pioneer in fintech regulation.

### 4.2 Paraguay

#### 4.2.1 SET (Subsecretaria de Estado de Tributacion)

**What it is:**
Paraguay's tax authority, responsible for tax administration, SIFEN (electronic invoicing), and RUC (taxpayer registry).

**Key systems:**

| System | Purpose |
|---|---|
| SIFEN | Electronic invoicing system (launched 2021+) |
| Marangatú | Tax filing and management portal |
| RUC registry | Taxpayer identification |
| Ekuatia | Online tax services portal |

**Tax structure:**

| Tax | Rate | Description |
|---|---|---|
| **IVA** | **10% standard** | Value Added Tax -- relatively low |
| **IVA reduced** | **5%** | Basic goods, pharmaceuticals, interest, rent, capital goods |
| **IRE** | **10%** | Corporate income tax (Impuesto a la Renta Empresarial) |
| **IRP** | **8-10%** | Personal income tax (Impuesto a la Renta Personal) |
| **IRA** | **Variable** | Agricultural income tax (Impuesto a la Renta Agropecuaria) |
| **IDU** | **Variable** | Dividend tax (Impuesto a los Dividendos y Utilidades) |

**RUC (Registro Unico de Contribuyente) format:**
- Format: `XXXXXXXX-X` (8 digits + check digit)
- Prefixed with `80` for legal entities
- Cedula number for natural persons

```typescript
function validateRUC_Paraguay(ruc: string): { valid: boolean; type: string; error?: string } {
  const cleaned = ruc.replace(/[\s\-\.]/g, '');

  // Legal entity: starts with 80, total 8+ digits with check digit
  if (/^80\d{6,}\d$/.test(cleaned)) {
    // Validate check digit (modulo 11)
    const body = cleaned.slice(0, -1);
    const providedCheck = parseInt(cleaned.slice(-1), 10);
    let sum = 0;
    let weight = 2;
    for (let i = body.length - 1; i >= 0; i--) {
      sum += parseInt(body[i], 10) * weight;
      weight++;
      if (weight > 11) weight = 2;
    }
    const remainder = sum % 11;
    const expectedCheck = remainder <= 1 ? 0 : 11 - remainder;
    if (providedCheck !== expectedCheck) {
      return { valid: false, type: 'legal_entity', error: 'Invalid check digit' };
    }
    return { valid: true, type: 'legal_entity' };
  }

  // Natural person: cedula-based RUC
  if (/^\d{6,8}\d$/.test(cleaned)) {
    return { valid: true, type: 'natural_person' };
  }

  return { valid: false, type: 'unknown', error: 'Invalid RUC format' };
}
```

#### 4.2.2 BCP (Banco Central del Paraguay)

**What it is:**
Paraguay's central bank, responsible for monetary policy and financial system regulation. The BCP oversees the SPI (instant payment system) and regulates EMPEs (Entidades de Medio de Pago Electronico) -- Paraguay's framework for electronic payment companies including mobile money operators.

### 4.3 Bolivia

#### 4.3.1 SIN (Servicio de Impuestos Nacionales)

**What it is:**
Bolivia's tax authority, responsible for tax administration, NIT (tax ID) registry, and the SFV (Sistema de Facturacion Virtual) electronic invoicing system.

**Key systems:**

| System | Purpose |
|---|---|
| SFV (Sistema de Facturacion Virtual) | Online invoicing through SIN portal |
| Newton | Tax filing and management portal |
| NIT registry | Taxpayer identification |
| Padron Nacional de Contribuyentes | National taxpayer registry |

**Tax structure:**

| Tax | Rate | Description |
|---|---|---|
| **IVA** | **13%** | Value Added Tax -- **included in the displayed price** (not added on top) |
| **IT** | **3%** | Transaction Tax (Impuesto a las Transacciones) -- on gross revenue |
| **IUE** | **25%** | Corporate income tax (Impuesto sobre las Utilidades de las Empresas) |
| **RC-IVA** | **13%** | Complementary regime to IVA for employment income |

**Critical note on IVA in Bolivia:** Unlike every other country in this document, Bolivia's 13% IVA is **included in the advertised price**, not added on top. This means:
- A product priced at Bs 100 includes Bs 13 of IVA (tax-inclusive price).
- The net price is Bs 87, and the IVA component is Bs 13.
- Kitz must support "tax-inclusive" pricing mode for Bolivia.

```typescript
// Bolivia IVA calculation -- TAX INCLUSIVE
function calculateBoliviaIVA(totalPrice: number): { netPrice: number; iva: number; total: number } {
  const ivaRate = 0.13;
  const netPrice = totalPrice / (1 + ivaRate);   // Back-calculate net from gross
  const iva = totalPrice - netPrice;              // IVA is the difference
  return {
    netPrice: Math.round(netPrice * 100) / 100,
    iva: Math.round(iva * 100) / 100,
    total: totalPrice,                            // Total IS the displayed price
  };
}

// Example: Bs 1,000 product
// -> netPrice: 884.96, iva: 115.04, total: 1000.00
```

**NIT (Numero de Identificacion Tributaria) format:**
- Format: `XXXXXXXXX` (typically 7-10 digits, no check digit exposed)
- Assigned by SIN upon registration

```typescript
function validateNIT_Bolivia(nit: string): { valid: boolean; error?: string } {
  const cleaned = nit.replace(/[\s\-\.]/g, '');

  if (!/^\d{7,10}$/.test(cleaned)) {
    return { valid: false, error: 'NIT must be 7-10 digits' };
  }

  return { valid: true };
}
```

#### 4.3.2 ASFI (Autoridad de Supervision del Sistema Financiero)

**What it is:**
Bolivia's financial regulator, overseeing banks, insurance companies, and payment providers. ASFI is notable for its mandate of QR Simple interoperability (see Section 2.3.1) and its active role in financial inclusion policy. ASFI also regulates interest rates and mandates lending quotas to productive sectors.

**Relevance to Kitz:**
ASFI's regulatory approach is interventionist. If Kitz operates as a financial technology provider in Bolivia, it must carefully assess ASFI registration requirements. The regulator has broad authority and can impose operational requirements on fintech companies.

### 4.4 Venezuela

#### 4.4.1 SENIAT (Servicio Nacional Integrado de Administracion Aduanera y Tributaria)

**What it is:**
Venezuela's tax and customs authority. SENIAT manages the RIF (tax ID), IVA administration, ISLR (income tax), and the evolving electronic invoicing system.

**Key systems:**

| System | Purpose |
|---|---|
| Portal Fiscal SENIAT | Tax filing and management |
| RIF registry | Taxpayer identification |
| Maquina Fiscal | Fiscal cash registers (required for retail) |
| Factura Electronica | Electronic invoicing (being implemented) |

**Tax structure:**

| Tax | Rate | Description |
|---|---|---|
| **IVA** | **16% standard** | Value Added Tax |
| **IVA reduced** | **8%** | Certain goods and services |
| **IVA exempt** | **0%** | Basic food, health, education |
| **ISLR** | **15-34%** | Progressive corporate income tax |
| **IDB** | **2%** | Large Financial Transactions Tax (Impuesto a las Grandes Transacciones Financieras) |

**Critical note on IDB:** The 2% large financial transactions tax applies to bank debits exceeding certain thresholds. This affects payment processing economics -- Kitz must factor IDB into cost calculations for Venezuelan operations.

**RIF (Registro de Informacion Fiscal) format:**
- Format: `X-XXXXXXXX-X` (letter prefix + 8 digits + check digit)
- Prefix: J (legal entity), V (Venezuelan natural person), E (foreign natural person), G (government entity), P (passport holder), C (communal council)

```typescript
function validateRIF_Venezuela(rif: string): { valid: boolean; type: string; error?: string } {
  const cleaned = rif.replace(/[\s\-\.]/g, '').toUpperCase();

  const match = cleaned.match(/^([JVEGPC])(\d{8})(\d)$/);
  if (!match) {
    return { valid: false, type: 'unknown', error: 'Invalid RIF format. Expected: X-XXXXXXXX-X' };
  }

  const [, prefix, body, checkStr] = match;
  const checkDigit = parseInt(checkStr, 10);

  // RIF check digit validation (modulo 11 variant)
  const prefixValues: Record<string, number> = {
    V: 1, E: 2, J: 3, P: 4, G: 5, C: 6,
  };
  const weights = [3, 2, 7, 6, 5, 4, 3, 2];
  let sum = prefixValues[prefix] * 4; // Prefix contributes to check

  for (let i = 0; i < 8; i++) {
    sum += parseInt(body[i], 10) * weights[i];
  }

  const remainder = sum % 11;
  const expectedCheck = remainder > 1 ? 11 - remainder : 0;

  if (checkDigit !== expectedCheck) {
    return { valid: false, type: prefix === 'J' ? 'legal_entity' : 'natural_person', error: 'Invalid check digit' };
  }

  const typeMap: Record<string, string> = {
    J: 'legal_entity',
    V: 'natural_person_venezuelan',
    E: 'natural_person_foreign',
    G: 'government',
    P: 'passport_holder',
    C: 'communal_council',
  };

  return { valid: true, type: typeMap[prefix] || 'unknown' };
}
```

#### 4.4.2 Sudeban (Superintendencia de las Instituciones del Sector Bancario)

**What it is:**
Venezuela's banking regulator. Sudeban oversees all banking operations, sets transaction limits, regulates Pago Movil, and enforces compliance with Venezuelan banking law.

**Key concern for Kitz:** Sudeban's regulations change frequently, often with short notice. Transaction limits, reporting requirements, and operational rules can shift in response to inflation or government policy. Kitz's Venezuelan operations must be designed for regulatory agility.

#### 4.4.3 BCV (Banco Central de Venezuela)

**What it is:**
Venezuela's central bank, responsible for monetary policy, official exchange rates, and currency management. The BCV publishes the official VES/USD exchange rate daily, which is the reference rate for all legal transactions.

**Key concern for Kitz:** The official BCV exchange rate and the parallel/market rate historically diverged significantly. As of 2024-2025, the gap has narrowed under the unified exchange system, but Kitz must always use the BCV official rate for invoicing and tax purposes, even if market transactions occur at different rates.

---

## 5. Invoice Compliance

### 5.1 Uruguay -- CFE (Comprobante Fiscal Electronico)

**System maturity:** Production since 2012 -- the most mature e-invoicing system in this group.

**Overview:**
Uruguay's CFE system requires businesses to issue electronically signed XML documents that are validated by DGI. The system is well-established and has been through multiple iterations. Uruguay was one of the first countries in Latin America to mandate e-invoicing.

**Document types:**

| Code | Type | Kitz Mapping |
|---|---|---|
| 101 | e-Ticket | Standard retail sale (B2C) |
| 102 | e-Ticket Nota de Credito | Credit note against e-Ticket |
| 103 | e-Ticket Nota de Debito | Debit note against e-Ticket |
| 111 | e-Factura | B2B invoice (identified recipient) |
| 112 | e-Factura Nota de Credito | Credit note against e-Factura |
| 113 | e-Factura Nota de Debito | Debit note against e-Factura |
| 121 | e-Factura Exportacion | Export invoice |
| 131 | e-Remito | Delivery note / packing slip |
| 141 | e-Resguardo | Withholding certificate |

**XML structure (simplified):**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CFE version="1.0">
  <eTck>  <!-- or eFact for B2B -->
    <!-- Header (Encabezado) -->
    <Encabezado>
      <IdDoc>
        <TipoCFE>111</TipoCFE>           <!-- Document type -->
        <Serie>A</Serie>                   <!-- Series -->
        <Nro>00000001</Nro>               <!-- Sequential number -->
        <FchEmis>2026-02-24</FchEmis>     <!-- Issue date -->
        <MntBruto>1</MntBruto>            <!-- Prices include tax? 1=yes -->
      </IdDoc>
      <Emisor>
        <RUCEmisor>XXXXXXXXXXXX</RUCEmisor>
        <RznSoc>Business Name S.R.L.</RznSoc>
        <CdgDGISucur>1</CdgDGISucur>     <!-- DGI branch code -->
        <DomFiscal>Address</DomFiscal>
        <Ciudad>Montevideo</Ciudad>
        <Departamento>Montevideo</Departamento>
      </Emisor>
      <Receptor>
        <TipoDocRecep>2</TipoDocRecep>   <!-- 2=RUT -->
        <CodPaisRecep>UY</CodPaisRecep>
        <DocRecep>XXXXXXXXXXXX</DocRecep>  <!-- Recipient RUT -->
        <RznSocRecep>Customer Name</RznSocRecep>
        <DirRecep>Customer Address</DirRecep>
        <CiudadRecep>Montevideo</CiudadRecep>
        <DeptoRecep>Montevideo</DeptoRecep>
      </Receptor>
      <Totales>
        <TpoMoneda>UYU</TpoMoneda>
        <MntNoGrv>0.00</MntNoGrv>         <!-- Non-taxable amount -->
        <MntNetoIVATasaMin>0.00</MntNetoIVATasaMin>  <!-- Net at reduced rate -->
        <MntNetoIVATasaBasica>1000.00</MntNetoIVATasaBasica> <!-- Net at standard rate -->
        <IVATasaMin>10.000</IVATasaMin>    <!-- Reduced IVA rate -->
        <IVATasaBasica>22.000</IVATasaBasica> <!-- Standard IVA rate -->
        <MntIVATasaMin>0.00</MntIVATasaMin>
        <MntIVATasaBasica>220.00</MntIVATasaBasica>
        <MntTotal>1220.00</MntTotal>
        <MntPagar>1220.00</MntPagar>
      </Totales>
    </Encabezado>

    <!-- Line items (Detalle) -->
    <Detalle>
      <Item>
        <NroLinDet>1</NroLinDet>
        <IndFact>3</IndFact>              <!-- 3=taxed at standard rate -->
        <NomItem>Service Description</NomItem>
        <Cantidad>1</Cantidad>
        <UniMed>unit</UniMed>
        <PrecioUnitario>1000.00</PrecioUnitario>
        <MontoItem>1000.00</MontoItem>
      </Item>
    </Detalle>

    <!-- Custom fields (Adenda) -->
    <Adenda>
      <kitz:invoiceId>INV-2026-001</kitz:invoiceId>
      <kitz:workspaceId>ws_abc123</kitz:workspaceId>
    </Adenda>

    <!-- Digital signature -->
    <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
      <!-- X.509 certificate and signature -->
    </ds:Signature>
  </eTck>
</CFE>
```

**CAE (Constancia de Autorizacion de Emision):**
- DGI issues a CAE to authorized e-invoice issuers.
- The CAE authorizes a range of document numbers (e.g., Series A, numbers 1-10000).
- When the range is nearly exhausted, the issuer must request a new CAE from DGI.
- CAE information must be included on the printed/PDF representation of the CFE.

**Adenda (custom fields):**
The CFE schema allows an `<Adenda>` section for custom data that does not affect the fiscal validity of the document. Kitz should use this for internal reference data (workspace ID, internal invoice number, payment link, etc.).

**Digital signature requirements:**
- X.509 certificate issued by a DGI-approved Certificate Authority.
- RSA 2048-bit minimum key length.
- SHA-256 hash algorithm.
- Certificate must be renewed annually.

### 5.2 Paraguay -- SIFEN (Sistema Integrado de Facturacion Electronica)

**System maturity:** Launched 2021, modern and well-designed, progressive rollout by taxpayer segment.

**Overview:**
SIFEN is Paraguay's electronic invoicing system, administered by SET. It is a modern system that was designed with lessons learned from other LatAm countries' implementations. The system uses XML documents with digital signatures, validated by SET's SIFEN platform.

**Document types (DE -- Documento Electronico):**

| Code | Type | Kitz Mapping |
|---|---|---|
| 1 | Factura electronica | Standard invoice |
| 2 | Factura electronica de exportacion | Export invoice |
| 3 | Factura electronica de importacion | Import invoice |
| 4 | Autofactura electronica | Self-billing invoice |
| 5 | Nota de credito electronica | Credit note |
| 6 | Nota de debito electronica | Debit note |
| 7 | Nota de remision electronica | Delivery note |

**Key SIFEN concepts:**

| Term | Description |
|---|---|
| **DE (Documento Electronico)** | The XML electronic document |
| **CDC (Codigo de Control)** | 44-character unique control code for each DE |
| **KuDE** | Printed/PDF representation of the DE (for human consumption) |
| **CSC (Codigo de Seguridad del Contribuyente)** | Taxpayer's security code issued by SET |
| **Timbrado** | Authorization number for invoice issuance (like Uruguay's CAE) |

**CDC (Codigo de Control) structure:**

```typescript
// CDC is a 44-character code with the following structure:
// [2 digit doc type][RUC 8 digits][DV 1 digit][establishment 3][emission point 3]
// [doc number 7][contributor type 1][date 8 YYYYMMDD][emission type 1][security code 10]

function generateCDC(params: {
  docType: string;      // 2 digits (01-07)
  ruc: string;          // 8 digits (without check digit)
  dv: string;           // 1 digit (check digit of RUC)
  establishment: string; // 3 digits (branch/establishment code)
  emissionPoint: string; // 3 digits (POS identifier)
  docNumber: string;    // 7 digits (sequential number)
  contributorType: string; // 1 digit (1=physical, 2=legal)
  date: string;         // 8 digits YYYYMMDD
  emissionType: string; // 1 digit (1=normal, 2=contingency)
}): string {
  const base = [
    params.docType.padStart(2, '0'),
    params.ruc.padStart(8, '0'),
    params.dv,
    params.establishment.padStart(3, '0'),
    params.emissionPoint.padStart(3, '0'),
    params.docNumber.padStart(7, '0'),
    params.contributorType,
    params.date,
    params.emissionType,
  ].join('');

  // Generate security code (10 digits) using HMAC with CSC
  const securityCode = generateSecurityDigit(base);
  return base + securityCode; // Total: 44 characters
}
```

**XML structure (simplified):**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rDE xmlns="http://ekuatia.set.gov.py/sifen/xsd">
  <DE Id="{CDC}">
    <!-- General data -->
    <gOpeDE>
      <iTipEmi>1</iTipEmi>               <!-- 1=Normal -->
      <dDesTipEmi>Normal</dDesTipEmi>
      <dCodSeg>{security_code}</dCodSeg>
    </gOpeDE>

    <!-- Timbrado (authorization) -->
    <gTimb>
      <iTiDE>1</iTiDE>                    <!-- Document type: 1=Invoice -->
      <dEst>001</dEst>                    <!-- Establishment -->
      <dPunExp>001</dPunExp>              <!-- Emission point -->
      <dNumDoc>0000001</dNumDoc>          <!-- Document number -->
      <dNumTim>12345678</dNumTim>         <!-- Timbrado number -->
      <dFeIniT>2026-01-01</dFeIniT>      <!-- Timbrado start date -->
    </gTimb>

    <!-- General document fields -->
    <gDatGralOpe>
      <dFeEmiDE>2026-02-24T10:30:00</dFeEmiDE> <!-- Issue datetime -->

      <!-- Issuer (Emisor) -->
      <gEmis>
        <dRucEm>80012345</dRucEm>
        <dDVEmi>6</dDVEmi>                <!-- Check digit -->
        <dNomEmi>Mi Empresa S.A.</dNomEmi>
        <dDirEmi>Asuncion, Paraguay</dDirEmi>
      </gEmis>

      <!-- Receiver (Receptor) -->
      <gDatRec>
        <iNatRec>1</iNatRec>              <!-- 1=Taxpayer, 2=Non-taxpayer -->
        <dRucRec>80098765</dRucRec>
        <dDVRec>3</dDVRec>
        <dNomRec>Cliente S.R.L.</dNomRec>
      </gDatRec>
    </gDatGralOpe>

    <!-- Line items -->
    <gDtipDE>
      <gCamItem>
        <dDesProSer>Service Description</dDesProSer>
        <dCantProSer>1</dCantProSer>
        <gValorItem>
          <dPUniProSer>500000</dPUniProSer>  <!-- Unit price in PYG -->
          <dTotBruOpeItem>500000</dTotBruOpeItem>
        </gValorItem>
        <gCamIVA>
          <iAfecIVA>1</iAfecIVA>           <!-- 1=Taxed -->
          <dTasaIVA>10</dTasaIVA>          <!-- IVA rate -->
          <dBasGravIVA>454545</dBasGravIVA>
          <dLiqIVAItem>45455</dLiqIVAItem>
        </gCamIVA>
      </gCamItem>
    </gDtipDE>

    <!-- Totals -->
    <gTotSub>
      <dSub10>500000</dSub10>             <!-- Subtotal at 10% -->
      <dTotOpe>500000</dTotOpe>           <!-- Total -->
      <dTotGralOpe>500000</dTotGralOpe>   <!-- Grand total -->
      <dIVA10>45455</dIVA10>              <!-- IVA at 10% -->
      <dTotIVA>45455</dTotIVA>            <!-- Total IVA -->
    </gTotSub>

    <!-- Digital Signature -->
    <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
      <!-- X.509 certificate and signature -->
    </ds:Signature>
  </DE>
</rDE>
```

### 5.3 Bolivia -- SFV (Sistema de Facturacion Virtual)

**System maturity:** Transitional -- moving from online portal-based invoicing to full electronic invoicing.

**Overview:**
Bolivia's invoicing system operates through the SIN's SFV (Sistema de Facturacion Virtual). Currently, many businesses issue invoices through the SIN's online portal rather than through their own systems. The country is gradually transitioning to a more automated electronic invoicing system, but the process is less advanced than Uruguay's or Paraguay's.

**Invoice modalities in Bolivia:**

| Modality | Description | Kitz Relevance |
|---|---|---|
| **Facturacion en Linea** | Online invoicing through SIN portal | Current method for most SMBs |
| **Facturacion Computarizada** | Invoicing through authorized software | Target for Kitz integration |
| **Facturacion Manual** | Pre-printed physical invoices | Legacy, still used by micro businesses |
| **Facturacion Electronica** | Full e-invoicing with XML/digital signatures | Being rolled out |

**Key requirements:**
- **Dosificacion:** SIN assigns an authorization code (numero de autorizacion) for each batch of invoices. This is similar to Uruguay's CAE or Paraguay's Timbrado.
- **NIT validation:** Both issuer and recipient NIT must be validated against SIN's registry.
- **Control code (Codigo de Control):** A verification code calculated from invoice data using a SIN-specified algorithm.
- **QR code:** Required on printed invoices, containing a URL to verify the invoice on SIN's portal.

**Bolivia's unique "Tax Credit" system:**
Consumers in Bolivia can use invoices as tax credits against their RC-IVA (employment income tax). This means consumers actively request invoices (facturas) even for small purchases, creating high invoice volume. Kitz must handle this efficiently.

```typescript
interface BoliviaInvoice {
  nit_emisor: string;                    // Issuer NIT
  razon_social_emisor: string;           // Issuer business name
  numero_factura: number;                // Invoice number
  numero_autorizacion: string;           // SIN authorization number (dosificacion)
  nit_comprador: string;                 // Buyer NIT (or 0 for "sin nombre")
  fecha_emision: string;                 // Issue date
  monto_total: number;                   // Total amount (IVA INCLUDED)
  codigo_control: string;               // SIN control code
  actividad_economica: string;           // Economic activity code
  leyenda: string;                       // Legal disclaimer text (required by SIN)
  // Bolivia-specific: IVA is included in monto_total
  // Debito fiscal (output tax) = monto_total * 13 / 113
}
```

### 5.4 Venezuela -- Factura Fiscal

**System maturity:** Mixed -- mandatory fiscal machines for retail, electronic invoicing being gradually implemented.

**Overview:**
Venezuela's invoicing requirements vary by business type and size. Retail businesses must use fiscal machines (Maquinas Fiscales) registered with SENIAT. The transition to full electronic invoicing is ongoing but not yet universally mandated. The current system is a hybrid of fiscal machines, pre-printed invoices, and electronic invoicing.

**Invoice types:**

| Type | Description | Requirement |
|---|---|---|
| **Factura** | Standard invoice | Must include RIF, sequential number, IVA breakdown |
| **Nota de Debito** | Debit note | For adjustments increasing the original amount |
| **Nota de Credito** | Credit note | For returns, discounts, adjustments |
| **Ticket de Maquina Fiscal** | Fiscal machine receipt | Required for retail operations |

**Mandatory invoice fields:**
- RIF of issuer and buyer
- Sequential invoice number (controlled by SENIAT)
- Issue date
- Description of goods/services
- Unit price, quantity, subtotal per line
- IVA breakdown (16% standard, 8% reduced, 0% exempt)
- Total amount in VES
- Withholding information (if applicable -- IVA withholding for Contribuyentes Especiales)

**Dual currency invoicing challenge:**
Venezuelan SMBs typically need to show both VES and USD amounts on invoices. While VES is the legal currency for tax purposes, customers often want to see the USD equivalent. Kitz must support:

```typescript
interface VenezuelaInvoice {
  rif_emisor: string;                    // Issuer RIF
  rif_comprador: string;                 // Buyer RIF
  numero_factura: string;                // Sequential invoice number
  numero_control: string;               // Control number (SENIAT-assigned range)
  fecha_emision: string;                // Issue date
  // Line items
  items: VenezuelaLineItem[];
  // Totals in VES (legal requirement)
  subtotal_ves: number;
  iva_ves: number;
  total_ves: number;
  // Optional: USD reference amounts (informational only)
  tasa_cambio_bcv: number;              // BCV exchange rate used
  total_usd_referencial?: number;       // USD equivalent (informational)
  // Withholding (if buyer is Contribuyente Especial)
  retencion_iva?: number;               // 75% or 100% IVA withholding
  retencion_islr?: number;              // ISLR withholding if applicable
}
```

### 5.5 E-Invoicing Comparison Across Markets

| Feature | Uruguay (CFE) | Paraguay (SIFEN) | Bolivia (SFV) | Venezuela |
|---|---|---|---|---|
| **Year launched** | 2012 | 2021 | Ongoing | Partial |
| **Maturity** | Very mature | Modern, growing | Transitional | Hybrid |
| **Document format** | XML + digital sig | XML + digital sig | Portal-based / moving to XML | Fiscal machine + manual |
| **Unique code** | CAE + hash | CDC (44 chars) | Codigo de Control | Numero de Control |
| **Tax authority** | DGI | SET | SIN | SENIAT |
| **Mandatory for** | All taxpayers | Progressive rollout | Most formal businesses | Varies by segment |
| **API integration** | Mature | Available | Limited | Very limited |
| **Digital certificate** | Required (X.509) | Required (X.509) | Not yet for most | Not yet for most |
| **Kitz priority** | P0 (first) | P1 (second) | P2 (third) | P3 (future) |

---

## 6. Payment Flow Architecture

### 6.1 Universal Payment Flow (All Four Markets)

```
                        MULTI-MARKET PAYMENT FLOW
                        =========================

  Kitz Workspace Owner                         Customer
        |                                         |
        |  Creates invoice (invoice_create)       |
        |  with country-specific tax logic:       |
        |  - UY: IVA 22%/10% added on top         |
        |  - PY: IVA 10%/5% added on top          |
        |  - BO: IVA 13% included in price        |
        |  - VE: IVA 16% + dual currency          |
        v                                         |
  +-----------------+                             |
  | Invoice         |                             |
  | Generated       |                             |
  | (country-       |                             |
  |  specific XML)  |                             |
  +-----------------+                             |
        |                                         |
        | E-invoice submission:                   |
        | UY -> DGI (CFE)                         |
        | PY -> SET (SIFEN)                       |
        | BO -> SIN (SFV)                         |
        | VE -> SENIAT (when applicable)          |
        |                                         |
        |  Sends via WhatsApp/Email               |
        v                                         v
  +-----------------+                       +-----------+
  | Payment Options | -- Customer selects   | Customer  |
  | (per country)   |    payment method --> | Chooses   |
  +-----------------+                       +-----------+
        |                                         |
        | URUGUAY:                                |
        +-- Mercado Pago QR/Link --------+        |
        +-- OCA / Visa / MC card --------+        |
        +-- Abitab/RedPagos cash --------+        |
        +-- Bank transfer (BROU) --------+        |
        |                                |        |
        | PARAGUAY:                      |        |
        +-- Tigo Money ------------------+        |
        +-- Bancard vPOS (cards) --------+        |
        +-- Personal Money --------------+        |
        +-- Bank transfer ---------------+        |
        |                                |        |
        | BOLIVIA:                       |        |
        +-- QR Simple (interoperable) ---+        |
        +-- Tigo Money Bolivia ----------+        |
        +-- Bank transfer ---------------+        |
        |                                |        |
        | VENEZUELA:                     |        |
        +-- Pago Movil (VES) ------------+        |
        +-- Zelle (USD) -----------------+        |
        +-- Binance/USDT ----------------+        |
        +-- Bank transfer (VES) ---------+        |
        |                                v        |
        |                          +-----------+  |
        |                          | Payment   |  |
        |                          | Processed |  |
        |                          +-----------+  |
        |                                |        |
        v                                v        |
  +-----------+                    +-----------+  |
  | Webhook / |  <-- Provider      | Provider  |  |
  | Manual    |     callback or    | Confirms  |  |
  | Confirm   |     manual entry   | (or SMB   |  |
  +-----------+                    |  verifies)|  |
        |                          +-----------+  |
        v                                         |
  +-------------------------+                     |
  | payments_processWebhook |                     |
  | (paymentTools.ts)       |                     |
  +-------------------------+                     |
        |                                         |
        +-- Invoice status -> 'paid'              |
        +-- CRM contact updated                   |
        +-- WhatsApp receipt sent --------------->|
        +-- Revenue dashboard updated             |
        +-- Tax ledger updated (IVA/IT/ISLR)      |
        +-- Exchange rate recorded (VE only)       |
```

### 6.2 Provider Enum Extension

```typescript
// Current paymentTools.ts provider enum (Panama):
// provider: { type: 'string', enum: ['stripe', 'paypal', 'yappy', 'bac'] }

// Extended for all four markets:
type PaymentProvider =
  // Panama (existing)
  | 'yappy'
  | 'bac'
  // Uruguay
  | 'mercadopago_uy'
  | 'oca'
  | 'abitab'
  | 'redpagos'
  // Paraguay
  | 'tigo_money_py'
  | 'personal_money'
  | 'bancard'
  // Bolivia
  | 'qr_simple'
  | 'tigo_money_bo'
  // Venezuela
  | 'pago_movil'
  | 'zelle'
  | 'binance_usdt'
  // International
  | 'stripe'
  | 'paypal'
  | 'manual'; // For manual payment confirmation (screenshots, bank statements)

// Payment method metadata
interface PaymentMethodConfig {
  provider: PaymentProvider;
  country: 'UY' | 'PY' | 'BO' | 'VE' | 'PA' | 'INTL';
  currency: 'UYU' | 'PYG' | 'BOB' | 'VES' | 'USD' | 'USDT';
  automatedReconciliation: boolean;
  webhookSupported: boolean;
  settlementTime: string;
  kitzPriority: 'P0' | 'P1' | 'P2' | 'P3';
}

const PAYMENT_METHODS: Record<PaymentProvider, PaymentMethodConfig> = {
  mercadopago_uy: {
    provider: 'mercadopago_uy',
    country: 'UY',
    currency: 'UYU',
    automatedReconciliation: true,
    webhookSupported: true,
    settlementTime: 'T+1 to T+14 (configurable)',
    kitzPriority: 'P0',
  },
  tigo_money_py: {
    provider: 'tigo_money_py',
    country: 'PY',
    currency: 'PYG',
    automatedReconciliation: true,
    webhookSupported: true,
    settlementTime: 'T+1',
    kitzPriority: 'P0',
  },
  qr_simple: {
    provider: 'qr_simple',
    country: 'BO',
    currency: 'BOB',
    automatedReconciliation: true,
    webhookSupported: true,
    settlementTime: 'Instant to T+1',
    kitzPriority: 'P0',
  },
  pago_movil: {
    provider: 'pago_movil',
    country: 'VE',
    currency: 'VES',
    automatedReconciliation: false,
    webhookSupported: false,
    settlementTime: 'Instant (but manual verification)',
    kitzPriority: 'P1',
  },
  zelle: {
    provider: 'zelle',
    country: 'VE',
    currency: 'USD',
    automatedReconciliation: false,
    webhookSupported: false,
    settlementTime: 'Instant (but manual verification)',
    kitzPriority: 'P1',
  },
  // ... remaining providers follow same pattern
} as Record<PaymentProvider, PaymentMethodConfig>;
```

### 6.3 Venezuela Dual-Currency Payment Flow (Detailed)

```
                  VENEZUELA DUAL CURRENCY FLOW
                  ============================

  Invoice Created:
  +-------------------------------------------+
  | FACTURA #VE-2026-0042                     |
  | RIF Emisor: J-12345678-9                  |
  |                                           |
  | Servicio de Consultoria      VES 5,000.00 |
  | IVA (16%)                    VES   800.00 |
  | TOTAL                        VES 5,800.00 |
  |                                           |
  | --- Referencia en USD ---                 |
  | Tasa BCV: 36.50 Bs/USD                   |
  | Equivalente: USD 158.90                   |
  |                                           |
  | FORMAS DE PAGO:                           |
  | 1. Pago Movil: 0412-1234567              |
  |    CI: V-12345678, Banco: 0134 (Banesco) |
  | 2. Zelle: pagos@miempresa.com            |
  |    Monto USD: $158.90                     |
  | 3. USDT (TRC-20): TXyz...abc             |
  |    Monto: 158.90 USDT                    |
  +-------------------------------------------+
        |
        v
  Customer chooses payment method:
        |
        +--[Pago Movil]----> Pays VES 5,800.00
        |                    -> Sends screenshot via WhatsApp
        |                    -> SMB verifies in bank app
        |                    -> Kitz: manual confirmation
        |
        +--[Zelle]---------> Pays USD 158.90
        |                    -> Sends Zelle confirmation
        |                    -> SMB verifies in Zelle account
        |                    -> Kitz: manual confirmation
        |                    -> Records BCV rate used
        |
        +--[USDT]----------> Pays 158.90 USDT
                             -> Transaction hash provided
                             -> Kitz verifies on blockchain
                             -> Kitz: auto or manual confirmation
                             -> Records USDT/USD rate (approx 1:1)
```

---

## 7. Currency & Localization

### 7.1 Currency Handling

| Country | Currency | Code | Symbol | Decimals | Notes |
|---|---|---|---|---|---|
| **Uruguay** | Peso uruguayo | UYU | $ | 2 | Use `$U` to disambiguate from USD |
| **Paraguay** | Guarani | PYG | ₲ | **0** | NO decimal places, large numbers |
| **Bolivia** | Boliviano | BOB | Bs | 2 | Soft peg to USD |
| **Venezuela** | Bolivar digital | VES | Bs.D | 2 | Frequent redenominations, de facto dollarization |

### 7.2 Paraguay -- Large Denomination Handling

Paraguay's Guarani (PYG) trades at approximately 7,500 PYG per 1 USD. This creates unique challenges:

```typescript
// PROBLEM: JavaScript number precision for PYG amounts
// A $1,000 USD invoice = ~7,500,000 PYG
// A $100,000 USD invoice = ~750,000,000 PYG
// JavaScript Number.MAX_SAFE_INTEGER = 9,007,199,254,740,991 -- OK for PYG
// BUT: floating point issues exist with intermediate calculations

// SOLUTION: Integer arithmetic for PYG (no decimals ever)
function formatPYG(amount: number): string {
  // PYG never has decimal places
  const rounded = Math.round(amount);
  // Format with thousands separator (period in Paraguay)
  return '₲ ' + rounded.toLocaleString('es-PY');
  // Example: ₲ 7.500.000
}

// Currency conversion: USD to PYG
function usdToPYG(usdAmount: number, rate: number): number {
  return Math.round(usdAmount * rate); // Always round to integer
}

// INVOICE TOTAL CALCULATION for Paraguay
function calculateParaguayInvoice(items: Array<{ price: number; qty: number; ivaRate: number }>) {
  let subtotal = 0;
  let totalIva = 0;

  for (const item of items) {
    const lineTotal = Math.round(item.price * item.qty);
    const lineIva = Math.round(lineTotal * item.ivaRate / (1 + item.ivaRate));
    // Paraguay IVA is calculated as tax-inclusive by convention in SIFEN
    subtotal += lineTotal;
    totalIva += lineIva;
  }

  return {
    subtotal,    // Integer PYG
    totalIva,    // Integer PYG
    total: subtotal, // Same as subtotal (IVA is included per SIFEN)
  };
}

// DISPLAY EXAMPLES:
// ₲ 500.000     (approx $67 USD)
// ₲ 7.500.000   (approx $1,000 USD)
// ₲ 75.000.000  (approx $10,000 USD)
```

**Number formatting conventions for Paraguay:**
- Thousands separator: period (`.`)
- No decimal separator (no decimals)
- Symbol: `₲` before the number with a space
- Example: `₲ 1.500.000`

### 7.3 Venezuela -- Redenomination History and Handling

Venezuela has redenominated its currency multiple times:

| Date | Change | Name | Zeros Removed |
|---|---|---|---|
| 2008 | VEB -> VEF | Bolivar fuerte | 3 zeros |
| 2018 | VEF -> VES | Bolivar soberano | 5 zeros |
| 2021 | VES -> VED (Bolivar digital) | Bolivar digital | 6 zeros |
| **Total** | | | **14 zeros removed** |

**Implications for Kitz:**

```typescript
// Venezuela currency handling
interface VenezuelaCurrencyConfig {
  // Current currency
  code: 'VES'; // ISO code remains VES even after "digital" rebranding
  symbol: 'Bs.D';
  decimals: 2;
  // BCV exchange rate (updated daily)
  bcvRate: number; // VES per 1 USD
  bcvRateDate: string; // Date of the rate
  // Display
  thousandsSeparator: '.';
  decimalSeparator: ',';
}

function formatVES(amount: number): string {
  // Format: Bs.D 1.234,56
  const parts = amount.toFixed(2).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Bs.D ${intPart},${parts[1]}`;
}

function formatDualCurrency(vesAmount: number, bcvRate: number): string {
  const usdAmount = vesAmount / bcvRate;
  return `${formatVES(vesAmount)} (Ref. USD ${usdAmount.toFixed(2)})`;
}

// BCV rate fetching (daily update needed)
async function fetchBCVRate(): Promise<{ rate: number; date: string }> {
  // BCV publishes daily exchange rates
  // In practice, this may require scraping or a third-party API
  // (BCV does not provide a reliable public API)
  // Options: bcv.org.ve, or third-party services like exchangerate.host
  throw new Error('Implement BCV rate fetching -- consider third-party API');
}

// CRITICAL: Store the BCV rate used for each invoice
// This is required for tax compliance -- SENIAT audits check
// that invoiced amounts match the BCV rate on the invoice date
interface VenezuelaInvoiceRateRecord {
  invoiceId: string;
  invoiceDate: string;
  bcvRate: number;
  bcvRateDate: string;
  totalVES: number;
  totalUSDRef: number; // Referential only
}
```

### 7.4 Uruguay -- UI (Unidad Indexada) for Inflation-Indexed Contracts

Uruguay uses a unique inflation-indexed unit called the UI (Unidad Indexada) for long-term contracts, leases, and financial instruments. The UI value is updated daily by the INE (Instituto Nacional de Estadistica) based on CPI data.

```typescript
// UI is used for rent contracts, loan payments, and some B2B agreements
// Kitz should support UI-denominated invoicing for Uruguay

interface UIConversion {
  uiValue: number;    // Current UI value in UYU (e.g., 6.1234)
  date: string;       // Date of the UI value
  source: 'INE';      // Instituto Nacional de Estadistica
}

function uiToUYU(uiAmount: number, uiValue: number): number {
  return Math.round(uiAmount * uiValue * 100) / 100;
}

// Example: Rent of 10,000 UI at UI value 6.1234
// = 10,000 * 6.1234 = UYU 61,234.00
```

### 7.5 Localization Summary

| Aspect | Uruguay | Paraguay | Bolivia | Venezuela |
|---|---|---|---|---|
| **Date format (display)** | DD/MM/YYYY | DD/MM/YYYY | DD/MM/YYYY | DD/MM/YYYY |
| **Date format (XML)** | YYYY-MM-DD | YYYY-MM-DDTHH:mm:ss | YYYY-MM-DD | DD/MM/YYYY |
| **Thousands sep** | `.` | `.` | `.` | `.` |
| **Decimal sep** | `,` | N/A (no decimals) | `,` | `,` |
| **Phone country code** | +598 | +595 | +591 | +58 |
| **Mobile format** | +598 9X XXX XXX | +595 9XX XXX XXX | +591 6XXXXXXX / 7XXXXXXX | +58 412-XXXXXXX |
| **Language** | Spanish (Rioplatense) | Spanish + Guarani | Spanish + Quechua/Aymara | Spanish (Caribbean) |
| **Currency display** | `$U 1.234,56` | `₲ 1.500.000` | `Bs 1.234,56` | `Bs.D 1.234,56` |

### 7.6 Phone Number Validation

```typescript
const PHONE_PATTERNS: Record<string, { mobile: RegExp; format: string }> = {
  UY: {
    mobile: /^\+?598\s?9\d\s?\d{3}\s?\d{3}$/,
    format: '+598 9X XXX XXX',
  },
  PY: {
    mobile: /^\+?595\s?9\d{2}\s?\d{3}\s?\d{3}$/,
    format: '+595 9XX XXX XXX',
  },
  BO: {
    mobile: /^\+?591\s?[67]\d{7}$/,
    format: '+591 6XXXXXXX or 7XXXXXXX',
  },
  VE: {
    mobile: /^\+?58\s?4(12|14|16|24|26)\s?\d{7}$/,
    format: '+58 4XX-XXXXXXX',
  },
};

function toWhatsAppFormat(phone: string, country: string): string {
  // Strip all non-digits except leading +
  const cleaned = phone.replace(/[\s\-\(\)]/g, '').replace(/^\+/, '');
  // WhatsApp format: country code + number, no symbols
  return cleaned;
}

// Examples:
// UY: "+598 94 123 456" -> "59894123456"
// PY: "+595 981 234 567" -> "595981234567"
// BO: "+591 71234567" -> "59171234567"
// VE: "+58 412-1234567" -> "584121234567"
```

---

## 8. Competitive Landscape

### 8.1 Uruguay

| Competitor | Strengths | Weaknesses | Kitz Differentiator |
|---|---|---|---|
| **GestionaFacil** | Uruguay-native, SMB-focused, DGI CFE compliance | Limited AI, no WhatsApp integration, basic UX | AI-native, WhatsApp-first, modern UX |
| **dLocal** | HQ in Uruguay, global payment processing | Enterprise-focused, not an SMB tool | Different segment -- dLocal is infrastructure, Kitz is application |
| **Alegra** | Multi-country LatAm, e-invoicing in UY | Generic, not Uruguay-specialized, no AI | Uruguay-first localizations, AI assistant |
| **Contabilium** | Accounting + invoicing, CFE compliant | Accounting-centric, complex UI for micro SMBs | Simpler, business-OS approach vs accounting software |
| **Mercado Libre/Shops** | Massive platform, integrated payments | E-commerce only, no CRM/invoicing for services | Full business OS for service + product businesses |

### 8.2 Paraguay

| Competitor | Strengths | Weaknesses | Kitz Differentiator |
|---|---|---|---|
| **Facturasend** | SIFEN-compliant, Paraguay-native | Invoicing-only, no CRM or payment integration | Full business OS |
| **Tessera** | SIFEN e-invoicing | Limited scope, no AI features | AI-powered, integrated payments |
| **Alegra** | Multi-country presence | Not Paraguay-specialized | Deeper SIFEN integration, local payment methods |
| **ContaFlex** | Accounting focused, local presence | Traditional UX, limited digital payments | Modern, mobile-first, AI-native |

### 8.3 Bolivia

| Competitor | Strengths | Weaknesses | Kitz Differentiator |
|---|---|---|---|
| **Monica (software)** | Widely used accounting software in Bolivia | Desktop-only, no cloud, no mobile | Cloud-native, mobile-first |
| **Alegra** | Multi-country, cloud-based | Limited Bolivia localization | Bolivia-specific SIN integration |
| **Local accounting firms** | Personal service, trusted | Not scalable, expensive per-client | Self-service with AI assistance |

The Bolivia market has very limited competition from modern SaaS tools -- most SMBs use desktop accounting software, Excel, or manual bookkeeping.

### 8.4 Venezuela

| Competitor | Strengths | Weaknesses | Kitz Differentiator |
|---|---|---|---|
| **Profit Plus** | Dominant accounting software in Venezuela | Desktop-based, expensive licenses, no cloud | Cloud-native, accessible, AI-powered |
| **AdminPAQ / CONTPAQi** | Known brand, accounting features | Mexican software, limited VE localization | Built for Venezuelan reality (dual currency, Pago Movil) |
| **Odoo** | Open source, customizable | Requires technical setup, not VE-specialized | Turnkey, AI-native, WhatsApp-integrated |
| **Google Sheets/WhatsApp** | Free, ubiquitous, "good enough" | Not scalable, no compliance, no automation | The upgrade path from manual tools |

**Key insight:** In Venezuela, Kitz's primary competitor is not another software product -- it is the combination of WhatsApp + Google Sheets + manual processes that most SMBs use today. Kitz must position itself as the natural upgrade from this "manual stack."

---

## 9. Implementation Roadmap

### Phase 1: Uruguay Launch (Q2-Q3 2026)

| Priority | Task | Country | Status |
|---|---|---|---|
| P0 | Mercado Pago Uruguay integration (OAuth + IPN) | UY | Not started |
| P0 | CFE e-invoicing integration (DGI compliance) | UY | Not started |
| P0 | RUT validation for workspace onboarding | UY | Not started |
| P0 | IVA 22%/10%/0% multi-rate calculation | UY | Not started |
| P1 | UYU currency formatting (`$U 1.234,56`) | UY | Not started |
| P1 | OCA card acceptance via Mercado Pago | UY | Not started |
| P1 | Abitab/RedPagos cash payment vouchers | UY | Not started |
| P2 | UI (Unidad Indexada) support for contracts | UY | Not started |
| P2 | BPS contribution calculations | UY | Not started |
| P2 | IRAE income tax pre-filing report | UY | Not started |

### Phase 2: Paraguay Launch (Q3-Q4 2026)

| Priority | Task | Country | Status |
|---|---|---|---|
| P0 | SIFEN e-invoicing integration (SET compliance) | PY | Not started |
| P0 | Tigo Money payment integration | PY | Not started |
| P0 | RUC validation for workspace onboarding | PY | Not started |
| P0 | PYG integer currency handling (no decimals) | PY | Not started |
| P1 | CDC generation for SIFEN documents | PY | Not started |
| P1 | KuDE (printed DE representation) generation | PY | Not started |
| P1 | Bancard vPOS integration for card payments | PY | Not started |
| P2 | Personal Money integration | PY | Not started |
| P2 | IRE/IRP tax calculation | PY | Not started |

### Phase 3: Bolivia Entry (Q1-Q2 2027)

| Priority | Task | Country | Status |
|---|---|---|---|
| P0 | SFV integration (SIN invoicing) | BO | Not started |
| P0 | QR Simple payment integration | BO | Not started |
| P0 | NIT validation for workspace onboarding | BO | Not started |
| P0 | Tax-inclusive IVA mode (13% included) | BO | Not started |
| P1 | Tigo Money Bolivia integration | BO | Not started |
| P1 | IT (3% transactions tax) calculation | BO | Not started |
| P2 | Codigo de Control generation for invoices | BO | Not started |
| P2 | ASFI compliance assessment | BO | Not started |

### Phase 4: Venezuela Assessment (Q3 2027+)

| Priority | Task | Country | Status |
|---|---|---|---|
| P0 | Legal and sanctions compliance assessment | VE | Not started |
| P0 | Dual currency architecture (VES + USD) | VE | Not started |
| P0 | RIF validation for workspace onboarding | VE | Not started |
| P0 | BCV exchange rate integration | VE | Not started |
| P1 | Pago Movil manual payment confirmation flow | VE | Not started |
| P1 | Zelle manual payment confirmation flow | VE | Not started |
| P1 | IVA 16%/8%/0% multi-rate calculation | VE | Not started |
| P2 | USDT/crypto payment option | VE | Not started |
| P2 | SENIAT e-invoicing (when mandated) | VE | Not started |
| P3 | Automated Pago Movil reconciliation (if APIs become available) | VE | Not started |

### Cross-Market Infrastructure

| Priority | Task | Timeline | Status |
|---|---|---|---|
| P0 | Multi-country tax engine (per-country IVA logic) | Q2 2026 | Not started |
| P0 | Multi-currency support in paymentTools.ts | Q2 2026 | Not started |
| P0 | Country-specific tax ID validation library | Q2 2026 | Not started |
| P1 | Unified e-invoicing abstraction layer | Q3 2026 | Not started |
| P1 | Exchange rate service (BCU, BCP, BCB, BCV) | Q3 2026 | Not started |
| P2 | Multi-country tax reporting dashboard | Q4 2026 | Not started |

---

## 10. Compliance Checklist for Launch

### 10.1 Uruguay

#### Legal & Regulatory
- [ ] BCU (Banco Central) fintech registration assessment completed
- [ ] Financial Inclusion Law (19.210) compliance reviewed
- [ ] Privacy policy updated for Uruguayan data protection (Law 18.331)
- [ ] Terms of service reviewed by Uruguayan attorney
- [ ] CFE issuer authorization obtained from DGI

#### Tax Compliance
- [ ] IVA calculation supports 22% standard, 10% reduced, 0% exempt
- [ ] RUT validation implemented (12-digit with modulo 11 check)
- [ ] CFE XML generation follows DGI schema
- [ ] Digital certificate obtained for CFE signing
- [ ] CAE (authorization for invoice numbering range) obtained
- [ ] BPS contribution calculation for payroll scenarios
- [ ] IRAE pre-filing report generation

#### Payment Processing
- [ ] Mercado Pago merchant account active
- [ ] Mercado Pago IPN webhook receiver tested
- [ ] OCA card acceptance verified through Mercado Pago
- [ ] Abitab/RedPagos partnership assessed

### 10.2 Paraguay

#### Legal & Regulatory
- [ ] BCP fintech registration assessment (EMPE framework)
- [ ] SET SIFEN enrollment for Kitz as software provider
- [ ] Privacy policy updated for Paraguayan requirements
- [ ] Terms of service reviewed by Paraguayan attorney

#### Tax Compliance
- [ ] IVA calculation supports 10% standard, 5% reduced
- [ ] RUC validation implemented (modulo 11 check digit)
- [ ] SIFEN XML generation follows SET schema
- [ ] Digital certificate obtained for SIFEN signing
- [ ] Timbrado (authorization) obtained for invoice ranges
- [ ] CDC (44-char control code) generation implemented
- [ ] KuDE (printed representation) template created

#### Payment Processing
- [ ] Tigo Money merchant agreement active
- [ ] Tigo Money webhook receiver tested
- [ ] Bancard vPOS merchant registration
- [ ] PYG integer-only currency handling verified

### 10.3 Bolivia

#### Legal & Regulatory
- [ ] ASFI registration assessment completed
- [ ] SIN authorization for computerized invoicing (facturacion computarizada)
- [ ] Privacy and compliance review by Bolivian attorney

#### Tax Compliance
- [ ] IVA tax-inclusive mode implemented (13% included in price)
- [ ] IT (3% transactions tax) calculation implemented
- [ ] NIT validation implemented
- [ ] SFV integration for invoice submission
- [ ] Dosificacion (authorization) obtained from SIN
- [ ] Codigo de Control generation algorithm implemented

#### Payment Processing
- [ ] QR Simple acquiring bank partnership established
- [ ] QR Simple payment flow tested
- [ ] Tigo Money Bolivia merchant agreement

### 10.4 Venezuela

#### Legal & Regulatory (CRITICAL)
- [ ] **International sanctions compliance review** (US OFAC, EU sanctions)
- [ ] Sudeban assessment -- determine if Kitz can operate in Venezuelan banking
- [ ] SENIAT registration requirements reviewed
- [ ] Legal counsel engaged (must have Venezuela-specific expertise)
- [ ] **Sanctions risk:** Determine if any Kitz investors, partners, or service providers trigger sanctions issues
- [ ] Data residency requirements assessed

#### Tax Compliance
- [ ] IVA calculation supports 16% standard, 8% reduced, 0% exempt
- [ ] RIF validation implemented (with check digit)
- [ ] Dual currency invoicing (VES legal + USD reference)
- [ ] BCV exchange rate integration for daily rates
- [ ] IDB (2% large transaction tax) factored into cost models
- [ ] IVA withholding support (for Contribuyentes Especiales)

#### Payment Processing
- [ ] Pago Movil manual confirmation flow built
- [ ] Zelle manual confirmation flow built
- [ ] USDT payment option assessed (legal review)
- [ ] Dual currency payment reconciliation working
- [ ] Exchange rate recording per transaction

#### Operational Risk
- [ ] System designed for frequent regulatory changes
- [ ] Transaction limit monitoring (Sudeban limits change frequently)
- [ ] Backup payment methods for bank system outages
- [ ] Price control compliance (if applicable to Kitz's customers' industries)

---

## 11. Partnership Opportunities

### 11.1 Uruguay

| Partner | Type | Value to Kitz | Approach |
|---|---|---|---|
| **Mercado Pago UY** | Payment infrastructure | Dominant payment platform, OAuth + IPN API | Developer program registration |
| **BROU (Banco Republica)** | Banking | Largest bank, most SMBs have accounts | Partnership for SMB referrals |
| **AGESIC** | Government digital agency | Government digital transformation programs | Position as digital SMB solution |
| **CIU (Camara de Industrias)** | Industry association | Access to SMB members, credibility | Member benefit partnership |
| **Zonamerica / WTC Free Trade Zone** | Tech hub | Access to tech companies, startup ecosystem | Partnership for freezone businesses |
| **ANII (Innovation Agency)** | Government | Innovation grants, R&D tax credits | Apply for innovation funding for Kitz |

### 11.2 Paraguay

| Partner | Type | Value to Kitz | Approach |
|---|---|---|---|
| **Tigo Paraguay** | Payment infrastructure | Tigo Money integration, distribution | Merchant integration program |
| **Vision Banco** | Microfinance bank | SMB customer base, microloans | Bundle Kitz with SMB lending products |
| **SET** | Tax authority | SIFEN certification, compliance validation | Register as certified SIFEN software |
| **REDIEX** | Export/investment agency | Access to exporting SMBs | Partnership for export-oriented businesses |
| **UIP (Union Industrial Paraguaya)** | Industry association | SMB member access | Member benefit partnership |

### 11.3 Bolivia

| Partner | Type | Value to Kitz | Approach |
|---|---|---|---|
| **BancoSol** | Microfinance bank | Pioneer in microfinance, huge SMB portfolio | Bundle Kitz with microloans |
| **Banco FIE** | Microfinance bank | SMB-focused lending | Similar to BancoSol approach |
| **Fundacion INFOCAL** | Training organization | SMB training programs, digital literacy | Integration into training curriculum |
| **SIN** | Tax authority | Invoicing authorization, compliance | Register as authorized invoicing software |

### 11.4 Venezuela

| Partner | Type | Value to Kitz | Approach |
|---|---|---|---|
| **Banesco** | Private bank | Largest private bank, strong digital | Explore merchant services partnership |
| **Mercantil** | Private bank | Strong digital banking platform | Pago Movil integration |
| **Venezuelan diaspora networks** | Distribution | Entrepreneurs abroad supporting family businesses | Target diaspora as early adopters |
| **FEDECAMARAS** | Business federation | National business association | Member benefit partnership |

**Venezuela partnership caveat:** All partnerships must be reviewed for international sanctions compliance before initiation. Certain Venezuelan state entities, banks, and individuals are under US/EU sanctions.

---

## 12. Appendix: Reference Links

### Uruguay

**Government & Tax:**
- DGI (tax authority): https://www.dgi.gub.uy
- DGI e-invoicing (CFE): https://efactura.dgi.gub.uy
- BCU (central bank): https://www.bcu.gub.uy
- BPS (social security): https://www.bps.gub.uy
- AGESIC (digital government): https://www.gub.uy/agencia-gobierno-electronico-sociedad-informacion-conocimiento/

**Banking:**
- BROU: https://www.brou.com.uy
- Santander Uruguay: https://www.santander.com.uy
- Itau Uruguay: https://www.itau.com.uy

**Payment Systems:**
- Mercado Pago Uruguay: https://www.mercadopago.com.uy
- Mercado Pago Developers: https://www.mercadopago.com.uy/developers
- Prex: https://www.prexcard.com
- OCA: https://www.oca.com.uy
- Abitab: https://www.abitab.com.uy
- RedPagos: https://www.redpagos.com.uy

**Regulatory:**
- Financial Inclusion Law 19.210 (2014)
- Data Protection Law 18.331
- E-invoicing regulations: DGI Resolutions

### Paraguay

**Government & Tax:**
- SET (tax authority): https://www.set.gov.py
- SIFEN: https://ekuatia.set.gov.py
- BCP (central bank): https://www.bcp.gov.py
- Marangatu (tax portal): https://marangatu.set.gov.py

**Banking:**
- Itau Paraguay: https://www.itau.com.py
- BBVA Paraguay: https://www.bbva.com.py
- Vision Banco: https://www.visionbanco.com
- Banco Continental: https://www.continental.com.py

**Payment Systems:**
- Tigo Money: https://www.tigo.com.py/tigo-money
- Bancard: https://www.bancard.com.py
- Personal Money: https://www.personal.com.py

**Regulatory:**
- SIFEN Technical Documentation: https://ekuatia.set.gov.py/portal/sifen
- BCP EMPE regulations

### Bolivia

**Government & Tax:**
- SIN (tax authority): https://www.impuestos.gob.bo
- ASFI (financial regulator): https://www.asfi.gob.bo
- BCB (central bank): https://www.bcb.gob.bo
- SFV (invoicing): https://siat.impuestos.gob.bo

**Banking:**
- Banco Union: https://www.bancounion.com.bo
- BNB: https://www.bnb.com.bo
- Banco Mercantil Santa Cruz: https://www.bmsc.com.bo
- BancoSol: https://www.bancosol.com.bo

**Payment Systems:**
- QR Simple (ASFI): Integrated through participating banks
- Tigo Money Bolivia: https://www.tigo.com.bo/tigo-money

### Venezuela

**Government & Tax:**
- SENIAT: http://www.seniat.gob.ve
- Sudeban: http://www.sudeban.gob.ve
- BCV (central bank): https://www.bcv.org.ve
- BCV exchange rates: https://www.bcv.org.ve/estadisticas/tipo-cambio

**Banking:**
- Banco de Venezuela: https://www.bancodevenezuela.com
- Banesco: https://www.banesco.com
- Mercantil: https://www.mercantilbanco.com
- BBVA Provincial: https://www.provincial.com

**Payment Systems:**
- Pago Movil: Through individual bank apps (no central portal)
- Zelle: https://www.zellepay.com (US-based, used informally in Venezuela)

### Market Intelligence & Regulatory References

**Uruguay:**
- dLocal (HQ in Uruguay): https://dlocal.com
- Uruguay fintech ecosystem: Fintech Hub Montevideo
- Zonamerica Free Trade Zone: https://www.zonamerica.com

**Paraguay:**
- Maquila Regime: Law 1064/1997
- SIFEN Rollout Schedule: SET resolutions
- REDIEX: https://www.rediex.gov.py

**Bolivia:**
- QR Simple regulations: ASFI Circular
- SFV regulations: SIN Resolution
- Financial inclusion: ASFI mandates

**Venezuela:**
- BCV official exchange rate methodology
- OFAC sanctions list: https://www.treasury.gov/resource-center/sanctions/Programs/pages/venezuela.aspx
- Currency redenomination history: BCV publications
- Crypto adoption data: Chainalysis Global Crypto Adoption Index

### Kitz Codebase References
- Payment tools: `kitz_os/src/tools/paymentTools.ts`
- Invoice/quote tools: `kitz_os/src/tools/invoiceQuoteTools.ts`
- Invoice workflow: `kitz_os/data/n8n-workflows/invoice-auto-generate.json`
- Panama infrastructure doc: `docs/intelligence/PANAMA_INFRASTRUCTURE.md`

---

## Appendix A: Tax ID Validation — Unified Library

```typescript
// Unified tax ID validation for all four markets + Panama

type Country = 'PA' | 'UY' | 'PY' | 'BO' | 'VE';

interface TaxIdValidation {
  valid: boolean;
  country: Country;
  type: string;
  formatted: string;
  error?: string;
}

function validateTaxId(taxId: string, country: Country): TaxIdValidation {
  const cleaned = taxId.replace(/[\s]/g, '').toUpperCase();

  switch (country) {
    case 'UY':
      return validateRUT_Uruguay_Full(cleaned);
    case 'PY':
      return validateRUC_Paraguay_Full(cleaned);
    case 'BO':
      return validateNIT_Bolivia_Full(cleaned);
    case 'VE':
      return validateRIF_Venezuela_Full(cleaned);
    case 'PA':
      return validateRUC_Panama_Full(cleaned);
    default:
      return { valid: false, country, type: 'unknown', formatted: cleaned, error: 'Unsupported country' };
  }
}

function validateRUT_Uruguay_Full(rut: string): TaxIdValidation {
  const cleaned = rut.replace(/[\-\.]/g, '');
  if (!/^\d{12}$/.test(cleaned)) {
    return { valid: false, country: 'UY', type: 'unknown', formatted: rut, error: 'RUT must be 12 digits' };
  }
  const digits = cleaned.split('').map(Number);
  const weights = [4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 11; i++) sum += digits[i] * weights[i];
  const remainder = sum % 11;
  const checkDigit = remainder <= 1 ? 0 : 11 - remainder;
  if (checkDigit !== digits[11]) {
    return { valid: false, country: 'UY', type: 'legal_entity', formatted: cleaned, error: 'Invalid check digit' };
  }
  return { valid: true, country: 'UY', type: 'legal_entity', formatted: cleaned };
}

function validateRUC_Paraguay_Full(ruc: string): TaxIdValidation {
  const cleaned = ruc.replace(/[\-\.]/g, '');
  if (!/^\d{7,9}$/.test(cleaned)) {
    return { valid: false, country: 'PY', type: 'unknown', formatted: ruc, error: 'RUC must be 7-9 digits' };
  }
  const body = cleaned.slice(0, -1);
  const providedCheck = parseInt(cleaned.slice(-1), 10);
  let sum = 0;
  let weight = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * weight;
    weight++;
    if (weight > 11) weight = 2;
  }
  const remainder = sum % 11;
  const expectedCheck = remainder <= 1 ? 0 : 11 - remainder;
  const type = cleaned.startsWith('80') ? 'legal_entity' : 'natural_person';
  if (providedCheck !== expectedCheck) {
    return { valid: false, country: 'PY', type, formatted: cleaned, error: 'Invalid check digit' };
  }
  return { valid: true, country: 'PY', type, formatted: cleaned };
}

function validateNIT_Bolivia_Full(nit: string): TaxIdValidation {
  const cleaned = nit.replace(/[\-\.]/g, '');
  if (!/^\d{7,10}$/.test(cleaned)) {
    return { valid: false, country: 'BO', type: 'unknown', formatted: nit, error: 'NIT must be 7-10 digits' };
  }
  return { valid: true, country: 'BO', type: 'taxpayer', formatted: cleaned };
}

function validateRIF_Venezuela_Full(rif: string): TaxIdValidation {
  const cleaned = rif.replace(/[\-\.]/g, '');
  const match = cleaned.match(/^([JVEGPC])(\d{8})(\d)$/);
  if (!match) {
    return { valid: false, country: 'VE', type: 'unknown', formatted: rif, error: 'Invalid RIF format (X-XXXXXXXX-X)' };
  }
  const [, prefix, body, checkStr] = match;
  const checkDigit = parseInt(checkStr, 10);
  const prefixValues: Record<string, number> = { V: 1, E: 2, J: 3, P: 4, G: 5, C: 6 };
  const weights = [3, 2, 7, 6, 5, 4, 3, 2];
  let sum = prefixValues[prefix] * 4;
  for (let i = 0; i < 8; i++) sum += parseInt(body[i], 10) * weights[i];
  const remainder = sum % 11;
  const expectedCheck = remainder > 1 ? 11 - remainder : 0;
  const typeMap: Record<string, string> = {
    J: 'legal_entity', V: 'natural_venezuelan', E: 'natural_foreign',
    G: 'government', P: 'passport', C: 'communal_council',
  };
  if (checkDigit !== expectedCheck) {
    return { valid: false, country: 'VE', type: typeMap[prefix], formatted: `${prefix}-${body}-${checkStr}`, error: 'Invalid check digit' };
  }
  return { valid: true, country: 'VE', type: typeMap[prefix], formatted: `${prefix}-${body}-${checkStr}` };
}

function validateRUC_Panama_Full(ruc: string): TaxIdValidation {
  const cleaned = ruc.replace(/\s+/g, '');
  if (/^\d{1,2}-\d{1,4}-\d{1,6}$/.test(cleaned)) {
    return { valid: true, country: 'PA', type: 'natural_person', formatted: cleaned };
  }
  if (/^(E|PE|N)-\d{1,4}-\d{1,6}$/.test(cleaned)) {
    return { valid: true, country: 'PA', type: 'natural_foreign', formatted: cleaned };
  }
  if (/^\d{1,7}-\d{1,4}-\d{1,6}/i.test(cleaned)) {
    return { valid: true, country: 'PA', type: 'legal_entity', formatted: cleaned };
  }
  return { valid: false, country: 'PA', type: 'unknown', formatted: cleaned, error: 'Invalid RUC format' };
}
```

---

## Appendix B: Venezuela Risk Assessment Matrix

| Risk Category | Level | Description | Mitigation |
|---|---|---|---|
| **Sanctions** | HIGH | US OFAC and EU sanctions on Venezuelan entities, individuals, and sectors. Potential secondary sanctions on companies doing business with sanctioned parties. | Engage sanctions compliance counsel. Screen all partners and users against OFAC SDN list. Avoid transactions involving sanctioned banks or individuals. |
| **Currency volatility** | HIGH | VES can lose significant value rapidly. BCV rate changes daily. Parallel market rates may diverge from official rate. | Always use BCV official rate for invoicing. Record exchange rate per transaction. Support USD-denominated invoicing. Implement real-time rate updates. |
| **Regulatory instability** | HIGH | Banking regulations, tax rules, and business requirements change frequently with short notice. | Design systems for regulatory agility. Build configurable tax rates and rules. Monitor Gaceta Oficial for regulatory changes. |
| **Banking system reliability** | MEDIUM | Bank platforms experience frequent outages. Pago Movil may be unavailable during peak hours. | Support multiple payment methods. Design for graceful degradation. Implement payment retry logic. |
| **Price controls** | MEDIUM | Government may impose price controls on certain goods/services. Compliance required for affected industries. | Add price control validation for affected product categories. Monitor Sundde (price control agency) publications. |
| **Capital controls** | MEDIUM | Restrictions on moving money out of Venezuela in VES. USD controls have relaxed but can tighten. | Design for in-country VES operations. USD operations through compliant channels only. |
| **Infrastructure** | MEDIUM | Internet connectivity and electricity can be unreliable in some regions. | Support offline-capable features. Implement data sync when connectivity returns. Keep transaction payloads small. |
| **Talent & support** | LOW-MEDIUM | Remote workforce challenges due to infrastructure issues. | Cloud-based tooling. Async communication workflows. Distributed team practices. |
| **Market opportunity** | HIGH (positive) | 28M+ population, massive underserved SMB market, resourceful entrepreneurs, limited modern SaaS competition. | First-mover advantage. Build for Venezuelan reality (dual currency, manual payment verification, WhatsApp-first). |

---

## Appendix C: Multi-Country Tax Engine Architecture

```typescript
// Core tax engine that handles all four countries' tax logic

interface TaxConfig {
  country: Country;
  taxInclusive: boolean;       // true for Bolivia (IVA included in price)
  standardRate: number;
  reducedRates: { rate: number; description: string }[];
  exemptCategories: string[];
  additionalTaxes: { name: string; rate: number; base: 'revenue' | 'profit' | 'transaction' }[];
}

const TAX_CONFIGS: Record<Country, TaxConfig> = {
  UY: {
    country: 'UY',
    taxInclusive: false,
    standardRate: 0.22,        // 22% -- highest in LatAm
    reducedRates: [
      { rate: 0.10, description: 'Tasa minima: alimentos basicos, medicamentos, hotel, transporte' },
    ],
    exemptCategories: ['exports', 'financial_services', 'education', 'health'],
    additionalTaxes: [
      { name: 'IRAE', rate: 0.25, base: 'profit' },
    ],
  },
  PY: {
    country: 'PY',
    taxInclusive: false,
    standardRate: 0.10,        // 10%
    reducedRates: [
      { rate: 0.05, description: 'Tasa reducida: productos basicos, farmacos, intereses, alquileres' },
    ],
    exemptCategories: ['exports'],
    additionalTaxes: [
      { name: 'IRE', rate: 0.10, base: 'profit' },
    ],
  },
  BO: {
    country: 'BO',
    taxInclusive: true,        // IVA INCLUDED in displayed price
    standardRate: 0.13,        // 13%
    reducedRates: [],          // No reduced rate in Bolivia
    exemptCategories: ['exports'],
    additionalTaxes: [
      { name: 'IT', rate: 0.03, base: 'revenue' },   // 3% transactions tax
      { name: 'IUE', rate: 0.25, base: 'profit' },
    ],
  },
  VE: {
    country: 'VE',
    taxInclusive: false,
    standardRate: 0.16,        // 16%
    reducedRates: [
      { rate: 0.08, description: 'Tasa reducida: ciertos bienes y servicios' },
    ],
    exemptCategories: ['basic_food', 'health', 'education'],
    additionalTaxes: [
      { name: 'IGTF', rate: 0.02, base: 'transaction' }, // 2% large financial transactions
    ],
  },
  PA: {
    country: 'PA',
    taxInclusive: false,
    standardRate: 0.07,        // 7%
    reducedRates: [
      { rate: 0.10, description: 'Alcohol, tobacco' },
      { rate: 0.15, description: 'Hotel/lodging' },
    ],
    exemptCategories: ['exports', 'basic_food', 'medicines', 'financial_services'],
    additionalTaxes: [],
  },
};

interface TaxCalculation {
  subtotal: number;          // Pre-tax amount (or full amount for tax-inclusive)
  taxAmount: number;         // Total tax
  total: number;             // Final amount
  taxBreakdown: { name: string; rate: number; amount: number }[];
  currency: string;
  decimals: number;
}

function calculateTax(
  amount: number,
  country: Country,
  taxCategory: 'standard' | 'reduced' | 'exempt' = 'standard',
  reducedRateIndex: number = 0,
): TaxCalculation {
  const config = TAX_CONFIGS[country];
  const currencies: Record<Country, { code: string; decimals: number }> = {
    UY: { code: 'UYU', decimals: 2 },
    PY: { code: 'PYG', decimals: 0 },
    BO: { code: 'BOB', decimals: 2 },
    VE: { code: 'VES', decimals: 2 },
    PA: { code: 'USD', decimals: 2 },
  };
  const { code: currency, decimals } = currencies[country];

  const round = (n: number) => {
    if (decimals === 0) return Math.round(n);
    const factor = Math.pow(10, decimals);
    return Math.round(n * factor) / factor;
  };

  let rate = 0;
  if (taxCategory === 'standard') rate = config.standardRate;
  else if (taxCategory === 'reduced' && config.reducedRates[reducedRateIndex]) {
    rate = config.reducedRates[reducedRateIndex].rate;
  }
  // 'exempt' -> rate stays 0

  let subtotal: number;
  let taxAmount: number;
  let total: number;

  if (config.taxInclusive) {
    // Bolivia: amount already includes tax
    total = round(amount);
    subtotal = round(amount / (1 + rate));
    taxAmount = round(total - subtotal);
  } else {
    // All others: tax is added on top
    subtotal = round(amount);
    taxAmount = round(subtotal * rate);
    total = round(subtotal + taxAmount);
  }

  const taxBreakdown = [{ name: 'IVA', rate, amount: taxAmount }];

  // Add additional taxes if applicable
  for (const addlTax of config.additionalTaxes) {
    if (addlTax.base === 'revenue' || addlTax.base === 'transaction') {
      const addlAmount = round(subtotal * addlTax.rate);
      taxBreakdown.push({ name: addlTax.name, rate: addlTax.rate, amount: addlAmount });
    }
    // 'profit' taxes are calculated at period-end, not per-invoice
  }

  return { subtotal, taxAmount, total, taxBreakdown, currency, decimals };
}

// USAGE EXAMPLES:

// Uruguay: $U 10,000 service
// calculateTax(10000, 'UY') -> { subtotal: 10000, taxAmount: 2200, total: 12200, ... }

// Paraguay: ₲ 500,000 product
// calculateTax(500000, 'PY') -> { subtotal: 500000, taxAmount: 50000, total: 550000, ... }

// Bolivia: Bs 1,000 product (tax-inclusive!)
// calculateTax(1000, 'BO') -> { subtotal: 884.96, taxAmount: 115.04, total: 1000, ... }

// Venezuela: Bs.D 5,000 service
// calculateTax(5000, 'VE') -> { subtotal: 5000, taxAmount: 800, total: 5800, ... }
```

---

*This document should be reviewed and updated quarterly as regulations and payment landscapes evolve across all four markets. Key monitoring areas: Uruguay DGI e-invoicing updates, Paraguay SIFEN rollout schedule, Bolivia SIN facturacion electronica progress, Venezuela BCV exchange rate policy, and international sanctions developments. Special attention should be given to Venezuela due to the high rate of regulatory change.*
