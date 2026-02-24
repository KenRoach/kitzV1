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

let _registry: import('./registry.js').OsToolRegistry | null = null

/** Set the registry reference so factory tools can register new tools at runtime */
export function setToolFactoryRegistry(registry: import('./registry.js').OsToolRegistry): void {
  _registry = registry
}

export function getAllToolFactoryTools(): ToolSchema[] {
  return [
    {
      name: 'toolFactory_createFromTemplate',
      description: 'Create a new automation tool from an n8n workflow template. Templates: new-lead-notification, order-fulfillment, payment-received, daily-report, low-stock-alert, lead-nurture-sequence, lead-welcome-onboard, lead-reactivation, content-social-post, content-campaign-copy, content-translate, campaign-multi-touch, campaign-broadcast-scheduled, campaign-performance-report, funnel-lead-scoring, funnel-stage-automation, funnel-conversion-report, drip-welcome-sequence, drip-post-purchase, drip-reactivation-winback, mail-merge-broadcast. Deploys to n8n, registers as callable tool, persists to disk.',
      parameters: {
        type: 'object',
        properties: {
          template: { type: 'string', description: 'Template slug (e.g. "new-lead-notification")' },
          tool_name: { type: 'string', description: 'Name for the new tool (snake_case)' },
          tool_description: { type: 'string', description: 'Human-readable description' },
          customizations: { type: 'object', description: 'Optional workflow overrides' },
        },
        required: ['template', 'tool_name', 'tool_description'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const template = args.template as string
        const toolName = args.tool_name as string
        const description = args.tool_description as string
        const customizations = (args.customizations as Record<string, unknown>) || {}

        const templatePath = join(TEMPLATES_DIR, `${template}.json`)
        let workflow: Record<string, unknown>
        try {
          const raw = await readFile(templatePath, 'utf-8')
          workflow = JSON.parse(raw)
        } catch {
          return { error: `Template "${template}" not found` }
        }

        if (customizations.name) workflow.name = customizations.name
        if (customizations.active !== undefined) workflow.active = customizations.active

        const result = await createWorkflow(workflow, traceId) as Record<string, unknown>
        if (result.error) return result

        const workflowId = String(result.id || '')
        if (!workflowId) return { error: 'n8n did not return a workflow ID' }

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

        if (_registry) {
          const { loadCustomTools } = await import('./customToolLoader.js')
          await loadCustomTools(_registry)
        }

        return { success: true, toolName, n8nWorkflowId: workflowId, template }
      },
    },

    {
      name: 'toolFactory_createFromDescription',
      description: 'Create a new n8n automation tool from a natural language description. Uses Claude to generate the n8n workflow JSON, deploys it, and registers it as a callable tool.',
      parameters: {
        type: 'object',
        properties: {
          description: { type: 'string', description: 'Natural language description of the automation' },
          tool_name: { type: 'string', description: 'Name for the new tool (snake_case)' },
        },
        required: ['description', 'tool_name'],
      },
      riskLevel: 'high',
      execute: async (args, traceId) => {
        const userDescription = args.description as string
        const toolName = args.tool_name as string

        let referenceWorkflow = '{}'
        try {
          referenceWorkflow = await readFile(join(TEMPLATES_DIR, 'new-lead-notification.json'), 'utf-8')
        } catch { /* proceed without reference */ }

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

        let workflow: Record<string, unknown>
        try {
          const cleaned = generated.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
          workflow = JSON.parse(cleaned)
        } catch {
          return { error: 'LLM generated invalid JSON', raw: generated.slice(0, 500) }
        }

        const result = await createWorkflow(workflow, traceId) as Record<string, unknown>
        if (result.error) return result

        const workflowId = String(result.id || '')
        if (!workflowId) return { error: 'n8n did not return a workflow ID' }

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

        if (_registry) {
          const { loadCustomTools } = await import('./customToolLoader.js')
          await loadCustomTools(_registry)
        }

        return { success: true, toolName, n8nWorkflowId: workflowId, description: userDescription }
      },
    },

    {
      name: 'toolFactory_createCompute',
      description: 'Create a new compute tool using a safe JSON DSL. For data transformations, calculations, and formatting. No arbitrary code execution.',
      parameters: {
        type: 'object',
        properties: {
          tool_name: { type: 'string', description: 'Name for the new tool (snake_case)' },
          tool_description: { type: 'string', description: 'What this tool calculates or transforms' },
          tool_parameters: { type: 'object', description: 'Input parameters schema' },
          logic: { type: 'object', description: 'ComputeLogic JSON DSL with steps array' },
        },
        required: ['tool_name', 'tool_description', 'tool_parameters', 'logic'],
      },
      riskLevel: 'medium',
      execute: async (args) => {
        const toolName = args.tool_name as string
        const description = args.tool_description as string
        const parameters = args.tool_parameters as Record<string, { type: string; description?: string }>
        const logic = args.logic as ComputeLogic

        if (!logic?.steps || !Array.isArray(logic.steps) || logic.steps.length === 0) {
          return { error: 'Logic must have at least one step' }
        }

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

        if (_registry) {
          const { loadCustomTools } = await import('./customToolLoader.js')
          await loadCustomTools(_registry)
        }

        return { success: true, toolName, type: 'compute', stepCount: logic.steps.length }
      },
    },

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

        if (_registry) {
          _registry.unregister(toolName)
        }

        return { success: deleted, toolName }
      },
    },
  ]
}
