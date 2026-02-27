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
import { callWorkspaceMcp } from '../../tools/mcpClient.js';
import type { OsToolRegistry } from '../../tools/registry.js';
import { recordLLMSpend } from '../../aiBattery.js';
import { searchSOPs } from '../../sops/store.js';
import { getConversationHistory } from '../../memory/manager.js';
import type { OutputChannel } from 'kitz-schemas';
import { getIntelligenceContext } from '../../tools/ragPipelineTools.js';
import { isBlocked, getToolRisk, getApprovalSummaryForPrompt } from '../../approvals/approvalMatrix.js';
import { dispatchToAgent } from '../../../../aos/src/runtime/taskDispatcher.js';
import { runSwarm, type SwarmConfig } from '../../../../aos/src/swarm/swarmRunner.js';
import type { ExecutionResult } from '../../../../aos/src/runtime/AgentExecutor.js';
import { getAgent } from '../../../../aos/src/runtime/taskDispatcher.js';
import { ReviewerAgent } from '../../../../aos/src/agents/governance/Reviewer.js';

const BRAIN_URL = process.env.KITZ_BRAIN_URL || 'http://localhost:3015';

// ── Tool-to-MCP Mapping ──
// Maps KITZ OS tool names to workspace MCP tool names for direct execution
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
  // SMS + Voice call tools (Twilio via comms-api)
  'outbound_sendSMS', 'outbound_sendVoiceCall',
  // Web scraping + search tools
  'web_scrape', 'web_search', 'web_summarize', 'web_extract',
  // SOP tools
  'sop_search', 'sop_get', 'sop_list', 'sop_create', 'sop_update',
  // Broadcast + auto-reply tools
  'broadcast_preview', 'broadcast_send', 'broadcast_history',
  'autoreply_get', 'autoreply_set',
  // RAG Intelligence Pipeline
  'rag_search', 'rag_index', 'rag_listDocs',
  // Country Configuration
  'country_configure', 'country_getConfig', 'country_validateTaxId',
  // Content Loop
  'content_publish', 'content_measure', 'content_suggestBoost', 'content_promote',
  // AI Advisor Calculators
  'advisor_employerCost', 'advisor_severance', 'advisor_pricing',
  'advisor_breakeven', 'advisor_unitEconomics', 'advisor_runway',
  'advisor_invoiceTax', 'advisor_loanPayment',
  // Image generation (DALL-E)
  'image_generate',
  // PDF/document generation
  'pdf_generate',
  // Clarification + follow-up (brain orchestrator)
  'ask_clarification', 'schedule_followup',
]);

// ── Draft-First Classification ──
// Write tools that MUST go through draft approval before execution.
// Read-only tools execute immediately. This is a safety-critical list.
const WRITE_TOOLS = new Set([
  // CRM writes
  'crm_createContact', 'crm_updateContact',
  // Order writes
  'orders_createOrder', 'orders_updateOrder',
  // Storefront writes
  'storefronts_create', 'storefronts_update', 'storefronts_delete',
  'storefronts_markPaid', 'storefronts_send',
  // Product writes
  'products_create', 'products_update', 'products_delete',
  // Outbound messages (highest risk — sends to real humans)
  'outbound_sendWhatsApp', 'outbound_sendEmail',
  'outbound_sendVoiceNote', 'outbound_makeCall',
  'outbound_sendSMS', 'outbound_sendVoiceCall',
  // Email compose/send
  'email_compose', 'email_sendApprovalRequest',
  // Calendar writes
  'calendar_addEvent', 'calendar_updateEvent', 'calendar_deleteEvent', 'calendar_addTask',
  // Artifact writes
  'artifact_generateCode', 'artifact_generateDocument', 'artifact_generateTool',
  'artifact_selfHeal', 'artifact_generateMigration', 'artifact_pushToLovable',
  // Lovable writes
  'lovable_addProject', 'lovable_updateProject', 'lovable_removeProject',
  'lovable_pushArtifact', 'lovable_linkProjects',
  // SOP writes (draft-first — new SOPs need approval)
  'sop_create', 'sop_update',
  // Broadcast (sends to many people — highest risk)
  'broadcast_send',
  // Auto-reply config changes
  'autoreply_set',
  // Content Loop writes (publishing and promoting costs money)
  'content_publish', 'content_promote',
  // Country configuration changes
  'country_configure',
]);

// In-memory draft queue: traceId → pending drafts
interface DraftAction {
  toolName: string;
  args: Record<string, unknown>;
  traceId: string;
  userId?: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
}
const draftQueue = new Map<string, DraftAction[]>();
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function cleanExpiredDrafts(): void {
  const now = Date.now();
  for (const [traceId, actions] of draftQueue) {
    const allExpired = actions.every(a => now - new Date(a.createdAt).getTime() > DRAFT_TTL_MS);
    if (allExpired) draftQueue.delete(traceId);
  }
}

