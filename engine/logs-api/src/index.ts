import Fastify from 'fastify'
import { insertLog, updateLogStatus, queryLogs, getMemLogs, type LogEntry } from './db.js'

const app = Fastify({ logger: true })
const PORT = Number(process.env.PORT) || 3014

// ── Auth hook (validates x-service-secret for inter-service calls) ──
const SERVICE_SECRET = process.env.SERVICE_SECRET || process.env.DEV_TOKEN_SECRET || ''

app.addHook('onRequest', async (req, reply) => {
  const path = req.url.split('?')[0]
  if (path === '/health') return

  if (SERVICE_SECRET) {
    const secret = req.headers['x-service-secret'] as string | undefined
    const devSecret = req.headers['x-dev-secret'] as string | undefined
    if (secret !== SERVICE_SECRET && devSecret !== process.env.DEV_TOKEN_SECRET) {
      return reply.code(401).send({ error: 'Unauthorized: missing or invalid service secret' })
    }
  }
})

// ── Health ──
app.get('/health', async () => ({
  status: 'ok',
  service: 'logs-api',
  entries: getMemLogs().length,
}))

// ── Ingest a new log entry ──
app.post<{ Body: Omit<LogEntry, 'id'> }>('/logs', async (req, reply) => {
  const entry: LogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    ...req.body,
    timestamp: req.body.timestamp || new Date().toISOString(),
  }

  await insertLog(entry)
  reply.status(201)
  return entry
})

// ── Query logs with filters, date-range, full-text search ──
app.get<{
  Querystring: {
    type?: string
    limit?: string
    offset?: string
    agentId?: string
    status?: string
    search?: string
    from?: string
    to?: string
  }
}>('/logs', async (req) => {
  const { type, limit: limitStr, offset: offsetStr, agentId, status, search, from, to } = req.query

  return queryLogs({
    type,
    agentId,
    status,
    search,
    from,
    to,
    limit: Number(limitStr) || 50,
    offset: Number(offsetStr) || 0,
  })
})

// ── Approve a draft ──
app.patch<{ Params: { id: string } }>('/logs/:id/approve', async (req, reply) => {
  const entry = await updateLogStatus(req.params.id, 'approved')
  if (!entry) { reply.status(404); return { error: 'Not found' } }
  return entry
})

// ── Reject a draft ──
app.patch<{ Params: { id: string } }>('/logs/:id/reject', async (req, reply) => {
  const entry = await updateLogStatus(req.params.id, 'rejected')
  if (!entry) { reply.status(404); return { error: 'Not found' } }
  return entry
})

app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) { app.log.error(err); process.exit(1) }
  app.log.info(`logs-api listening on :${PORT}`)
})
