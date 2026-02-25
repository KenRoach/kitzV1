# Agent Frameworks & AI Orchestration Intelligence

> **Classification:** Strategic Architecture Intelligence
> **Last Updated:** 2026-02-24
> **Audience:** Kitz Engineering, Product, C-Suite Agents
> **Status:** Active

---

## Executive Summary

Kitz operates a custom-built **Agent Operating System (AOS)** with 106 agents organized into 18 teams, powered by Claude (tiered Opus/Sonnet/Haiku) with OpenAI fallback. This document maps Kitz's AOS against the major multi-agent frameworks, tool protocol standards, and workflow automation platforms in the ecosystem.

**Key findings:**
- Kitz's AOS is architecturally more advanced than most open-source frameworks in its governance model (board, C-suite, team hierarchy) and permission system (tool bridge with tier-based access control).
- The gap is in **deterministic workflow orchestration** (LangGraph), **conversation memory patterns** (LangChain), and **protocol interoperability** (MCP).
- CrewAI is the closest conceptual match to Kitz's role-based team model, but Kitz's implementation is significantly more sophisticated.
- MCP adoption should be the highest-priority integration -- Kitz already has a `mcpClient.ts` that speaks JSON-RPC 2.0 to a workspace MCP server. Expanding this to expose Kitz tools as MCP servers enables ecosystem integration.

---

## Table of Contents

