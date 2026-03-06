# LatAm Fintech & Payments — Tech Provider Knowledge Base

---

## MercadoLibre / Mercado Pago

### Company Overview
- **Founded**: 1999 by Marcos Galperin (Buenos Aires, Argentina)
- **Ticker**: MELI (NASDAQ)
- **Revenue**: ~$18B (FY2024)
- **CEO**: Marcos Galperin
- **Employees**: ~60,000
- **Market position**: #1 e-commerce + #1 fintech in LatAm. "The Amazon + PayPal of Latin America"
- **Countries**: Argentina, Brazil, Mexico, Colombia, Chile, Uruguay, Peru, Ecuador, Venezuela, Costa Rica, Panama, Honduras, Nicaragua, El Salvador, Guatemala, Dominican Republic, Bolivia, Paraguay

### Key Products
- **MercadoLibre**: E-commerce marketplace (300M+ users, 150M+ active buyers)
  - Marketplace listings, Mercado Shops (branded storefronts), advertising (Product Ads)
  - Mercado Envios: Logistics network (fulfillment centers, last-mile, same-day in major cities)
  - Categories: Electronics, fashion, auto parts, home, sports — everything
- **Mercado Pago**: Digital payments & fintech
  - Mobile wallet, QR payments (offline merchant adoption massive in Argentina, Brazil, Mexico)
  - Payment processing: Online checkout (similar to Stripe), POS devices (mPOS readers)
  - Mercado Credito: SMB loans, consumer credit, BNPL (buy now pay later)
  - Digital account: Savings (yields in Argentina/Brazil), debit card, bill payments
  - Crypto: Buy/sell Bitcoin, Ethereum via Mercado Pago
- **Mercado Ads**: Advertising platform within MercadoLibre ecosystem (Product Ads, Display, Video)

### SMB Relevance
- **Primary sales channel for LatAm SMBs**: Many SMBs in LatAm sell exclusively on MercadoLibre
- **Mercado Shops**: Free branded online store (custom domain, design, integrated with MELI logistics)
- **Mercado Pago checkout**: Accept cards, bank transfers, cash (OXXO, boleto, rapipago) — 2.99-4.99% fees
- **QR payments**: Free for small merchants (no hardware needed, just print QR code)
- **Mercado Credito for SMBs**: Working capital loans based on sales history (no traditional credit check)
- **mPOS device**: Card reader from ~$20-50 depending on country
- **Fulfillment (Flex/Full)**: SMBs ship to MELI warehouse, MELI handles delivery

### APIs & Integration
- **MercadoLibre API**: REST API — listings, orders, questions, shipping, categories, users
- **Mercado Pago API**: Payments, subscriptions, QR, checkout, refunds, payouts
- **Mercado Pago SDK**: JS, React Native, iOS, Android, PHP, Python, Node.js, Java, .NET, Ruby
- **Webhooks**: Real-time notifications for orders, payments, shipping updates
- **Official docs**: developers.mercadolibre.com, mercadopago.com.br/developers

### Pricing (varies by country)
| Service | Fee |
|---------|-----|
| Marketplace commission (Argentina) | 13-37.5% (category-dependent) |
| Mercado Pago online checkout | 2.99-4.99% + VAT |
| Mercado Pago QR (in-store) | 0.99-1.99% |
| Mercado Pago POS device | ~$20-50 one-time |
| Mercado Shops | Free (commission on sales) |
| Mercado Credito (SMB loans) | Variable interest (based on score) |

---

## Nubank

### Company Overview
- **Founded**: 2013 by David Velez, Cristina Junqueira, Edward Wible (Sao Paulo, Brazil)
- **Ticker**: NU (NYSE)
- **Revenue**: ~$10B (FY2024)
- **CEO**: David Velez (Colombian-born)
- **Employees**: ~8,000
- **Market position**: World's largest digital bank by customers (100M+ in Brazil, expanding LatAm)
- **Countries**: Brazil, Mexico, Colombia

