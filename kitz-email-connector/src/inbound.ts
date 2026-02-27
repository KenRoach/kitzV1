/**
 * Inbound Email Processing — Auto-reply with case tracking.
 *
 * When someone emails kitz.services:
 * 1. Detect their language (Claude Haiku)
 * 2. Generate a sequential case number (KITZ-YYYY-NNNN)
 * 3. Send branded auto-reply in their language
 * 4. Create CRM contact + task in workspace
 *
 * Tone: Gen Z clarity + disciplined founder. Direct, no fluff.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sendAutoReply } from './providers/resend.js';

// ── Types ──

export interface InboundPayload {
  type?: string;
  created_at?: string;
  data: {
    from: string;
    to: string[];
    subject: string;
    text?: string;
    html?: string;
  };
}

type SupportedLanguage = 'en' | 'es' | 'pt' | 'fr';

interface CaseCounter {
  year: number;
  seq: number;
}

// ── Paths ──

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const COUNTER_FILE = join(DATA_DIR, 'case-counter.json');

// ── In-memory counter with file persistence ──

let counter: CaseCounter | null = null;

function loadCounter(): CaseCounter {
  if (counter) return counter;
  try {
    if (existsSync(COUNTER_FILE)) {
      counter = JSON.parse(readFileSync(COUNTER_FILE, 'utf-8'));
      return counter!;
    }
  } catch { /* start fresh */ }
  counter = { year: new Date().getFullYear(), seq: 0 };
  return counter;
}

function saveCounter(c: CaseCounter): void {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(COUNTER_FILE, JSON.stringify(c, null, 2));
  } catch { /* non-fatal — in-memory still works */ }
}

// ── Case Number Generator ──

export function generateCaseNumber(): string {
  const c = loadCounter();
  const currentYear = new Date().getFullYear();
  if (c.year !== currentYear) {
    c.year = currentYear;
    c.seq = 0;
  }
  c.seq += 1;
  saveCounter(c);
  return `KITZ-${c.year}-${String(c.seq).padStart(4, '0')}`;
}

// ── Language Detection ──

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const KITZ_OS_URL = process.env.KITZ_OS_URL || '';

