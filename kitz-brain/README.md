# kitz-brain

Agents + scheduler + tool registry.

## Guardrails
- Brain calls tools through `kitz-gateway`.
- Allowed AI interaction providers: Lovable, Claude Code, Codex, Gemini.
- Payment actions are **receive-only** via Stripe/PayPal checkout flows.
- Agents are blocked from spend/refund/payout operations.
