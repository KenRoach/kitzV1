# Inbox Triage SOP v1

**Owner:** HeadCustomer Agent
**Type:** agent
**Trigger:** New inbound message received

## Summary
Check if we can reply, draft something good, get approval before sending.

## Steps
1. **Check consent** — Verify the sender opted in. No consent = no reply.
2. **Classify urgency** — Payment issue or complaint = urgent. General question = normal.
3. **Pull context** — Check CRM for contact history. Check orders for recent activity.
4. **Draft response** — Keep it short (5-7 words default). Match their language (ES/EN).
5. **Queue for approval** — Never send without explicit approval. Draft-first always.

## Rules
- Never reply to unknown numbers without consent verification
- Response SLA: urgent < 1 hour, normal < 24 hours
- If uncertain, escalate to EscalationBot
