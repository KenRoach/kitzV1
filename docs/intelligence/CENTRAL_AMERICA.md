# Central America Financial & Payment Infrastructure Intelligence

**(Costa Rica, Guatemala, Honduras, El Salvador, Nicaragua, Belize)**

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

Central America represents Kitz's natural expansion corridor from Panama. Six countries -- Costa Rica, Guatemala, Honduras, El Salvador, Nicaragua, and Belize -- together constitute a market of approximately 50 million people and millions of SMBs operating in varying stages of digital maturity. The region shares a dominant payment network (BAC Credomatic operates in all six countries), a common mobile money provider (Tigo Money in Guatemala, Honduras, and El Salvador), and converging e-invoicing mandates that are creating the same compliance pressure that drives adoption in Panama.

**Key strategic takeaways:**

- **Costa Rica is the highest-priority expansion market.** SINPE Movil (central bank instant payments, phone-number-based) has achieved massive consumer adoption. Factura Electronica has been mandatory since 2018, the REST API from Hacienda is well-documented, and the market is digitally sophisticated. Kitz should add `'sinpe'` to the `paymentTools.ts` provider enum immediately.

- **Guatemala is the largest economy in Central America** and has a fully mandatory e-invoicing system (FEL -- Factura Electronica en Linea). All taxpayers must issue FEL documents through SAT-certified providers. Tigo Money dominates mobile payments. This market has both scale and regulatory clarity.

- **El Salvador introduces unique Bitcoin requirements.** Since the Ley Bitcoin (2021), BTC is legal tender. Businesses are technically required to accept Bitcoin (though enforcement is relaxed). The Chivo Wallet ecosystem and Lightning Network integration create opportunities that no other Central American market offers. El Salvador also uses USD (dollarized since 2001), eliminating currency risk.

- **Honduras and Nicaragua are earlier-stage markets** with growing digital payment adoption (Tigo Money, BAC) but less mature e-invoicing mandates. Honduras is implementing its Factura Electronica system; Nicaragua's is still in development.

- **Belize is a niche market** -- English-speaking, small economy, limited digital payment infrastructure, no e-invoicing mandate. Low priority but unique positioning for English-speaking Caribbean expansion.

- **BAC Credomatic is the single most important regional partner.** It operates across ALL six countries and Panama, offering card acceptance, digital banking, and merchant services under a unified brand. A regional BAC partnership could unlock Kitz across all seven markets simultaneously.

- **Remittances are a dominant economic force** in Honduras (>25% of GDP), El Salvador (>24% of GDP), and Guatemala (>18% of GDP). Kitz should consider how SMBs interact with remittance flows -- many small businesses serve as informal remittance distribution points.

**Market prioritization for Kitz expansion:**

```
Priority 1: Costa Rica    -- Most mature digital ecosystem, mandatory e-invoicing, SINPE Movil
Priority 2: Guatemala     -- Largest economy, mandatory FEL, Tigo Money scale
Priority 3: El Salvador   -- USD economy, Bitcoin opportunity, DTE rollout
Priority 4: Honduras      -- Growing digital adoption, remittance corridor
Priority 5: Nicaragua     -- Political risk, but BAC/Tigo presence
Priority 6: Belize        -- Niche English-speaking market, limited digital infra
```

---

## 2. Payment Systems

### 2.1 Costa Rica -- SINPE Movil

**What it is:**
SINPE Movil is an instant payment system operated by the Banco Central de Costa Rica (BCCR). It allows real-time person-to-person and person-to-business transfers using only the recipient's mobile phone number. Launched in 2015, it has achieved near-universal adoption among banked Costa Ricans, with over 5 million registered accounts (in a country of 5.2 million people). Transfers are free or near-free, settle instantly, and work across all participating banks.

**Why Kitz needs it:**
SINPE Movil is Costa Rica's equivalent of Yappy in Panama but with even broader adoption because it is a central bank system, not a single-bank product. Every Costa Rican bank participates. For Kitz to succeed in Costa Rica, SINPE Movil payment acceptance is non-negotiable.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Operator | BCCR (Banco Central de Costa Rica) via SINPE platform |
| Transfer type | Real-time, irrevocable, 24/7 |
| Identifier | Recipient mobile phone number (linked to bank account) |
| Limits | Up to CRC 500,000 (~USD 900) per transaction for individuals; higher for businesses |
| Cost | Free or minimal fee (varies by bank, typically CRC 0-150) |
| Settlement | Instant to recipient's linked bank account |
| API access | Not directly -- banks provide APIs on top of SINPE; some aggregators exist |
| For Kitz | Indirect integration via bank APIs or payment aggregators |

**Integration pattern for Kitz:**

```
1. Kitz generates SINPE Movil payment request
   -> Displays registered phone number + amount to customer
2. Customer opens their banking app (any Costa Rican bank)
3. Customer initiates SINPE Movil transfer to displayed number
4. Transfer settles instantly in workspace owner's bank account
5. Kitz reconciles via bank notification / API / manual confirmation
6. Invoice status -> 'paid', CRM updated, receipt sent
```

**Key challenge:**
Unlike Yappy (which has a merchant SDK with webhooks), SINPE Movil does not have a standardized merchant API. Integration options:
- **Bank-specific APIs:** Some banks (BAC, Banco Nacional) offer business APIs that can detect incoming SINPE Movil transfers. Kitz would need per-bank integration.
- **Payment aggregators:** Services like Greenpay or PayRetailers offer unified APIs on top of SINPE Movil.
- **Manual reconciliation:** As a fallback, workspace owners confirm received payments manually, and Kitz matches them against invoices.

**Implementation timeline:** Q2-Q3 2026 -- requires bank API partnership or aggregator selection.

**Action items:**
1. Add `'sinpe'` to the `paymentTools.ts` provider enum.
2. Evaluate Greenpay and PayRetailers as SINPE Movil aggregators.
3. Contact BAC Costa Rica and Banco Nacional for business API access.
4. Build payment instruction display (phone number + amount + reference) on invoices.
5. Implement reconciliation flow for SINPE Movil payments.

---

### 2.2 Costa Rica -- BAC Credomatic Costa Rica

**What it is:**
BAC Credomatic is the largest private bank in Central America and the dominant card acquirer in Costa Rica. It offers merchant services (POS terminals, e-commerce payment gateway), credit/debit card issuance, and business banking. BAC's e-commerce gateway supports Visa, Mastercard, and American Express with local and international cards.

**Why Kitz needs it:**
BAC provides card payment acceptance for customers who prefer cards over SINPE Movil, especially for higher-value transactions and international customers. BAC's regional presence means a single integration can be extended across all Central American markets.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Gateway | BAC Credomatic e-commerce gateway |
| Card types | Visa, Mastercard, AMEX (credit and debit) |
| Installments | Tasa cero (0% interest installment plans) for local cards |
| Settlement | Into merchant's BAC business account |
| Security | PCI-DSS compliant, 3D Secure 2.0 supported |
| API | REST API available for approved merchants |
| SDK | JavaScript SDK for hosted payment forms |

**Implementation timeline:** Q2-Q3 2026 -- aligned with regional BAC partnership.

---

### 2.3 Guatemala -- Tigo Money

**What it is:**
Tigo Money is a mobile money service operated by Millicom (Tigo) in Guatemala, Honduras, and El Salvador. It allows users to store money in a mobile wallet linked to their phone number, make P2P transfers, pay bills, and purchase goods at participating merchants. In Guatemala, Tigo Money is the most widely used mobile money platform, reaching populations underserved by traditional banking.

**Why Kitz needs it:**
Guatemala has a large unbanked and underbanked population (~65% of adults). Tigo Money reaches many of these individuals. SMBs that serve mass-market customers need Tigo Money acceptance to capture this segment. For Kitz workspaces in Guatemala, Tigo Money is a critical payment channel.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Operator | Millicom (Tigo Guatemala) |
| User base | 3M+ active wallets in Guatemala |
| Transfer type | Near-instant, phone-number-based |
| Merchant integration | Tigo Money Comercio -- merchant payment acceptance |
| API | Tigo Money API for approved partners (REST-based) |
| Limits | GTQ 10,000 (~USD 1,300) per transaction |
| Cost | Merchant fees: 1-3% per transaction |
| Settlement | Into merchant's Tigo Money wallet or linked bank account |

**Integration pattern for Kitz:**

```
1. Kitz generates Tigo Money payment request via API
   -> Returns payment reference / QR code
2. Customer opens Tigo Money app or dials USSD code (*555#)
3. Customer confirms payment with PIN
4. Tigo Money processes and sends webhook notification
5. Kitz calls payments_processWebhook(provider: 'tigo_money', ...)
6. Invoice updated, CRM updated, receipt sent
```

**Implementation timeline:** Q3-Q4 2026 -- aligned with Guatemala market entry.

**Action items:**
1. Add `'tigo_money'` to the `paymentTools.ts` provider enum.
2. Contact Millicom/Tigo commercial team for API partner access.
3. Build USSD fallback instructions for customers without smartphones.
4. Implement Tigo Money webhook receiver.

---

### 2.4 Guatemala -- Banco Industrial (BI) & BAC Guatemala

**What it is:**
Banco Industrial (BI) is Guatemala's largest bank by assets. Together with BAC Guatemala, they dominate the corporate and SMB banking market. Both offer merchant services, card acquiring, and digital banking products.

**Why Kitz needs it:**
BI and BAC are the primary bank transfer destinations for B2B payments in Guatemala. Invoice payment instructions should support both banks' transfer formats.

**Implementation timeline:** Q4 2026 -- aligned with Guatemala expansion.

---

### 2.5 Honduras -- Payment Ecosystem

**Key payment channels:**

| Provider | Type | Coverage | Priority |
|---|---|---|---|
| Tigo Money Honduras | Mobile money | Wide -- especially unbanked population | High |
| BAC Honduras | Cards + banking | SMB and corporate segments | High |
| Banco Atlantida | Banking | Largest Honduran bank | Medium |
| Ficohsa | Banking | Growing digital presence | Medium |

**Tigo Money** operates identically to the Guatemala integration (same parent company, same API structure). A single Tigo Money integration can serve Guatemala, Honduras, and El Salvador.

**Implementation timeline:** Q4 2026-Q1 2027 -- follows Guatemala Tigo Money integration.

---

### 2.6 El Salvador -- Payment Ecosystem + Bitcoin

**Standard payment channels:**

| Provider | Type | Coverage | Priority |
|---|---|---|---|
| BAC El Salvador | Cards + banking | Primary card acquirer | High |
| Tigo Money El Salvador | Mobile money | Mass-market payments | High |
| Chivo Wallet | Bitcoin/USD wallet | Government-backed, declining usage | Medium |
| Traditional banks | Wire/ACH | B2B payments | Medium |

**Bitcoin / Lightning Network:**

El Salvador's Ley Bitcoin (September 2021) made Bitcoin legal tender alongside USD. Key implications for Kitz:

| Aspect | Detail |
|---|---|
| Legal requirement | Businesses MUST accept BTC if customer offers it (Article 7, Ley Bitcoin) |
| Enforcement | Relaxed in practice -- most businesses ignore the mandate without penalty |
| Chivo Wallet | Government-developed wallet, free BTC-to-USD conversion at point of sale |
| Lightning Network | Preferred for retail BTC payments (fast, low fees) |
| Price display | Businesses must display BTC prices (convertible in real-time) -- rarely enforced |
| Tax treatment | Capital gains on BTC are exempt from tax in El Salvador |
| Kitz opportunity | Differentiation -- no other SMB platform in the region handles BTC natively |

**Bitcoin integration considerations for Kitz:**

```
Option A: Lightning Network via BTCPay Server (open source)
  - Self-hosted, no third-party custody
  - Instant settlement
  - Can auto-convert to USD via exchange API
  - Kitz hosts or workspace owner hosts

Option B: Strike API
  - Managed Lightning payments
  - Instant USD settlement (receives BTC, deposits USD)
  - Simpler integration than self-hosted
  - Popular in El Salvador

Option C: Chivo Wallet integration
  - Government wallet with built-in BTC<->USD conversion
  - API availability uncertain / limited documentation
  - Political risk (tied to government)

Recommended: Option B (Strike) for simplicity, with Option A (BTCPay) for
advanced users who want self-custody.
```

