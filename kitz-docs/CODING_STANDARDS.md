# KITZ Coding Standards

All services in the KITZ monorepo must follow these patterns.

## 1. Shared Types

Import all shared types from `kitz-schemas`. Never inline type definitions that exist in contracts.

```typescript
import { type StandardError, type EventEnvelope, createTraceId } from 'kitz-schemas';
```

## 2. Logging

Use `app.log` (Fastify logger) for all service logs. Never use `console.log` in production code.

```typescript
// Good
app.log.info({ traceId, tool: toolName }, 'Tool executed');

// Bad
console.log(`Tool ${toolName} executed`);
```

For subsystem logging outside of Fastify request context, use `createSubsystemLogger` from kitz-schemas:

```typescript
import { createSubsystemLogger } from 'kitz-schemas';
const log = createSubsystemLogger('my-module');
log.info('Started', { detail: 'value' });
```

## 3. Trace IDs

All responses must include `traceId`. Extract from `x-trace-id` header or generate a new one.

```typescript
import { createTraceId } from 'kitz-schemas';

function getTraceId(req: FastifyRequest): string {
  return String(req.headers['x-trace-id'] || createTraceId());
}
```

## 4. Error Responses

Use `StandardError` from kitz-schemas for all error responses.

```typescript
import { type StandardError } from 'kitz-schemas';

// Helper
const buildError = (code: string, message: string, traceId: string): StandardError =>
  ({ code, message, traceId });

// Usage
reply.code(401).send(buildError('AUTH_REQUIRED', 'Bearer token required', traceId));
reply.code(400).send(buildError('VALIDATION', 'email is required', traceId));
reply.code(404).send(buildError('NOT_FOUND', 'Order not found', traceId));
```

## 5. Service Auth

All services must validate `x-service-secret` header for inter-service calls. Public endpoints (health, webhooks) are excluded.

```typescript
app.addHook('onRequest', async (req, reply) => {
  const path = req.url.split('?')[0];
  const isPublic = path === '/health' || path.startsWith('/webhook/');
  if (isPublic) return;

  const secret = req.headers['x-service-secret'] || req.headers['authorization'];
  if (!secret || secret !== `Bearer ${SERVICE_SECRET}`) {
    return reply.code(401).send(buildError('AUTH_REQUIRED', 'Service secret required', getTraceId(req)));
  }
});
```

## 6. Draft-First

All outbound messages (WhatsApp, email, SMS, voice) default to draft mode. `draftOnly: true` is the default. Nothing sends without explicit user approval.

```typescript
const notification: NotificationJob = {
  channel: 'whatsapp',
  to: phoneNumber,
  body: message,
  draftOnly: true, // ALWAYS default to true
  // ...
};
```

## 7. Health Checks

Health endpoints must verify downstream connectivity, not just return `{ status: 'ok' }`.

```typescript
app.get('/health', async () => {
  const checks: Record<string, string> = { service: 'ok' };
  try {
    await verifyDatabase();
    checks.database = 'ok';
  } catch { checks.database = 'unreachable'; }
  const allOk = Object.values(checks).every(v => v === 'ok');
  return { status: allOk ? 'ok' : 'degraded', checks };
});
```

## 8. Shared LLM Module

Tool modules in `kitz_os/src/tools/` must use the shared LLM client instead of inlining fetch logic. This eliminates duplication and ensures consistent Claude-first + OpenAI-fallback behavior.

```typescript
import { callLLM } from './shared/callLLM.js';

const SYSTEM_PROMPT = 'You are a business advisor specializing in...';

execute: async (args, traceId) => {
  const raw = await callLLM(SYSTEM_PROMPT, JSON.stringify(args));
  return JSON.parse(raw);
}
```

Override defaults per-tool when needed:

```typescript
await callLLM(SYS, input, { model: 'claude-sonnet-4-20250514', maxTokens: 4096, timeoutMs: 30_000 });
```

Defaults: Claude Haiku, 1024 tokens, 0.2 temperature, 15s timeout.

## 9. Input Validation

Validate required fields on all POST endpoints. Return 400 with a clear message.

```typescript
app.post('/api/resource', async (req, reply) => {
  const { name, amount } = req.body as Record<string, unknown>;
  if (!name) return reply.code(400).send({ error: 'name is required', traceId });
  if (!amount && amount !== 0) return reply.code(400).send({ error: 'amount is required', traceId });
  // ... proceed
});
```

## 10. API Response Format

Success responses should include `traceId`. Use `ok: true` for write operations, return data directly for reads.

```typescript
// Write (POST/PUT/DELETE)
return { ok: true, id: record.id, traceId };

// Read (GET)
return { leads, total, traceId };

// Error (all methods) — use StandardError
return reply.code(400).send(buildError('VALIDATION', 'email required', traceId));
```

## 11. Additional Conventions

- **TypeScript strict mode** everywhere (`"strict": true` in tsconfig.json)
- **ESM modules** (`"type": "module"` in package.json)
- **Snake_case** for database columns, **camelCase** for TypeScript properties
- **Mapper functions** to convert between DB and API shapes
- **AI Battery** check before every LLM call (`hasBudget()`)
- **Kill switch** respected at boot (`KILL_SWITCH=true` halts all AI execution)
- **Supabase persistence**: When adding DB writes, always fall back to in-memory if Supabase is unavailable
- **Auth hook public paths**: Document which paths skip auth in a comment above the hook
