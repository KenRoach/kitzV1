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
import { verifyJwt, signJwt } from './jwt.js';
import { FileBackedRateLimitStore } from './rateLimitStore.js';
// Google OAuth removed — email/password only
import { findUserByEmail, createUser, verifyPassword, listUsers, restoreUsers, setResetToken, findUserByResetToken, clearResetToken, updatePassword } from './db.js';
import { handleToolCall } from './renewflowTools.js';
import { sendPasswordResetEmail } from './email.js';

export const health = { status: 'ok' };
const app = Fastify({ logger: true, bodyLimit: 1_048_576 }); // 1MB max request body

// ── Launch safety checks ──
const isProduction = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT === 'production';
if (!process.env.DATABASE_URL && !process.env.SUPABASE_URL) {
  app.log.warn('⚠ DATABASE_URL and SUPABASE_URL not set — user data will use in-memory storage (lost on restart)');
  if (isProduction) {
    app.log.error('⛔ PRODUCTION without DATABASE_URL is dangerous. Set DATABASE_URL or SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.');
  }
}
if (!process.env.JWT_SECRET && !process.env.DEV_TOKEN_SECRET) {
  app.log.warn('⚠ JWT_SECRET not set — auth tokens cannot be verified');
}

// ── Rate limiting ──
// Global: 120 req/min per IP; auth endpoints get stricter limits below
await app.register(rateLimit, { max: 120, timeWindow: '1 minute', store: FileBackedRateLimitStore });

// ── CORS origin allowlist ──
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173').split(',').map(o => o.trim());

function isAllowedOrigin(origin: string | undefined): string | false {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  // Allow any *.railway.app and *.renewflow.io in production
  if (/^https:\/\/[\w-]+\.up\.railway\.app$/.test(origin)) return origin;
  if (/^https:\/\/(www\.)?renewflow\.io$/.test(origin)) return origin;
  return false;
}

// CORS + Security headers
app.addHook('onSend', async (req, reply) => {
  const origin = req.headers.origin;
  const allowed = isAllowedOrigin(origin);
  if (allowed) {
    reply.header('Access-Control-Allow-Origin', allowed);
    reply.header('Access-Control-Allow-Credentials', 'true');
  }
  reply.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-org-id, x-trace-id');
  reply.header('X-Frame-Options', 'DENY');
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('X-XSS-Protection', '1; mode=block');
  reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  reply.header('X-Permitted-Cross-Domain-Policies', 'none');
  reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  reply.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
});

// CORS preflight
app.options('/*', async (_req, reply) => {
  return reply.code(204).send();
});

const JWT_SECRET = process.env.JWT_SECRET || process.env.DEV_TOKEN_SECRET || '';
const TOKEN_EXPIRY_SECONDS = 86400 * 7; // 7 days

const buildError = (code: string, message: string, traceId: string): StandardError => ({ code, message, traceId });
const getTraceId = (req: FastifyRequest): string => String(req.headers['x-trace-id']);
const getOrgId = (req: FastifyRequest): string => String(req.headers['x-org-id']);

/** Routes that skip auth */
const PUBLIC_PATHS = ['/auth/signup', '/auth/token', '/auth/forgot-password', '/auth/reset-password', '/auth/validate-reset-token', '/health'];

const requireAuth = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  if (req.method === 'OPTIONS') return;
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
    if (claims.role) req.headers['x-user-role'] = String(claims.role);
    if (claims.scopes) req.headers['x-scopes'] = claims.scopes.join(',');
  } catch (err) {
    return reply.code(401).send(buildError('AUTH_INVALID', (err as Error).message, getTraceId(req)));
  }
};

const requireOrg = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  if (req.method === 'OPTIONS') return;
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

// Health check (public — no auth required) — verifies downstream connectivity
app.get('/health', async () => {
  const checks: Record<string, string> = { gateway: 'ok' };
  // Verify database (user lookup)
  try {
    await listUsers();
    checks.database = 'ok';
  } catch { checks.database = 'unreachable'; }
  const allOk = Object.values(checks).every(v => v === 'ok');
  return { status: allOk ? 'ok' : 'degraded', service: 'kitz-gateway', checks };
});

app.post('/events', { preHandler: requireScope('events:write') }, async (req) => {
  const body = req.body as EventEnvelope;
  audit('events.received', body, req);
  return { accepted: true, traceId: getTraceId(req) };
});

