import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { randomUUID, createHash } from 'node:crypto';
import type {
  ApprovalRequest,
  EventEnvelope,
  StandardError,
  ToolCallRequest,
  ToolCallResponse
} from 'kitz-schemas';
import { verifyJwt, signJwt } from './jwt.js';
import { FileBackedRateLimitStore } from './rateLimitStore.js';

export const health = { status: 'ok' };
const app = Fastify({ logger: true });

await app.register(rateLimit, { max: 120, timeWindow: '1 minute', store: FileBackedRateLimitStore });

const JWT_SECRET = process.env.JWT_SECRET || process.env.DEV_TOKEN_SECRET || '';
const TOKEN_EXPIRY_SECONDS = 86400 * 7; // 7 days

/** In-memory user store (MVP — replace with Supabase in production) */
interface UserRecord { id: string; email: string; name: string; passwordHash: string; orgId: string; createdAt: string; }
const users = new Map<string, UserRecord>(); // keyed by email

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

const buildError = (code: string, message: string, traceId: string): StandardError => ({ code, message, traceId });
const getTraceId = (req: FastifyRequest): string => String(req.headers['x-trace-id']);
const getOrgId = (req: FastifyRequest): string => String(req.headers['x-org-id']);

/** Routes that skip auth */
const PUBLIC_PATHS = ['/auth/signup', '/auth/token', '/health'];

const requireAuth = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  if (PUBLIC_PATHS.some(p => req.url.startsWith(p))) return;

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return reply.code(401).send(buildError('AUTH_REQUIRED', 'Authorization header required', getTraceId(req)));
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  if (!JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      return reply.code(500).send(buildError('AUTH_CONFIG', 'JWT_SECRET not configured', getTraceId(req)));
    }
    return;
  }

  try {
    const claims = verifyJwt(token, JWT_SECRET);
    if (claims.sub) req.headers['x-user-id'] = claims.sub;
    if (claims.org_id) req.headers['x-org-id'] = claims.org_id;
    if (claims.scopes) req.headers['x-scopes'] = claims.scopes.join(',');
  } catch (err) {
    return reply.code(401).send(buildError('AUTH_INVALID', (err as Error).message, getTraceId(req)));
  }
};

const requireOrg = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  if (PUBLIC_PATHS.some(p => req.url.startsWith(p))) return;
  if (!req.headers['x-org-id']) {
    return reply.code(400).send(buildError('ORG_REQUIRED', 'x-org-id header required (set in JWT org_id claim or x-org-id header)', getTraceId(req)));
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

/* ── Auth Endpoints (public — no token required) ── */

app.post('/auth/signup', async (req, reply) => {
  const { email, password, name } = (req.body || {}) as { email?: string; password?: string; name?: string };
  const traceId = getTraceId(req);

  if (!email || !password || !name) {
    return reply.code(400).send(buildError('VALIDATION', 'email, password, and name are required', traceId));
  }
  if (password.length < 6) {
    return reply.code(400).send(buildError('VALIDATION', 'Password must be at least 6 characters', traceId));
  }
  if (users.has(email.toLowerCase())) {
    return reply.code(409).send(buildError('USER_EXISTS', 'An account with this email already exists', traceId));
  }

  const userId = randomUUID();
  const orgId = randomUUID();
  const user: UserRecord = {
    id: userId,
    email: email.toLowerCase(),
    name,
    passwordHash: hashPassword(password),
    orgId,
    createdAt: new Date().toISOString(),
  };
  users.set(user.email, user);

  const now = Math.floor(Date.now() / 1000);
  const token = signJwt({
    sub: userId,
    org_id: orgId,
    scopes: ['battery:read', 'payments:write', 'tools:invoke', 'events:write', 'notifications:write', 'messages:write'],
    iat: now,
    exp: now + TOKEN_EXPIRY_SECONDS,
  }, JWT_SECRET);

  audit('auth.signup', { userId, email: user.email, orgId }, req);
  return { token, userId, orgId, name, expiresIn: TOKEN_EXPIRY_SECONDS };
});

app.post('/auth/token', async (req, reply) => {
  const { email, password } = (req.body || {}) as { email?: string; password?: string };
  const traceId = getTraceId(req);

  if (!email || !password) {
    return reply.code(400).send(buildError('VALIDATION', 'email and password are required', traceId));
  }

  const user = users.get(email.toLowerCase());
  if (!user || user.passwordHash !== hashPassword(password)) {
    return reply.code(401).send(buildError('AUTH_FAILED', 'Invalid email or password', traceId));
  }

  const now = Math.floor(Date.now() / 1000);
  const token = signJwt({
    sub: user.id,
    org_id: user.orgId,
    scopes: ['battery:read', 'payments:write', 'tools:invoke', 'events:write', 'notifications:write', 'messages:write'],
    iat: now,
    exp: now + TOKEN_EXPIRY_SECONDS,
  }, JWT_SECRET);

  audit('auth.token', { userId: user.id, email: user.email }, req);
  return { token, userId: user.id, orgId: user.orgId, name: user.name, expiresIn: TOKEN_EXPIRY_SECONDS };
});

app.listen({ port: Number(process.env.PORT || 4000), host: '0.0.0.0' });