**Integration pattern for BTC payments in Kitz:**

```
1. Kitz generates Lightning invoice (via Strike or BTCPay)
   -> Returns BOLT11 invoice / QR code / payment link
2. Customer scans QR with any Lightning wallet (Chivo, Muun, Phoenix, etc.)
3. Payment settles in <3 seconds on Lightning Network
4. Strike auto-converts BTC to USD and deposits in merchant's bank account
   OR BTCPay stores BTC in merchant's wallet
5. Kitz receives webhook -> payments_processWebhook(provider: 'lightning', ...)
6. Invoice updated with BTC payment amount + USD equivalent at time of payment
7. CRM updated, receipt sent
```

**Implementation timeline:** Q3 2026 -- differentiator for El Salvador market entry.

**Action items:**
1. Add `'lightning'` and `'chivo'` to the `paymentTools.ts` provider enum.
2. Evaluate Strike API vs BTCPay Server for Lightning integration.
3. Build BTC price display component (real-time conversion from USD invoice amount).
4. Implement dual-currency receipt (USD amount + BTC equivalent).
5. Research regulatory requirements for handling BTC in other Central American markets.

---

### 2.7 Nicaragua -- Payment Ecosystem

**Key payment channels:**

| Provider | Type | Coverage | Priority |
|---|---|---|---|
| BAC Nicaragua | Cards + banking | Largest private bank | High |
| Banpro (Grupo Promerica) | Banking | Major bank, growing digital | Medium |
| Lafise | Banking | Regional bank with digital services | Medium |
| Tigo Money Nicaragua | Mobile money | Limited compared to GT/HN/SV | Low |

**Political/sanctions risk:** Nicaragua's political situation creates uncertainty for international payment processing. Some US-based payment processors restrict Nicaragua operations. Kitz must verify that any payment partner (Stripe, PayPal) supports Nicaragua before committing to market entry.

**Implementation timeline:** Q1-Q2 2027 -- lower priority, monitor political situation.

---

### 2.8 Belize -- Payment Ecosystem

**Key payment channels:**

| Provider | Type | Coverage | Priority |
|---|---|---|---|
| Atlantic Bank | Banking | Largest bank | Medium |
| Belize Bank | Banking | Second largest | Medium |
| Heritage Bank | Banking | Growing presence | Low |
| E-Kyash | Mobile money | Emerging mobile wallet | Low |

**Digital payment landscape:**
Belize has limited digital payment infrastructure compared to its Central American neighbors. Cash remains dominant. Card acceptance is concentrated in tourism-heavy areas (Belize City, San Pedro, Placencia). There is no equivalent to SINPE Movil or Tigo Money at scale.

**Implementation timeline:** 2027+ -- niche market, low priority.

---

### 2.9 Cross-Regional Payment Comparison

| Feature | Costa Rica | Guatemala | Honduras | El Salvador | Nicaragua | Belize |
|---|---|---|---|---|---|---|
| **Dominant digital payment** | SINPE Movil | Tigo Money | Tigo Money | BAC + Lightning | BAC | Cards (tourism) |
| **BAC presence** | Yes | Yes | Yes | Yes | Yes | No |
| **Mobile money** | Limited (SINPE is better) | Tigo Money | Tigo Money | Tigo Money | Tigo Money (limited) | E-Kyash (nascent) |
| **Card penetration** | High | Medium | Medium-Low | Medium | Medium-Low | Low (except tourism) |
| **Bitcoin relevance** | None | None | None | Legal tender | None | None |
| **Kitz provider enum** | `sinpe`, `bac` | `tigo_money`, `bac` | `tigo_money`, `bac` | `lightning`, `bac`, `tigo_money` | `bac` | `bac` |

---

## 3. Banking & Interbank Infrastructure

### 3.1 BAC Credomatic -- Regional Network

**What it is:**
BAC Credomatic (Banco de America Central) is the largest financial group in Central America, operating in all six countries covered by this document plus Panama. It is a subsidiary of Grupo Aval (Colombia). BAC offers retail banking, commercial banking, card issuing, card acquiring, merchant services, and digital banking across the region.

**Why this is Kitz's most important regional partner:**
A single partnership with BAC Credomatic at the regional level could unlock payment acceptance, merchant services, and banking APIs across seven countries. No other institution has this reach in Central America.

**BAC presence by country:**

| Country | Entity | Merchant services | Digital banking | Card acquiring |
|---|---|---|---|---|
| Costa Rica | BAC San Jose | Yes | Yes | Yes |
| Guatemala | BAC Guatemala | Yes | Yes | Yes |
| Honduras | BAC Honduras | Yes | Yes | Yes |
| El Salvador | BAC El Salvador | Yes | Yes | Yes |
| Nicaragua | BAC Nicaragua | Yes | Yes | Yes |
| Belize | N/A | N/A | N/A | N/A |
| Panama | BAC Panama | Yes | Yes | Yes |

**Integration strategy:**
- Negotiate a **regional API partnership** with BAC Credomatic HQ (San Jose, Costa Rica).
- Single integration, deployed across all BAC countries.
- Payment types: card acceptance, payment links, merchant settlement.
- Kitz's `paymentTools.ts` already includes `'bac'` in the provider enum -- extend to country-specific configurations.

**Action items:**
1. Identify BAC Credomatic's regional fintech partnership team.
2. Propose a regional API integration covering all BAC countries.
3. Build country-configurable BAC integration in `paymentTools.ts`.

---

### 3.2 Costa Rica -- SINPE (Sistema Nacional de Pagos Electronicos)

**What it is:**
SINPE is Costa Rica's national electronic payment system, operated by the Banco Central de Costa Rica (BCCR). It encompasses multiple payment subsystems:

| Subsystem | Purpose | Relevance to Kitz |
|---|---|---|
| SINPE Movil | Instant P2P/P2B transfers via phone number | Primary payment channel |
| SINPE Transferencia | Interbank transfers via IBAN | B2B payments |
| BN Servicios | Bill payment network | Utility and service payments |
| Domiciliaciones | Direct debit / recurring payments | Subscription billing (future) |

**IBAN format for Costa Rica:**
Costa Rica adopted IBAN (International Bank Account Number) in 2019. Format: `CR` + 2 check digits + 3-digit bank code + 14-digit account number = 22 characters total.

Example: `CR05015202001026284066`

**For Kitz invoices:** Display the workspace owner's IBAN on invoices for bank transfer payments.

---

### 3.3 Guatemala -- Banking System

**Key banks for SMBs:**

| Bank | Market share | Digital capabilities | Relevance |
|---|---|---|---|
| Banco Industrial (BI) | ~30% of assets | Good -- mobile app, online banking | Largest bank, many SMB accounts |
| BAC Guatemala | ~12% | Strong -- regional digital platform | Card acquiring, merchant services |
| Banrural | ~15% | Basic -- focused on rural areas | Reaches underserved rural SMBs |
| G&T Continental | ~10% | Moderate | Corporate and SMB banking |

**Interbank system:** Guatemala's interbank clearing is operated by Bancared, which connects all member banks for ACH-style transfers. Not as advanced as Costa Rica's SINPE but functional for B2B transfers.

---

### 3.4 Honduras -- Banking System

**Key banks:**

| Bank | Role | Notes |
|---|---|---|
| Banco Atlantida | Largest by assets | Strong branch network, growing digital |
| Ficohsa | Second largest | Acquired Citibank Honduras operations |
| BAC Honduras | Major player | Regional digital platform |
| Banco de Occidente | Important regional | Strong in western Honduras |

**Interbank system:** Honduras uses the ACH system operated by the Banco Central de Honduras (BCH). Real-time gross settlement (LBTR) is available for high-value transactions.

---

### 3.5 El Salvador -- Banking System

**Key banks:**

| Bank | Role | Notes |
|---|---|---|
| Banco Agricola (Bancolombia) | Largest by assets | Colombian-owned, strong digital |
| BAC El Salvador | Major player | Regional platform |
| Banco Davivienda | Growing presence | Colombian-owned |
| Banco Cuscatlan (Grupo Terra) | Important player | Honduran-owned |

**Remittance infrastructure:** El Salvador receives ~$8 billion annually in remittances (>24% of GDP), primarily from the US. Major remittance operators: Western Union, MoneyGram, Remitly, and the government's Chivo Wallet (which supports BTC remittances). Many SMBs' revenue is tied to remittance-fueled consumer spending.

---

### 3.6 Nicaragua -- Banking System

**Key banks:**

| Bank | Role | Notes |
|---|---|---|
| BAC Nicaragua | Largest private bank | Regional platform |
| Banpro (Grupo Promerica) | Second largest | Strong commercial banking |
| Lafise Bancentro | Major player | Regional group |
| Banco de la Produccion (Banpro) | Important | SMB focus |

**Sanctions considerations:** Some Nicaraguan entities and individuals are subject to US OFAC sanctions. Kitz must implement sanctions screening for Nicaraguan workspaces. Payment processors may impose additional restrictions or decline to operate in Nicaragua.

---

### 3.7 Belize -- Banking System

**Key banks:**

| Bank | Role | Notes |
|---|---|---|
| Atlantic Bank | Largest | Subsidiary of Sociedad Nacional de Inversiones (Honduras) |
| Belize Bank | Second largest | Domestic private bank |
| Heritage Bank | Third | Growing presence |
| ScotiaBank Belize | International | Limited retail, exiting some markets |

**Correspondent banking:** Belize has faced challenges with correspondent banking relationships (de-risking by US banks). This affects international wire transfers and may impact Kitz's ability to process cross-border payments for Belizean workspaces.

---

## 4. Government & Regulatory Bodies

### 4.1 Costa Rica -- Ministerio de Hacienda

**Tax authority:** Ministerio de Hacienda (Ministry of Finance)
**Tax administration:** Direccion General de Tributacion (DGT)
**E-invoicing authority:** Administracion Tributaria Virtual (ATV)

**Key tax IDs:**

| ID Type | Description | Format | Validation |
|---|---|---|---|
| Cedula Juridica | Legal entity ID | 10 digits: `X-XXX-XXXXXX` | Type prefix (2=SA, 3=SRL, etc.) + sequential |
| Cedula Fisica | Personal ID | 9 digits: `X-XXXX-XXXX` | Province + volume + entry |
| NITE | Tax ID for foreigners | 10 digits | Assigned by DGT |
| DIMEX | Foreigner resident ID | 11-12 digits | Used for tax purposes |

**Cedula Juridica validation:**

```typescript
function validateCedulaJuridica(cedula: string): { valid: boolean; type: string; error?: string } {
  const normalized = cedula.replace(/[\s\-]/g, '');

  // Legal entity: 10 digits, starts with 2, 3, or 4
  if (/^[234]\d{9}$/.test(normalized)) {
    const types: Record<string, string> = {
      '2': 'sociedad_anonima',        // S.A.
      '3': 'sociedad_responsabilidad', // S.R.L. or cooperatives
      '4': 'sucursal_extranjera',      // Foreign branch
    };
    return { valid: true, type: types[normalized[0]] || 'legal_entity' };
  }

  return { valid: false, type: 'unknown', error: 'Invalid Cedula Juridica format' };
}

function validateCedulaFisica(cedula: string): { valid: boolean; error?: string } {
  const normalized = cedula.replace(/[\s\-]/g, '');

  // Physical person: 9 digits, province (1-7) + volume (0001-9999) + entry (0001-9999)
  if (/^[1-7]\d{8}$/.test(normalized)) {
    return { valid: true };
  }

  return { valid: false, error: 'Invalid Cedula Fisica format' };
}
```

**IVA (Impuesto al Valor Agregado):**
Costa Rica transitioned from a sales tax (Impuesto General sobre las Ventas) to a full IVA (VAT) system in July 2019 under the Ley de Fortalecimiento de las Finanzas Publicas (Law 9635).

| Rate | Application |
|---|---|
| **13%** | Standard rate -- most goods and services |
| **4%** | Private health services, certain private education |
| **2%** | Essential medicines (prescription), certain agricultural inputs |
| **1%** | Basic food basket items (canasta basica tributaria) |
| **0%** | Exports, basic grains, public transport, residential rent (<1.5 base salary) |
| **Exempt** | Financial services, insurance premiums, public education, public health |