app.post('/tool-calls', { preHandler: requireScope('tools:invoke') }, async (req) => {
  const body = req.body as ToolCallRequest;
  audit('tool.invoked', body, req);

  // Route through RenewFlow tool handlers first
  const orgId = getOrgId(req);
  const userRole = String(req.headers['x-user-role'] || 'var');
  const result = await handleToolCall(body.name, (body.input || {}) as Record<string, unknown>, orgId, userRole);

  const response: ToolCallResponse = {
    name: body.name,
    output: result.handled ? result.output : { status: 'routed-via-gateway' },
    riskLevel: body.riskLevel,
    requiredScopes: body.requiredScopes,
    traceId: getTraceId(req)
  };
  return response;
});

app.get('/ai-battery/balance', { preHandler: requireScope('battery:read') }, async (req) => {
  const kitzOsUrl = process.env.KITZ_OS_URL || 'http://localhost:3012';
  try {
    const res = await fetch(`${kitzOsUrl}/api/kitz/battery`, {
      headers: { 'x-trace-id': getTraceId(req), 'x-org-id': getOrgId(req) },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json() as any;
      return {
        orgId: getOrgId(req),
        credits: data.remaining ?? data.credits ?? 0,
        dailyLimit: data.dailyLimit ?? 5,
        todaySpent: data.todayCredits ?? 0,
        depleted: data.depleted ?? false,
        traceId: getTraceId(req),
      };
    }
  } catch { /* kitz_os unreachable — fall through */ }

  // Fallback if kitz_os is down
  return { orgId: getOrgId(req), credits: 0, dailyLimit: 5, todaySpent: 0, depleted: true, status: 'kitz_os_offline', traceId: getTraceId(req) };
});

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

// Auth rate limits: 10 attempts/min per IP (brute-force protection)
const authRateLimit = { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } };

app.post('/auth/signup', authRateLimit, async (req, reply) => {
  const { email, password, name } = (req.body || {}) as { email?: string; password?: string; name?: string };
  const traceId = getTraceId(req);

  if (!email || !password || !name) {
    return reply.code(400).send(buildError('VALIDATION', 'email, password, and name are required', traceId));
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return reply.code(400).send(buildError('VALIDATION', 'Invalid email format', traceId));
  }
  if (password.length < 8) {
    return reply.code(400).send(buildError('VALIDATION', 'Password must be at least 8 characters', traceId));
  }
  if (name.length < 2 || name.length > 100) {
    return reply.code(400).send(buildError('VALIDATION', 'Name must be 2-100 characters', traceId));
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    return reply.code(409).send(buildError('USER_EXISTS', 'An account with this email already exists', traceId));
  }

  const role = ((req.body as Record<string, unknown>).role as string) || 'var';
  const validRoles = ['var', 'support', 'delivery-partner'];
  const userRole = validRoles.includes(role) ? role : 'var';

  const user = await createUser(email, password, name, { role: userRole as 'var' | 'support' | 'delivery-partner' } as any);

  const now = Math.floor(Date.now() / 1000);
  const token = signJwt({
    sub: user.id,
    org_id: user.orgId,
    role: user.role,
    scopes: ['battery:read', 'payments:write', 'tools:invoke', 'events:write', 'notifications:write', 'messages:write'],
    iat: now,
    exp: now + TOKEN_EXPIRY_SECONDS,
  }, JWT_SECRET);

  audit('auth.signup', { userId: user.id, email: user.email, orgId: user.orgId, role: user.role }, req);
  return { token, userId: user.id, orgId: user.orgId, name: user.name, role: user.role, expiresIn: TOKEN_EXPIRY_SECONDS };
});

