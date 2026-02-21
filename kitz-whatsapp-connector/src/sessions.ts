/**
 * Session Manager — Multi-user Baileys WhatsApp sessions.
 *
 * Each user who scans the QR code gets their own:
 *   - Baileys WASocket
 *   - Auth directory (persisted across restarts)
 *   - Connection state + QR stream
 *
 * Sessions are stored in a Map keyed by userId (UUID).
 */

import makeWASocket, {
  DisconnectReason,
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

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Config ──
const KITZ_OS_URL = process.env.KITZ_OS_URL || 'http://localhost:3012';
const AUTH_ROOT = join(__dirname, '..', 'auth_info_baileys');
const MAX_MEDIA_SIZE = 100_000;
const MAX_RECONNECT = 5;

const baileysLogger = P({ level: 'warn' });

// ── Response rules sent to KITZ OS ──
const RESPONSE_RULES = {
  default_words: '5-7',
  max_words: '15-23',
  complex_max_words: 30,
  tone: 'cool, chill, never rude',
  overflow: 'email',
};

// ── Typing delay: simulate natural typing ──
function typingDelayMs(response: string): number {
  const wordCount = response.split(/\s+/).length;
  if (wordCount <= 7) return 3000 + Math.random() * 4000;
  return 12000 + Math.random() * 6000;
}
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── Types ──
export interface UserSession {
  userId: string;
  socket: WASocket | null;
  authDir: string;
  isConnected: boolean;
  lastQr: string | null;
  phoneNumber: string | null;
  reconnectAttempts: number;
  /** Listeners waiting for QR/connection updates (SSE clients) */
  listeners: Set<(event: string, data: string) => void>;
}

// ── Forward message to KITZ OS ──
async function forwardToKitzOs(
  message: string,
  senderJid: string,
  userId: string,
  traceId: string,
): Promise<string> {
  try {
    const res = await fetch(`${KITZ_OS_URL}/api/kitz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        sender: senderJid,
        user_id: userId,
        trace_id: traceId,
        response_rules: RESPONSE_RULES,
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
      headers: { 'Content-Type': 'application/json' },
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

// ── Session Manager ──
class SessionManager {
  private sessions = new Map<string, UserSession>();

  /** Start (or restart) a Baileys session for a user */
  async startSession(userId: string): Promise<UserSession> {
    // If session already exists and is connected, return it
    const existing = this.sessions.get(userId);
    if (existing?.isConnected) return existing;

    // If session exists but disconnected, clean up socket
    if (existing?.socket) {
      try { existing.socket.end(undefined); } catch {}
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
      phoneNumber: null,
      reconnectAttempts: 0,
      listeners: new Set(),
    };

    if (!existing) this.sessions.set(userId, session);

    await this.connectBaileys(session);
    return session;
  }

  /** Internal: wire up a Baileys socket for a session */
  private async connectBaileys(session: UserSession): Promise<void> {
    const { userId, authDir } = session;
    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    const sock = makeWASocket({
      auth: state,
      logger: baileysLogger as any,
      browser: ['KITZ', 'Safari', '3.0'],
      connectTimeoutMs: 120_000,
      qrTimeout: 60_000,
      markOnlineOnConnect: false,
      syncFullHistory: false,
      defaultQueryTimeoutMs: 60_000,
    });

    session.socket = sock;

    // ── Connection updates ──
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        session.lastQr = qr;
        this.emit(session, 'qr', qr);
        console.log(`[session:${userId}] QR code generated — waiting for scan`);
      }

      if (connection === 'close') {
        session.isConnected = false;
        session.lastQr = null;

        const error = (lastDisconnect?.error as Boom)?.output;
        const statusCode = error?.statusCode;

        // 428 = QR timeout (not scanned), 408 = connection timeout
        // 401 = logged out, 440 = replaced by another device
        // Only reconnect for transient errors (500, 515, etc.) when session was previously connected
        const isQrTimeout = statusCode === 428 || statusCode === 408;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut;
        const wasConnected = !!session.phoneNumber; // had a successful connection before
        const shouldReconnect = !isLoggedOut && !isQrTimeout && wasConnected;

        console.log(JSON.stringify({
          ts: new Date().toISOString(),
          module: 'sessions',
          userId,
          action: 'connection_closed',
          statusCode,
          shouldReconnect,
          wasConnected,
        }));

        this.emit(session, 'disconnected', JSON.stringify({ statusCode }));

        // Always close the dead socket fully
        try { sock.ws.close(); } catch {}
        try { sock.end(undefined); } catch {}
        session.socket = null;

        if (isQrTimeout) {
          // QR expired without scan — clean up completely, user must re-initiate
          console.log(`[session:${userId}] QR timeout (${statusCode}) — cleaning up`);
          const authDir = join(AUTH_ROOT, userId);
          await rm(authDir, { recursive: true, force: true }).catch(() => {});
          session.listeners.clear();
          this.sessions.delete(userId);
        } else if (shouldReconnect && session.reconnectAttempts < MAX_RECONNECT) {
          session.reconnectAttempts++;
          const delay = Math.min(session.reconnectAttempts * 2000, 10_000);
          console.log(`[session:${userId}] Reconnecting in ${delay / 1000}s (attempt ${session.reconnectAttempts}/${MAX_RECONNECT})`);
          setTimeout(() => this.connectBaileys(session), delay);
        } else if (isLoggedOut) {
          console.log(`[session:${userId}] Logged out — cleaning up session`);
          this.emit(session, 'logged_out', '');
          const authDir = join(AUTH_ROOT, userId);
          await rm(authDir, { recursive: true, force: true }).catch(() => {});
          session.listeners.clear();
          this.sessions.delete(userId);
        } else {
          // Max reconnect attempts reached — clean up fully
          console.log(`[session:${userId}] Max reconnect attempts — removing session`);
          session.listeners.clear();
          this.sessions.delete(userId);
        }
      }

      if (connection === 'open') {
        session.isConnected = true;
        session.lastQr = null;
        session.reconnectAttempts = 0;

        // Extract phone number from socket
        const me = sock.user;
        if (me?.id) {
          session.phoneNumber = me.id.split(':')[0].split('@')[0];
        }

        console.log(`[session:${userId}] CONNECTED as +${session.phoneNumber}`);
        this.emit(session, 'connected', JSON.stringify({ phone: session.phoneNumber }));
      }
    });

    sock.ev.on('creds.update', saveCreds);

    // ── Handle incoming messages ──
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;

      for (const msg of messages) {
        try {
          await this.handleMessage(session, msg);
        } catch (err) {
          console.error(`[session:${userId}] Message handler error:`, (err as Error).message);
        }
      }
    });
  }

  /** Handle an incoming WhatsApp message for a specific session */
  private async handleMessage(session: UserSession, msg: WAMessage): Promise<void> {
    if (!msg.message) return;
    if (msg.key.fromMe) return;
    if (msg.key.remoteJid === 'status@broadcast') return;

    const senderJid = msg.key.remoteJid || '';
    const { userId } = session;
    const sock = session.socket!;

    // Block group messages — Kitz OS is 1:1 only
    if (senderJid.endsWith('@g.us')) return;

    const traceId = crypto.randomUUID();

    const hasText = !!msg.message?.conversation || !!msg.message?.extendedTextMessage;
    const hasImage = !!msg.message?.imageMessage;
    const hasDocument = !!msg.message?.documentMessage;
    const hasAudio = !!msg.message?.audioMessage;

    if (hasText || hasImage || hasDocument || hasAudio) {
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
      }));
    }

    // Helper: type then reply scoped to this session's socket
    const typeThenReply = async (text: string) => {
      try { await sock.sendPresenceUpdate('composing', senderJid); } catch {}
      await sleep(typingDelayMs(text));
      try { await sock.sendPresenceUpdate('available', senderJid); } catch {}
      try { await sock.sendMessage(senderJid, { text }); } catch {}
    };

    // ── Text messages ──
    const text =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      '';

    if (text) {
      try { await sock.sendPresenceUpdate('composing', senderJid); } catch {}
      const response = await forwardToKitzOs(text, senderJid, userId, traceId);
      await sleep(typingDelayMs(response));
      try { await sock.sendPresenceUpdate('available', senderJid); } catch {}
      try { await sock.sendMessage(senderJid, { text: response }); } catch {}
      return;
    }

    // ── Image messages ──
    const imageMsg = msg.message?.imageMessage;
    if (imageMsg) {
      try {
        await sock.sendPresenceUpdate('composing', senderJid);
        const buffer = await downloadMediaMessage(msg, 'buffer', {});
        const base64 = (buffer as Buffer).toString('base64');
        if (base64.length > MAX_MEDIA_SIZE) {
          await typeThenReply('Image too large \u2014 send a smaller one.');
          return;
        }
        const caption = imageMsg.caption || '';
        const mimeType = imageMsg.mimetype || 'image/jpeg';
        const response = await forwardMediaToKitzOs(base64, mimeType, caption, senderJid, userId, traceId);
        await sleep(typingDelayMs(response));
        try { await sock.sendPresenceUpdate('available', senderJid); } catch {}
        try { await sock.sendMessage(senderJid, { text: response }); } catch {}
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
        await sock.sendPresenceUpdate('composing', senderJid);
        const buffer = await downloadMediaMessage(msg, 'buffer', {});
        const base64 = (buffer as Buffer).toString('base64');
        if (base64.length > MAX_MEDIA_SIZE) {
          await typeThenReply('Doc too large \u2014 max ~75KB supported.');
          return;
        }
        const caption = docMsg.caption || docMsg.fileName || '';
        const mimeType = docMsg.mimetype || 'application/pdf';
        const response = await forwardMediaToKitzOs(base64, mimeType, caption, senderJid, userId, traceId);
        await sleep(typingDelayMs(response));
        try { await sock.sendPresenceUpdate('available', senderJid); } catch {}
        try { await sock.sendMessage(senderJid, { text: response }); } catch {}
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
        await sock.sendPresenceUpdate('composing', senderJid);
        const buffer = await downloadMediaMessage(msg, 'buffer', {});
        const base64 = (buffer as Buffer).toString('base64');
        const mimeType = audioMsg.mimetype || 'audio/ogg; codecs=opus';
        const response = await forwardMediaToKitzOs(
          base64, mimeType,
          'Voice note received \u2014 transcribe and process as brain dump',
          senderJid, userId, traceId,
        );
        await sleep(typingDelayMs(response));
        try { await sock.sendPresenceUpdate('available', senderJid); } catch {}
        try { await sock.sendMessage(senderJid, { text: response }); } catch {}
      } catch (err) {
        console.error(`[session:${userId}] Audio download failed:`, (err as Error).message);
        await typeThenReply('Could not process that voice note.');
      }
      return;
    }

    await typeThenReply('I handle text, images, docs, and voice notes.');
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

  /** Stop a session (keep auth for re-scan) */
  stopSession(userId: string): boolean {
    const session = this.sessions.get(userId);
    if (!session) return false;

    if (session.socket) {
      try { session.socket.ws.close(); } catch {}
      try { session.socket.end(undefined); } catch {}
      session.socket = null;
    }
    session.isConnected = false;
    session.lastQr = null;
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
        const credsPath = join(AUTH_ROOT, userId, 'creds.json');
        try {
          await access(credsPath);
          // Validate creds has completed auth (me field present)
          const { readFile } = await import('node:fs/promises');
          const credsRaw = await readFile(credsPath, 'utf-8');
          const creds = JSON.parse(credsRaw);
          if (!creds.me?.id) {
            console.log(`[sessions] Skipping ${userId} — creds.json exists but auth incomplete (no me.id)`);
            await rm(join(AUTH_ROOT, userId), { recursive: true, force: true });
            continue;
          }
        } catch {
          // No valid creds — this was a failed/incomplete scan, clean it up
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