1. [Kitz AOS Architecture Reference](#1-kitz-aos-architecture-reference)
2. [Multi-Agent Frameworks](#2-multi-agent-frameworks)
   - [AutoGen (Microsoft)](#21-autogen-microsoft)
   - [LangGraph](#22-langgraph)
   - [LangChain](#23-langchain)
   - [CrewAI](#24-crewai)
3. [Tool & Protocol Standards](#3-tool--protocol-standards)
   - [MCP (Model Context Protocol)](#31-mcp-model-context-protocol)
   - [ToolSchema to MCP Mapping](#32-toolschema-to-mcp-mapping)
4. [Workflow Automation Platforms](#4-workflow-automation-platforms)
   - [n8n (Current Integration)](#41-n8n-current-integration)
   - [Zapier](#42-zapier)
   - [Make (Integromat)](#43-make-integromat)
5. [Competitive Analysis](#5-competitive-analysis)
6. [Recommended Architectural Improvements](#6-recommended-architectural-improvements)
7. [MCP Adoption Roadmap](#7-mcp-adoption-roadmap)
8. [n8n Advanced Patterns](#8-n8n-advanced-patterns)

---

## 1. Kitz AOS Architecture Reference

Before comparing external frameworks, this section documents Kitz's current architecture as the baseline.

### 1.1 Agent Hierarchy

```
                        ┌─────────┐
                        │  Board  │  8 agents (Chair, Growth Visionary,
                        │ (tier)  │  Operational Realist, Ethics Guardian, ...)
                        └────┬────┘
                             │
                     ┌───────┴───────┐
                     │   C-Suite     │  7 agents (CEO, CFO, CMO, COO, CPO, CRO, CTO)
                     │   (tier)      │  + HeadCustomer, HeadEducation, HeadEngineering,
                     └───────┬───────┘    HeadGrowth, HeadIntelligenceRisk
                             │
              ┌──────────────┼──────────────┐
              │              │              │
      ┌───────┴──────┐ ┌────┴────┐  ┌──────┴───────┐
      │  Governance  │ │External │  │   Guardians  │
      │  9 agents    │ │3 agents │  │  15 agents   │
      │  (PMO, etc.) │ │(Council)│  │  (per-svc)   │
      └──────────────┘ └─────────┘  └──────────────┘
                             │
                   ┌─────────┴─────────┐
                   │   18 Operational  │
                   │      Teams        │
                   │  ~5-6 agents each │
                   └───────────────────┘
```

### 1.2 Core Primitives

| Primitive | Implementation | File |
|-----------|---------------|------|
| **Agent base class** | `BaseAgent` with publish, sendMessage, handoff, escalate, invokeTool | `aos/src/agents/baseAgent.ts` |
| **Event bus** | Pub/sub with middleware pipeline, ledger persistence | `aos/src/eventBus.ts` |
| **Tool registry** | `OsToolRegistry` with 32+ tool modules, dynamic registration | `kitz_os/src/tools/registry.ts` |
| **Tool bridge** | Tier + team permission enforcement between AOS agents and OS tools | `aos/src/toolBridge.ts` |
| **Swarm handoff** | Context-accumulating agent-to-agent handoffs with trace IDs | `aos/src/swarm/handoff.ts` |
| **Swarm runner** | Batch team execution with concurrency control, timeout, progress callbacks | `aos/src/swarm/swarmRunner.ts` |
| **Knowledge bridge** | Swarm findings flow to shared memory via event bus | `aos/src/swarm/knowledgeBridge.ts` |
| **LLM client** | Tiered Claude routing (Opus/Sonnet/Haiku) with OpenAI fallback | `kitz_os/src/llm/claudeClient.ts` |
| **MCP client** | JSON-RPC 2.0 HTTP calls to workspace MCP server | `kitz_os/src/tools/mcpClient.ts` |
| **Kernel** | Boot, tool registration, AOS wiring, cadence engine, server | `kitz_os/src/kernel.ts` |

### 1.3 Communication Channels

Kitz AOS supports five message channels (defined in `types.ts`):

| Channel | Purpose | Example |
|---------|---------|---------|
| `intra-team` | Within a team | Sales Lead -> Sales Member |
| `cross-team` | Between teams | Marketing -> Sales handoff |
| `escalation` | Bottom-up to C-Suite | Any agent -> CEO |
| `war-room` | Crisis coordination | Multi-agent incident response |
| `broadcast` | One-to-many | System-wide kill switch |

### 1.4 Tool Permission Model

The `AgentToolBridge` enforces a layered permission system:

- **READ_TOOLS** (63 tools) -- available to all agents
- **CRM_WRITE_TOOLS** -- sales-crm team + C-suite
- **OUTBOUND_TOOLS** -- draft-first, C-suite or explicit scope
- **PAYMENT_TOOLS** -- CFO/CRO only
- **CONTENT_TOOLS** -- marketing, content, AI teams
- **N8N_TOOLS** -- platform-eng, devops-ci, C-suite
- **CRITICAL_TOOLS** -- require per-agent approval (CTO/HeadEngineering)
- **LLM_TOOLS** -- C-suite, board, AI-ML, strategy teams

---

## 2. Multi-Agent Frameworks

### 2.1 AutoGen (Microsoft)

**What it is:** An open-source framework for building multi-agent systems where LLM-backed agents can converse with each other, execute code, and use tools. Originally focused on conversational agents in group chat patterns; v0.4+ (AG2 fork and Microsoft's AutoGen 0.4) shifted to an event-driven, modular architecture.

**Architecture pattern:**
- **Agents** are autonomous units that receive and send messages
- **Group Chat** is the core coordination pattern -- agents take turns in a conversation, with a manager agent selecting the next speaker
- **Tool Use** via function calling -- agents can invoke registered Python functions
- **Code Execution** is a first-class citizen (agents can write and run code)
- **Event-driven runtime** (v0.4+) with topics, subscriptions, and agent lifecycle management
- **Termination conditions** that define when a multi-agent conversation should end

**Comparison with Kitz AOS:**

| Dimension | AutoGen | Kitz AOS | Verdict |
|-----------|---------|----------|---------|
| **Agent coordination** | Group chat with speaker selection | Event bus + handoff protocol | Kitz is more structured; AutoGen is more flexible |
| **Hierarchy** | Flat (all agents are peers in a chat) | Deep hierarchy (board -> C-suite -> team) | Kitz's hierarchy mirrors a real organization, better for governance |
| **Tool invocation** | Function registration, any agent can call | Permission-gated tool bridge by tier/team | Kitz's permission model is production-grade |
| **State management** | Conversation history as shared state | EventBus + MemoryStore + LedgerStore | Kitz has richer state primitives |
| **Code execution** | Built-in Docker sandbox | Not native (artifact generation exists) | AutoGen advantage for code-gen use cases |
| **Observability** | Basic logging | Trace IDs, event ledger, CTO digest | Kitz is stronger |

**Adoptable patterns:**

1. **Speaker Selection Strategies** -- AutoGen's `round_robin`, `random`, and custom speaker selection could inspire Kitz's scenario routing. Currently `classifyScenario()` uses keyword matching; a learned speaker selection model would be more robust.

2. **Termination Conditions** -- AutoGen explicitly defines when conversations end (max turns, text match, token limit). Kitz's swarm runs use timeout-based termination. Adding declarative termination conditions to `SwarmRunner` would improve reliability.

3. **Nested Conversations** -- AutoGen allows an agent in one group chat to spawn a sub-conversation with different agents. Kitz's war room concept is similar but could be generalized into a reusable nested-swarm primitive.

4. **Human-in-the-Loop** -- AutoGen's `UserProxyAgent` pattern where a human can intervene mid-conversation. Kitz's draft approval system (`Draft` with approve/reject) is a good start but could be extended to arbitrary human checkpoints.

**Integration path:** AutoGen is Python-only. Direct integration is unlikely given Kitz's TypeScript stack. The patterns are more valuable than the library itself. Consider porting AutoGen's speaker selection logic into the `classifyScenario` system.

**Priority:** **Future** -- Pattern adoption over library integration.

---

### 2.2 LangGraph

**What it is:** A framework for building stateful, multi-step agent workflows as directed graphs. Built on top of LangChain but focused on deterministic control flow rather than free-form agent reasoning.

**Architecture pattern:**
- **State graph** -- Nodes are functions/agents, edges are transitions. State flows through the graph.
- **Conditional edges** -- Route based on state content (if/else branching)
- **Cycles allowed** -- Agents can loop back for retry/refinement
- **Checkpointing** -- Built-in state persistence for long-running workflows
- **Human-in-the-loop** -- Interrupt graph execution, inject human decisions, resume
- **Streaming** -- Stream intermediate results as nodes complete
- **Subgraphs** -- Compose complex workflows from reusable graph components

**Comparison with Kitz AOS:**

| Dimension | LangGraph | Kitz AOS | Verdict |
|-----------|-----------|----------|---------|
| **Workflow definition** | Explicit state graph (nodes + edges) | Implicit via scenario chains + event handlers | LangGraph is far more explicit and debuggable |
| **State management** | Typed state schema flows through graph | Scattered across MemoryStore, EventBus payloads | LangGraph's approach is cleaner |
| **Branching/loops** | First-class conditional edges, cycles | Keyword-based scenario matching, no explicit loops | LangGraph advantage |
| **Persistence** | Built-in checkpointing with multiple backends | Event ledger + file store | Similar capability, different design |
| **Composability** | Subgraph nesting | SwarmRunner batches teams, no graph nesting | LangGraph advantage |
| **Debugging** | Visual graph rendering, LangSmith integration | Trace IDs, structured logging | LangGraph has better tooling |

**Adoptable patterns:**

1. **Explicit Agent Flow Graphs** -- This is the highest-value pattern to adopt. Kitz's `agentScenarios.ts` defines linear chains:
   ```typescript
   // Current Kitz pattern (linear chain)
   chain: [
     { agent: 'The Closer', tool: 'crm_listContacts' },
     { agent: 'Lead Checker', tool: 'crm_getContact' },
     { agent: 'Pipeline Mover', tool: 'crm_updateContact' },
   ]
   ```
   LangGraph would model this as a graph with conditional edges:
   ```
   The Closer -> [lead found?] -> Lead Checker -> [score > 70?] -> Pipeline Mover
                                                   [score <= 70] -> Follow-Up Writer
   ```
   Adding conditional branching to Kitz's scenario chains would make agent orchestration dramatically more intelligent.

2. **Typed State Schemas** -- LangGraph enforces a typed state object that accumulates as it flows through nodes. Kitz's `SwarmHandoff.context` is an untyped `Record<string, unknown>`. Defining per-scenario state schemas would improve reliability:
   ```typescript
   interface SalesFlowState {
     contacts: Contact[];
     leadScore?: number;
     selectedContact?: Contact;
     followUpDraft?: string;
     paymentLink?: string;
   }
   ```

3. **Checkpointing for Long-Running Flows** -- Kitz's cadence engine runs daily/weekly/monthly reports. These could be modeled as resumable graphs with checkpoints, enabling restart from the last successful step after failures.

4. **Streaming Progress** -- LangGraph's streaming model where each node completion emits progress aligns with Kitz's `AgentThinkingStore` UI pattern. Formalizing this as a graph-level concern (rather than a UI-level approximation) would unify the backend and frontend models.

**Integration path:** LangGraph is Python-first with a LangGraph.js TypeScript port. The TypeScript version could be evaluated for specific workflow-heavy use cases (sales funnel, campaign orchestration). More practically, adopt the graph-based thinking pattern and implement a lightweight `FlowGraph` abstraction natively in Kitz.

**Priority:** **Next Quarter** -- The state-graph pattern is the single highest-value architectural improvement Kitz can make.

---

### 2.3 LangChain

**What it is:** The most widely adopted LLM application framework. Provides abstractions for chains, tools, memory, retrieval, and agent loops. LangChain acts as the "standard library" for LLM apps.

**Architecture pattern:**
- **Chains** -- Composable sequences of LLM calls and tool invocations
- **Tools** -- Standardized interface for anything an agent can invoke
- **Memory** -- Conversation memory with multiple backends (buffer, summary, vector)
- **Retrievers** -- RAG patterns for grounding agent responses in data
- **Agents** -- ReAct-style tool-use loops (observe -> think -> act -> repeat)
- **Callbacks** -- Observability hooks at every step of execution

**Comparison with Kitz AOS:**

| Dimension | LangChain | Kitz AOS | Verdict |
|-----------|-----------|----------|---------|
| **Tool interface** | `Tool(name, description, func)` | `ToolSchema(name, description, parameters, riskLevel, execute)` | Kitz's `riskLevel` is unique and valuable |
| **Memory** | Buffer, Summary, Vector, Entity, ConversationKG | MemoryStore (flat in-memory) | LangChain has much richer memory options |
| **LLM abstraction** | Provider-agnostic with 100+ integrations | Claude-primary with OpenAI fallback | Kitz is leaner and more intentional |
| **Retrieval** | Full RAG pipeline (loaders, splitters, vectorstores) | SOP store + memory search | LangChain is far more complete |
| **Agent loop** | ReAct (observe-think-act) with built-in retry | Semantic router -> tool execution -> response | Different patterns; Kitz is more direct |
| **Ecosystem** | Massive (thousands of integrations) | Purpose-built for Kitz's domain | LangChain wins on breadth |

**Adoptable patterns:**

1. **Conversation Memory Architecture** -- LangChain's memory types solve problems Kitz will face as conversations get longer:
   - **Buffer Memory** -- Keep last N messages (Kitz currently does this implicitly)
   - **Summary Memory** -- Summarize older messages to compress context (adopt this for WhatsApp conversations that span days)
   - **Entity Memory** -- Track key entities (contacts, deals) mentioned in conversation (adopt this for the CRM agent to maintain context about the customer being discussed)
   - **Vector Memory** -- Semantic search over past conversations (Kitz has `memory_search` but it could be richer)

   **Recommended implementation:** Add a `ConversationMemory` layer to the semantic router that maintains per-user conversation state with automatic summarization when context exceeds token limits.

2. **Tool Description Standards** -- LangChain's tool descriptions are optimized for LLM tool selection. Kitz's tool descriptions are written for human developers. Rewriting tool descriptions with the LLM-as-reader in mind would improve the semantic router's tool selection accuracy.

   Example improvement:
   ```typescript
   // Current
   description: 'List all n8n workflows, optionally filtered by active status'
   // LLM-optimized
   description: 'Search and list automation workflows. Use when the user asks about their automations, active workflows, or wants to see what processes are running automatically.'
   ```

3. **Callback System** -- LangChain's callback architecture (on_llm_start, on_tool_start, on_chain_end, etc.) provides fine-grained observability. Kitz's trace ID system is good but lacks structured callbacks. Adding a callback protocol to `OsToolRegistry.invoke()` would enable:
   - Real-time token usage tracking per tool invocation
   - AI battery consumption attribution per agent
   - Performance profiling per workflow step

4. **Output Parsers** -- LangChain's structured output parsers (JSON, Pydantic, list, etc.) solve the common problem of getting reliable structured data from LLMs. Kitz's semantic router could benefit from structured output parsing when agents need to produce data (not just text).

**Integration path:** LangChain.js (TypeScript) is mature. Specific components can be imported without buying into the full framework:
- `@langchain/core` for tool and memory abstractions
- `@langchain/anthropic` for Claude-specific optimizations (already handled by `claudeClient.ts`)

More practically, adopt the patterns (especially memory architecture) without the dependency.

**Priority:** **Now** -- Conversation memory patterns are immediately actionable. Tool description optimization can be done incrementally.

---

### 2.4 CrewAI

**What it is:** A role-based multi-agent framework where agents are defined by their role, goal, and backstory. Agents collaborate on "tasks" within a "crew" using delegation and tool use.

**Architecture pattern:**
- **Agent** -- Defined by `role`, `goal`, `backstory`, `tools[]`, `allow_delegation`
- **Task** -- A unit of work with `description`, `expected_output`, `agent` (assigned)
- **Crew** -- A group of agents with a `process` (sequential or hierarchical)
- **Delegation** -- Agents can delegate subtasks to other agents mid-execution
- **Sequential process** -- Tasks execute in order, each agent handles one task
- **Hierarchical process** -- A manager agent assigns tasks dynamically
- **Memory** -- Short-term (conversation), long-term (persistent), entity memory

**Comparison with Kitz AOS:**

This is the most direct comparison. CrewAI and Kitz AOS share the same mental model: role-based agents organized into teams, with delegation and tool use.

| Dimension | CrewAI | Kitz AOS | Verdict |
|-----------|--------|----------|---------|
| **Agent definition** | role + goal + backstory | BaseAgent class with team, tier, scope | Kitz is more structured (class hierarchy) |
| **Team model** | Crew with flat list of agents | 18 named teams with leads and members | Kitz is more realistic org design |
| **Hierarchy** | 2 levels (manager + workers) | 7 tiers (board -> c-suite -> governance -> external -> team -> guardian -> coach) | Kitz is far deeper |
| **Delegation** | Built-in `allow_delegation` flag | Handoff protocol with context accumulation | Kitz's handoff is more sophisticated |
| **Process types** | Sequential, Hierarchical | Event-driven + scenario chains + swarm batches | Kitz is more flexible |
| **Tool permissions** | All agents access all tools | Tier + team permission matrix (toolBridge) | Kitz is production-grade |
| **Memory** | Short-term, Long-term, Entity | MemoryStore + EventBus ledger + SOP store | Comparable |
| **Observability** | Callbacks, verbose mode | Trace IDs, CTO digest, structured logging | Kitz is stronger |
| **Human oversight** | `human_input` flag on tasks | Draft approve/reject, kill switch, war rooms | Kitz has richer governance |
| **Launch readiness** | Not applicable | 33-agent launch review with go/no-go votes | Unique to Kitz |

**Detailed comparison -- what CrewAI does better:**

1. **Explicit task output typing** -- CrewAI tasks declare `expected_output` as a string description, and can use Pydantic models for structured output. Kitz's tool responses are untyped (`Promise<unknown>`). Adding output schemas to `ToolSchema` would improve agent chaining reliability.

2. **Delegation as a first-class concept** -- CrewAI agents can decide at runtime to delegate work to another agent. Kitz's handoff system requires the agent to explicitly call `this.handoff()`. Making delegation emergent (the LLM decides to delegate based on its role assessment) would make agent collaboration more natural.

3. **Backstory-driven agent behavior** -- CrewAI's `backstory` field provides personality and context to the LLM. Kitz's agent system prompts are minimal (`You are the ${agentType.toUpperCase()} agent for KITZ`). Richer agent personas would improve response quality, especially for customer-facing agents.

4. **Process abstraction** -- CrewAI's `Process.sequential` and `Process.hierarchical` are clean abstractions. Kitz's process model is implicit (scenario chains are sequential, swarm runner is concurrent). Making process type a first-class concept would improve workflow design.

**What Kitz does better:**

1. **Governance model** -- CrewAI has no concept of board oversight, launch reviews, or kill switches. Kitz's governance is enterprise-grade.
2. **Tool permissions** -- CrewAI gives all agents access to all tools. Kitz's `AgentToolBridge` enforces least-privilege access by tier and team.
3. **War rooms** -- CrewAI has no crisis coordination mechanism.
4. **Guardian agents** -- Kitz's per-service guardian agents with self-repair capabilities have no CrewAI equivalent.
5. **Cadence engine** -- Scheduled agent actions (daily standup, weekly scorecard) are not a CrewAI concept.
6. **Event-driven architecture** -- CrewAI is request-response. Kitz's EventBus enables reactive, event-driven agent behavior.

**Adoptable patterns:**

1. **Structured Agent Profiles** -- Adopt CrewAI's role/goal/backstory model for all 106 Kitz agents. Create a `agentProfile.ts` that enriches the `AgentConfig` type:
   ```typescript
   interface AgentProfile extends AgentConfig {
     goal: string;          // "Maximize conversion rate for qualified leads"
     backstory: string;     // "You're a seasoned sales closer who has..."
     personality: string;   // "Direct, data-driven, encouraging"
     expectedOutputFormat?: string; // "JSON with {action, reason, nextSteps}"
   }
   ```

2. **Task-based execution** -- Wrap agent work in typed Task objects with expected outputs, deadlines, and dependencies. This bridges the gap between Kitz's event-driven model and a more structured task queue.

3. **Delegation chains** -- Allow agents to dynamically decide to delegate rather than requiring explicit handoff calls. Implement via LLM tool calling: give each agent a `delegate_to` tool that routes to another agent.

**Integration path:** CrewAI is Python-only. No direct integration. Pattern adoption is the strategy.

**Priority:** **Now** -- Agent profile enrichment (backstory/goal) is a quick win. Task abstraction is next-quarter.

---

## 3. Tool & Protocol Standards

### 3.1 MCP (Model Context Protocol)

**What it is:** Anthropic's open standard for connecting LLM applications to external tools and data sources. MCP defines a JSON-RPC 2.0 protocol where:
- **MCP Servers** expose tools, resources, and prompts
- **MCP Clients** (LLM apps) discover and invoke them
- Transport is flexible (stdio, HTTP/SSE, WebSocket)

**Core MCP concepts:**

| Concept | Description | Kitz Equivalent |
|---------|-------------|-----------------|
| **Server** | Exposes capabilities | `OsToolRegistry` (tools), `SOP store` (resources) |
| **Client** | Discovers and calls servers | `mcpClient.ts` (already implemented) |
| **Tool** | Executable function with JSON Schema params | `ToolSchema` interface |
| **Resource** | Read-only data source (files, DB rows) | Memory store, SOP entries, CRM contacts |
| **Prompt** | Reusable prompt template | Agent system prompts in `claudeClient.ts` |
| **Sampling** | Server requests LLM completion from client | Not implemented |

**Current Kitz MCP status:**

Kitz already has a working MCP client (`mcpClient.ts`) that:
- Speaks JSON-RPC 2.0 over HTTP
- Calls `tools/call` on a workspace MCP server
- Passes `user_id` for Supabase RLS enforcement
- Handles API key auth via `x-api-key` header
- Supports trace ID propagation

**What Kitz is missing:**

1. **MCP Server** -- Kitz does not expose its 60+ tools as an MCP server. This means external MCP clients (Claude Desktop, other AI apps) cannot use Kitz's tools.

2. **Resource exposure** -- Kitz's CRM contacts, SOPs, conversation memory, and business metrics could be exposed as MCP resources, enabling external AI assistants to read Kitz data.

3. **Tool discovery** -- The MCP `tools/list` method allows clients to discover available tools at runtime. Kitz's `OsToolRegistry.list()` could serve this.

4. **Prompt templates** -- Kitz's agent system prompts could be exposed as MCP prompts, allowing external clients to use Kitz's specialized agent personas.

5. **Sampling** -- MCP's sampling protocol allows servers to request LLM completions from the client. This could enable Kitz tools to leverage the calling app's LLM budget rather than Kitz's own AI battery.

**Strategic value of MCP adoption:**

- **Ecosystem integration** -- Any MCP-compatible client (Claude Desktop, Cursor, Windsurf, custom apps) could use Kitz's business tools
- **Partner integrations** -- LatAm service providers could connect to Kitz via MCP without building custom APIs
- **Agent interoperability** -- External agent frameworks (LangChain, AutoGen) have MCP adapters, enabling cross-framework agent collaboration
- **Standard protocol** -- Avoids vendor lock-in on the tool-call interface

### 3.2 ToolSchema to MCP Mapping

Kitz's existing `ToolSchema` maps cleanly to MCP's tool specification:

```typescript
// ── Kitz ToolSchema (current) ──
interface ToolSchema {
  name: string;
  description: string;
  parameters: Record<string, unknown>;     // JSON Schema
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  execute: (args: Record<string, unknown>, traceId?: string) => Promise<unknown>;
}

// ── MCP Tool Spec ──
interface MCPTool {
  name: string;
  description: string;
  inputSchema: {                            // JSON Schema
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

// ── MCP Tool Call ──
interface MCPToolCall {
  method: 'tools/call';
  params: {
    name: string;
    arguments: Record<string, unknown>;
  };
}

// ── MCP Tool Result ──
interface MCPToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}
```

**Field mapping:**

| Kitz ToolSchema | MCP Tool Spec | Mapping Strategy |
|-----------------|---------------|-----------------|
| `name` | `name` | Direct 1:1 |
| `description` | `description` | Direct 1:1 |
| `parameters` | `inputSchema` | Rename key; Kitz already uses JSON Schema format |
| `riskLevel` | *(no equivalent)* | Expose as custom metadata in annotations |
| `execute()` | *(server-side)* | MCP server handler calls `execute()` internally |

**Implementation: Kitz as MCP Server**

```typescript
// Proposed: kitz_os/src/mcpServer.ts

import { OsToolRegistry, ToolSchema } from './tools/registry.js';

export function toolSchemaToMCP(tool: ToolSchema): MCPTool {
  return {
    name: tool.name,
    description: tool.description,
    inputSchema: {
      type: 'object',
      ...tool.parameters,
    },
    // MCP annotations for risk level (custom extension)
    annotations: {
      'x-kitz-risk-level': tool.riskLevel,
    },
  };
}

export function handleToolsList(registry: OsToolRegistry): MCPTool[] {
  return registry.list().map(toolSchemaToMCP);
}

export async function handleToolCall(
  registry: OsToolRegistry,
  name: string,
  args: Record<string, unknown>,
  traceId?: string,
): Promise<MCPToolResult> {
  const result = await registry.invoke(name, args, traceId);

  // Wrap result in MCP content format
  return {
    content: [{
      type: 'text',
      text: typeof result === 'string' ? result : JSON.stringify(result),
    }],
    isError: result && typeof result === 'object' && 'error' in result,
  };
}
```

**MCP Resource exposure candidates:**

| Kitz Data | MCP Resource URI | Description |
|-----------|-----------------|-------------|
| CRM contacts | `kitz://crm/contacts` | Customer list with segments |
| Business metrics | `kitz://dashboard/metrics` | Revenue, leads, conversion |
| SOPs | `kitz://sops/{id}` | Standard operating procedures |
| Agent status | `kitz://agents/status` | All 106 agent states |
| Conversation memory | `kitz://memory/{userId}` | Per-user conversation history |
| n8n workflows | `kitz://workflows` | Automation workflow list |

---

## 4. Workflow Automation Platforms

### 4.1 n8n (Current Integration)

**Current Kitz-n8n integration:**

Kitz has a full n8n integration (`n8nClient.ts` + `n8nTools.ts`) with 7 tools:
- `n8n_listWorkflows` -- List all workflows
- `n8n_getWorkflow` -- Get workflow details
- `n8n_executeWorkflow` -- Execute by ID with input data
- `n8n_triggerWebhook` -- Trigger webhook-based workflows
- `n8n_activateWorkflow` -- Activate/deactivate workflows
- `n8n_getExecutions` -- Execution history
- `n8n_healthCheck` -- Health monitoring

**Architecture pattern:**
- **Nodes** -- Individual operations (HTTP request, database query, LLM call)
- **Workflows** -- Directed graphs of nodes with data flowing between them
- **Triggers** -- Webhook, cron, manual, event-based
- **Credentials** -- Centralized secret management per integration
- **Error handling** -- Per-node error workflows, retry logic
- **Sub-workflows** -- Composable workflow nesting
- **AI Agent node** -- Native LLM agent with tool use (since n8n v1.x)

**Comparison with Kitz AOS:**

| Dimension | n8n | Kitz AOS | Verdict |
|-----------|-----|----------|---------|
| **Workflow design** | Visual drag-and-drop builder | Code-defined scenario chains | n8n is more accessible for non-developers |
| **Integration breadth** | 400+ community nodes | 32+ tool modules (purpose-built) | n8n wins on breadth; Kitz wins on depth |
| **AI integration** | AI Agent node, LangChain node | Native Claude integration, 106 agents | Kitz is AI-native |
| **Error handling** | Per-node error workflows, retry | Try-catch in tool execution | n8n is more robust |
| **Self-hosted** | Yes (Docker) | Yes (Cloud Run) | Equal |
| **Pricing** | Free (self-hosted), paid cloud | Included in Kitz | n8n adds cost for cloud |
| **Version control** | Workflow JSON export/import | Git-tracked TypeScript | Kitz is more developer-friendly |

**Advanced n8n patterns to implement:**

See [Section 8](#8-n8n-advanced-patterns) for detailed patterns.

**Priority:** **Now** -- Already integrated. Focus on advanced patterns.

---

### 4.2 Zapier

**What it is:** The dominant workflow automation platform (6,000+ app integrations). SaaS-only, no self-hosting.

**Architecture pattern:**
- **Zaps** -- Trigger + one or more action steps
- **Multi-step Zaps** -- Sequential chains with filters and paths
- **Paths** -- Conditional branching (if/else)
- **Formatter** -- Data transformation between steps
- **Webhooks** -- Custom trigger/action via HTTP
- **Tables** -- Built-in database for workflow state
- **Canvas** -- Visual builder for complex automations (2025+)
- **AI Actions** -- LLM steps within Zaps
- **Transfer** -- Cross-workspace workflow sharing

**Comparison with Kitz AOS:**

| Dimension | Zapier | Kitz AOS | Verdict |
|-----------|--------|----------|---------|
| **App ecosystem** | 6,000+ integrations | 32 tool modules, n8n for breadth | Zapier wins dramatically on integrations |
| **Pricing** | $20-100+/mo per user, task-based billing | Included in Kitz | Kitz is more cost-effective |
| **AI capability** | AI actions within Zaps | 106 specialized agents | Kitz is far more AI-native |
| **Customization** | Limited (visual builder only) | Full code control | Kitz wins |
| **LatAm integrations** | Limited (no Yappy, limited WhatsApp) | Built for LatAm (Yappy, WhatsApp, local payment) | Kitz wins for target market |
| **Data residency** | US-based SaaS | Self-hosted, configurable | Kitz wins for compliance |

**Adoptable patterns:**

1. **Task-based billing model** -- Zapier charges per "task" (trigger + actions). Kitz's AI Battery concept is analogous. Studying Zapier's task counting and tier structure can inform Kitz's pricing model:
   - Free: 100 tasks/month
   - Starter: 750 tasks/month
   - Professional: 2,000 tasks/month
   - Team: 50,000 tasks/month

2. **Pre-built templates (Zap Templates)** -- Zapier offers thousands of pre-built workflows. Kitz could offer "Kitz Recipes" -- pre-configured agent chains for common LatAm business scenarios:
   - "New WhatsApp lead -> CRM entry -> Follow-up sequence"
   - "Payment received -> Invoice generated -> WhatsApp confirmation"
   - "Inventory low -> Supplier notification -> Price update"

3. **Multi-step paths with filters** -- Zapier's path branching is clean. Kitz's scenario chains are linear. Adopting path-based branching aligns with the LangGraph recommendation above.

4. **Webhook-first integration pattern** -- Zapier's webhook integration pattern is a proven way to connect with services that don't have native integrations. Kitz's `n8n_triggerWebhook` provides this, but it could be elevated to a first-class Kitz feature for user-defined integrations.

**Integration path:** No direct integration needed. Zapier and Kitz serve similar purposes -- Kitz is the LatAm-specific, AI-native alternative. Study Zapier for UX patterns and template design.

**Priority:** **Future** -- Pattern study for pricing and template design.

---

### 4.3 Make (Integromat)

**What it is:** A visual workflow automation platform with a scenario-based design model. Known for its powerful visual builder and data transformation capabilities.

**Architecture pattern:**
- **Scenarios** -- Visual workflow canvases with modules connected by routes
- **Modules** -- Triggers, actions, searches, aggregators, iterators
- **Routes** -- Parallel execution paths (fan-out)
- **Filters** -- Conditional gates between modules
- **Data Store** -- Built-in key-value store for workflow state
- **Webhooks** -- Custom HTTP triggers and responses
- **Error Handlers** -- Resume, rollback, commit, break error patterns
- **Scheduling** -- Cron-based with interval control

**Comparison with Kitz AOS:**

| Dimension | Make | Kitz AOS | Verdict |
|-----------|------|----------|---------|
| **Visual design** | Best-in-class visual builder | Code-only | Make wins on visual design |
| **Data transformation** | Powerful built-in functions, iterators, aggregators | Basic tool chaining | Make is more flexible for ETL |
| **Error handling** | 4 error handler types (resume, rollback, commit, break) | Try-catch per tool | Make is more robust |
| **Parallel execution** | Routes enable fan-out | SwarmRunner batches teams concurrently | Comparable |
| **Pricing** | Operation-based ($9-30/mo) | Included in Kitz | Kitz is more cost-effective |
| **AI integration** | HTTP modules for API calls, some native AI | 106 specialized agents | Kitz is AI-native |

**Adoptable patterns:**

1. **Error handler taxonomy** -- Make's four error handler types are a well-designed pattern:
   - **Resume** -- Log error, continue with default value
   - **Rollback** -- Undo all operations in the scenario
   - **Commit** -- Save partial results, stop execution
   - **Break** -- Retry the operation after a delay

   Kitz's tool execution currently uses try-catch with generic error returns. Adopting Make's error taxonomy in the `OsToolRegistry` would improve reliability:

   ```typescript
   interface ToolErrorHandler {
     strategy: 'resume' | 'rollback' | 'commit' | 'break';
     maxRetries?: number;
     retryDelayMs?: number;
     fallbackValue?: unknown;
   }
   ```

2. **Aggregator pattern** -- Make has built-in aggregator modules that collect outputs from multiple iterations into a single bundle. Kitz's `FeedbackAggregator` in the swarm system does something similar, but the pattern could be generalized:
   - Collect results from multiple agent tool calls
   - Merge, deduplicate, and structure the output
   - Pass the aggregated result to the next agent

3. **Data Store for workflow state** -- Make's built-in Data Store is a simple key-value store scoped to a scenario. Kitz's `MemoryStore` serves a similar purpose but is global. Adding scenario-scoped state (per conversation, per workflow run) would reduce state collision between concurrent agent runs.

4. **Visual scenario builder** -- While Kitz is code-first, offering a visual scenario builder in the admin UI would enable business users to create custom agent workflows. This aligns with the "meta-tooling" design doc and the `toolFactoryTools.ts` concept of runtime tool creation.

**Integration path:** Make's HTTP module pattern can connect to Kitz via webhooks. No direct SDK integration needed. Pattern adoption is the primary value.

**Priority:** **Future** -- Error handler taxonomy is worth adopting now; visual builder is a long-term UI project.

---

## 5. Competitive Analysis

### Kitz AOS vs. Major Frameworks

```
                    Agent       Tool         Workflow        Production     LatAm
                    Hierarchy   Permissions  Determinism     Governance     Focus
                    ─────────   ───────────  ───────────     ──────────     ─────
Kitz AOS            █████       █████        ██░░░           █████          █████
AutoGen             █░░░░       █░░░░        ██░░░           █░░░░          ░░░░░
LangGraph           ██░░░       █░░░░        █████           ██░░░          ░░░░░
LangChain           ██░░░       ██░░░        ███░░           ███░░          ░░░░░
CrewAI              ███░░       ██░░░        ███░░           ██░░░          ░░░░░
n8n                 █░░░░       ██░░░        ████░           ███░░          ██░░░
Zapier              █░░░░       █░░░░        ████░           ███░░          █░░░░
Make                █░░░░       ██░░░        ████░           ███░░          █░░░░
```

### Kitz AOS Strengths (Defensible)

1. **Organizational hierarchy** -- No framework models board governance, C-suite decision-making, team leads, and individual contributors. Kitz's 7-tier hierarchy is unique.

2. **Tool permission matrix** -- The `AgentToolBridge` with tier + team + agent-level access control has no equivalent in any open-source framework.

3. **Launch readiness protocol** -- The 33-agent launch review with go/no-go voting is a unique governance pattern.

4. **War room crisis response** -- Automated multi-agent incident response with post-mortems.

5. **Guardian agents** -- Per-service monitoring agents with self-repair capabilities.

6. **LatAm business domain** -- Purpose-built for WhatsApp commerce, local payment rails (Yappy), Spanish-first content, LatAm CRM patterns.

7. **AI Battery cost governance** -- Credit-based usage control prevents runaway AI costs.

### Kitz AOS Weaknesses (To Address)

1. **Linear scenario chains** -- Agent flows are keyword-matched linear sequences. No conditional branching, loops, or dynamic routing based on intermediate results.

2. **Untyped state flow** -- `SwarmHandoff.context` is `Record<string, unknown>`. State flowing between agents has no schema validation.

3. **Minimal agent personas** -- Agent system prompts are one-liners. Richer backstories and goals would improve response quality.

4. **No deterministic workflow engine** -- Unlike LangGraph or n8n, there is no formal graph-based workflow execution engine with checkpointing and retry.

5. **Conversation memory** -- Single-layer memory without summarization, entity tracking, or semantic search over conversation history.

6. **MCP server missing** -- Kitz consumes MCP but does not expose its tools to the MCP ecosystem.

7. **No visual workflow builder** -- All agent orchestration is code-defined. Business users cannot create or modify agent flows.

---

## 6. Recommended Architectural Improvements

### Phase 1: Now (Next 2 Weeks)

| Improvement | Source Framework | Effort | Impact |
|-------------|-----------------|--------|--------|
| **Enrich agent profiles** with goal, backstory, personality | CrewAI | Low | High -- immediate response quality improvement |
| **Optimize tool descriptions** for LLM consumption | LangChain | Low | Medium -- better tool selection accuracy |
| **Add conversation summary memory** to semantic router | LangChain | Medium | High -- enables longer WhatsApp conversations |
| **Implement error handler taxonomy** (resume/rollback/commit/break) | Make | Medium | Medium -- improves workflow reliability |
| **Begin MCP server scaffold** (tools/list endpoint) | MCP | Medium | High -- ecosystem positioning |

### Phase 2: Next Quarter (Weeks 3-12)

| Improvement | Source Framework | Effort | Impact |
|-------------|-----------------|--------|--------|
| **Build FlowGraph abstraction** with conditional edges | LangGraph | High | Critical -- transforms agent orchestration |
| **Add typed state schemas** per scenario flow | LangGraph | Medium | High -- eliminates state bugs |
| **Implement streaming progress** from graph nodes to UI | LangGraph | Medium | Medium -- better UX |
| **Complete MCP server** (tools/call, resources, prompts) | MCP | High | High -- ecosystem integration |
| **Create Kitz Recipes** (pre-built agent flow templates) | Zapier | Medium | High -- user activation |
| **Add delegation tool** to agent tool palette | CrewAI | Medium | Medium -- emergent collaboration |
| **Implement task abstraction** with expected outputs | CrewAI | Medium | Medium -- better agent chaining |

### Phase 3: Future (Quarters 2-3)

| Improvement | Source Framework | Effort | Impact |
|-------------|-----------------|--------|--------|
| **Visual scenario builder** in admin UI | Make, n8n | Very High | High -- enables business users |
| **Learned speaker selection** replacing keyword matching | AutoGen | High | High -- intelligent routing |
| **Entity memory** tracking contacts/deals across conversations | LangChain | High | Medium -- CRM-aware conversations |
| **Nested swarm conversations** | AutoGen | High | Medium -- complex multi-step workflows |
| **MCP sampling protocol** for external LLM budget usage | MCP | Medium | Medium -- cost optimization |
| **Checkpoint/resume** for long-running agent flows | LangGraph | High | Medium -- reliability |

---

## 7. MCP Adoption Roadmap

### Stage 1: MCP Server Foundation (Now)

**Goal:** Expose Kitz's tool registry as an MCP server so external clients can discover and call Kitz tools.

**Tasks:**
1. Create `kitz_os/src/mcpServer.ts` with `tools/list` and `tools/call` handlers
2. Map `ToolSchema` to MCP tool format (field mapping is straightforward; see Section 3.2)
3. Add HTTP transport endpoint at `/mcp` on the Fastify server
4. Implement API key authentication for MCP clients
5. Add `riskLevel` as MCP annotation metadata
6. Respect `AgentToolBridge` permissions -- MCP calls need a caller identity

**Deliverable:** External MCP clients (Claude Desktop, etc.) can list and call Kitz tools.

### Stage 2: Resource Exposure (Next Quarter)

**Goal:** Expose Kitz's data (CRM, metrics, SOPs) as MCP resources.

**Tasks:**
1. Implement `resources/list` and `resources/read` MCP methods
2. Define resource URIs for key data types (see table in Section 3.1)
3. Add resource templates for parameterized access (e.g., `kitz://crm/contacts/{segment}`)
4. Implement change notifications for real-time resource updates

**Deliverable:** External AI assistants can read Kitz business data via MCP.

### Stage 3: Prompt Templates (Next Quarter)

**Goal:** Expose Kitz's agent personas as MCP prompts.

**Tasks:**
1. Implement `prompts/list` and `prompts/get` MCP methods
2. Extract agent system prompts from `claudeClient.ts` and agent configs
3. Define prompt arguments for customization (business name, industry, language)

**Deliverable:** External clients can use Kitz's specialized agent personas.

### Stage 4: Full Protocol (Future)

**Goal:** Complete MCP implementation including sampling and notifications.

**Tasks:**
1. Implement MCP sampling protocol (server requests LLM from client)
2. Add resource subscription for real-time updates
3. Support stdio transport for local development
4. Publish Kitz MCP server as a standalone package for partner integration
5. Create MCP client adapters for Kitz to consume external MCP servers (expanding Kitz's tool ecosystem)

---

## 8. n8n Advanced Patterns

Kitz's n8n integration is functional but uses basic patterns (list, get, execute, webhook). These advanced patterns would unlock significantly more value.

### 8.1 AI Agent Workflows

n8n's AI Agent node (v1.x+) enables LLM-powered decision-making within workflows. Kitz should use this for workflows that need reasoning but don't warrant a full AOS agent.

**Pattern: AI-Powered Lead Routing**
```
Webhook Trigger -> AI Agent Node -> [Route Decision] -> CRM Update / WhatsApp Send / Email
                     |
                     ├── Tool: Query CRM for lead history
                     ├── Tool: Check lead score
                     └── Decision: Assign to sales rep or auto-nurture
```

**Implementation:** Use `n8n_executeWorkflow` with input data containing the lead context. The n8n workflow uses its AI Agent node with tools configured to call back into Kitz's API.

### 8.2 Error Recovery Workflows

**Pattern: Automatic Retry with Escalation**
```
Main Workflow -> [Error] -> Error Workflow -> Retry (3x) -> [Still failing] -> Slack/WhatsApp Alert to Human
```

Kitz should create n8n error workflows for critical paths (payment processing, WhatsApp delivery, CRM sync) and monitor them via `n8n_getExecutions`.

### 8.3 Scheduled Intelligence Reports

**Pattern: Daily Business Intelligence Pipeline**
```
Cron (8am) -> Query Kitz Dashboard Metrics -> AI Summarize -> WhatsApp Report to Owner
                                           -> Check Anomalies -> [Anomaly Found] -> War Room Trigger
```

This extends Kitz's `CadenceEngine` with n8n-managed workflows that run independently. The n8n workflow calls Kitz's API for data, processes it, and triggers Kitz actions.

### 8.4 Multi-Channel Campaign Orchestration

**Pattern: Drip Campaign with Behavioral Triggers**
```
New Contact Created (webhook) -> Wait 1 day -> WhatsApp Welcome
                               -> Wait 3 days -> [Replied?] -> Yes: Sales Agent Follow-up
                                                             -> No: Email Nudge -> Wait 2 days -> SMS Final
```

n8n's Wait node enables time-delayed workflows that Kitz's AOS cannot easily model (agents are stateless between invocations). The n8n workflow manages the temporal state while Kitz provides the content and delivery tools.

### 8.5 Community Node Integration

**High-value n8n community nodes for Kitz's LatAm market:**

| Node | Use Case | Integration |
|------|----------|-------------|
| **WhatsApp Business** | Multi-number management, template approval | Complement `kitz-whatsapp-connector` |
| **Google Sheets** | SMB data import/export (many LatAm SMBs use Sheets as CRM) | Data sync with Kitz CRM |
| **Mercado Libre** | Marketplace integration for LatAm e-commerce | Product listing, order sync |
| **Instagram** | Social commerce (massive in LatAm) | Content posting, DM automation |
| **Stripe** | Payment processing | Complement `kitz-payments` |
| **Twilio** | SMS fallback for WhatsApp | Multi-channel delivery |
| **Google Calendar** | Appointment booking for service businesses | Sync with `calendarTools` |
| **Notion** | Knowledge base sync for teams | SOP import/export |

### 8.6 Workflow-as-Agent Pattern

**Pattern:** Create n8n workflows that act as specialized micro-agents, callable from the AOS via `n8n_executeWorkflow`. This enables business users to create agent behaviors without TypeScript:

```typescript
// In toolBridge.ts -- allow specific n8n workflows as "agent tools"
const N8N_AGENT_WORKFLOWS: Record<string, string> = {
  'lead_scoring_custom': 'wf_abc123',      // Custom lead scoring logic
  'invoice_generator': 'wf_def456',        // Custom invoice template
  'social_post_scheduler': 'wf_ghi789',    // Social media scheduling
};
```

This bridges the gap between code-defined agents and user-defined automations, giving business users a path to extend the AOS without engineering support.

---

## Appendix A: Framework Decision Matrix

For each decision about framework adoption, use this evaluation matrix:

| Criterion | Weight | Question |
|-----------|--------|----------|
| **TypeScript native** | 30% | Can it be used in Kitz's TypeScript stack without FFI? |
| **Pattern adoptable** | 25% | Can the core patterns be implemented natively without the dependency? |
| **LatAm relevant** | 15% | Does it solve a problem specific to Kitz's LatAm SMB market? |
| **Production-ready** | 15% | Is it stable enough for production use? |
| **Community momentum** | 10% | Is the project actively maintained with a growing community? |
| **Cost** | 5% | What is the total cost of adoption (licensing, compute, engineering time)? |

**Scoring: AutoGen (37) | LangGraph (72) | LangChain (68) | CrewAI (55) | MCP (85) | n8n (78)**

MCP and n8n score highest because they are either already integrated or directly implementable in TypeScript. LangGraph scores high because its state-graph pattern addresses Kitz's most significant architectural gap.

## Appendix B: Key File References

| File | Path | Relevance |
|------|------|-----------|
| Agent tools | `kitz_os/src/tools/agentTools.ts` | Agent-to-LLM routing with tier-based model selection |
| Tool registry | `kitz_os/src/tools/registry.ts` | Central tool registration and invocation |
| MCP client | `kitz_os/src/tools/mcpClient.ts` | Existing MCP consumer implementation |
| n8n client | `kitz_os/src/tools/n8nClient.ts` | Workflow automation HTTP client |
| n8n tools | `kitz_os/src/tools/n8nTools.ts` | n8n tool definitions for agent access |
| Claude client | `kitz_os/src/llm/claudeClient.ts` | Tiered LLM routing with fallback |
| Kernel | `kitz_os/src/kernel.ts` | Boot sequence, AOS wiring, runtime |
| Base agent | `aos/src/agents/baseAgent.ts` | Agent base class with messaging, handoff, tool use |
| Types | `aos/src/types.ts` | All AOS type definitions (tiers, teams, events) |
| Tool bridge | `aos/src/toolBridge.ts` | Permission-enforced tool access for agents |
| Swarm handoff | `aos/src/swarm/handoff.ts` | Agent-to-agent context handoff protocol |
| Swarm runner | `aos/src/swarm/swarmRunner.ts` | Multi-team concurrent agent execution |
| Agent registry | `aos/src/registry.ts` | Agent config storage with ad-hoc spawn control |
| Event bus | `aos/src/eventBus.ts` | Pub/sub with middleware and ledger persistence |
| Agent scenarios | `ui/src/lib/agentScenarios.ts` | Keyword-based scenario classification and chain definition |
| Agent thinking | `ui/src/stores/agentThinkingStore.ts` | UI-side progressive agent step visualization |

---

*This document should be reviewed quarterly as the agent framework landscape evolves rapidly. Next review: 2026-05-24.*
