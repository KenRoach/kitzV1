/**
 * Session Manager — Multi-user Baileys WhatsApp sessions.
 *
 * Each user who scans the QR code gets their own:
 *   - Baileys WASocket
 *   - Auth directory (persisted across restarts)
 *   - Connection state + QR stream
 *
 * OpenClaw-hardened: credential backup, error 515, exponential backoff,
 * watchdog, heartbeat, dedup, read receipts, reply context, access control.
 */

import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
  downloadMediaMessage,
  type WASocket,
  type WAMessage,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rm, mkdir } from 'node:fs/promises';
import P from 'pino';
import { backupCredsBeforeSave, maybeRestoreCredsFromBackup, getCredsAgeMs } from './creds-backup.js';
import { computeBackoff, DEFAULT_RECONNECT_POLICY } from './backoff.js';
import { isDuplicateMessage, buildDedupeKey } from './dedupe.js';
import { extractReplyContext, extractLocationData, formatLocationText } from './extract.js';
import { checkAccess, type AccessMode } from './access-control.js';
import { getAutoReplyConfig, renderMessage } from './autoReplyConfig.js';
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('whatsapp-sessions');

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Rich response from KITZ OS ──
interface KitzOsResponse {
  response: string;
  command?: string;
  tools_used?: string[];
  credits_consumed?: number;
  voice_note?: { audio_base64: string; mime_type: string; text: string };
  media?: Array<{ type: string; base64: string; mime_type: string; filename: string }>;
  artifact_preview?: { url: string; title: string; category: string };
  draft_id?: string;
  image_url?: string;
}

// ── Config ──
const KITZ_OS_URL = process.env.KITZ_OS_URL || 'http://localhost:3012';
const SERVICE_SECRET = process.env.SERVICE_SECRET || process.env.DEV_TOKEN_SECRET || '';
const AUTH_ROOT = join(__dirname, '..', 'auth_info_baileys');
const MAX_MEDIA_SIZE = 15_000_000;  // ~10MB raw (base64 is ~33% larger than raw)
const WATCHDOG_INTERVAL_MS = 30 * 60 * 1000;  // 30 minutes
const HEARTBEAT_INTERVAL_MS = 60 * 1000;       // 60 seconds
const BACKOFF_RESET_MS = 60 * 1000;            // Reset attempts after 60s of healthy connection
const ACCESS_MODE: AccessMode = 'open';         // Default: allow all senders

const baileysLogger = P({ level: 'warn' });

// ── Cached Baileys version — avoids 400-500ms fetch on every connect ──
let cachedVersion: [number, number, number] | null = null;
let cachedVersionAt = 0;
const VERSION_CACHE_TTL_MS = 30 * 60 * 1000; // refresh every 30 min

async function getBaileysVersion(): Promise<[number, number, number]> {
  const now = Date.now();
  if (cachedVersion && now - cachedVersionAt < VERSION_CACHE_TTL_MS) {
    return cachedVersion;
  }
  try {
    // 5-second timeout — prevents QR page hanging if version endpoint is slow/unreachable
    const { version } = await Promise.race([
      fetchLatestBaileysVersion(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Version fetch timeout')), 5000),
      ),
    ]);
    cachedVersion = version;
    cachedVersionAt = now;
    return version;
  } catch {
    // If fetch fails/times out and we have a cached version, use it
    if (cachedVersion) return cachedVersion;
    // Fallback: hardcoded known-good version
    return [2, 3000, 0];
  }
}

// Prefetch version on module load so first QR connect is instant
getBaileysVersion().catch(() => { /* non-blocking warm-up */ });

// ── Track Kitz-sent message IDs to prevent echo loops in self-chat ──
const kitzSentIds = new Set<string>();
const KITZ_SENT_TTL_MS = 30_000; // Forget after 30s
function trackKitzSent(msgId: string): void {
  kitzSentIds.add(msgId);
  setTimeout(() => kitzSentIds.delete(msgId), KITZ_SENT_TTL_MS);
}

// ── Queued credential saves (OpenClaw pattern — prevents concurrent writes during handshake) ──
let credsSaveQueue: Promise<void> = Promise.resolve();
function enqueueSaveCreds(authDir: string, saveCreds: () => Promise<void> | void): void {
  credsSaveQueue = credsSaveQueue
    .then(() => {
      backupCredsBeforeSave(authDir);
      return Promise.resolve(saveCreds());
    })
    .catch((err) => log.error('creds save error', { err }));
}

// ── Response rules sent to KITZ OS ──
const RESPONSE_RULES = {
  default_words: '5-7',
  max_words: '15-23',
  complex_max_words: 30,
  tone: 'cool, chill, never rude',
  overflow: 'email',
};

// ── Typing delay: brief pause so reply doesn't feel robotic ──
function typingDelayMs(response: string): number {
  const wordCount = response.split(/\s+/).length;
  if (wordCount <= 7) return 800 + Math.random() * 700;    // 0.8–1.5s
  if (wordCount <= 25) return 1200 + Math.random() * 800;  // 1.2–2.0s
  return 1500 + Math.random() * 1000;                      // 1.5–2.5s
}
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── Kitz response prefix — purple dot + KITZ branding ──
const KITZ_PREFIX = '🟣 *KITZ*\n─────────\n';
function kitzReply(text: string): string {
  return `${KITZ_PREFIX}${text}`;
}

// ── In-Memory Message Store ──
// Stores recent inbound and outbound messages for conversation review.
// Max 500 messages per user, FIFO eviction. Not persisted across restarts.
export interface StoredMessage {
  id: string;
  userId: string;
  jid: string;           // sender or recipient JID
  phone: string;         // cleaned phone number
  direction: 'inbound' | 'outbound';
  content: string;
  mediaType?: string;    // 'image', 'document', 'audio', 'sticker', 'video'
  timestamp: number;
  traceId?: string;
}

const messageStore = new Map<string, StoredMessage[]>();
const MAX_MESSAGES_PER_USER = 500;

function storeMessage(msg: Omit<StoredMessage, 'id' | 'timestamp'>): void {
  const full: StoredMessage = {
    ...msg,
    id: Math.random().toString(36).slice(2, 10),
    timestamp: Date.now(),
  };
  const messages = messageStore.get(msg.userId) || [];
  messages.push(full);
  // FIFO eviction
  if (messages.length > MAX_MESSAGES_PER_USER) {
    messages.splice(0, messages.length - MAX_MESSAGES_PER_USER);
  }
  messageStore.set(msg.userId, messages);
}

