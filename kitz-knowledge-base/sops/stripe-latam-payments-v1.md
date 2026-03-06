# Stripe LatAm Payments Intelligence SOP v1

**Owner:** CFO Agent
**Type:** payments

## Summary
LatAm e-commerce: $319B+ (2024). Subscription market: $30B+ by 2025, doubling by 2026. Kitz uses Stripe for checkout sessions and subscription billing.

## Market Data
- 75% of LatAm online retail is mobile-first (smartphones)
- Real-time payments (PIX, SPEI, PSE) are dominant in LatAm
- Voucher payments still common — customers pay at local stores
- Credit card issuance expanding, driving subscription growth

## Stripe Implementation for Kitz

### Checkout Sessions API
- Go live faster with Payment Element
- Enable Billing, Tax, or Adaptive Pricing with single line of code
- Support local payment methods per country

### AI Battery Pricing (Kitz)
| Tier | Credits | Price |
|------|---------|-------|
| Starter | 100 | $5 |
| Growth | 500 | $20 |
| Pro | 2000 | $60 |

### Subscription Billing Patterns
1. **Fixed-price** — Monthly AI Battery subscription
2. **Usage-based** — Pay per credit consumed
3. **Per-seat** — For team plans (future)

### LatAm Payment Methods by Country
| Country | Primary Methods |
|---------|----------------|
| Brazil | PIX, Boleto, credit cards |
| Mexico | SPEI, OXXO vouchers, credit cards |
| Colombia | PSE bank transfer, Efecty vouchers |
| Argentina | Mercado Pago, bank transfers |
| Panama | Yappy, BAC, credit cards |
| Chile | Webpay, bank transfers |
| Peru | PagoEfectivo, bank transfers |

### Webhook Security
- Current state: Check header presence but don't cryptographically verify
- TODO: Implement `stripe.webhooks.constructEvent()` for signature verification
- Credits are deducted via webhooks only — POST /spend always returns 403

## Adaptive Pricing
Stripe's Adaptive Pricing automatically adjusts prices for local currencies.
- Critical for LatAm where USD pricing creates friction
- Customers see prices in their local currency at checkout

## Rules
- Never bypass webhook signature verification in production
- Credits deducted via webhooks only — no direct spend endpoint
- Support local payment methods — not just credit cards
- Adaptive pricing for multi-country LatAm coverage
- ROI check before AI Battery spend: >= 2x or recommend manual
