# KITZ OS — Claude Code Project Guide

## What is Kitz?
AI-powered Business Operating System for small businesses in Latin America. "AWS for SMBs." TypeScript monorepo with 13+ microservices running on Fastify.

## Architecture

### Service Map

| Service | Port | Entry Point | Role |
|---------|------|-------------|------|
| `kitz-gateway` | 4000 | `src/index.ts` | Zero-trust API proxy, auth, RBAC, rate limiting |
| `kitz-llm-hub` | 4010 | `src/index.ts` | Multi-provider LLM router (Claude, OpenAI, Gemini, DeepSeek) |
| `kitz-payments` | 3005 | `src/index.ts` | Stripe/PayPal ledger, AI Battery credits, checkout |
| `kitz-whatsapp-connector` | 3006 | `src/index.ts` | Multi-session Baileys WhatsApp bridge |
| `kitz-email-connector` | 3007 | `src/index.ts` | Email send/receive with draft-first |
| `kitz-notifications-queue` | 3008 | `src/index.ts` | Job queue with retry + DLQ |
| `kitz-services` | 3010 | `src/index.ts` | Marketing hub + Panama compliance |
| `admin-kitz-services` | 3011 | `src/index.ts` | Admin dashboard, API keys, credits |
| `kitz_os` | 3012 | `src/kernel.ts` | Core AI engine — 68+ tools, routing, orchestration |
| `kitz-brain` | cron | `src/index.ts` | Scheduled AI agents (daily/weekly) |
| `kitz-schemas` | lib | `src/contracts.ts` | Shared TypeScript contracts + trace helpers |
| `aos` | — | `src/` | Agent-to-agent communication layer (30+ agent roles) |
| `kitz-docs` | — | `*.md` | Architecture docs, threat model, runbooks |
| `kitz-knowledge-base` | — | `*.md` | RAG playbooks, SOPs, offer templates |

### Data Flow
```
User (WhatsApp/Web) → kitz-gateway (auth) → kitz_os (orchestration)
                                            → kitz-llm-hub (AI)
                                            → kitz-payments (credits)
                                            → kitz-whatsapp-connector (reply)
```

### Key Patterns
- **Zero-trust**: All inter-service calls go through `kitz-gateway`
- **Draft-first**: All outbound messages are drafts until explicitly approved
- **AI Battery**: Credit-based consumption — check ROI before spending credits
- **Audit trail**: Every action logged with `traceId` propagation
- **Tool registry**: `kitz_os` exposes 68+ tools via `OsToolRegistry`
- **Kill-switch**: `KILL_SWITCH=true` env var halts all AI execution

## Tech Stack
- **Language**: TypeScript (strict mode)
- **Runtime**: Node.js + tsx (dev)
- **Framework**: Fastify 4.x
- **Database**: PostgreSQL 16 (Supabase in production)
- **WhatsApp**: @whiskeysockets/baileys v7.0.0-rc.9
- **Testing**: Vitest
- **Deploy**: Docker + docker-compose (local), Railway (production)

## Dev Commands
```bash
# Run a single service
cd kitz-whatsapp-connector && npm run dev

# Run full stack
docker compose up --build

# Type check any service
cd <service> && npx tsc --noEmit

# Run tests
cd <service> && npm test
```

## Key Files
- `KITZ_MASTER_PROMPT.md` — Constitutional governance layer (tone, execution loop, AI Battery rules)
- `Kitz-Repo-Audit.md` — Per-service audit and delta plan
- `docker-compose.yml` — Full stack wiring with ports and env vars
- `kitz-schemas/src/contracts.ts` — Shared TypeScript interfaces
- `kitz_os/src/kernel.ts` — Core orchestration boot sequence

## WhatsApp Connector Notes
- Uses Baileys (not official WhatsApp Business API)
- Multi-session: each user gets their own WASocket
- QR login flow: `/whatsapp/login` → SSE stream at `/whatsapp/connect`
- Auth state persisted in `auth_info_baileys/<userId>/`
- Production URL: `https://kitzv1-production.up.railway.app`
- Critical: follows OpenClaw Baileys patterns (queued creds, sync handlers, minimal config)

## Safety Rules
- Never expose API keys or secrets in code
- Never bypass the AI Battery credit check
- Never send outbound messages without draft approval
- The kill-switch (`KILL_SWITCH=true`) must be respected
- All actions must be traceable via `traceId`

## Shared Dependencies
All service repos use `kitz-schemas` as a local dependency:
```json
"kitz-schemas": "file:../kitz-schemas"
```
When modifying contracts in `kitz-schemas/src/contracts.ts`, check all consuming services.

## Business Context
- **Target user**: 25-45, LatAm, Spanish-first, sells on WhatsApp/Instagram
- **Free tier**: Mobile CRM + Order Management + Checkout Links
- **Paid tier**: AI Battery credits (100/$5, 500/$20, 2000/$60)
- **Tone**: Gen Z clarity + disciplined founder. Direct, concise, no corporate fluff
- **WhatsApp bot**: 5-7 words default, 15-23 max, 30 if complex. Cool, chill, never rude
