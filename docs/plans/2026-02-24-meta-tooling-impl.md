# Meta-Tooling System — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Give Kitz the ability to create, persist, and invoke new tools at runtime — via n8n workflows (automations) and a safe JSON DSL (compute). "Tools that create tools."

**Architecture:** Two factory pathways share a `CustomToolDef` JSON schema persisted to `data/custom-tools/`. On boot, `loadCustomTools()` scans this directory and registers each tool in the `OsToolRegistry`. n8n tools delegate to `n8nClient.executeWorkflow()`. Compute tools evaluate a sandboxed JSON DSL. Five new `toolFactory_*` tools let the LLM brain orchestrate creation.

**Tech Stack:** TypeScript 5, Fastify 4, n8n REST API, Claude Sonnet (for LLM-powered generation), Node.js `fs/promises`.

**Design doc:** `docs/plans/2026-02-24-meta-tooling-design.md`

**⚠️ Known constraints:**
- n8n client lacks `createWorkflow()` — Task 0 adds it.
- Compute DSL math evaluator must NOT use `eval()` or `new Function()`.
- All tests are stubs in this codebase — we write real unit tests but expect no existing test infrastructure.

---

## Task 0: Add createWorkflow + deleteWorkflow to n8n Client

**Files:**
- Modify: `kitz_os/src/tools/n8nClient.ts`

**Step 1: Add createWorkflow function**

In `kitz_os/src/tools/n8nClient.ts`, add after the `executeWorkflow` function (line 83):

```ts
/** Create a new workflow from a JSON definition */
export async function createWorkflow(
  workflow: Record<string, unknown>,
  traceId?: string,
): Promise<unknown> {
  return callN8n('POST', '/api/v1/workflows', workflow, traceId);
}

/** Delete a workflow by ID */
export async function deleteWorkflow(
  workflowId: string,
  traceId?: string,
): Promise<unknown> {
  return callN8n('DELETE', `/api/v1/workflows/${workflowId}`, undefined, traceId);
}
```

**Step 2: Verify typecheck**

Run: `cd /Users/fliaroach/kitzV1/kitz_os && npx tsc --noEmit`
Expected: no errors

**Step 3: Commit**

```bash
git add kitz_os/src/tools/n8nClient.ts
git commit -m "feat(n8n): add createWorkflow and deleteWorkflow to n8n client"
```

---

## Task 1: CustomToolDef Types + Safe Math Evaluator

**Files:**
- Create: `kitz_os/src/tools/customToolTypes.ts`

**Step 1: Create types and safe math evaluator**

Create `kitz_os/src/tools/customToolTypes.ts`:

