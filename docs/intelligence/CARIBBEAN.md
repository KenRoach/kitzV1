# Caribbean Markets — Financial & Payment Infrastructure Intelligence

**(Dominican Republic, Puerto Rico, Jamaica, Trinidad & Tobago, Cuba, Haiti, Bahamas, Barbados)**

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

The Caribbean region represents a diverse, high-potential expansion corridor for Kitz. Unlike a single-country market such as Panama, the Caribbean comprises multiple sovereign nations and territories with distinct currencies, languages, tax systems, and payment infrastructures. This complexity is itself a market opportunity: no existing SMB operating system effectively spans the Caribbean, and businesses that operate across island borders face painful manual processes for invoicing, tax compliance, and cross-currency payments.

**Market prioritization:**

| Priority | Market | Rationale |
|---|---|---|
| **P0** | Dominican Republic | Largest Caribbean economy (~$115B GDP), Spanish-speaking, active e-invoicing mandate (e-CF), growing fintech ecosystem, CAFTA-DR trade ties |
| **P1** | Puerto Rico | US territory with US payment rails (Stripe, Square, Zelle), Spanish-speaking -- ideal bridge between US and LatAm Kitz markets |
| **P2** | Jamaica | English-speaking, growing mobile money (Lynk), strong remittance economy |
| **P2** | Trinidad & Tobago | Regional financial center, CARICOM headquarters, oil & gas economy creates B2B demand |
| **P3** | Bahamas | Sand Dollar CBDC pioneer, tourism-dependent, no income tax |
| **P3** | Barbados | DCash CBDC pilot, strong fintech regulation, digital nomad visa (Welcome Stamp) |
| **P4** | Haiti | Critical mobile money market (MonCash), but extreme infrastructure limitations |
| **BLOCKED** | Cuba | US embargo/sanctions make integration legally impossible for US-connected platforms |

**Key takeaways:**

- **Dominican Republic** is the clear priority. Its mandatory e-CF (electronic fiscal receipt) system creates the same "compliance as opportunity" dynamic that Panama's e-invoicing mandate does. SMBs need tools that generate DGII-compliant NCF/e-CF documents. Kitz's existing `invoice_create` tool can be extended to produce DR-compliant XML.
- **Puerto Rico** is a strategic bridge market. It uses US payment rails (Stripe, Square, PayPal, Zelle) but serves a Spanish-speaking population. Kitz can enter with minimal payment integration work while validating Spanish-language UX for the US market.
- **CBDCs are emerging** in the region: Sand Dollar (Bahamas) and DCash (ECCB/Barbados). Kitz should monitor these for future integration but they are not yet critical for SMB adoption.
- **Mobile money** is the dominant payment channel in Haiti (MonCash) and growing in Jamaica (Lynk). Kitz must support mobile money workflows in these markets, not just bank-centric flows.
- **Cuba is blocked** due to US sanctions. Any integration attempt carries severe legal risk. Kitz should not invest engineering resources here until the sanctions regime changes.
- **Multi-currency support** is essential. The Caribbean spans DOP, USD, JMD, TTD, HTG, BSD, and BBD. Kitz must handle per-workspace currency configuration with real-time exchange rate awareness.
- **Multi-language support** is required: Spanish (DR, PR, Cuba), English (Jamaica, T&T, Bahamas, Barbados), French/Creole (Haiti). Kitz's existing Spanish UI covers DR/PR/Cuba; English and French/Creole are new requirements.

---

## 2. Payment Systems

### 2.1 Dominican Republic — Payment Systems

The Dominican Republic has the most developed and diverse payment ecosystem in the Caribbean, driven by a large banked population, active central bank modernization, and growing fintech adoption.

#### 2.1.1 BANRESERVAS (Banco de Reservas de la Republica Dominicana)

**What it is:**
BANRESERVAS is the Dominican Republic's largest bank and the only state-owned commercial bank. It serves as the government's financial agent and has the most extensive branch and ATM network in the country. It is the dominant bank for government payroll, social assistance disbursements, and public sector transactions.

**Why Kitz needs it:**
A significant portion of DR SMBs bank with BANRESERVAS due to its ubiquity and government affiliation. Many SMB owners receive government contracts through BANRESERVAS-processed payments. Integration with BANRESERVAS payment channels ensures Kitz can serve the broadest possible merchant base.

**Technical integration:**
- BANRESERVAS offers internet banking with transfer capabilities.
- No public developer API currently available for third-party integration.
- Participates in LBTR (real-time gross settlement) and SIPARD (interbank clearing).
- Supports card issuance (Visa/Mastercard) processed through Cardnet or AZUL.

**Implementation timeline:** Q3 2026 -- indirect integration via SIPARD/ACH and card networks.

#### 2.1.2 Banco Popular Dominicano (Popular)

**What it is:**
Banco Popular Dominicano is the DR's leading private bank and the digital banking leader. It operates the "App Popular" mobile platform, which is the most feature-rich banking app in the country. Popular has been aggressive in fintech partnerships and digital innovation, including QR payments, person-to-person transfers, and merchant payment solutions.

**Why Kitz needs it:**
Popular is the bank most likely to offer API access or developer tools for fintech integration. Its digital-first posture makes it the natural partner for Kitz in the DR market, similar to Banco General's role in Panama.

**Technical integration:**
- App Popular supports QR-based merchant payments.
- Popular's card acquiring is processed through Cardnet (which Popular co-owns with other banks).
- Participates in LBTR and SIPARD.
- Has explored Open Banking-adjacent initiatives.

**Implementation timeline:** Q2 2026 -- priority bank partnership for DR market.

#### 2.1.3 tPago (Mobile Payments)

**What it is:**
tPago is a mobile payment platform that allows users to pay at merchants, transfer money, top up mobile phones, and pay bills using their smartphone. It works across multiple banks and telcos, making it one of the most accessible digital payment methods in the DR.

**Why Kitz needs it:**
tPago serves as a mobile wallet that many DR consumers already use. Supporting tPago as a payment method allows Kitz workspace owners to accept payments from customers who prefer mobile wallet transactions over card payments or bank transfers.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Type | Mobile wallet / payment aggregator |
| Coverage | Multi-bank, multi-telco |
| Merchant acceptance | QR-based and NFC-capable |
| Settlement | Into merchant's bank account |
| Developer access | Limited -- partnership-based integration |

**Implementation timeline:** Q3 2026 -- after core DR payment integrations.

#### 2.1.4 Cardnet (Card Network / Acquirer)

**What it is:**
Cardnet is the dominant card payment network and merchant acquirer in the Dominican Republic, jointly owned by a consortium of DR banks including Banco Popular, Banco BHD Leon, and others. Cardnet processes the majority of credit and debit card transactions at point-of-sale terminals and online merchants throughout the country.

**Why Kitz needs it:**
Any Kitz workspace that accepts card payments in the DR will route through Cardnet. Understanding Cardnet's merchant onboarding process, fee structure, and technical requirements is essential for enabling card payment acceptance.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Role | Merchant acquirer and card processor |
| Cards supported | Visa, Mastercard, AMEX (credit and debit) |
| POS terminals | Physical POS, mPOS (mobile point of sale) |
| Online payments | E-commerce gateway available |
| Settlement | Into merchant's bank account (T+1 or T+2) |
| Ownership | Bank consortium (Popular, BHD Leon, others) |

**Implementation timeline:** Q2 2026 -- essential for card payment acceptance in DR.

#### 2.1.5 AZUL (Card Acquirer)

**What it is:**
AZUL is the second major card acquirer in the DR, competing with Cardnet. It is owned by a consortium led by Banco BHD Leon and processes card transactions for a growing network of merchants. AZUL has been more aggressive than Cardnet in offering developer-friendly integration options.

**Why Kitz needs it:**
Supporting both Cardnet and AZUL ensures Kitz workspace owners can accept cards regardless of which acquirer their bank uses. AZUL's developer orientation may provide faster API integration than Cardnet.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Developer portal | Available -- more accessible than Cardnet |
| Integration type | Payment gateway API, payment links |
| Cards supported | Visa, Mastercard (credit and debit) |
| E-commerce | Hosted payment page and direct API |
| Settlement | Into merchant's bank account |

**Implementation timeline:** Q2 2026 -- parallel to Cardnet evaluation.

#### 2.1.6 Mercado Pago DR

**What it is:**
Mercado Pago, the payments arm of MercadoLibre, has been expanding into the Dominican Republic. It provides a digital wallet, QR payments, and merchant checkout solutions. Its presence is growing but not yet dominant compared to local players.

**Why Kitz needs it:**
Mercado Pago brings a well-documented developer API that Kitz engineers may already be familiar with from other LatAm markets. If Kitz expands to multiple LatAm countries, Mercado Pago provides a single integration that works across markets.

**Implementation timeline:** Q4 2026 -- evaluate after local payment integrations are established.

#### 2.1.7 LBTR and SIPARD (Interbank Systems)

**What they are:**

| System | Full name | Function |
|---|---|---|
| **LBTR** | Liquidacion Bruta en Tiempo Real | Real-time gross settlement system operated by the Banco Central de la Republica Dominicana (BCRD). Handles high-value, time-critical interbank transfers in real time. |
| **SIPARD** | Sistema de Pagos de la Republica Dominicana | Interbank clearing house for lower-value batch transactions including ACH transfers, direct debits, and check clearing. |

**Why Kitz needs them:**
These are the backbone of DR's financial infrastructure. When a Kitz user generates an invoice and the customer pays via bank transfer, the transaction flows through SIPARD (low value) or LBTR (high value). Kitz needs to generate correct bank transfer references and reconcile incoming payments.

**Technical integration:**
- Neither system offers direct API access to non-bank entities.
- Integration is indirect: Kitz generates payment references on invoices, customers pay via their bank, and Kitz reconciles via bank feed imports.
- SIPARD supports ISO 20022 messaging (aligned with global standards).

**Implementation timeline:** Q3 2026 -- bank transfer reconciliation.

---

### 2.2 Puerto Rico — Payment Systems

**Key insight:** Puerto Rico uses the full US payment stack. This is Kitz's easiest market to enter from a payment infrastructure perspective.

| Payment method | Provider | Integration effort for Kitz |
|---|---|---|
| Card payments | Stripe, Square | Minimal -- standard US Stripe/Square integration |
| Bank transfers | Zelle, ACH (US) | Standard US banking integration |
| Mobile payments | Venmo, Cash App, PayPal | Standard US integrations |
| POS | Square, Clover, Toast | Standard US POS integrations |

**Why this matters for Kitz:**
Puerto Rico validates that Kitz's payment infrastructure can work with US-standard payment rails while serving a Spanish-speaking market. A successful PR launch proves the product-market fit for bilingual operations, and the payment integration work done for PR (Stripe, Square) applies directly to any future US mainland expansion.

