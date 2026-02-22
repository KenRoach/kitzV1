# ARCHITECTURE

```text
Clients/UI
├─ workspace / workspace.kitz.services (CRM + Orders + Checkout Links)
├─ admin-kitz-services / admin.kitz.services (Agent command center, API keys, credits, approvals, audit)
└─ kitz-services / kitz.services (Landing page + marketing site)

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
