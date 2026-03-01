/**
 * AI Draft Response + Approval Flow
 *
 * After auto-reply, KITZ generates a real response to the sender's question
 * using Claude Sonnet, then sends it to the admin for approval via email.
 * Admin clicks "Approve & Send" → draft goes to original sender.
 *
 * Token store: in-memory Map + file persistence (same pattern as case-counter.json).
 */

import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// ── Types ──

export type SupportedLanguage = 'en' | 'es' | 'pt' | 'fr';

export interface PendingDraft {
  token: string;
  caseNumber: string;
  createdAt: string;
  expiresAt: string;
  status: 'pending' | 'approved' | 'expired';

  // Original email
  originalFrom: string;
  originalFromName: string;
  originalSubject: string;
  originalBody: string;
  language: SupportedLanguage;

  // Generated draft
  draftSubject: string;
  draftBody: string;
  draftHtml: string;
}

// ── Paths ──

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const DRAFTS_FILE = join(DATA_DIR, 'pending-drafts.json');

const DRAFT_TTL_MS = 72 * 60 * 60 * 1000; // 72 hours

// ── In-memory store + file persistence ──

let draftsMap: Map<string, PendingDraft> | null = null;

function loadDrafts(): Map<string, PendingDraft> {
  if (draftsMap) return draftsMap;
  draftsMap = new Map();
  try {
    if (existsSync(DRAFTS_FILE)) {
      const arr = JSON.parse(readFileSync(DRAFTS_FILE, 'utf-8')) as PendingDraft[];
      const now = Date.now();
      for (const d of arr) {
        if (new Date(d.expiresAt).getTime() > now && d.status === 'pending') {
          draftsMap.set(d.token, d);
        }
      }
    }
  } catch { /* start fresh */ }
  return draftsMap;
}

function saveDrafts(): void {
  const map = loadDrafts();
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(DRAFTS_FILE, JSON.stringify([...map.values()], null, 2));
  } catch { /* non-fatal */ }
}

// Cleanup expired drafts every hour
setInterval(() => {
  const map = loadDrafts();
  const now = Date.now();
  for (const [token, draft] of map) {
    if (new Date(draft.expiresAt).getTime() < now) {
      map.delete(token);
    }
  }
  saveDrafts();
}, 60 * 60 * 1000);

// ── Draft CRUD ──

export function createPendingDraft(params: Omit<PendingDraft, 'token' | 'createdAt' | 'expiresAt' | 'status'>): PendingDraft {
  const now = new Date();
  const draft: PendingDraft = {
    ...params,
    token: randomBytes(32).toString('hex'),
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + DRAFT_TTL_MS).toISOString(),
    status: 'pending',
  };
  const map = loadDrafts();
  map.set(draft.token, draft);
  saveDrafts();
  return draft;
}

export function getPendingDraft(token: string): PendingDraft | null {
  const map = loadDrafts();
  const draft = map.get(token);
  if (!draft) return null;
  if (new Date(draft.expiresAt).getTime() < Date.now()) {
    map.delete(token);
    saveDrafts();
    return null;
  }
  return draft;
}

export function approveDraft(token: string): PendingDraft | null {
  const draft = getPendingDraft(token);
  if (!draft || draft.status !== 'pending') return null;
  draft.status = 'approved';
  saveDrafts();
  return draft;
}

// ── AI Draft Generation (kitz_os brain → fallback to direct Claude) ──

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const KITZ_OS_URL = process.env.KITZ_OS_URL || '';
const SERVICE_SECRET = process.env.SERVICE_SECRET || '';
const DEV_TOKEN_SECRET = process.env.DEV_TOKEN_SECRET || '';

const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  es: 'Spanish',
  pt: 'Portuguese',
  fr: 'French',
};

function buildBrainPrompt(
  originalBody: string,
  originalSubject: string,
  senderName: string,
  language: SupportedLanguage,
  caseNumber: string,
): string {
  const langName = LANGUAGE_NAMES[language];
  const body = originalBody.trim();
  const hasBody = body.length > 0;
  return [
    `CRITICAL INSTRUCTIONS — follow exactly:`,
    `1. Write the ACTUAL email response that will be sent DIRECTLY to the customer. This is the FINAL draft — it must be polished, complete, and ready to send as-is.`,
    `2. Do NOT invoke tools, do NOT use email_compose, do NOT output JSON, draft actions, or approval prompts.`,
    `3. Do NOT say the body is empty or ask for more content. If the body is empty, respond based on the subject line alone.`,
    `4. Do NOT comment on the email itself. Just write the response as if you are Kenneth replying.`,
    `5. Output ONLY the email body — no "Subject:" prefix, no metadata, no placeholders.`,
    ``,
    `You are Kenneth from KITZ, an AI-powered Business Operating System for small businesses in Latin America.`,
    `This is case ${caseNumber}. Your response is the FIRST AND FINAL draft — one shot, ready to send.`,
    ``,
    `Respond in ${langName}. Tone: Gen Z clarity + disciplined founder. Direct, warm, no fluff.`,
    `Understand exactly what the customer wants and address it fully. Be specific, not generic.`,
    `If they ask a question, answer it. If they need help, give actionable next steps.`,
    `Keep it concise — 3 short paragraphs max. Sign off as "Kenneth @ KITZ".`,
    ``,
    `Customer email subject: "${originalSubject}"`,
    `Customer name: ${senderName}`,
    hasBody ? `Customer message:\n${body.slice(0, 4000)}` : `(Customer sent only the subject with no body — respond helpfully based on the subject.)`,
    ``,
    `Write the final response now:`,
  ].join('\n');
}

