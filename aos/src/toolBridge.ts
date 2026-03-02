/**
 * AOS ↔ kitz_os Tool Bridge
 *
 * Maps agent roles to the kitz_os tools they're allowed to invoke.
 * Provides a scoped invokeTool() method for BaseAgent.
 *
 * Design principles:
 *   - Read tools (list, get, search) are broadly available
 *   - Write tools (create, update, delete) require higher trust
 *   - Outbound tools (sendWhatsApp, sendEmail) require C-suite or explicit scope
 *   - Payment tools are CFO/CRO only
 *   - All invocations are logged for audit
 */

// Local interface to avoid cross-service import (audit finding 6c)
interface OsToolRegistry {
  has(name: string): boolean;
  invoke(name: string, args: Record<string, unknown>, traceId?: string): Promise<unknown>;
  get(name: string): { name: string; description: string; parameters: Record<string, unknown> } | undefined;
}

import type { AgentTier, TeamName } from './types.js';

// ── Tool Permission Groups ──

/** Read-only tools available to all agents */
const READ_TOOLS = [
  'crm_listContacts',
  'crm_getContact',
  'crm_businessSummary',
  'orders_listOrders',
  'orders_getOrder',
  'storefronts_list',
  'products_list',
  'dashboard_metrics',
  'email_listInbox',
  'memory_search',
  'memory_search_conversations',
  'memory_search_knowledge',
  'memory_get_context',
  'memory_stats',
  'sop_search',
  'sop_get',
  'sop_list',
  'payments_listTransactions',
  'payments_getTransaction',
  'payments_summary',
  'calendar_listEvents',
  'calendar_today',
  'calendar_findSlot',
  'web_search',
  'web_scrape',
  'web_summarize',
  'web_extract',
  'compliance_factCheck',
  'voice_listVoices',
  'voice_getConfig',
  'inventory_checkStock',
  'inventory_lowStockAlerts',
  'n8n_listWorkflows',
  'n8n_getWorkflow',
  'n8n_getExecutions',
  'n8n_healthCheck',
  // RAG Intelligence
  'rag_search',
  'rag_listDocs',
  // Country Config
  'country_getConfig',
  'country_validateTaxId',
  // Content Loop (read)
  'content_measure',
  'content_suggestBoost',
  // AI Advisor Calculators
  'advisor_employerCost',
  'advisor_severance',
  'advisor_pricing',
  'advisor_breakeven',
  'advisor_unitEconomics',
  'advisor_runway',
  'advisor_invoiceTax',
  'advisor_loanPayment',
];

/** CRM write tools — sales team + C-suite */
const CRM_WRITE_TOOLS = [
  'crm_createContact',
  'crm_updateContact',
  'orders_createOrder',
  'orders_updateOrder',
  'storefronts_create',
  'storefronts_update',
  'storefronts_send',
  'storefronts_markPaid',
  'products_create',
  'products_update',
  'inventory_adjustStock',
];

/** Outbound messaging — draft-first, C-suite or explicit scope */
const OUTBOUND_TOOLS = [
  'outbound_sendWhatsApp',
  'outbound_sendEmail',
  'outbound_sendVoiceNote',
  'outbound_makeCall',
  'email_compose',
];

/** Payment operation tools — CFO/CRO only */
const PAYMENT_TOOLS = [
  'payments_processWebhook',
];

/** Content generation — marketing, content, AI teams */
const CONTENT_TOOLS = [
  'artifact_generateCode',
  'artifact_generateDocument',
  'artifact_generateTool',
  'artifact_list',
  'artifact_readFile',
  'braindump_process',
  'doc_scan',
  'voice_speak',
  'media_analyze_product',
  'media_scan_receipt',
  'media_describe',
  'media_ocr',
  // Content Loop
  'content_publish',
  'content_promote',
];

/** Calendar write tools — ops/admin */
const CALENDAR_WRITE_TOOLS = [
  'calendar_addEvent',
  'calendar_updateEvent',
  'calendar_deleteEvent',
  'calendar_addTask',
];

/** Knowledge management */
const KNOWLEDGE_TOOLS = [
  'memory_store_knowledge',
  'sop_create',
  'sop_update',
  'rag_index',
  'country_configure',
];

