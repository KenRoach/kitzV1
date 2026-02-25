# Peru & Ecuador Financial & Payment Infrastructure Intelligence

**Document type:** Strategic Intelligence Brief
**Last updated:** 2026-02-24
**Status:** Living document -- update as regulations and integrations evolve
**Audience:** Kitz engineering, product, and compliance teams
**Coverage:** Peru (PEN) and Ecuador (USD -- dollarized)

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

Peru and Ecuador represent two of the most strategically important expansion markets for Kitz in Latin America. Together they account for over 50 million people and millions of SMBs that are undergoing rapid digitization -- driven by government e-invoicing mandates, mobile wallet adoption, and post-pandemic shifts to digital commerce.

### 1.1 Peru

Peru is the larger of the two markets (~34 million population) and has one of the most mature e-invoicing systems in Latin America. SUNAT (the tax authority) mandated electronic invoicing years ahead of most peers and uses the UBL 2.1 XML standard shared with Colombia. The digital wallet landscape is dominated by **Yape** (BCP, 15M+ users) and **Plin** (multi-bank coalition), giving Kitz clear integration targets. Peru's tax regime includes specialized categories for small businesses -- the Regimen MYPE Tributario and the Regimen Unico Simplificado (RUS) -- which Kitz must understand to serve its core micro/small business audience. The currency is the Sol (PEN, S/), requiring Kitz to add multi-currency support beyond USD.

### 1.2 Ecuador

Ecuador is a **dollarized economy** -- it adopted the US Dollar as legal tender in 2000. This is a major strategic advantage for Kitz: the same USD-based pricing, invoicing, and payment logic built for Panama works in Ecuador with minimal currency adaptation. Ecuador's tax authority (SRI) has been phasing in mandatory electronic invoicing, with XML-based comprobantes electronicos that use a unique 49-digit Clave de Acceso for each document. The digital payment ecosystem is younger than Peru's but growing rapidly, led by **Payphone** (QR payments), **De Una** (Banco Pichincha), and **Bimo** (Banco del Pacifico). The IVA rate was raised from 12% to 15% in 2024, and basic goods remain at 0%.

### 1.3 Key Takeaways

- **Peru's Yape** (15M+ users) is the highest-priority payment integration for Peru, analogous to Yappy in Panama. Plin is the secondary wallet integration.
- **Ecuador uses USD** -- Kitz's existing USD-based invoice and payment infrastructure from Panama carries over directly. This makes Ecuador the lowest-friction expansion market.
- **E-invoicing is mandatory in both countries** -- Peru uses UBL 2.1 XML via SUNAT/OSE providers; Ecuador uses SRI-defined XML with Clave de Acceso. Both require digital signatures.
- **Tax regimes differ significantly** -- Peru has 18% IGV with complex withholding systems (detraccion, percepcion, retencion); Ecuador has 15% IVA with a simplified RISE regime for small businesses.
- **RUC exists in both countries** but with different formats -- Peru uses 11 digits, Ecuador uses 13 digits. The validation logic must be country-specific.
- **Competitive landscape** -- Alegra is strong in both markets; Facturalo and Nubefact dominate Peru's e-invoicing niche; Datil is the Ecuador specialist. None offer Kitz's AI-native, WhatsApp-first approach.

---

## 2. Payment Systems

### 2.1 Peru Payment Systems

#### 2.1.1 Yape (BCP -- Banco de Credito del Peru)

**What it is:**
Yape is Peru's dominant digital wallet and P2P/P2B payment platform, built by Banco de Credito del Peru (BCP), the country's largest bank. As of 2025, Yape has surpassed 15 million active users -- making it one of the most widely adopted fintech products in Latin America. It supports QR-based payments, instant P2P transfers, bill payments, and merchant payment acceptance. Yape has expanded beyond BCP account holders to work with any bank account or even without a bank account (Yape with DNI only).

**Why Kitz needs it:**
Yape is to Peru what Yappy is to Panama -- the single most important payment integration. The majority of Peruvian SMB customers will expect to pay via Yape. Its merchant QR payment system allows businesses to accept instant payments with zero or minimal fees for small transactions.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Developer program | Yape for Business (Yape Promos / Yape Negocios) |
| QR standard | EMVCo-compatible QR codes |
| Authentication | Merchant registration through BCP business banking |
| Settlement | Into merchant's BCP business account |
| Transaction limits | Up to S/ 2,000 per transaction (consumer); higher for business accounts |
| Fees | Variable; typically 0% for P2P, ~0.8-1.5% for merchant QR |
| Notifications | Push notifications to both merchant and payer apps |
| Interoperability | Yape-to-Plin transfers enabled (since 2023) |

**Integration pattern for Kitz:**

```
1. Kitz workspace owner registers for Yape Negocios via BCP
2. Kitz generates EMVCo QR code with payment amount + reference
3. Customer scans QR in Yape app
4. Customer confirms payment (PIN/biometric)
5. Yape processes payment instantly
6. Kitz receives confirmation callback / polls status
7. Invoice status -> 'paid', CRM updated, WhatsApp receipt sent
```

**Key implementation considerations:**
- Yape's merchant API access may require direct partnership with BCP's business development team.
- QR codes should embed the invoice reference number for automatic reconciliation.
- Yape now supports interoperability with Plin, meaning a single QR can potentially accept payments from both ecosystems.
- For unbanked merchants, Yape with DNI (national ID) provides a lightweight onboarding path.

**Implementation timeline:** P0 for Peru launch -- highest priority payment integration.

---

#### 2.1.2 Plin (BBVA, Interbank, Scotiabank)

**What it is:**
Plin is a multi-bank digital wallet coalition in Peru, backed by BBVA Peru, Interbank, and Scotiabank Peru. It enables instant P2P transfers and merchant payments across participating banks. While smaller than Yape in user base, Plin captures a significant share of Peru's digital payment volume, particularly among BBVA and Interbank customers.

**Why Kitz needs it:**
Plin is the second-most-used digital wallet in Peru. Many business owners and customers use Plin as their primary payment method, especially those who bank with BBVA or Interbank. With Yape-Plin interoperability now active, a single QR integration strategy can capture both ecosystems, but Kitz should still support Plin-specific merchant flows for businesses that prefer it.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Supported banks | BBVA Peru, Interbank, Scotiabank Peru, and others |
| QR standard | EMVCo-compatible (interoperable with Yape since 2023) |
| Authentication | Via participating bank's business banking portal |
| Settlement | Into merchant's account at participating bank |
| Interoperability | Yape-to-Plin and Plin-to-Yape transfers supported |

**Implementation timeline:** P1 for Peru launch -- integrate alongside Yape via interoperable QR.

---

#### 2.1.3 PagoEfectivo

**What it is:**
PagoEfectivo is Peru's leading cash and bank transfer payment network. It generates a unique CIP (Codigo de Pago) that customers can pay at banks, ATMs, convenience stores (bodegas), and agents nationwide. This is critical for reaching Peru's unbanked and underbanked population (~40% of adults).

**Why Kitz needs it:**
Many Peruvian SMB customers still prefer to pay in cash or via bank transfer rather than digital wallets. PagoEfectivo bridges this gap by generating a payment code that can be paid at physical locations. For Kitz users who invoice customers without Yape or Plin, PagoEfectivo provides a universal payment option.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Developer portal | https://pagoefectivo.pe/desarrolladores |
| API type | RESTful API |
| Payment code | CIP (Codigo Interbancario de Pago) -- unique per transaction |
| Payment locations | Banks, ATMs, agents, bodegas (50,000+ points nationwide) |
| Settlement | T+1 to merchant bank account |
| Notifications | Webhook/callback on payment confirmation |
| Supported currencies | PEN (Sol), USD |

**Integration pattern for Kitz:**

```
1. Kitz generates PagoEfectivo CIP via API (amount + reference + expiry)
2. CIP code sent to customer (WhatsApp, email, SMS)
3. Customer pays at any PagoEfectivo point (bank, ATM, bodega)
4. PagoEfectivo confirms payment via webhook
5. Kitz calls payments_processWebhook(provider: 'pagoefectivo', ...)
6. Invoice updated, CRM updated, receipt sent
```

**Implementation timeline:** P1 for Peru launch -- essential for cash-based customer segment.

---

#### 2.1.4 Niubiz (formerly VisaNet Peru)

**What it is:**
Niubiz is Peru's dominant card acquirer, processing the majority of Visa, Mastercard, and American Express transactions in the country. It provides POS terminals, e-commerce payment gateways, and merchant services. Rebranded from VisaNet Peru, Niubiz now operates as a multi-brand acquirer.

**Why Kitz needs it:**
For Kitz users who accept card payments (online or in-person), Niubiz is the primary acquirer. Its e-commerce gateway enables online card payment acceptance, which Kitz can integrate for invoice payment links.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Developer portal | https://developers.niubiz.com.pe/ |
| API type | RESTful API with tokenization |
| Card brands | Visa, Mastercard, American Express, Diners Club |
| POS terminals | Physical and mobile (mPOS) |
| E-commerce | Hosted payment page and direct API integration |
| Security | PCI-DSS Level 1 compliant |
| Settlement | T+2 to merchant bank account |
| Installments | Cuotas (installment plans) supported for local cards |

**Implementation timeline:** P2 for Peru launch -- card payment acceptance.

---

#### 2.1.5 Izipay

**What it is:**
Izipay is a Peruvian SMB-focused payment terminal and gateway provider. It offers affordable POS terminals, QR payment acceptance, and an e-commerce payment gateway targeted at small businesses. Izipay has gained significant market share among micro and small businesses that find Niubiz's pricing too expensive.

**Why Kitz needs it:**
Izipay's focus on SMBs aligns perfectly with Kitz's target market. Its lower fees and simpler onboarding make it the preferred card acquirer for micro businesses. Kitz could integrate Izipay as an alternative to Niubiz for smaller merchants.

**Implementation timeline:** P2 for Peru launch -- alternative to Niubiz for micro businesses.

---

#### 2.1.6 Culqi

**What it is:**
Culqi is a Peru-native payment gateway with a developer-friendly API, similar to Stripe. It supports card payments, Yape, PagoEfectivo, and bank transfers through a single integration. Culqi was built specifically for the Peruvian market and understands local payment nuances.

**Why Kitz needs it:**
Culqi could serve as Kitz's unified payment gateway for Peru, aggregating multiple payment methods (cards, Yape, PagoEfectivo) through a single API. This would simplify integration compared to connecting to each provider individually.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Developer portal | https://docs.culqi.com/ |
| API type | RESTful API, well-documented |
| SDKs | Node.js, PHP, Python, Ruby, Java |
| Payment methods | Cards (Visa, MC, AMEX, Diners), Yape, PagoEfectivo, bank transfers |
| Tokenization | PCI-DSS compliant card tokenization |
| Webhooks | Event-based notifications for payment status changes |
| Sandbox | Full sandbox environment for testing |
| Pricing | Per-transaction fee (~3.99% + S/ 0.30 for cards) |

**Integration pattern for Kitz (aggregated):**

```typescript
import Culqi from 'culqi-node';

const culqi = new Culqi({
  publicKey: process.env.CULQI_PUBLIC_KEY,
  privateKey: process.env.CULQI_PRIVATE_KEY,
});

// Create a charge
const charge = await culqi.charges.create({
  amount: 15000,          // Amount in centimos (S/ 150.00)
  currency_code: 'PEN',
  email: 'customer@email.com',
  source_id: tokenId,     // From Culqi.js frontend tokenization
  description: `Invoice ${invoiceNumber}`,
  metadata: {
    invoice_id: invoiceId,
    workspace_id: workspaceId,
  },
});
```

**Implementation timeline:** P1 for Peru launch -- evaluate as unified gateway vs. individual integrations.

---

#### 2.1.7 Mercado Pago Peru

**What it is:**
Mercado Pago (the financial arm of MercadoLibre) operates in Peru as a payment gateway and digital wallet. It supports card payments, bank transfers, and cash payments through a single API. While more associated with e-commerce, it has a growing merchant payment business.

**Implementation timeline:** P3 for Peru -- lower priority given Culqi and Yape coverage.

---

#### 2.1.8 Tunki (Interbank)

**What it is:**
Tunki is Interbank's digital wallet, allowing users to make P2P transfers and QR payments. It is part of the Plin ecosystem. While smaller than Yape, it has a loyal user base among Interbank customers.

**Implementation timeline:** P3 for Peru -- covered by Plin interoperability.

---

### 2.2 Ecuador Payment Systems