**IVU (Impuesto sobre Ventas y Uso) implications:**
Puerto Rico charges 11.5% sales tax (IVU) -- the highest in any US jurisdiction. Kitz must calculate and display IVU correctly on invoices, distinct from ITBMS (Panama) or ITBIS (DR).

```typescript
// Puerto Rico IVU rates
const PR_IVU_RATES = {
  state: 0.105,     // 10.5% state portion
  municipal: 0.01,  // 1% municipal portion
  combined: 0.115,  // 11.5% total (highest in US)
  reduced: 0.04,    // 4% for certain prepared foods
  exempt: 0.00,     // Prescription meds, certain food items
};
```

**Implementation timeline:** Q2 2026 -- low engineering effort, high strategic value.

---

### 2.3 Jamaica — Payment Systems

#### 2.3.1 Lynk (Mobile Money)

**What it is:**
Lynk is Jamaica's first licensed mobile money platform, authorized by the Bank of Jamaica (BOJ). It allows users to store money in a mobile wallet, make person-to-person transfers, pay merchants via QR codes, and cash in/out at agent locations across the island.

**Why Kitz needs it:**
Lynk is the fastest-growing digital payment method in Jamaica, particularly among the underbanked population. For Kitz to serve Jamaican SMBs, Lynk integration is essential -- many of their customers will pay via Lynk rather than card or bank transfer.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Regulator | Bank of Jamaica (BOJ) |
| License type | Mobile money operator |
| User base | Growing rapidly (500K+ users) |
| Merchant payment | QR-based |
| Settlement | Into merchant's Lynk wallet or linked bank account |
| Developer access | Partnership-based, no public API yet |

#### 2.3.2 Other Jamaica Payment Methods

| Provider | Type | Notes |
|---|---|---|
| **National Commercial Bank (NCB)** | Banking + merchant services | Largest commercial bank, NCB Quisk for digital payments |
| **Scotia Jamaica** | Banking + card processing | Part of Scotiabank Group, strong card network |
| **JN Money** | Remittances + transfers | JN Group subsidiary, critical for remittance economy |
| **SurePay** | Payment gateway | Online payment processing for Jamaican merchants |

**Implementation timeline:** Q3 2026 -- Lynk first, then card acquirer integration.

---

### 2.4 Trinidad & Tobago — Payment Systems

| Provider | Type | Notes |
|---|---|---|
| **First Citizens Bank** | Banking + merchant services | Largest local bank, strong SMB focus |
| **Republic Bank** | Banking + card processing | Major regional bank, operates across Caribbean |
| **RBC Caribbean** (Royal Bank of Canada) | Banking | International bank with strong corporate presence |
| **WiPay** | Payment gateway | Caribbean-focused payment gateway -- key integration target |
| **PayWise** | Digital wallet + payments | Growing mobile payment platform |

#### 2.4.1 WiPay (Caribbean Payment Gateway)

**What it is:**
WiPay is a Caribbean-native payment gateway headquartered in Trinidad & Tobago that provides online payment processing, mobile payments, and merchant services across multiple Caribbean islands. It positions itself as the "Stripe of the Caribbean."

**Why Kitz needs it:**
WiPay provides a single integration point for card payment acceptance across Trinidad & Tobago, Jamaica, Barbados, and other Caribbean markets. This reduces the per-country integration burden significantly.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Coverage | T&T, Jamaica, Barbados, and expanding |
| API | RESTful API with developer documentation |
| Cards supported | Visa, Mastercard (local and international) |
| Settlement | Into merchant's local bank account |
| Pricing | Per-transaction percentage + fixed fee |
| Developer portal | https://wipayfinancial.com (documentation available) |

**Integration pattern for Kitz:**

```typescript
// WiPay integration concept
interface WiPayConfig {
  accountNumber: string;
  apiKey: string;
  environment: 'sandbox' | 'production';
  country: 'TT' | 'JM' | 'BB';  // Trinidad, Jamaica, Barbados
  currency: 'TTD' | 'JMD' | 'BBD';
}

// WiPay covers multiple Caribbean markets with a single integration
const wipayPayment = {
  provider: 'wipay',
  total: amount,
  currency: workspace.currency,
  orderId: invoice.id,
  callbackUrl: `https://kitz.app/payments/wipay/callback/${invoice.id}`,
  returnUrl: `https://kitz.app/payments/wipay/return/${invoice.id}`,
};
```

**Implementation timeline:** Q3 2026 -- high priority for multi-island coverage.

---

### 2.5 Cuba — Payment Systems (RESTRICTED)

**WARNING: US sanctions make Cuba integration legally prohibited for any US-connected platform.**

| Provider | Type | Notes |
|---|---|---|
| **Transfermovil** | State mobile banking | Primary digital payment app, operated by ETECSA (state telco) |
| **EnZona** | Digital payment platform | QR payments, bill pay, growing merchant network |
| **Banco Metropolitano** | State commercial bank | Largest bank for private sector/MIPYMES |
| **BANDEC** | State agricultural bank | Rural banking, agricultural sector |

**Assessment:**
Cuba's payment infrastructure is entirely state-controlled. The MIPYMES (micro, small, and medium enterprises) legalization since 2021 has created a nascent private business sector, but the US embargo prohibits US persons and US-connected companies from engaging in most transactions with Cuba. Kitz, as a US-connected technology platform, cannot legally integrate with Cuban payment systems or serve Cuban businesses until the sanctions regime changes.

**Recommendation:** DO NOT invest engineering resources. Monitor sanctions policy only.

---

### 2.6 Haiti — Payment Systems

#### 2.6.1 MonCash (Digicel)

**What it is:**
MonCash is Haiti's dominant mobile money platform, operated by Digicel Haiti. In a country where 80%+ of the population is unbanked, MonCash serves as the primary financial services access point for millions. It enables person-to-person transfers, bill payments, merchant payments, and cash-in/cash-out at agent locations.

**Why Kitz needs it:**
MonCash IS the payment infrastructure in Haiti. Traditional bank-centric payment flows are irrelevant for most Haitian SMBs and their customers. Any Kitz deployment in Haiti must treat MonCash as the primary payment method, not a secondary mobile option.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Operator | Digicel Haiti |
| User base | 3M+ (in a country of ~11M) |
| Type | Mobile money (USSD + app) |
| Merchant API | Available -- REST API for merchant payments |
| Settlement | Into MonCash merchant wallet |
| Cash-out | Via Digicel agent network (12,000+ agents) |
| Currency | HTG (Gourde) |
| Remittance integration | Receives international remittances via Digicel partnerships |

**Critical considerations:**
- Internet connectivity is unreliable. USSD-based transactions must be supported alongside app-based flows.
- Power outages are frequent. Offline-capable workflows are essential.
- Remittances are ~40% of Haiti's GDP. MonCash is a key remittance receiving channel.
- Security situation creates operational risk for any deployment.

**Implementation timeline:** Future (P4) -- monitor for stability improvements.

#### 2.6.2 Other Haiti Payment Methods

| Provider | Type | Notes |
|---|---|---|
| **Sogebank** | Largest private bank | Primary bank for formal businesses and NGOs |
| **BUH** (Banque de l'Union Haitienne) | Commercial bank | Growing digital services |
| **Unitransfer** | Remittance/money transfer | Domestic and international transfers |

---

### 2.7 Bahamas — Payment Systems

#### 2.7.1 Sand Dollar (CBDC)

**What it is:**
The Sand Dollar is the digital currency issued by the Central Bank of The Bahamas (CBOB). Launched in October 2020, it was one of the first central bank digital currencies (CBDCs) in the world. The Sand Dollar is a digital version of the Bahamian Dollar (BSD), pegged 1:1 to USD, and is designed for retail payments across the island chain.

**Why Kitz needs it:**
The Sand Dollar represents the future of Caribbean payments. While adoption is still early, the Bahamas government is pushing merchant acceptance. Early Kitz integration would position the platform as a CBDC-ready business tool -- a significant differentiation point.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Issuer | Central Bank of The Bahamas |
| Peg | 1:1 to BSD (which is 1:1 to USD) |
| Wallets | Licensed digital wallet providers (authorized by CBOB) |
| Merchant acceptance | QR code-based payments |
| Settlement | Instant settlement in Sand Dollars, convertible to BSD |
| Offline capability | Designed for areas with limited connectivity |
| Holding limits | Tier-based (personal: B$500 default, B$8,000 enhanced; business: B$1M) |

**Implementation timeline:** Future -- monitor adoption metrics and API availability.

#### 2.7.2 Traditional Bahamas Payments

Standard card payments (Visa/Mastercard) processed through local banks. No unique payment infrastructure beyond the Sand Dollar.

---

### 2.8 Barbados — Payment Systems

| Provider | Type | Notes |
|---|---|---|
| **Republic Bank Barbados** | Major bank | Subsidiary of Republic Financial Holdings (T&T) |
| **FirstCaribbean** (CIBC) | Major bank | Canadian-owned, strong corporate banking |
| **Bitt** | Fintech | Built DCash CBDC infrastructure for ECCB, blockchain-based |
| **mMoney** | Mobile payments | Growing mobile payment platform |

#### 2.8.1 DCash (ECCB CBDC)

**What it is:**
DCash is the digital currency pilot issued by the Eastern Caribbean Central Bank (ECCB), built on blockchain technology by Barbados-based fintech company Bitt. It covers the Eastern Caribbean Currency Union (ECCU) countries: Antigua and Barbuda, Dominica, Grenada, Montserrat, Saint Kitts and Nevis, Saint Lucia, Saint Vincent and the Grenadines, and (participating) Barbados.

**Why Kitz needs it:**
DCash provides a single digital currency across multiple Eastern Caribbean states. If Kitz expands to the ECCU region, DCash integration could cover 8 countries with one integration.

**Implementation timeline:** Future -- pilot phase, monitor for production readiness.

---

## 3. Banking & Interbank Infrastructure

### 3.1 Dominican Republic Banking

The Dominican Republic has a mature banking system regulated by the Superintendencia de Bancos (SIB) and the Banco Central de la Republica Dominicana (BCRD).

**Key banks for Kitz SMB market:**

| Bank | Type | Relevance | Digital capabilities |
|---|---|---|---|
| **BANRESERVAS** | State-owned | Largest bank, government contracts | Internet banking, growing digital |
| **Banco Popular** | Private | Digital leader, fintech-friendly | App Popular, QR payments, APIs |
| **BHD Leon** | Private | Strong SMB focus | Digital banking, BHD Leon app |
| **Scotiabank DR** | Foreign (Canada) | International presence | Standard digital services |
| **Banco Santa Cruz** | Private | Regional strength | Growing digital |
| **Banco Promerica** | Regional (Central America) | Cross-border capabilities | Digital banking |

**Interbank infrastructure:**

```
BCRD (Central Bank)
    |
    +-- LBTR (Real-Time Gross Settlement)
    |       High-value, time-critical transfers
    |       Same-day settlement
    |
    +-- SIPARD (Interbank Clearing)
    |       ACH transfers, direct debits
    |       Batch processing, T+1 settlement
    |
    +-- Cardnet + AZUL (Card Networks)
            Credit/debit card processing
            POS and e-commerce transactions