/** Lovable/frontend tools */
const LOVABLE_TOOLS = [
  'lovable_listProjects',
  'lovable_addProject',
  'lovable_updateProject',
  'lovable_removeProject',
  'lovable_pushArtifact',
  'lovable_linkProjects',
  'artifact_pushToLovable',
];

/** LLM direct access tools — C-suite, AI-ML team, strategy, key agents */
const LLM_TOOLS = [
  'agent_chat',
  'llm_complete',
  'llm_analyze',
  'llm_strategize',
];

/** Critical destructive tools — require explicit per-agent approval */
const CRITICAL_TOOLS = [
  'storefronts_delete',
  'products_delete',
  'artifact_selfHeal',
  'artifact_generateMigration',
  'email_sendApprovalRequest',
];

/** n8n workflow automation tools */
const N8N_TOOLS = [
  'n8n_listWorkflows',
  'n8n_getWorkflow',
  'n8n_executeWorkflow',
  'n8n_triggerWebhook',
  'n8n_activateWorkflow',
  'n8n_getExecutions',
  'n8n_healthCheck',
];

// ── Role → Tool Mapping ──

/** Get allowed tools for an agent based on tier and team */
export function getAllowedTools(
  agentName: string,
  tier: AgentTier,
  team?: TeamName,
): string[] {
  const tools = new Set<string>(READ_TOOLS);

  // Tier-based access
  switch (tier) {
    case 'c-suite':
      // C-suite gets broad access including LLM
      CRM_WRITE_TOOLS.forEach(t => tools.add(t));
      OUTBOUND_TOOLS.forEach(t => tools.add(t));
      CONTENT_TOOLS.forEach(t => tools.add(t));
      CALENDAR_WRITE_TOOLS.forEach(t => tools.add(t));
      KNOWLEDGE_TOOLS.forEach(t => tools.add(t));
      LLM_TOOLS.forEach(t => tools.add(t));
      N8N_TOOLS.forEach(t => tools.add(t));
      // Specific C-suite roles get extra tools
      if (agentName === 'CFO' || agentName === 'CRO') {
        PAYMENT_TOOLS.forEach(t => tools.add(t));
      }
      if (agentName === 'CTO' || agentName === 'HeadEngineering') {
        LOVABLE_TOOLS.forEach(t => tools.add(t));
        CRITICAL_TOOLS.forEach(t => tools.add(t));
      }
      break;

    case 'board':
      // Board: read + knowledge + LLM for strategic deliberation
      KNOWLEDGE_TOOLS.forEach(t => tools.add(t));
      LLM_TOOLS.forEach(t => tools.add(t));
      break;

    case 'governance':
    case 'external':
      // Advisory tiers: read-only + knowledge management
      KNOWLEDGE_TOOLS.forEach(t => tools.add(t));
      break;

    case 'team':
      // Team agents get tools based on their team
      if (team) {
        const teamTools = getTeamTools(team);
        teamTools.forEach(t => tools.add(t));
      }
      break;

    case 'guardian':
      // Guardians: read + content tools for self-repair
      CONTENT_TOOLS.forEach(t => tools.add(t));
      KNOWLEDGE_TOOLS.forEach(t => tools.add(t));
      break;

    case 'coach':
      // Coaches: read + knowledge management
      KNOWLEDGE_TOOLS.forEach(t => tools.add(t));
      CONTENT_TOOLS.forEach(t => tools.add(t));
      break;
  }

  return Array.from(tools);
}