#### 2.2.1 Payphone

**What it is:**
Payphone is Ecuador's leading QR payment platform. It allows merchants to accept payments via QR code scanning, with customers paying from their linked bank accounts or cards. Payphone has become the closest thing Ecuador has to Panama's Yappy or Peru's Yape -- a widely recognized, easy-to-use payment method for both consumers and merchants.

**Why Kitz needs it:**
Payphone is the top priority payment integration for Ecuador. Its QR-based system aligns with Kitz's existing payment flow patterns (similar to Yappy QR in Panama). Merchants generate QR codes, customers scan and pay, and the merchant receives instant confirmation.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Developer portal | https://developers.payphone.app/ |
| API type | RESTful API |
| QR standard | Proprietary QR with payment link fallback |
| Authentication | API Key + API Secret (merchant credentials) |
| Payment methods | Bank account (debit), credit/debit cards |
| Settlement | Into merchant's registered bank account |
| Webhooks | Callback URL for payment confirmations |
| Sandbox | Test environment available |
| Currency | USD (Ecuador is dollarized) |

**Integration pattern for Kitz:**

```
1. Kitz generates Payphone payment request via API
   -> API returns QR code + payment link
2. Customer scans QR or clicks payment link
3. Customer confirms payment in Payphone app / web
4. Payphone processes payment
5. Payphone sends webhook to Kitz callback URL
6. Kitz calls payments_processWebhook(provider: 'payphone', ...)
7. Invoice status -> 'paid', CRM updated, WhatsApp receipt sent
```

**Key advantage:** Ecuador uses USD -- so Kitz's existing USD-based payment processing logic from Panama works directly. No currency conversion required.

**Implementation timeline:** P0 for Ecuador launch -- highest priority payment integration.

---

#### 2.2.2 De Una (Banco Pichincha)

**What it is:**
De Una is the digital wallet from Banco Pichincha, Ecuador's largest bank. It enables P2P transfers, QR payments, and bill payments. As Banco Pichincha holds the largest market share in Ecuadorian banking, De Una has a strong user base.

**Why Kitz needs it:**
De Una captures the Banco Pichincha customer segment, which represents the largest single bank customer base in Ecuador. Integration with De Una ensures Kitz can accept payments from this critical segment.

**Implementation timeline:** P1 for Ecuador launch -- second priority after Payphone.

---

#### 2.2.3 Bimo (Banco del Pacifico)

**What it is:**
Bimo is Banco del Pacifico's digital wallet. It supports QR payments, P2P transfers, and merchant payments. Banco del Pacifico is a major Ecuadorian bank, particularly strong in the coastal region (Guayaquil).

**Implementation timeline:** P2 for Ecuador launch.

---

#### 2.2.4 Datafast

**What it is:**
Datafast is Ecuador's dominant card acquirer, similar to Niubiz in Peru or VisaNet in other markets. It processes Visa, Mastercard, Diners Club, and Discover transactions. Datafast provides POS terminals, e-commerce gateways, and merchant services to Ecuadorian businesses.

**Why Kitz needs it:**
For Kitz users who need to accept card payments in Ecuador, Datafast is the primary acquirer. Its e-commerce gateway enables online card payment acceptance through invoice payment links.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Card brands | Visa, Mastercard, Diners Club, Discover |
| POS terminals | Physical and mobile |
| E-commerce | Hosted payment page |
| Security | PCI-DSS compliant |
| Settlement | Into merchant's bank account |
| Installments | Cuotas supported (diferido) -- common in Ecuador |
| Currency | USD |

**Implementation timeline:** P2 for Ecuador launch -- card payment acceptance.

---

#### 2.2.5 Kushki Ecuador

**What it is:**
Kushki is a LatAm-wide payment infrastructure company with strong operations in Ecuador (where it was originally founded). It provides a unified payment API supporting cards, bank transfers, and cash payments. Kushki's developer-friendly approach makes it similar to Stripe for the Latin American market.

**Why Kitz needs it:**
Kushki could serve as Kitz's unified payment gateway for Ecuador (and potentially across all LatAm markets), aggregating multiple payment methods through a single API. Its Ecuadorian roots mean strong local support and understanding.

**Technical integration:**

| Aspect | Detail |
|---|---|
| Developer portal | https://docs.kushki.com/ |
| API type | RESTful API |
| SDKs | JavaScript, iOS, Android |
| Payment methods | Cards, bank transfers, cash (PuntoMatico, etc.) |
| Tokenization | PCI-DSS compliant |
| Multi-country | Ecuador, Colombia, Peru, Mexico, Chile |
| Currency | USD (Ecuador), multi-currency support |
| Webhooks | Event-driven notifications |

**Implementation timeline:** P1 for Ecuador launch -- evaluate as unified gateway.

---

#### 2.2.6 Nuvei / Paymentez

**What it is:**
Paymentez (now part of Nuvei) is a payment gateway that has been operating in Ecuador for years. It supports card payments, bank transfers, and alternative payment methods. Many Ecuadorian e-commerce businesses use Paymentez as their primary payment gateway.

**Implementation timeline:** P3 for Ecuador -- lower priority given Kushki and Payphone coverage.

---

## 3. Banking & Interbank Infrastructure

### 3.1 Peru Banking Infrastructure

#### 3.1.1 BCRP (Banco Central de Reserva del Peru)

**What it is:**
The BCRP is Peru's central bank. It manages monetary policy, issues the Sol (PEN), operates the LBTR (Real-Time Gross Settlement) system, and oversees the CCE (Camara de Compensacion Electronica) for interbank clearing. The BCRP has been a driving force behind payment system modernization in Peru, including the interoperability mandate that enabled Yape-Plin transfers.

**Relevance to Kitz:**
- The BCRP's interoperability mandate means Kitz can potentially integrate with one QR payment system and reach users of both Yape and Plin.
- The LBTR system handles high-value interbank transfers that larger Kitz users may need for B2B payments.
- BCRP regulations on electronic money and digital wallets define the compliance framework for Kitz's payment features.

#### 3.1.2 Peru Banking Landscape

| Bank | Relevance to Kitz | Key Products |
|---|---|---|
| **BCP (Banco de Credito del Peru)** | #1 priority -- operates Yape, largest bank | Yape, business banking, merchant services |
| **BBVA Peru** | #2 -- Plin coalition member, strong SMB banking | Plin, business accounts, card acquiring |
| **Interbank** | #3 -- Plin coalition member, operates Tunki | Plin, Tunki, business banking |
| **Scotiabank Peru** | Plin coalition member | Plin, business accounts, trade finance |
| **BanBif** | Growing SMB segment | Business accounts, microfinance |
| **Caja Arequipa** | Microfinance leader | Microloans, savings, SMB credit |
| **Mi Banco** | BCP subsidiary, microfinance focus | Microloans, SMB credit, financial inclusion |

**Typical SMB banking in Peru:**
- Cuenta corriente empresarial (business checking account)
- Cuenta de detracciones (mandatory withholding account at Banco de la Nacion)
- POS terminal or QR payment acceptance
- Linea de credito (working capital line)
- Transferencias interbancarias (CCI -- Codigo de Cuenta Interbancaria, 20 digits)

---

### 3.2 Ecuador Banking Infrastructure

#### 3.2.1 BCE (Banco Central del Ecuador)

**What it is:**
The BCE is Ecuador's central bank. Since Ecuador uses USD, the BCE does not set monetary policy in the traditional sense but does manage the national payment system (SNP -- Sistema Nacional de Pagos), issue electronic certificates for e-invoicing, and regulate interbank clearing. The BCE also operates the SPI (Sistema de Pagos Interbancarios) for interbank transfers.

**Relevance to Kitz:**
- The BCE issues electronic certificates (firma electronica) used for signing e-invoices -- a critical dependency for Kitz's Ecuador invoicing feature.
- The SPI handles interbank transfers that businesses use for B2B payments.
- Ecuador's dollarized economy means all BCE-managed payment systems operate in USD.

#### 3.2.2 Ecuador Banking Landscape

| Bank | Relevance to Kitz | Key Products |
|---|---|---|
| **Banco Pichincha** | #1 priority -- largest bank, operates De Una | De Una wallet, business banking, merchant services |
| **Banco del Pacifico** | #2 -- operates Bimo, strong in coast (Guayaquil) | Bimo wallet, business banking |
| **Produbanco** (Grupo Promerica) | Strong SMB banking | Business accounts, trade finance |
| **Banco Guayaquil** | Major commercial bank | Business banking, card services |
| **Banco Bolivariano** | Growing digital presence | Online banking, business accounts |
| **BanEcuador** | Government development bank | Microloans, agricultural credit, SMB development |
| **Cooperativa JEP** | Largest credit cooperative | Microfinance, savings, SMB loans |

**Typical SMB banking in Ecuador:**
- Cuenta corriente empresarial (business checking -- all in USD)
- Transferencias bancarias (bank transfers via SPI)
- Datafast POS terminal or Payphone QR
- Credito productivo (productive credit for SMBs)
- Poliza de acumulacion (term deposits, common for savings)

**Strategic note:** Ecuador's use of USD means no FX conversion is needed between Kitz's Panama infrastructure and Ecuador. Settlement, invoicing, pricing, and reporting all use the same currency. This is a significant cost and complexity advantage over Peru (which requires PEN handling).

---

## 4. Government & Regulatory Bodies

### 4.1 Peru: SUNAT (Superintendencia Nacional de Aduanas y de Administracion Tributaria)

**What it is:**
SUNAT is Peru's tax and customs authority. It is one of the most digitally advanced tax agencies in Latin America, having mandated electronic invoicing earlier than most regional peers. SUNAT administers the RUC (taxpayer registry), IGV (VAT), income tax, and the Comprobantes de Pago Electronicos (CPE) system.

**Why Kitz needs it:**
Every invoice Kitz generates for a Peruvian workspace must comply with SUNAT's CPE requirements. SUNAT's e-invoicing system is mature and well-documented, but it has strict validation rules. Non-compliance results in fines and rejection of tax credits for the buyer.

**Key SUNAT systems:**

| System | URL | Purpose |
|---|---|---|
| Clave SOL portal | https://e-menu.sunat.gob.pe/ | Online tax services, RUC management |
| CPE portal | https://cpe.sunat.gob.pe/ | E-invoice submission and validation |
| OSE registry | SUNAT website | List of authorized OSE providers |
| Consulta RUC | https://e-consultaruc.sunat.gob.pe/ | RUC lookup and validation |
| Libros Electronicos (PLE) | Via Clave SOL | Electronic accounting books submission |

**Compliance requirements for Kitz:**
- All invoices must be generated as UBL 2.1 XML, digitally signed, and submitted to SUNAT (directly or via OSE).
- RUC validation is mandatory for B2B invoices (facturas).
- IGV must be calculated and displayed correctly on every taxable invoice.
- Businesses must maintain sequential invoice numbering per series (F001, B001, etc.).
- Monthly PDT (Programa de Declaracion Telematica) filings for IGV-Renta.
- Annual Declaracion Jurada (income tax declaration).

---

### 4.2 Peru: Tax Regimes for SMBs

Peru has multiple tax regimes, and Kitz must understand which regime each workspace owner is in, as it affects invoicing rules, tax obligations, and document types.

| Regime | Revenue Limit | Income Tax | IGV | Invoice Types Allowed | Accounting Books |
|---|---|---|---|---|---|
| **NRUS (Nuevo RUS)** | Up to S/ 96,000/year | Fixed monthly quota (S/ 20 or S/ 50) | Not charged | Boleta de Venta only (no Factura) | None required |
| **RER (Regimen Especial)** | Up to S/ 525,000/year | 1.5% of net monthly income | 18% | Factura + Boleta | Registro de Compras + Ventas |
| **Regimen MYPE Tributario** | Up to 1,700 UIT (~S/ 8.5M) | Progressive: 10% (first 15 UIT), 29.5% above | 18% | Factura + Boleta | Full accounting above 300 UIT |
| **Regimen General** | No limit | 29.5% | 18% | All document types | Full accounting |

**Kitz implications:**
- **NRUS businesses** cannot issue Facturas -- only Boletas de Venta. Kitz must enforce this restriction.
- **RER businesses** have simplified accounting but still charge IGV.
- **MYPE Tributario** is the most common regime for Kitz's target market. Progressive tax rates and simplified requirements up to 300 UIT.
- Kitz should capture the tax regime during workspace onboarding and enforce the appropriate invoicing rules.

---