```ts
/**
 * Custom Tool Types — Shared types for the meta-tooling system.
 */

export interface CustomToolDef {
  name: string
  description: string
  type: 'n8n' | 'compute'
  parameters: Record<string, { type: string; description?: string; default?: unknown }>
  riskLevel: 'low' | 'medium' | 'high'
  createdAt: string
  createdBy: string

  // n8n-specific
  n8nWorkflowId?: string
  templateSource?: string

  // compute-specific
  logic?: ComputeLogic
}

export interface ComputeLogic {
  steps: ComputeStep[]
}

export type ComputeStep =
  | { op: 'math'; expression: string; output: string }
  | { op: 'lookup'; table: string; key: string; output: string }
  | { op: 'format'; template: string; output: string }
  | { op: 'condition'; if: string; then: ComputeStep[]; else?: ComputeStep[] }
  | { op: 'return'; value: string }

/**
 * Safe math evaluator — NO eval(), NO new Function().
 * Supports: +, -, *, /, %, parentheses, numbers, variable names.
 * Variables are resolved from a flat Record<string, number>.
 */
export function evaluateMathExpression(expr: string, vars: Record<string, number>): number {
  // Tokenize
  const tokens: string[] = []
  let i = 0
  while (i < expr.length) {
    if (/\s/.test(expr[i])) { i++; continue }
    if ('+-*/%()'.includes(expr[i])) { tokens.push(expr[i]); i++; continue }
    // Number
    if (/[0-9.]/.test(expr[i])) {
      let num = ''
      while (i < expr.length && /[0-9.]/.test(expr[i])) { num += expr[i]; i++ }
      tokens.push(num)
      continue
    }
    // Variable name
    if (/[a-zA-Z_]/.test(expr[i])) {
      let name = ''
      while (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])) { name += expr[i]; i++ }
      if (!(name in vars)) throw new Error(`Unknown variable: ${name}`)
      tokens.push(String(vars[name]))
      continue
    }
    throw new Error(`Unexpected character: ${expr[i]}`)
  }

  // Recursive descent parser
  let pos = 0

  function peek(): string | undefined { return tokens[pos] }
  function consume(): string { return tokens[pos++] }

  function parseExpr(): number {
    let result = parseTerm()
    while (peek() === '+' || peek() === '-') {
      const op = consume()
      const right = parseTerm()
      result = op === '+' ? result + right : result - right
    }
    return result
  }

  function parseTerm(): number {
    let result = parseFactor()
    while (peek() === '*' || peek() === '/' || peek() === '%') {
      const op = consume()
      const right = parseFactor()
      if (op === '*') result *= right
      else if (op === '/') { if (right === 0) throw new Error('Division by zero'); result /= right }
      else result %= right
    }
    return result
  }

  function parseFactor(): number {
    if (peek() === '(') {
      consume() // '('
      const result = parseExpr()
      if (peek() !== ')') throw new Error('Missing closing parenthesis')
      consume() // ')'
      return result
    }
    if (peek() === '-') {
      consume()
      return -parseFactor()
    }
    const token = consume()
    if (token === undefined) throw new Error('Unexpected end of expression')
    const num = Number(token)
    if (isNaN(num)) throw new Error(`Invalid number: ${token}`)
    return num
  }

  const result = parseExpr()
  if (pos < tokens.length) throw new Error(`Unexpected token: ${tokens[pos]}`)
  return result
}

/**
 * Evaluate a ComputeLogic definition with input arguments.
 * Returns the value referenced by the final 'return' step.
 */
export function evaluateComputeDSL(
  logic: ComputeLogic,
  args: Record<string, unknown>,
): unknown {
  const vars: Record<string, unknown> = { ...args }

  function runSteps(steps: ComputeStep[]): unknown {
    for (const step of steps) {
      switch (step.op) {
        case 'math': {
          const numVars: Record<string, number> = {}
          for (const [k, v] of Object.entries(vars)) {
            if (typeof v === 'number') numVars[k] = v
          }
          vars[step.output] = evaluateMathExpression(step.expression, numVars)
          break
        }
        case 'lookup': {
          // Lookup from args — args[table] should be an array or object
          const table = vars[step.table]
          if (table && typeof table === 'object') {
            vars[step.output] = (table as Record<string, unknown>)[step.key]
          } else {
            vars[step.output] = undefined
          }
          break
        }
        case 'format': {
          let result = step.template
          for (const [k, v] of Object.entries(vars)) {
            result = result.replaceAll(`{{${k}}}`, String(v ?? ''))
          }
          vars[step.output] = result
          break
        }
        case 'condition': {
          // Evaluate condition: variable name must be truthy, or "var > num" style
          const cond = evaluateCondition(step.if, vars)
          if (cond) {
            const r = runSteps(step.then)
            if (r !== undefined) return r
          } else if (step.else) {
            const r = runSteps(step.else)
            if (r !== undefined) return r
          }
          break
        }
        case 'return':
          return vars[step.value]
      }
    }
    return undefined
  }

  return runSteps(logic.steps)
}

function evaluateCondition(expr: string, vars: Record<string, unknown>): boolean {
  // Simple: "varName > number" or "varName" (truthy check)
  const comparisons = expr.match(/^(\w+)\s*(>|<|>=|<=|==|!=)\s*(.+)$/)
  if (comparisons) {
    const [, varName, op, rhs] = comparisons
    const lv = Number(vars[varName])
    const rv = Number(rhs)
    if (isNaN(lv) || isNaN(rv)) return false
    switch (op) {
      case '>': return lv > rv
      case '<': return lv < rv
      case '>=': return lv >= rv
      case '<=': return lv <= rv
      case '==': return lv === rv
      case '!=': return lv !== rv
    }
  }
  // Truthy check
  return !!vars[expr]
}
```

**Step 2: Verify typecheck**

