/**
 * Semantic Router — AI-Powered Intent + Tool Execution + Response
 *
 * 5-Phase Pipeline:
 *   1. READ       — Understand the user's intent (Claude Haiku)
 *   2. COMPREHEND — Classify and extract entities (Claude Haiku)
 *   3. BRAINSTORM — Plan tool strategy (Claude Sonnet for complex, Haiku for simple)
 *   4. EXECUTE    — Run tool-use loops (OpenAI gpt-4o-mini preferred, Claude Haiku fallback)
 *   5. VOICE      — Format response for WhatsApp (Claude Haiku)
 *
 * AI Strategy: Hybrid Load-Balanced
 *   - Claude for thinking (Opus → Sonnet → Haiku by complexity)
 *   - OpenAI gpt-4o-mini for transactional tool-routing (cheapest)
 *   - Bidirectional fallbacks on failure
 *
 * 68+ tools across CRM, Orders, Storefronts, Products, Dashboard,
 * Email, Brain Dump, Doc Scan, Fact Check, Calendar, Agents, Outbound, Payments, Voice.
 */

import { chatCompletion, getAiModel, type ChatMessage, type ToolDef } from '../../llm/aiClient.js';
import { callXyz88Mcp } from '../../tools/mcpClient.js';
import type { OsToolRegistry } from '../../tools/registry.js';
import { recordLLMSpend, hasBudget, getBatteryStatus } from '../../aiBattery.js';

// ── Tool-to-MCP Mapping ──
// Maps KITZ OS tool names to xyz88-io MCP tool names for direct execution
const TOOL_TO_MCP: Record<string, string> = {
  // CRM
  'crm_listContacts': 'list_contacts',
  'crm_getContact': 'get_contact',
  'crm_createContact': 'create_contact',
  'crm_updateContact': 'update_contact',
  'crm_businessSummary': 'business_summary',
  // Orders
  'orders_listOrders': 'list_orders',
  'orders_getOrder': 'get_order',
  'orders_createOrder': 'create_order',
  'orders_updateOrder': 'update_order',
  // Storefronts
  'storefronts_list': 'list_storefronts',
  'storefronts_create': 'create_storefront',
  'storefronts_update': 'update_storefront',
  'storefronts_delete': 'delete_storefront',
  'storefronts_markPaid': 'mark_storefront_paid',
  'storefronts_send': 'send_storefront',
  // Products
  'products_list': 'list_products',
  'products_create': 'create_product',
  'products_update': 'update_product',
  'products_delete': 'delete_product',
  // Dashboard
  'dashboard_metrics': 'dashboard_metrics',
  // Email
  'email_listInbox': 'list_inbox_messages',
  // Payments
  'payments_listTransactions': 'list_payment_transactions',
  'payments_getTransaction': 'get_payment_transaction',
};

// Tools the AI can call directly (not through MCP)
const DIRECT_EXECUTE_TOOLS = new Set([
  'email_compose', 'email_sendApprovalRequest',
  'braindump_process',
  'doc_scan',
  'compliance_factCheck',
  'agent_chat',
  'outbound_sendWhatsApp', 'outbound_sendEmail',
  'calendar_listEvents', 'calendar_addEvent', 'calendar_updateEvent',
  'calendar_deleteEvent', 'calendar_findSlot', 'calendar_addTask', 'calendar_today',
  // Artifact creation tools
  'artifact_generateCode', 'artifact_generateDocument', 'artifact_generateTool',
  'artifact_selfHeal', 'artifact_generateMigration', 'artifact_pushToLovable',
  'artifact_list', 'artifact_readFile',
  // Lovable project management
  'lovable_listProjects', 'lovable_addProject', 'lovable_updateProject',
  'lovable_removeProject', 'lovable_pushArtifact', 'lovable_linkProjects',
  // Payment receiver tools
  'payments_processWebhook', 'payments_summary',
  // Voice tools (ElevenLabs)
  'voice_speak', 'voice_listVoices', 'voice_getConfig', 'voice_getWidget', 'voice_getSignedUrl',
  // WhatsApp voice + call tools
  'outbound_sendVoiceNote', 'outbound_makeCall',
  // Web scraping + search tools
  'web_scrape', 'web_search', 'web_summarize', 'web_extract',
]);

