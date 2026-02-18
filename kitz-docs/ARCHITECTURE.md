# ARCHITECTURE

```text
Clients/UI
├─ xyz88-io (CRM + Orders + Checkout Links)
├─ admin-kitz-services (API keys, credits, approvals, audit)
└─ kitz-services (marketing + free AI business content)

                ┌───────────────────────────────────────────────┐
                │                 kitz-gateway                  │
                │ auth stub | orgId isolation | RBAC | audit    │
                └───────────────────────────────────────────────┘
                     │              │               │
        ┌────────────┴───────┐  ┌───┴────────┐  ┌───┴────────────────────┐
        │                    │  │            │  │                        │
   kitz-brain          kitz-payments   kitz-notifications-queue     kitz-llm-hub
(agents/scheduler)     (ledger/webhook) (async retries + DLQ)       (providers/router)
        │                    │            │                        │
        └─────────── uses kitz-schemas contracts + traceId conventions ───────────┘
                             │
                    connectors (whatsapp/email)
```

## Invariants
- Zero-trust routing: service actions are initiated through `kitz-gateway`.
- Multi-tenancy: every request carries `orgId`.
- Auditability: every sensitive action logs `traceId`.
- Messaging: draft-first with explicit approval before final send.
