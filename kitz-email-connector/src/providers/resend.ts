/**
 * Email provider — Resend (primary) with SendGrid fallback.
 * Uses fetch to call provider REST APIs directly.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'kitz@kitz.services';

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  html?: string;
  replyTo?: string;
}

export interface SendResult {
  ok: boolean;
  provider: 'resend' | 'sendgrid' | 'stub';
  messageId?: string;
  error?: string;
}

async function sendViaResend(payload: EmailPayload): Promise<SendResult> {
  if (!RESEND_API_KEY) return { ok: false, provider: 'resend', error: 'RESEND_API_KEY not configured' };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: payload.to,
      subject: payload.subject,
      html: payload.html || payload.body,
      reply_to: payload.replyTo,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'unknown');
    return { ok: false, provider: 'resend', error: `Resend ${res.status}: ${text.slice(0, 200)}` };
  }

  const data = (await res.json()) as { id?: string };
  return { ok: true, provider: 'resend', messageId: data.id };
}

async function sendViaSendGrid(payload: EmailPayload): Promise<SendResult> {
  if (!SENDGRID_API_KEY) return { ok: false, provider: 'sendgrid', error: 'SENDGRID_API_KEY not configured' };

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: payload.to }] }],
      from: { email: FROM_EMAIL },
      subject: payload.subject,
      content: [{ type: 'text/html', value: payload.html || payload.body }],
      reply_to: payload.replyTo ? { email: payload.replyTo } : undefined,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'unknown');
    return { ok: false, provider: 'sendgrid', error: `SendGrid ${res.status}: ${text.slice(0, 200)}` };
  }

  const messageId = res.headers.get('x-message-id') || undefined;
  return { ok: true, provider: 'sendgrid', messageId };
}

/** Send email via Resend (primary) with SendGrid fallback. */
export async function sendEmail(payload: EmailPayload): Promise<SendResult> {
  // Try Resend first
  if (RESEND_API_KEY) {
    try {
      const result = await sendViaResend(payload);
      if (result.ok) return result;
    } catch {
      // fall through to SendGrid
    }
  }

  // Fallback to SendGrid
  if (SENDGRID_API_KEY) {
    try {
      return await sendViaSendGrid(payload);
    } catch (err) {
      return { ok: false, provider: 'sendgrid', error: (err as Error).message };
    }
  }

  // No provider configured — stub mode
  return { ok: true, provider: 'stub', messageId: `stub_${Date.now()}` };
}