### 4.3 Peru: E-Invoicing (Comprobantes de Pago Electronicos - CPE)

**What it is:**
Peru's CPE system is one of the most mature e-invoicing frameworks in Latin America. It requires businesses to issue electronic payment receipts in UBL 2.1 XML format, digitally signed and submitted to SUNAT for validation. Businesses can submit directly to SUNAT or through an OSE (Operador de Servicios Electronicos) -- an authorized third-party operator.

**Document types in Peru's CPE system:**

| Code | Document Type | Series Format | Usage |
|---|---|---|---|
| **01** | Factura | F001-00000001 | B2B invoices (requires buyer RUC) |
| **03** | Boleta de Venta | B001-00000001 | B2C receipts (buyer DNI optional) |
| **07** | Nota de Credito | F001-00000001 / B001-00000001 | Credit notes (corrections, returns) |
| **08** | Nota de Debito | F001-00000001 / B001-00000001 | Debit notes (additional charges) |
| **09** | Guia de Remision | T001-00000001 | Transport/delivery guide |
| **20** | Comprobante de Retencion | R001-00000001 | Withholding receipt |
| **40** | Comprobante de Percepcion | P001-00000001 | Perception receipt |

**Series numbering rules:**
- Facturas: Series starts with F (F001, F002, etc.)
- Boletas: Series starts with B (B001, B002, etc.)
- Each series is sequential and non-repeating
- Series can represent different branches or points of sale

**Submission channels:**

| Channel | Description | Best For |
|---|---|---|
| **SUNAT SOL** | Direct submission via SUNAT's web portal | Low-volume businesses, manual process |
| **SUNAT API** | Direct API submission to SUNAT web services | Medium-volume businesses with technical capability |
| **OSE** | Authorized third-party operator (validates and forwards to SUNAT) | High-volume businesses, recommended for Kitz |

**OSE providers (examples):**
- Nubefact
- Facturalo
- DIGIFLOW
- Efact
- TCI (Telefonica)

**Recommended approach for Kitz:** Integrate with an OSE provider (Nubefact or Facturalo) via API. The OSE handles XML validation, digital signing, SUNAT submission, and CDR (Constancia de Recepcion) retrieval. Kitz generates the invoice data and sends it to the OSE.

---

### 4.4 Peru: IGV (Impuesto General a las Ventas)

**What it is:**
IGV is Peru's value-added tax. The combined rate is 18%, composed of 16% IGV proper plus 2% IPM (Impuesto de Promocion Municipal). It applies to the sale of goods, provision of services, construction contracts, and imports.

**Tax rates:**

| Rate | Application |
|---|---|
| **18%** | Standard rate (16% IGV + 2% IPM) -- most goods and services |
| **0%** | Exports of goods and services |
| **Exempt (Exonerado)** | Basic food items, agricultural products, financial services, education, public transport |
| **Unaffected (Inafecto)** | Government fees, transfers of assets as a going concern, certain cultural events |

**IGV calculation:**

```typescript
interface PeruIGVCalculation {
  subtotal: number;        // Base imponible
  igvRate: number;         // 0.18 (standard)
  igvAmount: number;       // subtotal * igvRate
  total: number;           // subtotal + igvAmount
}

function calculateIGV(
  lineItems: Array<{ unitPrice: number; quantity: number; taxCategory: 'gravado' | 'exonerado' | 'inafecto' | 'exportacion' }>
): PeruIGVCalculation {
  const IGV_RATE = 0.18;

  let gravadoTotal = 0;
  let exoneradoTotal = 0;
  let inafectoTotal = 0;
  let exportacionTotal = 0;

  for (const item of lineItems) {
    const lineTotal = item.unitPrice * item.quantity;
    switch (item.taxCategory) {
      case 'gravado':
        gravadoTotal += lineTotal;
        break;
      case 'exonerado':
        exoneradoTotal += lineTotal;
        break;
      case 'inafecto':
        inafectoTotal += lineTotal;
        break;
      case 'exportacion':
        exportacionTotal += lineTotal;
        break;
    }
  }

  const igvAmount = gravadoTotal * IGV_RATE;
  const subtotal = gravadoTotal + exoneradoTotal + inafectoTotal + exportacionTotal;
  const total = subtotal + igvAmount;

  return {
    subtotal,
    igvRate: IGV_RATE,
    igvAmount,
    total,
  };
}
```

**Withholding systems (Detracciones, Percepciones, Retenciones):**

Peru has three complex withholding mechanisms that affect SMB cash flow:

| System | Rate | Trigger | Mechanism |
|---|---|---|---|
| **Detraccion (SPOT)** | 4-12% (varies by service/good) | Sales exceeding S/ 700 (services) or S/ 700 (goods) | Buyer deposits withholding % into seller's Banco de la Nacion detraction account before paying the invoice |
| **Retencion** | 3% | Buyer is designated as Agente de Retencion by SUNAT | Buyer withholds 3% of the total (including IGV) and remits to SUNAT |
| **Percepcion** | 2% (general), 0.5% (fuel), 10% (imports) | Seller is designated as Agente de Percepcion | Seller charges additional % on top of the invoice total |

**Kitz implications:**
- Kitz must detect whether a transaction triggers detracciones and calculate the correct rate based on the CIIU (economic activity code) of the goods/services.
- The detraccion amount must be shown on the invoice as a note.
- Kitz should track detraccion deposits in the seller's Banco de la Nacion account for reconciliation.
- For retenciones, Kitz must generate Comprobantes de Retencion when the workspace owner acts as an Agente de Retencion.

---

### 4.5 Ecuador: SRI (Servicio de Rentas Internas)

**What it is:**
The SRI is Ecuador's tax authority, responsible for tax collection, taxpayer registration (RUC), IVA administration, income tax, and the electronic invoicing system (Comprobantes Electronicos). The SRI has been progressively mandating e-invoicing across business segments.

**Why Kitz needs it:**
Every invoice Kitz generates for an Ecuadorian workspace must comply with SRI's Comprobantes Electronicos requirements. The SRI's XML format is Ecuador-specific (not UBL 2.1 like Peru/Colombia), requiring a separate XML generation layer.

**Key SRI systems:**

| System | URL | Purpose |
|---|---|---|
| SRI Online | https://srienlinea.sri.gob.ec/ | Tax filing, RUC management, e-invoice portal |
| Comprobantes Electronicos | https://cel.sri.gob.ec/ | E-invoice authorization and validation |
| Consulta RUC | https://srienlinea.sri.gob.ec/sri-en-linea/contribuyente/perfil | RUC lookup |
| Facturacion Electronica Docs | SRI website | Technical documentation for e-invoicing |
| Firma Electronica | BCE / providers | Electronic certificate issuance |

---

### 4.6 Ecuador: Tax System (IVA and Income Tax)

**IVA (Impuesto al Valor Agregado):**

| Rate | Application |
|---|---|
| **15%** | Standard rate (increased from 12% in April 2024 to fund earthquake reconstruction and security spending) |
| **5%** | Reduced rate for certain tourism and related services (introduced 2024) |
| **0%** | Basic food items (canasta basica), medicines, agricultural inputs, exports, education, health, public transport, rent |
| **Exempt (No objeto)** | Financial services, equity transfers, inheritances |

**IVA calculation:**

```typescript
interface EcuadorIVACalculation {
  subtotalGravado: number;    // Taxable base (15% or 5%)
  subtotalCero: number;       // 0% rated items
  subtotalNoObjeto: number;   // Not subject to IVA
  ivaAmount: number;          // IVA total
  total: number;
}

function calculateIVA(
  lineItems: Array<{
    unitPrice: number;
    quantity: number;
    ivaCategory: 'tarifa15' | 'tarifa5' | 'tarifa0' | 'no_objeto' | 'exento';
  }>
): EcuadorIVACalculation {
  const IVA_STANDARD = 0.15;
  const IVA_REDUCED = 0.05;

  let subtotalGravado15 = 0;
  let subtotalGravado5 = 0;
  let subtotalCero = 0;
  let subtotalNoObjeto = 0;

  for (const item of lineItems) {
    const lineTotal = item.unitPrice * item.quantity;
    switch (item.ivaCategory) {
      case 'tarifa15':
        subtotalGravado15 += lineTotal;
        break;
      case 'tarifa5':
        subtotalGravado5 += lineTotal;
        break;
      case 'tarifa0':
        subtotalCero += lineTotal;
        break;
      case 'no_objeto':
      case 'exento':
        subtotalNoObjeto += lineTotal;
        break;
    }
  }

  const ivaAmount = (subtotalGravado15 * IVA_STANDARD) + (subtotalGravado5 * IVA_REDUCED);
  const total = subtotalGravado15 + subtotalGravado5 + subtotalCero + subtotalNoObjeto + ivaAmount;

  return {
    subtotalGravado: subtotalGravado15 + subtotalGravado5,
    subtotalCero,
    subtotalNoObjeto,
    ivaAmount,
    total,
  };
}
```

**RISE (Regimen Impositivo Simplificado Ecuatoriano):**

RISE is Ecuador's simplified tax regime for small businesses and informal workers. It replaces IVA and income tax with a fixed monthly quota based on revenue brackets and economic activity.

| Revenue Bracket (Annual) | Monthly Quota (approx.) | Invoice Type |
|---|---|---|
| Up to $5,000 | $1-3 | Nota de Venta RISE |
| $5,001 - $10,000 | $3-10 | Nota de Venta RISE |
| $10,001 - $20,000 | $8-22 | Nota de Venta RISE |
| $20,001 - $30,000 | $15-35 | Nota de Venta RISE |
| $30,001 - $40,000 | $20-50 | Nota de Venta RISE |
| $40,001 - $60,000 | $25-70 | Nota de Venta RISE |

**Kitz implications:**
- RISE businesses issue Notas de Venta, not Facturas. Kitz must enforce this restriction.
- RISE businesses do not charge IVA -- the fixed quota replaces it.
- Kitz should detect the tax regime during onboarding and configure invoicing rules accordingly.

---

### 4.7 Ecuador: E-Invoicing (Comprobantes Electronicos)

**What it is:**
Ecuador's electronic invoicing system requires businesses to generate XML documents, digitally sign them with an electronic certificate (firma electronica), and submit them to the SRI for authorization. Each document receives a unique 49-digit Clave de Acceso (access key) that serves as its universal identifier.

**Document types in Ecuador's e-invoicing system:**

| Document Type | Description | Kitz Mapping |
|---|---|---|
| **Factura** | Standard invoice | `invoice_create` |
| **Nota de Credito** | Credit note (corrections, returns) | Credit note feature |
| **Nota de Debito** | Debit note (additional charges) | Debit note feature |
| **Guia de Remision** | Transport/delivery guide | Shipping feature (future) |
| **Comprobante de Retencion** | Withholding receipt | Withholding feature |
| **Liquidacion de Compras** | Purchase settlement (for informal suppliers) | Purchase feature (future) |

**Clave de Acceso (49-digit access key):**

The Clave de Acceso is a unique identifier for each electronic document, composed of:

```
Position  Field                          Length  Example
01-08     Fecha de emision (ddmmaaaa)     8       24022026
09-10     Tipo de comprobante             2       01 (factura)
11-23     RUC del emisor                  13      1790012345001
24-24     Tipo de ambiente                1       2 (produccion)
25-27     Serie (establecimiento)         3       001
28-30     Serie (punto de emision)        3       001
31-39     Secuencial                      9       000000001
40-47     Codigo numerico (random)        8       12345678
48-48     Tipo de emision                 1       1 (normal)
49-49     Digito verificador (mod 11)     1       7
```

**Clave de Acceso generation:**

```typescript
function generateClaveAcceso(params: {
  fechaEmision: Date;        // Issue date
  tipoComprobante: string;   // '01' factura, '04' nota credito, etc.
  ruc: string;               // 13-digit RUC
  ambiente: '1' | '2';       // 1=pruebas, 2=produccion
  establecimiento: string;   // 3-digit branch code
  puntoEmision: string;      // 3-digit POS code
  secuencial: string;        // 9-digit sequential number
  tipoEmision: '1';          // 1=normal
}): string {
  const dd = params.fechaEmision.getDate().toString().padStart(2, '0');
  const mm = (params.fechaEmision.getMonth() + 1).toString().padStart(2, '0');
  const aaaa = params.fechaEmision.getFullYear().toString();
  const fecha = `${dd}${mm}${aaaa}`;

  const codigoNumerico = Math.floor(Math.random() * 100000000)
    .toString()
    .padStart(8, '0');

  const base =
    fecha +
    params.tipoComprobante +
    params.ruc +
    params.ambiente +
    params.establecimiento +
    params.puntoEmision +
    params.secuencial +
    codigoNumerico +
    params.tipoEmision;

  // Modulo 11 check digit calculation
  const digitoVerificador = calculateMod11(base);

  return base + digitoVerificador;
}

function calculateMod11(value: string): string {
  const weights = [2, 3, 4, 5, 6, 7]; // Repeating weights
  let sum = 0;

  for (let i = value.length - 1, w = 0; i >= 0; i--, w++) {
    sum += parseInt(value[i]) * weights[w % weights.length];
  }

  const remainder = sum % 11;
  const check = 11 - remainder;

  if (check === 11) return '0';
  if (check === 10) return '1';
  return check.toString();
}
```