export function getDraftQueue(): Map<string, DraftAction[]> {
  cleanExpiredDrafts();
  return draftQueue;
}

export function approveDraft(traceId: string, index: number): DraftAction | null {
  const drafts = draftQueue.get(traceId);
  if (!drafts || !drafts[index]) return null;
  drafts[index].status = 'approved';
  return drafts[index];
}

export function rejectDraft(traceId: string, index: number): DraftAction | null {
  const drafts = draftQueue.get(traceId);
  if (!drafts || !drafts[index]) return null;
  drafts[index].status = 'rejected';
  return drafts[index];
}

function isWriteTool(toolName: string): boolean {
  return WRITE_TOOLS.has(toolName);
}

function formatDraftSummary(drafts: DraftAction[]): string {
  const lines = drafts.map((d, i) =>
    `${i + 1}. *${d.toolName}*${d.args ? ` — ${JSON.stringify(d.args).slice(0, 80)}` : ''}`
  );
  return `📋 *Draft Actions* (approval required)\n\n${lines.join('\n')}\n\nReply "approve" to execute or "reject" to cancel.`;
}

// ── System Prompt ──
function buildSystemPrompt(toolCount: number, channel: OutputChannel = 'whatsapp', sopContext?: string, intelligenceContext?: string): string {
  const sopSection = sopContext
    ? `\n\nRELEVANT SOPS (follow these procedures when applicable):\n${sopContext}`
    : '';

  const intelSection = intelligenceContext
    ? `\n\nRELEVANT INTELLIGENCE (use this context to give expert answers):\n${intelligenceContext}`
    : '';


  // Channel-specific formatting instructions
  const formatRulesMap: Record<OutputChannel, string> = {
    web: `RESPONSE FORMAT (Web Dashboard):
- You can be slightly longer than WhatsApp — but still concise.
- Default: 1-2 short sentences. Tight.
- If more detail: structured sections with **bold** headers, bullet points.
- Complex topics: use the 5-step structure below.
- Max 4096 chars. No walls of text.
- Use markdown: **bold**, bullet points (- or •), short paragraphs.
- Emojis: yes, sparingly — for visual scanning, not decoration.`,
    whatsapp: `RESPONSE FORMAT (WhatsApp):
- Default replies: 5-7 words. Keep it tight.
- If more detail needed: 15-23 words max.
- Complex topics: break into chunks of 30 words max.
- If it truly requires more detail: say "I'll send the details by email" and use email tool.
- Format for WhatsApp: short paragraphs, *bold* headers, bullet points with •
- Use emojis sparingly for visual scanning (📋, 📦, 💰, 📊, 🧠, ✅, ⚠️)`,
    email: `RESPONSE FORMAT (Email):
- Use clear subject-appropriate structure with sections.
- First line becomes the email subject — keep it under 60 chars.
- Use **bold** headers, bullet points, numbered lists.
- Can be longer and more detailed than WhatsApp.
- Include relevant data, tables, summaries.
- Professional tone — slightly more formal than WhatsApp.
- Max 4096 chars.`,
    sms: `RESPONSE FORMAT (SMS):
- Ultra-concise: 155 characters max (single SMS segment).
- No formatting, no emojis, no markdown.
- First sentence only — get to the point immediately.
- If more detail needed, say "Check WhatsApp for details."
- Plain text only.`,
    voice: `RESPONSE FORMAT (Voice / TTS):
- Write as spoken language — natural, conversational.
- No markdown, no bullets, no special characters.
- Use commas and periods for natural pauses.
- Spell out numbers and abbreviations (e.g., "five hundred dollars" not "$500").
- Keep under 5000 characters (ElevenLabs limit).
- Avoid lists — convert to flowing sentences.`,
  };

  const formatRules = formatRulesMap[channel] || formatRulesMap.whatsapp;
  const channelLabel: Record<OutputChannel, string> = {
    web: 'web dashboard',
    whatsapp: 'WhatsApp',
    email: 'email',
    sms: 'SMS',
    voice: 'voice call',
  };

  return `You are KITZ — an AI Business Operating System. You are an execution engine, not a chatbot.
You exist to make a small business run like a Fortune 500 company at a fraction of the cost.
You have ${toolCount} tools available. You are responding via ${channelLabel[channel] || 'WhatsApp'}.

IDENTITY & TONE:
- Gen Z clarity + disciplined founder energy. Direct, concise, no corporate fluff.
- Cool, chill, confident. Never mad, never rude. Good vibes only.
- Think of yourself as a calm, capable co-founder who gets stuff done.
- Use numbers when available. Never hype — underpromise, overdeliver.
- Never fabricate data. If you don't have it, say so. A wrong answer is worse than no answer.
- Call the user "boss" casually. Keep energy high but grounded.

SUBSTANTIVE RESPONSE STRUCTURE:
When answering business questions, strategy, or analysis — use this framework:
1. **Diagnosis** — What's the current state? (data-driven)
2. **Bottleneck** — What's blocking progress?
3. **Leverage** — Highest-impact opportunity right now
4. **Recommendation** — 1-3 specific actions
5. **Next Step** — ONE thing to do right now

For simple queries (status checks, quick lookups, confirmations), skip the framework — just answer directly.

${formatRules}

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
- **CALENDAR** — Full Google Calendar management: list events, add/update/delete events, add tasks, find free slots, view today's schedule.
- **AGENTS** — Route to specialized agents (CEO, Sales, Ops, CFO, etc.) for strategic thinking.
- **ARTIFACTS** — Generate code, documents, tools, SQL migrations, and push to Lovable. Self-healing: regenerate missing files.
- **LOVABLE** — Manage Lovable.dev projects: add, list, link, remove projects. Push artifacts. Send prompts to Lovable AI chat.
- **PAYMENTS** — View payment transactions by provider (Stripe, PayPal, Yappy, BAC), status, or date range. Revenue summaries. Receive-only — never send money outbound.
- **VOICE** — KITZ has a female voice (ElevenLabs). Text to speech, voice notes via WhatsApp, WhatsApp calls, voice widget.
- **SMS** — Send SMS text messages via Twilio. Use outbound_sendSMS. Max 160 chars recommended for single segment.
- **VOICE CALL** — Initiate voice calls via Twilio with TTS message. Use outbound_sendVoiceCall.
- **WEB** — Browse the internet: web_search, web_scrape, web_summarize, web_extract. Research, competitive analysis, price checking.
- **BROADCAST** — Send bulk WhatsApp messages to CRM contacts. Preview filters, then send. Max 200 recipients.
- **AUTO-REPLY** — Configure WhatsApp auto-reply: view, update, enable/disable, cooldown.
- **INTELLIGENCE** — Search 25+ intelligence docs covering LatAm business: country infrastructure, tax, payments, compliance, employment law, pricing, marketing, e-commerce, AI tools.
- **COUNTRY CONFIG** — Auto-configure workspace by country: tax rates, currency, payment providers, invoice requirements, tax ID validation. Supports 17 countries.
- **CONTENT LOOP** — Publish content → measure performance → suggest boosting top performers → create paid promotions. Closed-loop content optimization.
- **ADVISOR** — Business calculators: employer cost, severance, pricing strategy, break-even, unit economics (CAC/LTV), runway, invoice tax, loan payments.
- **IMAGE GENERATION** — Create images from text prompts (DALL-E 3). Product photos, social media graphics, flyers, logos. Use image_generate tool.
- **PDF/DOCUMENT** — Generate branded HTML documents for print-to-PDF. Reports, proposals, summaries, letters. Use pdf_generate tool.

EXECUTION RULES:
1. Execute READ operations directly — no confirmation needed.
2. For WRITE operations (create/update), confirm what you did.
3. For DELETE operations, explain that email approval is required.
4. Be concise — respect the user's time.
5. Never fabricate data. If a tool returns empty, say so honestly.
6. Max 4096 chars per response.
7. For brain dump / idea processing, use braindump_process tool.
8. For dashboard/metrics/how-are-we-doing, use dashboard_metrics.
9. When asked about multiple things, use multiple tools in sequence.
10. If the request is unclear, ask ONE clarifying question — no more.
11. For code generation, use artifact_generateCode. For documents, use artifact_generateDocument.
12. For self-healing / rebuilding missing files, use artifact_selfHeal.
13. For payment queries, use payments_summary or payments_listTransactions.
14. NEVER initiate outbound payments. Only receive and record incoming payments.
15. For voice: use voice_speak to generate audio, outbound_sendVoiceNote to deliver.
16. For SOP queries, use sop_search. For new SOPs, use sop_create (start as draft).
17. For calendar: use calendar_today for daily view, calendar_addEvent for scheduling, calendar_findSlot for availability.
18. For country/tax/compliance questions, use rag_search to find intelligence + country_getConfig for current setup.
19. For employer costs, severance, pricing, break-even, runway — use advisor_* calculators. Give exact numbers.
20. For content performance: content_measure to track, content_suggestBoost to find winners, content_promote to boost.
21. When user mentions a country or asks about tax/payments, search intelligence with rag_search first for deep context.
22. For image generation (logos, product photos, graphics, flyers), use image_generate. Always include the image URL in your response so the user can see it.
23. For document/report generation (proposals, reports, summaries, letters), use pdf_generate. Mention the document title in your response.
24. DRAFT-FIRST: All write actions (messages, CRM updates, orders, invoices) produce a DRAFT first. The user must approve before anything is sent or saved permanently.
25. CLARIFICATION: If the request is ambiguous, missing critical details, or you need to confirm before acting — use the ask_clarification tool. Be specific about what you need. Include suggestions when possible.
26. FOLLOW-UP: If you can provide a partial answer now but need time for a complete response, use schedule_followup to send the full answer later (within 24 hours).
27. ALWAYS DELIVER: Even if your answer is imperfect, always provide a first draft. A partial answer is better than no answer. You can schedule a follow-up for the complete version.

CHANNEL STRATEGY:
- WhatsApp → Business operations: orders, payments, CRM, invoicing, customer service, quick lookups
- Email → Reports, documents, campaigns, follow-up sequences, detailed analysis
- Workspace (ChatPanel) → Full interactive workspace: advisory, content creation, analytics, strategy, deep work

${getApprovalSummaryForPrompt()}${sopSection}${intelSection}`;
}

