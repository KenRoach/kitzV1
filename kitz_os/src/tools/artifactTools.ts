/**
 * Artifact Creation Tools — Generate code, documents, reports, and plans via LLM.
 *
 * KITZ OS self-healing & creation capability:
 *   - Generate TypeScript code (tools, modules, services)
 *   - Generate documents (reports, plans, proposals, emails)
 *   - Generate SQL migrations
 *   - Generate configuration files (docker, env, yaml)
 *   - Self-heal by regenerating missing files
 *
 * Uses Claude Sonnet for generation (mid-tier thinking).
 * Falls back to OpenAI gpt-4o if Claude unavailable.
 *
 * Generated artifacts can be:
 *   1. Returned as text (default)
 *   2. Saved to the local filesystem (sandboxed to kitz_os/)
 *   3. Saved to knowledge base via MCP
 *   4. Pushed to Lovable via webhook (for frontend artifacts)
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { callXyz88Mcp } from './mcpClient.js';
import type { ToolSchema } from './registry.js';

// ── Config ──
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_VERSION = '2023-06-01';
const OPENAI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const LOVABLE_WEBHOOK_URL = process.env.LOVABLE_WEBHOOK_URL || '';
const LOVABLE_WEBHOOK_TOKEN = process.env.LOVABLE_WEBHOOK_TOKEN || '';

// Sandbox root — artifacts can only be written inside this directory
const SANDBOX_ROOT = path.resolve(process.cwd(), '..');
const ALLOWED_DIRS = ['kitz_os', 'xyz88-io', 'kitz-brain', 'scripts', 'docs'];

// ── LLM Call ──
async function generateWithLLM(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 4096,
  temperature = 0.3,
): Promise<string> {
  // Try Claude Sonnet first
  if (CLAUDE_API_KEY) {
    try {
      const res = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': CLAUDE_API_VERSION,
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: maxTokens,
          temperature,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
        signal: AbortSignal.timeout(120_000),
      });
      if (res.ok) {
        const data = await res.json() as { content: Array<{ type: string; text?: string }> };
        const text = data.content?.find(c => c.type === 'text')?.text;
        if (text) return text;
      }
    } catch { /* fall through to OpenAI */ }
  }

  // Fallback to OpenAI gpt-4o
  if (OPENAI_API_KEY) {
    try {
      const res = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: maxTokens,
          temperature,
        }),
        signal: AbortSignal.timeout(120_000),
      });
      if (res.ok) {
        const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
        return data.choices?.[0]?.message?.content || '';
      }
    } catch { /* return error */ }
  }

  return '[ERROR: No AI available for artifact generation]';
}

// ── File System Helpers ──
function validatePath(filePath: string): { valid: boolean; fullPath: string; error?: string } {
  const normalized = path.normalize(filePath);
  const fullPath = path.isAbsolute(normalized) ? normalized : path.resolve(SANDBOX_ROOT, normalized);

  // Check it's within an allowed directory
  const relativePath = path.relative(SANDBOX_ROOT, fullPath);
  if (relativePath.startsWith('..')) {
    return { valid: false, fullPath, error: 'Path escapes sandbox' };
  }

  const topDir = relativePath.split(path.sep)[0];
  if (!ALLOWED_DIRS.includes(topDir)) {
    return { valid: false, fullPath, error: `Write only allowed in: ${ALLOWED_DIRS.join(', ')}` };
  }

  return { valid: true, fullPath };
}

async function writeArtifact(filePath: string, content: string): Promise<{ success: boolean; path: string; error?: string }> {
  const validation = validatePath(filePath);
  if (!validation.valid) {
    return { success: false, path: filePath, error: validation.error };
  }

  try {
    await fs.mkdir(path.dirname(validation.fullPath), { recursive: true });
    await fs.writeFile(validation.fullPath, content, 'utf-8');
    return { success: true, path: validation.fullPath };
  } catch (err) {
    return { success: false, path: filePath, error: (err as Error).message };
  }
}

