/**
 * Artifact Preview System — Every KITZ output becomes a branded HTML artifact.
 *
 * Generates visual HTML previews with action buttons that make things real
 * (save PDF, send email, send WhatsApp, approve plan, automate, etc.).
 *
 * All channels (WhatsApp, Email, Chat Panel) receive a link to the artifact.
 * Chat Panel also gets an inline iframe embed.
 *
 * Exports:
 *   - wrapInArtifact()                — Wraps HTML in the KITZ artifact shell
 *   - getActionsForCategory()         — Returns contextual action buttons
 *   - classifyOutputCategory()        — Auto-detects category from tools + response
 *   - createArtifactFromToolResult()  — Bridge: tool result → stored artifact
 *   - generatePlanPreviewHtml()       — Renders plan steps as styled HTML
 *   - isPlanResponse()                — Detects plan/strategy responses
 *   - extractPlanSteps()              — Parses numbered steps from text
 */

import { getBrandKit, storeContent, generateContentId, type BrandKit, type ContentItem } from './contentEngine.js';

// ── Types ──

export type ArtifactCategory = 'document' | 'presentation' | 'plan' | 'report' | 'content' | 'media';

export interface ArtifactAction {
  id: string;
  label: string;
  icon: string;
  type: 'primary' | 'secondary' | 'danger';
  endpoint: string;
  payload: Record<string, unknown>;
}

export interface ArtifactPreview {
  contentId: string;
  category: ArtifactCategory;
  title: string;
  html: string;
  previewUrl: string;
  actions: ArtifactAction[];
  status: 'preview' | 'approved' | 'sent';
  traceId: string;
}

// ── Action Generators ──

export function getActionsForCategory(category: ArtifactCategory, contentId: string, baseUrl: string): ArtifactAction[] {
  const actionEndpoint = `${baseUrl}/api/kitz/artifact/${contentId}/action`;

  const common: ArtifactAction[] = [
    { id: 'edit', label: 'Edit', icon: '', type: 'secondary', endpoint: actionEndpoint, payload: { action: 'edit' } },
  ];

  switch (category) {
    case 'document':
      return [
        { id: 'save_pdf', label: 'Save PDF', icon: '', type: 'primary', endpoint: actionEndpoint, payload: { action: 'save_pdf' } },
        { id: 'send_email', label: 'Send Email', icon: '', type: 'secondary', endpoint: actionEndpoint, payload: { action: 'send_email' } },
        { id: 'send_whatsapp', label: 'Send WhatsApp', icon: '', type: 'secondary', endpoint: actionEndpoint, payload: { action: 'send_whatsapp' } },
        { id: 'create_image', label: 'Create Image', icon: '', type: 'secondary', endpoint: actionEndpoint, payload: { action: 'create_image' } },
        ...common,
      ];
    case 'presentation':
      return [
        { id: 'save_pdf', label: 'Save PDF', icon: '', type: 'primary', endpoint: actionEndpoint, payload: { action: 'save_pdf' } },
        { id: 'send_email', label: 'Send Email', icon: '', type: 'secondary', endpoint: actionEndpoint, payload: { action: 'send_email' } },
        { id: 'send_whatsapp', label: 'Send WhatsApp', icon: '', type: 'secondary', endpoint: actionEndpoint, payload: { action: 'send_whatsapp' } },
        ...common,
      ];
    case 'plan':
      return [
        { id: 'approve_plan', label: 'Approve Plan', icon: '', type: 'primary', endpoint: actionEndpoint, payload: { action: 'approve_plan' } },
        { id: 'reject_plan', label: 'Reject', icon: '', type: 'danger', endpoint: actionEndpoint, payload: { action: 'reject_plan' } },
        ...common,
      ];
    case 'report':
      return [
        { id: 'save_pdf', label: 'Save PDF', icon: '', type: 'primary', endpoint: actionEndpoint, payload: { action: 'save_pdf' } },
        { id: 'send_email', label: 'Send Email', icon: '', type: 'secondary', endpoint: actionEndpoint, payload: { action: 'send_email' } },
        { id: 'automate', label: 'Automate', icon: '', type: 'secondary', endpoint: actionEndpoint, payload: { action: 'automate' } },
        ...common,
      ];
    case 'content':
      return [
        { id: 'save_pdf', label: 'Save PDF', icon: '', type: 'primary', endpoint: actionEndpoint, payload: { action: 'save_pdf' } },
        { id: 'send_email', label: 'Send Email', icon: '', type: 'secondary', endpoint: actionEndpoint, payload: { action: 'send_email' } },
        { id: 'send_whatsapp', label: 'Send WhatsApp', icon: '', type: 'secondary', endpoint: actionEndpoint, payload: { action: 'send_whatsapp' } },
        { id: 'create_image', label: 'Create Image', icon: '', type: 'secondary', endpoint: actionEndpoint, payload: { action: 'create_image' } },
        ...common,
      ];
    case 'media':
      return [
        { id: 'save_pdf', label: 'Save PDF', icon: '', type: 'primary', endpoint: actionEndpoint, payload: { action: 'save_pdf' } },
        { id: 'send_whatsapp', label: 'Send WhatsApp', icon: '', type: 'secondary', endpoint: actionEndpoint, payload: { action: 'send_whatsapp' } },
        ...common,
      ];
    default:
      return common;
  }
}