function getStaticFallback(senderName: string, language: SupportedLanguage): string {
  if (language === 'es') return `Hola ${senderName},\n\nEstamos temporalmente no disponibles. Te responderemos lo antes posible.\n\nKenneth @ KITZ`;
  if (language === 'pt') return `Olá ${senderName},\n\nEstamos temporariamente indisponíveis. Retornaremos o mais breve possível.\n\nKenneth @ KITZ`;
  if (language === 'fr') return `Bonjour ${senderName},\n\nNous sommes temporairement indisponibles. Nous vous répondrons dès que possible.\n\nKenneth @ KITZ`;
  return `Hey ${senderName},\n\nWe're currently unavailable. We will get back to you as soon as possible.\n\nKenneth @ KITZ`;
}

export async function generateDraftResponse(
  originalBody: string,
  originalSubject: string,
  senderName: string,
  language: SupportedLanguage,
  caseNumber: string,
  traceId?: string,
  log?: { info: (obj: unknown) => void },
): Promise<{ draftBody: string; draftHtml: string; draftSubject: string }> {
  const draftSubject = `Re: ${originalSubject} — ${caseNumber}`;

  // 1. Route through kitz_os brain (semantic router → skills → agents)
  if (KITZ_OS_URL) {
    try {
      log?.info({ event: 'drafts.brain_call', kitzOsUrl: KITZ_OS_URL, hasAuth: !!SERVICE_SECRET || !!DEV_TOKEN_SECRET, caseNumber, traceId });
      const res = await fetch(`${KITZ_OS_URL}/api/kitz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(SERVICE_SECRET ? { 'x-service-secret': SERVICE_SECRET } : {}),
          ...(DEV_TOKEN_SECRET ? { 'x-dev-secret': DEV_TOKEN_SECRET } : {}),
        },
        body: JSON.stringify({
          message: buildBrainPrompt(originalBody, originalSubject, senderName, language, caseNumber),
          channel: 'email',
          user_id: caseNumber,
          trace_id: traceId || `email-${caseNumber}`,
        }),
        signal: AbortSignal.timeout(30_000),
      });

      log?.info({ event: 'drafts.brain_response', status: res.status, caseNumber, traceId });
      if (res.ok) {
        const data = (await res.json()) as { response?: string; command?: string };
        const draftBody = data.response?.trim() || '';
        log?.info({ event: 'drafts.brain_body', bodyLength: draftBody.length, caseNumber, traceId });
        if (draftBody.length > 20) {
          return {
            draftBody,
            draftHtml: wrapInBrandedHtml(draftBody, caseNumber, senderName, language),
            draftSubject,
          };
        }
      } else {
        const errText = await res.text().catch(() => 'unknown');
        log?.info({ event: 'drafts.brain_error', status: res.status, error: errText.slice(0, 200), caseNumber, traceId });
      }
    } catch (e) {
      log?.info({ event: 'drafts.brain_exception', error: (e as Error).message, caseNumber, traceId });
    }
  } else {
    log?.info({ event: 'drafts.no_kitz_os', caseNumber, traceId });
  }

  // 2. Fallback: direct Claude Sonnet (when kitz_os unavailable)
  if (ANTHROPIC_API_KEY) {
    try {
      const systemPrompt = `You are Kenneth from KITZ, an AI-powered Business Operating System for small businesses in Latin America.
You're writing the FINAL response to a customer email — first draft = final draft, ready to send as-is.

Rules:
- Respond in ${LANGUAGE_NAMES[language]}
- Tone: Gen Z clarity + disciplined founder. Direct, warm, no fluff
- Understand exactly what the customer wants and address it fully
- If they ask a question, answer it. If they need help, give actionable next steps
- Keep it concise — 3 short paragraphs max
- Never promise things you can't deliver
- Sign off as "Kenneth @ KITZ"
- Output ONLY the email body text — no subject line, no metadata, no placeholders
- If the email is vague or just a greeting, respond warmly and ask what they need help with

This is case ${caseNumber}. The sender already received an auto-reply with their case number.`;

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: 'user', content: `Subject: ${originalSubject}\nFrom: ${senderName}\n\n${originalBody.slice(0, 4000)}` }],
        }),
        signal: AbortSignal.timeout(30_000),
      });

      if (res.ok) {
        const data = (await res.json()) as { content?: Array<{ text?: string }> };
        const draftBody = data.content?.[0]?.text?.trim() || '';
        if (draftBody) {
          return {
            draftBody,
            draftHtml: wrapInBrandedHtml(draftBody, caseNumber, senderName, language),
            draftSubject,
          };
        }
      }
    } catch { /* fallback to static */ }
  }

  // 3. Static fallback (no AI available)
  const fallback = getStaticFallback(senderName, language);
  return { draftBody: fallback, draftHtml: wrapInBrandedHtml(fallback, caseNumber, senderName, language), draftSubject };
}

// ── Branded HTML for the actual draft email sent to sender ──

function wrapInBrandedHtml(body: string, caseNumber: string, senderName: string, language: SupportedLanguage): string {
  const bodyHtml = body.replace(/\n/g, '<br>');
  const caseLabel = language === 'fr' ? 'Dossier' : language === 'en' ? 'Case' : 'Caso';
  const disclaimer: Record<SupportedLanguage, string> = {
    en: 'This content was created by AI. Please review carefully.',
    es: 'Este contenido fue creado por IA, revisar con calma.',
    pt: 'Este conteúdo foi criado por IA. Revise com calma.',
    fr: "Ce contenu a été créé par l'IA. Veuillez vérifier avec soin.",
  };

  return `<div style="max-width:600px;margin:0 auto;font-family:'Inter',-apple-system,Arial,sans-serif;background:#f8f7ff;border-radius:16px;overflow:hidden">
<div style="background:linear-gradient(135deg,#A855F7,#7C3AED);padding:20px 16px">
<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td><span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:0.5px">KITZ</span><br><span style="color:rgba(255,255,255,0.7);font-size:11px">Your business, handled.</span></td>
<td style="text-align:right"><span style="background:rgba(255,255,255,0.2);color:#fff;font-size:11px;padding:4px 12px;border-radius:20px;font-weight:600">${caseLabel} ${caseNumber}</span></td>
</tr></table>
</div>
<div style="background:#fff;padding:24px 16px">
<p style="color:#444;font-size:14px;line-height:1.7;margin:0">${bodyHtml}</p>
</div>
<div style="padding:14px 16px 16px;text-align:center;background:#faf9ff">
<p style="color:#aaa;font-size:11px;line-height:1.5;margin:0 0 6px">${disclaimer[language]}</p>
<p style="color:#ccc;font-size:11px;margin:0">Powered by <a href="https://kitz.services" style="color:#A855F7;text-decoration:none;font-weight:600">KITZ</a></p>
</div>
</div>`;
}

// ── Approval Email HTML (sent to admin) ──

export function getApprovalEmailHtml(
  draft: PendingDraft,
  approveUrl: string,
  editUrl: string,
): string {
  const originalHtml = draft.originalBody.replace(/\n/g, '<br>').slice(0, 3000);
  const draftBodyHtml = draft.draftBody.replace(/\n/g, '<br>');
  const langName = LANGUAGE_NAMES[draft.language];

  return `<div style="max-width:600px;margin:0 auto;font-family:'Inter',-apple-system,Arial,sans-serif;background:#f8f7ff;border-radius:16px;overflow:hidden">
<div style="background:linear-gradient(135deg,#A855F7,#7C3AED);padding:20px 16px">
<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td><span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:0.5px">KITZ</span><br><span style="color:rgba(255,255,255,0.7);font-size:11px">Draft Review</span></td>
<td style="text-align:right"><span style="background:rgba(255,255,255,0.2);color:#fff;font-size:11px;padding:4px 12px;border-radius:20px;font-weight:600">${draft.caseNumber}</span></td>
</tr></table>
</div>

<div style="background:#fff;padding:20px 16px">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px">
<tr><td style="color:#aaa;font-size:12px;padding:4px 0;width:70px">From</td><td style="color:#333;font-size:13px;padding:4px 0">${draft.originalFromName} &lt;${draft.originalFrom}&gt;</td></tr>
<tr><td style="color:#aaa;font-size:12px;padding:4px 0">Subject</td><td style="color:#333;font-size:13px;padding:4px 0">${draft.originalSubject}</td></tr>
<tr><td style="color:#aaa;font-size:12px;padding:4px 0">Language</td><td style="color:#333;font-size:13px;padding:4px 0">${langName}</td></tr>
</table>

<div style="margin-bottom:16px">
<p style="color:#aaa;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;font-weight:600">Original Email</p>
<div style="background:#f7f7f7;border-radius:8px;padding:14px;color:#555;font-size:14px;line-height:1.6">${originalHtml || '<span style="color:#bbb;font-style:italic">No body — subject only</span>'}</div>
</div>

<div style="margin-bottom:20px">
<p style="color:#aaa;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;font-weight:600">Final Draft</p>
<div style="border-left:3px solid #A855F7;border-radius:0 8px 8px 0;padding:14px;color:#333;font-size:14px;line-height:1.7;background:#faf9ff">${draftBodyHtml}</div>
</div>

<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="padding-right:6px" width="50%">
<a href="${approveUrl}" style="display:block;background:#7C3AED;color:#fff;text-decoration:none;text-align:center;padding:14px 12px;border-radius:8px;font-size:14px;font-weight:600">Approve &amp; Send</a>
</td>
<td style="padding-left:6px" width="50%">
<a href="${editUrl}" style="display:block;background:#fff;color:#7C3AED;text-decoration:none;text-align:center;padding:14px 12px;border-radius:8px;font-size:14px;font-weight:600;border:2px solid #7C3AED">Edit &amp; Send Manually</a>
</td>
</tr></table>

</div>

<div style="padding:14px 16px 16px;text-align:center;background:#faf9ff">
<p style="color:#aaa;font-size:11px;line-height:1.5;margin:0 0 4px">Final AI draft — ready to send. Review before approving.</p>
<p style="color:#ccc;font-size:11px;margin:0 0 4px">This link expires in 72 hours.</p>
<p style="color:#ccc;font-size:11px;margin:0">Powered by <a href="https://kitz.services" style="color:#A855F7;text-decoration:none;font-weight:600">KITZ</a></p>
</div>
</div>`;
}

// ── Confirmation Page (shown after approve click) ──

export function getConfirmationPageHtml(caseNumber: string, recipientEmail: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Approved — KITZ</title></head>
<body style="margin:0;padding:40px 16px;background:#f8f7ff;font-family:'Inter',Arial,Helvetica,sans-serif">
<div style="max-width:480px;margin:0 auto;text-align:center;border-radius:16px;overflow:hidden">
<div style="background:linear-gradient(135deg,#A855F7,#7C3AED);padding:24px">
<span style="color:#fff;font-size:22px;font-weight:700;letter-spacing:0.5px">KITZ</span>
</div>
<div style="background:#fff;padding:40px 24px">
<div style="width:56px;height:56px;background:#e8f5e9;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center">
<span style="font-size:28px">&#10003;</span>
</div>
<h2 style="color:#1a1a2e;margin:0 0 8px;font-size:20px">Response Sent</h2>
<p style="color:#555;font-size:14px;line-height:1.6;margin:0">${caseNumber} response delivered to<br><strong>${recipientEmail}</strong></p>
</div>
<div style="padding:16px 24px 20px;background:#faf9ff">
<p style="color:#ccc;font-size:10px;margin:0">Powered by <a href="https://kitz.services" style="color:#A855F7;text-decoration:none;font-weight:600">KITZ</a></p>
</div>
</div>
</body></html>`;
}

// ── Error Page (invalid/expired token) ──

export function getErrorPageHtml(message: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Error — KITZ</title></head>
<body style="margin:0;padding:40px 16px;background:#f8f7ff;font-family:'Inter',Arial,Helvetica,sans-serif">
<div style="max-width:480px;margin:0 auto;text-align:center;border-radius:16px;overflow:hidden">
<div style="background:linear-gradient(135deg,#A855F7,#7C3AED);padding:24px">
<span style="color:#fff;font-size:22px;font-weight:700;letter-spacing:0.5px">KITZ</span>
</div>
<div style="background:#fff;padding:40px 24px">
<div style="width:56px;height:56px;background:#fce4ec;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center">
<span style="font-size:28px">&#10007;</span>
</div>
<h2 style="color:#1a1a2e;margin:0 0 8px;font-size:20px">Link Invalid</h2>
<p style="color:#555;font-size:14px;line-height:1.6;margin:0">${message}</p>
<p style="color:#aaa;font-size:12px;margin:24px 0 0">If you need to respond, do so manually via email.</p>
</div>
<div style="padding:16px 24px 20px;background:#faf9ff">
<p style="color:#ccc;font-size:10px;margin:0">Powered by <a href="https://kitz.services" style="color:#A855F7;text-decoration:none;font-weight:600">KITZ</a></p>
</div>
</div>
</body></html>`;
}