Run: `cd /Users/fliaroach/kitzV1/kitz_os && npx tsc --noEmit`
Expected: no errors

**Step 3: Commit**

```bash
git add kitz_os/src/tools/customToolTypes.ts
git commit -m "feat: add CustomToolDef types + safe math evaluator + compute DSL"
```

---

## Task 2: Custom Tool Loader (boot integration)

**Files:**
- Create: `kitz_os/src/tools/customToolLoader.ts`
- Modify: `kitz_os/src/kernel.ts`

**Step 1: Create the loader**

Create `kitz_os/src/tools/customToolLoader.ts`:

```ts
/**
 * Custom Tool Loader — Loads persisted custom tools on boot.
 * Scans data/custom-tools/*.json, validates, creates executors, registers.
 */

import { readdir, readFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { executeWorkflow } from './n8nClient.js'
import { evaluateComputeDSL } from './customToolTypes.js'
import type { CustomToolDef } from './customToolTypes.js'
import type { OsToolRegistry, ToolSchema } from './registry.js'

const CUSTOM_TOOLS_DIR = join(process.cwd(), 'data', 'custom-tools')

/** Ensure the custom tools directory exists */
async function ensureDir(): Promise<void> {
  await mkdir(CUSTOM_TOOLS_DIR, { recursive: true })
}

/** Build a ToolSchema executor from a CustomToolDef */
function buildTool(def: CustomToolDef): ToolSchema {
  if (def.type === 'n8n' && def.n8nWorkflowId) {
    return {
      name: def.name,
      description: def.description,
      parameters: {
        type: 'object',
        properties: def.parameters,
      },
      riskLevel: def.riskLevel,
      execute: async (args, traceId) =>
        executeWorkflow(def.n8nWorkflowId!, args, traceId),
    }
  }

  if (def.type === 'compute' && def.logic) {
    return {
      name: def.name,
      description: def.description,
      parameters: {
        type: 'object',
        properties: def.parameters,
      },
      riskLevel: def.riskLevel,
      execute: async (args) => {
        try {
          return { result: evaluateComputeDSL(def.logic!, args) }
        } catch (err) {
          return { error: `Compute failed: ${(err as Error).message}` }
        }
      },
    }
  }

  // Fallback: broken definition
  return {
    name: def.name,
    description: `[BROKEN] ${def.description}`,
    parameters: { type: 'object', properties: {} },
    riskLevel: 'low',
    execute: async () => ({ error: `Tool "${def.name}" has invalid definition` }),
  }
}

/** Load all custom tools from disk and register them */
export async function loadCustomTools(registry: OsToolRegistry): Promise<number> {
  await ensureDir()
  let loaded = 0

  let files: string[]
  try {
    files = await readdir(CUSTOM_TOOLS_DIR)
  } catch {
    return 0
  }

  for (const file of files) {
    if (!file.endsWith('.json')) continue
    try {
      const raw = await readFile(join(CUSTOM_TOOLS_DIR, file), 'utf-8')
      const def: CustomToolDef = JSON.parse(raw)

      if (!def.name || !def.type || !def.description) {
        console.warn(`[customToolLoader] Skipping ${file}: missing required fields`)
        continue
      }

      const tool = buildTool(def)
      registry.register(tool)
      loaded++
    } catch (err) {
      console.warn(`[customToolLoader] Failed to load ${file}: ${(err as Error).message}`)
    }
  }

  return loaded
}

/** Save a CustomToolDef to disk */
export async function saveCustomTool(def: CustomToolDef): Promise<void> {
  await ensureDir()
  const filePath = join(CUSTOM_TOOLS_DIR, `${def.name}.json`)
  const { writeFile } = await import('node:fs/promises')
  await writeFile(filePath, JSON.stringify(def, null, 2), 'utf-8')
}

/** Delete a custom tool from disk */
export async function deleteCustomToolFile(name: string): Promise<boolean> {
  const filePath = join(CUSTOM_TOOLS_DIR, `${name}.json`)
  try {
    const { unlink } = await import('node:fs/promises')
    await unlink(filePath)
    return true
  } catch {
    return false
  }
}
```

**Step 2: Wire into kernel boot**

In `kitz_os/src/kernel.ts`, add import at the top (after existing imports):