// ── Category Classification ──

const CATEGORY_RULES: Array<{ pattern: RegExp; tools: string[]; category: ArtifactCategory }> = [
  { pattern: /\b(invoice|factura|quote|cotizaci[oó]n|receipt|recibo)\b/i, tools: ['invoice_create', 'quote_create', 'invoice_list', 'advisor_invoiceTax'], category: 'document' },
  { pattern: /\b(deck|presentation|slides|pitch)\b/i, tools: ['deck_create', 'deck_list'], category: 'presentation' },
  { pattern: /\b(plan|strategy|roadmap|steps|action\s+items)\b/i, tools: ['agent_chat'], category: 'plan' },
  { pattern: /\b(report|dashboard|metrics|kpi|analytics|summary)\b/i, tools: ['dashboard_metrics', 'payments_summary', 'content_measure'], category: 'report' },
  { pattern: /\b(flyer|promo|poster|banner|email.*template|newsletter|landing|website|biolink)\b/i, tools: ['flyer_create', 'promo_create', 'emailBuilder_create', 'website_create', 'biolink_create'], category: 'content' },
  { pattern: /\b(image|photo|logo|graphic|illustration)\b/i, tools: ['image_generate'], category: 'media' },
  { pattern: /\b(pdf|document|proposal|letter|contract)\b/i, tools: ['pdf_generate', 'artifact_generateDocument'], category: 'document' },
];

export function classifyOutputCategory(toolsUsed: string[], responseText: string): ArtifactCategory {
  // Check tool names first (most reliable signal)
  for (const rule of CATEGORY_RULES) {
    for (const tool of toolsUsed) {
      if (rule.tools.includes(tool)) return rule.category;
    }
  }

  // Check response text keywords
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(responseText)) return rule.category;
  }

  // Default: if tools produced structured output, call it a document
  if (toolsUsed.length > 0) return 'document';
  return 'content';
}

// ── Plan Detection & Parsing ──

const PLAN_KEYWORDS = /\b(plan|strategy|roadmap|steps|action\s+items|phases?|milestones?|timeline|implementation)\b/i;
const PLAN_TOOLS = new Set(['agent_chat']);

export function isPlanResponse(toolsUsed: string[], responseText: string): boolean {
  if (toolsUsed.some(t => PLAN_TOOLS.has(t)) && PLAN_KEYWORDS.test(responseText)) return true;
  // Check if response has numbered steps pattern (3+ numbered items)
  const numberedSteps = responseText.match(/^\s*\d+\.\s/gm);
  return !!(numberedSteps && numberedSteps.length >= 3 && PLAN_KEYWORDS.test(responseText));
}