// ── System Prompt ──
function buildSystemPrompt(toolCount: number): string {
  return `You are KITZ, an AI Business Operating System responding via WhatsApp.

You are the execution engine for a small business. You have ${toolCount} tools available to fulfill requests.

CAPABILITIES:
- **CRM** — List, search, create, and update contacts. Never delete.
- **ORDERS** — List, create, update orders/invoices. Mark as paid, fulfilled, shipped.
- **STOREFRONTS** — Create payment links/invoices, mark paid (6-step transaction), send to buyer, delete (email-gated).
- **PRODUCTS** — Create, update, delete (email-gated) catalog products.
- **DASHBOARD** — Real-time KPIs: Today's Revenue, Active Orders, Follow-ups, Hot Leads, Risky Orders.
- **EMAIL** — Read inbox (all). Only admin_assistant can compose/send.
- **BRAIN DUMP** — Process voice/text ideas into structured reports with key points, pros, cons, next steps. Saves to knowledge base.
- **DOC SCAN** — Scan images/PDFs (business cards, invoices, receipts) → extract structured data → update CRM.
- **FACT CHECK** — Validate outbound messages against real business data before sending.
- **CALENDAR** — Full Google Calendar management: list events, add/update/delete events, add tasks, find free slots, view today's schedule. Use calendar_today for quick daily view, calendar_addEvent for scheduling, calendar_addTask for reminders/to-dos, calendar_findSlot for availability, calendar_updateEvent/calendar_deleteEvent to modify existing events.
- **AGENTS** — Route to specialized agents (CEO, Sales, Ops, CFO, etc.) for strategic thinking.
- **ARTIFACTS** — Generate code, documents, tools, SQL migrations, and push to Lovable. Self-healing: regenerate missing files.
- **LOVABLE** — Manage Lovable.dev projects: add, list, link, remove projects. Push artifacts to specific projects. Send prompts to Lovable AI chat.
- **PAYMENTS** — View payment transactions by provider (Stripe, PayPal, Yappy, BAC), status, or date range. Get revenue summaries (today/week/month). Receive-only — never send money outbound.
- **VOICE** — KITZ has a female voice (ElevenLabs). Convert text to speech audio. Send voice notes via WhatsApp. Make WhatsApp calls. Get voice widget for websites.
- **WEB** — Browse the internet: web_search (Google search), web_scrape (fetch any URL), web_summarize (AI-summarize a page), web_extract (pull prices, contacts, data from pages). Use for research, competitive analysis, price checking, or finding information online.

RESPONSE STYLE:
- Default replies: 5-7 words. Keep it tight.
- If more detail needed: 15-23 words max.
- Complex topics: break into chunks of 30 words max.
- If it truly requires more detail: say "I'll send the details by email" and use email tool.
- Tone: cool, chill, confident. Never mad, never rude. Good vibes only.
- Think of yourself as a calm, capable friend who runs businesses.

RULES:
1. Execute READ operations directly — no confirmation needed.
2. For WRITE operations (create/update), confirm what you did.
3. For DELETE operations, explain that email approval is required.
4. Format for WhatsApp: short paragraphs, *bold* headers, bullet points with •
5. Use emojis sparingly for visual scanning (📋, 📦, 💰, 📊, 🧠, ✅, ⚠️)
6. Never fabricate data. If a tool returns empty, say so.
7. Max 4096 chars per response.
8. Be concise — this is WhatsApp, not email.
9. For brain dump / idea processing, use braindump_process tool.
10. For dashboard/metrics/how-are-we-doing, use dashboard_metrics.
11. When asked about multiple things, use multiple tools in sequence.
12. If the request is unclear, ask ONE clarifying question.
13. For code generation, use artifact_generateCode. For document generation, use artifact_generateDocument.
14. For self-healing / rebuilding missing files, use artifact_selfHeal.
15. For SQL migrations, use artifact_generateMigration.
16. For creating new KITZ OS tools, use artifact_generateTool.
17. For pushing frontend code to Lovable, use artifact_pushToLovable.
18. For payment queries ("today's payments", "revenue", "how much did we make"), use payments_summary.
19. For payment history or details, use payments_listTransactions or payments_getTransaction.
20. NEVER initiate outbound payments. Only receive and record incoming payments.
21. For voice responses, use voice_speak to generate audio, then outbound_sendVoiceNote to deliver via WhatsApp.
22. For WhatsApp calls, use outbound_makeCall. Calls use KITZ's female voice (ElevenLabs TTS).
23. When user says "say that" or "read this aloud" or "voice note", use voice_speak + outbound_sendVoiceNote.
24. KITZ's voice is female, warm, professional, and multilingual (Spanish-first, English fluent).`;
}