### Key Products
- **Digital bank account**: No fees, instant transfers (PIX in Brazil, SPEI in Mexico)
- **Credit card**: No annual fee, app-controlled limits, real-time notifications
- **Personal loans**: Competitive rates, fully digital application
- **Savings/Investment**: CDB (Brazil), money market, crypto (Bitcoin, Ethereum, Solana)
- **Insurance**: Life, phone, auto (digital-first)
- **NuPay**: Online payment method (pay with Nubank balance/credit)
- **Nubank Business (NuConta PJ)**: Business account for SMBs/MEIs in Brazil
- **Nu Invest**: Brokerage (stocks, ETFs, fixed income)

### SMB Relevance
- **NuConta PJ**: Free business account for Brazilian SMBs/MEIs (micro-entrepreneurs)
  - Free PIX transfers, boleto issuance, debit card
  - Cash flow management, expense categorization
- **NuPay for merchants**: Accept Nubank payments at checkout
- **Lending for SMBs**: Credit lines based on transaction history
- **Mexico/Colombia**: Consumer-only for now, business accounts coming

### APIs
- **Limited public API**: Nubank is primarily consumer-facing, limited merchant/business APIs
- **Open Banking (Brazil)**: Nubank participates in Brazil's Open Finance initiative
- **PIX API**: Via Brazilian Central Bank standards (Nubank as participant)

---

## Rappi

### Company Overview
- **Founded**: 2015 by Simon Borrero, Sebastian Mejia, Felipe Villamarin (Bogota, Colombia)
- **Valuation**: ~$5.25B (last round 2021)
- **CEO**: Simon Borrero
- **Employees**: ~5,000 + hundreds of thousands of delivery couriers
- **Countries**: Colombia, Mexico, Brazil, Argentina, Chile, Peru, Ecuador, Costa Rica, Uruguay

### Key Products
- **Rappi**: Super-app for delivery
  - Food delivery (restaurants)
  - Grocery delivery (supermarkets, convenience stores)
  - Pharmacy delivery
  - Anything delivery ("Rappi Favors" — send courier to buy anything)
  - RappiPay: Digital wallet, credit card (with Visa), cash-in/cash-out
  - RappiBank: Digital banking (Colombia)
  - RappiCargo: Last-mile logistics for e-commerce merchants
  - RappiAds: Advertising platform for brands within the app
- **Rappi for Business (RappiPay Business)**: B2B payments, corporate cards, expense management
- **Turbo**: Ultra-fast delivery from dark stores (10-15 min)

### SMB Relevance
- **Restaurant/store onboarding**: SMBs list on Rappi to reach delivery customers
- **RappiCargo**: SMBs use Rappi couriers for their own deliveries
- **RappiAds**: Promote products within the Rappi app
- **Commission**: 15-30% per order (varies by country/category)
- **RappiPay Business**: Corporate expense management for SMBs

### APIs
- **Rappi Partner API**: Restaurant/store order management, menu sync
- **RappiCargo API**: On-demand delivery dispatch
- **Webhooks**: Order status, delivery tracking

---

## Clip (Mexico)

### Overview
- **Founded**: 2012 by Adolfo Babatz (Mexico City, Mexico)
- **Valuation**: ~$2B+ | **Employees**: ~2,000
- **Market position**: #1 payment terminal provider in Mexico (competing with Mercado Pago, SumUp)

### Key Products
- **Clip readers**: Card payment terminals (Clip Plus, Clip Pro, Clip Total — contactless, chip, swipe)
- **Clip Online**: E-commerce payment links
- **Clip Banca**: Digital business account (no minimum balance, free transfers)
- **Clip Pagos**: Bill payments, mobile top-ups
- **Terminal pricing**: Clip Plus ~$249 MXN (~$14), Clip Pro ~$499 MXN, Clip Total ~$1,499 MXN