```

### 3.2 Puerto Rico Banking

Puerto Rico uses the full US banking system:

| Bank | Notes |
|---|---|
| **Banco Popular de Puerto Rico** | Largest local bank (not affiliated with Banco Popular Dominicano) |
| **FirstBankPR** | Second largest, strong digital services |
| **Oriental Bank** | Growing retail presence |
| **US national banks** | Wells Fargo, Citibank, Chase -- all operate in PR |

**Interbank:** Federal Reserve payment systems (Fedwire, FedACH), SWIFT for international. Standard US banking infrastructure.

### 3.3 Jamaica Banking

Regulated by the Bank of Jamaica (BOJ):

| Bank | Notes |
|---|---|
| **National Commercial Bank (NCB)** | Largest, dominant in retail and SMB |
| **Scotiabank Jamaica** | Strong card processing |
| **JMMB Bank** | Growing digital presence |
| **JN Bank** | Part of JN Group, strong in remittances |

**Interbank:** JamClear (real-time gross settlement), ACH Jamaica.

### 3.4 Trinidad & Tobago Banking

Regulated by the Central Bank of Trinidad & Tobago (CBTT):

| Bank | Notes |
|---|---|
| **First Citizens Bank** | Largest local, strong SMB services |
| **Republic Bank** | Major regional bank (operates across Caribbean) |
| **RBC (Royal Bank of Canada)** | International bank, corporate focus |
| **Scotiabank T&T** | Card processing, retail banking |
| **ANSA Merchant Bank** | ANSA McAL group, investment banking |

**Interbank:** safe-tt (real-time gross settlement), ACH T&T.

### 3.5 Regional Banking Patterns

Several banks operate across multiple Caribbean markets, creating potential for regional partnership:

| Bank group | Markets | Opportunity for Kitz |
|---|---|---|
| **Republic Financial Holdings** | T&T, Barbados, Grenada, Guyana, Suriname, Cayman | Single partnership, multi-market coverage |
| **Scotiabank Caribbean** | Jamaica, T&T, DR, Bahamas, others | Regional card processing |
| **CIBC FirstCaribbean** | Barbados, Jamaica, T&T, Bahamas, others | Corporate banking, cross-border |
| **RBC Caribbean** | T&T, Bahamas, others | Corporate banking |

---

## 4. Government & Regulatory Bodies

### 4.1 Dominican Republic — DGII (Direccion General de Impuestos Internos)

**What it is:**
The DGII is the Dominican Republic's tax authority, responsible for tax administration, collection, and enforcement. It administers the RNC (tax ID) system, the NCF/e-CF invoicing system, ITBIS (VAT), ISR (income tax), and all other internal taxes.

**Why Kitz needs it:**
Every invoice generated by Kitz for a DR workspace must comply with DGII requirements. The mandatory NCF (Numero de Comprobante Fiscal) system and the emerging e-CF (Comprobante Fiscal Electronico) mandate directly affect Kitz's invoicing architecture.

**Key DGII systems:**

| System | URL | Purpose |
|---|---|---|
| DGII Portal | https://dgii.gov.do/ | Tax filing, RNC management, NCF authorization |
| Oficina Virtual | https://oficinavirtual.dgii.gov.do/ | Online tax services, e-CF submission |
| NCF Validation | https://dgii.gov.do/herramientas/consultasNCF | NCF number validation tool |
| e-CF Portal | Via Oficina Virtual | Electronic fiscal receipt submission |

**RNC (Registro Nacional del Contribuyente):**
The RNC is the DR's tax identification number. Format:

| Entity type | RNC format | Example |
|---|---|---|
| Natural person (cedula) | 11 digits (cedula number) | `001-0123456-7` |
| Legal entity | 9 digits | `101234567` |

**RNC validation implementation:**

```typescript
/**
 * Validates a Dominican Republic RNC (Registro Nacional del Contribuyente).
 * Natural persons use their 11-digit cedula.
 * Legal entities use a 9-digit RNC.
 * Both formats include a check digit validated via a weighted modulus algorithm.
 */
function validateRNC(rnc: string): { valid: boolean; type: string; error?: string } {
  const cleaned = rnc.replace(/[\s\-]/g, '');

  // Legal entity: 9 digits
  if (/^\d{9}$/.test(cleaned)) {
    if (validateRNCCheckDigit(cleaned, 'legal')) {
      return { valid: true, type: 'legal_entity' };
    }
    return { valid: false, type: 'legal_entity', error: 'Invalid check digit' };
  }

  // Natural person (cedula): 11 digits
  if (/^\d{11}$/.test(cleaned)) {
    if (validateRNCCheckDigit(cleaned, 'natural')) {
      return { valid: true, type: 'natural_person' };
    }
    return { valid: false, type: 'natural_person', error: 'Invalid check digit' };
  }

  return { valid: false, type: 'unknown', error: 'RNC must be 9 digits (legal entity) or 11 digits (natural person)' };
}

/**
 * Validates the RNC check digit using the DGII weighted modulus algorithm.
 * Legal entity (9 digits): weights [7, 9, 8, 6, 5, 4, 3, 2], mod 11
 * Natural person / cedula (11 digits): weights [1, 2, 1, 2, 1, 2, 1, 2, 1, 2], mod 10 (Luhn variant)
 */
function validateRNCCheckDigit(digits: string, type: 'legal' | 'natural'): boolean {
  if (type === 'legal') {
    const weights = [7, 9, 8, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 8; i++) {
      sum += parseInt(digits[i]) * weights[i];
    }
    const remainder = sum % 11;
    const checkDigit = remainder === 0 ? 2 : remainder === 1 ? 1 : 11 - remainder;
    return checkDigit === parseInt(digits[8]);
  }

  if (type === 'natural') {
    // Cedula validation using Luhn-variant algorithm
    const weights = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
    let sum = 0;
    for (let i = 0; i < 10; i++) {
      let product = parseInt(digits[i]) * weights[i];
      if (product >= 10) product = Math.floor(product / 10) + (product % 10);
      sum += product;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(digits[10]);
  }

  return false;
}

/**
 * Formats an RNC for display.
 * Legal entity: XXX-XXXXX-X
 * Natural person (cedula): XXX-XXXXXXX-X
 */
function formatRNC(rnc: string): string {
  const cleaned = rnc.replace(/[\s\-]/g, '');
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 8)}-${cleaned.slice(8)}`;
  }
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 10)}-${cleaned.slice(10)}`;
  }
  return rnc; // Return unformatted if unrecognized
}
```

---

### 4.2 Dominican Republic — NCF and e-CF Systems

#### 4.2.1 NCF (Numero de Comprobante Fiscal)

**What it is:**
The NCF is the fiscal receipt number that must appear on every commercial transaction document in the Dominican Republic. The DGII assigns NCF sequences to registered taxpayers, and each invoice must bear a valid NCF. The NCF format encodes the document type, enabling the DGII to categorize and audit transactions automatically.

**NCF types (critical for Kitz):**

| NCF prefix | Type | Description | Kitz use case |
|---|---|---|---|
| **B01** | Credito fiscal | Invoice that grants tax credit to the buyer (B2B) | B2B invoices where buyer deducts ITBIS |
| **B02** | Consumo | Consumer receipt (no tax credit to buyer) | B2C transactions, retail |
| **B03** | Nota de debito | Debit note | Adjustments increasing amount owed |
| **B04** | Nota de credito | Credit note | Returns, adjustments reducing amount owed |
| **B11** | Comprobante de proveedores informales | Informal supplier receipt | Purchases from unregistered suppliers |
| **B13** | Comprobante de gastos menores | Minor expense receipt | Small purchases under RD$50,000 |
| **B14** | Regimen especial | Special regime receipt | Tax-exempt or special-rate transactions |
| **B15** | Comprobante gubernamental | Government receipt | Sales to government entities |
| **B16** | Comprobante para exportaciones | Export receipt | Export transactions (0% ITBIS) |
| **B17** | Comprobante para pagos al exterior | Foreign payment receipt | Payments to foreign suppliers |

**NCF format:**
```
B01 00000001
^^^          - NCF type prefix (B01, B02, B14, B15, etc.)
    ^^^^^^^^ - Sequential 8-digit number
```

The full NCF sequence authorization is requested from DGII via the Oficina Virtual portal. The DGII assigns a range (e.g., B01 00000001 through B01 00001000) and the taxpayer must use them sequentially.

**NCF validation:**

```typescript
/**
 * Validates the format and type of a Dominican Republic NCF.
 */
interface NCFValidation {
  valid: boolean;
  type?: string;
  typeName?: string;
  sequence?: number;
  error?: string;
}

const NCF_TYPES: Record<string, string> = {
  'B01': 'Credito Fiscal (B2B)',
  'B02': 'Consumo (B2C)',
  'B03': 'Nota de Debito',
  'B04': 'Nota de Credito',
  'B11': 'Proveedor Informal',
  'B13': 'Gastos Menores',
  'B14': 'Regimen Especial',
  'B15': 'Gubernamental',
  'B16': 'Exportaciones',
  'B17': 'Pagos al Exterior',
};