**Filing obligations:**
- Monthly IVA declaration due by the 15th of following month.
- Annual income tax (ISR) declaration due by March 15.
- Informative declarations (D-151, D-152) for purchases and withholdings.

---

### 4.2 Costa Rica -- Factura Electronica (Mandatory Since 2018)

**What it is:**
Costa Rica mandated electronic invoicing for all taxpayers beginning in 2018, making it one of the earliest and most complete e-invoicing systems in Central America. The system is managed by the DGT through the Administracion Tributaria Virtual (ATV) platform.

**Why this matters for Kitz:**
Costa Rica's e-invoicing system is mature, well-documented, and enforced. Every Kitz workspace in Costa Rica must generate Hacienda-compliant electronic documents. Unlike Panama (where the mandate is still ramping up), Costa Rica has been enforcing this for 7+ years -- there is zero tolerance for non-compliance.

**Technical architecture:**

| Component | Detail |
|---|---|
| Document format | XML (Hacienda-defined schema, v4.3 as of 2025) |
| Signing | XML Digital Signature (XAdES-BES) using P12 certificate |
| Submission | REST API to Hacienda (ATV web services) |
| Authentication | OAuth 2.0 via Identity Provider (IDP) with Cedula + credentials |
| Unique key | Clave Numerica -- 50-digit key identifying each document |
| Response | Hacienda returns acceptance (aceptado) or rejection (rechazado) XML |
| Storage | Issuer must retain XML documents for 5 years |

**Clave Numerica (50-digit key) structure:**

```
Position  Length  Content
1-3       3      Country code (506 = Costa Rica)
4-5       2      Day of issue
6-7       2      Month of issue
8-9       2      Year of issue (last 2 digits)
10-21     12     Cedula of issuer (padded with zeros)
22-41     20     Consecutive number (branch + terminal + type + sequence)
42        1      Situation code (1=normal, 2=contingency, 3=no internet)
43-50     8      Security code (random, generated by issuer)
```

**Example Clave Numerica:**
`50624022630112345678900100010100000000011234567`

**Document types:**

| Code | Type | Kitz mapping |
|---|---|---|
| 01 | Factura Electronica | Standard invoice |
| 02 | Nota de Debito Electronica | Debit note |
| 03 | Nota de Credito Electronica | Credit note |
| 04 | Tiquete Electronico | Simplified receipt (B2C, no recipient ID required) |
| 05 | Confirmacion de Aceptacion | Buyer acceptance of received invoice |
| 06 | Confirmacion de Aceptacion Parcial | Partial acceptance |
| 07 | Rechazo de Documento | Buyer rejection of received invoice |
| 08 | Factura Electronica de Compra | Purchase invoice (self-invoicing for agricultural purchases) |
| 09 | Factura Electronica de Exportacion | Export invoice |

**Hacienda REST API integration:**

```
Base URL (production): https://api.comprobanteselectronicos.go.cr/recepcion/v1/
Base URL (sandbox):    https://api-sandbox.comprobanteselectronicos.go.cr/recepcion/v1/

Endpoints:
  POST /recepcion          -- Submit document (XML in request body)
  GET  /recepcion/{clave}  -- Check document status by Clave Numerica
  POST /comprobantes       -- Alternative submission endpoint
```

**Authentication flow:**

```
1. POST https://idp.comprobanteselectronicos.go.cr/auth/realms/rut/protocol/openid-connect/token
   Body (form-encoded):
     grant_type=password
     client_id=api-prod  (or api-stag for sandbox)
     username={cedula}@{tipo_cedula}  (e.g., 3101123456@02 for juridica)
     password={ATV_password}

2. Receive access_token (Bearer token, expires in 300 seconds)

3. Use token in subsequent API calls:
   Authorization: Bearer {access_token}
```

**XML submission example:**

```typescript
interface HaciendaSubmission {
  clave: string;         // 50-digit Clave Numerica
  fecha: string;         // ISO 8601 date
  emisor: {
    tipoIdentificacion: '01' | '02' | '03' | '04'; // Fisica, Juridica, DIMEX, NITE
    numeroIdentificacion: string;
  };
  receptor?: {
    tipoIdentificacion: string;
    numeroIdentificacion: string;
  };
  comprobanteXml: string; // Base64-encoded signed XML document
}

// Submit to Hacienda
async function submitToHacienda(doc: HaciendaSubmission, token: string): Promise<void> {
  const response = await fetch('https://api.comprobanteselectronicos.go.cr/recepcion/v1/recepcion', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(doc),
  });

  if (response.status === 202) {
    // Document accepted for processing -- poll for result
    console.log('Document submitted successfully, awaiting Hacienda response');
  } else {
    throw new Error(`Hacienda submission failed: ${response.status}`);
  }
}
```

**Implementation timeline:** Q2 2026 -- critical for Costa Rica market entry.

**Action items:**
1. Study Hacienda API documentation at https://www.hacienda.go.cr/ATV/ComprobanteElectronico
2. Implement Clave Numerica generation (50-digit key builder).
3. Build XML document generator following Hacienda schema v4.3.
4. Implement XML digital signature (XAdES-BES) with P12 certificate management.
5. Build OAuth 2.0 authentication flow for ATV IDP.
6. Implement document submission and status polling.
7. Build sandbox testing pipeline before production.

---

### 4.3 Guatemala -- SAT (Superintendencia de Administracion Tributaria)

**Tax authority:** SAT (Superintendencia de Administracion Tributaria)
**E-invoicing system:** FEL (Factura Electronica en Linea)

**Key tax IDs:**

| ID Type | Description | Format | Validation |
|---|---|---|---|
| NIT | Numero de Identificacion Tributaria | 7-9 digits + check digit | Luhn-like algorithm |
| CUI | Codigo Unico de Identificacion | 13 digits | National ID (DPI) |

**NIT validation (Guatemala):**

```typescript
function validateNITGuatemala(nit: string): { valid: boolean; error?: string } {
  // Remove dashes and spaces
  const normalized = nit.replace(/[\s\-]/g, '').toUpperCase();

  // NIT format: digits followed by optional check digit after dash
  // Common formats: 1234567-8 or 12345678 or 1234567K
  const match = normalized.match(/^(\d{5,9})([0-9K])$/);
  if (!match) {
    return { valid: false, error: 'Invalid NIT format: must be 6-10 characters (digits + check digit)' };
  }

  const digits = match[1];
  const checkDigit = match[2];

  // Validate check digit using weighted sum modulo 11
  let sum = 0;
  const len = digits.length;
  for (let i = 0; i < len; i++) {
    sum += parseInt(digits[i]) * (len + 1 - i);
  }

  const remainder = sum % 11;
  const expectedCheck = remainder === 0 ? '0' : (11 - remainder === 10 ? 'K' : String(11 - remainder));

  if (checkDigit !== expectedCheck) {
    return { valid: false, error: `Invalid check digit: expected ${expectedCheck}, got ${checkDigit}` };
  }

  return { valid: true };
}
```

**Tax rates (Guatemala):**

| Tax | Rate | Application |
|---|---|---|
| IVA | **12%** | Standard rate on goods and services |
| ISR (individuals) | 5% or 7% | Income tax (depends on regime) |
| ISR (companies) | 25% | Corporate income tax |
| ISO | 1% | Solidarity tax on gross revenue (alternative minimum) |
| IDP | Varies | Petroleum distribution tax |

---

### 4.4 Guatemala -- FEL (Factura Electronica en Linea)

**What it is:**
FEL is Guatemala's mandatory electronic invoicing system. Since 2022, ALL taxpayers must issue electronic invoices through SAT-certified FEL providers (Certificadores). The system replaced the previous paper-based and pre-printed invoice regime entirely.

**Technical architecture:**

| Component | Detail |
|---|---|
| Document format | XML (SAT-defined schema) |
| Certification | Documents must be certified by SAT-approved Certificador |
| Authorization | SAT authorizes each document and returns a UUID |
| Signing | Certificador digitally signs on behalf of the issuer |
| Storage | Certificador retains documents; SAT maintains central registry |
| Lookup | Public lookup at https://fel.sat.gob.gt/verificador |

**Document types in FEL:**

| Code | Type | Kitz mapping |
|---|---|---|
| FACT | Factura | Standard invoice |
| FCAM | Factura Cambiaria | Exchange invoice |
| FPEQ | Factura Pequeno Contribuyente | Small taxpayer invoice |
| FCAP | Factura Cambiaria de Pequeno Contribuyente | Small taxpayer exchange |
| FESP | Factura Especial | Special invoice (self-invoicing for informal suppliers) |
| NABN | Nota de Abono | Credit note |
| RDON | Recibo por Donacion | Donation receipt |
| RECI | Recibo | Receipt |
| NDEB | Nota de Debito | Debit note |
| NCRE | Nota de Credito | Credit note |

**FEL Certificador integration flow:**

```
1. Kitz generates invoice data (JSON/XML)
2. Kitz sends to Certificador API
3. Certificador validates, signs, and submits to SAT
4. SAT authorizes and returns UUID (autorizacion)
5. Certificador returns signed XML + UUID to Kitz
6. Kitz stores authorized invoice and displays UUID to user
7. Invoice is now legally valid and verifiable at SAT portal
```

**Major FEL Certificadores (potential partners):**

| Certificador | Market share | API quality | Notes |
|---|---|---|---|
| Megaprint | Largest | Good REST API | Market leader, well-documented |
| Infile | Large | Good | Strong in corporate segment |
| Guatefacturas | Medium | Moderate | SMB-focused |
| G4S | Medium | Good | Part of security conglomerate |
| FORCON | Smaller | Basic | Budget option |
| Digifact | Medium | Good | Growing, modern API |

**Implementation timeline:** Q3-Q4 2026 -- required for Guatemala market entry.

**Action items:**
1. Select a FEL Certificador partner (recommend Megaprint or Digifact for API quality).
2. Obtain SAT certification for Kitz as an issuer through the selected Certificador.
3. Build Certificador API integration for document submission and retrieval.
4. Implement SAT UUID storage and display on invoices.
5. Build FEL document type mapping from Kitz invoice types.

---

### 4.5 Honduras -- SAR (Servicio de Administracion de Rentas)

**Tax authority:** SAR (Servicio de Administracion de Rentas), formerly DEI (Direccion Ejecutiva de Ingresos)

**Key tax IDs:**

| ID Type | Description | Format | Validation |
|---|---|---|---|
| RTN | Registro Tributario Nacional | 14 digits: `XXXX-XXXX-XXXXX` | Based on national ID number |

**RTN validation (Honduras):**

```typescript
function validateRTN(rtn: string): { valid: boolean; type: string; error?: string } {
  const normalized = rtn.replace(/[\s\-]/g, '');

  // RTN: 14 digits
  if (!/^\d{14}$/.test(normalized)) {
    return { valid: false, type: 'unknown', error: 'RTN must be exactly 14 digits' };
  }

  // First 4 digits indicate municipality
  // Next 4 digits are sequential
  // Last 5 digits include check digit
  // Prefix 08 = natural person (based on ID card)
  // Other prefixes = legal entities

  const isNaturalPerson = normalized.startsWith('08');
  return {
    valid: true,
    type: isNaturalPerson ? 'natural_person' : 'legal_entity',
  };
}
```

**Tax rates (Honduras):**

| Tax | Rate | Application |
|---|---|---|
| ISV (Impuesto Sobre Ventas) | **15%** | Standard rate (one of highest in Central America) |
| ISV reduced | **18%** | Alcoholic beverages, tobacco, certain luxury goods |
| ISR (individuals) | 15-25% | Progressive income tax |
| ISR (companies) | 25% | Corporate income tax (30% for revenue >HNL 1M) |

**E-invoicing status:**
Honduras is in the early stages of e-invoicing implementation. The SAR has announced plans for a Documento Tributario Electronico (DTE) system but it is not yet mandatory. Current requirements:
- Pre-numbered invoice books (authorized by SAR)
- CAI (Codigo de Autorizacion de Impresion) -- authorization code printed on each invoice
- Fiscal printers for certain business categories