export function extractPlanSteps(responseText: string): Array<{ number: number; text: string }> {
  const steps: Array<{ number: number; text: string }> = [];
  const lines = responseText.split('\n');
  for (const line of lines) {
    const match = line.match(/^\s*(\d+)\.\s+(.+)/);
    if (match) {
      steps.push({ number: parseInt(match[1], 10), text: match[2].trim() });
    }
  }
  return steps;
}

export function generatePlanPreviewHtml(steps: Array<{ number: number; text: string }>, title: string, description?: string): string {
  const stepsHtml = steps.map(s => `
    <div style="display:flex;gap:16px;align-items:flex-start;margin-bottom:16px">
      <div style="flex-shrink:0;width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#A855F7,#7C3AED);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px">${s.number}</div>
      <div style="flex:1;padding-top:6px;font-size:15px;line-height:1.5;color:#1a1a2e">${s.text}</div>
    </div>`).join('');

  return `
    <div style="padding:24px">
      <h2 style="margin:0 0 8px;font-size:22px;color:#7C3AED">${title}</h2>
      ${description ? `<p style="margin:0 0 24px;color:#666;font-size:14px;line-height:1.5">${description}</p>` : ''}
      <div style="margin-top:16px">${stepsHtml}</div>
    </div>`;
}

// ── Artifact Shell Wrapper ──

