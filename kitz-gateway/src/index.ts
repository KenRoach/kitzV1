import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { randomUUID } from 'node:crypto';
import type {
  ApprovalRequest,
  EventEnvelope,
  StandardError,
  ToolCallRequest,
  ToolCallResponse
} from 'kitz-schemas';

export const health = { status: 'ok' };
const app = Fastify({ logger: true });

await app.register(rateLimit, { max: 120, timeWindow: '1 minute' });

const buildError = (code: string, message: string, traceId: string): StandardError => ({ code, message, traceId });
const getTraceId = (req: FastifyRequest): string => String(req.headers['x-trace-id']);
const getOrgId = (req: FastifyRequest): string => String(req.headers['x-org-id']);

const requireAuth = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  if (!req.headers.authorization) {
    return reply.code(401).send(buildError('AUTH_REQUIRED', 'JWT verification placeholder', getTraceId(req)));
  }
};

const requireOrg = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  if (!req.headers['x-org-id']) {
    return reply.code(400).send(buildError('ORG_REQUIRED', 'x-org-id header required', getTraceId(req)));
  }
};

const requireScope = (scope: string) => async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const rawScopes = String(req.headers['x-scopes'] || '');
  const allowed = rawScopes.split(',').map((value) => value.trim()).filter(Boolean);
  if (!allowed.includes(scope)) {
    return reply.code(403).send(buildError('SCOPE_REQUIRED', `Missing scope: ${scope}`, getTraceId(req)));
  }
};

const audit = (action: string, payload: unknown, req: FastifyRequest): void => {
  app.log.info({ action, orgId: getOrgId(req), traceId: getTraceId(req), payload }, 'audit.event');
};

app.addHook('onRequest', async (req) => {
  req.headers['x-trace-id'] = (req.headers['x-trace-id'] as string) || randomUUID();
});

app.addHook('preHandler', requireAuth);
app.addHook('preHandler', requireOrg);

app.post('/events', { preHandler: requireScope('events:write') }, async (req) => {
  const body = req.body as EventEnvelope;
  audit('events.received', body, req);
  return { accepted: true, traceId: getTraceId(req) };
});

app.post('/tool-calls', { preHandler: requireScope('tools:invoke') }, async (req) => {
  const body = req.body as ToolCallRequest;
  audit('tool.invoked', body, req);
  const response: ToolCallResponse = {
    name: body.name,
    output: { status: 'routed-via-gateway' },
    riskLevel: body.riskLevel,
    requiredScopes: body.requiredScopes,
    traceId: getTraceId(req)
  };
  return response;
});

app.get('/ai-battery/balance', { preHandler: requireScope('battery:read') }, async (req) => ({
  orgId: getOrgId(req),
  credits: 100,
  traceId: getTraceId(req)
}));

app.post('/approvals/request', { preHandler: requireScope('approvals:write') }, async (req) => {
  const body = req.body as ApprovalRequest;
  audit('approval.requested', body, req);
  return { approvalId: randomUUID(), status: 'pending', traceId: getTraceId(req) };
});

app.post('/payments/checkout-session', { preHandler: requireScope('payments:write') }, async (req, reply) => {
  const payload = (req.body || {}) as { amount?: number; provider?: string; direction?: 'incoming' | 'outgoing' };
  const provider = payload.provider || 'stripe';

  if (payload.direction === 'outgoing') {
    return reply.code(403).send(buildError('SPEND_BLOCKED', 'Agents are receive-only; outgoing payments are blocked.', getTraceId(req)));
  }

  if (!['stripe', 'paypal'].includes(provider)) {
    return reply.code(400).send(buildError('PROVIDER_NOT_ALLOWED', 'Only Stripe/PayPal receive flows are supported.', getTraceId(req)));
  }

  audit('payments.checkout.create', { ...payload, provider, direction: 'incoming' }, req);
  return { sessionId: randomUUID(), provider, mobileCheckoutLink: `https://pay.kitz.local/${randomUUID()}`, traceId: getTraceId(req) };
});

app.post('/notifications/enqueue', { preHandler: requireScope('notifications:write') }, async (req) => {
  audit('notifications.enqueue', req.body, req);
  return { queued: true, traceId: getTraceId(req) };
});

app.post('/proxy/whatsapp/send', { preHandler: requireScope('messages:write') }, async (req) => {
  audit('proxy.whatsapp.send', req.body, req);
  return { proxied: true, target: 'whatsapp', traceId: getTraceId(req) };
});

app.post('/proxy/email/send', { preHandler: requireScope('messages:write') }, async (req) => {
  audit('proxy.email.send', req.body, req);
  return { proxied: true, target: 'email', traceId: getTraceId(req) };
});

app.post('/proxy/payments/webhook', { preHandler: requireScope('payments:webhooks') }, async (req) => {
  audit('proxy.payments.webhook', req.body, req);
  return { proxied: true, target: 'payments', traceId: getTraceId(req) };
});

app.listen({ port: Number(process.env.PORT || 4000), host: '0.0.0.0' });