**Implementation timeline:** Q1 2027 -- monitor DTE rollout; current paper-based compliance is simpler.

---

### 4.6 El Salvador -- Ministerio de Hacienda

**Tax authority:** Ministerio de Hacienda, Direccion General de Impuestos Internos (DGII)

**Key tax IDs:**

| ID Type | Description | Format | Validation |
|---|---|---|---|
| NIT | Numero de Identificacion Tributaria | 14 digits: `XXXX-XXXXXX-XXX-X` | Check digit validation |
| NRC | Numero de Registro de Contribuyente | Variable: `XXX-X` to `XXXXXX-X` | IVA registration number |
| DUI | Documento Unico de Identidad | 9 digits: `XXXXXXXX-X` | National ID |

**NIT validation (El Salvador):**

```typescript
function validateNITElSalvador(nit: string): { valid: boolean; error?: string } {
  const normalized = nit.replace(/[\s\-]/g, '');

  // NIT: 14 digits
  if (!/^\d{14}$/.test(normalized)) {
    return { valid: false, error: 'NIT must be exactly 14 digits' };
  }

  // Validate check digit (last digit)
  // Algorithm: weighted sum modulo 10
  const digits = normalized.split('').map(Number);
  const weights = [2, 7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += digits[i] * weights[i];
  }

  const remainder = sum % 10;
  const expectedCheck = remainder === 0 ? 0 : 10 - remainder;

  if (digits[13] !== expectedCheck) {
    return { valid: false, error: `Invalid check digit: expected ${expectedCheck}` };
  }

  return { valid: true };
}
```

**Tax rates (El Salvador):**

| Tax | Rate | Application |
|---|---|---|
| IVA | **13%** | Standard rate on goods and services |
| ISR (individuals) | 10-30% | Progressive income tax |
| ISR (companies) | 30% | Corporate income tax |
| BTC capital gains | **0%** | Bitcoin capital gains are exempt |

**DTE (Documento Tributario Electronico) -- E-Invoicing:**
El Salvador is implementing its DTE electronic invoicing system. Key facts:
- Phased rollout beginning with large taxpayers.
- Managed by the DGII.
- XML-based documents with digital signature.
- Mandatory adoption timeline is expanding to include smaller taxpayers.
- JSON and XML submission supported.

**DTE Document types:**

| Code | Type |
|---|---|
| 01 | Factura |
| 03 | Comprobante de Credito Fiscal |
| 05 | Nota de Credito |
| 06 | Nota de Debito |
| 07 | Nota de Remision |
| 08 | Comprobante de Liquidacion |
| 11 | Factura de Exportacion |
| 14 | Factura de Sujeto Excluido |
| 15 | Comprobante de Donacion |

**Implementation timeline:** Q3 2026 -- align with DTE rollout schedule.

---

### 4.7 Nicaragua -- DGI (Direccion General de Ingresos)

**Tax authority:** DGI (Direccion General de Ingresos), under the Ministerio de Hacienda y Credito Publico

**Key tax IDs:**

| ID Type | Description | Format | Validation |
|---|---|---|---|
| RUC | Registro Unico de Contribuyente | Variable format | Assigned by DGI |
| Cedula | National ID | 14 digits: `XXX-XXXXXX-XXXXX` | For natural persons |

**RUC validation (Nicaragua):**

```typescript
function validateRUCNicaragua(ruc: string): { valid: boolean; type: string; error?: string } {
  const normalized = ruc.replace(/[\s\-]/g, '').toUpperCase();

  // Legal entity RUC: starts with J followed by digits
  if (/^J\d{10,14}$/.test(normalized)) {
    return { valid: true, type: 'legal_entity' };
  }

  // Natural person RUC: based on cedula (digits only)
  if (/^\d{14}$/.test(normalized)) {
    return { valid: true, type: 'natural_person' };
  }

  return { valid: false, type: 'unknown', error: 'Invalid RUC format' };
}
```

**Tax rates (Nicaragua):**

| Tax | Rate | Application |
|---|---|---|
| IVA | **15%** | Standard rate -- highest in Central America |
| ISC | Varies | Selective consumption tax (alcohol, tobacco, fuel) |
| IR (individuals) | 10-30% | Progressive income tax |
| IR (companies) | 30% | Corporate income tax |
| PMD | 1% | Monthly minimum payment on gross income |

**E-invoicing status:**
Nicaragua's DGI is developing an electronic invoicing system but it is not yet mandatory. Current requirements involve pre-printed, sequentially numbered invoices authorized by the DGI with a unique code. The DGI's "Ventanilla Electronica Tributaria" (VET) handles tax filing electronically but invoice issuance remains largely paper-based.

**Implementation timeline:** 2027+ -- monitor DGI announcements for e-invoicing mandate.

---

### 4.8 Belize -- Income and Business Tax Department

**Tax authority:** Income and Business Tax Department (IBT), under the Ministry of Finance

**Key tax IDs:**

| ID Type | Description | Format | Validation |
|---|---|---|---|
| TIN | Tax Identification Number | Numeric, variable length | Assigned by IBT |
| BRN | Business Registration Number | Alphanumeric | From BRELA |
| Social Security Number | For individuals | 9 digits | Required for employment |

**Tax rates (Belize):**

| Tax | Rate | Application |
|---|---|---|
| GST (General Sales Tax) | **12.5%** | Standard rate on goods and services |
| Business Tax | 1.75-25% | Varies by business type and revenue |
| Income Tax | 25% | On net income exceeding BZD 26,000 |

**Note on GST vs VAT:** Belize uses a GST (General Sales Tax) rather than a VAT system. GST is simpler -- it is levied only at the point of sale, not at each stage of production. This means no input tax credits, which simplifies compliance but increases the tax burden on multi-stage supply chains.

**E-invoicing status:** No e-invoicing mandate exists in Belize. Invoices are paper-based or generated digitally at the merchant's discretion with no government validation requirement.

**Language note:** Belize is the ONLY English-speaking country in Central America. All Kitz UI, invoices, and tax terms for Belize must be in English. This is a significant localization consideration.

**Implementation timeline:** 2027+ -- niche market.

---

## 5. Invoice Compliance

### 5.1 E-Invoicing Comparison Table

| Feature | Costa Rica | Guatemala | Honduras | El Salvador | Nicaragua | Belize |
|---|---|---|---|---|---|---|
| **System name** | Factura Electronica | FEL | DTE (planned) | DTE | In development | None |
| **Mandatory?** | Yes (since 2018) | Yes (since 2022) | No (CAI system) | Phased rollout | No | No |
| **Document format** | XML (v4.3) | XML | TBD | XML/JSON | N/A | N/A |
| **Signing** | XAdES-BES (P12 cert) | Via Certificador | TBD | Digital signature | N/A | N/A |
| **Submission** | REST API to Hacienda | Via Certificador to SAT | N/A (future) | To DGII | N/A | N/A |
| **Unique ID** | Clave Numerica (50 digits) | UUID (SAT) | CAI (auth code) | Sello de Recepcion | DGI auth code | None |
| **Standard tax rate** | 13% IVA | 12% IVA | 15% ISV | 13% IVA | 15% IVA | 12.5% GST |
| **Provider model** | Direct to Hacienda | Certificador (certified provider) | SAR-authorized printers | DGII-certified | DGI-authorized | N/A |
| **API quality** | Excellent (REST + OAuth) | Good (via Certificadores) | N/A | Improving | N/A | N/A |
| **Kitz priority** | P1 -- immediate | P1 -- immediate | P3 -- monitor | P2 -- align with rollout | P3 -- monitor | P4 -- no requirement |
| **Retention period** | 5 years | 4 years | 5 years | 5 years | 5 years | 7 years |

### 5.2 Tax Rate Summary

```
Costa Rica:  13%  IVA  (multi-rate: 13%, 4%, 2%, 1%, 0%)
Guatemala:   12%  IVA  (single rate)
Honduras:    15%  ISV  (+ 18% for select goods)
El Salvador: 13%  IVA  (single rate)
Nicaragua:   15%  IVA  (single rate + ISC selective tax)
Belize:      12.5% GST (single rate)
```

**Kitz tax implementation:**

```typescript
interface CentralAmericaTaxConfig {
  country: 'CR' | 'GT' | 'HN' | 'SV' | 'NI' | 'BZ';
  standardRate: number;
  taxName: string;
  multiRate: boolean;
  rates: Array<{ rate: number; label: string; category: string }>;
}

const TAX_CONFIGS: Record<string, CentralAmericaTaxConfig> = {
  CR: {
    country: 'CR',
    standardRate: 0.13,
    taxName: 'IVA',
    multiRate: true,
    rates: [
      { rate: 0.13, label: '13% IVA', category: 'standard' },
      { rate: 0.04, label: '4% IVA', category: 'health_education' },
      { rate: 0.02, label: '2% IVA', category: 'medicines' },
      { rate: 0.01, label: '1% IVA', category: 'canasta_basica' },
      { rate: 0.00, label: 'Exento', category: 'exempt' },
    ],
  },
  GT: {
    country: 'GT',
    standardRate: 0.12,
    taxName: 'IVA',
    multiRate: false,
    rates: [
      { rate: 0.12, label: '12% IVA', category: 'standard' },
      { rate: 0.00, label: 'Exento', category: 'exempt' },
    ],
  },
  HN: {
    country: 'HN',
    standardRate: 0.15,
    taxName: 'ISV',
    multiRate: true,
    rates: [
      { rate: 0.15, label: '15% ISV', category: 'standard' },
      { rate: 0.18, label: '18% ISV', category: 'alcohol_tobacco_luxury' },
      { rate: 0.00, label: 'Exento', category: 'exempt' },
    ],
  },
  SV: {
    country: 'SV',
    standardRate: 0.13,
    taxName: 'IVA',
    multiRate: false,
    rates: [
      { rate: 0.13, label: '13% IVA', category: 'standard' },
      { rate: 0.00, label: 'Exento', category: 'exempt' },
    ],
  },
  NI: {
    country: 'NI',
    standardRate: 0.15,
    taxName: 'IVA',
    multiRate: false,
    rates: [
      { rate: 0.15, label: '15% IVA', category: 'standard' },
      { rate: 0.00, label: 'Exento', category: 'exempt' },
    ],
  },
  BZ: {
    country: 'BZ',
    standardRate: 0.125,
    taxName: 'GST',
    multiRate: false,
    rates: [
      { rate: 0.125, label: '12.5% GST', category: 'standard' },
      { rate: 0.00, label: 'Zero-rated', category: 'exempt' },
    ],
  },
};
```

### 5.3 Tax ID Validation -- Unified Interface