function validateNCF(ncf: string): NCFValidation {
  const cleaned = ncf.replace(/[\s]/g, '').toUpperCase();

  // New e-NCF format: E + type (2 digits) + sequential (10 digits) = 13 chars
  const eNCFMatch = cleaned.match(/^E(\d{2})(\d{10})$/);
  if (eNCFMatch) {
    const typeCode = `B${eNCFMatch[1]}`;
    const typeName = NCF_TYPES[typeCode];
    if (!typeName) {
      return { valid: false, error: `Unknown e-NCF type code: ${eNCFMatch[1]}` };
    }
    return {
      valid: true,
      type: typeCode,
      typeName,
      sequence: parseInt(eNCFMatch[2]),
    };
  }

  // Traditional NCF format: B + type (2 digits) + sequential (8 digits) = 11 chars
  const ncfMatch = cleaned.match(/^(B\d{2})(\d{8})$/);
  if (ncfMatch) {
    const typeCode = ncfMatch[1];
    const typeName = NCF_TYPES[typeCode];
    if (!typeName) {
      return { valid: false, error: `Unknown NCF type: ${typeCode}` };
    }
    return {
      valid: true,
      type: typeCode,
      typeName,
      sequence: parseInt(ncfMatch[2]),
    };
  }

  return { valid: false, error: 'Invalid NCF format. Expected B## + 8 digits or E## + 10 digits.' };
}
```

#### 4.2.2 e-CF (Comprobante Fiscal Electronico)

**What it is:**
The e-CF is the Dominican Republic's electronic fiscal receipt system, the digital successor to physical NCF sequences. The DGII has been progressively mandating e-CF adoption, requiring businesses to submit electronic fiscal documents in XML format, digitally signed, and transmitted to the DGII in real time or near-real time.

**Why Kitz needs it:**
The e-CF mandate is expanding. Large taxpayers are already required to use e-CF, and the mandate is progressively extending to smaller businesses. Kitz must generate e-CF compliant XML documents for DR workspaces to remain legally compliant.

**e-CF XML structure (key elements):**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ECF xmlns="https://dgii.gov.do/ecf">
  <!-- Document identification -->
  <Encabezado>
    <IdDoc>
      <TipoeCF>31</TipoeCF>              <!-- e-CF type: 31=Factura credito fiscal -->
      <eNCF>E310000000001</eNCF>          <!-- Electronic NCF number -->
      <FechaVencimientoSecuencia>2027-12-31</FechaVencimientoSecuencia>
      <IndicadorMontoGravado>0</IndicadorMontoGravado>
    </IdDoc>
    <Emisor>
      <RNCEmisor>101234567</RNCEmisor>    <!-- Issuer RNC -->
      <RazonSocialEmisor>Mi Empresa SRL</RazonSocialEmisor>
      <DireccionEmisor>Av. Winston Churchill 123, Santo Domingo</DireccionEmisor>
      <FechaEmision>2026-02-24</FechaEmision>
    </Emisor>
    <Comprador>
      <RNCComprador>987654321</RNCComprador>  <!-- Buyer RNC -->
      <RazonSocialComprador>Cliente Corp</RazonSocialComprador>
    </Comprador>
    <Totales>
      <MontoGravadoTotal>10000.00</MontoGravadoTotal>
      <MontoGravadoI1>10000.00</MontoGravadoI1>  <!-- Amount at 18% rate -->
      <TotalITBIS>1800.00</TotalITBIS>
      <TotalITBIS1>1800.00</TotalITBIS1>          <!-- ITBIS at 18% -->
      <MontoTotal>11800.00</MontoTotal>
    </Totales>
  </Encabezado>

  <!-- Line items -->
  <DetallesItem>
    <Item>
      <NumeroLinea>1</NumeroLinea>
      <IndicadorFacturacion>1</IndicadorFacturacion>  <!-- 1=taxable item -->
      <NombreItem>Servicio de consultoria</NombreItem>
      <CantidadItem>1</CantidadItem>
      <MontoItem>10000.00</MontoItem>
      <MontoLinea>10000.00</MontoLinea>
    </Item>
  </DetallesItem>

  <!-- Digital signature -->
  <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
    <!-- XML Digital Signature (XMLDSig) -->
  </ds:Signature>
</ECF>
```

**e-CF document types:**

| Code | Type | Maps to NCF |
|---|---|---|
| 31 | Factura de Credito Fiscal Electronica | B01 |
| 32 | Factura de Consumo Electronica | B02 |
| 33 | Nota de Debito Electronica | B03 |
| 34 | Nota de Credito Electronica | B04 |
| 41 | Compras a Proveedores Informales Electronico | B11 |
| 43 | Comprobante para Gastos Menores Electronico | B13 |
| 44 | Comprobante de Regimenes Especiales Electronico | B14 |
| 45 | Comprobante Gubernamental Electronico | B15 |
| 46 | Comprobante para Exportaciones Electronico | B16 |
| 47 | Comprobante para Pagos al Exterior Electronico | B17 |

**Implementation timeline:** Q2 2026 -- critical path for DR market launch.

---

### 4.3 Puerto Rico — Tax Authority (Departamento de Hacienda)

**Key entities:**

| Entity | Role |
|---|---|
| **Departamento de Hacienda** | PR treasury and tax authority |
| **IRS** | Federal tax (applies to PR in limited ways) |
| **CRIM** (Centro de Recaudacion de Ingresos Municipales) | Municipal property tax collection |

**Tax structure:**

| Tax | Rate | Notes |
|---|---|---|
| **IVU** (Impuesto sobre Ventas y Uso) | 11.5% (10.5% state + 1% municipal) | Highest sales tax in any US jurisdiction |
| **Federal income tax** | NOT applicable for local-source income | PR residents exempt on local income |
| **PR income tax** | 0%-33% progressive | Applies to PR-source income |
| **Act 60 incentives** | 4% corporate tax, 0% capital gains | For qualifying export services and individual investors |

**Special Act 60 (formerly Acts 20/22) opportunity:**
Many Kitz users in PR may be Act 60 beneficiaries (relocated entrepreneurs). Kitz should be able to flag Act 60 status in workspace settings to apply the correct tax treatment.

---

### 4.4 Jamaica — TAJ (Tax Administration Jamaica)

**Key details:**

| Aspect | Detail |
|---|---|
| Tax authority | Tax Administration Jamaica (TAJ) |
| Tax ID | TRN (Taxpayer Registration Number) -- 9 digits |
| VAT equivalent | GCT (General Consumption Tax) -- 15% standard rate |
| Income tax | Progressive: 25% on first JMD 6M, 30% above |
| Payroll | PAYE (Pay As You Earn), NIS (National Insurance Scheme), NHT (National Housing Trust), Education Tax |
| Filing | Online via TAJ portal (https://www.jamaicatax.gov.jm/) |

**GCT implementation:**

```typescript
// Jamaica GCT (General Consumption Tax)
const JM_GCT_RATES = {
  standard: 0.15,       // 15% standard rate
  telephone: 0.25,      // 25% on telephone services
  tourism: 0.10,        // 10% tourism accommodation (reduced from GCT)
  zero_rated: 0.00,     // Exports, certain basic food items
  exempt: null as null,  // Financial services, medical, education, residential rent
};

interface JamaicaTRN {
  number: string; // 9 digits
  formatted: string; // XXX-XXX-XXX
}

function validateTRN(trn: string): { valid: boolean; error?: string } {
  const cleaned = trn.replace(/[\s\-]/g, '');
  if (/^\d{9}$/.test(cleaned)) {
    return { valid: true };
  }
  return { valid: false, error: 'TRN must be 9 digits' };
}

function formatTRN(trn: string): string {
  const cleaned = trn.replace(/[\s\-]/g, '');
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 9)}`;
}
```

---

### 4.5 Trinidad & Tobago — BIR (Board of Inland Revenue)

**Key details:**

| Aspect | Detail |
|---|---|
| Tax authority | Board of Inland Revenue (BIR) |
| Tax ID | BIR File Number |
| VAT | 12.5% standard rate |
| Corporate tax | 30% |
| Income tax | 25% standard, 30% above TTD 1M |
| Green Fund Levy | 0.3% on gross sales/receipts |
| Business Levy | 0.6% on gross sales (if no corporation tax liability) |

**VAT implementation:**

```typescript
// Trinidad & Tobago VAT
const TT_VAT_RATES = {
  standard: 0.125,     // 12.5% standard rate
  zero_rated: 0.00,    // Exports, basic food items, agricultural inputs
  exempt: null as null, // Financial services, residential accommodation, medical, education
};
```

---

### 4.6 Haiti — DGI (Direction Generale des Impots)

**Key details:**

| Aspect | Detail |
|---|---|
| Tax authority | Direction Generale des Impots (DGI) |
| Tax ID | NIF (Numero d'Identification Fiscale) |
| Turnover tax | TCA (Taxe sur le Chiffre d'Affaires) -- 10% |
| Income tax | Progressive: 10%-30% |
| Language | French (official documents) |

**Note:** Haiti does not have a formal VAT system. The TCA (turnover tax at 10%) is the primary consumption tax. Tax administration is weak and enforcement is inconsistent. For Kitz, the priority is basic TCA calculation on invoices rather than sophisticated compliance.

---

### 4.7 Bahamas — No Income Tax Regime

**Key details:**

| Aspect | Detail |
|---|---|
| Tax authority | Department of Inland Revenue |
| VAT | 10% standard rate (introduced 2015, raised to 12% in 2018, reduced to 10% in 2022) |
| Income tax | NONE -- no personal or corporate income tax |
| Tax ID | TIN (Taxpayer Identification Number) for VAT-registered businesses |
| Business license fee | Based on turnover, paid annually |

**VAT implementation:**

```typescript
// Bahamas VAT
const BS_VAT_RATES = {
  standard: 0.10,      // 10% standard rate (as of 2022 reduction)
  zero_rated: 0.00,    // Exports, certain breadbasket items
  exempt: null as null, // Financial services, residential rent, medical
};
```

---

### 4.8 Barbados — BRA (Barbados Revenue Authority)

**Key details:**

| Aspect | Detail |
|---|---|
| Tax authority | Barbados Revenue Authority (BRA) |
| Tax ID | TIN (Taxpayer Identification Number) |
| VAT | 17.5% standard rate |
| Corporate tax | 1%-5.5% (recently reformed, lowered significantly) |
| Income tax | Progressive: up to 28.5% |
| Filing | Online via BRA portal |

**VAT implementation:**

```typescript
// Barbados VAT
const BB_VAT_RATES = {
  standard: 0.175,       // 17.5% standard rate
  hotel_accommodation: 0.075, // 7.5% on hotel accommodation
  zero_rated: 0.00,      // Exports, basic food items
  exempt: null as null,   // Financial services, residential rent, medical, education
};
```

---

### 4.9 Regulatory Risk Assessment by Country

| Country | Regulatory maturity | E-invoicing mandate | Tax complexity | Sanctions risk | Overall risk |
|---|---|---|---|---|---|
| **Dominican Republic** | High | Active (e-CF expanding) | Medium-High (ITBIS + NCF types) | None | LOW |
| **Puerto Rico** | Very High (US) | US standards | Medium (IVU + federal) | None | VERY LOW |
| **Jamaica** | Medium | None currently | Medium (GCT + payroll taxes) | None | LOW-MEDIUM |
| **Trinidad & Tobago** | Medium | None currently | Medium (VAT + levies) | None | LOW-MEDIUM |
| **Bahamas** | Medium | None currently | Low (VAT only, no income tax) | None | LOW |
| **Barbados** | Medium-High | None currently | Medium (VAT + corp/income tax) | None | LOW |
| **Haiti** | Low | None | Low (TCA only) | None | HIGH (operational) |
| **Cuba** | Low | N/A | N/A | **CRITICAL (US embargo)** | **BLOCKED** |

---

## 5. Invoice Compliance

### 5.1 Dominican Republic — ITBIS (Impuesto a la Transferencia de Bienes Industrializados y Servicios)

ITBIS is the Dominican Republic's VAT. Note: despite sharing a name similarity with Panama's ITBMS, ITBIS has different rates and rules.

**Tax rates:**

| Rate | Application |
|---|---|
| **18%** | Standard rate -- most goods and services |
| **16%** | Reduced rate -- certain food products (yogurt, coffee, fats/oils, sugar, cacao, etc.) |
| **0%** | Exempt/zero-rated -- exports, basic food items (rice, beans, meat, milk, bread, eggs, etc.), medicines, fuels, agricultural inputs, educational materials |

**ITBIS calculation for Kitz:**

```typescript
/**
 * Dominican Republic ITBIS tax calculation engine.
 * Supports multi-rate invoices as required by DGII.
 */
