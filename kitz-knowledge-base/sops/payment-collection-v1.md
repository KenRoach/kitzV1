# Payment Collection SOP v1

**Owner:** CFO Agent
**Type:** business

## Summary
Send the link, follow up twice, confirm receipt. Simple.

## Steps
1. **Create checkout link** — Use storefronts tool. Include item, price, due date.
2. **Send via WhatsApp** — Short message: "Here's your invoice [link]"
3. **First follow-up** — 24 hours if unpaid. "Hey, just checking — did you see the invoice?"
4. **Second follow-up** — 72 hours if still unpaid. "Last reminder on this one."
5. **Confirm payment** — When webhook fires, mark as paid. Send "Got it, thanks!"
6. **Update records** — Log in CRM. Update order status.

## Rules
- Never chase more than twice — respect their space
- Always use checkout links (trackable) — never just send account numbers
- Payment confirmation must be automated via webhook, not manual
- All amounts in local currency first