**SRI submission workflow:**

```
1. Generate XML document with all required fields
2. Sign XML with electronic certificate (firma electronica)
3. Send signed XML to SRI web service (recepcion)
   -> SRI validates structure and returns receipt
4. Query SRI web service (autorizacion) for authorization
   -> SRI returns authorized XML with authorization number + date
5. Store authorized XML (must be retained for 7 years)
6. Generate RIDE (Representacion Impresa del Documento Electronico)
   -> PDF with QR code containing Clave de Acceso
```

**SRI Web Service endpoints:**

| Environment | Reception (Recepcion) | Authorization (Autorizacion) |
|---|---|---|
| **Pruebas (Test)** | `https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl` | `https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl` |
| **Produccion** | `https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl` | `https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl` |

---

### 4.8 National Identity Documents

**Peru -- DNI (Documento Nacional de Identidad):**

| Aspect | Detail |
|---|---|
| Issuing authority | RENIEC (Registro Nacional de Identificacion y Estado Civil) |
| Format | 8 digits |
| Usage in invoicing | Required on Boletas de Venta over S/ 700 |
| Validation regex | `/^\d{8}$/` |

**Ecuador -- Cedula de Identidad:**

| Aspect | Detail |
|---|---|
| Issuing authority | Registro Civil |
| Format | 10 digits |
| Province code | First 2 digits (01-24, or 30 for foreign residents) |
| Validation | Modulo 10 check digit (last digit) |
| Validation regex | `/^\d{10}$/` |

```typescript
function validateCedulaEcuador(cedula: string): boolean {
  if (!/^\d{10}$/.test(cedula)) return false;

  const province = parseInt(cedula.substring(0, 2));
  if (province < 1 || (province > 24 && province !== 30)) return false;

  const thirdDigit = parseInt(cedula[2]);
  if (thirdDigit > 5) return false; // Natural persons: 0-5

  // Modulo 10 validation
  const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;

  for (let i = 0; i < 9; i++) {
    let product = parseInt(cedula[i]) * coefficients[i];
    if (product > 9) product -= 9;
    sum += product;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(cedula[9]);
}
```

---

## 5. Invoice Compliance

### 5.1 RUC Validation -- Peru (11 digits)

**RUC format (Peru):**
The RUC in Peru is an 11-digit number assigned by SUNAT. The first two digits indicate the type of taxpayer:

| Prefix | Taxpayer Type | Example |
|---|---|---|
| **10** | Natural person (persona natural) | 10234567891 |
| **15** | Natural person (special cases) | 15234567891 |
| **17** | Natural person (non-domiciled) | 17234567891 |
| **20** | Legal entity (sociedad) | 20123456789 |

**Validation algorithm (Peru RUC):**

```typescript
function validateRUCPeru(ruc: string): { valid: boolean; type: string; error?: string } {
  // Must be exactly 11 digits
  if (!/^\d{11}$/.test(ruc)) {
    return { valid: false, type: 'unknown', error: 'RUC must be exactly 11 digits' };
  }

  // Check valid prefix
  const prefix = ruc.substring(0, 2);
  const validPrefixes: Record<string, string> = {
    '10': 'persona_natural',
    '15': 'persona_natural_special',
    '17': 'persona_natural_non_domiciled',
    '20': 'persona_juridica',
  };

  const type = validPrefixes[prefix];
  if (!type) {
    return { valid: false, type: 'unknown', error: `Invalid RUC prefix: ${prefix}` };
  }

  // Modulo 11 check digit validation
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;

  for (let i = 0; i < 10; i++) {
    sum += parseInt(ruc[i]) * weights[i];
  }

  const remainder = sum % 11;
  const expectedCheckDigit = 11 - remainder;
  let checkDigitValue: number;

  if (expectedCheckDigit === 10) checkDigitValue = 0;
  else if (expectedCheckDigit === 11) checkDigitValue = 1;
  else checkDigitValue = expectedCheckDigit;

  const actualCheckDigit = parseInt(ruc[10]);

  if (checkDigitValue !== actualCheckDigit) {
    return { valid: false, type, error: 'Invalid check digit' };
  }

  return { valid: true, type };
}

// Usage examples:
// validateRUCPeru('20100047218')  -> { valid: true, type: 'persona_juridica' }
// validateRUCPeru('10234567891')  -> validates check digit
// validateRUCPeru('30123456789')  -> { valid: false, error: 'Invalid RUC prefix: 30' }
```

---

### 5.2 RUC Validation -- Ecuador (13 digits)

**RUC format (Ecuador):**
The RUC in Ecuador is a 13-digit number derived from the Cedula de Identidad (for natural persons) or assigned by the SRI (for legal entities). The structure varies by taxpayer type:

| Type | Third Digit | Format | Example |
|---|---|---|---|
| **Natural person** | 0-5 | Cedula (10 digits) + "001" | 1712345678001 |
| **Public entity** | 6 | Province + "6" + entity code + "0001" | 1760001230001 |
| **Private legal entity** | 9 | Province + "9" + entity code + "0001" | 1790012345001 |

**Validation algorithm (Ecuador RUC):**

```typescript
function validateRUCEcuador(ruc: string): { valid: boolean; type: string; error?: string } {
  // Must be exactly 13 digits
  if (!/^\d{13}$/.test(ruc)) {
    return { valid: false, type: 'unknown', error: 'RUC must be exactly 13 digits' };
  }

  // Must end in 001 (establishment code)
  if (!ruc.endsWith('001')) {
    return {
      valid: false,
      type: 'unknown',
      error: 'RUC must end in 001 (main establishment)',
    };
  }

  const province = parseInt(ruc.substring(0, 2));
  if (province < 1 || (province > 24 && province !== 30)) {
    return { valid: false, type: 'unknown', error: `Invalid province code: ${province}` };
  }

  const thirdDigit = parseInt(ruc[2]);

  // Natural person (third digit 0-5): validate using Cedula mod 10
  if (thirdDigit >= 0 && thirdDigit <= 5) {
    const cedulaPart = ruc.substring(0, 10);
    const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let sum = 0;

    for (let i = 0; i < 9; i++) {
      let product = parseInt(cedulaPart[i]) * coefficients[i];
      if (product > 9) product -= 9;
      sum += product;
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    if (checkDigit !== parseInt(cedulaPart[9])) {
      return { valid: false, type: 'persona_natural', error: 'Invalid check digit (mod 10)' };
    }

    return { valid: true, type: 'persona_natural' };
  }

  // Public entity (third digit 6): validate using mod 11 with specific weights
  if (thirdDigit === 6) {
    const weights = [3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;

    for (let i = 0; i < 8; i++) {
      sum += parseInt(ruc[i]) * weights[i];
    }

    const remainder = sum % 11;
    const checkDigit = remainder === 0 ? 0 : 11 - remainder;

    if (checkDigit !== parseInt(ruc[8])) {
      return { valid: false, type: 'entidad_publica', error: 'Invalid check digit (mod 11)' };
    }

    return { valid: true, type: 'entidad_publica' };
  }

  // Private legal entity (third digit 9): validate using mod 11 with specific weights
  if (thirdDigit === 9) {
    const weights = [4, 3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;

    for (let i = 0; i < 9; i++) {
      sum += parseInt(ruc[i]) * weights[i];
    }

    const remainder = sum % 11;
    const checkDigit = remainder === 0 ? 0 : 11 - remainder;

    if (checkDigit !== parseInt(ruc[9])) {
      return {
        valid: false,
        type: 'persona_juridica_privada',
        error: 'Invalid check digit (mod 11)',
      };
    }

    return { valid: true, type: 'persona_juridica_privada' };
  }

  return { valid: false, type: 'unknown', error: `Invalid third digit: ${thirdDigit}` };
}

// Usage examples:
// validateRUCEcuador('1790012345001')  -> { valid: true, type: 'persona_juridica_privada' }
// validateRUCEcuador('1712345678001')  -> validates cedula portion
// validateRUCEcuador('1760001230001')  -> validates public entity
```

**Unified RUC validator for Kitz (country-aware):**

```typescript
function validateRUC(
  ruc: string,
  country: 'PE' | 'EC' | 'PA'
): { valid: boolean; type: string; error?: string } {
  switch (country) {
    case 'PE':
      return validateRUCPeru(ruc);
    case 'EC':
      return validateRUCEcuador(ruc);
    case 'PA':
      return validateRUCPanama(ruc); // Existing Panama validator
    default:
      return { valid: false, type: 'unknown', error: `Unsupported country: ${country}` };
  }
}
```

---

### 5.3 Peru E-Invoice XML Example (UBL 2.1 Factura)

The following is a simplified example of a Peru Factura Electronica in UBL 2.1 XML format:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"
         xmlns:ds="http://www.w3.org/2000/09/xmldsig#">

  <!-- Extensions (for digital signature) -->
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent>
        <ds:Signature Id="SignatureSP">
          <!-- Digital signature content (SUNAT-issued certificate) -->
        </ds:Signature>
      </ext:ExtensionContent>
    </ext:UBLExtension>
  </ext:UBLExtensions>

  <!-- Document metadata -->
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>2.0</cbc:CustomizationID>

  <!-- Invoice identification -->
  <cbc:ID>F001-00000142</cbc:ID>
  <cbc:IssueDate>2026-02-24</cbc:IssueDate>
  <cbc:IssueTime>10:30:00</cbc:IssueTime>
  <cbc:InvoiceTypeCode listID="0101">01</cbc:InvoiceTypeCode>
  <!-- 01 = Factura -->

  <!-- Currency -->
  <cbc:DocumentCurrencyCode>PEN</cbc:DocumentCurrencyCode>

  <!-- Supplier (Emisor) -->
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="6">20123456789</cbc:ID>
        <!-- schemeID 6 = RUC -->
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>Mi Negocio S.A.C.</cbc:Name>
      </cac:PartyName>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>Mi Negocio S.A.C.</cbc:RegistrationName>
        <cac:RegistrationAddress>
          <cbc:ID>150101</cbc:ID> <!-- UBIGEO code (Lima) -->
          <cbc:AddressTypeCode>0000</cbc:AddressTypeCode>
          <cbc:CityName>Lima</cbc:CityName>
          <cac:AddressLine>
            <cbc:Line>Av. Javier Prado Este 1234, San Isidro</cbc:Line>
          </cac:AddressLine>
          <cac:Country>
            <cbc:IdentificationCode>PE</cbc:IdentificationCode>
          </cac:Country>
        </cac:RegistrationAddress>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>

  <!-- Customer (Receptor) -->
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="6">20567890123</cbc:ID>
        <!-- schemeID 6 = RUC (B2B) -->
      </cac:PartyIdentification>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>Cliente Empresa E.I.R.L.</cbc:RegistrationName>
        <cac:RegistrationAddress>
          <cac:AddressLine>
            <cbc:Line>Jr. de la Union 456, Cercado de Lima</cbc:Line>
          </cac:AddressLine>
        </cac:RegistrationAddress>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>

  <!-- Tax totals -->
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="PEN">270.00</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="PEN">1500.00</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="PEN">270.00</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID schemeID="UN/ECE 5305">S</cbc:ID>
        <!-- S = Standard rate (Gravado) -->
        <cbc:Percent>18.00</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>1000</cbc:ID> <!-- 1000 = IGV -->
          <cbc:Name>IGV</cbc:Name>
          <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>

  <!-- Invoice totals -->
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="PEN">1500.00</cbc:LineExtensionAmount>
    <cbc:TaxInclusiveAmount currencyID="PEN">1770.00</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="PEN">1770.00</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>

  <!-- Line items -->
  <cac:InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cbc:InvoicedQuantity unitCode="NIU">10</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="PEN">1500.00</cbc:LineExtensionAmount>
    <cac:PricingReference>
      <cac:AlternativeConditionPrice>
        <cbc:PriceAmount currencyID="PEN">177.00</cbc:PriceAmount>
        <!-- Unit price including IGV -->
        <cbc:PriceTypeCode>01</cbc:PriceTypeCode>
      </cac:AlternativeConditionPrice>
    </cac:PricingReference>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="PEN">270.00</cbc:TaxAmount>
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="PEN">1500.00</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="PEN">270.00</cbc:TaxAmount>
        <cac:TaxCategory>
          <cbc:ID schemeID="UN/ECE 5305">S</cbc:ID>
          <cbc:Percent>18.00</cbc:Percent>
          <cac:TaxScheme>
            <cbc:ID>1000</cbc:ID>
            <cbc:Name>IGV</cbc:Name>
            <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
          </cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>
    </cac:TaxTotal>
    <cac:Item>
      <cbc:Description>Servicio de consultoria empresarial</cbc:Description>
      <cac:SellersItemIdentification>
        <cbc:ID>SRV-001</cbc:ID>
      </cac:SellersItemIdentification>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="PEN">150.00</cbc:PriceAmount>
      <!-- Unit price excluding IGV -->
    </cac:Price>
  </cac:InvoiceLine>