// ── Execute a tool ──
async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  registry: OsToolRegistry,
  traceId: string,
  userId?: string,
): Promise<string> {
  // Check if tool maps to MCP
  const mcpToolName = TOOL_TO_MCP[toolName];
  if (mcpToolName) {
    const result = await callWorkspaceMcp(mcpToolName, args, traceId, userId);
    return typeof result === 'string' ? result : JSON.stringify(result);
  }

  // Check if tool is direct-execute (handled by OS)
  if (DIRECT_EXECUTE_TOOLS.has(toolName)) {
    const enrichedArgs = userId ? { ...args, _userId: userId } : args;
    const result = await registry.invoke(toolName, enrichedArgs, traceId);
    return typeof result === 'string' ? result : JSON.stringify(result);
  }

  // Unknown tool
  return JSON.stringify({ error: `Unknown tool: ${toolName}` });
}

// ── Fast-path intent matching ──
// For unambiguous intents, bypass the LLM and call the tool directly.
const IMAGE_INTENT_RE = /\b(?:create|generate|make|draw|design)\b.*\b(?:image|picture|photo|logo|graphic|illustration|icon)\b/i;
const IMAGE_INTENT_RE2 = /\b(?:image|picture|photo|logo|graphic|illustration)\b.*\b(?:of|for|about|showing|with)\b/i;

