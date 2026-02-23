/**
 * SOP Tools — Search, retrieve, create, and update Standard Operating Procedures.
 *
 * Gives the AI agent access to:
 *   - Search SOPs by keyword
 *   - Get a specific SOP by slug
 *   - List all active SOPs
 *   - Create new SOPs (as draft)
 *   - Update existing SOPs (new version)
 */

import type { ToolSchema } from './registry.js';
import { searchSOPs, getSOPBySlug, getAllActiveSOPs, upsertSOP } from '../sops/store.js';
import type { SOPEntry, SOPInput } from '../sops/types.js';

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function getAllSOPTools(): ToolSchema[] {
  return [
    {
      name: 'sop_search',
      description: 'Search SOPs by keyword query. Returns matching standard operating procedures.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search keywords' },
          type: {
            type: 'string',
            enum: ['business', 'agent', 'operational'],
            description: 'Filter by SOP type',
          },
          limit: { type: 'number', description: 'Max results (default 3)' },
        },
        required: ['query'],
      },
      riskLevel: 'low',
      execute: async (args) => {
        const query = args.query as string;
        const typeFilter = args.type as string | undefined;
        const limit = (args.limit as number) || 3;

        let results = searchSOPs(query, limit);

        if (typeFilter) {
          results = results.filter((sop: SOPEntry) => sop.type === typeFilter);
        }

        return results.map((sop: SOPEntry) => ({
          slug: sop.slug,
          title: sop.title,
          summary: sop.summary,
          type: sop.type,
          version: sop.version,
        }));
      },
    },

    {
      name: 'sop_get',
      description: 'Get a specific SOP by its slug. Returns full content.',
      parameters: {
        type: 'object',
        properties: {
          slug: { type: 'string', description: 'SOP slug identifier' },
          version: { type: 'number', description: 'Specific version (default: latest active)' },
        },
        required: ['slug'],
      },
      riskLevel: 'low',
      execute: async (args) => {
        const slug = args.slug as string;
        const version = args.version as number | undefined;

        const entry = getSOPBySlug(slug, version);
        if (!entry) return { error: 'SOP not found' };
        return entry;
      },
    },

    {
      name: 'sop_list',
      description: 'List all active SOPs, optionally filtered by type or team.',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['business', 'agent', 'operational'],
          },
          team: { type: 'string', description: 'Filter by applicable team' },
        },
      },
      riskLevel: 'low',
      execute: async (args) => {
        const typeFilter = args.type as string | undefined;
        const teamFilter = args.team as string | undefined;

        let results = getAllActiveSOPs();

        if (typeFilter) {
          results = results.filter((sop: SOPEntry) => sop.type === typeFilter);
        }

        if (teamFilter) {
          results = results.filter((sop: SOPEntry) =>
            sop.applicableTeams.includes(teamFilter),
          );
        }

        return results.map((sop: SOPEntry) => ({
          slug: sop.slug,
          title: sop.title,
          type: sop.type,
          summary: sop.summary,
          version: sop.version,
        }));
      },
    },

    {
      name: 'sop_create',
      description:
        'Create a new SOP from structured input. Created as draft — needs approval to activate.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          content: { type: 'string', description: 'SOP content in markdown' },
          type: { type: 'string', enum: ['business', 'agent', 'operational'] },
          summary: { type: 'string', description: '1-2 sentence TLDR' },
          triggerKeywords: { type: 'array', items: { type: 'string' } },
          applicableAgents: { type: 'array', items: { type: 'string' } },
          applicableTeams: { type: 'array', items: { type: 'string' } },
          language: { type: 'string', enum: ['en', 'es'] },
        },
        required: ['title', 'content', 'type'],
      },
      riskLevel: 'medium',
      execute: async (args) => {
        const title = args.title as string;
        const slug = slugify(title);

        const input: SOPInput = {
          slug,
          title,
          content: args.content as string,
          type: args.type as SOPEntry['type'],
          summary: (args.summary as string) || '',
          version: 1,
          status: 'draft',
          language: (args.language as SOPEntry['language']) || 'en',
          triggerKeywords: (args.triggerKeywords as string[]) || [],
          applicableAgents: (args.applicableAgents as string[]) || ['*'],
          applicableTeams: (args.applicableTeams as string[]) || [],
          createdBy: 'user',
        };

        await upsertSOP(input);
        return { created: true, slug, version: 1 };
      },
    },

    {
      name: 'sop_update',
      description: 'Update an existing SOP. Creates a new version.',
      parameters: {
        type: 'object',
        properties: {
          slug: { type: 'string' },
          content: { type: 'string' },
          summary: { type: 'string' },
          status: { type: 'string', enum: ['active', 'draft', 'deprecated'] },
        },
        required: ['slug'],
      },
      riskLevel: 'medium',
      execute: async (args) => {
        const slug = args.slug as string;
        const existing = getSOPBySlug(slug);

        if (!existing) {
          return { error: `SOP "${slug}" not found` };
        }

        const newVersion = existing.version + 1;

        const input: SOPInput = {
          slug: existing.slug,
          title: existing.title,
          content: (args.content as string) || existing.content,
          type: existing.type,
          summary: (args.summary as string) || existing.summary,
          version: newVersion,
          status: (args.status as SOPEntry['status']) || existing.status,
          language: existing.language,
          triggerKeywords: existing.triggerKeywords,
          applicableAgents: existing.applicableAgents,
          applicableTeams: existing.applicableTeams,
          createdBy: existing.createdBy,
        };

        await upsertSOP(input);
        return { updated: true, slug, version: newVersion };
      },
    },
  ];
}