```typescript
interface TaxIDValidation {
  valid: boolean;
  country: string;
  idType: string;
  entityType: string;
  formatted: string;
  error?: string;
}

function validateCentralAmericaTaxID(
  country: 'CR' | 'GT' | 'HN' | 'SV' | 'NI' | 'BZ',
  taxId: string
): TaxIDValidation {
  const normalized = taxId.replace(/[\s\-]/g, '').toUpperCase();

  switch (country) {
    case 'CR': {
      // Cedula Juridica: 10 digits starting with 2, 3, or 4
      if (/^[234]\d{9}$/.test(normalized)) {
        return {
          valid: true, country: 'CR', idType: 'Cedula Juridica',
          entityType: 'legal_entity',
          formatted: `${normalized[0]}-${normalized.slice(1, 4)}-${normalized.slice(4)}`,
        };
      }
      // Cedula Fisica: 9 digits starting with 1-7
      if (/^[1-7]\d{8}$/.test(normalized)) {
        return {
          valid: true, country: 'CR', idType: 'Cedula Fisica',
          entityType: 'natural_person',
          formatted: `${normalized[0]}-${normalized.slice(1, 5)}-${normalized.slice(5)}`,
        };
      }
      return {
        valid: false, country: 'CR', idType: 'unknown',
        entityType: 'unknown', formatted: normalized,
        error: 'Must be 9 digits (Fisica) or 10 digits starting with 2/3/4 (Juridica)',
      };
    }

    case 'GT': {
      // NIT: 6-10 characters (digits + check digit which may be K)
      const match = normalized.match(/^(\d{5,9})([0-9K])$/);
      if (match) {
        const digits = match[1];
        const checkDigit = match[2];
        let sum = 0;
        for (let i = 0; i < digits.length; i++) {
          sum += parseInt(digits[i]) * (digits.length + 1 - i);
        }
        const remainder = sum % 11;
        const expected = remainder === 0 ? '0' : (11 - remainder === 10 ? 'K' : String(11 - remainder));
        if (checkDigit === expected) {
          return {
            valid: true, country: 'GT', idType: 'NIT',
            entityType: digits.length <= 6 ? 'natural_person' : 'legal_entity',
            formatted: `${digits}-${checkDigit}`,
          };
        }
        return {
          valid: false, country: 'GT', idType: 'NIT',
          entityType: 'unknown', formatted: normalized,
          error: `Check digit invalid: expected ${expected}, got ${checkDigit}`,
        };
      }
      return {
        valid: false, country: 'GT', idType: 'unknown',
        entityType: 'unknown', formatted: normalized,
        error: 'NIT must be 6-10 characters (digits + check digit)',
      };
    }

    case 'HN': {
      // RTN: 14 digits
      if (/^\d{14}$/.test(normalized)) {
        return {
          valid: true, country: 'HN', idType: 'RTN',
          entityType: normalized.startsWith('08') ? 'natural_person' : 'legal_entity',
          formatted: `${normalized.slice(0, 4)}-${normalized.slice(4, 8)}-${normalized.slice(8)}`,
        };
      }
      return {
        valid: false, country: 'HN', idType: 'unknown',
        entityType: 'unknown', formatted: normalized,
        error: 'RTN must be exactly 14 digits',
      };
    }

    case 'SV': {
      // NIT: 14 digits
      if (/^\d{14}$/.test(normalized)) {
        const digits = normalized.split('').map(Number);
        const weights = [2, 7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
        let sum = 0;
        for (let i = 0; i < 13; i++) sum += digits[i] * weights[i];
        const remainder = sum % 10;
        const expected = remainder === 0 ? 0 : 10 - remainder;
        if (digits[13] === expected) {
          return {
            valid: true, country: 'SV', idType: 'NIT',
            entityType: 'unknown', // Cannot determine from NIT alone
            formatted: `${normalized.slice(0, 4)}-${normalized.slice(4, 10)}-${normalized.slice(10, 13)}-${normalized[13]}`,
          };
        }
        return {
          valid: false, country: 'SV', idType: 'NIT',
          entityType: 'unknown', formatted: normalized,
          error: `Check digit invalid: expected ${expected}, got ${digits[13]}`,
        };
      }
      return {
        valid: false, country: 'SV', idType: 'unknown',
        entityType: 'unknown', formatted: normalized,
        error: 'NIT must be exactly 14 digits',
      };
    }

    case 'NI': {
      // RUC: J + 10-14 digits (legal) or 14 digits (natural)
      if (/^J\d{10,14}$/.test(normalized)) {
        return {
          valid: true, country: 'NI', idType: 'RUC',
          entityType: 'legal_entity',
          formatted: normalized,
        };
      }
      if (/^\d{14}$/.test(normalized)) {
        return {
          valid: true, country: 'NI', idType: 'RUC',
          entityType: 'natural_person',
          formatted: `${normalized.slice(0, 3)}-${normalized.slice(3, 9)}-${normalized.slice(9)}`,
        };
      }
      return {
        valid: false, country: 'NI', idType: 'unknown',
        entityType: 'unknown', formatted: normalized,
        error: 'RUC must be J + 10-14 digits (legal) or 14 digits (natural)',
      };
    }

    case 'BZ': {
      // TIN: numeric, variable length (typically 5-9 digits)
      if (/^\d{5,9}$/.test(normalized)) {
        return {
          valid: true, country: 'BZ', idType: 'TIN',
          entityType: 'unknown',
          formatted: normalized,
        };
      }
      return {
        valid: false, country: 'BZ', idType: 'unknown',
        entityType: 'unknown', formatted: normalized,
        error: 'TIN must be 5-9 digits',
      };
    }
  }
}
```

### 5.4 Invoice Numbering by Country

| Country | Format | Authority | Notes |
|---|---|---|---|
| Costa Rica | Branch (5) + Terminal (5) + Type (2) + Sequence (10) = 22 digits | Hacienda (self-assigned within Clave Numerica) | Embedded in 50-digit Clave Numerica |
| Guatemala | Assigned by Certificador | SAT via Certificador | UUID returned upon authorization |
| Honduras | CAI-authorized range: `XXX-XXX-XX-XXXXXXXX` | SAR (pre-authorized ranges via CAI) | Must request new range before current expires |
| El Salvador | `DTE-XX-XXXXXXXX-XXXXXXXXXXXXXXXXX` | DGII | Sello de recepcion assigned upon submission |
| Nicaragua | DGI-authorized sequential: `A-XXXXXXX` | DGI (pre-authorized series) | Paper-based numbering |
| Belize | Self-assigned | N/A | No government-mandated format |

---

## 6. Payment Flow Architecture

### 6.1 Costa Rica -- SINPE Movil Payment Flow

```
                     COSTA RICA PAYMENT FLOW
                     =======================

  Kitz Workspace Owner                    Customer
        |                                    |
        |  Creates invoice (invoice_create)  |
        |  with IVA (13%) + line items       |
        |                                    |
        v                                    |
  +-----------+                              |
  | Invoice   |                              |
  | Generated |                              |
  +-----------+                              |
        |                                    |
        |  XML signed (XAdES-BES) + submitted to Hacienda REST API
        |  Hacienda returns: aceptado + Clave Numerica confirmed
        |                                    |
        v                                    |
  +-----------+                              |
  | E-Invoice |  Sent via WhatsApp/Email     |
  | Compliant |  with payment instructions   |
  +-----------+  (SINPE Movil number + IBAN) |
        |                                    v
        |                              +-----------+
        |                              | Customer  |
        |                              | Chooses   |
        |                              | Payment   |
        |                              +-----------+
        |                                    |
        +---- SINPE Movil (phone number) ----+
        |                                    |
        +---- Bank transfer (IBAN) ----------+
        |                                    |
        +---- BAC card payment link ---------+
        |                                    |
        v                                    v
  +-----------+                        +-----------+
  | Reconcile |  Bank API / webhook /  | Payment   |
  | Payment   |  <-- manual confirm    | Completed |
  +-----------+                        +-----------+
        |
        +-- Invoice status -> 'paid'
        +-- CRM contact -> payment recorded
        +-- WhatsApp receipt sent
        +-- IVA ledger updated
```

### 6.2 Guatemala -- FEL + Tigo Money Payment Flow

```
                     GUATEMALA PAYMENT FLOW
                     ======================

  Kitz Workspace Owner                    Customer
        |                                    |
        |  Creates invoice (invoice_create)  |
        |  with IVA (12%) + NIT              |
        |                                    |
        v                                    |
  +-----------+                              |
  | Invoice   |                              |
  | Data      |                              |
  +-----------+                              |
        |                                    |
        |  Sent to FEL Certificador API      |
        |  Certificador signs + submits to SAT
        |  SAT returns UUID (autorizacion)   |
        |                                    |
        v                                    |
  +-----------+                              |
  | FEL       |  Sent via WhatsApp/Email     |
  | Authorized|  with UUID + payment options |
  +-----------+                              |
        |                                    v
        |                              +-----------+
        |                              | Customer  |
        |                              | Chooses   |
        |                              +-----------+
        |                                    |
        +---- Tigo Money (phone number) -----+
        |                                    |
        +---- BAC card payment link ---------+
        |                                    |
        +---- Bank transfer (BI/BAC acct) ---+
        |                                    |
        v                                    v
  +-----------+                        +-----------+
  | Webhook / |                        | Payment   |
  | Reconcile |  <-- notification      | Completed |
  +-----------+                        +-----------+
        |
        +-- Invoice status -> 'paid'
        +-- FEL document linked to payment
        +-- CRM updated, receipt sent
```

### 6.3 El Salvador -- DTE + Bitcoin/Lightning Payment Flow

```
                  EL SALVADOR PAYMENT FLOW
                  ========================

  Kitz Workspace Owner                    Customer
        |                                    |
        |  Creates invoice (invoice_create)  |
        |  with IVA (13%) in USD             |
        |  + optional BTC equivalent display |
        |                                    |
        v                                    |
  +-----------+                              |
  | Invoice   |                              |
  | Generated |                              |
  +-----------+                              |
        |                                    |
        |  If DTE enabled: submit to DGII   |
        |  DGII returns Sello de Recepcion   |
        |                                    |
        v                                    |
  +-----------+                              |
  | DTE       |  Sent via WhatsApp/Email     |
  | Document  |  with multiple payment opts  |
  +-----------+                              |
        |                                    v
        |                              +-----------+
        |                              | Customer  |
        |                              | Chooses   |
        |                              +-----------+
        |                                    |
        +---- Lightning Network (QR) --------+  <-- BTC payment
        |     (Strike or BTCPay invoice)     |
        |                                    |
        +---- BAC card payment link ---------+  <-- USD card
        |                                    |
        +---- Tigo Money -------------------+  <-- Mobile money
        |                                    |
        +---- Bank transfer -----------------+  <-- USD wire
        |                                    |
        v                                    v
  +-----------+                        +-----------+
  | Webhook   |                        | Payment   |
  | Received  |  <-- provider callback | Completed |
  +-----------+                        +-----------+
        |
        +-- If Lightning: record BTC amount + USD equivalent
        +-- Invoice status -> 'paid'
        +-- Dual-currency receipt (USD + BTC)
        +-- CRM updated
```

### 6.4 Regional Payment Provider Matrix

```
              Provider Support by Country
              ===========================

Provider       CR   GT   HN   SV   NI   BZ
---------      --   --   --   --   --   --
BAC            Y    Y    Y    Y    Y    -
Tigo Money     -    Y    Y    Y    ~    -
SINPE Movil    Y    -    -    -    -    -
Lightning/BTC  -    -    -    Y    -    -
Stripe         Y    -    -    -    -    -
Local banks    Y    Y    Y    Y    Y    Y

Y = Available and recommended
~ = Available but limited
- = Not available

Kitz paymentTools.ts provider enum (expanded):
['stripe', 'paypal', 'yappy', 'bac', 'sinpe', 'tigo_money', 'lightning', 'chivo', 'bank_transfer']
```

---

## 7. Currency & Localization

### 7.1 Currency Summary

| Country | Code | Symbol | Name | USD Relationship | Kitz Display |
|---|---|---|---|---|---|
| Costa Rica | CRC | ₡ | Colon costarricense | Floating (~₡550/USD) | `₡ 1,234.56` |
| Guatemala | GTQ | Q | Quetzal | Floating (~Q7.75/USD) | `Q 1,234.56` |
| Honduras | HNL | L | Lempira | Floating (~L24.80/USD) | `L 1,234.56` |
| El Salvador | USD | $ | US Dollar | Dollarized (since 2001) | `$1,234.56` |
| Nicaragua | NIO | C$ | Cordoba | Crawling peg (~C$36.80/USD) | `C$ 1,234.56` |
| Belize | BZD | BZ$ | Belize Dollar | Pegged 2:1 to USD | `BZ$ 1,234.56` |

**Multi-currency considerations for Kitz:**

