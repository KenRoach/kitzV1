# kitz_os

Core AI engine for the Kitz platform. Orchestrates tools, LLM routing, and multi-channel responses.

## Port

`3012` (configurable via `PORT` env var)

## Architecture

```
src/
  index.ts          Entry point — boots Fastify server
  kernel.ts         KitzKernel — wires AOS, tools, LLM, cadence
  server.ts         HTTP routes, auth middleware, SSE endpoints
  aiBattery.ts      Credit-based AI consumption tracking
  webhookVerify.ts  Cryptographic webhook signature verification
  logger.ts         Structured logging
  types.d.ts        Global type declarations
  auth/             Authentication helpers
  cadence/          Daily, weekly, monthly, quarterly report generation
  channels/         Multi-channel response formatting (web, WhatsApp, email, SMS, voice)
  interfaces/       Channel-specific interfaces (WhatsApp semantic router)
  llm/              Claude/OpenAI client with tiered routing (Opus/Sonnet/Haiku)
  memory/           Agent memory and context management
  sops/             Standard Operating Procedures store
  tools/            Tool registry — 14 modules wiring 68+ tools
```

## Key Components

- **5-Phase Semantic Router** (`interfaces/whatsapp/semanticRouter.ts`): READ > COMPREHEND > BRAINSTORM > EXECUTE > VOICE
- **Tool Registry** (`tools/registry.ts`): OsToolRegistry wires 14 tool modules
- **AI Battery** (`aiBattery.ts`): Credit ledger — in-memory + NDJSON file + Supabase
- **LLM Client** (`llm/claudeClient.ts`): Tiered routing — Opus (strategy), Sonnet (analysis), Haiku (extraction)

## Dev Commands

```bash
npm run dev       # Start with hot reload (tsx watch)
npm run cli       # CLI interface
npm run tui       # Terminal UI
npm test          # Run all tests (node:test + vitest)
npx tsc --noEmit  # Type check
```

## Environment Variables

See `.env.example` or the root `CLAUDE.md` for the full list. Key vars:

- `PORT` — Server port (default: 3012)
- `CLAUDE_API_KEY` / `ANTHROPIC_API_KEY` — AI provider keys
- `SUPABASE_URL` — Database connection
- `WA_CONNECTOR_URL` — WhatsApp connector (default: `http://localhost:3006`)
- `KILL_SWITCH` — Set `true` to halt all AI execution
- `AI_BATTERY_DAILY_LIMIT` — Daily credit cap (default: 5)

## Tests

- `src/aiBattery.test.ts` — AI Battery credits, spend, recharge (node:test)
- `src/integration-mvp.test.ts` — RLS, webhooks, rate limiter (node:test)
- `src/simulation-10users.test.ts` — 10-user concurrency simulation (node:test)
- `src/channels/responseFormatter.test.ts` — Multi-channel formatting (vitest)
