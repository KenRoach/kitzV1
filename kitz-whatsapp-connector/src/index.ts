import Fastify from 'fastify';
import { randomUUID } from 'node:crypto';
import type { EventEnvelope } from 'kitz-schemas';

export const health = { status: 'ok' };
const app = Fastify({ logger: true });

const templates = new Map<string, string>();
const consent = new Map<string, boolean>();

const audit = (event: string, payload: unknown, traceId: string): EventEnvelope => ({
  orgId: 'connector-system',
  userId: 'whatsapp-bot',
  source: 'kitz-whatsapp-connector',
  event,
  payload,
  traceId,
  ts: new Date().toISOString()
});

app.post('/webhooks/inbound', async (req: any, reply) => {
  if (!req.headers['x-provider-signature']) {
    return reply.code(400).send({ ok: false, message: 'Missing signature (placeholder validator)' });
  }

  const traceId = String(req.headers['x-trace-id'] || randomUUID());
  app.log.info(audit('whatsapp.inbound', req.body, traceId));
  return { ok: true, traceId };
});

app.post('/outbound/send', async (req: any, reply) => {
  const traceId = String(req.headers['x-trace-id'] || randomUUID());
  const draftOnly = Boolean(req.body?.draftOnly ?? true);
  if (!draftOnly) {
    return reply.code(412).send({ ok: false, message: 'Draft-first policy enabled; approval required', traceId });
  }
  app.log.info(audit('whatsapp.outbound.draft', req.body, traceId));
  return { queued: true, provider: 'stub', draftOnly, traceId };
});

app.post('/templates/:name', async (req: any) => {
  templates.set(req.params.name, req.body?.content || '');
  return { ok: true, count: templates.size };
});

app.post('/consent/:contact', async (req: any) => {
  consent.set(req.params.contact, Boolean(req.body?.granted));
  return { ok: true, contact: req.params.contact };
});

// ── Voice Note Sending ──
// Receives TTS audio from kitz_os and sends as WhatsApp voice message
app.post('/outbound/send-voice', async (req: any) => {
  const traceId = String(req.headers['x-trace-id'] || req.body?.trace_id || randomUUID());
  const { phone, audio_base64, mime_type, caption } = req.body || {};

  if (!phone || !audio_base64) {
    return { ok: false, error: 'phone and audio_base64 required' };
  }

  app.log.info(audit('whatsapp.outbound.voice_note', {
    phone,
    mime_type,
    audio_size_bytes: Math.round((audio_base64 as string).length * 0.75),
    caption: (caption as string)?.slice(0, 100),
  }, traceId));

  // TODO: Integrate with Baileys/WhatsApp Business API to send voice message
  // For now: log and acknowledge
  return {
    ok: true,
    status: 'sent',
    phone,
    mime_type: mime_type || 'audio/mpeg',
    audio_size_kb: Math.round((audio_base64 as string).length * 0.75 / 1024),
    traceId,
  };
});

// ── WhatsApp Call ──
// Initiates a voice call using KITZ's AI voice agent
app.post('/outbound/call', async (req: any) => {
  const traceId = String(req.headers['x-trace-id'] || req.body?.trace_id || randomUUID());
  const { phone, purpose, script, language, max_duration_minutes, voice } = req.body || {};

  if (!phone || !purpose) {
    return { ok: false, error: 'phone and purpose required' };
  }

  app.log.info(audit('whatsapp.outbound.call', {
    phone,
    purpose,
    language: language || 'es',
    max_duration: max_duration_minutes || 5,
    voice: voice || 'kitz_female',
  }, traceId));

  // TODO: Integrate with ElevenLabs Conversational AI + Twilio/WhatsApp Business API
  // For now: queue the call and acknowledge
  return {
    ok: true,
    status: 'queued',
    call_id: traceId,
    phone,
    purpose,
    language: language || 'es',
    voice: voice || 'kitz_female',
    traceId,
  };
});

app.listen({ port: Number(process.env.PORT || 3006), host: '0.0.0.0' });