export function wrapInArtifact(innerHtml: string, options: {
  title: string;
  category: ArtifactCategory;
  actions: ArtifactAction[];
  brandKit: BrandKit;
  contentId: string;
  baseUrl: string;
}): string {
  const { title, category, actions, brandKit, contentId, baseUrl } = options;

  const categoryLabel: Record<ArtifactCategory, string> = {
    document: 'Document',
    presentation: 'Presentation',
    plan: 'Plan',
    report: 'Report',
    content: 'Content',
    media: 'Media',
  };

  const actionsHtml = actions.map(a => {
    const bgColor = a.type === 'primary' ? '#A855F7' : a.type === 'danger' ? '#EF4444' : 'transparent';
    const textColor = a.type === 'primary' ? '#fff' : a.type === 'danger' ? '#fff' : '#A855F7';
    const border = a.type === 'secondary' ? 'border:1px solid #A855F7;' : '';
    return `<button
      onclick="handleAction('${a.id}','${a.endpoint}',${JSON.stringify(JSON.stringify(a.payload))})"
      style="display:inline-flex;align-items:center;gap:6px;padding:10px 20px;border-radius:8px;background:${bgColor};color:${textColor};${border}border:${a.type !== 'secondary' ? 'none' : ''};font-family:inherit;font-size:14px;font-weight:600;cursor:pointer;transition:opacity 0.2s"
      onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'"
    >${a.icon ? `<span>${a.icon}</span> ` : ''}${a.label}</button>`;
  }).join('\n          ');

  return `<!DOCTYPE html>
<html lang="${brandKit.language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${title} — ${brandKit.businessName} | KITZ</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8f7ff;color:#1a1a2e;min-height:100vh}

    .kitz-artifact-header{background:linear-gradient(135deg,${brandKit.colors.primary},${brandKit.colors.secondary});padding:20px 24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}
    .kitz-artifact-header .brand{display:flex;align-items:center;gap:12px}
    .kitz-artifact-header .logo{width:36px;height:36px;border-radius:8px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;font-size:16px}
    .kitz-artifact-header .title-group h1{font-size:18px;font-weight:700;color:#fff;line-height:1.2}
    .kitz-artifact-header .title-group .subtitle{font-size:12px;color:rgba(255,255,255,0.75);margin-top:2px}
    .kitz-artifact-header .badge{background:rgba(255,255,255,0.2);color:#fff;font-size:11px;padding:4px 10px;border-radius:20px;font-weight:600}

    .kitz-artifact-content{max-width:900px;margin:24px auto;padding:0 16px}
    .kitz-artifact-card{background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(124,58,237,0.08);overflow:hidden}

    .kitz-artifact-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:16px 24px;border-top:1px solid #f0eef5;background:#faf9ff}
    .kitz-artifact-actions button{transition:all 0.2s}

    .kitz-artifact-footer{text-align:center;padding:20px 16px 32px;color:#999;font-size:12px;line-height:1.5}
    .kitz-artifact-footer a{color:${brandKit.colors.primary};text-decoration:none}

    .kitz-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1a1a2e;color:#fff;padding:12px 24px;border-radius:12px;font-size:14px;font-weight:500;opacity:0;transition:opacity 0.3s;pointer-events:none;z-index:100}
    .kitz-toast.show{opacity:1}

    @media print{
      .kitz-artifact-header,.kitz-artifact-actions,.kitz-artifact-footer,.kitz-toast{display:none!important}
      .kitz-artifact-card{box-shadow:none;border-radius:0}
      .kitz-artifact-content{margin:0;padding:0;max-width:100%}
      body{background:#fff}
    }

    @media(max-width:600px){
      .kitz-artifact-header{padding:16px}
      .kitz-artifact-header .title-group h1{font-size:16px}
      .kitz-artifact-content{margin:16px auto;padding:0 12px}
      .kitz-artifact-actions{padding:12px 16px;gap:8px}
      .kitz-artifact-actions button{padding:8px 14px;font-size:13px}
    }
  </style>
</head>
<body>
  <header class="kitz-artifact-header">
    <div class="brand">
      <div class="logo">K</div>
      <div class="title-group">
        <h1>${title}</h1>
        <div class="subtitle">${brandKit.businessName}${brandKit.tagline ? ` — ${brandKit.tagline}` : ''}</div>
      </div>
    </div>
    <span class="badge">${categoryLabel[category] || 'Document'}</span>
  </header>

  <main class="kitz-artifact-content">
    <div class="kitz-artifact-card">
      <div style="padding:0">${innerHtml}</div>
      <div class="kitz-artifact-actions">
        ${actionsHtml}
      </div>
    </div>
  </main>

  <footer class="kitz-artifact-footer">
    KITZ is an AI tool that may make mistakes. Please review carefully.<br>
    <a href="${baseUrl}">Powered by KITZ</a> — Your business deserves infrastructure.
  </footer>

  <div id="kitz-toast" class="kitz-toast"></div>

  <script>
    function showToast(msg) {
      var t = document.getElementById('kitz-toast');
      t.textContent = msg;
      t.classList.add('show');
      setTimeout(function() { t.classList.remove('show'); }, 3000);
    }

    function handleAction(actionId, endpoint, payloadStr) {
      if (actionId === 'save_pdf') {
        window.print();
        return;
      }

      var payload = JSON.parse(payloadStr);
      showToast('Processing...');

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.error) {
          showToast('Error: ' + data.error);
        } else {
          showToast(data.message || 'Action completed!');
        }
      })
      .catch(function(err) {
        showToast('Failed: ' + err.message);
      });
    }
  </script>
</body>
</html>`;
}

// ── Bridge: Tool Result → Artifact ──

