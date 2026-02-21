/**
 * Baileys compatibility layer — wraps SessionManager for backward compat.
 *
 * The old single-socket API (sendWhatsAppMessage, sendWhatsAppAudio, etc.)
 * now delegates to the first connected session. New code should use
 * sessionManager directly from sessions.ts.
 */

import { sessionManager } from './sessions.js';

// ── Legacy API: connection status (aggregate) ──
export function getConnectionStatus() {
  const sessions = sessionManager.listSessions();
  const connected = sessions.filter(s => s.isConnected);
  return {
    connected: connected.length > 0,
    activeSessions: connected.length,
    totalSessions: sessions.length,
    sessions,
  };
}

// ── Legacy API: send text message ──
// Finds the first connected session and sends through it
export async function sendWhatsAppMessage(jid: string, text: string): Promise<boolean> {
  const sessions = sessionManager.listSessions();
  for (const s of sessions) {
    if (s.isConnected) {
      return sessionManager.sendMessage(s.userId, jid, text);
    }
  }
  console.warn('[baileys] Cannot send — no connected sessions');
  return false;
}

// ── Legacy API: send audio message ──
export async function sendWhatsAppAudio(
  jid: string,
  audioBase64: string,
  mimeType: string = 'audio/mpeg',
): Promise<boolean> {
  const sessions = sessionManager.listSessions();
  for (const s of sessions) {
    if (s.isConnected) {
      return sessionManager.sendAudio(s.userId, jid, audioBase64, mimeType);
    }
  }
  console.warn('[baileys] Cannot send audio — no connected sessions');
  return false;
}

// ── Legacy API: startBaileys → restore existing sessions ──
export async function startBaileys(): Promise<void> {
  await sessionManager.restoreSessions();
}
