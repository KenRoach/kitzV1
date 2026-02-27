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
  return [
    `Respond to this inbound customer email for KITZ (case ${caseNumber}).`,
    `The customer wrote in ${langName}. Respond in ${langName}.`,
    `Tone: Gen Z clarity + disciplined founder. Direct, warm, no fluff.`,
    `Keep it concise — 3-5 short paragraphs max. Sign off as "Kenneth @ KITZ".`,
    `The sender already received an auto-reply with their case number.`,
    ``,
    `Subject: ${originalSubject}`,
    `From: ${senderName}`,
    ``,
    originalBody.slice(0, 4000),
  ].join('\n');
}

function getStaticFallback(senderName: string, language: SupportedLanguage): string {
  if (language === 'es') return `Hola ${senderName}, gracias por contactarnos. Estamos revisando tu solicitud y te responderemos pronto.\n\nKenneth @ KITZ`;
  if (language === 'pt') return `Olá ${senderName}, obrigado por entrar em contato. Estamos analisando sua solicitação e responderemos em breve.\n\nKenneth @ KITZ`;
  if (language === 'fr') return `Bonjour ${senderName}, merci de nous avoir contactés. Nous examinons votre demande et vous répondrons bientôt.\n\nKenneth @ KITZ`;
  return `Hey ${senderName}, thanks for reaching out. We're reviewing your request and will get back to you soon.\n\nKenneth @ KITZ`;
}