Find:
```ts
import { createLogger } from './logger.js';
```
Add after:
```ts
import { loadCustomTools } from './tools/customToolLoader.js';
```

Find:
```ts
    // 3. Register all tools
    await this.tools.registerDefaults();
    log.info(`${this.tools.count()} tools registered`, { toolCount: this.tools.count() });
```
Replace with:
```ts
    // 3. Register all tools
    await this.tools.registerDefaults();
    const builtInCount = this.tools.count();

    // 3.1. Load custom tools from disk
    const customCount = await loadCustomTools(this.tools).catch(err => {
      log.warn('Custom tool load failed', { error: (err as Error).message });
      return 0;
    });

    log.info(`${this.tools.count()} tools registered`, {
      builtIn: builtInCount,
      custom: customCount,
      total: this.tools.count(),
    });
```

**Step 3: Verify typecheck**

Run: `cd /Users/fliaroach/kitzV1/kitz_os && npx tsc --noEmit`
Expected: no errors

**Step 4: Commit**

```bash
git add kitz_os/src/tools/customToolLoader.ts kitz_os/src/kernel.ts
git commit -m "feat: custom tool loader — persist, load, and register tools on boot"
```

---

## Task 3: Tool Factory Tools (the tools that create tools)

**Files:**
- Create: `kitz_os/src/tools/toolFactoryTools.ts`

**Step 1: Build the tool factory**

Create `kitz_os/src/tools/toolFactoryTools.ts`:

```ts
/**
 * Tool Factory Tools — Meta-tools that create, list, and delete custom tools.
 * "Tools that create tools."
 */

import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createWorkflow, deleteWorkflow } from './n8nClient.js'
import { saveCustomTool, deleteCustomToolFile } from './customToolLoader.js'
import type { CustomToolDef, ComputeLogic } from './customToolTypes.js'
import type { ToolSchema } from './registry.js'

const TEMPLATES_DIR = join(process.cwd(), 'data', 'n8n-workflows')
const CUSTOM_TOOLS_DIR = join(process.cwd(), 'data', 'custom-tools')

export function getAllToolFactoryTools(): ToolSchema[] {
  return [
    // ── 1. Create from n8n template ──
    {
      name: 'toolFactory_createFromTemplate',
      description: 'Create a new automation tool from an n8n workflow template. Templates: new-lead-notification, order-fulfillment, payment-received, daily-report, low-stock-alert. Deploys to n8n, registers as callable tool, persists to disk.',
      parameters: {
        type: 'object',
        properties: {
          template: { type: 'string', description: 'Template slug (e.g. "new-lead-notification")' },
          tool_name: { type: 'string', description: 'Name for the new tool (snake_case, e.g. "auto_welcome_leads")' },
          tool_description: { type: 'string', description: 'Human-readable description of what this tool does' },
          customizations: { type: 'object', description: 'Optional overrides for the workflow (e.g. { "webhookPath": "my-leads" })' },
        },
        required: ['template', 'tool_name', 'tool_description'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const template = args.template as string
        const toolName = args.tool_name as string
        const description = args.tool_description as string
        const customizations = (args.customizations as Record<string, unknown>) || {}

        // Load template
        const templatePath = join(TEMPLATES_DIR, `${template}.json`)
        let workflow: Record<string, unknown>
        try {
          const raw = await readFile(templatePath, 'utf-8')
          workflow = JSON.parse(raw)
        } catch {
          return { error: `Template "${template}" not found` }
        }

        // Apply customizations
        if (customizations.name) workflow.name = customizations.name
        if (customizations.active !== undefined) workflow.active = customizations.active

        // Deploy to n8n
        const result = await createWorkflow(workflow, traceId) as Record<string, unknown>
        if (result.error) return result

        const workflowId = String(result.id || '')
        if (!workflowId) return { error: 'n8n did not return a workflow ID' }

        // Build and save custom tool definition
        const def: CustomToolDef = {
          name: toolName,
          description,
          type: 'n8n',
          parameters: {},
          riskLevel: 'medium',
          createdAt: new Date().toISOString(),
          createdBy: 'toolFactory',
          n8nWorkflowId: workflowId,
          templateSource: template,
        }

        await saveCustomTool(def)
        return { success: true, toolName, n8nWorkflowId: workflowId, template }
      },
    },

    // ── 2. Create from natural language (LLM-generated n8n workflow) ──
    {
      name: 'toolFactory_createFromDescription',
      description: 'Create a new n8n automation tool from a natural language description. Uses Claude to generate the n8n workflow JSON, deploys it, and registers it as a callable tool.',
      parameters: {
        type: 'object',
        properties: {
          description: { type: 'string', description: 'Natural language description of the automation (e.g. "When a new order is placed, send a WhatsApp confirmation to the customer")' },
          tool_name: { type: 'string', description: 'Name for the new tool (snake_case)' },
        },
        required: ['description', 'tool_name'],
      },
      riskLevel: 'high',
      execute: async (args, traceId) => {
        const userDescription = args.description as string
        const toolName = args.tool_name as string

        // Load a template as reference for the LLM
        let referenceWorkflow = '{}'
        try {
          referenceWorkflow = await readFile(join(TEMPLATES_DIR, 'new-lead-notification.json'), 'utf-8')
        } catch { /* ok — proceed without reference */ }

        // Call Claude to generate the workflow JSON
        const { claudeChat } = await import('../llm/claudeClient.js')
        const prompt = `You are an n8n workflow builder for KITZ, an AI business operating system.

