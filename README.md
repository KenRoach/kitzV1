# Kitz

AI-powered Business Operating System for small businesses in Latin America.
TypeScript monorepo with 13+ microservices on Fastify. Deployed to Railway.

## Quick Start

```bash
# Run a single service
cd <service> && npm run dev

# Run full stack
docker compose up --build

# Type check any service
cd <service> && npx tsc --noEmit

# Run tests
cd <service> && npm test
```

## Services

| Service | Port | Role |
|---------|------|------|
| `kitz-gateway` | 4000 | Zero-trust API proxy, auth, RBAC, rate limiting |
| `kitz-llm-hub` | 4010 | Multi-provider LLM router (Claude, OpenAI, Gemini, Perplexity, DeepSeek) |
| `kitz-payments` | 3005 | AI Battery ledger, Stripe/PayPal/Yappy/BAC webhooks |
| `kitz-whatsapp-connector` | 3006 | Multi-session Baileys WhatsApp bridge, QR login via SSE |
| `kitz-email-connector` | 3007 | Email send/receive, draft-first, suppression list |
| `kitz-notifications-queue` | 3008 | In-memory FIFO queue, retry, DLQ, idempotency |
| `kitz-services` | 3010 | Free marketing content hub + Panama compliance pipeline |
| `admin-kitz-services` | 3011 | Admin dashboard, API keys, credits, WhatsApp QR proxy |
| `kitz_os` | 3012 | Core AI engine — tools, semantic router, cadence, AI Battery |
| `kitz-brain` | cron | Scheduled AI agents (daily, weekly) |
| `workspace` | 3001 | Free manual workspace (CRM, orders, checkout links, tasks) |
| `engine/comms-api` | 3013 | Talk, Text, Email routing (Twilio, email providers) |
| `engine/logs-api` | 3014 | Activity logging and audit trail service |
| `ui` | 5173 | React + Vite SPA dashboard |
| `n8n` | 5678 | Workflow automation |

## Shared Libraries

| Package | Role |
|---------|------|
| `kitz-schemas` | Shared TypeScript contracts + trace helpers |
| `aos` | Agent-to-agent OS layer (30+ agent roles, event bus, ledger) |

## Supporting Directories

| Directory | Role |
|-----------|------|
| `database/` | PostgreSQL migrations and seed data |
| `docs/` | Internal docs, intelligence, plans, presentations |
| `infra/` | CI, Docker, env templates, k8s, Terraform |
| `kitz-docs/` | Architecture, threat model, approval matrix, runbooks, specs |
| `kitz-knowledge-base/` | RAG playbooks, SOPs, offer templates |
| `kitz-supabase/` | Supabase edge functions + migrations |
| `zero-trust/` | Security layer: auth, RBAC, encryption, audit |
| `shared/` | Cross-service shared types and utils (scaffold) |
| `brain/` | AI agent skills (scaffold) |
| `scripts/` | Health check, migrate, seed, setup, build validation |
| `tests/` | E2E, integration, load test scaffolds |
| `bin/` | CLI entry point |
| `content/` | Changelog |

## Notes

- Branding and naming in this repo use **Kitz**.
- See `CLAUDE.md` for the full development guide.
- See `kitz-docs/` for architecture, threat model, and specs.
