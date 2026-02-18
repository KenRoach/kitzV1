import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { randomUUID } from 'node:crypto';

export const health = { status: 'ok' };
const app = Fastify({ logger: true });
await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });

const adminServicesUrl = process.env.ADMIN_SERVICES_URL || 'http://127.0.0.1:3011';
const highRiskTools = new Set(['messaging.send', 'refunds.create', 'pricing.change']);

app.addHook('onRequest', async (req) => {
  const traceId = (req.headers['x-trace-id'] as string) || randomUUID();
  req.headers['x-trace-id'] = traceId;
});

app.addHook('preHandler', async (req, reply) => {
  if (!req.headers.authorization) {
    return reply.code(401).send({ code: 'AUTH_REQUIRED', message: 'JWT verification placeholder', traceId: req.headers['x-trace-id'] });
  }
});

app.addHook('preHandler', async (req, reply) => {
  if (!req.headers['x-org-id']) {
    return reply.code(400).send({ code: 'ORG_REQUIRED', message: 'x-org-id header required', traceId: req.headers['x-trace-id'] });
  }
});

const audit = (action: string, payload: unknown, traceId: string) => app.log.info({ action, payload, traceId }, 'audit');

async function getApprovalStatus(approvalId: string) {
  const response = await fetch(`${adminServicesUrl}/approvals/${approvalId}`);
  if (!response.ok) {
    return { found: false as const };
  }
  const approval = await response.json() as { status: 'pending' | 'approved' | 'rejected' };
  return { found: true as const, status: approval.status };
}

app.post('/events', async (req) => ({ accepted: true, traceId: req.headers['x-trace-id'] }));

app.post('/tool-calls', async (req, reply) => {
  const body = (req.body ?? {}) as { name?: string; riskLevel?: string; approvalId?: string };
  const name = body.name ?? 'unknown.tool';
  const isHighRisk = body.riskLevel === 'high' || highRiskTools.has(name);

  if (!isHighRisk) {
    return { routed: true, name, traceId: req.headers['x-trace-id'] };
  }

  if (!body.approvalId) {
    return reply.code(202).send({
      routed: false,
      approvalRequired: true,
      status: 'pending',
      message: 'approval pending',
      traceId: req.headers['x-trace-id']
    });
  }

  const approvalStatus = await getApprovalStatus(body.approvalId);
  if (!approvalStatus.found) {
    return reply.code(404).send({
      routed: false,
      approvalRequired: true,
      status: 'missing',
      message: 'approval not found',
      traceId: req.headers['x-trace-id']
    });
  }

  if (approvalStatus.status !== 'approved') {
    return reply.code(202).send({
      routed: false,
      approvalRequired: true,
      status: approvalStatus.status,
      message: 'approval pending',
      traceId: req.headers['x-trace-id']
    });
  }

  return { routed: true, approvalId: body.approvalId, traceId: req.headers['x-trace-id'] };
});

app.get('/ai-battery/balance', async (req) => ({ orgId: req.headers['x-org-id'], credits: 100, traceId: req.headers['x-trace-id'] }));
app.post('/approvals/request', async (req, reply) => {
  audit('approvals.request', req.body, String(req.headers['x-trace-id']));
  const response = await fetch(`${adminServicesUrl}/approvals/request`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(req.body ?? {})
  });
  const payload = await response.json();
  return reply.code(response.status).send(payload);
});
app.get('/approvals/:approvalId', async (req, reply) => {
  const approvalId = (req.params as { approvalId: string }).approvalId;
  const response = await fetch(`${adminServicesUrl}/approvals/${approvalId}`);
  const payload = await response.json();
  return reply.code(response.status).send(payload);
});
app.post('/payments/checkout-session', async (req) => ({ sessionId: randomUUID(), traceId: req.headers['x-trace-id'], body: req.body }));
app.post('/notifications/enqueue', async (req) => ({ queued: true, traceId: req.headers['x-trace-id'], body: req.body }));
app.all('/proxy/:target/*', async (req) => {
  const target = (req.params as { target: string }).target;
  audit('proxy.' + target, req.body, String(req.headers['x-trace-id']));
  return { proxied: true, target, traceId: req.headers['x-trace-id'] };
});

const port = Number(process.env.PORT || 4000);
app.listen({ port, host: '0.0.0.0' });
