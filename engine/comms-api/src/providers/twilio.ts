/**
 * Twilio provider — Voice (TTS) + SMS + WhatsApp via Twilio REST API.
 * Uses fetch directly (no SDK dependency).
 *
 * WhatsApp: Uses Twilio WhatsApp Business API. Requires TWILIO_WHATSAPP_FROM
 * to be a WhatsApp-enabled number (format: whatsapp:+1234567890).
 * Falls back to TWILIO_WHATSAPP_FALLBACK, then TWILIO_PHONE_FROM with whatsapp: prefix.
 */

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE_FROM = process.env.TWILIO_PHONE_FROM || '';
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || '';
const TWILIO_WHATSAPP_FALLBACK = process.env.TWILIO_WHATSAPP_FALLBACK || '';

function twilioAuth(): string {
  return `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}`;
}

function twilioUrl(resource: string): string {
  return `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/${resource}.json`;
}

export interface TwilioResult {
  ok: boolean;
  provider: 'twilio' | 'stub';
  sid?: string;
  error?: string;
  usedFallback?: boolean;
}

/** Send SMS via Twilio */
export async function sendSms(to: string, body: string): Promise<TwilioResult> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    return { ok: true, provider: 'stub', sid: `stub_sms_${Date.now()}` };
  }

  const params = new URLSearchParams({ To: to, From: TWILIO_PHONE_FROM, Body: body });

  const res = await fetch(twilioUrl('Messages'), {
    method: 'POST',
    headers: {
      Authorization: twilioAuth(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'unknown');
    return { ok: false, provider: 'twilio', error: `Twilio SMS ${res.status}: ${text.slice(0, 200)}` };
  }

  const data = (await res.json()) as { sid?: string };
  return { ok: true, provider: 'twilio', sid: data.sid };
}

/** Internal: attempt a WhatsApp send with a specific from number */
async function attemptWhatsAppSend(
  waTo: string,
  waFrom: string,
  body: string,
  mediaUrl?: string,
): Promise<{ ok: boolean; sid?: string; status?: number; error?: string }> {
  const params = new URLSearchParams({ To: waTo, From: waFrom, Body: body });
  if (mediaUrl) params.set('MediaUrl', mediaUrl);

  const res = await fetch(twilioUrl('Messages'), {
    method: 'POST',
    headers: {
      Authorization: twilioAuth(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'unknown');
    return { ok: false, status: res.status, error: text.slice(0, 200) };
  }

  const data = (await res.json()) as { sid?: string };
  return { ok: true, sid: data.sid };
}

/** Send WhatsApp message via Twilio WhatsApp Business API (with fallback sender) */
export async function sendWhatsApp(to: string, body: string): Promise<TwilioResult> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    return { ok: true, provider: 'stub', sid: `stub_wa_${Date.now()}` };
  }

  const waTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
  const primaryFrom = TWILIO_WHATSAPP_FROM || `whatsapp:${TWILIO_PHONE_FROM}`;

  // Try primary sender
  const primary = await attemptWhatsAppSend(waTo, primaryFrom, body);
  if (primary.ok) {
    return { ok: true, provider: 'twilio', sid: primary.sid };
  }

  // If primary failed and fallback configured, try fallback
  if (TWILIO_WHATSAPP_FALLBACK && TWILIO_WHATSAPP_FALLBACK !== primaryFrom) {
    const fallback = await attemptWhatsAppSend(waTo, TWILIO_WHATSAPP_FALLBACK, body);
    if (fallback.ok) {
      return { ok: true, provider: 'twilio', sid: fallback.sid, usedFallback: true };
    }
    return { ok: false, provider: 'twilio', error: `Primary (${primary.status}): ${primary.error}; Fallback (${fallback.status}): ${fallback.error}` };
  }

  return { ok: false, provider: 'twilio', error: `Twilio WhatsApp ${primary.status}: ${primary.error}` };
}

/** Send WhatsApp media (image, document) via Twilio (with fallback sender) */
export async function sendWhatsAppMedia(
  to: string,
  body: string,
  mediaUrl: string,
): Promise<TwilioResult> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    return { ok: true, provider: 'stub', sid: `stub_wa_media_${Date.now()}` };
  }

  const waTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
  const primaryFrom = TWILIO_WHATSAPP_FROM || `whatsapp:${TWILIO_PHONE_FROM}`;

  // Try primary sender
  const primary = await attemptWhatsAppSend(waTo, primaryFrom, body, mediaUrl);
  if (primary.ok) {
    return { ok: true, provider: 'twilio', sid: primary.sid };
  }

  // If primary failed and fallback configured, try fallback
  if (TWILIO_WHATSAPP_FALLBACK && TWILIO_WHATSAPP_FALLBACK !== primaryFrom) {
    const fallback = await attemptWhatsAppSend(waTo, TWILIO_WHATSAPP_FALLBACK, body, mediaUrl);
    if (fallback.ok) {
      return { ok: true, provider: 'twilio', sid: fallback.sid, usedFallback: true };
    }
    return { ok: false, provider: 'twilio', error: `Primary (${primary.status}): ${primary.error}; Fallback (${fallback.status}): ${fallback.error}` };
  }

  return { ok: false, provider: 'twilio', error: `Twilio WhatsApp Media ${primary.status}: ${primary.error}` };
}

/** Initiate a voice call via Twilio with TwiML */
export async function initiateCall(to: string, twiml: string): Promise<TwilioResult> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    return { ok: true, provider: 'stub', sid: `stub_call_${Date.now()}` };
  }

  const params = new URLSearchParams({ To: to, From: TWILIO_PHONE_FROM, Twiml: twiml });

  const res = await fetch(twilioUrl('Calls'), {
    method: 'POST',
    headers: {
      Authorization: twilioAuth(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'unknown');
    return { ok: false, provider: 'twilio', error: `Twilio Call ${res.status}: ${text.slice(0, 200)}` };
  }

  const data = (await res.json()) as { sid?: string };
  return { ok: true, provider: 'twilio', sid: data.sid };
}