Generate a valid n8n workflow JSON that implements this automation:
"${userDescription}"

Here is a reference workflow for the correct JSON structure:
${referenceWorkflow}

RULES:
- Use n8n-nodes-base node types only
- The KITZ OS API is at http://kitz-os:3012/api/kitz (POST, requires x-service-secret header)
- Webhooks should use paths prefixed with "kitz-"
- Set "active": false (owner activates manually)
- Return ONLY the JSON object, no markdown fences or explanation`

        const generated = await claudeChat(
          [{ role: 'user', content: prompt }],
          'sonnet',
          traceId,
          'You generate valid n8n workflow JSON. Return only the JSON object.',
        )

        // Parse the generated JSON
        let workflow: Record<string, unknown>
        try {
          // Strip markdown fences if present
          const cleaned = generated.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
          workflow = JSON.parse(cleaned)
        } catch {
          return { error: 'LLM generated invalid JSON', raw: generated.slice(0, 500) }
        }

        // Deploy to n8n
        const result = await createWorkflow(workflow, traceId) as Record<string, unknown>
        if (result.error) return result

        const workflowId = String(result.id || '')
        if (!workflowId) return { error: 'n8n did not return a workflow ID' }

        // Save
        const def: CustomToolDef = {
          name: toolName,
          description: userDescription,
          type: 'n8n',
          parameters: {},
          riskLevel: 'high',
          createdAt: new Date().toISOString(),
          createdBy: 'toolFactory_llm',
          n8nWorkflowId: workflowId,
        }

        await saveCustomTool(def)
        return { success: true, toolName, n8nWorkflowId: workflowId, description: userDescription }
      },
    },

    // ── 3. Create compute tool (JSON DSL) ──
    {
      name: 'toolFactory_createCompute',
      description: 'Create a new compute tool using a safe JSON DSL. For data transformations, calculations, and formatting. No arbitrary code execution.',
      parameters: {
        type: 'object',
        properties: {
          tool_name: { type: 'string', description: 'Name for the new tool (snake_case)' },
          tool_description: { type: 'string', description: 'What this tool calculates or transforms' },
          tool_parameters: { type: 'object', description: 'Input parameters schema: { "param_name": { "type": "number", "description": "..." } }' },
          logic: {
            type: 'object',
            description: 'ComputeLogic JSON DSL. Steps array with ops: math, lookup, format, condition, return. Example: { "steps": [{ "op": "math", "expression": "price * quantity", "output": "total" }, { "op": "return", "value": "total" }] }',
          },
        },
        required: ['tool_name', 'tool_description', 'tool_parameters', 'logic'],
      },
      riskLevel: 'medium',
      execute: async (args) => {
        const toolName = args.tool_name as string
        const description = args.tool_description as string
        const parameters = args.tool_parameters as Record<string, { type: string; description?: string }>
        const logic = args.logic as ComputeLogic

        // Validate logic has steps
        if (!logic?.steps || !Array.isArray(logic.steps) || logic.steps.length === 0) {
          return { error: 'Logic must have at least one step' }
        }

        // Validate all ops are known
        const validOps = ['math', 'lookup', 'format', 'condition', 'return']
        for (const step of logic.steps) {
          if (!validOps.includes(step.op)) {
            return { error: `Unknown op: ${step.op}. Valid: ${validOps.join(', ')}` }
          }
        }

        const def: CustomToolDef = {
          name: toolName,
          description,
          type: 'compute',
          parameters,
          riskLevel: 'medium',
          createdAt: new Date().toISOString(),
          createdBy: 'toolFactory_compute',
          logic,
        }

        await saveCustomTool(def)
        return { success: true, toolName, type: 'compute', stepCount: logic.steps.length }
      },
    },

    // ── 4. List custom tools ──
    {
      name: 'toolFactory_listCustomTools',
      description: 'List all custom tools created by Kitz, including their type, creation date, and status.',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', description: 'Filter by type: "n8n" or "compute". Omit for all.' },
        },
      },
      riskLevel: 'low',
      execute: async (args) => {
        const filterType = args.type as string | undefined

        let files: string[]
        try {
          files = await readdir(CUSTOM_TOOLS_DIR)
        } catch {
          return { tools: [], count: 0 }
        }

        const tools: CustomToolDef[] = []
        for (const file of files) {
          if (!file.endsWith('.json')) continue
          try {
            const raw = await readFile(join(CUSTOM_TOOLS_DIR, file), 'utf-8')
            const def: CustomToolDef = JSON.parse(raw)
            if (filterType && def.type !== filterType) continue
            tools.push(def)
          } catch { /* skip invalid */ }
        }

        return { tools, count: tools.length }
      },
    },

    // ── 5. Delete a custom tool ──
    {
      name: 'toolFactory_deleteCustomTool',
      description: 'Delete a custom tool. Removes from disk and optionally deletes the n8n workflow.',
      parameters: {
        type: 'object',
        properties: {
          tool_name: { type: 'string', description: 'Name of the tool to delete' },
          delete_n8n_workflow: { type: 'boolean', description: 'If true and tool is n8n type, also delete the workflow from n8n' },
        },
        required: ['tool_name'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const toolName = args.tool_name as string
        const deleteN8n = args.delete_n8n_workflow as boolean

        // Read the definition first (to get workflow ID if needed)
        if (deleteN8n) {
          try {
            const raw = await readFile(join(CUSTOM_TOOLS_DIR, `${toolName}.json`), 'utf-8')
            const def: CustomToolDef = JSON.parse(raw)
            if (def.type === 'n8n' && def.n8nWorkflowId) {
              await deleteWorkflow(def.n8nWorkflowId, traceId)
            }
          } catch { /* ok — just delete local */ }
        }

        const deleted = await deleteCustomToolFile(toolName)
        return { success: deleted, toolName }
      },
    },
  ]
}
```