export function createArtifactFromToolResult(
  toolResultData: Array<Record<string, unknown>>,
  toolsUsed: string[],
  responseText: string,
  traceId: string,
  baseUrl: string,
  _userId?: string,
): ArtifactPreview | null {
  // Skip if no meaningful tools were used and response is short
  if (toolsUsed.length === 0 && responseText.length < 200) return null;

  // Skip for simple read operations that don't produce artifacts
  const readOnlyTools = new Set(['crm_listContacts', 'crm_getContact', 'orders_listOrders', 'orders_getOrder', 'dashboard_metrics', 'calendar_listEvents', 'calendar_today', 'sop_search', 'sop_list', 'rag_search', 'brand_get', 'web_search']);
  if (toolsUsed.length > 0 && toolsUsed.every(t => readOnlyTools.has(t))) return null;

  const category = classifyOutputCategory(toolsUsed, responseText);
  const brandKit = getBrandKit();
  const contentId = generateContentId();
  const previewUrl = `${baseUrl}/api/kitz/artifact/${contentId}`;

  // Extract or generate inner HTML
  let innerHtml = '';
  let title = 'KITZ Preview';

  // 1. Try extracting HTML from tool results
  for (const result of toolResultData) {
    if (result.html && typeof result.html === 'string') {
      innerHtml = result.html;
      title = (result.title as string) || (result.filename as string) || title;
      break;
    }
  }

  // 2. For plan responses, generate plan HTML
  if (!innerHtml && isPlanResponse(toolsUsed, responseText)) {
    const steps = extractPlanSteps(responseText);
    if (steps.length > 0) {
      title = extractTitle(responseText) || 'Action Plan';
      innerHtml = generatePlanPreviewHtml(steps, title);
    }
  }

  // 3. For report/content with no HTML, wrap response text as styled HTML
  if (!innerHtml) {
    title = extractTitle(responseText) || categoryTitleFallback(category);
    innerHtml = wrapTextAsHtml(responseText, brandKit);
  }

  // Build actions
  const actions = getActionsForCategory(category, contentId, baseUrl);

  // Wrap in artifact shell
  const html = wrapInArtifact(innerHtml, { title, category, actions, brandKit, contentId, baseUrl });

  // Store in content engine
  const contentItem: ContentItem = {
    contentId,
    type: mapCategoryToContentType(category),
    html,
    data: { toolsUsed, traceId, category, title },
    status: 'previewing',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  storeContent(contentItem);

  return {
    contentId,
    category,
    title,
    html,
    previewUrl,
    actions,
    status: 'preview',
    traceId,
  };
}

// ── Helpers ──

function extractTitle(text: string): string | null {
  // Try to get title from first bold or header-like line
  const boldMatch = text.match(/\*\*(.+?)\*\*/);
  if (boldMatch && boldMatch[1].length < 60) return boldMatch[1];

  // Try first line if it's short
  const firstLine = text.split('\n')[0]?.trim();
  if (firstLine && firstLine.length < 60 && firstLine.length > 3) {
    return firstLine.replace(/^[#*]+\s*/, '').replace(/\*+$/g, '');
  }

  return null;
}

function categoryTitleFallback(category: ArtifactCategory): string {
  const map: Record<ArtifactCategory, string> = {
    document: 'Document',
    presentation: 'Presentation',
    plan: 'Action Plan',
    report: 'Report',
    content: 'Content',
    media: 'Media',
  };
  return map[category] || 'KITZ Preview';
}

function mapCategoryToContentType(category: ArtifactCategory): ContentItem['type'] {
  const map: Record<ArtifactCategory, ContentItem['type']> = {
    document: 'document',
    presentation: 'deck',
    plan: 'document',
    report: 'document',
    content: 'document',
    media: 'document',
  };
  return map[category] || 'document';
}

function wrapTextAsHtml(text: string, brandKit: BrandKit): string {
  // Convert markdown-ish text to basic HTML
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const htmlLines = escaped.split('\n').map(line => {
    // Bold: **text**
    let processed = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic: *text*
    processed = processed.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Bullet points
    if (/^\s*[•\-]\s/.test(processed)) {
      const content = processed.replace(/^\s*[•\-]\s*/, '');
      return `<div style="display:flex;gap:8px;align-items:flex-start;margin-bottom:6px"><span style="color:${brandKit.colors.primary};margin-top:6px;font-size:8px">●</span><span>${content}</span></div>`;
    }
    // Numbered list
    const numMatch = processed.match(/^\s*(\d+)\.\s+(.*)/);
    if (numMatch) {
      return `<div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:8px"><span style="flex-shrink:0;width:24px;height:24px;border-radius:50%;background:${brandKit.colors.primary};color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700">${numMatch[1]}</span><span style="padding-top:2px">${numMatch[2]}</span></div>`;
    }
    // Empty line
    if (processed.trim() === '') return '<div style="height:8px"></div>';
    // Regular line
    return `<p style="margin:0 0 6px;line-height:1.6">${processed}</p>`;
  }).join('\n');

  return `<div style="padding:24px;font-size:15px;color:#1a1a2e">${htmlLines}</div>`;
}