function matchImageIntent(message: string): Record<string, unknown> | null {
  if (!IMAGE_INTENT_RE.test(message) && !IMAGE_INTENT_RE2.test(message)) return null;
  // Extract the prompt — strip the command prefix
  const prompt = message
    .replace(/^(?:create|generate|make|draw|design)\s+(?:an?\s+)?(?:image|picture|photo|logo|graphic|illustration|icon)\s+(?:of|for|about|showing|with)\s*/i, '')
    .replace(/^(?:an?\s+)?(?:image|picture|photo|logo|graphic|illustration|icon)\s+(?:of|for|about|showing|with)\s*/i, '')
    .trim();
  // If we couldn't extract a meaningful prompt, pass the whole message
  return { prompt: prompt.length > 5 ? prompt : message };
}

// ── Intent-based tool filtering ──
// gpt-4o-mini can't reliably select from 170+ tools.
// Pre-filter by intent keywords to keep tool list under ~80.
const INTENT_TOOL_MAP: Array<{ pattern: RegExp; tools: string[] }> = [
  { pattern: /\b(image|picture|photo|logo|graphic|visual|illustration|generate.*image|create.*image|draw|dall-?e|design.*logo)\b/i,
    tools: ['image_generate'] },
  { pattern: /\b(pdf|document|report|proposal|letter|summary|print|branded.*doc)\b/i,
    tools: ['pdf_generate'] },
  { pattern: /\b(invoice|quote|cotiza|factura)\b/i,
    tools: ['invoice_create', 'invoice_list', 'invoice_update', 'quote_create', 'advisor_invoiceTax'] },
  { pattern: /\b(flyer|promo|poster|banner|promotional)\b/i,
    tools: ['flyer_create', 'promo_create'] },
  { pattern: /\b(deck|presentation|slides|pitch)\b/i,
    tools: ['deck_create', 'deck_list'] },
  { pattern: /\b(website|landing.*page|biolink|web.*page)\b/i,
    tools: ['website_create', 'website_list', 'biolink_create'] },
  { pattern: /\b(email.*build|newsletter|email.*template|email.*campaign)\b/i,
    tools: ['emailBuilder_create', 'emailBuilder_list'] },
];