**Step 2: Verify typecheck**

Run: `cd /Users/fliaroach/kitzV1/kitz_os && npx tsc --noEmit`
Expected: no errors

**Step 3: Commit**

```bash
git add kitz_os/src/tools/toolFactoryTools.ts
git commit -m "feat: add 5 toolFactory tools — create, generate, compute, list, delete"
```

---

## Task 4: Register toolFactoryTools in the Registry

**Files:**
- Modify: `kitz_os/src/tools/registry.ts`

**Step 1: Add toolFactoryTools to registerDefaults**

In `kitz_os/src/tools/registry.ts`, find the last import in the modules array:

```ts
      import('./n8nTools.js'),
    ]);
```

Replace with:

```ts
      import('./n8nTools.js'),
      import('./toolFactoryTools.js'),
    ]);
```

Find the last getter name:

```ts
      'getAllN8nTools',
    ];
```

Replace with:

```ts
      'getAllN8nTools',
      'getAllToolFactoryTools',
    ];
```

**Step 2: Also add an `unregister` method to OsToolRegistry**

The delete tool needs to be able to remove tools at runtime. In `registry.ts`, add after the `has` method:

```ts
  unregister(name: string): boolean {
    return this.tools.delete(name);
  }
```

**Step 3: Verify typecheck**

