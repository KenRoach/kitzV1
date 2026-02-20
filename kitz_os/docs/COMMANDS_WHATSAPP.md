# KITZ OS WhatsApp Commands

## System
- `status` — System health, tool count, uptime
- `help` — Command menu
- `kill` / `pause` — Engage kill switch
- `resume` — Disengage kill switch

## CRM
- `contacts` — List all contacts
- `contact [name/id]` — Get contact details
- `add contact [name] [phone]` — Create contact
- `update contact [id] [field] [value]` — Update contact

## Orders
- `orders` — List all orders
- `order [id]` — Get order details
- `new order [contact] [amount]` — Create order
- `mark order [id] paid` — Update payment status

## Storefronts
- `storefronts` — List payment links
- `create storefront [title] [price]` — New payment link
- `mark storefront [id] paid` — 6-step payment flow
- `send storefront [id]` — Send link to buyer
- `delete storefront [id]` — Delete (email approval)

## Products
- `products` — List catalog
- `create product [name] [price]` — New product
- `delete product [id]` — Delete (email approval)

## Intelligence
- `summary` / `overview` — Business overview
- `dashboard` / `metrics` — Real-time KPIs
- `brain dump: [idea text]` — Process idea into structured report
- `report daily/weekly` — Generate cadence report

## Natural Language
Any message that doesn't match a command is routed through the AI semantic router. Just ask naturally:
- "How are sales this week?"
- "Find contacts named Maria"
- "Create an invoice for $250"
- "What's on my calendar?"