// Core tools always included (CRM, orders, dashboard, etc.)
const ALWAYS_INCLUDE_PREFIXES = [
  'crm_', 'order_', 'storefront_', 'product_', 'dashboard_',
  'email_', 'braindump_', 'calendar_', 'sop_', 'rag_',
  'web_', 'outbound_', 'voice_', 'agent_',
];

const MAX_TOOLS = 80;

function filterToolsByIntent(message: string, allTools: ToolDef[]): ToolDef[] {
  // Find intent-matched tool names
  const intentTools = new Set<string>();
  for (const { pattern, tools } of INTENT_TOOL_MAP) {
    if (pattern.test(message)) {
      for (const t of tools) intentTools.add(t);
    }
  }

  // If no specific intent detected and tools are under limit, pass all
  if (intentTools.size === 0 && allTools.length <= MAX_TOOLS) {
    return allTools;
  }

  // If no specific intent but too many tools, take core + trim
  if (intentTools.size === 0) {
    const core = allTools.filter(t =>
      ALWAYS_INCLUDE_PREFIXES.some(p => t.function.name.startsWith(p))
    );
    return core.slice(0, MAX_TOOLS);
  }

  // Intent detected: include intent tools + core tools
  const filtered = allTools.filter(t => {
    if (intentTools.has(t.function.name)) return true;
    return ALWAYS_INCLUDE_PREFIXES.some(p => t.function.name.startsWith(p));
  });

  return filtered.slice(0, MAX_TOOLS);
}