interface DRLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  itbisCategory: 'standard' | 'reduced' | 'exempt';
}

interface DRTaxResult {
  subtotal: number;
  itbisStandard: number;     // 18% items
  itbisReduced: number;      // 16% items
  itbisExempt: number;       // 0% items (amount, not tax)
  totalItbis: number;
  grandTotal: number;
  breakdown: {
    category: string;
    rate: number;
    taxableAmount: number;
    taxAmount: number;
  }[];
}

const DR_ITBIS_RATES = {
  standard: 0.18,
  reduced: 0.16,
  exempt: 0.00,
};

function calculateDRItbis(items: DRLineItem[]): DRTaxResult {
  let subtotal = 0;
  let itbisStandard = 0;
  let itbisReduced = 0;
  let itbisExempt = 0;

  const categoryTotals: Record<string, { taxableAmount: number; taxAmount: number }> = {
    standard: { taxableAmount: 0, taxAmount: 0 },
    reduced: { taxableAmount: 0, taxAmount: 0 },
    exempt: { taxableAmount: 0, taxAmount: 0 },
  };

  for (const item of items) {
    const lineTotal = item.quantity * item.unitPrice;
    subtotal += lineTotal;

    const rate = DR_ITBIS_RATES[item.itbisCategory];
    const taxAmount = lineTotal * rate;

    categoryTotals[item.itbisCategory].taxableAmount += lineTotal;
    categoryTotals[item.itbisCategory].taxAmount += taxAmount;

    switch (item.itbisCategory) {
      case 'standard':
        itbisStandard += taxAmount;
        break;
      case 'reduced':
        itbisReduced += taxAmount;
        break;
      case 'exempt':
        itbisExempt += lineTotal; // Track exempt amount, no tax
        break;
    }
  }

  const totalItbis = itbisStandard + itbisReduced;

  return {
    subtotal: round2(subtotal),
    itbisStandard: round2(itbisStandard),
    itbisReduced: round2(itbisReduced),
    itbisExempt: round2(itbisExempt),
    totalItbis: round2(totalItbis),
    grandTotal: round2(subtotal + totalItbis),
    breakdown: Object.entries(categoryTotals)
      .filter(([_, v]) => v.taxableAmount > 0)
      .map(([category, values]) => ({
        category,
        rate: DR_ITBIS_RATES[category as keyof typeof DR_ITBIS_RATES],
        taxableAmount: round2(values.taxableAmount),
        taxAmount: round2(values.taxAmount),
      })),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
```

### 5.2 Caribbean-Wide Tax Rate Reference

```typescript
/**
 * Unified tax configuration for all Caribbean markets.
 * Used by Kitz's invoice engine to apply the correct tax rate
 * based on workspace country.
 */
interface CountryTaxConfig {
  country: string;
  countryCode: string;
  taxName: string;
  standardRate: number;
  reducedRates: { rate: number; description: string }[];
  taxIdName: string;
  taxIdFormat: RegExp;
  currency: string;
  currencySymbol: string;
}

const CARIBBEAN_TAX_CONFIG: Record<string, CountryTaxConfig> = {
  DO: {
    country: 'Dominican Republic',
    countryCode: 'DO',
    taxName: 'ITBIS',
    standardRate: 0.18,
    reducedRates: [
      { rate: 0.16, description: 'Reduced rate (select food products)' },
      { rate: 0.00, description: 'Exempt (basic food, medicines, exports)' },
    ],
    taxIdName: 'RNC',
    taxIdFormat: /^\d{9}$|^\d{11}$/,
    currency: 'DOP',
    currencySymbol: 'RD$',
  },
  PR: {
    country: 'Puerto Rico',
    countryCode: 'PR',
    taxName: 'IVU',
    standardRate: 0.115,
    reducedRates: [
      { rate: 0.04, description: 'Reduced rate (prepared foods)' },
      { rate: 0.00, description: 'Exempt (prescription medicine, certain foods)' },
    ],
    taxIdName: 'EIN/SSN',
    taxIdFormat: /^\d{2}-?\d{7}$|^\d{3}-?\d{2}-?\d{4}$/,
    currency: 'USD',
    currencySymbol: '$',
  },
  JM: {
    country: 'Jamaica',
    countryCode: 'JM',
    taxName: 'GCT',
    standardRate: 0.15,
    reducedRates: [
      { rate: 0.25, description: 'Higher rate (telephone services)' },
      { rate: 0.10, description: 'Reduced rate (tourism accommodation)' },
      { rate: 0.00, description: 'Zero-rated (exports, basic food)' },
    ],
    taxIdName: 'TRN',
    taxIdFormat: /^\d{9}$/,
    currency: 'JMD',
    currencySymbol: 'J$',
  },
  TT: {
    country: 'Trinidad & Tobago',
    countryCode: 'TT',
    taxName: 'VAT',
    standardRate: 0.125,
    reducedRates: [
      { rate: 0.00, description: 'Zero-rated (exports, basic food, agricultural inputs)' },
    ],
    taxIdName: 'BIR File Number',
    taxIdFormat: /^\d{6,10}$/,
    currency: 'TTD',
    currencySymbol: 'TT$',
  },
  CU: {
    country: 'Cuba',
    countryCode: 'CU',
    taxName: 'Impuesto sobre Ventas',
    standardRate: 0.10,
    reducedRates: [],
    taxIdName: 'NIT',
    taxIdFormat: /^\d{11}$/,
    currency: 'CUP',
    currencySymbol: '$',
  },
  HT: {
    country: 'Haiti',
    countryCode: 'HT',
    taxName: 'TCA',
    standardRate: 0.10,
    reducedRates: [
      { rate: 0.00, description: 'Exempt (basic necessities)' },
    ],
    taxIdName: 'NIF',
    taxIdFormat: /^\d{3}-?\d{3}-?\d{3}-?\d{1}$/,
    currency: 'HTG',
    currencySymbol: 'G',
  },
  BS: {
    country: 'Bahamas',
    countryCode: 'BS',
    taxName: 'VAT',
    standardRate: 0.10,
    reducedRates: [
      { rate: 0.00, description: 'Zero-rated (exports, breadbasket items)' },
    ],
    taxIdName: 'TIN',
    taxIdFormat: /^\d{9,12}$/,
    currency: 'BSD',
    currencySymbol: 'B$',
  },
  BB: {
    country: 'Barbados',
    countryCode: 'BB',
    taxName: 'VAT',
    standardRate: 0.175,
    reducedRates: [
      { rate: 0.075, description: 'Reduced rate (hotel accommodation)' },
      { rate: 0.00, description: 'Zero-rated (exports, basic food)' },
    ],
    taxIdName: 'TIN',
    taxIdFormat: /^\d{8,12}$/,
    currency: 'BBD',
    currencySymbol: 'Bds$',
  },
};

/**
 * Returns the tax configuration for a given country code.
 */
function getTaxConfig(countryCode: string): CountryTaxConfig | undefined {
  return CARIBBEAN_TAX_CONFIG[countryCode.toUpperCase()];
}

/**
 * Calculates tax for a given amount using the specified country's standard rate.
 */
function calculateTax(
  countryCode: string,
  amount: number,
  rateOverride?: number,
): { taxAmount: number; total: number; rate: number; taxName: string } {
  const config = getTaxConfig(countryCode);
  if (!config) {
    throw new Error(`Unsupported country code: ${countryCode}`);
  }
  const rate = rateOverride ?? config.standardRate;
  const taxAmount = round2(amount * rate);
  return {
    taxAmount,
    total: round2(amount + taxAmount),
    rate,
    taxName: config.taxName,
  };
}
```

### 5.3 Invoice Numbering by Country

| Country | System | Format | Authority | Sequential requirement |
|---|---|---|---|---|
| **Dominican Republic** | NCF / e-NCF | `B01 00000001` / `E3100000000001` | DGII-assigned sequences | Yes -- gaps prohibited |
| **Puerto Rico** | No mandated format | Merchant-defined | None (US standards) | No -- recommended |
| **Jamaica** | No mandated e-invoice | Merchant-defined | TAJ | No -- recommended |
| **Trinidad & Tobago** | No mandated e-invoice | Merchant-defined | BIR | No -- recommended |
| **Bahamas** | No mandated e-invoice | Merchant-defined | Dept. of Inland Revenue | No -- recommended |
| **Barbados** | No mandated e-invoice | Merchant-defined | BRA | No -- recommended |
| **Haiti** | No mandated e-invoice | Merchant-defined | DGI | No |

**Key insight:** The Dominican Republic is the only Caribbean market with a mandatory structured invoicing system (NCF/e-CF). All other markets use merchant-defined formats, which gives Kitz flexibility but also means Kitz's professional invoice format becomes a competitive advantage.

### 5.4 e-CF Integration Architecture for Dominican Republic

```
                     KITZ e-CF INTEGRATION FLOW
                     ==========================

  Kitz Workspace (DR)              DGII Systems
        |                               |
        |  1. User creates invoice      |
        |     via invoice_create        |
        |                               |
        v                               |
  +----------------+                    |
  | Invoice Data   |                    |
  | (Kitz format)  |                    |
  +----------------+                    |
        |                               |
        |  2. Transform to e-CF XML     |
        v                               |
  +----------------+                    |
  | e-CF XML       |                    |
  | Generator      |                    |
  | (per doc type) |                    |
  +----------------+                    |
        |                               |
        |  3. Apply digital signature   |
        v                               |
  +----------------+                    |
  | XML Digital    |                    |
  | Signature      |                    |
  | (XMLDSig)      |                    |
  +----------------+                    |
        |                               |
        |  4. Submit to DGII            |
        v                               v
  +----------------+            +----------------+
  | DGII           | ---------> | DGII           |
  | Submission API |            | Validation     |
  | (Oficina       |            | Engine         |
  |  Virtual)      |            +----------------+
  +----------------+                    |
        |                               |
        |  5. Receive response          |
        |     (approval + TrackId)      |
        v                               |
  +----------------+                    |
  | Store approved |                    |
  | e-CF with      |                    |
  | TrackId + XML  |                    |
  +----------------+                    |
        |                               |
        |  6. Send to customer          |
        v                               |
  +----------------+                    |
  | WhatsApp/Email |                    |
  | with PDF + XML |                    |
  +----------------+                    |
```

---

## 6. Payment Flow Architecture

### 6.1 Multi-Country Payment Flow

```
                    CARIBBEAN PAYMENT ROUTING
                    ========================

  Kitz Workspace
  (country-configured)
        |
        |  Invoice created with country-specific:
        |  - Tax calculation (ITBIS/IVU/GCT/VAT/TCA)
        |  - Tax ID (RNC/EIN/TRN/BIR#/NIF/TIN)
        |  - Currency (DOP/USD/JMD/TTD/HTG/BSD/BBD)
        |  - Invoice format (NCF/e-CF for DR, free format others)
        |
        v
  +--------------------+
  | Payment Router     |
  | (by country)       |
  +--------------------+
        |
        +-- DR -----> Cardnet / AZUL (cards)
        |             tPago (mobile wallet)
        |             SIPARD bank transfer
        |             Mercado Pago
        |
        +-- PR -----> Stripe / Square (cards)
        |             Zelle / ACH (bank transfer)
        |             PayPal / Venmo
        |
        +-- JM -----> Lynk (mobile money)
        |             NCB / Scotia (cards)
        |             WiPay (gateway)
        |
        +-- TT -----> WiPay (gateway)
        |             First Citizens / Republic (cards)
        |             PayWise (digital wallet)
        |
        +-- BS -----> Sand Dollar (CBDC -- future)
        |             Standard cards (Visa/MC)
        |
        +-- BB -----> WiPay (gateway)
        |             DCash (CBDC -- future)
        |             Standard cards (Visa/MC)
        |
        +-- HT -----> MonCash (mobile money -- PRIORITY)
        |             Sogebank (bank transfer)
        |
        +-- CU -----> BLOCKED (sanctions)
```

### 6.2 Payment Gateway Comparison

| Gateway / Method | Countries | Cards | Mobile money | Bank transfer | CBDC | API quality | Kitz priority |
|---|---|---|---|---|---|---|---|
| **Cardnet** | DR | Yes | No | No | No | Medium | P0 (DR) |
| **AZUL** | DR | Yes | No | No | No | Medium-High | P0 (DR) |
| **Stripe** | PR (US) | Yes | No | No | No | Excellent | P0 (PR) |
| **Square** | PR (US) | Yes | No | No | No | Excellent | P1 (PR) |
| **WiPay** | TT, JM, BB | Yes | No | No | No | Good | P1 (multi-island) |
| **Lynk** | JM | No | Yes | No | No | Medium | P2 (JM) |
| **MonCash** | HT | No | Yes | No | No | Medium | P3 (HT) |
| **tPago** | DR | No | Yes | No | No | Low | P2 (DR) |
| **PayWise** | TT | No | Yes | No | No | Medium | P3 (TT) |
| **Sand Dollar** | BS | No | No | No | Yes | TBD | Future |
| **DCash** | BB + ECCU | No | No | No | Yes | TBD | Future |
| **Mercado Pago** | DR | Yes | Yes | No | No | Excellent | P3 (DR) |

### 6.3 Webhook Processing by Provider

```typescript
/**
 * Caribbean payment webhook router.
 * Extends the existing paymentTools.ts provider enum.
 */
type CaribbeanPaymentProvider =
  | 'stripe'       // PR (US rails)
  | 'square'       // PR (US rails)
  | 'paypal'       // PR + international
  | 'cardnet'      // DR (card acquirer)
  | 'azul'         // DR (card acquirer)
  | 'tpago'        // DR (mobile wallet)
  | 'mercadopago'  // DR (wallet + cards)
  | 'wipay'        // TT, JM, BB (card gateway)
  | 'lynk'         // JM (mobile money)
  | 'moncash'      // HT (mobile money)
  | 'paywise'      // TT (digital wallet)
  | 'sand_dollar'  // BS (CBDC -- future)
  | 'dcash';       // BB/ECCU (CBDC -- future)

interface PaymentWebhookPayload {
  provider: CaribbeanPaymentProvider;
  providerTransactionId: string;
  invoiceId: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  timestamp: string; // ISO 8601
  metadata?: Record<string, unknown>;
}

async function processPaymentWebhook(payload: PaymentWebhookPayload): Promise<void> {
  // 1. Validate provider signature (provider-specific)
  await validateProviderSignature(payload);

  // 2. Find associated invoice
  const invoice = await findInvoice(payload.invoiceId);
  if (!invoice) throw new Error(`Invoice not found: ${payload.invoiceId}`);

  // 3. Verify amount and currency match
  if (payload.amount !== invoice.grandTotal || payload.currency !== invoice.currency) {
    throw new Error('Payment amount/currency mismatch');
  }

  // 4. Update invoice status
  await updateInvoiceStatus(invoice.id, payload.status === 'completed' ? 'paid' : payload.status);

  // 5. Record transaction
  await recordTransaction({
    invoiceId: invoice.id,
    workspaceId: invoice.workspaceId,
    provider: payload.provider,
    providerTransactionId: payload.providerTransactionId,
    amount: payload.amount,
    currency: payload.currency,
    status: payload.status,
    timestamp: payload.timestamp,
  });

  // 6. Update CRM contact payment history
  await updateContactPaymentHistory(invoice.contactId, payload);

  // 7. Send receipt (WhatsApp or email based on workspace config)
  if (payload.status === 'completed') {
    await sendReceipt(invoice, payload);
  }

  // 8. Update tax ledger for compliance reporting
  await updateTaxLedger(invoice, payload);
}
```

---

## 7. Currency & Localization

### 7.1 Currency Table

| Country | Currency code | Currency name | Symbol | USD peg | Typical exchange rate | Thousands sep | Decimal sep |
|---|---|---|---|---|---|---|---|
| **Dominican Republic** | DOP | Peso dominicano | RD$ | No (floating) | ~58 DOP = 1 USD | , | . |
| **Puerto Rico** | USD | US Dollar | $ | IS USD | 1:1 | , | . |
| **Jamaica** | JMD | Jamaican Dollar | J$ | No (floating) | ~155 JMD = 1 USD | , | . |
| **Trinidad & Tobago** | TTD | TT Dollar | TT$ | Managed float | ~6.8 TTD = 1 USD | , | . |
| **Cuba** | CUP | Peso cubano | $ | No (managed) | ~120 CUP = 1 USD (official) | , | . |
| **Haiti** | HTG | Gourde | G | No (floating) | ~132 HTG = 1 USD | , | . |
| **Bahamas** | BSD | Bahamian Dollar | B$ | Yes (1:1 USD) | 1.00 | , | . |
| **Barbados** | BBD | Barbados Dollar | Bds$ | Yes (2:1 USD) | 2.00 | , | . |

**Currency implementation:**

```typescript
interface CurrencyConfig {
  code: string;
  name: string;
  symbol: string;
  usdPeg: boolean;
  usdRate?: number;  // Fixed rate if pegged, undefined if floating
  decimalPlaces: number;
  thousandsSep: string;
  decimalSep: string;
}

const CARIBBEAN_CURRENCIES: Record<string, CurrencyConfig> = {
  DOP: {
    code: 'DOP', name: 'Peso dominicano', symbol: 'RD$',
    usdPeg: false, decimalPlaces: 2, thousandsSep: ',', decimalSep: '.',
  },
  USD: {
    code: 'USD', name: 'US Dollar', symbol: '$',
    usdPeg: true, usdRate: 1.00, decimalPlaces: 2, thousandsSep: ',', decimalSep: '.',
  },
  JMD: {
    code: 'JMD', name: 'Jamaican Dollar', symbol: 'J$',
    usdPeg: false, decimalPlaces: 2, thousandsSep: ',', decimalSep: '.',
  },
  TTD: {
    code: 'TTD', name: 'Trinidad & Tobago Dollar', symbol: 'TT$',
    usdPeg: false, decimalPlaces: 2, thousandsSep: ',', decimalSep: '.',
  },
  CUP: {
    code: 'CUP', name: 'Peso cubano', symbol: '$',
    usdPeg: false, decimalPlaces: 2, thousandsSep: ',', decimalSep: '.',
  },
  HTG: {
    code: 'HTG', name: 'Gourde', symbol: 'G',
    usdPeg: false, decimalPlaces: 2, thousandsSep: ',', decimalSep: '.',
  },
  BSD: {
    code: 'BSD', name: 'Bahamian Dollar', symbol: 'B$',
    usdPeg: true, usdRate: 1.00, decimalPlaces: 2, thousandsSep: ',', decimalSep: '.',
  },
  BBD: {
    code: 'BBD', name: 'Barbados Dollar', symbol: 'Bds$',
    usdPeg: true, usdRate: 2.00, decimalPlaces: 2, thousandsSep: ',', decimalSep: '.',
  },
};

/**
 * Formats a monetary amount according to the currency's display conventions.
 */
function formatCurrency(amount: number, currencyCode: string): string {
  const config = CARIBBEAN_CURRENCIES[currencyCode];
  if (!config) throw new Error(`Unknown currency: ${currencyCode}`);

  const fixed = amount.toFixed(config.decimalPlaces);
  const [integerPart, decimalPart] = fixed.split('.');

  // Add thousands separators
  const withSeparators = integerPart.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    config.thousandsSep,
  );

  return `${config.symbol}${withSeparators}${config.decimalSep}${decimalPart}`;
}

// Examples:
// formatCurrency(12345.67, 'DOP')  => "RD$12,345.67"
// formatCurrency(12345.67, 'JMD')  => "J$12,345.67"
// formatCurrency(12345.67, 'BBD')  => "Bds$12,345.67"
// formatCurrency(12345.67, 'HTG')  => "G12,345.67"
```

### 7.2 Language Support Matrix

| Country | Primary language | Secondary language | Kitz UI language | Invoice language | Notes |
|---|---|---|---|---|---|
| **Dominican Republic** | Spanish | -- | Spanish | Spanish | Same as Panama UI |
| **Puerto Rico** | Spanish | English | Spanish (default), English | Spanish or English | Bilingual population, Act 60 users may prefer English |
| **Jamaica** | English | Patois | English | English | Patois is spoken, not written in business context |
| **Trinidad & Tobago** | English | -- | English | English | |
| **Cuba** | Spanish | -- | Spanish | Spanish | BLOCKED -- no deployment |
| **Haiti** | French | Haitian Creole | French | French | Creole-language UI would be a major differentiator but low ROI |
| **Bahamas** | English | -- | English | English | |
| **Barbados** | English | -- | English | English | |

**Language implementation priority:**

| Priority | Language | Markets covered | Engineering effort |
|---|---|---|---|
| **P0 (exists)** | Spanish | DR, PR, Cuba | Already built for Panama |
| **P1** | English | JM, TT, BS, BB, PR (secondary) | New -- required for Caribbean expansion beyond DR/PR |
| **P3** | French | Haiti | Future -- low priority |
| **P4** | Haitian Creole | Haiti | Future -- very low priority |

### 7.3 Phone Number Formats

| Country | Country code | Mobile format | Example | WhatsApp format |
|---|---|---|---|---|
| **Dominican Republic** | +1 (809/829/849) | +1-809-XXX-XXXX | +1-809-555-1234 | 18095551234 |
| **Puerto Rico** | +1 (787/939) | +1-787-XXX-XXXX | +1-787-555-1234 | 17875551234 |
| **Jamaica** | +1 (876) | +1-876-XXX-XXXX | +1-876-555-1234 | 18765551234 |
| **Trinidad & Tobago** | +1 (868) | +1-868-XXX-XXXX | +1-868-555-1234 | 18685551234 |
| **Cuba** | +53 | +53-5-XXX-XXXX | +53-5-255-1234 | 5352551234 |
| **Haiti** | +509 | +509-XXXX-XXXX | +509-3455-1234 | 50934551234 |
| **Bahamas** | +1 (242) | +1-242-XXX-XXXX | +1-242-555-1234 | 12425551234 |
| **Barbados** | +1 (246) | +1-246-XXX-XXXX | +1-246-555-1234 | 12465551234 |

**Note:** DR, PR, JM, TT, BS, and BB all use the North American Numbering Plan (NANP) with country code +1 and distinct area codes. This means phone number validation must check the area code, not just the country code, to determine the country.

```typescript
/**
 * Identifies the Caribbean country from a phone number using area codes.
 */
const CARIBBEAN_AREA_CODES: Record<string, string> = {
  '809': 'DO', '829': 'DO', '849': 'DO',
  '787': 'PR', '939': 'PR',
  '876': 'JM', '658': 'JM',
  '868': 'TT',
  '242': 'BS',
  '246': 'BB',
};

function identifyCaribCountry(phone: string): string | null {
  const cleaned = phone.replace(/[\s\-\+\(\)]/g, '');

  // NANP format: 1 + area code (3) + number (7) = 11 digits
  if (/^1\d{10}$/.test(cleaned)) {
    const areaCode = cleaned.substring(1, 4);
    return CARIBBEAN_AREA_CODES[areaCode] || null;
  }

  // Cuba: +53 + 8 digits
  if (/^53\d{8}$/.test(cleaned)) return 'CU';

  // Haiti: +509 + 8 digits
  if (/^509\d{8}$/.test(cleaned)) return 'HT';

  return null;
}

/**
 * Converts a phone number to WhatsApp-ready format (digits only, no + or dashes).
 */
function toWhatsAppFormat(phone: string): string {
  return phone.replace(/[\s\-\+\(\)]/g, '');
}
```

### 7.4 Date and Time Formats

| Country | Display format | Business convention | Timezone |
|---|---|---|---|
| **Dominican Republic** | DD/MM/YYYY | 12-hour clock | AST (UTC-4) |
| **Puerto Rico** | MM/DD/YYYY (US) | 12-hour clock (US convention) | AST (UTC-4) |
| **Jamaica** | DD/MM/YYYY | 12-hour clock | EST (UTC-5) |
| **Trinidad & Tobago** | DD/MM/YYYY | 12-hour clock | AST (UTC-4) |
| **Cuba** | DD/MM/YYYY | 24-hour clock | CST (UTC-5) / CDT |
| **Haiti** | DD/MM/YYYY | 12-hour clock | EST (UTC-5) / EDT |
| **Bahamas** | MM/DD/YYYY (US influence) | 12-hour clock | EST (UTC-5) / EDT |
| **Barbados** | DD/MM/YYYY | 12-hour clock | AST (UTC-4) |

**Note:** Puerto Rico uses US date format (MM/DD/YYYY), which differs from the rest of the Caribbean. The Bahamas also tends toward US formatting. Kitz must respect per-country date conventions.

### 7.5 Address Formats

| Country | Postal code system | Address style |
|---|---|---|
| **Dominican Republic** | Partial (10000-series for Santo Domingo) | Street + number, Sector, City, Province |
| **Puerto Rico** | US ZIP codes (00600-00988) | US format with ZIP code |
| **Jamaica** | Partial (introduced recently) | Street + number, City, Parish |
| **Trinidad & Tobago** | Postal codes exist but rarely used | Street + number, City/Town |
| **Cuba** | CP (Codigo Postal) | Street + number, Municipio, Provincia, CP |
| **Haiti** | None | Descriptive (landmark-based) |
| **Bahamas** | None (use island name) | Street, City/Settlement, Island |
| **Barbados** | Partial | Street, Parish (11 parishes) |

---

## 8. Competitive Landscape

### 8.1 Caribbean-Wide Competitors

| Competitor | Markets | Strengths | Weaknesses | Kitz differentiator |
|---|---|---|---|---|
| **Alegra** | DR, PR, multiple LatAm | E-invoicing compliance, cloud-based, affordable | No AI, no WhatsApp-native, generic LatAm focus | AI-native, WhatsApp-first, country-specific |
| **QuickBooks** | PR (strong), limited Caribbean | Global brand, robust accounting | No ITBIS, no NCF/e-CF, no local payments | Built for Caribbean from day one |
| **Xero** | English Caribbean (growing) | Clean UI, strong ecosystem, multi-currency | No Caribbean tax compliance, no local integrations | Local tax + payment integrations |
| **Wave** | PR, JM (limited) | Free basic plan, simple invoicing | No Caribbean tax compliance, limited features | Full business OS vs. basic invoicing |
| **Odoo** | DR (growing), multi-market | Full ERP, open source, DR localization module | Complex, enterprise-focused, expensive for micro businesses | Lightweight, mobile-first, AI-powered |
| **Facturando DR** | DR only | DR e-CF compliant, DGII integration | DR only, limited features beyond invoicing | Full business OS, multi-country |
| **SoftlandRD** | DR | Established accounting/ERP in DR market | Legacy software, not cloud-native, expensive | Modern cloud-native, AI, affordable |

### 8.2 Market-Specific Competitor Analysis

**Dominican Republic:**
The DR has the most active competitive landscape in the Caribbean. Local players like Facturando DR, SoftlandRD, and DGII's own free invoicing tool compete for SMB attention. However, none offer the AI + WhatsApp + CRM + invoicing combination that Kitz provides. The e-CF mandate is pushing businesses away from manual processes, creating a window of opportunity.

**Puerto Rico:**
PR is dominated by US tools (QuickBooks, Square, Stripe). The opportunity for Kitz is to serve Spanish-preferring businesses that find US tools culturally misaligned. The Act 60 community (relocated entrepreneurs) may also prefer a tool that understands both US tax requirements and LatAm business culture.

**English Caribbean (JM, TT, BS, BB):**
Very limited local competition. Most businesses use manual processes, Excel, or basic accounting tools. Kitz would face minimal direct competition but must invest in English-language localization and local payment integrations.

### 8.3 Kitz's Caribbean Competitive Advantages

1. **Multi-country architecture:** No competitor effectively spans the Caribbean. Kitz's per-workspace country configuration is a structural advantage.
2. **AI-native:** No Caribbean SMB tool offers AI-powered content creation, customer communication, or business intelligence.
3. **WhatsApp-first:** WhatsApp is the business communication backbone across the entire Caribbean. Kitz treats it as a core channel.
4. **DR e-CF compliance:** Building NCF/e-CF compliance positions Kitz as a serious player in the largest Caribbean market.
5. **Panama proven:** Kitz's existing Panama infrastructure (ITBMS, RUC, Yappy) demonstrates the ability to build country-specific compliance. The same pattern applies to DR (ITBIS, RNC, Cardnet/AZUL).
6. **Bridge positioning:** Puerto Rico lets Kitz straddle the US and LatAm payment ecosystems.

---

## 9. Implementation Roadmap

### Phase 1: Dominican Republic Foundation (Q2 2026)

| Priority | Task | Owner | Status |
|---|---|---|---|
| P0 | RNC validation in workspace onboarding (9-digit and 11-digit formats) | Engineering | Not started |
| P0 | ITBIS multi-rate support (18%, 16%, 0%) in `invoice_create` | Engineering | Not started |
| P0 | NCF type selection (B01, B02, B14, B15) per invoice | Engineering | Not started |
| P0 | DGII e-CF XML generation (type 31, 32 minimum) | Engineering | Not started |
| P0 | Digital signature integration for e-CF | Engineering | Not started |
| P1 | Cardnet or AZUL card payment integration (evaluate both) | Engineering | Not started |
| P1 | DOP currency support with RD$ display | Engineering | Not started |
| P1 | DR phone number validation (+1-809/829/849) | Engineering | Not started |
| P2 | tPago mobile payment integration | Engineering | Not started |

### Phase 2: Puerto Rico + DR Payments (Q2-Q3 2026)

| Priority | Task | Owner | Status |
|---|---|---|---|
| P0 | Stripe integration for PR market | Engineering | Not started |
| P0 | IVU (11.5%) tax calculation for PR invoices | Engineering | Not started |
| P1 | Square integration for PR POS | Engineering | Not started |
| P1 | English language UI option (for PR bilingual users) | Engineering | Not started |
| P1 | DR e-CF submission to DGII (API integration) | Engineering | Blocked by Phase 1 |
| P1 | SIPARD bank transfer references on DR invoices | Engineering | Not started |
| P2 | Act 60 tax regime flag for PR workspaces | Engineering | Not started |
| P2 | Mercado Pago DR integration | Engineering | Not started |

### Phase 3: English Caribbean Expansion (Q3-Q4 2026)

| Priority | Task | Owner | Status |
|---|---|---|---|
| P1 | WiPay integration (covers TT, JM, BB) | Engineering | Not started |
| P1 | Jamaica GCT (15%) implementation | Engineering | Not started |
| P1 | Trinidad & Tobago VAT (12.5%) implementation | Engineering | Not started |
| P1 | TRN validation (Jamaica), BIR File Number (T&T) | Engineering | Not started |
| P2 | Lynk mobile money integration (Jamaica) | Engineering | Not started |
| P2 | Bahamas VAT (10%) implementation | Engineering | Not started |
| P2 | Barbados VAT (17.5%) implementation | Engineering | Not started |
| P3 | Sand Dollar CBDC integration assessment (Bahamas) | Product | Not started |
| P3 | DCash CBDC integration assessment (ECCB/Barbados) | Product | Not started |

### Phase 4: Advanced Features + Haiti (2027+)

| Priority | Task | Owner | Status |
|---|---|---|---|
| P2 | MonCash integration for Haiti | Engineering | Not started |
| P2 | French language UI for Haiti | Engineering | Not started |
| P2 | Haiti TCA (10%) implementation | Engineering | Not started |
| P3 | Cross-border invoice support (multi-currency) | Engineering | Not started |
| P3 | CARICOM trade documentation support | Engineering | Not started |
| P3 | Regional payment reconciliation dashboard | Engineering | Not started |
| BLOCKED | Cuba market assessment | Legal | Blocked by sanctions |

---

## 10. Compliance Checklist for Launch

### Dominican Republic Launch Checklist

#### Legal & Regulatory
- [ ] DGII registration requirements assessed for Kitz as a platform
- [ ] e-CF certification process initiated with DGII
- [ ] Digital certificate procurement for e-CF signing
- [ ] Data protection compliance (DR Law 172-13 on personal data)
- [ ] Terms of service localized for DR law
- [ ] Anti-money laundering (AML) policy for DR operations

#### Tax Compliance
- [ ] ITBIS calculation supports all three rate tiers (18%, 16%, 0%)
- [ ] NCF type selection operational (B01, B02, B03, B04, B14, B15, B16)
- [ ] e-CF XML generation follows DGII technical specification
- [ ] e-CF digital signature functional
- [ ] e-CF submission to DGII Oficina Virtual API tested
- [ ] RNC validation (9-digit + 11-digit) with check digit verification
- [ ] NCF sequence management (DGII-authorized ranges, gap-free)
- [ ] ITBIS filing pre-report (monthly aggregate by rate tier)

#### Payment Processing
- [ ] Cardnet or AZUL merchant agreement signed
- [ ] Card payment webhook receiver tested end-to-end
- [ ] tPago integration evaluated
- [ ] Payment-to-invoice linking functional (DOP currency)
- [ ] Transaction data retention (5+ years) for DR

#### User Experience
- [ ] Workspace onboarding captures: business name, RNC, commercial registry
- [ ] Currency displayed as RD$ with DOP formatting
- [ ] Dates displayed as DD/MM/YYYY
- [ ] Phone numbers validated for DR area codes (809/829/849)
- [ ] All UI text in Spanish (Dominican variant where applicable)

### Puerto Rico Launch Checklist

#### Legal & Regulatory
- [ ] US data protection compliance (already required for any US operation)
- [ ] Puerto Rico Department of State business registration guidance
- [ ] Act 60 regime identification in workspace settings

#### Tax Compliance
- [ ] IVU calculation (11.5% standard, 4% reduced, 0% exempt)
- [ ] IVU breakdown on invoices (10.5% state + 1% municipal)
- [ ] EIN/SSN validation for tax ID
- [ ] Merchant certificate (Certificado de Registro de Comerciante) guidance

#### Payment Processing
- [ ] Stripe integration functional for PR
- [ ] Square integration evaluated
- [ ] US bank account support for settlement
- [ ] USD currency with standard US formatting

#### User Experience
- [ ] Bilingual UI option (Spanish default, English available)
- [ ] Date format follows US convention (MM/DD/YYYY) -- configurable
- [ ] Phone numbers validated for PR area codes (787/939)
- [ ] US ZIP code validation for PR addresses (00600-00988)

### English Caribbean Markets Launch Checklist (JM, TT, BS, BB)

#### Shared Requirements
- [ ] English language UI completed and tested
- [ ] WiPay integration functional for card payments
- [ ] Per-country tax rate configuration
- [ ] Per-country currency configuration
- [ ] Per-country tax ID validation

#### Per-Country Tax
- [ ] Jamaica GCT (15%) implemented
- [ ] Trinidad & Tobago VAT (12.5%) implemented
- [ ] Bahamas VAT (10%) implemented
- [ ] Barbados VAT (17.5%) implemented

#### Per-Country Payment
- [ ] Jamaica: Lynk mobile money evaluated
- [ ] T&T: PayWise evaluated
- [ ] Bahamas: Sand Dollar monitoring active
- [ ] Barbados: DCash monitoring active

---

## 11. Partnership Opportunities

### 11.1 Strategic Partnerships by Market

#### Dominican Republic

| Partner | Type | Value to Kitz | Approach |
|---|---|---|---|
| **Banco Popular Dominicano** | Banking + payments | Digital leader, potential API access, Cardnet co-owner | Developer partnership |
| **Cardnet** | Card processing | Dominant card acquirer, merchant onboarding | Commercial merchant agreement |
| **AZUL** | Card processing | Developer-friendly acquirer, alternative to Cardnet | API integration partnership |
| **DGII** | Government | e-CF certification, compliance credibility | Formal e-CF provider registration |
| **PROINDUSTRIA** | Government (SMB development) | SMB programs, distribution channel | Co-branded digitization initiative |

#### Puerto Rico

| Partner | Type | Value to Kitz | Approach |
|---|---|---|---|
| **Banco Popular de Puerto Rico** | Banking | Largest local bank, SMB focus | Commercial partnership |
| **Invest Puerto Rico** | Government agency | Economic development, Act 60 network | Partnership for Act 60 entrepreneur tools |
| **PYMES PR** | SMB association | Distribution to PR small businesses | Member benefit program |
| **SBA Puerto Rico** | US Government | Small Business Administration resources | Integration of SBA resources |

#### Regional Caribbean

| Partner | Type | Value to Kitz | Approach |
|---|---|---|---|
| **WiPay** | Payment gateway | Multi-island card processing (TT, JM, BB) | API integration + commercial partnership |
| **Republic Financial Holdings** | Regional bank | Multi-island banking (TT, BB, Grenada, Guyana) | Single partnership, multi-market |
| **CARICOM Secretariat** | Regional body | Single market access, trade facilitation | Explore digital trade tools |
| **Caribbean Development Bank (CDB)** | Development finance | SMB financing programs, regional credibility | Co-branded SMB digitization |
| **Digicel** | Telco + mobile money | MonCash (Haiti), Lynk (Jamaica), regional reach | Mobile money integration |

### 11.2 Distribution Partnerships

| Channel | Markets | Strategy |
|---|---|---|
| **Banks** | All markets | Bundle Kitz with business banking onboarding |
| **Accounting firms** | DR, PR, TT | Referral program for accountants recommending Kitz |
| **Chambers of Commerce** | All markets | Member benefit programs |
| **SMB development agencies** | DR (PROINDUSTRIA), PR (SBA), JM (JBDC) | Government-endorsed digitization tool |
| **Telcos** | Haiti (Digicel), Jamaica (Digicel/Flow) | Mobile money integration + distribution |
| **Tourism boards** | All markets | Seasonal business tools for tourism SMBs |

### 11.3 Cross-Border Trade Opportunities

The Caribbean has significant intra-regional trade, particularly:

- **DR <-> PR:** Strong trade relationship, diaspora connections, CAFTA-DR framework
- **CARICOM internal trade:** Single Market and Economy (CSME) aspirations
- **Tourism chains:** Hotels, tour operators, and restaurants operate across multiple islands

Kitz can differentiate by supporting multi-country workspaces that handle cross-border invoicing, multi-currency transactions, and trade documentation.

---

## 12. Appendix: Reference Links

### Dominican Republic

#### Government & Tax
- DGII Portal: https://dgii.gov.do/
- DGII Oficina Virtual: https://oficinavirtual.dgii.gov.do/
- DGII NCF Validation: https://dgii.gov.do/herramientas/consultasNCF
- DGII e-CF Documentation: https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicos
- Banco Central (BCRD): https://www.bancentral.gov.do/
- Superintendencia de Bancos (SIB): https://sb.gob.do/
- PROINDUSTRIA: https://proindustria.gob.do/

#### Payment Systems
- BANRESERVAS: https://www.banreservas.com/
- Banco Popular Dominicano: https://www.popularenlinea.com/
- Cardnet: https://www.cardnet.com.do/
- AZUL: https://www.azul.com.do/
- tPago: https://tpago.com.do/

### Puerto Rico

#### Government & Tax
- Departamento de Hacienda: https://www.hacienda.pr.gov/
- CRIM: https://www.crimpr.net/
- Invest Puerto Rico: https://www.investpr.org/
- Act 60 Information: https://www.ddec.pr.gov/en/act-60/

#### Payment Systems
- Stripe (US): https://stripe.com/
- Square (US): https://squareup.com/
- Banco Popular de Puerto Rico: https://www.bfrpr.com/ (note: different from DR Banco Popular)

### Jamaica

#### Government & Tax
- Tax Administration Jamaica (TAJ): https://www.jamaicatax.gov.jm/
- Bank of Jamaica (BOJ): https://boj.org.jm/
- Jamaica Business Development Corporation (JBDC): https://www.jbdc.net/

#### Payment Systems
- NCB Jamaica: https://www.jncb.com/
- Lynk: https://www.lynk.com.jm/
- JN Money: https://www.jnmoney.com/

### Trinidad & Tobago

#### Government & Tax
- Board of Inland Revenue (BIR): https://www.ird.gov.tt/
- Central Bank of T&T (CBTT): https://www.central-bank.org.tt/

#### Payment Systems
- First Citizens Bank: https://www.firstcitizenstt.com/
- Republic Bank: https://www.republictt.com/
- WiPay: https://wipayfinancial.com/

### Haiti

#### Government & Tax
- Direction Generale des Impots (DGI): https://www.dfrhaiti.org/
- Banque de la Republique d'Haiti (BRH): https://www.brh.ht/

#### Payment Systems
- MonCash (Digicel Haiti): https://www.digicelgroup.com/ht/en/moncash.html
- Sogebank: https://www.sogebank.com/

### Bahamas

#### Government & Tax
- Department of Inland Revenue: https://inlandrevenue.finance.gov.bs/
- Central Bank of The Bahamas: https://www.centralbankbahamas.com/

#### Payment Systems
- Sand Dollar: https://www.sanddollar.bs/

### Barbados

#### Government & Tax
- Barbados Revenue Authority (BRA): https://bra.gov.bb/
- Central Bank of Barbados: https://www.centralbank.org.bb/

#### Payment Systems
- Bitt (DCash): https://www.bfrpay.com/
- ECCB DCash: https://www.eccb-centralbank.org/p/what-you-should-know-702

### Regional / Cross-Caribbean

- CARICOM Secretariat: https://caricom.org/
- Caribbean Development Bank (CDB): https://www.caribank.org/
- ECCB (Eastern Caribbean Central Bank): https://www.eccb-centralbank.org/
- CAFTA-DR Trade Agreement: https://ustr.gov/trade-agreements/free-trade-agreements/cafta-dr-dominican-republic-central-america-fta

### Kitz Codebase References
- Payment tools: `kitz_os/src/tools/paymentTools.ts`
- Invoice/quote tools: `kitz_os/src/tools/invoiceQuoteTools.ts`
- Invoice workflow: `kitz_os/data/n8n-workflows/invoice-auto-generate.json`
- Panama infrastructure doc: `docs/intelligence/PANAMA_INFRASTRUCTURE.md`

---

*This document should be reviewed and updated quarterly as Caribbean regulatory and payment landscapes evolve. Key monitoring dates: DGII e-CF mandate expansion (ongoing), CBDC adoption metrics (Sand Dollar, DCash), US-Cuba sanctions policy changes, CARICOM single market developments, and WiPay/Lynk/MonCash platform expansions.*