</Invoice>
```

**Key UBL 2.1 notes for Peru:**
- `schemeID="6"` identifies a RUC number (SUNAT catalog 06).
- `InvoiceTypeCode listID="0101"` means the invoice sub-type is "operacion interna" (domestic).
- IGV tax scheme ID is `1000`; ISC (Impuesto Selectivo al Consumo) is `2000`.
- UBIGEO codes identify geographic locations (6-digit code per district).
- `unitCode="NIU"` is the UN/ECE unit code for "unit" (pieza); other common codes: `ZZ` (service), `KGM` (kilogram).
- The hash of the XML is used to generate the QR code on the printed representation.

---

### 5.4 Ecuador E-Invoice XML Example (SRI Factura)

The following is a simplified example of an Ecuador Factura Electronica in SRI XML format:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<factura id="comprobante" version="1.1.0">

  <!-- Tax information header -->
  <infoTributaria>
    <ambiente>2</ambiente>                    <!-- 1=pruebas, 2=produccion -->
    <tipoEmision>1</tipoEmision>             <!-- 1=normal -->
    <razonSocial>Mi Negocio Ecuador S.A.</razonSocial>
    <nombreComercial>Mi Negocio</nombreComercial>
    <ruc>1790012345001</ruc>
    <claveAcceso>2402202601179001234500120010010000000011234567817</claveAcceso>
    <codDoc>01</codDoc>                       <!-- 01=factura -->
    <estab>001</estab>                        <!-- Establecimiento -->
    <ptoEmi>001</ptoEmi>                      <!-- Punto de emision -->
    <secuencial>000000001</secuencial>
    <dirMatriz>Av. Amazonas N36-152, Quito</dirMatriz>
  </infoTributaria>

  <!-- Invoice-specific information -->
  <infoFactura>
    <fechaEmision>24/02/2026</fechaEmision>   <!-- DD/MM/YYYY format -->
    <dirEstablecimiento>Av. Amazonas N36-152, Quito</dirEstablecimiento>
    <obligadoContabilidad>SI</obligadoContabilidad>
    <tipoIdentificacionComprador>04</tipoIdentificacionComprador>
    <!-- 04=RUC, 05=cedula, 06=pasaporte, 07=consumidor final -->
    <razonSocialComprador>Cliente Ecuador S.A.</razonSocialComprador>
    <identificacionComprador>1792345678001</identificacionComprador>
    <totalSinImpuestos>500.00</totalSinImpuestos>
    <totalDescuento>0.00</totalDescuento>

    <!-- Tax totals -->
    <totalConImpuestos>
      <totalImpuesto>
        <codigo>2</codigo>            <!-- 2 = IVA -->
        <codigoPorcentaje>4</codigoPorcentaje>  <!-- 4 = 15% -->
        <baseImponible>500.00</baseImponible>
        <valor>75.00</valor>
      </totalImpuesto>
    </totalConImpuestos>

    <propina>0.00</propina>
    <importeTotal>575.00</importeTotal>
    <moneda>DOLAR</moneda>

    <!-- Payment methods -->
    <pagos>
      <pago>
        <formaPago>20</formaPago>     <!-- 20 = otros con utilizacion del sistema financiero -->
        <total>575.00</total>
        <plazo>30</plazo>
        <unidadTiempo>dias</unidadTiempo>
      </pago>
    </pagos>
  </infoFactura>

  <!-- Line items (detalles) -->
  <detalles>
    <detalle>
      <codigoPrincipal>SRV-001</codigoPrincipal>
      <descripcion>Servicio de consultoria empresarial</descripcion>
      <cantidad>10.00</cantidad>
      <precioUnitario>50.00</precioUnitario>
      <descuento>0.00</descuento>
      <precioTotalSinImpuesto>500.00</precioTotalSinImpuesto>
      <impuestos>
        <impuesto>
          <codigo>2</codigo>          <!-- 2 = IVA -->
          <codigoPorcentaje>4</codigoPorcentaje>  <!-- 4 = 15% -->
          <tarifa>15.00</tarifa>
          <baseImponible>500.00</baseImponible>
          <valor>75.00</valor>
        </impuesto>
      </impuestos>
    </detalle>
  </detalles>

  <!-- Additional information -->
  <infoAdicional>
    <campoAdicional nombre="Email">cliente@empresa.com</campoAdicional>
    <campoAdicional nombre="Telefono">+593 2 234 5678</campoAdicional>
    <campoAdicional nombre="Direccion">Av. 6 de Diciembre N34-120, Quito</campoAdicional>
  </infoAdicional>

</factura>
```

