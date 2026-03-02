/**
 * WebSocket Gateway — Real-time streaming for the KITZ UI.
 *
 * Streams NDJSON events to connected clients:
 *   - agent.thinking   — which phase/agent is active
 *   - tool.call        — tool name + args being executed
 *   - tool.result      — tool execution result
 *   - text.delta       — streaming text chunks
 *   - text.done        — final response
 *
 * Clients connect to /ws and receive events as newline-delimited JSON.
 */

import type { FastifyInstance } from 'fastify';
import { createSubsystemLogger } from 'kitz-schemas';
import type { WebSocket } from '@fastify/websocket';

const log = createSubsystemLogger('wsGateway');

// ── Types ──

export interface WSEvent {
  type: 'agent.thinking' | 'tool.call' | 'tool.result' | 'text.delta' | 'text.done' | 'error' | 'connected';
  traceId?: string;
  timestamp: string;
  data: Record<string, unknown>;
}

// ── Connected clients ──

const clients = new Set<WebSocket>();

/** Broadcast an event to all connected WebSocket clients */
export function broadcastEvent(event: WSEvent): void {
  const payload = JSON.stringify(event) + '\n';
  for (const client of clients) {
    try {
      if (client.readyState === 1) { // OPEN
        client.send(payload);
      }
    } catch {
      // Client disconnected — will be cleaned up on close
    }
  }
}

/** Send an event to a specific client */
export function sendEvent(client: WebSocket, event: WSEvent): void {
  try {
    if (client.readyState === 1) {
      client.send(JSON.stringify(event) + '\n');
    }
  } catch {
    // Ignore send errors
  }
}

/** Get connected client count */
export function getClientCount(): number {
  return clients.size;
}

// ── Convenience event emitters ──

export function emitThinking(traceId: string, phase: string, agent?: string): void {
  broadcastEvent({
    type: 'agent.thinking',
    traceId,
    timestamp: new Date().toISOString(),
    data: { phase, agent },
  });
}

export function emitToolCall(traceId: string, toolName: string, args: Record<string, unknown>): void {
  broadcastEvent({
    type: 'tool.call',
    traceId,
    timestamp: new Date().toISOString(),
    data: { tool: toolName, args },
  });
}

export function emitToolResult(traceId: string, toolName: string, result: unknown): void {
  broadcastEvent({
    type: 'tool.result',
    traceId,
    timestamp: new Date().toISOString(),
    data: {
      tool: toolName,
      result: typeof result === 'string' ? result.slice(0, 1000) : JSON.stringify(result).slice(0, 1000),
    },
  });
}

export function emitTextDelta(traceId: string, text: string): void {
  broadcastEvent({
    type: 'text.delta',
    traceId,
    timestamp: new Date().toISOString(),
    data: { text },
  });
}

export function emitTextDone(traceId: string, text: string, toolsUsed: string[]): void {
  broadcastEvent({
    type: 'text.done',
    traceId,
    timestamp: new Date().toISOString(),
    data: { text, toolsUsed },
  });
}

// ── Fastify Plugin Registration ──

/**
 * Register the WebSocket gateway on a Fastify instance.
 * Requires @fastify/websocket to be registered first.
 */
export async function registerWSGateway(app: FastifyInstance): Promise<void> {
  // Register websocket plugin
  try {
    const ws = await import('@fastify/websocket');
    await app.register(ws.default);
  } catch {
    log.warn('@fastify/websocket not installed — WS gateway disabled. Run: npm i @fastify/websocket');
    return;
  }

  app.get('/ws', { websocket: true }, (socket, _req) => {
    clients.add(socket);
    log.info('ws_client_connected', { total: clients.size });

    sendEvent(socket, {
      type: 'connected',
      timestamp: new Date().toISOString(),
      data: { message: 'Connected to KITZ real-time stream' },
    });

    socket.on('message', (raw) => {
      // Clients can send JSON messages (e.g., subscribe to specific traceIds)
      try {
        const msg = JSON.parse(raw.toString()) as { type?: string; traceId?: string };
        if (msg.type === 'ping') {
          sendEvent(socket, {
            type: 'connected',
            timestamp: new Date().toISOString(),
            data: { message: 'pong' },
          });
        }
      } catch {
        // Ignore malformed messages
      }
    });

    socket.on('close', () => {
      clients.delete(socket);
      log.info('ws_client_disconnected', { total: clients.size });
    });

    socket.on('error', () => {
      clients.delete(socket);
    });
  });

  log.info('WebSocket gateway registered at /ws');
}
