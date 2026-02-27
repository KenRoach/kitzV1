import Fastify from 'fastify';
import { randomUUID } from 'node:crypto';
import type { EventEnvelope } from 'kitz-schemas';
import { sendEmail } from './providers/resend.js';
import {
  upsertTemplate, getTemplate, listTemplates,
  setConsent, hasConsent,
  addToSuppression, isSuppressed, listSuppression,
} from './db.js';

export const health = { status: 'ok' };
const app = Fastify({ logger: true });

const audit = (event: string, payload: unknown, traceId: string): EventEnvelope => ({
  orgId: 'connector-system',
  userId: 'email-bot',
  source: 'kitz-email-connector',
  event,
  payload,
  traceId,
  ts: new Date().toISOString(),
});

// ── Health ──
app.get('/health', async () => ({ status: 'ok', service: 'kitz-email-connector' }));

// ── Inbound webhook ──
app.post('/webhooks/inbound', async (req: any, reply) => {
  if (!req.headers['x-provider-signature']) {
    return reply.code(400).send({ ok: false, message: 'Missing signature' });
  }
  const traceId = String(req.headers['x-trace-id'] || randomUUID());
  app.log.info(audit('email.inbound', req.body, traceId));
  return { ok: true, traceId };
});

// ── Outbound send (draft-first enforced) ──
app.post('/outbound/send', async (req: any, reply) => {
  const traceId = String(req.headers['x-trace-id'] || randomUUID());
  const orgId = String(req.headers['x-org-id'] || 'unknown-org');
  const recipient = String(req.body?.to || '');

  // Check suppression list
  if (await isSuppressed(recipient)) {
    return reply.code(409).send({ ok: false, message: 'Recipient is in suppression list', traceId });
  }

  const draftOnly = Boolean(req.body?.draftOnly ?? true);
  if (draftOnly) {
    app.log.info(audit('email.outbound.draft', req.body, traceId));
    return { queued: true, draftOnly: true, traceId };
  }

  // Approved send — use real provider
  const result = await sendEmail({
    to: recipient,
    subject: String(req.body?.subject || ''),
    body: String(req.body?.body || ''),
    html: req.body?.html,
    replyTo: req.body?.replyTo,
    from: req.body?.from,
  });

  app.log.info(audit('email.outbound.sent', { ...result, orgId }, traceId));

  if (!result.ok) {
    return reply.code(502).send({ ok: false, error: result.error, provider: result.provider, traceId });
  }

  return { ok: true, provider: result.provider, messageId: result.messageId, traceId };
});

// ── Send endpoint (alias used by notification queue) ──
app.post('/send', async (req: any, reply) => {
  const traceId = String(req.headers['x-trace-id'] || randomUUID());
  const recipient = String(req.body?.to || '');

  if (await isSuppressed(recipient)) {
    return reply.code(409).send({ ok: false, message: 'Suppressed', traceId });
  }

  const result = await sendEmail({
    to: recipient,
    subject: String(req.body?.subject || ''),
    body: String(req.body?.body || req.body?.message || ''),
  });

  if (!result.ok) {
    return reply.code(502).send({ ok: false, error: result.error, traceId });
  }

  return { ok: true, provider: result.provider, messageId: result.messageId, traceId };
});

// ── Templates ──
app.post('/templates/:name', async (req: any) => {
  const orgId = String(req.headers['x-org-id'] || 'default');
  await upsertTemplate(orgId, req.params.name, req.body?.content || '');
  return { ok: true, name: req.params.name };
});

app.get('/templates/:name', async (req: any, reply) => {
  const orgId = String(req.headers['x-org-id'] || 'default');
  const content = await getTemplate(orgId, req.params.name);
  if (!content) return reply.code(404).send({ error: 'Template not found' });
  return { name: req.params.name, content };
});

app.get('/templates', async (req: any) => {
  const orgId = String(req.headers['x-org-id'] || 'default');
  return { templates: await listTemplates(orgId) };
});

// ── Consent ──
app.post('/consent/:contact', async (req: any) => {
  await setConsent(req.params.contact, Boolean(req.body?.granted));
  return { ok: true };
});

app.get('/consent/:contact', async (req: any) => {
  const granted = await hasConsent(req.params.contact);
  return { contact: req.params.contact, granted };
});

// ── Suppression ──
app.post('/unsubscribe/:email', async (req: any) => {
  await addToSuppression(req.params.email);
  return { ok: true, suppressed: req.params.email };
});

app.get('/suppression', async () => ({
  entries: await listSuppression(),
}));

app.listen({ port: Number(process.env.PORT || 3007), host: '0.0.0.0' });
