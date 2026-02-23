import type { AOSEvent } from '../types.js';

const ESCALATION_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const ESCALATION_THRESHOLD = 3;

const recentEscalations: { timestamp: number }[] = [];
let warRoomActive = false;

/**
 * Tracks escalation events in a sliding 10-minute window.
 * Auto-activates a war room when 3+ escalations occur.
 */
export function warRoomActivatorMiddleware(event: AOSEvent): void {
  if (event.severity !== 'critical' && event.type !== 'INCIDENT_DETECTED') return;

  const now = Date.now();
  recentEscalations.push({ timestamp: now });

  // Clean old entries outside the window
  while (recentEscalations.length > 0 && recentEscalations[0].timestamp < now - ESCALATION_WINDOW_MS) {
    recentEscalations.shift();
  }

  if (recentEscalations.length >= ESCALATION_THRESHOLD && !warRoomActive) {
    warRoomActive = true;
    (event.payload as Record<string, unknown>)._warRoomTriggered = true;
    // The WarRoom manager will pick up WAR_ROOM_ACTIVATED events
  }
}

export function resetWarRoomState(): void {
  warRoomActive = false;
  recentEscalations.length = 0;
}
