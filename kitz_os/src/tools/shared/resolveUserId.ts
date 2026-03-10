/**
 * Shared userId resolver for Baileys WhatsApp sessions.
 *
 * Used by outboundTools, broadcastTools, and any tool that routes
 * messages through the WhatsApp connector.
 *
 * Resolution priority:
 *   1. Explicit _userId from args (set by semantic router from session context)
 *   2. GOD_MODE_USER_ID from env (admin fallback)
 *   3. Query connector /whatsapp/sessions for the first connected session (60s cache)
 *   4. 'default' as last resort (will likely fail but surfaces the error)
 */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('resolveUserId');

const WA_CONNECTOR_URL = process.env.WA_CONNECTOR_URL || 'http://localhost:3006';
const SERVICE_SECRET = process.env.SERVICE_SECRET || process.env.DEV_TOKEN_SECRET || '';
const serviceHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
  ...(SERVICE_SECRET ? { 'x-service-secret': SERVICE_SECRET, 'x-dev-secret': SERVICE_SECRET } : {}),
};

let _cachedActiveUserId: string | null = null;
let _cachedActiveUserIdTs = 0;

export async function resolveUserId(argsUserId?: string): Promise<string> {
  // 1. Explicit userId from semantic router
  if (argsUserId && argsUserId !== 'default') return argsUserId;

  // 2. GOD_MODE_USER_ID — admin's session
  const godMode = process.env.GOD_MODE_USER_ID;
  if (godMode) return godMode;

  // 3. Cache active session lookup (TTL: 60s to avoid hammering connector)
  const now = Date.now();
  if (_cachedActiveUserId && now - _cachedActiveUserIdTs < 60_000) {
    return _cachedActiveUserId;
  }

  try {
    const res = await fetch(`${WA_CONNECTOR_URL}/whatsapp/sessions`, {
      method: 'GET',
      headers: serviceHeaders,
      signal: AbortSignal.timeout(5_000),
    });
    if (res.ok) {
      const data = await res.json() as { sessions?: Array<{ userId: string; isConnected: boolean }> };
      const connected = data.sessions?.find(s => s.isConnected);
      if (connected) {
        _cachedActiveUserId = connected.userId;
        _cachedActiveUserIdTs = now;
        log.info('resolved active userId from connector', { userId: connected.userId });
        return connected.userId;
      }
    }
  } catch {
    log.warn('failed to query connector sessions for userId resolution');
  }

  // 4. Fallback — will surface "no socket" error downstream
  return 'default';
}
