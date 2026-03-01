import Fastify from 'fastify'
import { randomUUID } from 'node:crypto'
import { sendSms, initiateCall } from './providers/twilio.js'
import { saveComms, updateCommsStatus, getCommsById, type CommsRecord } from './db.js'

const app = Fastify({ logger: true })
const PORT = Number(process.env.PORT) || 3013

// ── Auth hook (validates x-service-secret for inter-service calls) ──
const SERVICE_SECRET = process.env.SERVICE_SECRET || process.env.DEV_TOKEN_SECRET || ''

app.addHook('onRequest', async (req, reply) => {
  const path = req.url.split('?')[0]
  if (path === '/health') return

  if (SERVICE_SECRET) {
    const secret = req.headers['x-service-secret'] as string | undefined
    const devSecret = req.headers['x-dev-secret'] as string | undefined
    if (secret !== SERVICE_SECRET && devSecret !== process.env.DEV_TOKEN_SECRET) {
      const traceId = String(req.headers['x-trace-id'] || randomUUID())
      return reply.code(401).send({ code: 'AUTH_REQUIRED', message: 'Missing or invalid service secret', traceId })
    }
  }
})

const EMAIL_CONNECTOR_URL = process.env.EMAIL_CONNECTOR_URL || 'http://kitz-email-connector:3007'

// ── Health — verify downstream connectors ──
app.get('/health', async () => {
  const checks: Record<string, string> = { service: 'ok' }
  try {
    const res = await fetch(`${EMAIL_CONNECTOR_URL.replace('/outbound/send', '')}/health`, { signal: AbortSignal.timeout(3000) })
    checks.email = res.ok ? 'ok' : 'unreachable'
  } catch { checks.email = 'unreachable' }
  checks.twilio = process.env.TWILIO_ACCOUNT_SID ? 'configured' : 'missing'
  const allOk = Object.values(checks).every(v => v === 'ok' || v === 'configured')
  return { status: allOk ? 'ok' : 'degraded', service: 'comms-api', checks }
})

// ── Input validation helpers ──
const PHONE_RE = /^\+?[0-9]{7,15}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ── Security headers ──
app.addHook('onSend', async (_req, reply) => {
  reply.header('X-Frame-Options', 'DENY')
  reply.header('X-Content-Type-Options', 'nosniff')
  reply.header('X-XSS-Protection', '1; mode=block')
})

// ── Voice (Twilio TTS call) ──
app.post<{ Body: { to: string; message: string; channel?: string } }>('/talk', async (req, reply) => {
  const { to, message } = req.body
  if (!to || !PHONE_RE.test(to)) {
    return reply.code(400).send({ code: 'INVALID_PHONE', message: 'Valid phone number required (7-15 digits)', traceId: String(req.headers['x-trace-id'] || randomUUID()) })
  }
  const traceId = String(req.headers['x-trace-id'] || randomUUID())
  const orgId = String(req.headers['x-org-id'] || 'unknown-org')
  const id = `comms_${Date.now()}_${randomUUID().slice(0, 8)}`

  const record: CommsRecord = {
    id,
    channel: 'voice',
    to,
    message,
    status: 'draft',
    provider: 'twilio',
    orgId,
    traceId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  await saveComms(record)
  app.log.info({ id, to, channel: 'voice' }, 'Voice request saved as draft')
  reply.status(202)
  return { id, status: 'draft', channel: 'voice', to, draftOnly: true }
})

// ── SMS (Twilio) ──
app.post<{ Body: { to: string; message: string } }>('/text', async (req, reply) => {
  const { to, message } = req.body
  if (!to || !PHONE_RE.test(to)) {
    return reply.code(400).send({ code: 'INVALID_PHONE', message: 'Valid phone number required (7-15 digits)', traceId: String(req.headers['x-trace-id'] || randomUUID()) })
  }
  const traceId = String(req.headers['x-trace-id'] || randomUUID())
  const orgId = String(req.headers['x-org-id'] || 'unknown-org')
  const id = `comms_${Date.now()}_${randomUUID().slice(0, 8)}`

  const record: CommsRecord = {
    id,
    channel: 'sms',
    to,
    message,
    status: 'draft',
    provider: 'twilio',
    orgId,
    traceId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  await saveComms(record)
  app.log.info({ id, to, channel: 'sms' }, 'SMS request saved as draft')
  reply.status(202)
  return { id, status: 'draft', channel: 'sms', to, draftOnly: true }
})

// ── Email (forwards to email connector) ──
app.post<{ Body: { to: string; subject: string; body: string } }>('/email', async (req, reply) => {
  const { to, subject, body } = req.body
  if (!to || !EMAIL_RE.test(to)) {
    return reply.code(400).send({ code: 'INVALID_EMAIL', message: 'Valid email address required', traceId: String(req.headers['x-trace-id'] || randomUUID()) })
  }
  const traceId = String(req.headers['x-trace-id'] || randomUUID())
  const orgId = String(req.headers['x-org-id'] || 'unknown-org')
  const id = `comms_${Date.now()}_${randomUUID().slice(0, 8)}`

  const record: CommsRecord = {
    id,
    channel: 'email',
    to,
    message: body,
    subject,
    status: 'draft',
    provider: 'email-connector',
    orgId,
    traceId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  await saveComms(record)
  app.log.info({ id, to, subject, channel: 'email' }, 'Email request saved as draft')
  reply.status(202)
  return { id, status: 'draft', channel: 'email', to, draftOnly: true }
})

// ── Approve + send a draft ──
app.post<{ Params: { id: string } }>('/:id/approve', async (req, reply) => {
  const record = await getCommsById(req.params.id)
  if (!record) {
    reply.status(404)
    return { error: 'Communication not found' }
  }

  if (record.status !== 'draft') {
    reply.status(409)
    return { error: `Cannot approve: status is '${record.status}'` }
  }

  // Actually send via the appropriate provider
  let result: { ok: boolean; sid?: string; error?: string }

  switch (record.channel) {
    case 'sms': {
      result = await sendSms(record.to, record.message)
      break
    }
    case 'voice': {
      const twiml = `<Response><Say>${record.message}</Say></Response>`
      result = await initiateCall(record.to, twiml)
      break
    }
    case 'email': {
      try {
        const res = await fetch(`${EMAIL_CONNECTOR_URL}/outbound/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-trace-id': record.traceId,
            'x-org-id': record.orgId,
          },
          body: JSON.stringify({
            to: record.to,
            subject: record.subject,
            body: record.message,
            draftOnly: false,
          }),
          signal: AbortSignal.timeout(10_000),
        })
        const data = (await res.json()) as { ok?: boolean; messageId?: string; error?: string }
        result = { ok: Boolean(data.ok), sid: data.messageId, error: data.error }
      } catch (err) {
        result = { ok: false, error: (err as Error).message }
      }
      break
    }
  }

  if (result.ok) {
    await updateCommsStatus(record.id, 'sent', result.sid)
    return { id: record.id, status: 'sent', providerSid: result.sid }
  }

  await updateCommsStatus(record.id, 'failed')
  reply.status(502)
  return { id: record.id, status: 'failed', error: result.error }
})

// ── Get status ──
app.get<{ Params: { id: string } }>('/status/:id', async (req, reply) => {
  const record = await getCommsById(req.params.id)
  if (!record) {
    reply.status(404)
    return { error: 'Communication not found' }
  }
  return record
})

app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) { app.log.error(err); process.exit(1) }
  app.log.info(`comms-api listening on :${PORT}`)
})
