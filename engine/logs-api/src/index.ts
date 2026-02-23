import Fastify from 'fastify'

const app = Fastify({ logger: true })
const PORT = Number(process.env.PORT) || 3014

// In-memory log store
interface LogEntry {
  id: string
  type: 'agent_action' | 'crm' | 'order' | 'message' | 'system' | 'draft'
  actor: { name: string; isAgent: boolean }
  action: string
  detail?: string
  timestamp: string
  traceId?: string
  status?: 'pending' | 'approved' | 'rejected'
  meta?: Record<string, unknown>
}

const logs: LogEntry[] = []

// Health check
app.get('/health', async () => ({ status: 'ok', service: 'logs-api', entries: logs.length }))

// Ingest a new log entry
app.post<{ Body: Omit<LogEntry, 'id'> }>('/logs', async (req, reply) => {
  const entry: LogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    ...req.body,
    timestamp: req.body.timestamp || new Date().toISOString(),
  }
  logs.unshift(entry) // newest first
  if (logs.length > 10000) logs.length = 10000 // cap at 10k
  reply.status(201)
  return entry
})

// Query logs with filters
app.get<{
  Querystring: { type?: string; limit?: string; offset?: string; agentId?: string; status?: string }
}>('/logs', async (req) => {
  let filtered = [...logs]
  const { type, limit: limitStr, offset: offsetStr, agentId, status } = req.query

  if (type) filtered = filtered.filter((l) => l.type === type)
  if (agentId) filtered = filtered.filter((l) => l.meta?.agentId === agentId)
  if (status) filtered = filtered.filter((l) => l.status === status)

  const offset = Number(offsetStr) || 0
  const limit = Number(limitStr) || 50

  const page = filtered.slice(offset, offset + limit)
  return { entries: page, total: filtered.length, hasMore: offset + limit < filtered.length }
})

// Approve a draft
app.patch<{ Params: { id: string } }>('/logs/:id/approve', async (req, reply) => {
  const entry = logs.find((l) => l.id === req.params.id)
  if (!entry) { reply.status(404); return { error: 'Not found' } }
  entry.status = 'approved'
  return entry
})

// Reject a draft
app.patch<{ Params: { id: string } }>('/logs/:id/reject', async (req, reply) => {
  const entry = logs.find((l) => l.id === req.params.id)
  if (!entry) { reply.status(404); return { error: 'Not found' } }
  entry.status = 'rejected'
  return entry
})

app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) { app.log.error(err); process.exit(1) }
  app.log.info(`logs-api listening on :${PORT}`)
})
