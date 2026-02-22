/**
 * Lovable Project Management Tools
 *
 * Manage multiple Lovable.dev projects from KITZ OS.
 * Each project has a unique ID, URL, and webhook configuration.
 *
 * Capabilities:
 *   - List connected Lovable projects
 *   - Add new Lovable projects (with webhook config)
 *   - Push artifacts to specific Lovable projects
 *   - Get project status
 *
 * Projects are stored in a local JSON config file at kitz_os/config/lovable-projects.json.
 * This keeps them persistent across restarts without requiring a DB migration.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { ToolSchema } from './registry.js';

// ── Types ──
interface LovableProject {
  id: string;
  name: string;
  url: string;
  supabase_project_id?: string;
  supabase_url?: string;
  webhook_url?: string;
  webhook_token?: string;
  github_repo?: string;
  description?: string;
  added_at: string;
  last_push_at?: string;
}

interface LovableConfig {
  projects: LovableProject[];
  default_project_id?: string;
}

// ── Config File Path ──
const CONFIG_PATH = path.resolve(process.cwd(), 'config', 'lovable-projects.json');

// ── Config CRUD ──
async function loadConfig(): Promise<LovableConfig> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, 'utf-8');
    return JSON.parse(raw) as LovableConfig;
  } catch {
    return { projects: [] };
  }
}

async function saveConfig(config: LovableConfig): Promise<void> {
  await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

// ── Tools ──
export function getAllLovableTools(): ToolSchema[] {
  return [
    // ── 1. List Projects ──
    {
      name: 'lovable_listProjects',
      description: 'List all connected Lovable.dev projects with their IDs, names, URLs, and status.',
      parameters: {
        type: 'object',
        properties: {},
      },
      riskLevel: 'low',
      execute: async () => {
        const config = await loadConfig();
        return {
          project_count: config.projects.length,
          default_project: config.default_project_id || 'none',
          projects: config.projects.map(p => ({
            id: p.id,
            name: p.name,
            url: p.url,
            supabase_project_id: p.supabase_project_id || 'not set',
            github_repo: p.github_repo || 'not set',
            description: p.description || '',
            has_webhook: !!(p.webhook_url && p.webhook_token),
            added_at: p.added_at,
            last_push_at: p.last_push_at || 'never',
          })),
        };
      },
    },

    // ── 2. Add Project ──
    {
      name: 'lovable_addProject',
      description: 'Add a new Lovable.dev project to KITZ OS. Provide the project URL, name, and optional webhook config.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Project name (e.g., "workspace", "admin-dashboard")',
          },
          url: {
            type: 'string',
            description: 'Lovable project URL (e.g., "https://lovable.dev/projects/0dd377df-...")',
          },
          project_id: {
            type: 'string',
            description: 'Lovable project UUID (extracted from URL if not provided)',
          },
          supabase_project_id: {
            type: 'string',
            description: 'Optional Supabase project ID linked to this Lovable project',
          },
          supabase_url: {
            type: 'string',
            description: 'Optional Supabase URL (e.g., "https://xxx.supabase.co")',
          },
          github_repo: {
            type: 'string',
            description: 'Optional GitHub repo (e.g., "KenRoach/workspace")',
          },
          description: {
            type: 'string',
            description: 'Optional project description',
          },
          webhook_url: {
            type: 'string',
            description: 'Optional webhook URL for pushing artifacts',
          },
          webhook_token: {
            type: 'string',
            description: 'Optional webhook auth token',
          },
          set_as_default: {
            type: 'boolean',
            description: 'Set this as the default project for artifact pushes (default: false)',
          },
        },
        required: ['name', 'url'],
      },
      riskLevel: 'medium',
      execute: async (args) => {
        const config = await loadConfig();
        const url = args.url as string;

        // Extract project ID from URL if not provided
        let projectId = args.project_id as string | undefined;
        if (!projectId) {
          const match = url.match(/projects\/([0-9a-f-]{36})/);
          projectId = match?.[1] || crypto.randomUUID();
        }

        // Check for duplicates
        if (config.projects.some(p => p.id === projectId)) {
          return { error: `Project ${projectId} already exists. Use lovable_updateProject to modify.` };
        }

        const newProject: LovableProject = {
          id: projectId,
          name: args.name as string,
          url: url.split('?')[0], // Remove query params (magic_link, etc.)
          supabase_project_id: args.supabase_project_id as string | undefined,
          supabase_url: args.supabase_url as string | undefined,
          github_repo: args.github_repo as string | undefined,
          description: args.description as string | undefined,
          webhook_url: args.webhook_url as string | undefined,
          webhook_token: args.webhook_token as string | undefined,
          added_at: new Date().toISOString(),
        };

        config.projects.push(newProject);

        if (args.set_as_default || config.projects.length === 1) {
          config.default_project_id = projectId;
        }

        await saveConfig(config);

        return {
          success: true,
          project: {
            id: newProject.id,
            name: newProject.name,
            url: newProject.url,
            is_default: config.default_project_id === projectId,
          },
          total_projects: config.projects.length,
        };
      },
    },

    // ── 3. Update Project ──
    {
      name: 'lovable_updateProject',
      description: 'Update an existing Lovable project configuration (webhook, description, GitHub repo, etc.)',
      parameters: {
        type: 'object',
        properties: {
          project_id: { type: 'string', description: 'Project UUID to update' },
          name: { type: 'string', description: 'New project name' },
          description: { type: 'string', description: 'New description' },
          webhook_url: { type: 'string', description: 'New webhook URL' },
          webhook_token: { type: 'string', description: 'New webhook token' },
          github_repo: { type: 'string', description: 'GitHub repo' },
          supabase_url: { type: 'string', description: 'Supabase URL' },
          set_as_default: { type: 'boolean', description: 'Set as default project' },
        },
        required: ['project_id'],
      },
      riskLevel: 'medium',
      execute: async (args) => {
        const config = await loadConfig();
        const projectId = args.project_id as string;
        const project = config.projects.find(p => p.id === projectId);

        if (!project) {
          return { error: `Project ${projectId} not found` };
        }

        // Update fields
        if (args.name) project.name = args.name as string;
        if (args.description) project.description = args.description as string;
        if (args.webhook_url) project.webhook_url = args.webhook_url as string;
        if (args.webhook_token) project.webhook_token = args.webhook_token as string;
        if (args.github_repo) project.github_repo = args.github_repo as string;
        if (args.supabase_url) project.supabase_url = args.supabase_url as string;
        if (args.set_as_default) config.default_project_id = projectId;

        await saveConfig(config);

        return { success: true, project: { id: project.id, name: project.name } };
      },
    },

    // ── 4. Remove Project ──
    {
      name: 'lovable_removeProject',
      description: 'Remove a Lovable project from the KITZ OS configuration.',
      parameters: {
        type: 'object',
        properties: {
          project_id: { type: 'string', description: 'Project UUID to remove' },
        },
        required: ['project_id'],
      },
      riskLevel: 'high',
      execute: async (args) => {
        const config = await loadConfig();
        const projectId = args.project_id as string;
        const idx = config.projects.findIndex(p => p.id === projectId);

        if (idx === -1) {
          return { error: `Project ${projectId} not found` };
        }

        const removed = config.projects.splice(idx, 1)[0];
        if (config.default_project_id === projectId) {
          config.default_project_id = config.projects[0]?.id;
        }

        await saveConfig(config);

        return { success: true, removed: removed.name, remaining: config.projects.length };
      },
    },

    // ── 5. Push Artifact to Project ──
    {
      name: 'lovable_pushArtifact',
      description: 'Push a generated artifact (component, page, hook) to a specific Lovable project via webhook.',
      parameters: {
        type: 'object',
        properties: {
          project_id: {
            type: 'string',
            description: 'Target Lovable project UUID. Uses default if not specified.',
          },
          artifact_type: {
            type: 'string',
            enum: ['component', 'page', 'hook', 'utility', 'style', 'config', 'api'],
            description: 'Type of artifact',
          },
          filename: {
            type: 'string',
            description: 'Target path in the project (e.g., "src/components/Dashboard.tsx")',
          },
          content: {
            type: 'string',
            description: 'The code/content to push',
          },
          commit_message: {
            type: 'string',
            description: 'Optional commit message',
          },
        },
        required: ['artifact_type', 'filename', 'content'],
      },
      riskLevel: 'medium',
      execute: async (args) => {
        const config = await loadConfig();
        const projectId = (args.project_id as string) || config.default_project_id;

        if (!projectId) {
          return { error: 'No project specified and no default project set. Use lovable_addProject first.' };
        }

        const project = config.projects.find(p => p.id === projectId);
        if (!project) {
          return { error: `Project ${projectId} not found` };
        }

        if (!project.webhook_url || !project.webhook_token) {
          return {
            error: 'Webhook not configured for this project. Use lovable_updateProject to add webhook_url and webhook_token.',
            project: project.name,
          };
        }

        try {
          const res = await fetch(project.webhook_url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${project.webhook_token}`,
            },
            body: JSON.stringify({
              type: 'artifact_push',
              source: 'kitz-os',
              project_id: project.id,
              project_name: project.name,
              timestamp: new Date().toISOString(),
              artifact_type: args.artifact_type,
              filename: args.filename,
              content: args.content,
              commit_message: args.commit_message || `KITZ OS: ${args.artifact_type} ${args.filename}`,
            }),
            signal: AbortSignal.timeout(15_000),
          });

          // Update last push timestamp
          project.last_push_at = new Date().toISOString();
          await saveConfig(config);

          return {
            success: res.ok,
            project: project.name,
            filename: args.filename,
            status: res.ok ? 'pushed' : `failed (HTTP ${res.status})`,
          };
        } catch (err) {
          return {
            success: false,
            project: project.name,
            error: (err as Error).message,
          };
        }
      },
    },

    // ── 6. Link Projects ──
    {
      name: 'lovable_linkProjects',
      description: 'Link two Lovable projects together (e.g., frontend + admin dashboard). Creates a bidirectional reference.',
      parameters: {
        type: 'object',
        properties: {
          project_a_id: { type: 'string', description: 'First project UUID' },
          project_b_id: { type: 'string', description: 'Second project UUID' },
          relationship: {
            type: 'string',
            enum: ['frontend-backend', 'admin-main', 'staging-production', 'shared-codebase'],
            description: 'Type of relationship between projects',
          },
        },
        required: ['project_a_id', 'project_b_id', 'relationship'],
      },
      riskLevel: 'low',
      execute: async (args) => {
        const config = await loadConfig();
        const a = config.projects.find(p => p.id === args.project_a_id);
        const b = config.projects.find(p => p.id === args.project_b_id);

        if (!a) return { error: `Project ${args.project_a_id} not found` };
        if (!b) return { error: `Project ${args.project_b_id} not found` };

        // Store link in description metadata
        const linkNote = `Linked to "${b.name}" (${b.id}) — ${args.relationship}`;
        a.description = a.description ? `${a.description}\n${linkNote}` : linkNote;

        const reverseLinkNote = `Linked to "${a.name}" (${a.id}) — ${args.relationship}`;
        b.description = b.description ? `${b.description}\n${reverseLinkNote}` : reverseLinkNote;

        await saveConfig(config);

        return {
          success: true,
          linked: [
            { id: a.id, name: a.name },
            { id: b.id, name: b.name },
          ],
          relationship: args.relationship,
        };
      },
    },
  ];
}
