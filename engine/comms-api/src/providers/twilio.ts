/**
 * Twilio provider — Voice (TTS) + SMS via Twilio REST API.
 * Uses fetch directly (no SDK dependency).
 */

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE_FROM = process.env.TWILIO_PHONE_FROM || '';

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
