# KITZ OS — Claude Code Project Guide

## What is Kitz?
AI-powered Business Operating System for small businesses in Latin America.
"Your hustle deserves infrastructure." — AWS for SMBs.
TypeScript monorepo with 13+ microservices on Fastify. GitHub: `KenRoach/kitzV1`

## Architecture

### Service Map

| Service | Port | Role | Maturity |
|---------|------|------|----------|
| `kitz-gateway` | 4000 | Zero-trust API proxy, auth, RBAC, rate limiting (120 req/min) | Stub |
| `kitz-llm-hub` | 4010 | Multi-provider LLM router (Claude, OpenAI, Gemini, Perplexity, DeepSeek) | Stub |
| `kitz-payments` | 3005 | AI Battery ledger, Stripe/PayPal/Yappy/BAC webhooks, checkout sessions | Stub |
| `kitz-whatsapp-connector` | 3006 | Multi-session Baileys WhatsApp bridge, QR login via SSE | Production |
| `kitz-email-connector` | 3007 | Email send/receive, draft-first, suppression list | Stub |
| `kitz-notifications-queue` | 3008 | In-memory FIFO queue, retry (3x), DLQ, idempotency | Stub |
| `kitz-services` | 3010 | Free marketing content hub + Panama compliance pipeline | Stub |
| `admin-kitz-services` | 3011 | Admin dashboard, API keys, credits, WhatsApp QR proxy | Stub |
| `kitz_os` | 3012 | Core AI engine — 68+ tools, semantic router, cadence, AI Battery | Functional |
| `kitz-brain` | cron | Scheduled AI agents (daily 8am, weekly Mon 9am) | Stub |
| `workspace` | 3001 | workspace.kitz.services — Free manual workspace (CRM, orders, checkout links, tasks, AI direction) for users + AI agents | Functional |
| `kitz-schemas` | lib | Shared TypeScript contracts + trace helpers | Functional |
| `aos` | — | Agent-to-agent OS layer (30+ agent roles, event bus, ledger) | Stub |
| `kitz-docs` | — | Architecture docs, threat model, approval matrix, runbooks | Docs |
| `kitz-knowledge-base` | — | RAG playbooks, SOPs, offer templates | Content |
| `ui` | 5173 | React + Vite SPA — split-panel dashboard (ChatPanel + CanvasPreview) | Functional |
| `engine/comms-api` | 3013 | Talk, Text, Email routing (Twilio, email providers) | Stub |
| `engine/logs-api` | 3014 | Activity logging and audit trail service | Stub |
| `kitz-supabase` | — | Supabase edge functions + migrations (renamed from bizgenie-core) | Functional |
| `zero-trust` | — | Security layer: auth, RBAC, encryption, audit, network policies | Stub |
| `shared` | — | Cross-service shared types, utils, constants, contracts | Stub |
| `brain` | — | AI agent skills: call transcription, email drafting, sentiment, smart reply | Stub |

**Maturity key:** Production = real API integrations, deployed. Functional = real logic, needs polish. Stub = endpoints exist, business logic is in-memory/placeholder.

### Data Flow
```
User (WhatsApp/Web)
  → kitz-gateway (auth, RBAC, traceId injection)
    → kitz_os (orchestration, 5-phase semantic router)
      → kitz-llm-hub (AI provider routing)
      → kitz-payments (credit check/deduction)
      → kitz-whatsapp-connector (reply)  ← also called directly by kitz_os
      → workspace MCP (CRM/orders via Supabase edge function)
```
Note: `kitz_os` calls `kitz-whatsapp-connector` directly at `WA_CONNECTOR_URL` (port 3006), bypassing gateway. `kitz-brain` also calls gateway and LLM hub directly via `fetch`.

### Core Patterns

- **Zero-trust**: Inter-service traffic should route through `kitz-gateway`. Auth via `Authorization` header, org isolation via `x-org-id`, RBAC via `x-scopes`. In practice, some direct calls exist (see data flow).
- **Draft-first**: All outbound messages (WhatsApp, email, voice) are drafts by default. `draftOnly: true` is the default across connectors and notification queue. Nothing sends without explicit approval.
- **AI Battery**: Credit-based AI consumption. 1 credit ≈ 1000 LLM tokens OR 500 ElevenLabs chars. Daily limit: 5 credits (configurable via `AI_BATTERY_DAILY_LIMIT`). ROI rule: if projected ROI < 2x, recommend manual mode.
- **Audit trail**: Every action logged with `traceId` propagation. `EventEnvelope` shape: `{ orgId, userId, source, event, payload, traceId, ts }`.
- **Kill-switch**: `KILL_SWITCH=true` env var halts all AI execution at kernel boot.
- **Constitutional governance**: `KITZ_MASTER_PROMPT.md` defines identity, stakeholder priority, economic model, execution loop, and tone. All AI behavior must align.