export async function detectLanguage(text: string): Promise<SupportedLanguage> {
  if (!text?.trim()) return 'en';

  // Send only first 200 chars for cost efficiency
  const sample = text.slice(0, 200);

  // Try Claude Haiku directly via Anthropic API
  if (ANTHROPIC_API_KEY) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 10,
          messages: [
            {
              role: 'user',
              content: `What language is this text? Reply with ONLY the ISO 639-1 code (en, es, pt, or fr). Text: "${sample}"`,
            },
          ],
        }),
        signal: AbortSignal.timeout(5_000),
      });

      if (res.ok) {
        const data = (await res.json()) as { content?: Array<{ text?: string }> };
        const code = data.content?.[0]?.text?.trim().toLowerCase().slice(0, 2);
        if (code && ['en', 'es', 'pt', 'fr'].includes(code)) return code as SupportedLanguage;
      }
    } catch { /* fallback below */ }
  }

  // Fallback: kitz_os /api/kitz if available
  if (KITZ_OS_URL) {
    try {
      const res = await fetch(`${KITZ_OS_URL}/api/kitz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `What language is this text? Reply with ONLY the ISO 639-1 code (en, es, pt, or fr). Text: "${sample}"`,
        }),
        signal: AbortSignal.timeout(5_000),
      });

      if (res.ok) {
        const data = (await res.json()) as { reply?: string };
        const code = data.reply?.trim().toLowerCase().slice(0, 2);
        if (code && ['en', 'es', 'pt', 'fr'].includes(code)) return code as SupportedLanguage;
      }
    } catch { /* fallback to default */ }
  }

  return 'en';
}

// ── Language Templates ──
// Tone: KITZ master prompt — direct, warm, no fluff. "Your hustle deserves infrastructure."

const TEMPLATES: Record<SupportedLanguage, {
  subjectPrefix: string;
  caseLabel: string;
  greeting: (name: string) => string;
  body: (caseNumber: string) => string;
  replyHint: string;
  aiDisclaimer: string;
}> = {
  en: {
    subjectPrefix: 'Re:',
    caseLabel: 'Case',
    greeting: (name) => `Hey ${name},`,
    body: (cn) => `Got your message. Your case number is <strong>${cn}</strong>.\n\nWe're on it. Expect a response within <strong>24 hours</strong>. Reply here to add details.`,
    replyHint: 'Reply to this email to add more details.',
    aiDisclaimer: 'This content was created by AI. Please review thoroughly before taking action.',
  },
  es: {
    subjectPrefix: 'Re:',
    caseLabel: 'Caso',
    greeting: (name) => `Hola ${name},`,
    body: (cn) => `Recibimos tu mensaje. Tu numero de caso es <strong>${cn}</strong>.\n\nEstamos en ello. Espera una respuesta dentro de <strong>24 horas</strong>. Responde a este correo para agregar mas detalles.`,
    replyHint: 'Responde a este correo para agregar mas detalles.',
    aiDisclaimer: 'Este contenido fue creado por IA. Por favor revisa cuidadosamente antes de tomar accion.',
  },
  pt: {
    subjectPrefix: 'Re:',
    caseLabel: 'Caso',
    greeting: (name) => `Ola ${name},`,
    body: (cn) => `Recebemos sua mensagem. Seu numero de caso e <strong>${cn}</strong>.\n\nEstamos cuidando disso. Espere uma resposta dentro de <strong>24 horas</strong>. Responda este email para adicionar mais detalhes.`,
    replyHint: 'Responda este email para adicionar mais detalhes.',
    aiDisclaimer: 'Este conteudo foi criado por IA. Por favor, revise cuidadosamente antes de tomar qualquer acao.',
  },
  fr: {
    subjectPrefix: 'Re:',
    caseLabel: 'Dossier',
    greeting: (name) => `Bonjour ${name},`,
    body: (cn) => `Nous avons recu votre message. Votre numero de dossier est <strong>${cn}</strong>.\n\nOn s'en occupe. Attendez une reponse dans <strong>24 heures</strong>. Repondez a cet email pour ajouter des details.`,
    replyHint: 'Repondez a cet email pour ajouter des details.',
    aiDisclaimer: 'Ce contenu a ete cree par l\'IA. Veuillez le verifier attentivement avant d\'agir.',
  },
};

// ── Branded HTML Template ──

export function getAutoReplyHtml(
  caseNumber: string,
  language: SupportedLanguage,
  senderName: string,
): string {
  const t = TEMPLATES[language];
  const bodyHtml = t.body(caseNumber).replace(/\n/g, '<br>');

  return `<div style="max-width:600px;margin:0 auto;font-family:'Inter',Arial,Helvetica,sans-serif;background:#f8f7ff">
<div style="background:linear-gradient(135deg,#A855F7,#7C3AED);padding:28px 24px">
<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td><span style="color:#ffffff;font-size:20px;font-weight:700;line-height:1.2">KITZ</span><br><span style="color:rgba(255,255,255,0.75);font-size:12px">Your business, handled.</span></td>
<td style="text-align:right"><span style="background:rgba(255,255,255,0.2);color:#fff;font-size:11px;padding:4px 12px;border-radius:20px;font-weight:600">${t.caseLabel} ${caseNumber}</span></td>
</tr></table>
</div>
<div style="background:#ffffff;margin:0 16px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(124,58,237,0.08)">
<div style="padding:32px 24px">
<p style="color:#1a1a2e;margin:0 0 16px;font-size:17px;font-weight:600">${t.greeting(senderName)}</p>
<p style="color:#555;font-size:15px;line-height:1.6;margin:0">${bodyHtml}</p>
</div>
</div>
<div style="padding:20px 24px;text-align:center">
<p style="color:#999;font-size:11px;line-height:1.5;margin:0 0 8px">${t.aiDisclaimer}</p>
<p style="color:#bbb;font-size:11px;margin:0">Powered by <a href="https://kitz.services" style="color:#A855F7;text-decoration:none">KITZ</a></p>
</div>
</div>`;
}

// ── Sender Parsing + Email Scraping ──

interface SenderInfo {
  name: string;
  email: string;
  domain: string;
  isPersonal: boolean; // gmail, outlook, etc. vs company domain
  company: string | null;
}

const PERSONAL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
  'live.com', 'aol.com', 'icloud.com', 'me.com', 'protonmail.com',
  'proton.me', 'mail.com', 'zoho.com', 'yandex.com',
]);

