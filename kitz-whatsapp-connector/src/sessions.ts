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

const __dirname = dirname(fileURLToPath(import.meta.url));

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
    .catch((err) => console.error('[sessions] creds save error:', err));
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
  extra?: { replyContext?: { id: string; body: string | null; sender: string | null }; location?: string },
): Promise<string> {
  try {
    const res = await fetch(`${KITZ_OS_URL}/api/kitz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(SERVICE_SECRET ? { 'x-service-secret': SERVICE_SECRET } : {}) },
      body: JSON.stringify({
        message,
        sender: senderJid,
        user_id: userId,
        trace_id: traceId,
        response_rules: RESPONSE_RULES,
        reply_context: extra?.replyContext,
        location: extra?.location,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      console.error(`[session:${userId}] KITZ OS returned ${res.status}`);
      return 'KITZ OS is temporarily unavailable. Try again in a moment.';
    }

    const data = (await res.json()) as { response?: string; error?: string };
    return data.response || data.error || 'Done.';
  } catch (err) {
    console.error(`[session:${userId}] Forward failed:`, (err as Error).message);
    return 'Could not reach KITZ OS. Is it running?';
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
): Promise<string> {
  try {
    const res = await fetch(`${KITZ_OS_URL}/api/kitz/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(SERVICE_SECRET ? { 'x-service-secret': SERVICE_SECRET } : {}) },
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

    if (!res.ok) return 'Could not process that file right now.';

    const data = (await res.json()) as { response?: string; error?: string };
    return data.response || data.error || 'Media processed.';
  } catch (err) {
    console.error(`[session:${userId}] Media forward failed:`, (err as Error).message);
    return 'Could not process media. Is KITZ OS running?';
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
            console.log(`[session:${userId}] QR code generated — waiting for scan`);
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
              console.log(`[session:${userId}] Phone +${session.phoneNumber} was on session ${existingUserId} — killing old session`);
              this.stopSession(existingUserId);
            }
            this.phoneToUserId.set(session.phoneNumber, userId);
          }

          console.log(`[session:${userId}] CONNECTED as +${session.phoneNumber}`);
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
                console.log(`[session:${userId}] Confirmation sent to ${selfJid}`);
              } catch (err) {
                console.error(`[session:${userId}] Failed to send confirmation:`, (err as Error).message);
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

          console.log(JSON.stringify({
            ts: new Date().toISOString(),
            module: 'sessions',
            userId,
            action: 'connection_closed',
            statusCode,
            shouldReconnect,
            wasConnected,
            is515Restart,
          }));

          this.emit(session, 'disconnected', JSON.stringify({ statusCode }));

          // Close dead socket
          try { sock.ws?.close(); } catch {}
          session.socket = null;

          // Error 515: WhatsApp asked for restart after pairing — retry once
          if (is515Restart && !session.restartAttempted) {
            session.restartAttempted = true;
            console.log(`[session:${userId}] Error 515 — restarting socket once (WhatsApp pairing restart)`);
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
        console.error(`[session:${userId}] connection.update handler error:`, (err as Error).message);
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
          console.error(`[session:${userId}] Message handler error:`, (err as Error).message);
        }
      }
    });

    // 4. WebSocket error handler — LAST (after all event handlers, matching OpenClaw)
    if (sock.ws && typeof (sock.ws as any).on === 'function') {
      (sock.ws as any).on('error', (err: Error) => {
        console.error(`[session:${userId}] WebSocket error:`, err.message);
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
        console.log(`[session:${session.userId}] Watchdog: no messages for ${Math.round(silenceMs / 60000)}m — force reconnecting`);
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
      console.log(JSON.stringify({
        ts: new Date().toISOString(),
        module: 'heartbeat',
        userId: session.userId,
        phone: session.phoneNumber,
        connected: true,
        uptimeMin: Math.round(uptimeMs / 60000),
        reconnectAttempts: session.reconnectAttempts,
        authAgeMin: authAge ? Math.round(authAge / 60000) : null,
      }));
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
      console.log(`[session:${session.userId}] Watchdog reconnect in ${Math.round(delay / 1000)}s (attempt ${session.reconnectAttempts}/${DEFAULT_RECONNECT_POLICY.maxAttempts})`);
      setTimeout(() => this.connectBaileys(session), delay);
    } else {
      console.log(`[session:${session.userId}] Max reconnect attempts after watchdog — removing session`);
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
      console.log(`[session:${userId}] QR timeout (${statusCode}) — cleaning up`);
      const dir = join(AUTH_ROOT, userId);
      rm(dir, { recursive: true, force: true }).catch(() => {});
      session.listeners.clear();
      this.sessions.delete(userId);
    } else if (shouldReconnect && session.reconnectAttempts < DEFAULT_RECONNECT_POLICY.maxAttempts) {
      session.reconnectAttempts++;
      const delay = computeBackoff(session.reconnectAttempts - 1);
      console.log(`[session:${userId}] Reconnecting in ${Math.round(delay / 1000)}s (attempt ${session.reconnectAttempts}/${DEFAULT_RECONNECT_POLICY.maxAttempts})`);
      setTimeout(() => this.connectBaileys(session), delay);
    } else if (isLoggedOut) {
      console.log(`[session:${userId}] Logged out — cleaning up session`);
      this.emit(session, 'logged_out', '');
      if (session.phoneNumber) this.phoneToUserId.delete(session.phoneNumber);
      const dir = join(AUTH_ROOT, userId);
      rm(dir, { recursive: true, force: true }).catch(() => {});
      session.listeners.clear();
      this.sessions.delete(userId);
    } else if (flags.statusCode === 401) {
      // 401 device_removed — WhatsApp permanently revoked this session.
      // Do NOT self-heal — user must re-scan QR.
      console.log(`[session:${userId}] 401 device_removed — session revoked, cleaning up`);
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
      console.log(`[session:${userId}] Max reconnect attempts — self-healing in 60s`);
      setTimeout(() => this.connectBaileys(session), healDelay);
    } else {
      console.log(`[session:${userId}] Session removed — no phone number or unknown state`);
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
    console.log(`[session:${userId}] RAW MSG: fromMe=${msg.key.fromMe} remoteJid=${senderJid} myNumber=${myNumber} keys=[${Object.keys(msg.message || {}).join(',')}]`);

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
      console.log(`[session:${userId}] Activated in group ${senderJid} (mentioned=${isMentioned}, kitz=${kitzMentioned})`);
    }

    // If it's NOT self-chat and NOT a group (i.e., a DM):
    if (!isSelfChat && !isGroup) {
      if (!msg.key.fromMe) {
        // External person messaged us — polite auto-reply + log to workspace
        await this.autoReplyToExternal(session, senderJid, earlyText);
      }
      // Either way, don't process — Kitz only lives in self-chat and groups when mentioned
      return;
    }

    // Skip Kitz's own replies echoing back (prevents infinite loops)
    if (msg.key.id && kitzSentIds.has(msg.key.id)) {
      console.log(`[session:${userId}] Skipping Kitz echo (msg ${msg.key.id})`);
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
        console.log(`[session:${userId}] Skipping pre-connection message`);
      }
      return;
    }

    const traceId = crypto.randomUUID();

    // Always reply to canonical self-chat JID (not LID)
    const replyJid = myNumber ? `${myNumber}@s.whatsapp.net` : senderJid;

    // ── Extract reply context and location ──
    const replyContext = extractReplyContext(msg) ?? undefined;
    const locationData = extractLocationData(msg.message);
    const locationText = locationData ? formatLocationText(locationData) : undefined;

    // Debug: log message keys
    const debugKeys = Object.keys(msg.message || {});
    console.log(`[session:${userId}] msg.message keys: [${debugKeys.join(', ')}]`);

    const hasText = !!msg.message?.conversation || !!msg.message?.extendedTextMessage?.text;
    const hasImage = !!msg.message?.imageMessage;
    const hasDocument = !!msg.message?.documentMessage;
    const hasAudio = !!msg.message?.audioMessage;
    const hasLocation = !!locationData;

    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      module: 'sessions',
      userId,
      action: 'message_received',
      sender: senderJid,
      trace_id: traceId,
      has_text: hasText,
      has_image: hasImage,
      has_document: hasDocument,
      has_audio: hasAudio,
      has_location: hasLocation,
      has_reply: !!replyContext,
      msg_keys: debugKeys,
    }));

    // Helper: type then reply in self-chat (tracks sent ID to prevent echo loops)
    const typeThenReply = async (text: string) => {
      const prefixed = kitzReply(text);
      try { await sock.sendPresenceUpdate('composing', replyJid); } catch {}
      await sleep(typingDelayMs(text));
      try { await sock.sendPresenceUpdate('available', replyJid); } catch {}
      try {
        const sent = await sock.sendMessage(replyJid, { text: prefixed });
        if (sent?.key?.id) trackKitzSent(sent.key.id);
        console.log(`[session:${userId}] Reply sent to self-chat`);
      } catch (err) {
        console.error(`[session:${userId}] Reply FAILED:`, (err as Error).message);
      }
    };

    // ── Location-only messages ──
    if (hasLocation && !hasText && !hasImage && !hasDocument && !hasAudio) {
      try { await sock.sendPresenceUpdate('composing', replyJid); } catch {}
      const response = await forwardToKitzOs(
        locationText || 'Location shared',
        replyJid, userId, traceId,
        { location: locationText },
      );
      await sleep(typingDelayMs(response));
      try { await sock.sendPresenceUpdate('available', replyJid); } catch {}
      try { await sock.sendMessage(replyJid, { text: kitzReply(response) }); } catch {}
      return;
    }

    // ── Text messages ──
    const text =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      '';

    if (text) {
      const fullText = locationText ? `${text}\n${locationText}` : text;
      try { await sock.sendPresenceUpdate('composing', replyJid); } catch {}
      console.log(`[session:${userId}] Forwarding text to kitz_os: "${fullText.slice(0, 50)}"`);
      const response = await forwardToKitzOs(fullText, replyJid, userId, traceId, {
        replyContext,
        location: locationText,
      });
      console.log(`[session:${userId}] kitz_os response: "${response.slice(0, 80)}"`);
      await sleep(typingDelayMs(response));
      try { await sock.sendPresenceUpdate('available', replyJid); } catch {}
      try {
        const sent = await sock.sendMessage(replyJid, { text: kitzReply(response) });
        if (sent?.key?.id) trackKitzSent(sent.key.id);
        console.log(`[session:${userId}] Reply sent to self-chat`);
      } catch (sendErr) {
        console.error(`[session:${userId}] Reply FAILED:`, (sendErr as Error).message);
      }
      return;
    }

    // ── Image messages ──
    const imageMsg = msg.message?.imageMessage;
    if (imageMsg) {
      try {
        await sock.sendPresenceUpdate('composing', replyJid);
        const buffer = await downloadMediaMessage(msg, 'buffer', {});
        const base64 = (buffer as Buffer).toString('base64');
        const rawSizeKB = Math.round(buffer.length / 1024);
        console.log(`[session:${userId}] Image received: ${rawSizeKB}KB raw, ${Math.round(base64.length / 1024)}KB base64`);
        if (base64.length > MAX_MEDIA_SIZE) {
          await typeThenReply(`Image too large (${rawSizeKB}KB) — max ~10MB supported.`);
          return;
        }
        const caption = imageMsg.caption || '';
        const mimeType = imageMsg.mimetype || 'image/jpeg';
        const response = await forwardMediaToKitzOs(base64, mimeType, caption, replyJid, userId, traceId);
        await sleep(typingDelayMs(response));
        try { await sock.sendPresenceUpdate('available', replyJid); } catch {}
        const sent = await sock.sendMessage(replyJid, { text: kitzReply(response) });
        if (sent?.key?.id) trackKitzSent(sent.key.id);
      } catch (err) {
        console.error(`[session:${userId}] Image download failed:`, (err as Error).message);
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
        console.log(`[session:${userId}] Document received: ${rawSizeKB}KB raw, ${Math.round(base64.length / 1024)}KB base64`);
        if (base64.length > MAX_MEDIA_SIZE) {
          await typeThenReply(`Doc too large (${rawSizeKB}KB) — max ~10MB supported.`);
          return;
        }
        const caption = docMsg.caption || docMsg.fileName || '';
        const mimeType = docMsg.mimetype || 'application/pdf';
        const response = await forwardMediaToKitzOs(base64, mimeType, caption, replyJid, userId, traceId);
        await sleep(typingDelayMs(response));
        try { await sock.sendPresenceUpdate('available', replyJid); } catch {}
        const sent = await sock.sendMessage(replyJid, { text: kitzReply(response) });
        if (sent?.key?.id) trackKitzSent(sent.key.id);
      } catch (err) {
        console.error(`[session:${userId}] Document download failed:`, (err as Error).message);
        await typeThenReply('Could not download that document.');
      }
      return;
    }

    // ── Audio/voice note messages ──
    const audioMsg = msg.message?.audioMessage;
    if (audioMsg) {
      try {
        await sock.sendPresenceUpdate('composing', replyJid);
        const buffer = await downloadMediaMessage(msg, 'buffer', {});
        const base64 = (buffer as Buffer).toString('base64');
        const rawSizeKB = Math.round(buffer.length / 1024);
        console.log(`[session:${userId}] Audio received: ${rawSizeKB}KB raw`);
        const mimeType = audioMsg.mimetype || 'audio/ogg; codecs=opus';
        const response = await forwardMediaToKitzOs(
          base64, mimeType,
          'Voice note received — transcribe and process as brain dump',
          replyJid, userId, traceId,
        );
        await sleep(typingDelayMs(response));
        try { await sock.sendPresenceUpdate('available', replyJid); } catch {}
        const sent = await sock.sendMessage(replyJid, { text: kitzReply(response) });
        if (sent?.key?.id) trackKitzSent(sent.key.id);
      } catch (err) {
        console.error(`[session:${userId}] Audio download failed:`, (err as Error).message);
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
      this.logMissedMessage(userId, senderNumber, messageText).catch(() => {});
    }

    // Check config — auto-reply may be disabled
    const config = getAutoReplyConfig(userId);
    if (!config.enabled) {
      console.log(`[session:${userId}] Auto-reply disabled — message logged`);
      return;
    }

    // Check cooldown — don't spam the same person with auto-replies
    const key = `${userId}:${senderJid}`;
    const lastSent = this.autoReplySent.get(key);
    if (lastSent && Date.now() - lastSent < config.cooldownMs) {
      console.log(`[session:${userId}] Skipping auto-reply to ${senderJid} (cooldown) — message logged`);
      return;
    }

    // Send polite auto-reply using configurable message
    try {
      const sent = await sock.sendMessage(senderJid, {
        text: renderMessage(config),
      });
      if (sent?.key?.id) trackKitzSent(sent.key.id);
      this.autoReplySent.set(key, Date.now());
      console.log(`[session:${userId}] Auto-reply sent to ${senderJid}`);
    } catch (err) {
      console.error(`[session:${userId}] Auto-reply failed to ${senderJid}:`, (err as Error).message);
    }
  }

  /** Forward a missed WhatsApp message to kitz_os for CRM capture */
  private async logMissedMessage(userId: string, senderPhone: string, messageText: string): Promise<void> {
    try {
      const traceId = crypto.randomUUID();
      await fetch(`${KITZ_OS_URL}/api/kitz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(SERVICE_SECRET ? { 'x-service-secret': SERVICE_SECRET } : {}) },
        body: JSON.stringify({
          message: `[MISSED WhatsApp from +${senderPhone}]: "${messageText}".\nLog this contact and their message in the CRM. Phone: +${senderPhone}. Tag as "missed-whatsapp".`,
          sender: `${senderPhone}@s.whatsapp.net`,
          user_id: userId,
          trace_id: traceId,
        }),
        signal: AbortSignal.timeout(15_000),
      });
      console.log(`[session:${userId}] Missed message from +${senderPhone} logged to workspace`);
    } catch (err) {
      console.error(`[session:${userId}] Failed to log missed message:`, (err as Error).message);
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
    console.log(`[session:${userId}] Stopped and cleaned up`);
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
  async sendMessage(userId: string, jid: string, text: string): Promise<boolean> {
    const session = this.sessions.get(userId);
    if (!session?.socket || !session.isConnected) return false;
    try {
      await session.socket.sendMessage(jid, { text });
      return true;
    } catch {
      return false;
    }
  }

  /** Send an audio message through a specific user's session */
  async sendAudio(userId: string, jid: string, audioBase64: string, mimeType = 'audio/mpeg'): Promise<boolean> {
    const session = this.sessions.get(userId);
    if (!session?.socket || !session.isConnected) return false;
    try {
      const buffer = Buffer.from(audioBase64, 'base64');
      await session.socket.sendMessage(jid, { audio: buffer, mimetype: mimeType, ptt: true });
      return true;
    } catch {
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
    } catch { return false; }
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
    } catch { return false; }
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
    } catch { return false; }
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
    } catch { return false; }
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
    } catch { return false; }
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
            console.log(`[sessions] Skipping ${userId} — creds.json exists but auth incomplete (no me.id)`);
            await rm(join(AUTH_ROOT, userId), { recursive: true, force: true });
            continue;
          }
        } catch {
          console.log(`[sessions] Skipping ${userId} — no valid creds, removing stale auth dir`);
          await rm(join(AUTH_ROOT, userId), { recursive: true, force: true });
          continue;
        }
        console.log(`[sessions] Restoring session: ${userId}`);
        try {
          await this.startSession(userId);
          restored++;
        } catch (err) {
          console.error(`[sessions] Failed to restore ${userId}:`, (err as Error).message);
        }
      }
      console.log(`[sessions] Restored ${restored} session(s)`);
    } catch {
      console.log('[sessions] No previous sessions to restore');
    }
  }
}

// Singleton
export const sessionManager = new SessionManager();