/** Get additional tools for specific teams */
function getTeamTools(team: TeamName): string[] {
  switch (team) {
    case 'sales-crm':
      return [...CRM_WRITE_TOOLS, ...OUTBOUND_TOOLS, 'n8n_triggerWebhook'];

    case 'marketing-growth':
    case 'growth-hacking':
    case 'content-brand':
      return [...CONTENT_TOOLS, ...OUTBOUND_TOOLS, 'n8n_triggerWebhook'];

    case 'customer-success':
    case 'whatsapp-comms':
      return [...CRM_WRITE_TOOLS, ...OUTBOUND_TOOLS, 'n8n_triggerWebhook'];

    case 'education-onboarding':
      return [...CONTENT_TOOLS, ...KNOWLEDGE_TOOLS];

    case 'platform-eng':
      return [...CONTENT_TOOLS, ...LOVABLE_TOOLS, ...KNOWLEDGE_TOOLS, ...N8N_TOOLS];

    case 'backend':
      return [...CONTENT_TOOLS, ...LOVABLE_TOOLS, ...KNOWLEDGE_TOOLS, 'n8n_executeWorkflow', 'n8n_triggerWebhook'];

    case 'frontend':
      return [...CONTENT_TOOLS, ...LOVABLE_TOOLS, ...KNOWLEDGE_TOOLS];

    case 'devops-ci':
      return [...CONTENT_TOOLS, ...KNOWLEDGE_TOOLS, ...N8N_TOOLS];

    case 'qa-testing':
      return [...CONTENT_TOOLS, ...KNOWLEDGE_TOOLS];

    case 'ai-ml':
      return [...CONTENT_TOOLS, ...KNOWLEDGE_TOOLS, ...LLM_TOOLS];

    case 'finance-billing':
      return [...PAYMENT_TOOLS, ...CRM_WRITE_TOOLS, ...LLM_TOOLS, 'n8n_triggerWebhook'];

    case 'legal-compliance':
      return [...KNOWLEDGE_TOOLS, ...LLM_TOOLS];

    case 'strategy-intel':
      return [...KNOWLEDGE_TOOLS, ...CALENDAR_WRITE_TOOLS, ...LLM_TOOLS];

    case 'governance-pmo':
      return [...KNOWLEDGE_TOOLS, ...CALENDAR_WRITE_TOOLS, ...LLM_TOOLS];

    case 'coaches':
      return [...KNOWLEDGE_TOOLS, ...CONTENT_TOOLS];

    default:
      return [];
  }
}

// ── Tool Bridge (connects AOS agents to kitz_os OsToolRegistry) ──

export interface ToolInvocationResult {
  success: boolean;
  data?: unknown;
  error?: string;
  toolName: string;
  agentName: string;
  traceId: string;
}

export class AgentToolBridge {
  constructor(private registry: OsToolRegistry) {}

  /** Invoke a tool on behalf of an agent, enforcing permissions */
  async invoke(
    agentName: string,
    tier: AgentTier,
    team: TeamName | undefined,
    toolName: string,
    args: Record<string, unknown>,
    traceId: string,
  ): Promise<ToolInvocationResult> {
    const allowed = getAllowedTools(agentName, tier, team);

    if (!allowed.includes(toolName)) {
      return {
        success: false,
        error: `Agent "${agentName}" (${tier}/${team || 'no-team'}) is not permitted to use tool "${toolName}"`,
        toolName,
        agentName,
        traceId,
      };
    }

    if (!this.registry.has(toolName)) {
      return {
        success: false,
        error: `Tool "${toolName}" not found in registry`,
        toolName,
        agentName,
        traceId,
      };
    }

    const result = await this.registry.invoke(toolName, args, traceId);

    // Check for tool-level errors
    if (result && typeof result === 'object' && 'error' in result) {
      return {
        success: false,
        error: String((result as Record<string, unknown>).error),
        toolName,
        agentName,
        traceId,
      };
    }

    return {
      success: true,
      data: result,
      toolName,
      agentName,
      traceId,
    };
  }

  /** List tools an agent is allowed to use */
  listAllowed(agentName: string, tier: AgentTier, team?: TeamName): string[] {
    return getAllowedTools(agentName, tier, team)
      .filter(t => this.registry.has(t));
  }

  /** Get Claude API-format tool schemas for an agent's allowed tools */
  getToolSchemas(
    agentName: string,
    tier: AgentTier,
    team?: TeamName,
  ): Array<{ name: string; description: string; input_schema: Record<string, unknown> }> {
    const allowed = this.listAllowed(agentName, tier, team);
    const schemas: Array<{ name: string; description: string; input_schema: Record<string, unknown> }> = [];

    for (const toolName of allowed) {
      const tool = this.registry.get(toolName);
      if (tool) {
        schemas.push({
          name: tool.name,
          description: tool.description,
          input_schema: tool.parameters && Object.keys(tool.parameters).length > 0
            ? tool.parameters
            : { type: 'object', properties: {} },
        });
      }
    }

    return schemas;
  }
}
