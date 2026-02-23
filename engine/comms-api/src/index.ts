import Fastify from 'fastify'

const app = Fastify({ logger: true })
const PORT = Number(process.env.PORT) || 3013

// Health check
app.get('/health', async () => ({ status: 'ok', service: 'comms-api' }))

// Voice routing stub (Twilio)
app.post<{ Body: { to: string; message: string; channel?: string } }>('/talk', async (req, reply) => {
  const { to, message } = req.body
  app.log.info({ to, message }, 'Voice request received (stub)')
  reply.status(202)
  return { status: 'queued', channel: 'voice', to, draftOnly: true }
})

// SMS routing stub
app.post<{ Body: { to: string; message: string } }>('/text', async (req, reply) => {
  const { to, message } = req.body
  app.log.info({ to, message }, 'SMS request received (stub)')
  reply.status(202)
  return { status: 'queued', channel: 'sms', to, draftOnly: true }
})

// Email routing stub
app.post<{ Body: { to: string; subject: string; body: string } }>('/email', async (req, reply) => {
  const { to, subject } = req.body
  app.log.info({ to, subject }, 'Email request received (stub)')
  reply.status(202)
  return { status: 'queued', channel: 'email', to, draftOnly: true }
})

app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) { app.log.error(err); process.exit(1) }
  app.log.info(`comms-api listening on :${PORT}`)
})