### SMB Relevance
- **Dominant in Mexican micro-merchants**: Taco stands, market vendors, small shops — anyone who needs card acceptance
- **No monthly fees**: Pay only per transaction (3.6% + IVA standard)
- **Instant deposits**: Money available next day (or same day for fee)
- **Clip Banca**: Full business banking for informal/formal SMBs

---

## dLocal

### Overview
- **Founded**: 2016 by Andres Bzurovski, Sergio Fogel (Montevideo, Uruguay)
- **Ticker**: DLO (NASDAQ) | **Revenue**: ~$700M | **Employees**: ~1,000
- **Market position**: #1 cross-border payments platform for emerging markets

### Key Products
- **Pay-in**: Accept payments in 40+ countries (LatAm, Africa, Asia) via local methods
  - Credit/debit cards, bank transfers, cash vouchers (OXXO, boleto, PSE, etc.), wallets, PIX
- **Pay-out**: Send payments to merchants/users in local currencies
- **One single API**: Unified integration for all LatAm payment methods
- **FX management**: Currency conversion, settlement in USD/EUR/GBP

### SMB Relevance
- **Primarily serves global enterprises** selling into LatAm (Microsoft, Amazon, Spotify, Uber, Nike)
- **SMBs can use via partners**: Many SaaS platforms (Shopify, WooCommerce) integrate dLocal for LatAm payments
- **If building a product for LatAm**: dLocal solves the "how do I accept payments in 18 countries" problem

### APIs
- **dLocal API**: REST API — payments, refunds, payouts, currency exchange
- **Smart Fields**: Embeddable payment UI (similar to Stripe Elements)
- **Webhooks**: Payment status, chargeback, payout notifications

---

## Ualá (Argentina)

### Overview
- **Founded**: 2017 by Pierpaolo Barbieri (Buenos Aires, Argentina)
- **Valuation**: ~$2.45B | **Employees**: ~2,000
- **Countries**: Argentina, Mexico, Colombia

### Key Products
- **Digital account**: Free personal/business account
- **Prepaid Mastercard**: Physical + virtual card
- **Investments**: Mutual funds, crypto, fixed-term deposits
- **Loans**: Personal + SMB credit
- **Insurance**: Travel, phone screen
- **Ualá Bis**: mPOS payment terminal for merchants (competing with Mercado Pago)
- **Ualá Business**: Business account, payroll, invoicing

### SMB Relevance
- **Ualá Bis**: Accept card payments with QR or mPOS reader (1.9% fee, instant settlement)
- **Business account**: Free, no minimum balance
- **Growing in Argentina**: 8M+ users, strong in underbanked segments

---

## Nuvei (formerly part of LatAm payments)

### Overview
- **Ticker**: NVEI (NASDAQ, going private) | **HQ**: Montreal, Canada
- **Revenue**: ~$1.2B | **Focus**: Global payments, strong LatAm presence

### LatAm Relevance
- Processes payments in 20+ LatAm countries
- Supports 700+ alternative payment methods (OXXO, boleto, PSE, PIX, efecty, etc.)
- Competes with dLocal for cross-border LatAm payments

---

## EBANX (Brazil)

### Overview
- **Founded**: 2012 (Curitiba, Brazil)
- **Valuation**: ~$1B+ | **Employees**: ~1,500
- **Market position**: Cross-border payment platform connecting global merchants to LatAm buyers

### Key Products
- **EBANX Pay**: Accept LatAm payment methods (PIX, boleto, OXXO, PSE, credit cards)
- **EBANX Wallet**: Consumer digital wallet
- **Coverage**: Brazil, Mexico, Argentina, Colombia, Chile, Peru, Ecuador, Bolivia, Guatemala, Uruguay

### SMB Relevance
- **Like dLocal, primarily serves global merchants** (AliExpress, Shein, Spotify, Uber)
- **API-first**: Single integration for all LatAm payment methods
