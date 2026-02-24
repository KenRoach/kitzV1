/**
 * Team Task Seeds — Initial tasks for each team during a swarm run.
 *
 * Each team's lead gets seeded with read-only tool invocations.
 * Leads then hand off to members for deeper analysis.
 */

import type { TeamName } from '../types.js';

export interface TeamTaskSeed {
  team: TeamName;
  description: string;
  tools: Array<{
    name: string;
    args: Record<string, unknown>;
  }>;
}

/** Default seed tasks for each of the 18 teams */
export const TEAM_TASK_SEEDS: TeamTaskSeed[] = [
  {
    team: 'sales-crm',
    description: 'Review CRM pipeline, contacts, and recent orders',
    tools: [
      { name: 'crm_listContacts', args: {} },
      { name: 'crm_businessSummary', args: {} },
      { name: 'orders_listOrders', args: {} },
    ],
  },
  {
    team: 'whatsapp-comms',
    description: 'Check connector health and recent conversations',
    tools: [
      { name: 'web_scrape', args: { url: 'https://kitz.services' } },
      { name: 'memory_search', args: { query: 'whatsapp connector status', limit: 10 } },
    ],
  },
  {
    team: 'marketing-growth',
    description: 'Analyze public presence and search visibility',
    tools: [
      { name: 'web_search', args: { query: 'kitz Panama small business' } },
      { name: 'web_scrape', args: { url: 'https://kitz.services' } },
    ],
  },
  {
    team: 'growth-hacking',
    description: 'Review activation funnel and user onboarding metrics',
    tools: [
      { name: 'crm_businessSummary', args: {} },
      { name: 'memory_search', args: { query: 'user activation onboarding', limit: 10 } },
    ],
  },
  {
    team: 'education-onboarding',
    description: 'Assess documentation coverage and FAQ completeness',
    tools: [
      { name: 'memory_search', args: { query: 'documentation tutorials FAQ', limit: 20 } },
    ],
  },
  {
    team: 'customer-success',
    description: 'Review customer satisfaction and support queue',
    tools: [
      { name: 'crm_listContacts', args: {} },
      { name: 'memory_search', args: { query: 'customer feedback satisfaction', limit: 20 } },
    ],
  },
  {
    team: 'content-brand',
    description: 'Evaluate brand voice and content across public pages',
    tools: [
      { name: 'web_scrape', args: { url: 'https://kitz.services' } },
      { name: 'memory_search', args: { query: 'brand voice guidelines', limit: 10 } },
    ],
  },
  {
    team: 'platform-eng',
    description: 'Check platform health and capacity metrics',
    tools: [
      { name: 'dashboard_metrics', args: {} },
      { name: 'memory_search', args: { query: 'service health uptime', limit: 10 } },
      { name: 'n8n_healthCheck', args: {} },
    ],
  },
  {
    team: 'frontend',
    description: 'Audit UI components and accessibility',
    tools: [
      { name: 'web_scrape', args: { url: 'https://kitz.services' } },
      { name: 'memory_search', args: { query: 'UI components design system', limit: 10 } },
    ],
  },
  {
    team: 'backend',
    description: 'Review API architecture and data models',
    tools: [
      { name: 'memory_search', args: { query: 'API endpoints architecture', limit: 20 } },
      { name: 'memory_stats', args: {} },
    ],
  },
  {
    team: 'devops-ci',
    description: 'Check CI/CD pipeline health and deployment status',
    tools: [
      { name: 'dashboard_metrics', args: {} },
      { name: 'memory_search', args: { query: 'deployment pipeline status', limit: 10 } },
      { name: 'n8n_healthCheck', args: {} },
      { name: 'n8n_listWorkflows', args: {} },
    ],
  },
  {
    team: 'qa-testing',
    description: 'Verify API endpoints and test coverage',
    tools: [
      { name: 'web_scrape', args: { url: 'https://kitz.services' } },
      { name: 'dashboard_metrics', args: {} },
    ],
  },
  {
    team: 'ai-ml',
    description: 'Check AI/ML provider status and memory usage',
    tools: [
      { name: 'memory_stats', args: {} },
      { name: 'memory_search', args: { query: 'LLM provider costs usage', limit: 10 } },
    ],
  },
  {
    team: 'finance-billing',
    description: 'Review revenue, billing, and cost metrics',
    tools: [
      { name: 'orders_listOrders', args: {} },
      { name: 'dashboard_metrics', args: {} },
      { name: 'n8n_listWorkflows', args: {} },
    ],
  },
  {
    team: 'legal-compliance',
    description: 'Audit compliance status and data retention',
    tools: [
      { name: 'memory_search', args: { query: 'Panama compliance audit', limit: 20 } },
      { name: 'memory_stats', args: {} },
    ],
  },
  {
    team: 'strategy-intel',
    description: 'Scan competitive landscape and market trends',
    tools: [
      { name: 'web_search', args: { query: 'Panama SMB business software competition' } },
      { name: 'web_search', args: { query: 'LatAm small business technology trends 2025' } },
    ],
  },
  {
    team: 'governance-pmo',
    description: 'Review project velocity and risk register',
    tools: [
      { name: 'dashboard_metrics', args: {} },
      { name: 'memory_search', args: { query: 'sprint velocity risk register', limit: 10 } },
    ],
  },
  {
    team: 'coaches',
    description: 'Review agent performance and training needs',
    tools: [
      { name: 'memory_search', args: { query: 'agent performance training', limit: 20 } },
      { name: 'memory_stats', args: {} },
    ],
  },
  {
    team: 'meta-tooling',
    description: 'Audit custom tools, verify n8n connectivity, and review tool factory health',
    tools: [
      { name: 'toolFactory_listCustomTools', args: {} },
      { name: 'n8n_healthCheck', args: {} },
      { name: 'n8n_listWorkflows', args: {} },
      { name: 'toolFactory_listCustomTools', args: { type: 'compute' } },
    ],
  },
];

/** Get seed tasks for a specific team */
export function getTeamSeed(team: TeamName): TeamTaskSeed | undefined {
  return TEAM_TASK_SEEDS.find((s) => s.team === team);
}

/** Get all team names that have seeds */
export function getSeededTeams(): TeamName[] {
  return TEAM_TASK_SEEDS.map((s) => s.team);
}
