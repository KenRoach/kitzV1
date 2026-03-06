# AI Agent Frameworks Intelligence SOP v1

**Owner:** CTO Agent
**Type:** technical

## Summary
The AI agent market is $7.84B (2025), projected $52.62B by 2030 (CAGR 46.3%). Kitz operates in this space. This SOP tracks the landscape and best practices.

## Market Context
- 40% of enterprise apps will have task-specific AI agents by end 2026 (up from <5% in 2025)
- Gartner: Agentic AI is the #1 strategic technology trend
- LatAm business process automation market growing rapidly

## Framework Landscape (2025-2026)

### Tier 1 — Production-Ready
| Framework | Strength | Best For |
|-----------|----------|----------|
| **LangChain/LangGraph** | Modular chains, state persistence, memory | Complex multi-step workflows |
| **Anthropic Claude SDK** | Direct Claude control, custom tools, hooks | Kitz backend (primary) |
| **CrewAI** | Multi-agent coordination, role-based | Team simulation, parallel agents |
| **Google ADK** | Gemini integration, 17.8K stars | Google ecosystem projects |

### Tier 2 — Specialized
| Framework | Strength | Best For |
|-----------|----------|----------|
| **AutoGen/Semantic Kernel** | Microsoft unified agent framework (GA Q1 2026) | Enterprise Microsoft stack |
| **LlamaIndex** | Data querying, RAG | Document-heavy workflows |
| **Pydantic AI** | Type-safe agents, state persistence | Python-first teams |

### Kitz's Position
Kitz uses a **homebrew agent system** (AOS — Agent Operating System) with:
- 30+ agent roles (C-Suite, Board, Governance, External)
- EventBus pub/sub + append-only ledger
- Agent registry with ad-hoc spawn limits
- Artifact lifecycle: Task → Proposal → Decision → Outcome

## Production Best Practices

### 1. State Persistence
Agents that can pause, resume, and recover from failures.
- Kitz: NDJSON ledger + Supabase `agent_audit_log`

### 2. Human-in-the-Loop
Approval workflows for high-stakes actions.
- Kitz: Draft-first is non-negotiable. Nothing sends without approval.

### 3. Observability
You can't debug what you can't see.
- Kitz: `traceId` propagation, `EventEnvelope` shape, structured logging

### 4. Memory Systems
Agents that remember context across sessions.
- Kitz: Knowledge base + conversation history + AI Battery ledger

### 5. Security Guardrails
Input validation, output filtering, access controls.
- Kitz: Zero-trust, KILL_SWITCH, AI Battery ROI check (>=2x or manual)

### 6. Model Tier Routing
Use cheapest model that can do the job.
- Kitz: Haiku (extraction) → Sonnet (analysis) → Opus (strategy)

## MCP (Model Context Protocol)

### What It Is
Open standard (Anthropic, Nov 2024) for connecting LLMs to external tools/data. Donated to Linux Foundation's AAIF (Dec 2025). OpenAI adopted it March 2025.

### Key MCP Servers
- **Filesystem** — Secure file operations
- **Git** — Repository tools
- **Memory** — Knowledge graph-based system
- **Sequential Thinking** — Problem-solving
- **ActionKit** — 130+ SaaS integrations (Paragon)

### For Kitz
Build MCP servers for:
- WhatsApp connector (send/receive messages)
- Workspace CRM (contacts, orders, tasks)
- Calendar (homebrew calendar)
- AI Battery (credit check/deduction)
- Panama compliance (invoice generation, DGI validation)

## Rules
- Always use the cheapest model that gets the job done
- State persistence for every agent action (no fire-and-forget)
- Human approval for anything that costs money or contacts a customer
- TraceId on everything — if it can't be traced, it didn't happen
- Kill switch must always work — KILL_SWITCH=true halts all AI