**Key SRI XML notes for Ecuador:**
- IVA `codigoPorcentaje` values: `0` = 0%, `2` = 12% (old rate, may still appear), `3` = 14% (temporary), `4` = 15% (current standard), `5` = 5% (reduced).
- Payment method codes (`formaPago`): `01` = sin utilizacion del sistema financiero, `15` = compensacion de deudas, `16` = tarjeta de debito, `17` = dinero electronico, `18` = tarjeta prepago, `19` = tarjeta de credito, `20` = otros con sistema financiero.
- Dates use DD/MM/YYYY format (different from Peru's YYYY-MM-DD in UBL).
- The XML must be signed with an electronic certificate before SRI submission.
- `obligadoContabilidad` indicates whether the business is required to keep formal accounting books.

---

### 5.5 Invoice Numbering Rules

**Peru:**

| Component | Format | Example |
|---|---|---|
| Series (Factura) | F + 3 digits | F001 |
| Series (Boleta) | B + 3 digits | B001 |
| Sequential number | Up to 8 digits | 00000142 |
| Full invoice number | Series + "-" + Sequential | F001-00000142 |
| Per-branch | Each branch/POS gets its own series | F001 (HQ), F002 (Branch 2) |

**Ecuador:**

| Component | Format | Example |
|---|---|---|
| Establecimiento | 3 digits | 001 |
| Punto de emision | 3 digits | 001 |
| Secuencial | 9 digits | 000000001 |
| Full invoice number | Est-PtoEmi-Sec | 001-001-000000001 |
| Per-branch | Each branch gets its own establecimiento code | 001 (HQ), 002 (Branch 2) |

---

### 5.6 Digital Signature Requirements

**Peru:**
- Certificate issuer: SUNAT-approved certification authorities (RENIEC, etc.)
- Certificate type: X.509 v3 digital certificate
- Signature format: XMLDSig (enveloped signature within the UBL XML)
- Certificate must be associated with the taxpayer's RUC
- Certificates are typically valid for 2-3 years and must be renewed

**Ecuador:**
- Certificate issuer: BCE (Banco Central del Ecuador) or approved providers (Security Data, ANF Ecuador, UANATACA)
- Certificate type: PKCS#12 (.p12 file) containing X.509 certificate and private key
- Signature format: XAdES-BES (XML Advanced Electronic Signatures)
- Certificate types: Token (USB hardware), file (.p12), or cloud-based
- Cost: ~$25-50 USD for a file certificate (valid 2 years)
- Kitz recommendation: Use file-based (.p12) certificates for ease of integration

```typescript
// Simplified signing flow for Ecuador
import { SignedXml } from 'xml-crypto';
import * as forge from 'node-forge';

async function signEcuadorInvoice(
  xmlString: string,
  p12Buffer: Buffer,
  p12Password: string
): Promise<string> {
  // Extract certificate and key from PKCS#12
  const p12Asn1 = forge.asn1.fromDer(forge.util.createBuffer(p12Buffer));
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, p12Password);

  // Get private key and certificate
  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });

  const privateKey = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]![0].key!;
  const certificate = certBags[forge.pki.oids.certBag]![0].cert!;

  // Sign the XML using XAdES-BES
  // (In production, use a proper XAdES library like xadesjs)
  const sig = new SignedXml();
  sig.signingKey = forge.pki.privateKeyToPem(privateKey);
  sig.addReference(
    "//*[local-name(.)='comprobante']",
    ['http://www.w3.org/2000/09/xmldsig#enveloped-signature'],
    'http://www.w3.org/2001/04/xmlenc#sha256'
  );
  sig.computeSignature(xmlString);

  return sig.getSignedXml();
}
```

---

## 6. Payment Flow Architecture

### 6.1 Peru End-to-End Payment Flow

```
                         PERU PAYMENT FLOW
                         ==================

  Kitz Workspace Owner (Peru)              Customer
        |                                    |
        |  Creates invoice (invoice_create)  |
        |  with line items + IGV (18%)       |
        |  Series: F001/B001                 |
        |                                    |
        v                                    |
  +-----------+                              |
  | UBL 2.1   | -- Via OSE provider -------> | SUNAT validates
  | XML       |    (Nubefact/Facturalo)      | CDR returned
  | Generated |                              |
  +-----------+                              |
        |                                    |
        |  QR code generated (hash-based)    |
        |  Invoice sent via WhatsApp/Email   |
        |                                    |
        v                                    v
  +-----------+                        +-----------+
  | Payment   | <-- Customer chooses   | Customer  |
  | Options   |     payment method --> | Selects   |
  +-----------+                        +-----------+
        |                                    |
        +---------- Yape QR -----------+     |
        |                              |     |
        +---------- Plin QR -----------+     |
        |                              |     |
        +------ PagoEfectivo CIP ------+     |
        |                              |     |
        +------- Culqi (cards) --------+     |
        |                              |     |
        +--- Bank Transfer (CCI) ------+     |
        |                              v     |
        |                        +-----------+
        |                        | Payment   |
        |                        | Processed |
        |                        +-----------+
        |                              |     |
        v                              v     |
  +-----------+                +-----------+  |
  | Webhook / | <-- Provider   | Provider  |  |
  | Callback  |    confirms    | Confirms  |  |
  +-----------+                +-----------+  |
        |                                    |
        v                                    |
  +---------------------+                   |
  | payments_process    |                   |
  | Webhook             |                   |
  | (paymentTools.ts)   |                   |
  +---------------------+                   |
        |                                    |
        +-- Invoice status -> 'paid'         |
        +-- CRM contact updated              |
        +-- WhatsApp receipt sent ---------->|
        +-- Revenue dashboard updated        |
        +-- IGV ledger updated               |
        +-- Detraccion check (if applicable) |
```

### 6.2 Ecuador End-to-End Payment Flow

```
                        ECUADOR PAYMENT FLOW
                        ====================

  Kitz Workspace Owner (Ecuador)           Customer
        |                                    |
        |  Creates invoice (invoice_create)  |
        |  with line items + IVA (15%)       |
        |  Number: 001-001-000000001         |
        |                                    |
        v                                    |
  +-----------+                              |
  | SRI XML   | -- Direct to SRI --------->  | SRI authorizes
  | Generated |    web services              | Clave de Acceso
  | + Signed  |    (recepcion + autorizacion)| assigned
  +-----------+                              |
        |                                    |
        |  RIDE (PDF) generated with QR      |
        |  Sent via WhatsApp/Email           |
        |                                    |
        v                                    v
  +-----------+                        +-----------+
  | Payment   | <-- Customer chooses   | Customer  |
  | Options   |     payment method --> | Selects   |
  +-----------+                        +-----------+
        |                                    |
        +------- Payphone QR ----------+     |
        |                              |     |
        +------- De Una QR ------------+     |
        |                              |     |
        +------- Kushki (cards) -------+     |
        |                              |     |
        +--- Datafast (POS/cards) -----+     |
        |                              |     |
        +--- Bank Transfer (SPI) ------+     |
        |                              v     |
        |                        +-----------+
        |                        | Payment   |
        |                        | Processed |
        |                        | (in USD!) |
        |                        +-----------+
        |                              |     |
        v                              v     |
  +-----------+                +-----------+  |
  | Webhook / | <-- Provider   | Provider  |  |
  | Callback  |    confirms    | Confirms  |  |
  +-----------+                +-----------+  |
        |                                    |
        v                                    |
  +---------------------+                   |
  | payments_process    |                   |
  | Webhook             |                   |
  | (paymentTools.ts)   |                   |
  +---------------------+                   |
        |                                    |
        +-- Invoice status -> 'paid'         |
        +-- CRM contact updated              |
        +-- WhatsApp receipt sent ---------->|
        +-- Revenue dashboard (USD)          |
        +-- IVA ledger updated               |
        +-- No FX conversion needed (USD!)   |
```

### 6.3 Yape Integration Pattern (Peru -- Detailed)

```
                      YAPE PAYMENT FLOW (DETAILED)
                      ============================

  Kitz Backend                    Yape System                Customer Yape App
       |                              |                            |
       | 1. Generate QR payload       |                            |
       |   (amount, reference,        |                            |
       |    merchant ID)              |                            |
       |----------------------------->|                            |
       |                              |                            |
       | 2. QR code / deep link       |                            |
       |<-----------------------------|                            |
       |                              |                            |
       | 3. Display QR on invoice     |                            |
       |   or send via WhatsApp       |                            |
       |                              |                            |
       |                              |   4. Customer scans QR     |
       |                              |<---------------------------|
       |                              |                            |
       |                              |   5. Show payment details  |
       |                              |   (amount, merchant name)  |
       |                              |--------------------------->|
       |                              |                            |
       |                              |   6. Customer confirms     |
       |                              |   (PIN / biometric)        |
       |                              |<---------------------------|
       |                              |                            |
       |                              | 7. Process payment         |
       |                              |   (debit payer, credit     |
       |                              |    merchant)               |
       |                              |                            |
       | 8. Payment confirmation      |                            |
       |   callback / webhook         |                            |
       |<-----------------------------|                            |
       |                              |   9. Push notification     |
       |                              |   "Payment successful"     |
       |                              |--------------------------->|
       |                              |                            |
       | 10. Update Kitz:             |                            |
       |   - Invoice -> paid          |                            |
       |   - CRM -> payment logged    |                            |
       |   - WhatsApp receipt sent    |                            |
       |   - IGV ledger updated       |                            |
       |                              |                            |
```

### 6.4 Multi-Provider Strategy Summary

**Peru:**
```
Priority 1 (P0):  Yape           -- ~60% of digital payments
Priority 2 (P1):  Plin           -- ~20% (via interoperable QR)
Priority 3 (P1):  Culqi          -- Unified gateway (cards + alternatives)
Priority 4 (P1):  PagoEfectivo   -- Cash/unbanked segment
Priority 5 (P2):  Niubiz         -- Direct card acquiring (if needed)
Priority 6 (P3):  Mercado Pago   -- E-commerce fallback
```

**Ecuador:**
```
Priority 1 (P0):  Payphone       -- Leading QR payment platform
Priority 2 (P1):  Kushki         -- Unified gateway (cards + alternatives)
Priority 3 (P1):  De Una         -- Banco Pichincha wallet
Priority 4 (P2):  Datafast       -- Direct card acquiring
Priority 5 (P2):  Bimo           -- Banco del Pacifico wallet
Priority 6 (P3):  Nuvei          -- E-commerce fallback
```

### 6.5 Provider Enum Extension for paymentTools.ts

```typescript
// Current enum in paymentTools.ts:
// provider: { type: 'string', enum: ['stripe', 'paypal', 'yappy', 'bac'] }

// Extended enum for multi-country support:
provider: {
  type: 'string',
  enum: [
    // Panama
    'yappy', 'bac',
    // Peru
    'yape', 'plin', 'culqi', 'pagoefectivo', 'niubiz', 'izipay', 'mercadopago_pe',
    // Ecuador
    'payphone', 'kushki', 'deuna', 'datafast', 'bimo', 'nuvei',
    // International
    'stripe', 'paypal',
  ],
  description: 'Payment provider identifier',
}
```

---

## 7. Currency & Localization

### 7.1 Currency

**Peru:**

| Aspect | Detail |
|---|---|
| Official currency | Sol (PEN) |
| Symbol | S/ |
| ISO code | PEN |
| Subunit | Centimo (1 Sol = 100 centimos) |
| Display format | S/ 1,234.56 |
| Thousands separator | Comma (`,`) |
| Decimal separator | Period (`.`) |
| Exchange rate (approx.) | ~S/ 3.70 per USD (fluctuates) |
| Kitz implication | Multi-currency support required; cannot reuse USD logic directly |

**Ecuador:**

| Aspect | Detail |
|---|---|
| Official currency | US Dollar (USD) -- dollarized since 2000 |
| Symbol | $ |
| ISO code | USD |
| Subunit | Cent (1 Dollar = 100 cents) |
| Display format | $1,234.56 |
| Thousands separator | Comma (`,`) or period (`.`) depending on context |
| Decimal separator | Period (`.`) or comma (`,`) depending on context |
| Exchange rate | N/A -- Ecuador IS USD |
| Kitz implication | **Same as Panama** -- no FX conversion, same currency code, same formatting |

**Strategic note on Ecuador's dollarization:**
Ecuador adopted the US Dollar as its official currency in 2000. There is no Ecuadorian central bank monetary policy -- the country imports its monetary policy from the US Federal Reserve. This means:
- Kitz's existing USD infrastructure from Panama works in Ecuador with zero modification.
- Invoice amounts, payment processing, settlement, and reporting are all in USD.
- No exchange rate risk, no FX conversion fees, no currency hedging needed.
- The `currency: args.currency || 'USD'` default in `paymentTools.ts` works for both Panama and Ecuador.
- Ecuador is the easiest expansion market from a currency perspective.

**Multi-currency support for Peru:**

```typescript
interface CurrencyConfig {
  code: string;        // ISO 4217
  symbol: string;
  symbolPosition: 'prefix' | 'suffix';
  decimalSeparator: string;
  thousandsSeparator: string;
  decimalPlaces: number;
}

const CURRENCY_CONFIGS: Record<string, CurrencyConfig> = {
  USD: {
    code: 'USD',
    symbol: '$',
    symbolPosition: 'prefix',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    decimalPlaces: 2,
  },
  PAB: {
    code: 'PAB',
    symbol: 'B/.',
    symbolPosition: 'prefix',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    decimalPlaces: 2,
  },
  PEN: {
    code: 'PEN',
    symbol: 'S/',
    symbolPosition: 'prefix',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    decimalPlaces: 2,
  },
};

function formatCurrency(amount: number, currencyCode: string): string {
  const config = CURRENCY_CONFIGS[currencyCode];
  if (!config) throw new Error(`Unsupported currency: ${currencyCode}`);

  const formatted = amount
    .toFixed(config.decimalPlaces)
    .replace('.', config.decimalSeparator)
    .replace(/\B(?=(\d{3})+(?!\d))/g, config.thousandsSeparator);

  return config.symbolPosition === 'prefix'
    ? `${config.symbol} ${formatted}`
    : `${formatted} ${config.symbol}`;
}

// formatCurrency(1234.56, 'PEN')  -> "S/ 1,234.56"
// formatCurrency(1234.56, 'USD')  -> "$ 1,234.56"
// formatCurrency(1234.56, 'PAB')  -> "B/. 1,234.56"
```

### 7.2 Date Formats

| Context | Peru | Ecuador |
|---|---|---|
| User-facing display | DD/MM/YYYY | DD/MM/YYYY |
| E-invoice XML | YYYY-MM-DD (UBL 2.1) | DD/MM/YYYY (SRI XML) |
| Internal storage (ISO 8601) | YYYY-MM-DDTHH:mm:ssZ | YYYY-MM-DDTHH:mm:ssZ |
| Locale code | `es-PE` | `es-EC` |

**Important difference:** Peru's UBL 2.1 uses `YYYY-MM-DD` in XML (ISO standard), while Ecuador's SRI XML uses `DD/MM/YYYY`. Kitz must handle this format difference in the XML generation layer.

### 7.3 Phone Numbers

**Peru:**

| Aspect | Detail |
|---|---|
| Country code | +51 |
| Mobile format | +51 9XX XXX XXX (9 digits, starts with 9) |
| Landline (Lima) | +51 1 XXX XXXX (7 digits, area code 1) |
| Landline (other) | +51 XX XXX XXX (varies by region) |
| WhatsApp format | 51XXXXXXXXX (no + or spaces) |

**Ecuador:**

| Aspect | Detail |
|---|---|
| Country code | +593 |
| Mobile format | +593 9X XXX XXXX (8 digits after 9) |
| Landline (Quito) | +593 2 XXX XXXX (7 digits, area code 2) |
| Landline (Guayaquil) | +593 4 XXX XXXX (7 digits, area code 4) |
| WhatsApp format | 593XXXXXXXXX (no + or spaces) |

**Validation:**

```typescript
// Peru mobile
const PERU_MOBILE = /^\+?51\s?9\d{2}\s?\d{3}\s?\d{3}$/;

// Peru landline (Lima)
const PERU_LANDLINE_LIMA = /^\+?51\s?1\s?\d{3}\s?\d{4}$/;

// Ecuador mobile
const ECUADOR_MOBILE = /^\+?593\s?9\d\s?\d{3}\s?\d{4}$/;

// Ecuador landline (Quito)
const ECUADOR_LANDLINE_QUITO = /^\+?593\s?2\s?\d{3}\s?\d{4}$/;

// Country-aware WhatsApp formatter
function toWhatsAppFormat(phone: string, country: 'PE' | 'EC' | 'PA'): string {
  const digits = phone.replace(/[\s\-\+\(\)]/g, '');

  // Ensure country code prefix
  const prefixes: Record<string, string> = { PE: '51', EC: '593', PA: '507' };
  const prefix = prefixes[country];

  if (!digits.startsWith(prefix)) {
    return prefix + digits;
  }
  return digits;
}

// toWhatsAppFormat('9 123 45678', 'PE')    -> '51912345678'
// toWhatsAppFormat('+593 99 123 4567', 'EC') -> '593991234567'
```

### 7.4 Address Formats

**Peru:**
Peru uses a more structured address system than Panama, with formal street names, numbers, districts, provinces, and departments. The UBIGEO code (6 digits) identifies the geographic location at the district level.

```
{Tipo Via} {Nombre Via} {Numero}, {Interior/Piso}
{Urbanizacion/Zona}
{Distrito}, {Provincia}
{Departamento}, Peru

Example:
Av. Javier Prado Este 1234, Of. 501
San Isidro, Lima
Lima, Peru
UBIGEO: 150131
```

**Ecuador:**
Ecuador uses a descriptive address system with street intersections as the primary reference.

```
{Calle Principal} {Numero} y {Calle Secundaria}
{Edificio/Piso} (optional)
{Parroquia}, {Canton}
{Provincia}, Ecuador

Example:
Av. Amazonas N36-152 y Naciones Unidas
Edificio Banco de los Andes, Piso 8
Inaquito, Quito
Pichincha, Ecuador
```

### 7.5 Language

- Both Peru and Ecuador use Spanish (Latin American variant).
- Peru uses `es-PE` locale; Ecuador uses `es-EC` locale.
- Regional vocabulary differences to note:
  - "Boleta" is exclusively Peruvian (B2C receipt) -- Ecuador does not use this term.
  - "RISE" and "Nota de Venta" are exclusively Ecuadorian.
  - "Detraccion" is a Peru-specific tax concept.
  - Currency references: "soles" (Peru), "dolares" (Ecuador, Panama).
- Invoice templates must use country-specific tax terminology (IGV vs. IVA, SUNAT vs. SRI).

---

## 8. Competitive Landscape

### 8.1 Peru Competitors

| Competitor | Strengths | Weaknesses | Kitz Differentiator |
|---|---|---|---|
| **Alegra** | Strong LatAm presence, SUNAT e-invoicing compliance, cloud-based, affordable | Generic LatAm approach -- not Peru-optimized; no AI features; limited WhatsApp integration | Kitz is AI-native, WhatsApp-first, built for Peruvian SMBs |
| **Nubefact** | Peru's leading e-invoicing platform, OSE certified, excellent SUNAT integration | Primarily an e-invoicing tool -- no CRM, no payments, no content creation | Kitz is a full business OS; Nubefact is a potential OSE partner |
| **Facturalo** | Peru-native e-invoicing, open-source option, OSE certified | Narrowly focused on invoicing; limited UX; no AI or WhatsApp | Kitz offers the complete stack; Facturalo is a potential OSE partner |
| **Siigo Peru** | Enterprise-grade accounting, acquired multiple LatAm tools | Heavy, expensive, enterprise-oriented; not suited for micro/small businesses | Kitz is lightweight, mobile-first, micro-business friendly |
| **Contasis** | Peru-native accounting software, strong with accountants | Desktop-oriented, legacy UI, limited cloud features | Kitz is cloud-native, AI-powered, modern UX |
| **Bsale** | POS and e-invoicing for retail, Chile-origin expanding to Peru | Retail-focused, less suited for service businesses; no AI | Kitz serves both retail and service SMBs with AI assistance |
| **Wally POS** | Peru-native POS system, restaurant/retail focus | Vertical-specific (hospitality/retail); no CRM or AI | Kitz is horizontal -- serves all SMB verticals |

### 8.2 Ecuador Competitors

| Competitor | Strengths | Weaknesses | Kitz Differentiator |
|---|---|---|---|
| **Alegra** | Strong in Ecuador, SRI e-invoicing compliance, affordable | Generic LatAm -- not Ecuador-first; no AI; limited WhatsApp | Kitz is AI-native, WhatsApp-first, USD-native (like Ecuador) |
| **Datil** | Ecuador-native e-invoicing platform, excellent SRI integration, developer-friendly API | Primarily e-invoicing -- no CRM, limited payment features, no AI | Kitz is a full business OS; Datil is a potential e-invoicing partner |
| **SRI Free Tool** | Free, government-provided e-invoicing tool on SRI website | Manual process, no automation, no CRM, no payments, painful UX | Kitz automates everything the SRI tool forces users to do manually |
| **Monica** | Ecuador-native accounting software, long history | Legacy desktop software, outdated UX, limited cloud features | Kitz is cloud-native, AI-powered, mobile-first |
| **Contifico** | Ecuador cloud accounting, SRI compliance, growing user base | Limited CRM, no AI features, no WhatsApp-native experience | Kitz offers AI + WhatsApp + CRM + invoicing in one platform |
| **Bind ERP** | Cloud ERP for SMBs, inventory management | More complex than needed for micro businesses; Mexico-origin | Kitz is simpler, AI-assisted, built for LatAm micro businesses |

### 8.3 Cross-Market Competitive Advantages for Kitz

1. **AI-native operating system:** No competitor in Peru or Ecuador offers AI-powered content creation, customer communication, and business automation integrated into the invoicing and CRM workflow.

2. **WhatsApp-first architecture:** WhatsApp is the primary business communication channel in both Peru (~90% smartphone penetration) and Ecuador. Kitz treats it as a core channel. Competitors bolt it on as an afterthought.

3. **Multi-country from day one:** Kitz's architecture supports Panama, Peru, and Ecuador with country-specific tax logic (ITBMS/IGV/IVA), e-invoicing formats (DGI XML/UBL 2.1/SRI XML), and payment providers. Competitors like Nubefact (Peru-only) and Datil (Ecuador-only) are single-market.

4. **USD advantage in Ecuador:** Kitz's Panama-first USD infrastructure extends to Ecuador with zero currency adaptation. This reduces engineering effort and ensures a seamless experience for Ecuadorian businesses.

5. **Unified RUC handling:** Kitz supports RUC validation for all three countries (Panama, Peru, Ecuador) -- despite the same acronym meaning different formats in each country. This is a subtle but important compliance advantage.

6. **SMB-appropriate pricing:** Designed for micro/small business budgets across all three markets, unlike enterprise-oriented competitors (Siigo, Bind ERP).

---

## 9. Implementation Roadmap

### Phase 1: Foundation (Q2 2026 -- Peru & Ecuador prep)

| Priority | Task | Country | Owner | Status |
|---|---|---|---|---|
| P0 | Multi-currency support (PEN for Peru, USD for Ecuador) | Both | Engineering | Not started |
| P0 | Country-aware RUC validation (11-digit Peru, 13-digit Ecuador) | Both | Engineering | Not started |
| P0 | IGV calculation engine (18%, exempt, unaffected categories) | Peru | Engineering | Not started |
| P0 | IVA calculation engine (15%, 5%, 0%, no-objeto categories) | Ecuador | Engineering | Not started |
| P0 | Tax regime capture during workspace onboarding (MYPE/RUS/RER/General for Peru; General/RISE for Ecuador) | Both | Engineering | Not started |
| P1 | OSE provider selection and API partnership (Nubefact or Facturalo) | Peru | Product + Legal | Not started |
| P1 | SRI electronic certificate integration (firma electronica) | Ecuador | Engineering | Not started |
| P1 | UBL 2.1 XML generation for Peru Factura/Boleta | Peru | Engineering | Not started |
| P1 | SRI XML generation for Ecuador Factura | Ecuador | Engineering | Not started |
| P1 | Clave de Acceso generation (49-digit) with mod 11 | Ecuador | Engineering | Not started |
| P2 | DNI validation (Peru, 8 digits) | Peru | Engineering | Not started |
| P2 | Cedula validation (Ecuador, 10 digits, mod 10) | Ecuador | Engineering | Not started |

### Phase 2: Payment Integration (Q3 2026)

| Priority | Task | Country | Owner | Status |
|---|---|---|---|---|
| P0 | Yape merchant QR integration (sandbox) | Peru | Engineering | Blocked by Phase 1 |
| P0 | Payphone QR integration (sandbox) | Ecuador | Engineering | Blocked by Phase 1 |
| P0 | E-invoice submission via OSE (Peru) | Peru | Engineering | Blocked by OSE partnership |
| P0 | E-invoice submission to SRI web services (Ecuador) | Ecuador | Engineering | Blocked by Phase 1 |
| P1 | Culqi unified gateway integration (cards + Yape + PagoEfectivo) | Peru | Engineering | Not started |
| P1 | Kushki unified gateway integration (cards + bank transfers) | Ecuador | Engineering | Not started |
| P1 | PagoEfectivo CIP generation for cash payments | Peru | Engineering | Not started |
| P1 | Plin interoperable QR support | Peru | Engineering | Not started |
| P1 | paymentTools.ts provider enum extension (yape, plin, culqi, etc.) | Both | Engineering | Not started |
| P2 | De Una (Banco Pichincha) wallet integration | Ecuador | Engineering | Not started |
| P2 | Invoice-to-payment linking (auto-mark paid on webhook) | Both | Engineering | Not started |
| P2 | WhatsApp receipt automation (country-specific templates) | Both | Engineering | Not started |

### Phase 3: Compliance & Growth (Q4 2026)

| Priority | Task | Country | Owner | Status |
|---|---|---|---|---|
| P0 | Yape production integration | Peru | Engineering | Blocked by Phase 2 |
| P0 | Payphone production integration | Ecuador | Engineering | Blocked by Phase 2 |
| P1 | Detraccion/percepcion/retencion calculation and tracking | Peru | Engineering | Not started |
| P1 | Nota de Credito / Nota de Debito support (both countries) | Both | Engineering | Not started |
| P1 | Monthly IGV pre-filing report (PDT preparation) | Peru | Engineering | Not started |
| P1 | Monthly IVA pre-filing report (SRI preparation) | Ecuador | Engineering | Not started |
| P1 | Libros Electronicos (PLE) generation for SUNAT | Peru | Engineering | Not started |
| P2 | Niubiz direct card acquiring integration | Peru | Engineering | Not started |
| P2 | Datafast direct card acquiring integration | Ecuador | Engineering | Not started |
| P2 | Guia de Remision (transport guide) support | Both | Engineering | Not started |
| P2 | Multi-branch support (multiple series/establecimiento) | Both | Engineering | Not started |

### Phase 4: Optimization & Scale (2027+)

| Priority | Task | Country | Owner | Status |
|---|---|---|---|---|
| P1 | Recurring payment support (Culqi/Kushki card-on-file) | Both | Engineering | Not started |
| P2 | Bank feed import for automated reconciliation | Both | Engineering | Not started |
| P2 | SUNARP (Peru business registry) integration for onboarding | Peru | Engineering | Not started |
| P2 | Superintendencia de Companias (Ecuador registry) integration | Ecuador | Engineering | Not started |
| P2 | Comprobante de Retencion electronic generation | Both | Engineering | Not started |
| P3 | BanEcuador / Mi Banco microfinance partnership integration | Both | Business Dev | Not started |
| P3 | Open Banking exploration (Peru/Ecuador) | Both | Engineering | Not started |
| P3 | Become an OSE (Peru) -- if volume justifies | Peru | Legal + Eng | Not started |

---

## 10. Compliance Checklist for Launch

### 10.1 Peru Launch Checklist

#### Legal & Regulatory

- [ ] Legal assessment: Peru fintech licensing requirements (SBS -- Superintendencia de Banca y Seguros)
- [ ] Privacy policy updated for Peru's Ley de Proteccion de Datos Personales (Ley 29733)
- [ ] Terms of service reviewed by Peruvian attorney
- [ ] AML/KYC policy compliant with SBS and UIF (Unidad de Inteligencia Financiera) requirements
- [ ] OSE partnership agreement signed (Nubefact or Facturalo)
- [ ] Digital certificate procurement process documented for workspace owners

#### Tax Compliance

- [ ] IGV calculation supports: 18% (gravado), 0% (exportacion), exempt (exonerado), unaffected (inafecto)
- [ ] Tax regime enforcement: NRUS (boleta only), RER, MYPE Tributario, General
- [ ] Invoice series numbering: F001 (factura), B001 (boleta) -- sequential, per-workspace, gap-free
- [ ] RUC validation implemented (11-digit, mod 11 check digit)
- [ ] DNI validation implemented (8-digit) for B2C boletas
- [ ] Detraccion detection and calculation for applicable transactions
- [ ] UBL 2.1 XML generation follows SUNAT specifications
- [ ] Digital signature integration functional (XML-DSig)
- [ ] QR code generation on printed invoice representation (hash-based)

#### Payment Processing

- [ ] Yape Negocios merchant account active (for Kitz platform)
- [ ] Yape QR payment flow tested end-to-end
- [ ] Culqi or PagoEfectivo integration tested
- [ ] Payment-to-invoice linking functional
- [ ] Transaction data retention policy (5+ years) implemented
- [ ] Payment reconciliation reports available in PEN

#### User Experience

- [ ] Workspace onboarding captures: business name, RUC, tax regime, UBIGEO
- [ ] Currency displayed as S/ (PEN) with correct formatting
- [ ] Dates displayed as DD/MM/YYYY in UI, YYYY-MM-DD in UBL XML
- [ ] Phone numbers validated for Peru format (+51 9XX XXX XXX)
- [ ] All UI text in Spanish (es-PE variant)
- [ ] Invoice templates use SUNAT-compliant terminology and layout

---

### 10.2 Ecuador Launch Checklist

#### Legal & Regulatory

- [ ] Legal assessment: Ecuador fintech regulations (Superintendencia de Bancos, Junta de Politica y Regulacion Monetaria y Financiera)
- [ ] Privacy policy updated for Ecuador's Ley Organica de Proteccion de Datos Personales
- [ ] Terms of service reviewed by Ecuadorian attorney
- [ ] AML/KYC policy compliant with UAFE (Unidad de Analisis Financiero y Economico) requirements
- [ ] Electronic certificate (.p12) procurement documented (BCE or Security Data)

#### Tax Compliance

- [ ] IVA calculation supports: 15% (standard), 5% (reduced), 0% (basic goods), no-objeto (exempt)
- [ ] Tax regime enforcement: General (IVA + income tax) vs. RISE (fixed monthly quota, no IVA)
- [ ] Invoice numbering: 001-001-000000001 format -- sequential, per-workspace, per-branch
- [ ] RUC validation implemented (13-digit, with cedula/public/private entity sub-validation)
- [ ] Cedula validation implemented (10-digit, mod 10 check digit)
- [ ] Clave de Acceso generation (49-digit with mod 11 check digit)
- [ ] SRI XML generation follows current schema (v1.1.0)
- [ ] XAdES-BES digital signature integration functional
- [ ] RIDE (PDF) generation with QR code containing Clave de Acceso

#### E-Invoice Submission

- [ ] SRI test environment (ambiente=1) integration tested end-to-end
- [ ] SRI production environment (ambiente=2) integration tested
- [ ] Recepcion web service call functional (submit signed XML)
- [ ] Autorizacion web service call functional (retrieve authorization)
- [ ] Authorized XML storage with 7-year retention
- [ ] Error handling for SRI rejections (devuelta) and partial authorizations

#### Payment Processing

- [ ] Payphone merchant account active
- [ ] Payphone QR payment flow tested end-to-end
- [ ] Kushki or alternative gateway integration tested
- [ ] Payment-to-invoice linking functional
- [ ] All payment processing in USD (same as Panama!)
- [ ] Transaction data retention policy implemented

#### User Experience

- [ ] Workspace onboarding captures: business name, RUC, tax regime, obligado a contabilidad status
- [ ] Currency displayed as $ (USD) -- same as Panama
- [ ] Dates displayed as DD/MM/YYYY in both UI and SRI XML
- [ ] Phone numbers validated for Ecuador format (+593 9X XXX XXXX)
- [ ] All UI text in Spanish (es-EC variant)
- [ ] Invoice templates use SRI-compliant terminology and layout

---

## 11. Partnership Opportunities

### 11.1 Peru Strategic Partnerships

| Partner | Type | Value to Kitz | Approach |
|---|---|---|---|
| **BCP (Banco de Credito del Peru)** | Payment infrastructure | Yape integration, largest bank, merchant QR services | Developer program, Yape Negocios partnership |
| **Nubefact** | E-invoicing (OSE) | SUNAT-compliant invoice generation, OSE certification | API integration partnership |
| **Facturalo** | E-invoicing (OSE) | Alternative OSE, open-source roots, developer-friendly | API integration partnership |
| **Culqi** | Payment gateway | Unified payment API (cards + Yape + PagoEfectivo) | Direct integration partnership |
| **PagoEfectivo** | Cash payments | Reach unbanked/cash-preferring customers | API integration partnership |
| **COFIDE** | Development finance | Government development bank, SMB programs, financing | Co-branded digitization program |
| **Produce (Ministry of Production)** | Government | MYPE registry, SMB development programs | Kitz as recommended digital tool |
| **CamaraLima** | Business association | Chamber of Commerce, 15,000+ member businesses | Member benefit, referral program |

### 11.2 Ecuador Strategic Partnerships

| Partner | Type | Value to Kitz | Approach |
|---|---|---|---|
| **Banco Pichincha** | Payment infrastructure | De Una wallet, largest bank, merchant services | Developer program, De Una integration |
| **Datil** | E-invoicing | Ecuador-native, excellent SRI integration, developer-friendly API | API integration (use Datil as e-invoicing backend) |
| **Payphone** | Payment platform | Leading QR payment platform, growing merchant base | Direct API integration partnership |
| **Kushki** | Payment gateway | Unified payment API, Ecuador-founded, multi-country | Direct integration partnership |
| **BanEcuador** | Development bank | Government bank for SMBs, agricultural credit, microfinance | Co-branded digitization program |
| **MIPRO (Ministerio de Produccion)** | Government | SMB registry, RISE administration, business development | Kitz as recommended digital tool |
| **Camara de Comercio de Quito** | Business association | 10,000+ member businesses, training programs | Member benefit, referral program |
| **Camara de Comercio de Guayaquil** | Business association | Coastal business community, trade focus | Member benefit, referral program |

### 11.3 Cross-Market Distribution Partnerships

| Channel | Peru Opportunity | Ecuador Opportunity |
|---|---|---|
| **Accountants (Contadores)** | Referral program for contadores who recommend Kitz; leverage their SUNAT expertise | Referral program; accountants are the primary e-invoicing advisors for SMBs |
| **Banks** | BCP (Yape), BBVA (Plin), Interbank -- recommend Kitz during business account opening | Banco Pichincha, Banco del Pacifico -- bundle with De Una/Bimo merchant onboarding |
| **Government programs** | Produce MYPE programs, COFIDE financing programs | MIPRO SMB programs, BanEcuador loan disbursements |
| **Telecom operators** | Movistar Peru, Claro Peru -- SMB digital bundles | Movistar Ecuador, Claro Ecuador -- SMB digital bundles |
| **Gremios (trade associations)** | Industry-specific guilds (textile, gastronomy, etc.) | Industry guilds, agricultural cooperatives |

### 11.4 Potential OSE/E-Invoicing Partners (Peru -- Detailed)

| OSE Provider | Strengths | API Quality | Pricing Model | Recommendation |
|---|---|---|---|---|
| **Nubefact** | Market leader, excellent documentation, fast support | RESTful, well-documented, SDKs available | Per-document (tiered) | **Top choice** -- best API, largest user base |
| **Facturalo** | Open-source background, developer-friendly, flexible | RESTful, good documentation | Per-document or flat rate | **Strong alternative** -- good for cost control |
| **DIGIFLOW** | Enterprise-grade, multi-country | SOAP and REST | Enterprise licensing | Overkill for Kitz's SMB market |
| **Efact** | Established provider, reliable | REST API | Per-document | Good backup option |

### 11.5 Potential E-Invoicing Partners (Ecuador -- Detailed)

| Provider | Strengths | API Quality | Pricing Model | Recommendation |
|---|---|---|---|---|
| **Datil** | Ecuador specialist, excellent API, modern documentation | RESTful, very well-documented | Per-document (tiered) | **Top choice** -- best Ecuador-specific e-invoicing API |
| **SRI Free Tool** | Free, government-provided | No API -- manual web interface only | Free | Not viable for Kitz automation (but useful as reference) |
| **Direct SRI Integration** | No third-party dependency, no per-document fees | SOAP web services | Free (infrastructure cost only) | **Recommended long-term** -- Kitz builds its own SRI submission |
| **Facturacion.ec** | Established Ecuador provider | REST API | Per-document | Backup option |

**Recommendation for Ecuador:** Unlike Peru (where OSE certification is complex), Ecuador allows direct SRI submission via public web services. Kitz should build direct SRI integration from the start, using Datil's API as a fallback during the initial launch phase. This avoids per-document fees and third-party dependency.

---

## 12. Appendix: Reference Links

### Payment Systems -- Peru

- Yape: https://www.yape.com.pe/
- Yape for Business: https://www.yape.com.pe/negocios
- BCP (Banco de Credito del Peru): https://www.viabcp.com/
- Plin: https://www.plin.pe/
- PagoEfectivo: https://pagoefectivo.pe/
- PagoEfectivo Developers: https://pagoefectivo.pe/desarrolladores
- Niubiz: https://www.niubiz.com.pe/
- Niubiz Developers: https://developers.niubiz.com.pe/
- Izipay: https://www.izipay.pe/
- Culqi: https://www.culqi.com/
- Culqi Developers: https://docs.culqi.com/
- Mercado Pago Peru: https://www.mercadopago.com.pe/
- Tunki: https://tunki.pe/

### Payment Systems -- Ecuador

- Payphone: https://www.payphone.app/
- Payphone Developers: https://developers.payphone.app/
- De Una (Banco Pichincha): https://www.pichincha.com/deuna
- Bimo (Banco del Pacifico): https://www.bancodelpacifico.com/bimo
- Datafast: https://www.datafast.com.ec/
- Kushki: https://www.kushki.com/
- Kushki Developers: https://docs.kushki.com/
- Nuvei (Paymentez): https://www.nuvei.com/

### Government & Tax -- Peru

- SUNAT Portal: https://www.sunat.gob.pe/
- SUNAT Clave SOL: https://e-menu.sunat.gob.pe/
- SUNAT CPE (Comprobantes de Pago Electronicos): https://cpe.sunat.gob.pe/
- SUNAT Consulta RUC: https://e-consultaruc.sunat.gob.pe/
- SUNAT E-Invoice Specifications: https://cpe.sunat.gob.pe/node/88
- SUNAT OSE Registry: https://cpe.sunat.gob.pe/informacion_general/operadores-de-servicios-electronicos
- BCRP (Banco Central): https://www.bcrp.gob.pe/
- SBS (Superintendencia de Banca y Seguros): https://www.sbs.gob.pe/
- SUNARP (Business Registry): https://www.sunarp.gob.pe/
- Produce (Ministry of Production): https://www.gob.pe/produce
- RENIEC (National ID): https://www.reniec.gob.pe/

### Government & Tax -- Ecuador

- SRI Portal: https://www.sri.gob.ec/
- SRI Online: https://srienlinea.sri.gob.ec/
- SRI Comprobantes Electronicos: https://cel.sri.gob.ec/
- SRI E-Invoice Documentation: https://www.sri.gob.ec/facturacion-electronica
- BCE (Banco Central del Ecuador): https://www.bce.fin.ec/
- BCE Firma Electronica: https://www.bce.fin.ec/servicios/firma-electronica
- Superintendencia de Bancos Ecuador: https://www.superbancos.gob.ec/
- Superintendencia de Companias: https://www.supercias.gob.ec/
- MIPRO (Ministerio de Produccion): https://www.produccion.gob.ec/
- Security Data (Electronic Certificates): https://www.securitydata.net.ec/

### E-Invoicing Partners

- Nubefact (Peru OSE): https://www.nubefact.com/
- Facturalo (Peru OSE): https://facturalo.pe/
- DIGIFLOW (Peru OSE): https://www.digiflow.pe/
- Datil (Ecuador): https://datil.com/
- Facturacion.ec: https://facturacion.ec/

### Banking -- Peru

- BCP: https://www.viabcp.com/
- BBVA Peru: https://www.bbva.pe/
- Interbank: https://interbank.pe/
- Scotiabank Peru: https://www.scotiabank.com.pe/
- Mi Banco: https://www.mibanco.com.pe/
- Caja Arequipa: https://www.cajaarequipa.pe/

### Banking -- Ecuador

- Banco Pichincha: https://www.pichincha.com/
- Banco del Pacifico: https://www.bancodelpacifico.com/
- Produbanco: https://www.produbanco.com.ec/
- Banco Guayaquil: https://www.bancoguayaquil.com/
- Banco Bolivariano: https://www.bolivariano.com/
- BanEcuador: https://www.banecuador.fin.ec/
- Cooperativa JEP: https://www.jep.coop/

### Competitive Intelligence

- Alegra: https://www.alegra.com/
- Nubefact: https://www.nubefact.com/
- Facturalo: https://facturalo.pe/
- Datil: https://datil.com/
- Contifico: https://www.contifico.com/
- Bsale: https://www.bsale.com.pe/
- Siigo: https://www.siigo.com/

### Regulatory References -- Peru

- Resolucion de Superintendencia No. 340-2017/SUNAT (OSE framework)
- Resolucion de Superintendencia No. 113-2018/SUNAT (e-invoice updates)
- Decreto Legislativo No. 1269 (Regimen MYPE Tributario)
- Ley 29733 (Ley de Proteccion de Datos Personales)
- SUNAT Catalogo de Codigos (tax codes, document types, identity types)

### Regulatory References -- Ecuador

- Resolucion NAC-DGERCGC14-00790 (e-invoicing framework)
- Ley de Regimen Tributario Interno (LRTI)
- Reglamento de Comprobantes de Venta, Retencion y Documentos Complementarios
- Ley Organica de Proteccion de Datos Personales (2021)
- Ficha Tecnica de Comprobantes Electronicos (SRI technical specification)

### Kitz Codebase References

- Payment tools: `kitz_os/src/tools/paymentTools.ts`
- Invoice/quote tools: `kitz_os/src/tools/invoiceQuoteTools.ts`
- Invoice workflow: `kitz_os/data/n8n-workflows/invoice-auto-generate.json`
- Panama infrastructure doc: `docs/intelligence/PANAMA_INFRASTRUCTURE.md`

---

*This document should be reviewed and updated quarterly as Peru and Ecuador's regulatory and payment landscapes evolve. Key monitoring dates: SUNAT resolution updates (ongoing), SRI e-invoicing phase rollouts, IVA rate changes (Ecuador), Yape/Plin interoperability updates (Peru), and payment provider market shifts in both countries.*

*Strategic reminder: Ecuador's USD dollarization makes it the lowest-friction expansion market after Panama. Prioritize Ecuador for faster revenue generation while building the more complex Peru infrastructure (PEN currency, detracciones, OSE integration) in parallel.*