## kitz_os — Core AI Engine

Entry: `src/index.ts` → `src/kernel.ts` (KitzKernel boot)

### Tool Registry
`src/tools/registry.ts` — OsToolRegistry wires 14 tool modules (68+ tools total). Tools are invoked via try/catch returning `{ error: "Tool failed: ..." }` on failure.

### 5-Phase Semantic Router
`src/interfaces/whatsapp/semanticRouter.ts`
1. **READ** — Claude Haiku: understand intent
2. **COMPREHEND** — Claude Haiku: classify + extract entities
3. **BRAINSTORM** — Claude Sonnet (complex) or Haiku (simple): tool strategy
4. **EXECUTE** — OpenAI `gpt-4o-mini` preferred, Claude Haiku fallback: tool-use loops
5. **VOICE** — Claude Haiku: format response for WhatsApp delivery

### LLM Tier Routing
`src/llm/claudeClient.ts`
| Tier | Model | Use Case | Fallback |
|------|-------|----------|----------|
| Opus | `claude-opus-4-6` | Strategy, C-suite decisions | `gpt-4o` |
| Sonnet | `claude-sonnet-4-20250514` | Analysis, content generation | `gpt-4o` |
| Haiku | `claude-haiku-4-5-20251001` | Extraction, classification, formatting | `gpt-4o-mini` |

### AI Battery Tracking
`src/aiBattery.ts` — Spend tracked three ways: (1) in-memory ledger, (2) NDJSON file at `data/battery-ledger.ndjson`, (3) Supabase `agent_audit_log` table when configured.

### Cadence Reports
Daily, weekly, monthly, quarterly reports generated by scheduled cron jobs.

## AOS — Agent Operating System

`aos/src/index.ts` — `createAOS()` factory wires EventBus + FileLedgerStore + policies.

### Components
- **EventBus** (`src/eventBus.ts`) — Pub/sub with middleware chain + append-only ledger persistence
- **AgentRegistry** (`src/registry.ts`) — Register agents, enforce ad-hoc spawn limits
- **FileLedgerStore** (`src/ledger/fileStore.ts`) — Append-only NDJSON ledger

### Artifact Lifecycle
Task → Proposal → Decision → Outcome. Every artifact has: `id`, `owner_agent`, timestamps, `related_event_ids`.

### Agent Org Chart
- **C-Suite** (12): CEO, CFO, CMO, COO, CPO, CRO, CTO, HeadCustomer, HeadEducation, HeadEngineering, HeadGrowth, HeadIntelligenceRisk
- **Board** (9): Chair, ConservativeRisk, CustomerVoice, EfficiencyStrategistCN, EthicsTrustGuardian, FounderAdvocate, GrowthVisionary, OperationalRealist, TechFuturist
- **Governance** (9): CapitalAllocation, FeedbackCoach, FocusCapacity, ImpactStrategy, IncentiveAlignment, InstitutionalMemory, NetworkingBot, ParallelSolutions, Reviewer
- **External** (3): CouncilCN, CouncilUS_A, CouncilUS_B

### Policies
`src/policies/` — approvals.ts, focusCapacity.ts, adHocRules.ts, incentiveAlignment.ts, permissions.ts

**Current state**: All 30+ agents are stubs (~89-106 bytes each). CMO is not wired to demand gen or content generation.

## Tech Stack
- **Language**: TypeScript (strict mode), ESM (`"type": "module"`)
- **Runtime**: Node.js 20 + `tsx` for dev
- **Framework**: Fastify 4.x
- **Database**: PostgreSQL 16 (Supabase in production; `DATABASE_URL` env)
- **WhatsApp**: @whiskeysockets/baileys v7.0.0-rc.9
- **AI**: @supabase/supabase-js, Anthropic Claude API, OpenAI API
- **Scheduling**: node-cron
- **Voice**: ElevenLabs TTS
- **Testing**: Vitest (all test files are currently placeholder stubs)
- **Deploy**: Docker + docker-compose (local), Railway (production)
- **CI**: GitHub Actions — `npm ci → typecheck → lint → test` on push/PR to main

## Key Environment Variables
| Variable | Purpose |
|----------|---------|
| `KILL_SWITCH` | `true` halts all AI execution |
| `DEV_TOKEN_SECRET` | Dev-mode auth bypass |
| `GOD_MODE_USER_ID` | Admin-level operations |
| `DATABASE_URL` | PostgreSQL/Supabase connection |
| `AI_BATTERY_DAILY_LIMIT` | Daily credit cap (default: 5) |
| `WA_CONNECTOR_URL` | WhatsApp connector URL (port 3006) |
| `KITZ_OS_URL` | kitz_os URL (port 3012) |
| `WORKSPACE_MCP_URL` | workspace MCP Supabase edge function |