```typescript
interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  decimals: number;
  thousandsSep: string;
  decimalSep: string;
  symbolPosition: 'before' | 'after';
  usdRelation: 'dollarized' | 'pegged' | 'floating';
  usdRate?: number; // For pegged currencies
}

const CURRENCIES: Record<string, CurrencyConfig> = {
  CRC: {
    code: 'CRC', symbol: '₡', name: 'Colon costarricense',
    decimals: 2, thousandsSep: '.', decimalSep: ',',
    symbolPosition: 'before', usdRelation: 'floating',
  },
  GTQ: {
    code: 'GTQ', symbol: 'Q', name: 'Quetzal',
    decimals: 2, thousandsSep: ',', decimalSep: '.',
    symbolPosition: 'before', usdRelation: 'floating',
  },
  HNL: {
    code: 'HNL', symbol: 'L', name: 'Lempira',
    decimals: 2, thousandsSep: ',', decimalSep: '.',
    symbolPosition: 'before', usdRelation: 'floating',
  },
  USD_SV: {
    code: 'USD', symbol: '$', name: 'US Dollar (El Salvador)',
    decimals: 2, thousandsSep: ',', decimalSep: '.',
    symbolPosition: 'before', usdRelation: 'dollarized',
  },
  NIO: {
    code: 'NIO', symbol: 'C$', name: 'Cordoba',
    decimals: 2, thousandsSep: ',', decimalSep: '.',
    symbolPosition: 'before', usdRelation: 'floating',
  },
  BZD: {
    code: 'BZD', symbol: 'BZ$', name: 'Belize Dollar',
    decimals: 2, thousandsSep: ',', decimalSep: '.',
    symbolPosition: 'before', usdRelation: 'pegged', usdRate: 2.0,
  },
};
```

**Special: Costa Rica dual-currency environment**
While the official currency is the Colon (CRC), USD is widely accepted in Costa Rica, especially in tourist areas and for international business. Many businesses price in both CRC and USD. Kitz should support dual-currency display for Costa Rica workspaces.

**Special: El Salvador BTC display**
For El Salvador, invoices may need to display three values: USD amount, BTC equivalent (at current exchange rate), and a Lightning invoice QR code.

### 7.2 Date Formats

| Country | Display format | Locale code | Example |
|---|---|---|---|
| Costa Rica | DD/MM/YYYY | es-CR | 24/02/2026 |
| Guatemala | DD/MM/YYYY | es-GT | 24/02/2026 |
| Honduras | DD/MM/YYYY | es-HN | 24/02/2026 |
| El Salvador | DD/MM/YYYY | es-SV | 24/02/2026 |
| Nicaragua | DD/MM/YYYY | es-NI | 24/02/2026 |
| Belize | DD/MM/YYYY | en-BZ | 24/02/2026 |

All countries use DD/MM/YYYY for display. Internal storage remains ISO 8601 (YYYY-MM-DDTHH:mm:ssZ).

### 7.3 Phone Number Formats

| Country | Code | Mobile format | Digits | Validation regex |
|---|---|---|---|---|
| Costa Rica | +506 | +506 XXXX-XXXX | 8 | `/^\+?506\s?\d{4}-?\d{4}$/` |
| Guatemala | +502 | +502 XXXX-XXXX | 8 | `/^\+?502\s?\d{4}-?\d{4}$/` |
| Honduras | +504 | +504 XXXX-XXXX | 8 | `/^\+?504\s?\d{4}-?\d{4}$/` |
| El Salvador | +503 | +503 XXXX-XXXX | 8 | `/^\+?503\s?\d{4}-?\d{4}$/` |
| Nicaragua | +505 | +505 XXXX-XXXX | 8 | `/^\+?505\s?\d{4}-?\d{4}$/` |
| Belize | +501 | +501 XXX-XXXX | 7 | `/^\+?501\s?\d{3}-?\d{4}$/` |

**WhatsApp format (all countries):** Strip `+`, spaces, and dashes. Examples:
- Costa Rica: `50612345678`
- Guatemala: `50212345678`
- Belize: `5011234567` (7 digits after country code)

### 7.4 Language

| Country | Primary language | Kitz UI language | Invoice language |
|---|---|---|---|
| Costa Rica | Spanish | es-CR | Spanish |
| Guatemala | Spanish (+ 22 Mayan languages) | es-GT | Spanish |
| Honduras | Spanish | es-HN | Spanish |
| El Salvador | Spanish | es-SV | Spanish |
| Nicaragua | Spanish | es-NI | Spanish |
| Belize | **English** | **en-BZ** | **English** |

**Belize localization requirement:** Kitz must support English-language invoices for Belize. This includes:
- Invoice headers: "Invoice" (not "Factura"), "Quote" (not "Cotizacion")
- Tax label: "GST" (not "IVA" or "ISV")
- Line item labels: "Description", "Qty", "Price", "Subtotal", "Tax", "Discount", "Total"
- Currency: "BZ$" prefix

---

## 8. Competitive Landscape

### 8.1 Costa Rica Competitors

| Competitor | Strengths | Weaknesses | Kitz Differentiator |
|---|---|---|---|
| **Factura Digital CR** | Mature Hacienda-compliant e-invoicing, large user base | Invoicing-only -- no CRM, no AI, no WhatsApp | Kitz is a full business OS, not just invoicing |
| **Gosocket Costa Rica** | Enterprise e-invoicing, regional PAC provider | Enterprise pricing, complex setup | Potential PAC partner; Kitz serves SMB segment |
| **Alegra** | Multi-country LatAm, affordable, cloud accounting | Not Costa Rica-specialized, no SINPE Movil integration | Kitz is Costa Rica-first with SINPE Movil |
| **Quickbooks** | Global brand, robust accounting | No Hacienda integration, no SINPE, expensive | Kitz is purpose-built for Costa Rica |
| **Conta Facil** | Local Costa Rican accounting/invoicing | Limited features, outdated UI | Modern AI-native experience |
| **Enlace Fiscal** | Hacienda-compliant, good API | Developer-focused, not end-user friendly | Potential technology partner; Kitz provides the UX |

### 8.2 Guatemala Competitors

| Competitor | Strengths | Weaknesses | Kitz Differentiator |
|---|---|---|---|
| **Megaprint** | Dominant FEL Certificador, large user base | Primarily a certification service, not a business OS | Kitz uses Megaprint as a service; offers the full platform |
| **Guatefacturas** | FEL-compliant invoicing, SMB-focused | Limited beyond invoicing | Full CRM + invoicing + payments + AI |
| **Alegra Guatemala** | Multi-country presence, affordable | Generic LatAm, no Tigo Money integration | Guatemala-specific with Tigo Money + FEL |
| **Infile** | Strong FEL Certificador | Corporate-focused, not SMB-friendly | SMB pricing and simplicity |
| **Digifact** | Modern FEL API, developer-friendly | API-first -- no end-user platform | Potential Certificador partner |

### 8.3 El Salvador Competitors

| Competitor | Strengths | Weaknesses | Kitz Differentiator |
|---|---|---|---|
| **Chivo Wallet** | Government-backed, free BTC-USD conversion | Not a business OS, declining active usage | Kitz integrates BTC alongside full business tools |
| **Alegra El Salvador** | Multi-country, affordable | No BTC support, no DTE integration yet | BTC/Lightning support + DTE compliance |
| **Strike** | Excellent Lightning payments, USD settlement | Payment-only -- no invoicing, CRM, or business tools | Potential payment partner; Kitz is the business layer |
| **Local accountants** | Manual DTE compliance | Manual, expensive, not scalable | Automated DTE generation and submission |

### 8.4 Honduras, Nicaragua, Belize Competitors

These markets have fewer digital SMB tools. Primary competition comes from:
- **Alegra** (present in HN, NI) -- generic LatAm platform
- **Manual processes** -- Excel spreadsheets, paper invoices, manual bookkeeping
- **Local accounting firms** -- provide compliance services manually
- **Kitz advantage in these markets:** Being first-to-market with an AI-native, mobile-first business OS

### 8.5 Regional Competitive Summary

```
Market maturity vs. competition intensity:

                    High competition
                         |
          Costa Rica (x) |
                         |
                         |
              Guatemala  |
                (x)      |
Low maturity ----+-------+------- High maturity
                 |       |
        Nicaragua|  El Salvador
           (x)  |     (x)
                 |
        Honduras |  Belize
           (x)  |    (x)
                 |
                    Low competition

Costa Rica: High maturity + moderate competition = quality differentiation needed
Guatemala:  Moderate maturity + moderate competition = market entry via FEL partnership
El Salvador: Moderate maturity + low competition = BTC differentiator creates unique position
Honduras:    Low-moderate maturity + low competition = first-mover advantage
Nicaragua:   Low maturity + low competition = political risk offsets opportunity
Belize:      Low maturity + very low competition = niche market, English localization required
```

---

## 9. Implementation Roadmap

### Phase 1: Costa Rica Market Entry (Q2 2026)

| Priority | Task | Owner | Status |
|---|---|---|---|
| P0 | Hacienda REST API integration (sandbox) | Engineering | Not started |
| P0 | Clave Numerica generation logic | Engineering | Not started |
| P0 | XML document generator (Hacienda schema v4.3) | Engineering | Not started |
| P0 | XAdES-BES digital signature implementation | Engineering | Not started |
| P0 | IVA multi-rate support (13%, 4%, 2%, 1%, 0%) | Engineering | Not started |
| P1 | Cedula Juridica / Cedula Fisica validation | Engineering | Not started |
| P1 | SINPE Movil payment instructions on invoices | Engineering | Not started |
| P1 | BAC Costa Rica payment link integration | Engineering | Not started |
| P1 | Costa Rica locale (es-CR) for UI and invoices | Engineering | Not started |
| P1 | CRC currency display (₡ symbol, formatting) | Engineering | Not started |
| P2 | Greenpay / PayRetailers evaluation for SINPE aggregation | Product | Not started |

### Phase 2: Guatemala Market Entry (Q3-Q4 2026)

| Priority | Task | Owner | Status |
|---|---|---|---|
| P0 | FEL Certificador selection and partnership | Product + Legal | Not started |
| P0 | Certificador API integration | Engineering | Not started |
| P0 | NIT validation with check digit | Engineering | Not started |
| P0 | IVA 12% implementation | Engineering | Not started |
| P1 | Tigo Money API integration (covers GT, HN, SV) | Engineering | Not started |
| P1 | Guatemala locale (es-GT) | Engineering | Not started |
| P1 | GTQ currency display | Engineering | Not started |
| P2 | BAC Guatemala merchant services | Engineering | Not started |

### Phase 3: El Salvador Market Entry (Q3 2026)

| Priority | Task | Owner | Status |
|---|---|---|---|
| P0 | DTE system integration (align with DGII rollout) | Engineering | Not started |
| P0 | NIT validation (El Salvador format) | Engineering | Not started |
| P0 | IVA 13% (same rate as Costa Rica, different rules) | Engineering | Not started |
| P1 | Lightning Network payment integration (Strike API) | Engineering | Not started |
| P1 | BTC price display on invoices (real-time conversion) | Engineering | Not started |
| P1 | Dual-currency receipt (USD + BTC) | Engineering | Not started |
| P2 | Chivo Wallet integration assessment | Product | Not started |
| P2 | Remittance flow analysis for SMB features | Product | Not started |

### Phase 4: Honduras + Nicaragua (Q4 2026 - Q1 2027)

| Priority | Task | Owner | Status |
|---|---|---|---|
| P1 | RTN validation (Honduras) | Engineering | Not started |
| P1 | ISV 15% implementation | Engineering | Not started |
| P1 | CAI invoice numbering support | Engineering | Not started |
| P1 | Honduras locale (es-HN) | Engineering | Not started |
| P1 | HNL currency display | Engineering | Not started |
| P2 | Nicaragua RUC validation | Engineering | Not started |
| P2 | Nicaragua IVA 15% | Engineering | Not started |
| P2 | NIO currency display | Engineering | Not started |
| P2 | Sanctions screening for Nicaragua workspaces | Legal + Engineering | Not started |
| P3 | Monitor Honduras DTE rollout | Product | Not started |
| P3 | Monitor Nicaragua e-invoicing development | Product | Not started |

### Phase 5: Belize (2027+)

| Priority | Task | Owner | Status |
|---|---|---|---|
| P2 | English-language invoice templates | Engineering | Not started |
| P2 | GST 12.5% implementation | Engineering | Not started |
| P2 | TIN validation | Engineering | Not started |
| P2 | BZD currency display | Engineering | Not started |
| P2 | Belize locale (en-BZ) | Engineering | Not started |
| P3 | Atlantic Bank / Belize Bank integration assessment | Product | Not started |

### Cross-Country Tasks (Ongoing)