app.post('/auth/token', authRateLimit, async (req, reply) => {
  const { email, password } = (req.body || {}) as { email?: string; password?: string };
  const traceId = getTraceId(req);

  if (!email || !password) {
    return reply.code(400).send(buildError('VALIDATION', 'email and password are required', traceId));
  }

  const user = await findUserByEmail(email);
  if (!user || !verifyPassword(user, password)) {
    return reply.code(401).send(buildError('AUTH_FAILED', 'Invalid email or password', traceId));
  }

  const now = Math.floor(Date.now() / 1000);
  const token = signJwt({
    sub: user.id,
    org_id: user.orgId,
    role: user.role || 'var',
    scopes: ['battery:read', 'payments:write', 'tools:invoke', 'events:write', 'notifications:write', 'messages:write'],
    iat: now,
    exp: now + TOKEN_EXPIRY_SECONDS,
  }, JWT_SECRET);

  audit('auth.token', { userId: user.id, email: user.email, role: user.role }, req);
  return { token, userId: user.id, orgId: user.orgId, name: user.name, role: user.role || 'var', expiresIn: TOKEN_EXPIRY_SECONDS };
});

/* ── Forgot Password Endpoints (public — no token required) ── */

app.post('/auth/forgot-password', authRateLimit, async (req, reply) => {
  const { email } = (req.body || {}) as { email?: string };
  const traceId = getTraceId(req);

  if (!email) {
    return reply.code(400).send(buildError('VALIDATION', 'email is required', traceId));
  }

  // Always return success to prevent user enumeration
  const successResponse = { success: true, message: 'If an account exists with that email, a reset link has been sent' };

  const user = await findUserByEmail(email);
  if (!user) {
    audit('auth.forgot_password.no_user', { email }, req);
    return successResponse;
  }

  const resetToken = randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes

  await setResetToken(email, resetToken, expiresAt);
  await sendPasswordResetEmail(email, resetToken);

  audit('auth.forgot_password', { email, tokenExpiry: expiresAt }, req);
  return successResponse;
});

app.get('/auth/validate-reset-token/:token', async (req, reply) => {
  const { token } = req.params as { token: string };
  const traceId = getTraceId(req);

  if (!token) {
    return reply.code(400).send(buildError('VALIDATION', 'token is required', traceId));
  }

  const user = await findUserByResetToken(token);
  if (!user || !user.resetTokenExpiresAt) {
    return { valid: false };
  }

  const isExpired = new Date(user.resetTokenExpiresAt) < new Date();
  if (isExpired) {
    await clearResetToken(user.email);
    return { valid: false };
  }

  // Mask email: j***@example.com
  const [local, domain] = user.email.split('@');
  const maskedEmail = `${local[0]}***@${domain}`;

  return { valid: true, email: maskedEmail };
});

app.post('/auth/reset-password', async (req, reply) => {
  const { token, password } = (req.body || {}) as { token?: string; password?: string };
  const traceId = getTraceId(req);

  if (!token || !password) {
    return reply.code(400).send(buildError('VALIDATION', 'token and password are required', traceId));
  }
  if (password.length < 8) {
    return reply.code(400).send(buildError('VALIDATION', 'Password must be at least 8 characters', traceId));
  }

  const user = await findUserByResetToken(token);
  if (!user || !user.resetTokenExpiresAt) {
    return reply.code(400).send(buildError('INVALID_TOKEN', 'Invalid or expired reset token', traceId));
  }

  const isExpired = new Date(user.resetTokenExpiresAt) < new Date();
  if (isExpired) {
    await clearResetToken(user.email);
    return reply.code(400).send(buildError('TOKEN_EXPIRED', 'Reset token has expired — please request a new one', traceId));
  }

  await updatePassword(user.email, password);
  await clearResetToken(user.email);

  audit('auth.password_reset', { userId: user.id, email: user.email }, req);
  return { success: true, message: 'Password reset successfully' };
});

/* ── Admin Endpoints (protected by DEV_TOKEN_SECRET) ── */

const DEV_TOKEN_SECRET = process.env.DEV_TOKEN_SECRET || '';

app.get('/admin/users', async (req, reply) => {
  const secret = req.headers['x-admin-secret'] || (req.query as any)?.secret;
  if (!DEV_TOKEN_SECRET || secret !== DEV_TOKEN_SECRET) {
    return reply.code(403).send(buildError('FORBIDDEN', 'Invalid admin secret', getTraceId(req)));
  }
  const list = await listUsers();
  return { users: list, total: list.length };
});

// Restore persisted users from NDJSON before listening
restoreUsers().then((n) => { if (n > 0) app.log.info(`Restored ${n} users from NDJSON`); }).catch(() => {});

app.listen({ port: Number(process.env.PORT || 4000), host: '0.0.0.0' });