## Dev Commands
```bash
# Run a single service
cd <service> && npm run dev

# Run full stack
docker compose up --build

# Type check any service
cd <service> && npx tsc --noEmit

# Run tests
cd <service> && npm test

# Validate build (all services)
./scripts/validate-build.sh
```

## Key Files

| What | Path |
|------|------|
| Constitutional governance | `KITZ_MASTER_PROMPT.md` |
| Repo audit + delta plan | `Kitz-Repo-Audit.md` |
| Shared contracts (all types) | `kitz-schemas/src/contracts.ts` |
| Core kernel boot | `kitz_os/src/kernel.ts` |
| Tool registry (68+ tools) | `kitz_os/src/tools/registry.ts` |
| 5-phase semantic router | `kitz_os/src/interfaces/whatsapp/semanticRouter.ts` |
| AI Battery tracking | `kitz_os/src/aiBattery.ts` |
| Claude client (tiered routing) | `kitz_os/src/llm/claudeClient.ts` |
| WhatsApp multi-session manager | `kitz-whatsapp-connector/src/sessions.ts` |
| Baileys config | `kitz-whatsapp-connector/src/baileys.ts` |
| Brain policy (finance + growth) | `kitz-brain/src/policy.ts` |
| LLM task router | `kitz-llm-hub/src/router.ts` |
| AOS event bus | `aos/src/eventBus.ts` |
| AOS agent registry | `aos/src/registry.ts` |
| Panama compliance pipeline | `kitz-services/src/compliance-agent/run.ts` |
| Full stack Docker wiring | `docker-compose.yml` |
| Architecture docs | `kitz-docs/ARCHITECTURE.md` |
| Threat model | `kitz-docs/THREAT_MODEL.md` |
| Approval matrix | `kitz-docs/APPROVAL_MATRIX.md` |

## WhatsApp Connector (Production-Ready)
- Uses Baileys v7.0.0-rc.9 (not official WhatsApp Business API)
- Multi-session: each user gets their own WASocket via `src/sessions.ts`
- QR login flow: `/whatsapp/login` page → SSE stream at `/whatsapp/connect` with countdown ring
- Auth state persisted in `auth_info_baileys/<userId>/`
- Follows OpenClaw Baileys patterns (queued credential saves, sync handlers, minimal config)
- `kitz_os` calls connector directly at `WA_CONNECTOR_URL` for inbound message processing
- Admin QR proxy: `admin-kitz-services` forwards SSE to connector
- Production URL: `https://kitzv1-production.up.railway.app`

## Shared Dependencies
All service repos use `kitz-schemas` as a local dependency:
```json
"kitz-schemas": "file:../kitz-schemas"
```
When modifying contracts in `kitz-schemas/src/contracts.ts`, check all consuming services for breakage.

## Safety Rules
- Never expose API keys or secrets in code
- Never bypass the AI Battery credit check — ROI >= 2x or recommend manual
- Never send outbound messages without draft approval (draft-first is non-negotiable)
- The kill-switch (`KILL_SWITCH=true`) must be respected — halts all AI execution
- All actions must be traceable via `traceId`
- Respect constitutional governance defined in `KITZ_MASTER_PROMPT.md`
- `POST /spend` on kitz-payments always returns 403 — credits are deducted via webhooks only
- Never burn AI Battery credits on vanity or exploration without explicit approval

## Codebase State
- **Tests**: All `src/index.test.ts` files are placeholder stubs (~157 bytes). No integration test suite.
- **Database**: PostgreSQL wired in docker-compose but most services use in-memory Maps/arrays. Real DB persistence only in `kitz_os` (Supabase).
- **LLM providers**: Provider files in `kitz-llm-hub` are stubs. Real API call logic lives in `kitz_os/src/llm/`.
- **Payment webhooks**: Check header presence but don't cryptographically verify signatures yet.

## Business Context
- **Target user**: 25-45, LatAm, Spanish-first, sells on WhatsApp/Instagram
- **Two tiers**: Starters (idea only) and Hustlers (already selling informally)
- **Free tier**: workspace.kitz.services — Manual workspace (CRM, Orders, Checkout Links, Tasks, AI Direction) for users + AI agents
- **Paid tier**: AI Battery credits (100/$5, 500/$20, 2000/$60)
- **Activation target**: < 10 minutes to first value (biggest scale risk)
- **Breakthrough moment**: When user sees their own data in the system (identity shift)
- **Tone**: Gen Z clarity + disciplined founder. Direct, concise, no corporate fluff
- **WhatsApp bot**: 5-7 words default, 15-23 max, 30 if complex. Cool, chill, never rude
- **Origin**: Kenneth ran MealKitz (2020-2025), shut down to rebuild with AI → became Kitz
- **Brand energy**: "Just Build It" — permission + push, impatience from empathy