export async function generateDraftResponse(
  originalBody: string,
  originalSubject: string,
  senderName: string,
  language: SupportedLanguage,
  caseNumber: string,
  traceId?: string,
): Promise<{ draftBody: string; draftHtml: string; draftSubject: string }> {
  const draftSubject = `Re: ${originalSubject} — ${caseNumber}`;

  // 1. Route through kitz_os brain (semantic router → skills → agents)
  if (KITZ_OS_URL) {
    try {
      const res = await fetch(`${KITZ_OS_URL}/api/kitz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

      if (res.ok) {
        const data = (await res.json()) as { response?: string; command?: string };
        const draftBody = data.response?.trim() || '';
        if (draftBody.length > 20) {
          return {
            draftBody,
            draftHtml: wrapInBrandedHtml(draftBody, caseNumber, senderName, language),
            draftSubject,
          };
        }
      }
    } catch { /* fallback to direct Claude */ }
  }

  // 2. Fallback: direct Claude Sonnet (when kitz_os unavailable)
  if (ANTHROPIC_API_KEY) {
    try {
      const systemPrompt = `You are KITZ, an AI Business Operating System for small businesses. You're drafting a response to a customer email.

Rules:
- Respond in ${LANGUAGE_NAMES[language]}
- Tone: Gen Z clarity + disciplined founder. Direct, warm, no fluff
- Be helpful and specific to their actual question
- Keep it concise — 3-5 short paragraphs max
- Never promise things you can't deliver
- Sign off as "Kenneth @ KITZ"
- Output ONLY the email body text — no subject line, no greetings prefix like "Subject:"
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
    en: 'This content was created by AI. Please review thoroughly before taking action.',
    es: 'Este contenido fue creado por IA. Por favor revisa cuidadosamente antes de tomar accion.',
    pt: 'Este conteudo foi criado por IA. Por favor, revise cuidadosamente antes de tomar qualquer acao.',
    fr: "Ce contenu a été créé par l'IA. Veuillez le vérifier attentivement avant d'agir.",
  };

  return `<div style="max-width:600px;margin:0 auto;font-family:'Inter',Arial,Helvetica,sans-serif;background:#f8f7ff">
<div style="background:linear-gradient(135deg,#A855F7,#7C3AED);padding:28px 24px">
<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td><span style="color:#ffffff;font-size:20px;font-weight:700;line-height:1.2">KITZ</span><br><span style="color:rgba(255,255,255,0.75);font-size:12px">Your business, handled.</span></td>
<td style="text-align:right"><span style="background:rgba(255,255,255,0.2);color:#fff;font-size:11px;padding:4px 12px;border-radius:20px;font-weight:600">${caseLabel} ${caseNumber}</span></td>
</tr></table>
</div>
<div style="background:#ffffff;margin:0 16px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(124,58,237,0.08)">
<div style="padding:32px 24px">
<p style="color:#555;font-size:15px;line-height:1.6;margin:0">${bodyHtml}</p>
</div>
</div>
<div style="padding:20px 24px;text-align:center">
<p style="color:#999;font-size:11px;line-height:1.5;margin:0 0 8px">${disclaimer[language]}</p>
<p style="color:#bbb;font-size:11px;margin:0">Powered by <a href="https://kitz.services" style="color:#A855F7;text-decoration:none">KITZ</a></p>
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

  return `<div style="max-width:600px;margin:0 auto;font-family:'Inter',Arial,Helvetica,sans-serif;background:#f8f7ff">
<div style="background:linear-gradient(135deg,#A855F7,#7C3AED);padding:28px 24px">
<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td><span style="color:#ffffff;font-size:20px;font-weight:700;line-height:1.2">KITZ</span><br><span style="color:rgba(255,255,255,0.75);font-size:12px">Draft Review</span></td>
<td style="text-align:right"><span style="background:rgba(255,255,255,0.2);color:#fff;font-size:11px;padding:4px 12px;border-radius:20px;font-weight:600">${draft.caseNumber}</span></td>
</tr></table>
</div>

<div style="background:#ffffff;margin:0 16px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(124,58,237,0.08)">
<div style="padding:24px">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px">
<tr><td style="color:#999;font-size:12px;padding:2px 0">From</td><td style="color:#333;font-size:13px;padding:2px 0">${draft.originalFromName} &lt;${draft.originalFrom}&gt;</td></tr>
<tr><td style="color:#999;font-size:12px;padding:2px 0">Subject</td><td style="color:#333;font-size:13px;padding:2px 0">${draft.originalSubject}</td></tr>
<tr><td style="color:#999;font-size:12px;padding:2px 0">Language</td><td style="color:#333;font-size:13px;padding:2px 0">${langName}</td></tr>
</table>

<div style="margin-bottom:20px">
<p style="color:#999;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;font-weight:600">Original Email</p>
<div style="background:#f5f5f5;border-radius:8px;padding:16px;color:#555;font-size:14px;line-height:1.5">${originalHtml}</div>
</div>

<div style="margin-bottom:24px">
<p style="color:#999;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;font-weight:600">AI Draft Response</p>
<div style="background:#fff;border-left:3px solid #A855F7;border-radius:0 8px 8px 0;padding:16px;color:#333;font-size:14px;line-height:1.6;box-shadow:0 1px 4px rgba(0,0,0,0.06)">${draftBodyHtml}</div>
</div>

<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="padding-right:8px" width="50%">
<a href="${approveUrl}" style="display:block;background:#7C3AED;color:#fff;text-decoration:none;text-align:center;padding:14px 20px;border-radius:8px;font-size:14px;font-weight:600">Approve &amp; Send</a>
</td>
<td style="padding-left:8px" width="50%">
<a href="${editUrl}" style="display:block;background:#fff;color:#7C3AED;text-decoration:none;text-align:center;padding:14px 20px;border-radius:8px;font-size:14px;font-weight:600;border:2px solid #7C3AED">Edit &amp; Send Manually</a>
</td>
</tr></table>

</div>
</div>

<div style="padding:20px 24px;text-align:center">
<p style="color:#999;font-size:11px;line-height:1.5;margin:0 0 4px">AI-generated draft. Review carefully before approving.</p>
<p style="color:#bbb;font-size:11px;margin:0 0 4px">This link expires in 72 hours.</p>
<p style="color:#bbb;font-size:11px;margin:0">Powered by <a href="https://kitz.services" style="color:#A855F7;text-decoration:none">KITZ</a></p>
</div>
</div>`;
}

// ── Confirmation Page (shown after approve click) ──

export function getConfirmationPageHtml(caseNumber: string, recipientEmail: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Approved — KITZ</title></head>
<body style="margin:0;padding:40px 16px;background:#f8f7ff;font-family:'Inter',Arial,Helvetica,sans-serif">
<div style="max-width:480px;margin:0 auto;text-align:center">
<div style="background:linear-gradient(135deg,#A855F7,#7C3AED);padding:24px;border-radius:16px 16px 0 0">
<span style="color:#fff;font-size:24px;font-weight:700">KITZ</span>
</div>
<div style="background:#fff;padding:40px 24px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(124,58,237,0.08)">
<div style="width:56px;height:56px;background:#e8f5e9;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center">
<span style="font-size:28px">&#10003;</span>
</div>
<h2 style="color:#1a1a2e;margin:0 0 8px;font-size:20px">Response Sent</h2>
<p style="color:#666;font-size:14px;line-height:1.5;margin:0">${caseNumber} response delivered to<br><strong>${recipientEmail}</strong></p>
<p style="color:#999;font-size:12px;margin:24px 0 0">You can close this tab.</p>
</div>
</div>
</body></html>`;
}

// ── Error Page (invalid/expired token) ──

export function getErrorPageHtml(message: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Error — KITZ</title></head>
<body style="margin:0;padding:40px 16px;background:#f8f7ff;font-family:'Inter',Arial,Helvetica,sans-serif">
<div style="max-width:480px;margin:0 auto;text-align:center">
<div style="background:linear-gradient(135deg,#A855F7,#7C3AED);padding:24px;border-radius:16px 16px 0 0">
<span style="color:#fff;font-size:24px;font-weight:700">KITZ</span>
</div>
<div style="background:#fff;padding:40px 24px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(124,58,237,0.08)">
<div style="width:56px;height:56px;background:#fce4ec;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center">
<span style="font-size:28px">&#10007;</span>
</div>
<h2 style="color:#1a1a2e;margin:0 0 8px;font-size:20px">Link Invalid</h2>
<p style="color:#666;font-size:14px;line-height:1.5;margin:0">${message}</p>
<p style="color:#999;font-size:12px;margin:24px 0 0">If you need to respond, do so manually via email.</p>
</div>
</div>
</body></html>`;
}