function parseSender(from: string): SenderInfo {
  let name: string;
  let email: string;

  const match = from.match(/^(.+?)\s*<(.+?)>/);
  if (match) {
    name = match[1].trim();
    email = match[2].trim();
  } else {
    email = from.trim();
    name = email.split('@')[0]?.replace(/[._-]/g, ' ') || 'there';
  }

  const domain = email.split('@')[1]?.toLowerCase() || '';
  const isPersonal = PERSONAL_DOMAINS.has(domain);
  const company = isPersonal ? null : domain.split('.')[0] || null;

  return { name, email, domain, isPersonal, company };
}

// ── Workspace MCP Integration ──

const WORKSPACE_MCP_URL = process.env.WORKSPACE_MCP_URL || '';
const WORKSPACE_MCP_KEY = process.env.WORKSPACE_MCP_KEY || '';

async function callWorkspaceMcp(
  toolName: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  if (!WORKSPACE_MCP_URL) return { error: 'MCP not configured' };

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (WORKSPACE_MCP_KEY) headers['x-api-key'] = WORKSPACE_MCP_KEY;

  try {
    const res = await fetch(WORKSPACE_MCP_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: { name: toolName, arguments: { user_id: 'email-bot', ...args } },
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) return { error: `MCP HTTP ${res.status}` };
    const data = (await res.json()) as { error?: { message: string }; result?: unknown };
    if (data.error) return { error: data.error.message };
    return data.result || {};
  } catch (err) {
    return { error: (err as Error).message };
  }
}

// ── Main Processing ──

export async function processInboundEmail(
  payload: InboundPayload,
  traceId: string,
  log: { info: (obj: unknown) => void },
): Promise<{ caseNumber: string; language: SupportedLanguage }> {
  const { from, subject, text, html } = payload.data;
  const sender = parseSender(from);

  // Block own-domain emails to prevent auto-reply loops
  if (sender.email.toLowerCase().endsWith('@kitz.services')) {
    log.info({ event: 'inbound.skip_own_domain', traceId, from: sender.email });
    return { caseNumber: 'SKIPPED', language: 'en' };
  }

  const emailBody = text || html?.replace(/<[^>]+>/g, '') || '';

  // 1. Detect language
  const language = await detectLanguage(emailBody);

  // 2. Generate case number
  const caseNumber = generateCaseNumber();

  // 3. Build auto-reply
  const t = TEMPLATES[language];
  const replySubject = `${t.subjectPrefix} ${subject} — ${t.caseLabel} ${caseNumber}`;
  const replyHtml = getAutoReplyHtml(caseNumber, language, sender.name);

  // 4. Send auto-reply (bypasses draft-first)
  const sendResult = await sendAutoReply({
    to: sender.email,
    subject: replySubject,
    body: `${t.greeting(sender.name)} ${t.body(caseNumber).replace(/<[^>]+>/g, '')}`,
    html: replyHtml,
    replyTo: 'hello@kitz.services',
  });

  log.info({
    event: 'inbound.auto_reply',
    traceId,
    caseNumber,
    language,
    to: sender.email,
    sendResult: { ok: sendResult.ok, provider: sendResult.provider },
  });

  // 5. Create CRM contact — scraped from sender email (fire-and-forget)
  callWorkspaceMcp('contacts_create', {
    name: sender.name,
    email: sender.email,
    source: 'inbound_email',
    domain: sender.domain,
    company: sender.company,
    language,
    notes: [
      `Case: ${caseNumber}`,
      `Domain: ${sender.domain}`,
      sender.company ? `Company: ${sender.company}` : 'Personal email',
      `Language: ${language}`,
      `First contact: ${subject}`,
    ].join('\n'),
  }).catch(() => { /* non-fatal */ });

  // 6. Create task in workspace — full email body + SLA (fire-and-forget)
  const slaDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  callWorkspaceMcp('tasks_create', {
    title: `[${caseNumber}] ${subject}`,
    description: [
      `From: ${sender.name} <${sender.email}>`,
      sender.company ? `Company: ${sender.company} (${sender.domain})` : `Domain: ${sender.domain}`,
      `Language: ${language}`,
      `Subject: ${subject}`,
      `SLA: Respond by ${slaDeadline} (24h)`,
      '',
      '--- Original Email ---',
      emailBody.slice(0, 1000),
    ].join('\n'),
    status: 'todo',
    priority: 'medium',
    due_date: slaDeadline,
  }).catch(() => { /* non-fatal */ });

  return { caseNumber, language };
}
