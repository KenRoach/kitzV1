# WhatsApp Response SLA v1

**Owner:** HeadCustomer Agent
**Type:** agent

## Summary
Agent SOP for response timing on WhatsApp messages.

## Steps
1. **Urgent messages** (payment issues, complaints, order problems) — Draft within 15 minutes.
2. **Normal messages** (questions, info requests) — Draft within 4 hours.
3. **Low priority** (general chat, greetings) — Draft within 24 hours.
4. **After hours** — Queue draft, send at 8am local time next business day.
5. **Escalation** — If no draft within SLA, auto-escalate to EscalationBot.

## Classification
- Contains "pay", "money", "refund", "broken", "wrong" — Urgent
- Contains "how", "what", "when", "price", "cost" — Normal
- Everything else — Low priority

## Rules
- SLA is for DRAFT creation, not sending — draft-first always applies
- After-hours = before 7am or after 9pm local time
- Weekend responses queue for Monday 8am unless urgent