| Priority | Task | Owner | Status |
|---|---|---|---|
| P0 | Regional BAC Credomatic partnership negotiation | Business Dev | Not started |
| P0 | `paymentTools.ts` provider enum expansion (sinpe, tigo_money, lightning) | Engineering | Not started |
| P1 | Multi-country tax configuration system | Engineering | Not started |
| P1 | Multi-currency support in invoicing engine | Engineering | Not started |
| P1 | Country-aware workspace onboarding flow | Engineering | Not started |
| P1 | Tax ID validation library (all 6 countries) | Engineering | Not started |
| P2 | Regional payment reconciliation dashboard | Engineering | Not started |
| P2 | Cross-country revenue reporting for multi-market businesses | Engineering | Not started |
| P3 | SIECA harmonization monitoring | Legal | Not started |

---

## 10. Compliance Checklist for Launch

### Per-Country Compliance -- Costa Rica

**Legal & Regulatory:**
- [ ] Hacienda e-invoicing integration operational (sandbox + production)
- [ ] P12 digital certificate management per workspace
- [ ] Data protection compliance (Ley de Proteccion de la Persona frente al Tratamiento de sus Datos Personales, Law 8968)
- [ ] Terms of service reviewed by Costa Rican attorney
- [ ] Payment aggregator agreement signed (for SINPE Movil)

**Tax Compliance:**
- [ ] IVA calculation supports all five rate tiers (13%, 4%, 2%, 1%, 0%)
- [ ] Exempt categories correctly identified
- [ ] Clave Numerica generation validated
- [ ] All 9 document types supported (at minimum: 01, 03, 04)
- [ ] Cedula Juridica and Cedula Fisica validation implemented
- [ ] Monthly IVA declaration data export

**E-Invoice:**
- [ ] XML generation follows Hacienda schema v4.3
- [ ] XAdES-BES digital signature functional
- [ ] REST API submission and status polling operational
- [ ] 5-year document archive infrastructure
- [ ] Hacienda response handling (aceptado / rechazado / procesando)

### Per-Country Compliance -- Guatemala

**Legal & Regulatory:**
- [ ] FEL Certificador partnership agreement signed
- [ ] SAT registration as FEL issuer (via Certificador)
- [ ] Guatemalan data protection compliance

**Tax Compliance:**
- [ ] IVA 12% correctly applied
- [ ] NIT validation with check digit algorithm
- [ ] FEL document types mapped and supported
- [ ] SAT UUID displayed on all invoices
- [ ] Monthly IVA and ISR filing data export

### Per-Country Compliance -- El Salvador

**Legal & Regulatory:**
- [ ] DTE integration aligned with DGII rollout timeline
- [ ] Ley Bitcoin compliance assessment (BTC acceptance requirement)
- [ ] Lightning payment integration operational
- [ ] KYC/AML for BTC transactions

**Tax Compliance:**
- [ ] IVA 13% correctly applied
- [ ] NIT validation with check digit algorithm
- [ ] NRC validation for IVA-registered businesses
- [ ] BTC capital gains exemption reflected in reporting

### Per-Country Compliance -- Honduras

**Tax Compliance:**
- [ ] ISV 15% correctly applied (+ 18% for luxury/alcohol/tobacco)
- [ ] RTN validation (14 digits)
- [ ] CAI-based invoice numbering implemented
- [ ] SAR-authorized invoice format compliance

### Per-Country Compliance -- Nicaragua

**Legal & Regulatory:**
- [ ] OFAC sanctions screening for workspace owners
- [ ] International payment processor availability confirmed
- [ ] DGI registration requirements met

**Tax Compliance:**
- [ ] IVA 15% correctly applied
- [ ] RUC validation
- [ ] DGI-authorized invoice numbering

### Per-Country Compliance -- Belize

**Legal & Regulatory:**
- [ ] IBT registration requirements understood
- [ ] English-language compliance

**Tax Compliance:**
- [ ] GST 12.5% correctly applied
- [ ] TIN validation
- [ ] Invoice format meets IBT requirements

### Cross-Country Requirements

- [ ] Multi-currency support operational (CRC, GTQ, HNL, USD, NIO, BZD)
- [ ] Country selector in workspace onboarding
- [ ] Per-country tax configuration system
- [ ] Tax ID validation library covers all 6 countries
- [ ] Payment provider routing based on country
- [ ] Date formatting per locale
- [ ] Phone number validation per country
- [ ] WhatsApp integration tested for all country codes (+506, +502, +504, +503, +505, +501)

---

## 11. Partnership Opportunities

### 11.1 Regional Strategic Partnerships

| Partner | Type | Countries | Value to Kitz | Approach |
|---|---|---|---|---|
| **BAC Credomatic** | Payment + banking | CR, GT, HN, SV, NI | Single integration across 5 countries + PA; card acceptance, merchant services, API access | Regional fintech partnership proposal |
| **Millicom (Tigo)** | Mobile money | GT, HN, SV | Tigo Money API access; reach unbanked population | Commercial API partnership |
| **BCCR (Costa Rica Central Bank)** | SINPE access | CR | SINPE Movil aggregator status or bank partnership | Through member bank or aggregator |
| **Strike** | Lightning payments | SV (primary) | Managed Lightning/BTC payments with USD settlement | API integration partnership |
| **Megaprint** | FEL certification | GT | FEL document certification, largest Certificador | Certificador API partnership |

### 11.2 Country-Specific Partnerships

**Costa Rica:**

| Partner | Channel | Opportunity |
|---|---|---|
| MEIC (Ministerio de Economia) | Government | SMB digitization programs |
| Camara de Comercio de Costa Rica | Business association | Member benefit programs |
| Banco Nacional de Costa Rica | Banking | SINPE Movil integration, SMB banking |
| PROCOMER | Export promotion | Export invoice features for exporters |
| INA (Instituto Nacional de Aprendizaje) | Training | Digital skills training for SMBs |

**Guatemala:**

| Partner | Channel | Opportunity |
|---|---|---|
| MINECO (Ministerio de Economia) | Government | SMB formalization programs |
| CACIF (Coordinating Committee of Agricultural, Commercial, Industrial, and Financial Associations) | Business association | Access to organized business community |
| Banco Industrial | Banking | Largest bank, SMB accounts, payment integration |
| AGEXPORT | Export promotion | Export invoice features |

**El Salvador:**

| Partner | Channel | Opportunity |
|---|---|---|
| CONAMYPE (Comision Nacional de la Micro y Pequena Empresa) | Government | SMB development programs |
| FUSADES | Think tank/development | SMB research and programs |
| Bitcoin Beach / Bitcoin Country initiatives | Community | BTC merchant adoption network |
| Remittance operators (Western Union, Remitly) | Financial services | Remittance-to-business payment flows |

**Honduras:**

| Partner | Channel | Opportunity |
|---|---|---|
| SDE (Secretaria de Desarrollo Economico) | Government | SMB digitization |
| CCIC (Camara de Comercio e Industrias de Cortes) | Business association | San Pedro Sula business community |
| Banco Atlantida | Banking | Largest bank, merchant services |
| Ficohsa | Banking | Growing digital platform |

### 11.3 Distribution Strategy

```
Regional approach (parallel tracks):
========================================

Track 1: BAC Credomatic (all countries)
  -> Single regional partnership
  -> Bundle Kitz with BAC business account onboarding
  -> Card payment acceptance across all markets

Track 2: Tigo Money (GT, HN, SV)
  -> Mobile money acceptance for mass-market customers
  -> Reach unbanked/underbanked segments
  -> USSD fallback for feature phone users

Track 3: Country-specific (sequential)
  -> Costa Rica: SINPE Movil via aggregator or bank API
  -> Guatemala: FEL Certificador (Megaprint or Digifact)
  -> El Salvador: Strike for Lightning payments
  -> Honduras: SAR compliance when DTE launches
  -> Nicaragua: Monitor political situation, enter when stable
  -> Belize: English localization, niche market

Track 4: SMB associations & government (all countries)
  -> Partner with SMB development agencies in each country
  -> Become recommended technology provider
  -> Access to large SMB databases
```

---

## 12. Appendix: Reference Links

### Costa Rica

**Government & Tax:**
- Ministerio de Hacienda: https://www.hacienda.go.cr/
- ATV (Administracion Tributaria Virtual): https://www.hacienda.go.cr/ATV/ComprobanteElectronico
- Hacienda API (production): https://api.comprobanteselectronicos.go.cr/
- Hacienda API (sandbox): https://api-sandbox.comprobanteselectronicos.go.cr/
- IDP Authentication: https://idp.comprobanteselectronicos.go.cr/
- Direccion General de Tributacion: https://dgt.hacienda.go.cr/
- BCCR (Central Bank): https://www.bccr.fi.cr/
- SINPE information: https://www.bccr.fi.cr/seccion-sistema-de-pagos/sinpe

**Banking:**
- BAC Costa Rica: https://www.baccredomatic.com/es-cr
- Banco Nacional: https://www.bncr.fi.cr/
- Banco de Costa Rica: https://bancobcr.com/

**Payment Aggregators:**
- Greenpay: https://greenpay.me/
- PayRetailers: https://www.payretailers.com/

### Guatemala

**Government & Tax:**
- SAT: https://portal.sat.gob.gt/
- FEL Portal: https://fel.sat.gob.gt/
- FEL Verificador: https://fel.sat.gob.gt/verificador

**FEL Certificadores:**
- Megaprint: https://www.megaprint.com/
- Infile: https://www.infile.com/
- Guatefacturas: https://guatefacturas.com/
- Digifact: https://www.digifact.com.gt/

**Banking:**
- Banco Industrial: https://www.bi.com.gt/
- BAC Guatemala: https://www.baccredomatic.com/es-gt
- Banrural: https://www.banrural.com.gt/

### Honduras

**Government & Tax:**
- SAR: https://www.sar.gob.hn/
- BCH (Banco Central de Honduras): https://www.bch.hn/

**Banking:**
- Banco Atlantida: https://www.bancatlan.hn/
- Ficohsa: https://www.ficohsa.com/hn/
- BAC Honduras: https://www.baccredomatic.com/es-hn

### El Salvador

**Government & Tax:**
- Ministerio de Hacienda: https://www.mh.gob.sv/
- DGII: https://www.mh.gob.sv/dgii
- BCR (Banco Central de Reserva): https://www.bcr.gob.sv/

**Bitcoin/Lightning:**
- Ley Bitcoin: https://www.asamblea.gob.sv/decretos/details/2560
- Chivo Wallet: https://chivowallet.com/
- Strike: https://strike.me/
- BTCPay Server: https://btcpayserver.org/

**Banking:**
- Banco Agricola: https://www.bancoagricola.com/
- BAC El Salvador: https://www.baccredomatic.com/es-sv
- Davivienda El Salvador: https://www.davivienda.com.sv/

### Nicaragua

**Government & Tax:**
- DGI: https://www.dgi.gob.ni/
- BCN (Banco Central de Nicaragua): https://www.bcn.gob.ni/

**Banking:**
- BAC Nicaragua: https://www.baccredomatic.com/es-ni
- Banpro: https://www.banpro.com.ni/
- Lafise: https://www.lafise.com/blb/

### Belize

**Government & Tax:**
- Income and Business Tax Department: https://ibt.gov.bz/
- Central Bank of Belize: https://www.centralbank.org.bz/

**Banking:**
- Atlantic Bank: https://www.atlabank.com/
- Belize Bank: https://www.belizebank.com/
- Heritage Bank: https://www.heritageinternationalbank.com/

### Regional Organizations

- SIECA (Secretaria de Integracion Economica Centroamericana): https://www.sieca.int/
- BCIE (Banco Centroamericano de Integracion Economica): https://www.bcie.org/
- SICA (Sistema de la Integracion Centroamericana): https://www.sica.int/
- SECMCA (Secretaria Ejecutiva del Consejo Monetario Centroamericano): https://www.secmca.org/

### Regulatory References

**Costa Rica:**
- Law 9635 (Ley de Fortalecimiento de las Finanzas Publicas, 2018) -- IVA reform
- Resolution DGT-R-033-2019 -- E-invoicing technical specifications
- Law 8968 -- Data protection (Proteccion de la Persona frente al Tratamiento de sus Datos Personales)