/** Get recent messages for a user, optionally filtered by phone number */
export function getMessages(
  userId: string,
  phone?: string,
  limit = 50,
): StoredMessage[] {
  const messages = messageStore.get(userId) || [];
  const filtered = phone
    ? messages.filter(m => m.phone === phone.replace(/\D/g, ''))
    : messages;
  return filtered.slice(-limit);
}

/** Get unique conversations (contacts) for a user with last message */
export function getConversations(userId: string): Array<{ phone: string; jid: string; lastMessage: string; lastTimestamp: number; direction: 'inbound' | 'outbound'; messageCount: number }> {
  const messages = messageStore.get(userId) || [];
  const byPhone = new Map<string, { jid: string; lastMsg: StoredMessage; count: number }>();
  for (const msg of messages) {
    const existing = byPhone.get(msg.phone);
    if (!existing || msg.timestamp > existing.lastMsg.timestamp) {
      byPhone.set(msg.phone, { jid: msg.jid, lastMsg: msg, count: (existing?.count || 0) + 1 });
    } else {
      existing.count++;
    }
  }
  return Array.from(byPhone.entries())
    .map(([phone, { jid, lastMsg, count }]) => ({
      phone,
      jid,
      lastMessage: lastMsg.content.slice(0, 200),
      lastTimestamp: lastMsg.timestamp,
      direction: lastMsg.direction,
      messageCount: count,
    }))
    .sort((a, b) => b.lastTimestamp - a.lastTimestamp);
}

// ── Types ──
export type SessionListener = (event: string, data: string) => void;

export interface StartSessionOpts {
  /** Pre-wire an event listener BEFORE Baileys connects (prevents race condition) */
  onEvent?: SessionListener;
}

export interface UserSession {
  userId: string;
  socket: WASocket | null;
  authDir: string;
  isConnected: boolean;
  lastQr: string | null;
  lastEmittedQr: string | null;
  phoneNumber: string | null;
  reconnectAttempts: number;
  connectedAtMs: number;
  lastMessageAtMs: number;
  restartAttempted: boolean;  // Error 515 — only retry once
  watchdogTimer: ReturnType<typeof setInterval> | null;
  heartbeatTimer: ReturnType<typeof setInterval> | null;
  backoffResetTimer: ReturnType<typeof setTimeout> | null;
  /** Listeners waiting for QR/connection updates (SSE clients) */
  listeners: Set<SessionListener>;
}

