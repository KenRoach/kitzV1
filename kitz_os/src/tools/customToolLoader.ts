/**
 * Custom Tool Loader — Loads persisted custom tools on boot.
 * Scans data/custom-tools/*.json, validates, creates executors, registers.
 */

import { readdir, readFile, writeFile, unlink, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { executeWorkflow } from './n8nClient.js'
import { evaluateComputeDSL } from './customToolTypes.js'
import type { CustomToolDef } from './customToolTypes.js'
import type { OsToolRegistry, ToolSchema } from './registry.js'

const CUSTOM_TOOLS_DIR = join(process.cwd(), 'data', 'custom-tools')

async function ensureDir(): Promise<void> {
  await mkdir(CUSTOM_TOOLS_DIR, { recursive: true })
}

function buildTool(def: CustomToolDef): ToolSchema {
  if (def.type === 'n8n' && def.n8nWorkflowId) {
    return {
      name: def.name,
      description: def.description,
      parameters: { type: 'object', properties: def.parameters },
      riskLevel: def.riskLevel,
      execute: async (args, traceId) =>
        executeWorkflow(def.n8nWorkflowId!, args, traceId),
    }
  }

  if (def.type === 'compute' && def.logic) {
    return {
      name: def.name,
      description: def.description,
      parameters: { type: 'object', properties: def.parameters },
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

  return {
    name: def.name,
    description: `[BROKEN] ${def.description}`,
    parameters: { type: 'object', properties: {} },
    riskLevel: 'low',
    execute: async () => ({ error: `Tool "${def.name}" has invalid definition` }),
  }
}

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

export async function saveCustomTool(def: CustomToolDef): Promise<void> {
  await ensureDir()
  const filePath = join(CUSTOM_TOOLS_DIR, `${def.name}.json`)
  await writeFile(filePath, JSON.stringify(def, null, 2), 'utf-8')
}

export async function deleteCustomToolFile(name: string): Promise<boolean> {
  const filePath = join(CUSTOM_TOOLS_DIR, `${name}.json`)
  try {
    await unlink(filePath)
    return true
  } catch {
    return false
  }
}