**Guatemala:**
- Decreto 7-2019 -- FEL implementation
- Decreto 27-92 -- IVA law
- Acuerdo del Directorio SAT 13-2018 -- FEL regulations

**Honduras:**
- Decreto 278-2013 -- Tax code reform
- Acuerdo SAR -- CAI (Codigo de Autorizacion de Impresion) regulations

**El Salvador:**
- Ley Bitcoin (Decreto 57, 2021) -- Bitcoin legal tender
- Decreto Legislativo 230 -- Tax code (Codigo Tributario)
- DTE implementation decrees (ongoing)

**Nicaragua:**
- Ley 822 -- Ley de Concertacion Tributaria
- Decreto 01-2013 -- Tax code regulations

**Belize:**
- General Sales Tax Act (2006, amended)
- Income and Business Tax Act

### Kitz Codebase References

- Payment tools: `kitz_os/src/tools/paymentTools.ts`
- Invoice/quote tools: `kitz_os/src/tools/invoiceQuoteTools.ts`
- Invoice workflow: `kitz_os/data/n8n-workflows/invoice-auto-generate.json`
- Panama infrastructure doc: `docs/intelligence/PANAMA_INFRASTRUCTURE.md`

---

## Appendix A: SINPE Movil Integration Deep Dive (Costa Rica)

### A.1 Architecture Overview

SINPE Movil is a national instant payment rail. Unlike proprietary wallets (Yappy in Panama), SINPE Movil is operated by the central bank and mandated for all participating financial institutions. This creates both opportunities and challenges:

**Opportunities:**
- Universal reach -- every banked Costa Rican can use it
- No single-bank dependency
- Central bank backing means stability and trust
- Free or near-free for consumers

**Challenges:**
- No unified merchant API (each bank implements its own)
- No standardized webhook/notification system for merchants
- Reconciliation requires bank-specific integration or aggregator

### A.2 Integration Options

```
Option 1: Direct Bank API (BAC Costa Rica or Banco Nacional)
  Pros:  Lower cost, direct relationship, customizable
  Cons:  Bank-specific, limited to one bank's customers for notifications
  Flow:  Kitz -> Bank API -> SINPE network -> Customer's bank -> Customer

Option 2: Payment Aggregator (Greenpay, PayRetailers)
  Pros:  Unified API, multi-bank support, webhook notifications
  Cons:  Additional fees (1-3%), dependency on third party
  Flow:  Kitz -> Aggregator API -> SINPE network -> Customer's bank -> Customer

Option 3: Hybrid (Display + Manual + Bank Feed)
  Pros:  Works immediately, no API dependency
  Cons:  Manual reconciliation, slower payment confirmation
  Flow:  Invoice displays phone number -> Customer sends SINPE Movil ->
         Workspace owner confirms receipt manually or via bank feed import

Recommended: Start with Option 3 (immediate availability), migrate to
Option 2 (aggregator) for automated reconciliation.
```

### A.3 SINPE Movil Reference Display on Invoices

```
+---------------------------------------------------------+
|                     FACTURA ELECTRONICA                  |
|  Clave: 50624022630112345678900100010100000000011234567  |
+---------------------------------------------------------+
|                                                         |
|  [Invoice details...]                                   |
|                                                         |
|  Subtotal:     ₡ 100,000.00                            |
|  IVA (13%):    ₡  13,000.00                            |
|  Total:        ₡ 113,000.00                            |
|                                                         |
|  =============== OPCIONES DE PAGO ===================  |
|                                                         |
|  SINPE Movil:  8888-1234 (a nombre de Empresa S.A.)    |
|  Referencia:   FAC-2026-001234                          |
|                                                         |
|  Transferencia bancaria:                                |
|  IBAN: CR05015202001026284066                           |
|  Banco: BAC San Jose                                    |
|  Referencia: FAC-2026-001234                            |
|                                                         |
|  Pago con tarjeta: [link a BAC payment page]            |
+---------------------------------------------------------+
```

---

## Appendix B: FEL Integration Deep Dive (Guatemala)

### B.1 FEL Certificador API Example (Megaprint-style)

```typescript
interface FELDocumentRequest {
  nit_emisor: string;        // Issuer NIT
  nombre_emisor: string;     // Issuer name
  direccion_emisor: string;  // Issuer address
  nit_receptor: string;      // Recipient NIT (CF for consumidor final)
  nombre_receptor: string;   // Recipient name
  tipo_documento: 'FACT' | 'FCAM' | 'FPEQ' | 'NCRE' | 'NDEB';
  moneda: 'GTQ' | 'USD';
  items: FELLineItem[];
  fecha: string;             // YYYY-MM-DD
}

interface FELLineItem {
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  descuento: number;
  tipo_impuesto: 'IVA';  // Only IVA in Guatemala
  // IVA is INCLUDED in the price in Guatemala (not added on top)
  // Price / 1.12 = base; Price - base = IVA
}

interface FELDocumentResponse {
  uuid: string;              // SAT authorization UUID
  serie: string;             // Document series
  numero: string;            // Document number
  fecha_certificacion: string;
  xml_certificado: string;   // Base64-encoded signed XML
  pdf_url?: string;          // Link to PDF representation
}

// Example: Submit document to Certificador
async function submitFELDocument(
  doc: FELDocumentRequest,
  apiKey: string,
  certificadorUrl: string
): Promise<FELDocumentResponse> {
  const response = await fetch(`${certificadorUrl}/api/v1/dte`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(doc),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`FEL certification failed: ${error.message}`);
  }

  return response.json();
}
```

### B.2 Guatemala IVA Note -- Tax Included in Price

Unlike most countries where tax is added to the price, **Guatemala's IVA is INCLUDED in the displayed price**. This is a critical implementation detail:

```typescript
// Guatemala: IVA is INCLUDED in the sale price
function calculateGuatemalaIVA(priceWithIVA: number): { base: number; iva: number } {
  const base = priceWithIVA / 1.12;
  const iva = priceWithIVA - base;
  return {
    base: Math.round(base * 100) / 100,
    iva: Math.round(iva * 100) / 100,
  };
}

// Example: Product priced at Q112.00
// Base: Q112 / 1.12 = Q100.00
// IVA:  Q112 - Q100 = Q12.00
```

This affects invoice display: in Guatemala, the "total" is the same as the displayed price, and the IVA breakdown shows how much of that total is tax.

---

## Appendix C: Bitcoin/Lightning Deep Dive (El Salvador)

### C.1 Strike API Integration Example

```typescript
import Stripe from 'strike-api'; // hypothetical SDK

interface LightningInvoiceRequest {
  amount: {
    amount: string;    // e.g., "25.00"
    currency: 'USD';   // Strike settles in USD
  };
  description: string; // Invoice reference
}

interface LightningInvoiceResponse {
  invoiceId: string;
  lnInvoice: string;       // BOLT11 payment request
  expirationInSec: number;
  amount: {
    amount: string;
    currency: 'USD';
  };
  state: 'UNPAID' | 'PENDING' | 'PAID' | 'CANCELLED';
}

// Generate Lightning invoice via Strike
async function createLightningInvoice(
  amountUSD: number,
  invoiceRef: string,
  strikeApiKey: string
): Promise<LightningInvoiceResponse> {
  const response = await fetch('https://api.strike.me/v1/invoices', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${strikeApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      correlationId: invoiceRef,
      description: `Kitz Invoice ${invoiceRef}`,
      amount: {
        amount: amountUSD.toFixed(2),
        currency: 'USD',
      },
    }),
  });

  return response.json();
}

// Generate QR code for Lightning payment
function generateLightningQR(lnInvoice: string): string {
  // Use QR code library to generate from BOLT11 invoice string
  // The QR contains: lightning:{lnInvoice}
  return `lightning:${lnInvoice}`;
}

// Webhook handler for Strike payment notifications
async function handleStrikeWebhook(payload: {
  eventType: 'invoice.updated';
  data: { entityId: string; changes: string[] };
}): Promise<void> {
  if (payload.eventType === 'invoice.updated') {
    const invoiceId = payload.data.entityId;
    // Fetch invoice status
    const invoice = await fetch(`https://api.strike.me/v1/invoices/${invoiceId}`, {
      headers: { 'Authorization': `Bearer ${process.env.STRIKE_API_KEY}` },
    });
    const invoiceData = await invoice.json();

    if (invoiceData.state === 'PAID') {
      // Process payment in Kitz
      // payments_processWebhook(provider: 'lightning', ...)
      // Record: USD amount, BTC equivalent, Lightning payment hash
    }
  }
}
```

### C.2 BTC Price Display Component Logic

```typescript
// Real-time BTC price for invoice display
async function getBTCPrice(): Promise<number> {
  // Use multiple sources for reliability
  const sources = [
    'https://api.coinbase.com/v2/prices/BTC-USD/spot',
    'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
  ];

  // Fetch from primary source, fallback to secondary
  try {
    const response = await fetch(sources[0]);
    const data = await response.json();
    return parseFloat(data.data.amount);
  } catch {
    const response = await fetch(sources[1]);
    const data = await response.json();
    return data.bitcoin.usd;
  }
}

// Invoice display helper
function formatBTCEquivalent(usdAmount: number, btcPrice: number): string {
  const btcAmount = usdAmount / btcPrice;

  if (btcAmount < 0.001) {
    // Display in satoshis for small amounts
    const sats = Math.round(btcAmount * 100_000_000);
    return `${sats.toLocaleString()} sats`;
  }

  return `${btcAmount.toFixed(8)} BTC`;
}

// Example output on invoice:
// Total: $25.00 USD
// BTC equivalent: 38,461 sats (at $65,000/BTC)
// [Lightning QR Code]
```

### C.3 Ley Bitcoin Compliance Notes

| Requirement | Detail | Kitz Implementation |
|---|---|---|
| Accept BTC | All businesses must accept BTC (Art. 7) | Lightning payment option on all SV invoices |
| USD conversion | Automatic USD conversion available via Chivo | Strike provides instant USD settlement |
| Price display | May display prices in BTC (Art. 4) | Show BTC equivalent alongside USD |
| Tax | BTC transactions exempt from capital gains (Art. 5) | No additional tax reporting for BTC payments |
| Accounting | Record in USD equivalent at time of transaction | Store both USD and BTC amounts |
| Enforcement | Relaxed -- no known penalties for non-acceptance | Implement as opt-in for workspace owners initially |

---

## Appendix D: Remittance Corridor Analysis

### D.1 Remittance Volumes (2024-2025 estimates)

| Country | Annual remittances | % of GDP | Primary corridor | Kitz opportunity |
|---|---|---|---|---|
| Honduras | ~$9.0 billion | ~27% | US -> HN | SMBs serving remittance recipients |
| El Salvador | ~$8.2 billion | ~24% | US -> SV | BTC remittances via Lightning |
| Guatemala | ~$19.0 billion | ~18% | US -> GT | Largest absolute volume in CA |
| Nicaragua | ~$4.5 billion | ~15% | US -> NI, CR -> NI | Costa Rica is secondary corridor |
| Costa Rica | ~$1.0 billion | ~1.5% | US -> CR | Less significant economically |
| Belize | ~$0.1 billion | ~5% | US -> BZ | Small market |

### D.2 SMB-Remittance Interaction

Many Central American SMBs are deeply connected to remittance flows:
- **Tiendas de barrio** (corner stores) serve as informal remittance pickup points
- **Pulperias** and **abarroteras** see sales spikes when remittances arrive (typically biweekly)
- **Construction materials** businesses are heavily remittance-funded (recipients build/improve homes)
- **Clothing and electronics** retail benefits from remittance spending

**Kitz opportunity:** Build features that help SMBs anticipate and capitalize on remittance cycles:
- Sales forecasting aligned with remittance arrival patterns
- Inventory management suggestions based on remittance-driven demand
- Payment acceptance that connects to remittance distribution (e.g., Tigo Money is also a remittance receiver)

---

*This document should be reviewed and updated quarterly as Central American regulatory and payment landscapes evolve. Key monitoring dates: Costa Rica Hacienda API updates, Guatemala SAT FEL regulation changes, El Salvador DTE rollout milestones, Honduras DTE launch, Nicaragua political/sanctions developments, and regional SIECA harmonization initiatives.*