// ── Forward message to KITZ OS ──
async function forwardToKitzOs(
  message: string,
  senderJid: string,
  userId: string,
  traceId: string,
  extra?: { replyContext?: { id: string; body: string | null; sender: string | null }; location?: string; source?: string },
): Promise<KitzOsResponse> {
  try {
    const res = await fetch(`${KITZ_OS_URL}/api/kitz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(SERVICE_SECRET ? { 'x-service-secret': SERVICE_SECRET, 'x-dev-secret': SERVICE_SECRET } : {}) },
      body: JSON.stringify({
        message,
        sender: senderJid,
        user_id: userId,
        trace_id: traceId,
        response_rules: RESPONSE_RULES,
        reply_context: extra?.replyContext,
        location: extra?.location,
        source: extra?.source,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      log.error('KITZ OS returned error status', { userId, status: res.status });
      return { response: 'KITZ OS is temporarily unavailable. Try again in a moment.' };
    }

    const data = await res.json() as KitzOsResponse;
    return { ...data, response: data.response || (data as any).error || 'Done.' };
  } catch (err) {
    log.error('forward failed', { userId, err });
    return { response: 'Could not reach KITZ OS. Is it running?' };
  }
}

// ── Forward media to KITZ OS ──
async function forwardMediaToKitzOs(
  mediaBase64: string,
  mimeType: string,
  caption: string | undefined,
  senderJid: string,
  userId: string,
  traceId: string,
): Promise<KitzOsResponse> {
  try {
    const res = await fetch(`${KITZ_OS_URL}/api/kitz/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(SERVICE_SECRET ? { 'x-service-secret': SERVICE_SECRET, 'x-dev-secret': SERVICE_SECRET } : {}) },
      body: JSON.stringify({
        media_base64: mediaBase64,
        mime_type: mimeType,
        caption,
        sender_jid: senderJid,
        user_id: userId,
        trace_id: traceId,
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!res.ok) return { response: 'Could not process that file right now.' };

    const data = await res.json() as KitzOsResponse;
    return { ...data, response: data.response || (data as any).error || 'Media processed.' };
  } catch (err) {
    log.error('media forward failed', { userId, err });
    return { response: 'Could not process media. Is KITZ OS running?' };
  }
}

// ── Auto-reply tracking — one reply per sender per session to avoid spam ──
const AUTO_REPLY_COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours between auto-replies per sender

// ── Session Manager ──
class SessionManager {
  private sessions = new Map<string, UserSession>();
  private phoneToUserId = new Map<string, string>(); // Reverse lookup: phone → userId (prevents multi-session collisions)
  private groupMetaCache = new Map<string, { subject?: string; participants?: string[]; expires: number }>();
  private autoReplySent = new Map<string, number>(); // key: `${userId}:${senderJid}` → timestamp
  private static GROUP_META_TTL_MS = 5 * 60 * 1000; // 5 minutes
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Periodic cleanup every 30 minutes to prevent memory leaks
    this.cleanupTimer = setInterval(() => this.cleanupStaleMaps(), 30 * 60 * 1000);
  }

  private cleanupStaleMaps(): void {
    const now = Date.now();
    // Clean expired auto-reply entries
    for (const [key, ts] of this.autoReplySent) {
      if (now - ts > AUTO_REPLY_COOLDOWN_MS) this.autoReplySent.delete(key);
    }
    // Clean expired group meta cache entries
    for (const [key, entry] of this.groupMetaCache) {
      if (now > entry.expires) this.groupMetaCache.delete(key);
    }
  }

  /** Start (or restart) a Baileys session for a user */
  async startSession(userId: string, opts?: StartSessionOpts): Promise<UserSession> {
    // If session already exists and is connected, return it
    const existing = this.sessions.get(userId);
    if (existing?.isConnected) {
      // Still wire the listener so caller gets events
      if (opts?.onEvent) existing.listeners.add(opts.onEvent);
      return existing;
    }

    // If session exists but disconnected, clean up socket
    if (existing?.socket) {
      try { existing.socket.ws?.close(); } catch {}
      existing.socket = null;
    }

    const authDir = join(AUTH_ROOT, userId);
    await mkdir(authDir, { recursive: true });

    const session: UserSession = existing || {
      userId,
      socket: null,
      authDir,
      isConnected: false,
      lastQr: null,
      lastEmittedQr: null,
      phoneNumber: null,
      reconnectAttempts: 0,
      connectedAtMs: 0,
      lastMessageAtMs: 0,
      restartAttempted: false,
      watchdogTimer: null,
      heartbeatTimer: null,
      backoffResetTimer: null,
      listeners: new Set(),
    };

    if (!existing) this.sessions.set(userId, session);

    // CRITICAL: Wire listener BEFORE connecting so no events are missed
    if (opts?.onEvent) session.listeners.add(opts.onEvent);

    await this.connectBaileys(session);
    return session;
  }

  /** Internal: wire up a Baileys socket for a session */
  private async connectBaileys(session: UserSession): Promise<void> {
    const { userId, authDir } = session;

    // Restore from backup if creds corrupted
    maybeRestoreCredsFromBackup(authDir);

    const [{ state, saveCreds }, version] = await Promise.all([
      useMultiFileAuthState(authDir),
      getBaileysVersion(),
    ]);

    // Minimal config matching OpenClaw's proven pattern — no aggressive timeouts
    const sock = makeWASocket({
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, baileysLogger as any),
      },
      version,
      logger: baileysLogger as any,
      printQRInTerminal: false,
      browser: ['KITZ', 'Chrome', '4.0.0'],
      syncFullHistory: false,
      markOnlineOnConnect: false,
    });

    session.socket = sock;
    session.lastEmittedQr = null;
    session.restartAttempted = false;

    // ── Event registration order matters — match OpenClaw ──

    // 1. Credential saves (queued with backup before save)
    sock.ev.on('creds.update', () => enqueueSaveCreds(authDir, saveCreds));

    // 2. Connection updates — SYNC handler (no async — critical for Baileys state machine)
    sock.ev.on('connection.update', (update) => {
      try {
        const { connection, lastDisconnect, qr } = update;

        // ── QR code received ──
        if (qr) {
          if (qr !== session.lastEmittedQr) {
            session.lastQr = qr;
            session.lastEmittedQr = qr;
            this.emit(session, 'qr', qr);
            log.info('QR code generated — waiting for scan', { userId });
          }
        }

        // ── Connection opened ──
        if (connection === 'open') {
          session.isConnected = true;
          session.lastQr = null;
          session.lastEmittedQr = null;
          session.reconnectAttempts = 0;
          session.connectedAtMs = Date.now();
          session.lastMessageAtMs = Date.now();
          session.restartAttempted = false;

          const me = sock.user;
          if (me?.id) {
            session.phoneNumber = me.id.split(':')[0].split('@')[0];
          }

          // ── Phone collision detection: kill old session if same phone reconnects under new userId ──
          if (session.phoneNumber) {
            const existingUserId = this.phoneToUserId.get(session.phoneNumber);
            if (existingUserId && existingUserId !== userId) {
              log.info('phone collision — killing old session', { userId, phone: session.phoneNumber, existingUserId });
              this.stopSession(existingUserId);
            }
            this.phoneToUserId.set(session.phoneNumber, userId);
          }

          log.info('CONNECTED', { userId, phone: session.phoneNumber });
          this.emit(session, 'connected', JSON.stringify({ phone: session.phoneNumber }));

          // Start watchdog + heartbeat
          this.startWatchdog(session);
          this.startHeartbeat(session);

          // Backoff reset: if connected for 60s, reset reconnect counter
          session.backoffResetTimer = setTimeout(() => {
            if (session.isConnected) {
              session.reconnectAttempts = 0;
            }
          }, BACKOFF_RESET_MS);

          // Send confirmation message to the connected user
          // Baileys v7: sock.user.id = "50769524232:XX@s.whatsapp.net"
          // To message yourself, need just "50769524232@s.whatsapp.net"
          const myNumber = me?.id?.split(':')[0]?.split('@')[0];
          const selfJid = myNumber ? `${myNumber}@s.whatsapp.net` : null;
          if (selfJid) {
            setTimeout(async () => {
              try {
                const sent = await sock.sendMessage(selfJid, {
                  text: 'Kitz connected. You\'re live. 🟢',
                });
                if (sent?.key?.id) trackKitzSent(sent.key.id);
                log.info('confirmation sent', { userId, selfJid });
              } catch (err) {
                log.error('failed to send confirmation', { userId, err });
              }
            }, 3000);
          }
        }

        // ── Connection closed ──
        if (connection === 'close') {
          session.isConnected = false;
          session.lastQr = null;
          session.lastEmittedQr = null;
          this.clearTimers(session);

          const error = (lastDisconnect?.error as Boom)?.output;
          const statusCode = error?.statusCode;

          const isLoggedOut = statusCode === DisconnectReason.loggedOut;
          const is515Restart = statusCode === 515;
          const wasConnected = !!session.phoneNumber;
          // 408/428 is QR timeout ONLY if the session was never connected
          // If we were already connected, treat 408 as a transient disconnect → reconnect
          const isQrTimeout = (statusCode === 428 || statusCode === 408) && !wasConnected;
          // Self-healing: always reconnect if we were previously connected (except logout)
          const shouldReconnect = wasConnected && !isLoggedOut && !isQrTimeout && !is515Restart;

          log.info('connection closed', { userId, statusCode, shouldReconnect, wasConnected, is515Restart });

          this.emit(session, 'disconnected', JSON.stringify({ statusCode }));

          // Close dead socket
          try { sock.ws?.close(); } catch {}
          session.socket = null;

          // Error 515: WhatsApp asked for restart after pairing — retry once
          if (is515Restart && !session.restartAttempted) {
            session.restartAttempted = true;
            log.info('error 515 — restarting socket once (WhatsApp pairing restart)', { userId });
            setTimeout(() => this.connectBaileys(session), 1000);
            return;
          }

          // Fire-and-forget cleanup (not in the sync handler's critical path)
          this.handleDisconnectCleanup(session, userId, {
            isQrTimeout,
            isLoggedOut,
            shouldReconnect,
            statusCode,
          });
        }
      } catch (err) {
        log.error('connection.update handler error', { userId, err });
      }
    });

    // 3. Handle incoming messages — with read receipts for append (history) type
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      for (const msg of messages) {
        const remoteJid = msg.key?.remoteJid;
        const msgId = msg.key?.id;

        // Read receipts for ALL message types (including history catchup)
        if (remoteJid && msgId && !msg.key.fromMe) {
          try {
            await sock.readMessages([{ remoteJid, id: msgId, fromMe: false }]);
          } catch {}
        }

        // Only process live messages (not history/offline catchup)
        if (type !== 'notify') continue;

        try {
          await this.handleMessage(session, msg);
        } catch (err) {
          log.error('message handler error', { userId, err });
        }
      }
    });

    // 4. WebSocket error handler — LAST (after all event handlers, matching OpenClaw)
    if (sock.ws && typeof (sock.ws as any).on === 'function') {
      (sock.ws as any).on('error', (err: Error) => {
        log.error('WebSocket error', { userId, err });
      });
    }
  }

  // ── Watchdog: detect zombie connections ──
  private startWatchdog(session: UserSession): void {
    if (session.watchdogTimer) clearInterval(session.watchdogTimer);
    session.watchdogTimer = setInterval(() => {
      if (!session.isConnected) return;
      const silenceMs = Date.now() - session.lastMessageAtMs;
      if (silenceMs > WATCHDOG_INTERVAL_MS) {
        log.info('watchdog: no messages — force reconnecting', { userId: session.userId, silenceMin: Math.round(silenceMs / 60000) });
        this.forceReconnect(session);
      }
    }, 60_000); // Check every minute
    session.watchdogTimer.unref();
  }

  // ── Heartbeat: periodic health logging ──
  private startHeartbeat(session: UserSession): void {
    if (session.heartbeatTimer) clearInterval(session.heartbeatTimer);
    session.heartbeatTimer = setInterval(() => {
      if (!session.isConnected) return;
      const uptimeMs = Date.now() - session.connectedAtMs;
      const authAge = getCredsAgeMs(session.authDir);
      log.info('heartbeat', {
        userId: session.userId,
        phone: session.phoneNumber,
        connected: true,
        uptimeMin: Math.round(uptimeMs / 60000),
        reconnectAttempts: session.reconnectAttempts,
        authAgeMin: authAge ? Math.round(authAge / 60000) : null,
      });
    }, HEARTBEAT_INTERVAL_MS);
    session.heartbeatTimer.unref();
  }

  // ── Clear all timers for a session ──
  private clearTimers(session: UserSession): void {
    if (session.watchdogTimer) { clearInterval(session.watchdogTimer); session.watchdogTimer = null; }
    if (session.heartbeatTimer) { clearInterval(session.heartbeatTimer); session.heartbeatTimer = null; }
    if (session.backoffResetTimer) { clearTimeout(session.backoffResetTimer); session.backoffResetTimer = null; }
  }

  // ── Force reconnect (used by watchdog) ──
  private forceReconnect(session: UserSession): void {
    if (session.socket) {
      try { session.socket.ws?.close(); } catch {}
      session.socket = null;
    }
    session.isConnected = false;
    this.clearTimers(session);
    session.reconnectAttempts++;
    if (session.reconnectAttempts <= DEFAULT_RECONNECT_POLICY.maxAttempts) {
      const delay = computeBackoff(session.reconnectAttempts - 1);
      log.info('watchdog reconnect scheduled', { userId: session.userId, delaySec: Math.round(delay / 1000), attempt: session.reconnectAttempts, maxAttempts: DEFAULT_RECONNECT_POLICY.maxAttempts });
      setTimeout(() => this.connectBaileys(session), delay);
    } else {
      log.info('max reconnect attempts after watchdog — removing session', { userId: session.userId });
      session.listeners.clear();
      this.sessions.delete(session.userId);
    }
  }

  /** Fire-and-forget disconnect cleanup (called outside sync handler) */
  private handleDisconnectCleanup(
    session: UserSession,
    userId: string,
    flags: { isQrTimeout: boolean; isLoggedOut: boolean; shouldReconnect: boolean; statusCode?: number },
  ): void {
    const { isQrTimeout, isLoggedOut, shouldReconnect, statusCode } = flags;

    if (isQrTimeout) {
      log.info('QR timeout — cleaning up', { userId, statusCode });
      const dir = join(AUTH_ROOT, userId);
      rm(dir, { recursive: true, force: true }).catch(() => {});
      session.listeners.clear();
      this.sessions.delete(userId);
    } else if (shouldReconnect && session.reconnectAttempts < DEFAULT_RECONNECT_POLICY.maxAttempts) {
      session.reconnectAttempts++;
      const delay = computeBackoff(session.reconnectAttempts - 1);
      log.info('reconnecting', { userId, delaySec: Math.round(delay / 1000), attempt: session.reconnectAttempts, maxAttempts: DEFAULT_RECONNECT_POLICY.maxAttempts });
      setTimeout(() => this.connectBaileys(session), delay);
    } else if (isLoggedOut) {
      log.info('logged out — cleaning up session', { userId });
      this.emit(session, 'logged_out', '');
      if (session.phoneNumber) this.phoneToUserId.delete(session.phoneNumber);
      const dir = join(AUTH_ROOT, userId);
      rm(dir, { recursive: true, force: true }).catch(() => {});
      session.listeners.clear();
      this.sessions.delete(userId);
    } else if (flags.statusCode === 401) {
      // 401 device_removed — WhatsApp permanently revoked this session.
      // Do NOT self-heal — user must re-scan QR.
      log.info('401 device_removed — session revoked, cleaning up', { userId });
      this.emit(session, 'logged_out', '');
      if (session.phoneNumber) this.phoneToUserId.delete(session.phoneNumber);
      const dir = join(AUTH_ROOT, userId);
      rm(dir, { recursive: true, force: true }).catch(() => {});
      session.listeners.clear();
      this.sessions.delete(userId);
    } else if (flags.statusCode && session.phoneNumber) {
      // Self-healing: for transient errors (not 401), wait and retry
      session.reconnectAttempts = 0;
      const healDelay = 60_000; // 1 minute cooldown, then restart backoff cycle
      log.info('max reconnect attempts — self-healing in 60s', { userId });
      setTimeout(() => this.connectBaileys(session), healDelay);
    } else {
      log.info('session removed — no phone number or unknown state', { userId });
      session.listeners.clear();
      this.sessions.delete(userId);
    }
  }

  /** Handle an incoming WhatsApp message for a specific session */
  private async handleMessage(session: UserSession, msg: WAMessage): Promise<void> {
    if (!msg.message) return;
    if (msg.key.remoteJid === 'status@broadcast') return;

    const { userId } = session;
    const myNumber = session.phoneNumber;
    const senderJid = msg.key.remoteJid || '';
    const senderNumber = senderJid.split('@')[0];

    // Log EVERY message that arrives (before any filtering)
    log.info('raw message received', { userId, fromMe: msg.key.fromMe, remoteJid: senderJid, myNumber, keys: Object.keys(msg.message || {}) });

    // ── ACCESS MODEL ──
    // 1. Self-chat ("Me" / "Notes to self") → always process
    // 2. Group chats → only process if Kitz is mentioned by name
    // 3. DMs from others → auto-reply + log to CRM
    // 4. DMs you send to others → ignore
    const isSelfChat = myNumber && senderNumber === myNumber;
    const isGroup = senderJid.endsWith('@g.us');

    // Extract message text early (needed for group mention check + CRM capture)
    const earlyInner = msg.message?.ephemeralMessage?.message
      || msg.message?.viewOnceMessage?.message
      || msg.message;
    const earlyText = (
      earlyInner?.conversation
      || earlyInner?.extendedTextMessage?.text
      || earlyInner?.imageMessage?.caption
      || earlyInner?.videoMessage?.caption
      || earlyInner?.documentMessage?.caption
      || ''
    ).toLowerCase();

    // Groups: only respond if the user is @mentioned or "kitz" is named
    if (isGroup) {
      // Check WhatsApp @mentions (contextInfo.mentionedJid contains JIDs of mentioned users)
      const mentionedJids: string[] =
        earlyInner?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      const myJid = myNumber ? `${myNumber}@s.whatsapp.net` : '';
      const isMentioned = myJid && mentionedJids.includes(myJid);
      const kitzMentioned = /\bkitz\b/i.test(earlyText);

      if (!isMentioned && !kitzMentioned) return;
      // User was @mentioned or Kitz was named — fall through to process
      log.info('activated in group', { userId, groupJid: senderJid, isMentioned, kitzMentioned });
    }

    // If it's NOT self-chat and NOT a group (i.e., an inbound DM):
    // Route ALL inbound DMs through the full KITZ AI semantic router.
    // This enables wa.me link testing — anyone who messages gets KITZ responses.
    const isDmFromOther = !isSelfChat && !isGroup && !msg.key.fromMe;
    if (!isSelfChat && !isGroup && msg.key.fromMe) {
      // Outbound DMs we sent to others — ignore (don't echo our own messages)
      return;
    }

    // Skip Kitz's own replies echoing back (prevents infinite loops)
    if (msg.key.id && kitzSentIds.has(msg.key.id)) {
      log.info('skipping Kitz echo', { userId, msgId: msg.key.id });
      return;
    }

    // Unwrap Baileys message wrappers — some messages arrive inside containers
    const innerMessage = msg.message?.ephemeralMessage?.message
      || msg.message?.viewOnceMessage?.message
      || msg.message?.viewOnceMessageV2?.message
      || msg.message?.documentWithCaptionMessage?.message
      || msg.message;

    // Skip protocol-only messages (read receipts, key changes, etc.)
    const msgKeys = Object.keys(innerMessage || {});
    const isProtocolOnly = msgKeys.length <= 2 && msgKeys.every(k => ['protocolMessage', 'messageContextInfo', 'senderKeyDistributionMessage'].includes(k));
    if (isProtocolOnly) return;

    // Replace msg.message with the unwrapped version for all downstream processing
    (msg as any).message = innerMessage;

    const sock = session.socket!;
    const messageId = msg.key.id || '';

    // Update watchdog timestamp
    session.lastMessageAtMs = Date.now();

    // ── Message deduplication ──
    if (messageId && isDuplicateMessage(buildDedupeKey(userId, senderJid, messageId))) {
      return;
    }

    // ── Access control (timestamp gating only — owner already verified above) ──
    const messageTimestampMs = msg.messageTimestamp ? Number(msg.messageTimestamp) * 1000 : undefined;
    const access = checkAccess({
      senderJid,
      mode: ACCESS_MODE,
      messageTimestampMs,
      connectedAtMs: session.connectedAtMs,
      isFromMe: !!msg.key.fromMe,
      isGroup: false,
    });
    if (!access.allowed) {
      if (access.reason === 'pre_connection_message') {
        log.info('skipping pre-connection message', { userId });
      }
      return;
    }

    const traceId = crypto.randomUUID();

    // Reply to: the sender for inbound DMs, self-chat for self messages, group for groups
    const replyJid = isDmFromOther ? senderJid
      : isGroup ? senderJid
      : myNumber ? `${myNumber}@s.whatsapp.net` : senderJid;

    // ── Extract reply context and location ──
    const replyContext = extractReplyContext(msg) ?? undefined;
    const locationData = extractLocationData(msg.message);
    const locationText = locationData ? formatLocationText(locationData) : undefined;

    // Debug: log message keys
    const debugKeys = Object.keys(msg.message || {});
    log.info('msg.message keys', { userId, msgKeys: debugKeys });

    const hasText = !!msg.message?.conversation || !!msg.message?.extendedTextMessage?.text;
    const hasImage = !!msg.message?.imageMessage;
    const hasDocument = !!msg.message?.documentMessage;
    const hasAudio = !!msg.message?.audioMessage;
    const hasLocation = !!locationData;

    log.info('message received', {
      userId,
      sender: senderJid,
      traceId,
      hasText,
      hasImage,
      hasDocument,
      hasAudio,
      hasLocation,
      hasReply: !!replyContext,
      msgKeys: debugKeys,
    });

    // Helper: type then reply (tracks sent ID to prevent echo loops)
    const typeThenReply = async (text: string) => {
      const prefixed = kitzReply(text);
      try { await sock.sendPresenceUpdate('composing', replyJid); } catch {}
      await sleep(typingDelayMs(text));
      try { await sock.sendPresenceUpdate('available', replyJid); } catch {}
      try {
        const sent = await sock.sendMessage(replyJid, { text: prefixed });
        if (sent?.key?.id) trackKitzSent(sent.key.id);
        log.info('reply sent', { userId, to: replyJid, isDm: isDmFromOther });
      } catch (err) {
        log.error('reply failed', { userId, to: replyJid, err });
      }
    };

    // Helper: send all rich response extras (voice note, media, artifact preview, image URL)
    const sendRichExtras = async (kr: KitzOsResponse) => {
      // Voice note
      if (kr.voice_note?.audio_base64) {
        try {
          await this.sendAudio(userId, replyJid, kr.voice_note.audio_base64, kr.voice_note.mime_type || 'audio/ogg; codecs=opus');
        } catch {}
      }
      // Media attachments
      if (kr.media?.length) {
        for (const item of kr.media) {
          try {
            if (item.type === 'document') {
              await this.sendDocument(userId, replyJid, Buffer.from(item.base64, 'base64'), item.mime_type, item.filename);
            } else if (item.type === 'image') {
              await this.sendImage(userId, replyJid, Buffer.from(item.base64, 'base64'), item.mime_type);
            }
          } catch {}
        }
      }
      // Artifact preview link
      if (kr.artifact_preview?.url) {
        const label = kr.artifact_preview.title || 'Preview';
        try {
          await sock.sendMessage(replyJid, { text: `🔗 ${label}: ${kr.artifact_preview.url}` });
        } catch {}
      }
      // Image URL (DALL-E etc.) — download and send as image
      if (kr.image_url) {
        try {
          const imgRes = await fetch(kr.image_url, { signal: AbortSignal.timeout(15_000) });
          if (imgRes.ok) {
            const buf = Buffer.from(await imgRes.arrayBuffer());
            await this.sendImage(userId, replyJid, buf, 'image/png');
          }
        } catch {}
      }
    };

    // ── Location-only messages ──
    if (hasLocation && !hasText && !hasImage && !hasDocument && !hasAudio) {
      const locSenderPhone = senderJid.replace(/@.*/, '');
      storeMessage({ userId, jid: senderJid, phone: locSenderPhone, direction: 'inbound', content: locationText || '[Location]', traceId });
      try { await sock.sendPresenceUpdate('composing', replyJid); } catch {}
      const kitzResponse = await forwardToKitzOs(
        locationText || 'Location shared',
        replyJid, userId, traceId,
        { location: locationText, source: isDmFromOther ? 'dm' : 'self_chat' },
      );
      const response = kitzResponse.response;
      await sleep(typingDelayMs(response));
      try { await sock.sendPresenceUpdate('available', replyJid); } catch {}
      try { await sock.sendMessage(replyJid, { text: kitzReply(response) }); } catch {}
      await sendRichExtras(kitzResponse);
      return;
    }

    // ── Text messages ──
    const text =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      '';

    if (text) {
      const fullText = locationText ? `${text}\n${locationText}` : text;
      // Store inbound message
      const senderPhone = senderJid.replace(/@.*/, '');
      storeMessage({ userId, jid: senderJid, phone: senderPhone, direction: 'inbound', content: fullText, traceId });
      try { await sock.sendPresenceUpdate('composing', replyJid); } catch {}
      log.info('forwarding text to kitz_os', { userId, textPreview: fullText.slice(0, 50) });
      const kitzResponse = await forwardToKitzOs(fullText, replyJid, userId, traceId, {
        replyContext,
        location: locationText,
        source: isDmFromOther ? 'dm' : 'self_chat',
      });
      const response = kitzResponse.response;
      log.info('kitz_os response', { userId, responsePreview: response.slice(0, 80) });
      // Store outbound response
      storeMessage({ userId, jid: replyJid, phone: senderPhone, direction: 'outbound', content: response, traceId });
      await sleep(typingDelayMs(response));
      try { await sock.sendPresenceUpdate('available', replyJid); } catch {}
      try {
        const sent = await sock.sendMessage(replyJid, { text: kitzReply(response) });
        if (sent?.key?.id) trackKitzSent(sent.key.id);
        log.info('reply sent to self-chat', { userId });
      } catch (sendErr) {
        log.error('reply failed', { userId, err: sendErr });
      }
      await sendRichExtras(kitzResponse);
      return;
    }

    // ── Image messages ──
    const imageMsg = msg.message?.imageMessage;
    if (imageMsg) {
      try {
        const imgSenderPhone = senderJid.replace(/@.*/, '');
        storeMessage({ userId, jid: senderJid, phone: imgSenderPhone, direction: 'inbound', content: imageMsg.caption || '[Image]', mediaType: 'image', traceId });
        await sock.sendPresenceUpdate('composing', replyJid);
        const buffer = await downloadMediaMessage(msg, 'buffer', {});
        const base64 = (buffer as Buffer).toString('base64');
        const rawSizeKB = Math.round(buffer.length / 1024);
        log.info('image received', { userId, rawSizeKB, base64SizeKB: Math.round(base64.length / 1024) });
        if (base64.length > MAX_MEDIA_SIZE) {
          await typeThenReply(`Image too large (${rawSizeKB}KB) — max ~10MB supported.`);
          return;
        }
        const caption = imageMsg.caption || '';
        const mimeType = imageMsg.mimetype || 'image/jpeg';
        const kitzResponse = await forwardMediaToKitzOs(base64, mimeType, caption, replyJid, userId, traceId);
        const response = kitzResponse.response;
        await sleep(typingDelayMs(response));
        try { await sock.sendPresenceUpdate('available', replyJid); } catch {}
        const sent = await sock.sendMessage(replyJid, { text: kitzReply(response) });
        if (sent?.key?.id) trackKitzSent(sent.key.id);
        await sendRichExtras(kitzResponse);
      } catch (err) {
        log.error('image download failed', { userId, err });
        await typeThenReply('Could not download that image. Try again.');
      }
      return;
    }

    // ── Document messages ──
    const docMsg = msg.message?.documentMessage;
    if (docMsg) {
      try {
        await sock.sendPresenceUpdate('composing', replyJid);
        const buffer = await downloadMediaMessage(msg, 'buffer', {});
        const base64 = (buffer as Buffer).toString('base64');
        const rawSizeKB = Math.round(buffer.length / 1024);
        log.info('document received', { userId, rawSizeKB, base64SizeKB: Math.round(base64.length / 1024) });
        if (base64.length > MAX_MEDIA_SIZE) {
          await typeThenReply(`Doc too large (${rawSizeKB}KB) — max ~10MB supported.`);
          return;
        }
        const caption = docMsg.caption || docMsg.fileName || '';
        const mimeType = docMsg.mimetype || 'application/pdf';
        const kitzResponse = await forwardMediaToKitzOs(base64, mimeType, caption, replyJid, userId, traceId);
        const response = kitzResponse.response;
        await sleep(typingDelayMs(response));
        try { await sock.sendPresenceUpdate('available', replyJid); } catch {}
        const sent = await sock.sendMessage(replyJid, { text: kitzReply(response) });
        if (sent?.key?.id) trackKitzSent(sent.key.id);
        await sendRichExtras(kitzResponse);
      } catch (err) {
        log.error('document download failed', { userId, err });
        await typeThenReply('Could not download that document.');
      }
      return;
    }

    // ── Audio/voice note messages ──
    const audioMsg = msg.message?.audioMessage;
    if (audioMsg) {
      try {
        const audioSenderPhone = senderJid.replace(/@.*/, '');
        storeMessage({ userId, jid: senderJid, phone: audioSenderPhone, direction: 'inbound', content: '[Voice note]', mediaType: 'audio', traceId });
        await sock.sendPresenceUpdate('composing', replyJid);
        const buffer = await downloadMediaMessage(msg, 'buffer', {});
        const base64 = (buffer as Buffer).toString('base64');
        const rawSizeKB = Math.round(buffer.length / 1024);
        log.info('audio received', { userId, rawSizeKB });
        const mimeType = audioMsg.mimetype || 'audio/ogg; codecs=opus';
        const kitzResponse = await forwardMediaToKitzOs(
          base64, mimeType,
          'Voice note received — transcribe and process as brain dump',
          replyJid, userId, traceId,
        );
        const response = kitzResponse.response;
        await sleep(typingDelayMs(response));
        try { await sock.sendPresenceUpdate('available', replyJid); } catch {}
        const sent = await sock.sendMessage(replyJid, { text: kitzReply(response) });
        if (sent?.key?.id) trackKitzSent(sent.key.id);
        await sendRichExtras(kitzResponse);
      } catch (err) {
        log.error('audio download failed', { userId, err });
        await typeThenReply('Could not process that voice note.');
      }
      return;
    }

    await typeThenReply('I handle text, images, docs, and voice notes.');
  }

  /** Auto-reply to external senders — polite acknowledgment + log missed message to workspace */
  private async autoReplyToExternal(session: UserSession, senderJid: string, messageText?: string): Promise<void> {
    const { userId } = session;
    const sock = session.socket;
    if (!sock || !session.isConnected) return;

    const senderNumber = senderJid.split('@')[0];

    // Always log the missed message to kitz_os for CRM capture (even during cooldown)
    if (messageText) {
      storeMessage({ userId, jid: senderJid, phone: senderNumber, direction: 'inbound', content: messageText });
      this.logMissedMessage(userId, senderNumber, messageText).catch(() => {});
    }

    // Check config — auto-reply may be disabled
    const config = getAutoReplyConfig(userId);
    if (!config.enabled) {
      log.info('auto-reply disabled — message logged', { userId });
      return;
    }

    // Check cooldown — don't spam the same person with auto-replies
    const key = `${userId}:${senderJid}`;
    const lastSent = this.autoReplySent.get(key);
    if (lastSent && Date.now() - lastSent < config.cooldownMs) {
      log.info('skipping auto-reply (cooldown) — message logged', { userId, senderJid });
      return;
    }

    // Send polite auto-reply using configurable message
    try {
      const sent = await sock.sendMessage(senderJid, {
        text: renderMessage(config),
      });
      if (sent?.key?.id) trackKitzSent(sent.key.id);
      this.autoReplySent.set(key, Date.now());
      log.info('auto-reply sent', { userId, senderJid });
    } catch (err) {
      log.error('auto-reply failed', { userId, senderJid, err });
    }
  }

  /** Forward a missed WhatsApp message to kitz_os for CRM capture */
  private async logMissedMessage(userId: string, senderPhone: string, messageText: string): Promise<void> {
    try {
      const traceId = crypto.randomUUID();
      await fetch(`${KITZ_OS_URL}/api/kitz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(SERVICE_SECRET ? { 'x-service-secret': SERVICE_SECRET, 'x-dev-secret': SERVICE_SECRET } : {}) },
        body: JSON.stringify({
          message: `[MISSED WhatsApp from +${senderPhone}]: "${messageText}".\nLog this contact and their message in the CRM. Phone: +${senderPhone}. Tag as "missed-whatsapp".`,
          sender: `${senderPhone}@s.whatsapp.net`,
          user_id: userId,
          trace_id: traceId,
        }),
        signal: AbortSignal.timeout(15_000),
      });
      log.info('missed message logged to workspace', { userId, senderPhone });
    } catch (err) {
      log.error('failed to log missed message', { userId, err });
    }
  }

  /** Emit an SSE event to all listeners for a session */
  private emit(session: UserSession, event: string, data: string): void {
    for (const listener of session.listeners) {
      try { listener(event, data); } catch {}
    }
  }

  /** Add an SSE listener to a session */
  addListener(userId: string, listener: (event: string, data: string) => void): void {
    const session = this.sessions.get(userId);
    if (session) session.listeners.add(listener);
  }

  /** Remove an SSE listener */
  removeListener(userId: string, listener: (event: string, data: string) => void): void {
    const session = this.sessions.get(userId);
    if (session) session.listeners.delete(listener);
  }

  /** Get a session by userId */
  getSession(userId: string): UserSession | undefined {
    return this.sessions.get(userId);
  }

  /** Find the userId for a connected phone number */
  findUserIdByPhone(phone: string): string | undefined {
    return this.phoneToUserId.get(phone);
  }

  /** Get any active (connected or connecting) session — for single-user setups */
  getActiveSession(): UserSession | undefined {
    for (const session of this.sessions.values()) {
      if (session.isConnected || session.lastQr) return session;
    }
    return undefined;
  }

  /** Stop a session (keep auth for re-scan) */
  stopSession(userId: string): boolean {
    const session = this.sessions.get(userId);
    if (!session) return false;

    this.clearTimers(session);
    if (session.socket) {
      try { session.socket.ws?.close(); } catch {}
      session.socket = null;
    }
    session.isConnected = false;
    session.lastQr = null;
    session.lastEmittedQr = null;
    // Clean up phone reverse lookup
    if (session.phoneNumber) this.phoneToUserId.delete(session.phoneNumber);
    this.emit(session, 'disconnected', '');
    session.listeners.clear();
    this.sessions.delete(userId);
    log.info('stopped and cleaned up', { userId });
    return true;
  }

  /** Delete a session (remove auth — user must re-scan) */
  async deleteSession(userId: string): Promise<boolean> {
    this.stopSession(userId);
    const authDir = join(AUTH_ROOT, userId);
    try {
      await rm(authDir, { recursive: true, force: true });
    } catch {}
    return true;
  }

  /** List all active sessions */
  listSessions(): Array<{
    userId: string;
    isConnected: boolean;
    phoneNumber: string | null;
    hasQr: boolean;
  }> {
    return Array.from(this.sessions.values()).map(s => ({
      userId: s.userId,
      isConnected: s.isConnected,
      phoneNumber: s.phoneNumber,
      hasQr: !!s.lastQr,
    }));
  }

  /** Send a text message through a specific user's session */
  async sendMessage(userId: string, jid: string, text: string): Promise<{ ok: boolean; error?: string }> {
    const session = this.sessions.get(userId);
    if (!session?.socket) {
      log.warn('sendMessage: no socket', { userId, jid });
      return { ok: false, error: 'No WhatsApp session found. Please reconnect via QR.' };
    }
    if (!session.isConnected) {
      log.warn('sendMessage: session disconnected', { userId, jid });
      return { ok: false, error: 'WhatsApp session is disconnected. Please reconnect via QR.' };
    }
    try {
      await session.socket.sendMessage(jid, { text });
      const outPhone = jid.replace(/@.*/, '');
      storeMessage({ userId, jid, phone: outPhone, direction: 'outbound', content: text });
      return { ok: true };
    } catch (err) {
      const msg = (err as Error).message || 'unknown error';
      log.error('sendMessage failed', { userId, jid, error: msg });
      return { ok: false, error: `Send failed: ${msg}` };
    }
  }

  /** Send an audio message through a specific user's session */
  async sendAudio(userId: string, jid: string, audioBase64: string, mimeType = 'audio/mpeg'): Promise<boolean> {
    const session = this.sessions.get(userId);
    if (!session?.socket || !session.isConnected) {
      log.warn('sendAudio: session unavailable', { userId, jid });
      return false;
    }
    try {
      const buffer = Buffer.from(audioBase64, 'base64');
      await session.socket.sendMessage(jid, { audio: buffer, mimetype: mimeType, ptt: true });
      return true;
    } catch (err) {
      log.error('sendAudio failed', { userId, jid, error: (err as Error).message });
      return false;
    }
  }

  /** Send an image through a user's session */
  async sendImage(userId: string, jid: string, buffer: Buffer, mimeType: string, caption?: string): Promise<boolean> {
    const session = this.sessions.get(userId);
    if (!session?.socket || !session.isConnected) return false;
    try {
      await session.socket.sendMessage(jid, {
        image: buffer,
        mimetype: mimeType,
        caption: caption || undefined,
      });
      return true;
    } catch (err) {
      log.error('sendImage failed', { userId, jid, error: (err as Error).message });
      return false;
    }
  }

  /** Send a video through a user's session */
  async sendVideo(userId: string, jid: string, buffer: Buffer, mimeType: string, caption?: string, gifPlayback = false): Promise<boolean> {
    const session = this.sessions.get(userId);
    if (!session?.socket || !session.isConnected) return false;
    try {
      await session.socket.sendMessage(jid, {
        video: buffer,
        mimetype: mimeType,
        caption: caption || undefined,
        ...(gifPlayback ? { gifPlayback: true } : {}),
      });
      return true;
    } catch (err) {
      log.error('sendVideo failed', { userId, jid, error: (err as Error).message });
      return false;
    }
  }

  /** Send a document through a user's session */
  async sendDocument(userId: string, jid: string, buffer: Buffer, mimeType: string, fileName: string, caption?: string): Promise<boolean> {
    const session = this.sessions.get(userId);
    if (!session?.socket || !session.isConnected) return false;
    try {
      await session.socket.sendMessage(jid, {
        document: buffer,
        mimetype: mimeType,
        fileName,
        caption: caption || undefined,
      });
      return true;
    } catch (err) {
      log.error('sendDocument failed', { userId, jid, error: (err as Error).message });
      return false;
    }
  }

  /** Send a poll through a user's session */
  async sendPoll(userId: string, jid: string, question: string, options: string[], maxSelections = 1): Promise<boolean> {
    const session = this.sessions.get(userId);
    if (!session?.socket || !session.isConnected) return false;
    try {
      await session.socket.sendMessage(jid, {
        poll: {
          name: question,
          values: options,
          selectableCount: maxSelections,
        },
      } as any);
      return true;
    } catch (err) {
      log.error('sendPoll failed', { userId, jid, error: (err as Error).message });
      return false;
    }
  }

  /** Send a reaction to a specific message */
  async sendReaction(userId: string, jid: string, emoji: string, messageId: string, fromMe = false): Promise<boolean> {
    const session = this.sessions.get(userId);
    if (!session?.socket || !session.isConnected) return false;
    try {
      await session.socket.sendMessage(jid, {
        react: {
          text: emoji,
          key: { remoteJid: jid, id: messageId, fromMe },
        },
      } as any);
      return true;
    } catch (err) {
      log.error('sendReaction failed', { userId, jid, error: (err as Error).message });
      return false;
    }
  }

  /** Boot: reconnect any sessions that have persisted auth dirs with valid creds */
  async restoreSessions(): Promise<void> {
    const { readdir, access } = await import('node:fs/promises');
    try {
      await mkdir(AUTH_ROOT, { recursive: true });
      const dirs = await readdir(AUTH_ROOT, { withFileTypes: true });
      let restored = 0;
      for (const d of dirs) {
        if (!d.isDirectory()) continue;
        const userId = d.name;
        const authDir = join(AUTH_ROOT, userId);

        // Restore from backup if creds corrupted
        maybeRestoreCredsFromBackup(authDir);

        const credsPath = join(authDir, 'creds.json');
        try {
          await access(credsPath);
          const { readFile } = await import('node:fs/promises');
          const credsRaw = await readFile(credsPath, 'utf-8');
          const creds = JSON.parse(credsRaw);
          if (!creds.me?.id) {
            log.info('skipping — creds.json exists but auth incomplete (no me.id)', { userId });
            await rm(join(AUTH_ROOT, userId), { recursive: true, force: true });
            continue;
          }
        } catch {
          log.info('skipping — no valid creds, removing stale auth dir', { userId });
          await rm(join(AUTH_ROOT, userId), { recursive: true, force: true });
          continue;
        }
        log.info('restoring session', { userId });
        try {
          await this.startSession(userId);
          restored++;
        } catch (err) {
          log.error('failed to restore session', { userId, err });
        }
      }
      log.info('session restore complete', { restored });
    } catch {
      log.info('no previous sessions to restore');
    }
  }
}

// Singleton
export const sessionManager = new SessionManager();