// ── Execute a tool ──
async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  registry: OsToolRegistry,
  traceId: string,
): Promise<string> {
  // Check if tool maps to MCP
  const mcpToolName = TOOL_TO_MCP[toolName];
  if (mcpToolName) {
    const result = await callXyz88Mcp(mcpToolName, args, traceId);
    return typeof result === 'string' ? result : JSON.stringify(result);
  }

  // Check if tool is direct-execute (handled by OS)
  if (DIRECT_EXECUTE_TOOLS.has(toolName)) {
    const result = await registry.invoke(toolName, args, traceId);
    return typeof result === 'string' ? result : JSON.stringify(result);
  }

  // Unknown tool
  return JSON.stringify({ error: `Unknown tool: ${toolName}` });
}

// ── Main Router ──
export async function routeWithAI(
  userMessage: string,
  registry: OsToolRegistry,
  traceId: string,
  mediaContext?: { media_base64: string; mime_type: string },
): Promise<{ response: string; toolsUsed: string[]; creditsConsumed: number }> {
  // ── AI Battery check — block if depleted ──
  if (!hasBudget(0.5)) {
    const battery = getBatteryStatus();
    return {
      response: `⚡ AI Battery depleted (${battery.todayCredits}/${battery.dailyLimit} credits used today). ` +
        `Read operations still work. To recharge, type "recharge [amount]".`,
      toolsUsed: [],
      creditsConsumed: 0,
    };
  }

  const toolDefs: ToolDef[] = registry.toOpenAITools();
  const toolsUsed: string[] = [];
  let totalCreditsConsumed = 0;
  const aiModel = getAiModel();
  const aiProvider = aiModel.startsWith('claude') ? 'claude' as const : 'openai' as const;

  const systemPrompt = buildSystemPrompt(registry.count());

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ];

  // Add media context if present
  if (mediaContext) {
    messages[1].content = `${userMessage}\n\n[Attached: ${mediaContext.mime_type} document/image — use doc_scan or braindump_process tool to process it]`;
  }

  // Agentic loop — max 5 iterations (WhatsApp has ~15s timeout)
  const MAX_LOOPS = 5;
  for (let loop = 0; loop < MAX_LOOPS; loop++) {
    const result = await chatCompletion(messages, toolDefs, traceId);

    // ── Track LLM token spend ──
    if (result.usage && result.finishReason !== 'error') {
      const entry = await recordLLMSpend({
        provider: aiProvider,
        model: aiModel,
        promptTokens: result.usage.prompt_tokens || 0,
        completionTokens: result.usage.completion_tokens || 0,
        totalTokens: result.usage.total_tokens || 0,
        traceId,
        toolContext: `semantic_router_loop_${loop}`,
      });
      totalCreditsConsumed += entry.credits;
    }

    // If error, return the error message
    if (result.finishReason === 'error') {
      return { response: result.message.content || 'Something went wrong.', toolsUsed, creditsConsumed: totalCreditsConsumed };
    }

    // If no tool calls, we have the final response
    if (!result.message.tool_calls || result.message.tool_calls.length === 0) {
      return { response: result.message.content || 'Done.', toolsUsed, creditsConsumed: totalCreditsConsumed };
    }

    // Add assistant message with tool calls
    messages.push(result.message);

    // Execute each tool call
    for (const tc of result.message.tool_calls) {
      const toolName = tc.function.name;
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(tc.function.arguments);
      } catch {
        args = {};
      }

      toolsUsed.push(toolName);

      console.log(JSON.stringify({
        ts: new Date().toISOString(),
        module: 'semanticRouter',
        action: 'tool_call',
        tool: toolName,
        loop,
        trace_id: traceId,
      }));

      const toolResult = await executeTool(toolName, args, registry, traceId);

      messages.push({
        role: 'tool',
        content: toolResult,
        tool_call_id: tc.id,
        name: toolName,
      });
    }
  }

  // If we hit max loops, return whatever we have
  return { response: 'Reached maximum processing steps. Please try a simpler request.', toolsUsed, creditsConsumed: totalCreditsConsumed };
}