// ── Main Router ──
export async function routeWithAI(
  userMessage: string,
  registry: OsToolRegistry,
  traceId: string,
  mediaContext?: { media_base64: string; mime_type: string },
  userId?: string,
  channel: OutputChannel = 'whatsapp',
  chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
): Promise<{ response: string; toolsUsed: string[]; creditsConsumed: number; toolResults: Record<string, unknown>[] }> {

  cleanExpiredDrafts();

  // ── Fast-path: direct tool shortcuts for high-signal intents ──
  // Bypass the LLM entirely when the intent is unambiguous.
  const imageShortcut = matchImageIntent(userMessage);
  if (imageShortcut) {
    const result = await registry.invoke('image_generate', imageShortcut, traceId) as Record<string, unknown>;
    if (result.imageUrl) {
      return {
        response: `Here's your image, boss 🎨\n\n![Generated image](${result.imageUrl})\n\n${result.revisedPrompt ? `*${result.revisedPrompt}*` : ''}`,
        toolsUsed: ['image_generate'],
        creditsConsumed: 0,
        toolResults: [result],
      };
    }
    if (result.error) {
      return { response: `Couldn't generate the image: ${result.error}`, toolsUsed: ['image_generate'], creditsConsumed: 0, toolResults: [result] };
    }
  }

  const allToolDefs: ToolDef[] = registry.toOpenAITools();
  // ── Intent-based tool filtering ──
  // gpt-4o-mini struggles with 170+ tools. Pre-filter by intent for reliability.
  const toolDefs = filterToolsByIntent(userMessage, allToolDefs);
  if (toolDefs.length < allToolDefs.length) {
    console.log(JSON.stringify({ ts: new Date().toISOString(), module: 'semanticRouter', action: 'tool_filter', total: allToolDefs.length, filtered: toolDefs.length, trace_id: traceId }));
  }
  const toolsUsed: string[] = [];
  const toolResults: Record<string, unknown>[] = [];
  let totalCreditsConsumed = 0;
  const aiModel = getAiModel();
  const aiProvider = aiModel.startsWith('claude') ? 'claude' as const : 'openai' as const;

  // ── SOP Context Injection — search for relevant procedures ──
  const relevantSOPs = searchSOPs(userMessage, 3);
  const sopContext = relevantSOPs.length > 0
    ? relevantSOPs.map(sop => `[${sop.title}] ${sop.summary}`).join('\n')
    : undefined;

  // ── RAG Intelligence Context — auto-inject relevant business knowledge ──
  let intelligenceContext = '';
  try {
    intelligenceContext = await getIntelligenceContext(userMessage, 2);
  } catch { /* non-blocking — proceed without intelligence context */ }

  const systemPrompt = buildSystemPrompt(registry.count(), channel, sopContext, intelligenceContext);

  // ── Build conversation context ──
  // Priority: frontend chat history > backend memory manager > empty
  // Last 10 messages to keep context window reasonable (avoid token bloat)
  const MAX_HISTORY = 10;
  let historyMessages: ChatMessage[] = [];

  if (chatHistory && chatHistory.length > 0) {
    // Use frontend-provided history (most accurate for web channel)
    historyMessages = chatHistory
      .slice(-MAX_HISTORY)
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
  } else if (userId) {
    // Fall back to backend memory manager (better for WhatsApp where frontend doesn't send history)
    try {
      const stored = getConversationHistory(userId, 'unknown', MAX_HISTORY);
      historyMessages = stored.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
    } catch { /* non-blocking — proceed without history */ }
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...historyMessages,
    { role: 'user', content: userMessage },
  ];

  // Add media context if present (modify the LAST message — the current user message)
  if (mediaContext) {
    const lastMsg = messages[messages.length - 1];
    lastMsg.content = `${userMessage}\n\n[Attached: ${mediaContext.mime_type} document/image — use doc_scan or braindump_process tool to process it]`;
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

    // If error, return a friendly message (hide internal error codes from user)
    if (result.finishReason === 'error') {
      const rawError = result.message.content || '';
      console.error(JSON.stringify({ ts: new Date().toISOString(), module: 'semanticRouter', error: rawError, loop, trace_id: traceId }));
      const friendlyMsg = rawError.includes('rate limit') || rawError.includes('429') || rawError.includes('529')
        ? 'AI is temporarily busy — give me a sec and try again, boss.'
        : rawError.includes('unreachable') || rawError.includes('timeout')
          ? 'AI service is taking too long — try again in a moment, boss.'
          : 'Something went wrong on my end — try again in a sec, boss.';
      return { response: friendlyMsg, toolsUsed, creditsConsumed: totalCreditsConsumed, toolResults };
    }

    // If no tool calls, we have the final response
    if (!result.message.tool_calls || result.message.tool_calls.length === 0) {
      const content = result.message.content?.trim();
      return { response: content || 'Ran the tools but got no response — try asking again, boss.', toolsUsed, creditsConsumed: totalCreditsConsumed, toolResults };
    }

    // Add assistant message with tool calls
    messages.push(result.message);

    // Execute each tool call — draft-first for writes
    const pendingDrafts: DraftAction[] = [];

    for (const tc of result.message.tool_calls) {
      const toolName = tc.function.name;
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(tc.function.arguments);
      } catch (parseErr) {
        console.warn(`[router] Malformed tool args for ${tc.function.name}:`, (parseErr as Error).message);
        messages.push({
          role: 'tool',
          content: JSON.stringify({ error: 'Malformed arguments from AI — please retry.' }),
          tool_call_id: tc.id,
          name: tc.function.name,
        });
        continue;
      }

      toolsUsed.push(toolName);

      console.log(JSON.stringify({
        ts: new Date().toISOString(),
        module: 'semanticRouter',
        action: isWriteTool(toolName) ? 'tool_draft' : 'tool_call',
        tool: toolName,
        loop,
        trace_id: traceId,
      }));

      // Blocked: actions that should never be executed by AI
      if (isBlocked(toolName)) {
        messages.push({
          role: 'tool',
          content: JSON.stringify({ status: 'blocked', message: `Action "${toolName}" is blocked. This action cannot be performed by AI — it requires manual execution by the business owner.` }),
          tool_call_id: tc.id,
          name: toolName,
        });
        continue;
      }

      // Draft-first: write tools are queued, not executed
      if (isWriteTool(toolName)) {
        const riskLevel = getToolRisk(toolName);
        const draft: DraftAction = {
          toolName,
          args,
          traceId,
          userId,
          createdAt: new Date().toISOString(),
          status: 'pending',
        };
        pendingDrafts.push(draft);

        const riskLabel = riskLevel === 'critical' ? ' ⚠️ CRITICAL — requires dual-channel approval' :
                          riskLevel === 'high' ? ' ⚠️ HIGH RISK — requires explicit approval' : '';
        // Return a draft confirmation to the AI so it knows the action is pending
        messages.push({
          role: 'tool',
          content: JSON.stringify({ status: 'drafted', riskLevel, message: `Action "${toolName}" queued as draft.${riskLabel} Awaiting user approval.` }),
          tool_call_id: tc.id,
          name: toolName,
        });
      } else {
        // Read-only tools execute immediately
        const toolResult = await executeTool(toolName, args, registry, traceId, userId);
        // Collect parsed tool result for artifact generation
        try {
          const parsed = JSON.parse(toolResult);
          toolResults.push(parsed);
        } catch {
          toolResults.push({ raw: toolResult });
        }
        messages.push({
          role: 'tool',
          content: toolResult,
          tool_call_id: tc.id,
          name: toolName,
        });
      }
    }

    // If any writes were drafted, store them and break the loop to inform user
    if (pendingDrafts.length > 0) {
      const existing = draftQueue.get(traceId) || [];
      existing.push(...pendingDrafts);
      draftQueue.set(traceId, existing);

      // Let AI generate a final response acknowledging the drafts
      // then append the draft summary
      const draftSummary = formatDraftSummary(pendingDrafts);
      if (!result.message.content) {
        return { response: draftSummary, toolsUsed, creditsConsumed: totalCreditsConsumed, toolResults };
      }
      return {
        response: `${result.message.content}\n\n${draftSummary}`,
        toolsUsed,
        creditsConsumed: totalCreditsConsumed,
        toolResults,
      };
    }
  }

  // If we hit max loops, return whatever we have
  return { response: 'Reached maximum processing steps. Please try a simpler request.', toolsUsed, creditsConsumed: totalCreditsConsumed, toolResults };
}