Run: `cd /Users/fliaroach/kitzV1/kitz_os && npx tsc --noEmit`
Expected: no errors

**Step 4: Commit**

```bash
git add kitz_os/src/tools/registry.ts
git commit -m "feat: register toolFactory tools + add unregister method"
```

---

## Task 5: Wire runtime registration into toolFactory tools

**Files:**
- Modify: `kitz_os/src/tools/toolFactoryTools.ts`

After a tool is created and persisted, it should also be immediately registered in the live registry (without restart). This requires the tool factory tools to have access to the registry.

**Step 1: Add registry access**

In `kitz_os/src/tools/toolFactoryTools.ts`, change the export signature:

Find:
```ts
export function getAllToolFactoryTools(): ToolSchema[] {
```

Replace with:
```ts
import { loadCustomTools } from './customToolLoader.js'

let _registry: import('./registry.js').OsToolRegistry | null = null

/** Set the registry reference so factory tools can register new tools at runtime */
export function setToolFactoryRegistry(registry: import('./registry.js').OsToolRegistry): void {
  _registry = registry
}

export function getAllToolFactoryTools(): ToolSchema[] {
```

Now in each `execute` that creates a tool (tools 1, 2, and 3), add runtime registration after `saveCustomTool(def)`:

For tool 1 (`toolFactory_createFromTemplate`), after `await saveCustomTool(def)`, add:
```ts
        // Register in live registry
        if (_registry) {
          const { loadCustomTools } = await import('./customToolLoader.js')
          // Re-load just registers any new tools
          await loadCustomTools(_registry)
        }
```

Apply the same pattern to tools 2 and 3.

For tool 5 (`toolFactory_deleteCustomTool`), after `const deleted = await deleteCustomToolFile(toolName)`, add:
```ts
        // Unregister from live registry
        if (_registry) {
          _registry.unregister(toolName)
        }
```

**Step 2: Wire in kernel.ts**

In `kitz_os/src/kernel.ts`, add import:

Find:
```ts
import { loadCustomTools } from './tools/customToolLoader.js';
```

Replace with:
```ts
import { loadCustomTools } from './tools/customToolLoader.js';
import { setToolFactoryRegistry } from './tools/toolFactoryTools.js';
```

After the custom tool loading section, add:

Find:
```ts
    log.info(`${this.tools.count()} tools registered`, {
      builtIn: builtInCount,
      custom: customCount,
      total: this.tools.count(),
    });
```

Add after:
```ts
    // 3.2. Wire registry into tool factory for runtime tool creation
    setToolFactoryRegistry(this.tools);
```

**Step 3: Verify typecheck**

Run: `cd /Users/fliaroach/kitzV1/kitz_os && npx tsc --noEmit`
Expected: no errors

**Step 4: Commit**

```bash
git add kitz_os/src/tools/toolFactoryTools.ts kitz_os/src/kernel.ts
git commit -m "feat: wire runtime tool registration — new tools available immediately"
```

---

## Task 6: Verify Full Build

**Step 1: Typecheck kitz_os**

Run: `cd /Users/fliaroach/kitzV1/kitz_os && npx tsc --noEmit`
Expected: no errors

**Step 2: Build UI**

Run: `cd /Users/fliaroach/kitzV1/ui && npm run build`
Expected: build succeeds

**Step 3: Verify clean git state**

Run: `cd /Users/fliaroach/kitzV1 && git status`
Expected: clean working tree

**Step 4: Push**

```bash
cd /Users/fliaroach/kitzV1 && git push origin main
```

---

## Task Summary

| Task | Component | Files | Estimated |
|------|-----------|-------|-----------|
| 0 | n8n client — createWorkflow + deleteWorkflow | 1 mod | 2 min |
| 1 | CustomToolDef types + safe math + compute DSL | 1 new | 5 min |
| 2 | Custom tool loader + kernel boot wire | 1 new, 1 mod | 4 min |
| 3 | 5 toolFactory tools | 1 new | 8 min |
| 4 | Register in registry + unregister method | 1 mod | 2 min |
| 5 | Runtime registration wiring | 2 mod | 3 min |
| 6 | Full build verification | 0 | 3 min |
| **Total** | | **3 new, 5 mod** | **~27 min** |