async function readArtifact(filePath: string): Promise<{ success: boolean; content?: string; error?: string }> {
  const validation = validatePath(filePath);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    const content = await fs.readFile(validation.fullPath, 'utf-8');
    return { success: true, content };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

// ── Lovable Push ──
async function pushToLovable(
  artifactType: string,
  content: string,
  filename: string,
): Promise<{ success: boolean; error?: string }> {
  if (!LOVABLE_WEBHOOK_URL || !LOVABLE_WEBHOOK_TOKEN) {
    return { success: false, error: 'Lovable webhook not configured' };
  }

  try {
    const res = await fetch(LOVABLE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_WEBHOOK_TOKEN}`,
      },
      body: JSON.stringify({
        type: 'artifact_push',
        source: 'kitz-os',
        timestamp: new Date().toISOString(),
        artifact_type: artifactType,
        filename,
        content,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    return { success: res.ok, error: res.ok ? undefined : `HTTP ${res.status}` };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

// ── Tools ──

export function getAllArtifactTools(): ToolSchema[] {
  return [
    // ── 1. Generate Code ──
    {
      name: 'artifact_generateCode',
      description: 'Generate TypeScript/JavaScript code using AI. Can create new tools, modules, functions, tests, or entire files. Optionally saves to filesystem.',
      parameters: {
        type: 'object',
        properties: {
          description: {
            type: 'string',
            description: 'What the code should do. Be specific about inputs, outputs, and behavior.',
          },
          language: {
            type: 'string',
            enum: ['typescript', 'javascript', 'sql', 'bash', 'yaml', 'json'],
            description: 'Target language (default: typescript)',
          },
          context: {
            type: 'string',
            description: 'Optional context about the codebase, existing patterns, or related files.',
          },
          save_to: {
            type: 'string',
            description: 'Optional file path to save the generated code (relative to repo root). Must be in allowed dirs.',
          },
          framework: {
            type: 'string',
            description: 'Optional framework context (e.g., "fastify", "react", "supabase-edge-function")',
          },
        },
        required: ['description'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const description = args.description as string;
        const language = (args.language as string) || 'typescript';
        const context = (args.context as string) || '';
        const saveTo = args.save_to as string | undefined;
        const framework = (args.framework as string) || '';

        const systemPrompt = `You are KITZ OS Code Generator. Generate clean, production-ready ${language} code.

Rules:
- Output ONLY the code, no markdown fences, no explanations before/after
- Follow existing KITZ OS patterns: ToolSchema interface, callXyz88Mcp for MCP, claudeChat for LLM
- Use ESM imports (import/export, .js extensions)
- Include JSDoc comments for public functions
- Handle errors gracefully
- No console.log in production code (use structured JSON logging)
- TypeScript strict mode compatible
${framework ? `- Framework: ${framework}` : ''}
${context ? `\nCodebase context:\n${context}` : ''}`;

        const result = await generateWithLLM(systemPrompt, description, 8192, 0.2);

        // Strip markdown fences if present
        const code = result
          .replace(/^```(?:typescript|javascript|ts|js|sql|bash|yaml|json)?\s*\n?/gm, '')
          .replace(/```\s*$/gm, '')
          .trim();

        const output: Record<string, unknown> = {
          artifact_type: 'code',
          language,
          content: code,
          char_count: code.length,
          line_count: code.split('\n').length,
        };

        // Save to filesystem if requested
        if (saveTo) {
          const writeResult = await writeArtifact(saveTo, code);
          output.saved = writeResult;
        }

        // Save to knowledge base
        try {
          await callXyz88Mcp('add_knowledge', {
            title: `Generated Code: ${description.slice(0, 80)}`,
            content: code.slice(0, 5000),
            category: 'artifact_code',
          }, traceId);
          output.saved_to_knowledge = true;
        } catch {
          output.saved_to_knowledge = false;
        }

        return output;
      },
    },

    // ── 2. Generate Document ──
    {
      name: 'artifact_generateDocument',
      description: 'Generate a structured document using AI: reports, proposals, plans, emails, specs, README files. Returns formatted markdown.',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['report', 'proposal', 'plan', 'email', 'spec', 'readme', 'runbook', 'changelog', 'custom'],
            description: 'Document type',
          },
          topic: {
            type: 'string',
            description: 'What the document is about',
          },
          context: {
            type: 'string',
            description: 'Business context, data, or background information',
          },
          tone: {
            type: 'string',
            description: 'Writing tone (default: professional, concise)',
          },
          save_to: {
            type: 'string',
            description: 'Optional file path to save (relative to repo root)',
          },
        },
        required: ['type', 'topic'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const docType = args.type as string;
        const topic = args.topic as string;
        const context = (args.context as string) || '';
        const tone = (args.tone as string) || 'professional, concise, Gen Z clarity + disciplined founder';
        const saveTo = args.save_to as string | undefined;

        const typePrompts: Record<string, string> = {
          report: 'Structure: Executive Summary, Key Findings, Data Analysis, Recommendations, Next Steps.',
          proposal: 'Structure: Problem Statement, Proposed Solution, Implementation Plan, Expected ROI, Timeline, Risks.',
          plan: 'Structure: Objective, Current State, Target State, Steps (ordered), Dependencies, Timeline, Success Metrics.',
          email: 'Professional email format. Subject line, greeting, body, call-to-action, sign-off. Max 200 words.',
          spec: 'Technical spec: Overview, Requirements (functional + non-functional), API/Schema, Architecture, Testing Plan.',
          readme: 'README format: Title, Description, Quick Start, Features, API Reference, Environment Variables, Contributing.',
          runbook: 'Runbook format: Purpose, Prerequisites, Step-by-step Procedure, Rollback Plan, Verification Steps, Troubleshooting.',
          changelog: 'CHANGELOG format: Version, Date, Added/Changed/Fixed/Removed sections with bullet points.',
          custom: 'Follow the user instructions for format and structure.',
        };

        const systemPrompt = `You are KITZ OS Document Generator. Create a ${docType} document.

${typePrompts[docType] || typePrompts.custom}

Rules:
- Use markdown formatting
- Be concise — every sentence must earn its place
- Tone: ${tone}
- Include actionable items where relevant
- Use data and numbers when available
- Follow KITZ constitutional principles: diagnose → bottleneck → leverage → recommendation → next step
${context ? `\nBusiness context:\n${context}` : ''}`;

        const doc = await generateWithLLM(systemPrompt, topic, 4096, 0.3);

        const output: Record<string, unknown> = {
          artifact_type: 'document',
          document_type: docType,
          content: doc,
          char_count: doc.length,
          word_count: doc.split(/\s+/).length,
        };

        if (saveTo) {
          const writeResult = await writeArtifact(saveTo, doc);
          output.saved = writeResult;
        }

        try {
          await callXyz88Mcp('add_knowledge', {
            title: `${docType.charAt(0).toUpperCase() + docType.slice(1)}: ${topic.slice(0, 80)}`,
            content: doc.slice(0, 5000),
            category: `artifact_${docType}`,
          }, traceId);
          output.saved_to_knowledge = true;
        } catch {
          output.saved_to_knowledge = false;
        }

        return output;
      },
    },

    // ── 3. Generate Tool (KITZ OS meta-tool) ──
    {
      name: 'artifact_generateTool',
      description: 'Generate a new KITZ OS tool definition. Creates a complete tool module with name, description, parameters schema, risk level, and execute function. Self-healing capability.',
      parameters: {
        type: 'object',
        properties: {
          tool_name: {
            type: 'string',
            description: 'Name for the new tool (e.g., "inventory_check")',
          },
          purpose: {
            type: 'string',
            description: 'What the tool should do, including inputs and outputs',
          },
          risk_level: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'critical'],
            description: 'Risk level (default: medium)',
          },
          uses_mcp: {
            type: 'boolean',
            description: 'Whether the tool needs MCP client access (default: false)',
          },
          uses_llm: {
            type: 'boolean',
            description: 'Whether the tool needs LLM calls (default: false)',
          },
          save_to: {
            type: 'string',
            description: 'Optional file path to save the tool module',
          },
        },
        required: ['tool_name', 'purpose'],
      },
      riskLevel: 'high',
      execute: async (args, traceId) => {
        const toolName = args.tool_name as string;
        const purpose = args.purpose as string;
        const riskLevel = (args.risk_level as string) || 'medium';
        const usesMcp = args.uses_mcp as boolean || false;
        const usesLlm = args.uses_llm as boolean || false;
        const saveTo = args.save_to as string | undefined;

        const systemPrompt = `You are KITZ OS Tool Generator. Generate a complete TypeScript tool module.

The tool must follow this exact pattern:

\`\`\`typescript
import type { ToolSchema } from './registry.js';
${usesMcp ? "import { callXyz88Mcp } from './mcpClient.js';" : ''}

export function getAllXxxTools(): ToolSchema[] {
  return [
    {
      name: '${toolName}',
      description: '...',
      parameters: {
        type: 'object',
        properties: { /* ... */ },
        required: [/* ... */],
      },
      riskLevel: '${riskLevel}',
      execute: async (args, traceId) => {
        // Implementation
      },
    },
  ];
}
\`\`\`

Rules:
- Output ONLY the TypeScript code, no markdown fences
- Use ESM imports with .js extensions
- Include JSDoc comments
- Handle errors with try/catch
- Return structured objects, not strings
- Use structured JSON logging (no console.log)
- TypeScript strict mode compatible
${usesMcp ? '- Use callXyz88Mcp() for data operations' : ''}
${usesLlm ? '- Include Claude API calls with OpenAI fallback (same pattern as braindumpTools.ts)' : ''}`;

        const code = await generateWithLLM(systemPrompt, purpose, 4096, 0.2);

        const cleanCode = code
          .replace(/^```(?:typescript|ts)?\s*\n?/gm, '')
          .replace(/```\s*$/gm, '')
          .trim();

        const output: Record<string, unknown> = {
          artifact_type: 'tool',
          tool_name: toolName,
          content: cleanCode,
          line_count: cleanCode.split('\n').length,
        };

        if (saveTo) {
          const writeResult = await writeArtifact(saveTo, cleanCode);
          output.saved = writeResult;
        }

        return output;
      },
    },

    // ── 4. Self-Heal / Rebuild ──
    {
      name: 'artifact_selfHeal',
      description: 'Self-healing capability: reads a file, checks if it exists, and regenerates it if missing or corrupted. Can rebuild entire tool modules from their descriptions.',
      parameters: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'Path to the file to check/heal (relative to repo root)',
          },
          expected_purpose: {
            type: 'string',
            description: 'What the file should contain/do (used for regeneration)',
          },
          reference_files: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional list of reference file paths to read for context',
          },
        },
        required: ['file_path', 'expected_purpose'],
      },
      riskLevel: 'high',
      execute: async (args, traceId) => {
        const filePath = args.file_path as string;
        const purpose = args.expected_purpose as string;
        const refFiles = (args.reference_files as string[]) || [];

        // Check if file exists
        const existing = await readArtifact(filePath);

        if (existing.success && existing.content && existing.content.length > 50) {
          return {
            status: 'healthy',
            file: filePath,
            line_count: existing.content.split('\n').length,
            message: 'File exists and appears healthy. No healing needed.',
          };
        }

        // File missing or empty — regenerate
        let context = '';
        for (const ref of refFiles.slice(0, 3)) {
          const refContent = await readArtifact(ref);
          if (refContent.success && refContent.content) {
            context += `\n--- ${ref} ---\n${refContent.content.slice(0, 3000)}\n`;
          }
        }

        const ext = path.extname(filePath);
        const language = ext === '.ts' ? 'typescript' : ext === '.sql' ? 'sql' : ext === '.md' ? 'markdown' : 'text';

        const systemPrompt = `You are KITZ OS Self-Healer. Regenerate a missing/corrupted file.

File: ${filePath}
Language: ${language}
Purpose: ${purpose}

Rules:
- Output ONLY the file content, no markdown fences, no explanations
- Match the style and patterns of the reference files
- Ensure the file is complete and functional
- Include all necessary imports and exports
${context ? `\nReference files for style/pattern matching:\n${context}` : ''}`;

        const content = await generateWithLLM(systemPrompt, `Regenerate ${filePath}: ${purpose}`, 8192, 0.2);

        const cleanContent = content
          .replace(/^```(?:typescript|ts|sql|markdown|md|bash)?\s*\n?/gm, '')
          .replace(/```\s*$/gm, '')
          .trim();

        const writeResult = await writeArtifact(filePath, cleanContent);

        return {
          status: writeResult.success ? 'healed' : 'failed',
          file: filePath,
          line_count: cleanContent.split('\n').length,
          write_result: writeResult,
        };
      },
    },

    // ── 5. Generate Migration ──
    {
      name: 'artifact_generateMigration',
      description: 'Generate a SQL migration file for Supabase/PostgreSQL. Creates tables, indexes, RLS policies, and seed data.',
      parameters: {
        type: 'object',
        properties: {
          description: {
            type: 'string',
            description: 'What the migration should do (tables, columns, policies, etc.)',
          },
          tables: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional list of table names to create/modify',
          },
          save_to: {
            type: 'string',
            description: 'Optional file path to save (default: auto-generated in kitz_os/migrations/)',
          },
        },
        required: ['description'],
      },
      riskLevel: 'high',
      execute: async (args, traceId) => {
        const description = args.description as string;
        const tables = (args.tables as string[]) || [];
        const saveTo = (args.save_to as string) ||
          `kitz_os/migrations/${new Date().toISOString().slice(0, 10).replace(/-/g, '')}000000_generated.sql`;

        const systemPrompt = `You are KITZ OS Migration Generator. Create a PostgreSQL migration for Supabase.

Rules:
- Output ONLY SQL, no markdown fences, no comments before/after
- Use IF NOT EXISTS / ON CONFLICT DO NOTHING for idempotency
- Include RLS policies (ALTER TABLE ... ENABLE ROW LEVEL SECURITY)
- Include indexes for foreign keys and frequently queried columns
- Use gen_random_uuid() for UUID defaults
- Use timestamptz for timestamps (DEFAULT now())
- Business ID: 134f52d0-90a3-4806-a1bd-c37ef31d4f6f
- Follow existing KITZ patterns: businesses FK, RLS with is_business_owner()
${tables.length ? `\nTables to create/modify: ${tables.join(', ')}` : ''}`;

        const sql = await generateWithLLM(systemPrompt, description, 4096, 0.1);

        const cleanSql = sql
          .replace(/^```(?:sql)?\s*\n?/gm, '')
          .replace(/```\s*$/gm, '')
          .trim();

        const output: Record<string, unknown> = {
          artifact_type: 'migration',
          content: cleanSql,
          line_count: cleanSql.split('\n').length,
        };

        const writeResult = await writeArtifact(saveTo, cleanSql);
        output.saved = writeResult;

        return output;
      },
    },

    // ── 6. Push to Lovable ──
    {
      name: 'artifact_pushToLovable',
      description: 'Push a generated artifact (code, component, page) to the Lovable frontend project via webhook. Used for frontend development.',
      parameters: {
        type: 'object',
        properties: {
          artifact_type: {
            type: 'string',
            enum: ['component', 'page', 'hook', 'utility', 'style', 'config'],
            description: 'Type of frontend artifact',
          },
          filename: {
            type: 'string',
            description: 'Target filename in the Lovable project (e.g., "src/components/MyComponent.tsx")',
          },
          content: {
            type: 'string',
            description: 'The generated code content to push',
          },
          description: {
            type: 'string',
            description: 'Brief description of what was generated (for the commit message)',
          },
        },
        required: ['artifact_type', 'filename', 'content'],
      },
      riskLevel: 'medium',
      execute: async (args) => {
        const artifactType = args.artifact_type as string;
        const filename = args.filename as string;
        const content = args.content as string;
        const description = (args.description as string) || `Generated ${artifactType}: ${filename}`;

        const result = await pushToLovable(artifactType, content, filename);

        return {
          artifact_type: artifactType,
          filename,
          push_result: result,
          description,
          content_preview: content.slice(0, 200) + (content.length > 200 ? '...' : ''),
        };
      },
    },

    // ── 7. List Artifacts ──
    {
      name: 'artifact_list',
      description: 'List generated artifacts from the knowledge base. Search by category (code, document, tool, migration).',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['artifact_code', 'artifact_report', 'artifact_proposal', 'artifact_plan', 'artifact_spec', 'all'],
            description: 'Filter by artifact category (default: all)',
          },
          limit: {
            type: 'number',
            description: 'Max results (default: 10)',
          },
        },
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const limit = (args.limit as number) || 10;

        try {
          const results = await callXyz88Mcp('list_knowledge', {
            limit,
            category: args.category !== 'all' ? args.category : undefined,
          }, traceId);
          return { artifacts: results };
        } catch (err) {
          return { error: (err as Error).message };
        }
      },
    },

    // ── 8. Read File ──
    {
      name: 'artifact_readFile',
      description: 'Read a file from the KITZ OS codebase. Sandboxed to allowed directories.',
      parameters: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'File path relative to repo root',
          },
        },
        required: ['file_path'],
      },
      riskLevel: 'low',
      execute: async (args) => {
        const filePath = args.file_path as string;
        return readArtifact(filePath);
      },
    },
  ];
}
