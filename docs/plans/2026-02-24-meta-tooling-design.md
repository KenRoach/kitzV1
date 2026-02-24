# Kitz Meta-Tooling System — Design

**Date:** 2026-02-24
**Status:** Approved

## Overview

Kitz can create, persist, and invoke new tools at runtime. Two pathways:
1. **n8n Tool Factory** — Creates n8n workflows (from templates or LLM-generated) and registers them as callable tools
2. **Compute Tool Factory** — Creates safe data-transformation tools via JSON DSL (no arbitrary code execution)

Both persist to disk as JSON and auto-load on boot. "Tools that create tools."

## Architecture

```
User: "automate my lead follow-ups"
  → Kitz LLM (understands intent)
    → toolFactory_createFromTemplate / toolFactory_createFromDescription
      → Picks n8n template OR LLM generates workflow JSON
      → Deploys to n8n via n8nClient
      → Registers thin wrapper tool in OsToolRegistry
      → Persists definition to data/custom-tools/<name>.json

User: "create a tool that calculates shipping costs by weight"
  → Kitz LLM
    → toolFactory_createCompute
      → LLM generates JSON DSL logic definition
      → Registers sandboxed executor in registry
      → Persists to data/custom-tools/<name>.json

Boot sequence (kernel.ts):
  1. registerDefaults() — 68+ built-in tools
  2. loadCustomTools() — scan data/custom-tools/*.json, register each
     - n8n type: wrapper calling n8nClient.executeWorkflow(id, args)
     - compute type: sandboxed JSON DSL evaluator
```

## Custom Tool Definition Schema

```typescript
interface CustomToolDef {
  name: string              // tool registry name, e.g. "auto_followup_leads"
  description: string       // human-readable description
  type: 'n8n' | 'compute'   // which factory created it
  parameters: Record<string, { type: string; description?: string; default?: unknown }>
  riskLevel: 'low' | 'medium' | 'high'
  createdAt: string          // ISO timestamp
  createdBy: string          // agent name or "user"

  // n8n-specific
  n8nWorkflowId?: string     // deployed workflow ID
  templateSource?: string    // template slug if created from template

  // compute-specific
  logic?: ComputeLogic       // JSON DSL definition
}
```

Persisted as `data/custom-tools/<name>.json`. One file per tool.

## n8n Workflow Templates

5 starter templates in `kitz_os/data/n8n-templates/`:

| Slug | Trigger | Action |
|------|---------|--------|
| `lead-followup` | Scheduled (daily 9am) | Query CRM for leads inactive 3+ days → draft WhatsApp follow-up |
| `order-status-notify` | Webhook (order status change) | Send customer WhatsApp status update |
| `payment-reminder` | Scheduled (daily 10am) | Find overdue invoices → draft payment reminder |
| `new-lead-welcome` | Webhook (new contact) | Send welcome message + add to CRM pipeline |
| `daily-summary` | Scheduled (daily 8am) | Aggregate business stats → send owner daily briefing |

Each template is valid n8n workflow JSON with placeholder values that get customized per-business.

## Tool Builder Tools (toolFactoryTools.ts)

| Tool | Risk | Description |
|------|------|-------------|
| `toolFactory_createFromTemplate` | medium | Pick an n8n template, customize params, deploy to n8n, register + persist |
| `toolFactory_createFromDescription` | high | LLM generates n8n workflow JSON from natural language description, deploy + register + persist |
| `toolFactory_createCompute` | medium | LLM generates JSON DSL logic for data transformations, register + persist |
| `toolFactory_listCustomTools` | low | List all custom tools with status, creation date, type |
| `toolFactory_deleteCustomTool` | medium | Remove a custom tool from registry + delete JSON file |

## Compute JSON DSL

Safe, sandboxed operations — no eval, no arbitrary code. Operations:

```typescript
type ComputeLogic = {
  steps: ComputeStep[]
}

type ComputeStep =
  | { op: 'math'; expression: string; output: string }      // safe math eval (numbers only)
  | { op: 'lookup'; table: string; key: string; output: string }  // lookup from workspace data
  | { op: 'format'; template: string; output: string }      // string template interpolation
  | { op: 'condition'; if: string; then: ComputeStep[]; else?: ComputeStep[] }
  | { op: 'return'; value: string }                          // final output reference
```

Example — shipping cost calculator:
```json
{
  "steps": [
    { "op": "math", "expression": "weight_kg * 2.50 + 5.00", "output": "base_cost" },
    { "op": "condition", "if": "weight_kg > 10",
      "then": [{ "op": "math", "expression": "base_cost * 0.9", "output": "base_cost" }] },
    { "op": "format", "template": "Shipping cost: ${{base_cost}}", "output": "message" },
    { "op": "return", "value": "base_cost" }
  ]
}
```

The evaluator uses a variable map (no scope escape), safe math parsing (no Function/eval), and string templates only.

## Custom Tool Loader (boot)

New function in `kitz_os/src/tools/customToolLoader.ts`:

```typescript
export async function loadCustomTools(registry: OsToolRegistry): Promise<number>
```

- Scans `data/custom-tools/*.json`
- For each file: parse, validate schema, create executor, register
- n8n executors: `(args) => n8nClient.executeWorkflow(def.n8nWorkflowId, args)`
- Compute executors: `(args) => evaluateComputeDSL(def.logic, args)`
- Returns count of loaded tools
- Logs warnings for invalid definitions, doesn't crash

## Data Flow

```
toolFactory_createFromTemplate(slug, customizations)
  → Load template from data/n8n-templates/<slug>.json
  → Apply customizations (triggers, parameters, business context)
  → POST to n8n API to create workflow
  → Get workflow ID back
  → Build CustomToolDef JSON
  → Write to data/custom-tools/<name>.json
  → Register wrapper in OsToolRegistry
  → Return { success: true, toolName, n8nWorkflowId }

toolFactory_createFromDescription(description)
  → Call LLM (Sonnet tier) with n8n node catalog + description
  → LLM returns workflow JSON
  → POST to n8n API to create workflow
  → Same persistence + registration flow
  → Return { success: true, toolName, n8nWorkflowId }

toolFactory_createCompute(description)
  → Call LLM (Sonnet tier) with DSL spec + description
  → LLM returns ComputeLogic JSON
  → Validate all ops are in the allowed set
  → Write to data/custom-tools/<name>.json
  → Register evaluator in OsToolRegistry
  → Return { success: true, toolName }
```

## Security

- No `eval()` or `new Function()` anywhere — compute DSL is interpreted via switch/case
- Math expressions parsed with a safe subset (numbers, operators, parentheses, variable names)
- n8n workflows go through n8n's own sandboxing
- All custom tools are `medium` risk by default (flagged in audit trail)
- `toolFactory_createFromDescription` is `high` risk — LLM-generated workflows get logged with full trace

## Not In Scope (Yet)

- No approval gate on tool creation (add via draft-first pattern later)
- No tool versioning or rollback
- No UI for managing custom tools (use ChatPanel)
- No sharing tools between organizations
- No real-time tool hot-reload (requires restart or explicit re-register)