// ── Brain Decision type (mirrors kitz-brain classifier output) ──
interface BrainDecision {
  strategy: 'direct_tool' | 'single_agent' | 'multi_agent' | 'swarm' | 'clarify';
  confidence: number;
  agents?: string[];
  teams?: string[];
  reasoning: string;
  toolHints?: string[];
  clarificationQuestion?: string;
  reviewRequired: boolean;
  traceId: string;
}

type RouteResult = { response: string; toolsUsed: string[]; creditsConsumed: number; toolResults: Record<string, unknown>[] };

/** Adapt an AOS ExecutionResult to the semantic router return shape */
function adaptExecutionResult(result: ExecutionResult): RouteResult {
  return {
    response: result.response,
    toolsUsed: result.toolResults.map(tr => tr.tool),
    creditsConsumed: 0,
    toolResults: result.toolResults.map(tr => ({
      tool: tr.tool,
      success: tr.success,
      data: tr.data,
      error: tr.error,
    })),
  };
}

/**
 * Brain-First Routing — sends every AI request through kitz-brain first.
 * Brain classifies, then dispatches to the appropriate execution strategy.
 * Falls back to routeWithAI() if brain is unreachable.
 *
 * Drop-in replacement for routeWithAI() — same signature and return shape.
 */
export async function brainFirstRoute(
  userMessage: string,
  registry: OsToolRegistry,
  traceId: string,
  mediaContext?: { media_base64: string; mime_type: string },
  userId?: string,
  channel: OutputChannel = 'whatsapp',
  chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
): Promise<RouteResult> {

  // 1. Call kitz-brain POST /decide
  let decision: BrainDecision | null = null;
  try {
    const brainRes = await fetch(`${BRAIN_URL}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-trace-id': traceId },
      body: JSON.stringify({
        message: userMessage,
        channel,
        userId: userId || 'unknown',
        traceId,
        chatHistory: chatHistory?.slice(-5),
        mediaContext: mediaContext ? { mime_type: mediaContext.mime_type } : undefined,
      }),
      signal: AbortSignal.timeout(3000), // 3s timeout for classification
    });

    if (brainRes.ok) {
      decision = await brainRes.json() as BrainDecision;
      console.log(JSON.stringify({
        ts: new Date().toISOString(),
        module: 'brainFirstRoute',
        action: 'brain_decision',
        strategy: decision.strategy,
        confidence: decision.confidence,
        agents: decision.agents,
        reviewRequired: decision.reviewRequired,
        trace_id: traceId,
      }));
    }
  } catch (err) {
    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      module: 'brainFirstRoute',
      action: 'brain_unreachable',
      error: (err as Error).message,
      trace_id: traceId,
    }));
  }

  // 2. If brain unreachable, fall through to existing routeWithAI
  if (!decision) {
    return routeWithAI(userMessage, registry, traceId, mediaContext, userId, channel, chatHistory);
  }

  // 3. Execute based on brain strategy
  let result: RouteResult;

  switch (decision.strategy) {
    case 'direct_tool': {
      // Use existing 5-phase pipeline — brain says it's a simple request
      result = await routeWithAI(userMessage, registry, traceId, mediaContext, userId, channel, chatHistory);
      break;
    }

    case 'single_agent': {
      const agentName = decision.agents?.[0];
      if (!agentName) {
        result = await routeWithAI(userMessage, registry, traceId, mediaContext, userId, channel, chatHistory);
        break;
      }

      // Build message with media context if present
      let agentMessage = userMessage;
      if (mediaContext) {
        agentMessage = `${userMessage}\n\n[Attached: ${mediaContext.mime_type} document/image]`;
      }

      const execResult = await dispatchToAgent(agentName, agentMessage, traceId);

      // If agent not found or offline, fall back to routeWithAI
      if (execResult.iterations === 0 && execResult.response.startsWith('Agent "')) {
        console.log(JSON.stringify({ ts: new Date().toISOString(), module: 'brainFirstRoute', action: 'agent_fallback', agent: agentName, trace_id: traceId }));
        result = await routeWithAI(userMessage, registry, traceId, mediaContext, userId, channel, chatHistory);
      } else {
        result = adaptExecutionResult(execResult);
      }
      break;
    }

    case 'multi_agent': {
      const agents = decision.agents || [];
      if (agents.length === 0) {
        result = await routeWithAI(userMessage, registry, traceId, mediaContext, userId, channel, chatHistory);
        break;
      }

      // Sequential dispatch: each agent gets the prior agent's output as context
      let context = userMessage;
      if (mediaContext) {
        context = `${userMessage}\n\n[Attached: ${mediaContext.mime_type} document/image]`;
      }

      const allToolsUsed: string[] = [];
      const allToolResults: Record<string, unknown>[] = [];
      let finalResponse = '';

      for (const agentName of agents) {
        const execResult = await dispatchToAgent(agentName, context, traceId);

        // If agent not found, skip
        if (execResult.iterations === 0 && execResult.response.startsWith('Agent "')) {
          continue;
        }

        allToolsUsed.push(...execResult.toolResults.map(tr => tr.tool));
        allToolResults.push(...execResult.toolResults.map(tr => ({
          tool: tr.tool, success: tr.success, data: tr.data, error: tr.error,
        })));

        // Next agent gets prior output as context
        context = `${userMessage}\n\nPrior agent (${agentName}) output:\n${execResult.response}`;
        finalResponse = execResult.response;
      }

      if (!finalResponse) {
        // All agents failed, fall back
        result = await routeWithAI(userMessage, registry, traceId, mediaContext, userId, channel, chatHistory);
      } else {
        result = {
          response: finalResponse,
          toolsUsed: allToolsUsed,
          creditsConsumed: 0,
          toolResults: allToolResults,
        };
      }
      break;
    }

    case 'swarm': {
      const teams = decision.teams as SwarmConfig['teams'];
      try {
        const swarmResult = await runSwarm({
          teams,
          concurrency: 6,
          timeoutMs: 60_000,
        });

        const summary = [
          `Swarm analysis complete.`,
          `Teams: ${swarmResult.teamsCompleted}/${swarmResult.teamsTotal}`,
          `Agents: ${swarmResult.agentResults.length} participated`,
          `Duration: ${swarmResult.durationMs}ms`,
        ].join(' ');

        result = {
          response: summary,
          toolsUsed: swarmResult.agentResults.map(ar => ar.tool || 'unknown'),
          creditsConsumed: 0,
          toolResults: swarmResult.teamResults.map(tr => ({
            team: tr.team,
            status: tr.status,
            durationMs: tr.durationMs,
          })),
        };
      } catch (err) {
        console.log(JSON.stringify({ ts: new Date().toISOString(), module: 'brainFirstRoute', action: 'swarm_error', error: (err as Error).message, trace_id: traceId }));
        result = await routeWithAI(userMessage, registry, traceId, mediaContext, userId, channel, chatHistory);
      }
      break;
    }

    case 'clarify': {
      result = {
        response: decision.clarificationQuestion || 'Could you clarify what you need? I want to make sure I get this right, boss.',
        toolsUsed: [],
        creditsConsumed: 0,
        toolResults: [],
      };
      break;
    }

    default: {
      result = await routeWithAI(userMessage, registry, traceId, mediaContext, userId, channel, chatHistory);
    }
  }

  // 4. Review gate — Reviewer agent checks quality before response reaches user
  if (decision.reviewRequired && result.response) {
    try {
      const reviewerAgent = getAgent('Reviewer');
      if (reviewerAgent && reviewerAgent instanceof ReviewerAgent) {
        const reviewResult = await reviewerAgent.reviewResponse(
          decision.agents?.[0] || 'unknown',
          userMessage,
          result.response,
          result.toolsUsed,
          traceId,
        );

        console.log(JSON.stringify({
          ts: new Date().toISOString(),
          module: 'brainFirstRoute',
          action: 'review_gate',
          approved: reviewResult.approved,
          confidence: reviewResult.confidence,
          flags: reviewResult.flags,
          trace_id: traceId,
        }));

        // If reviewer provides a revised response, use it
        if (reviewResult.revised) {
          result.response = reviewResult.revised;
        }
      }
    } catch (err) {
      // Review gate failure is non-blocking — pass original response through
      console.log(JSON.stringify({
        ts: new Date().toISOString(),
        module: 'brainFirstRoute',
        action: 'review_gate_error',
        error: (err as Error).message,
        trace_id: traceId,
      }));
    }
  }

  return result;
}
