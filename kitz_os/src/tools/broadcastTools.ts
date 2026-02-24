/**
 * Broadcast + Auto-Reply Tools
 *
 * 5 tools:
 *   - broadcast_preview    (low)    — Preview which contacts match filters
 *   - broadcast_send       (high)   — Send message to filtered contacts (draft-first, 1.5s delay, 200 cap)
 *   - broadcast_history    (low)    — View recent broadcast logs
 *   - autoreply_get        (low)    — Get current auto-reply config
 *   - autoreply_set        (medium) — Update auto-reply settings
 */
import { callWorkspaceMcp } from './mcpClient.js';
import type { ToolSchema } from './registry.js';

const WA_CONNECTOR_URL = process.env.WA_CONNECTOR_URL || 'http://localhost:3006';
const SERVICE_SECRET = process.env.SERVICE_SECRET || process.env.DEV_TOKEN_SECRET || '';
const serviceHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
  ...(SERVICE_SECRET ? { 'x-service-secret': SERVICE_SECRET } : {}),
};

// In-memory broadcast log (capped at 100 entries)
interface BroadcastLogEntry {
  id: string;
  message: string;
  sent: number;
  failed: number;
  skipped: number;
  total: number;
  filters: Record<string, unknown>;
  createdAt: string;
}
const broadcastLog: BroadcastLogEntry[] = [];
const MAX_LOG_SIZE = 100;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function getAllBroadcastTools(): ToolSchema[] {
  return [
    // ── broadcast_preview ──
    {
      name: 'broadcast_preview',
      description:
        'Preview which CRM contacts would receive a broadcast message. ' +
        'Returns matching contacts without sending anything. Use before broadcast_send.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            description: 'Filter by contact status (e.g., "active", "lead", "customer")',
          },
          tags: {
            type: 'string',
            description: 'Comma-separated tags to filter by (e.g., "vip,returning")',
          },
          limit: {
            type: 'number',
            description: 'Max contacts to preview (default: 50, max: 200)',
          },
        },
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const status = args.status ? String(args.status) : undefined;
        const tags = args.tags ? String(args.tags).split(',').map(t => t.trim()).filter(Boolean) : [];
        const limit = Math.min(Number(args.limit) || 50, 200);
        const userId = String(args._userId || '');

        const mcpArgs: Record<string, unknown> = { limit };
        if (status) mcpArgs.status = status;

        const result = await callWorkspaceMcp('list_contacts', mcpArgs, traceId, userId);
        let contacts = Array.isArray(result) ? result : [];

        // Client-side tag filter
        if (tags.length > 0) {
          contacts = contacts.filter((c: Record<string, unknown>) => {
            const contactTags = Array.isArray(c.tags) ? c.tags as string[] : [];
            return tags.some(t => contactTags.includes(t));
          });
        }

        const withPhone = contacts.filter((c: Record<string, unknown>) => !!c.phone);
        const withoutPhone = contacts.length - withPhone.length;

        return {
          total_matched: contacts.length,
          with_phone: withPhone.length,
          without_phone: withoutPhone,
          contacts: withPhone.slice(0, 20).map((c: Record<string, unknown>) => ({
            name: c.name || c.full_name,
            phone: c.phone,
            status: c.status,
            tags: c.tags,
          })),
          note: withPhone.length > 20
            ? `Showing first 20 of ${withPhone.length} contacts with phone numbers.`
            : undefined,
        };
      },
    },

    // ── broadcast_send ──
    {
      name: 'broadcast_send',
      description:
        'Send a WhatsApp message to multiple CRM contacts matching filters. ' +
        'Draft-first: message is queued for approval. Max 200 recipients, 1.5s delay between sends. ' +
        'Use broadcast_preview first to see who will receive the message.',
      parameters: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'The message to broadcast (supports {{name}} placeholder)',
          },
          status: {
            type: 'string',
            description: 'Filter by contact status',
          },
          tags: {
            type: 'string',
            description: 'Comma-separated tags to filter by',
          },
          delay_ms: {
            type: 'number',
            description: 'Delay between sends in ms (default: 1500, min: 1000)',
          },
        },
        required: ['message'],
      },
      riskLevel: 'high',
      execute: async (args, traceId) => {
        const message = String(args.message || '').trim();
        if (!message) return { error: 'Message is required.' };

        const status = args.status ? String(args.status) : undefined;
        const tags = args.tags ? String(args.tags).split(',').map(t => t.trim()).filter(Boolean) : [];
        const delayMs = Math.max(Number(args.delay_ms) || 1500, 1000);
        const userId = String(args._userId || 'default');

        // Fetch contacts from CRM
        const mcpArgs: Record<string, unknown> = { limit: 200 };
        if (status) mcpArgs.status = status;

        const result = await callWorkspaceMcp('list_contacts', mcpArgs, traceId, userId);
        let contacts = Array.isArray(result) ? result : [];

        // Tag filter
        if (tags.length > 0) {
          contacts = contacts.filter((c: Record<string, unknown>) => {
            const contactTags = Array.isArray(c.tags) ? c.tags as string[] : [];
            return tags.some(t => contactTags.includes(t));
          });
        }

        // Only contacts with phone numbers
        const recipients = contacts
          .filter((c: Record<string, unknown>) => !!c.phone)
          .slice(0, 200);

        if (recipients.length === 0) {
          return { error: 'No contacts with phone numbers matched the filters.' };
        }

        let sent = 0;
        let failed = 0;
        const skipped = contacts.length - recipients.length;

        for (const contact of recipients) {
          const c = contact as Record<string, unknown>;
          const phone = String(c.phone).replace(/[\s\-()]/g, '');
          const name = String(c.name || c.full_name || '');
          const personalizedMsg = message.replace(/\{\{name\}\}/g, name);

          try {
            const res = await fetch(`${WA_CONNECTOR_URL}/outbound/send`, {
              method: 'POST',
              headers: serviceHeaders,
              body: JSON.stringify({ phone, message: personalizedMsg, userId }),
              signal: AbortSignal.timeout(15_000),
            });
            if (res.ok) sent++;
            else failed++;
          } catch {
            failed++;
          }

          if (sent + failed < recipients.length) {
            await sleep(delayMs);
          }
        }

        // Log the broadcast
        const entry: BroadcastLogEntry = {
          id: traceId || `bc_${Date.now()}`,
          message: message.slice(0, 200),
          sent,
          failed,
          skipped,
          total: recipients.length,
          filters: { status, tags },
          createdAt: new Date().toISOString(),
        };
        broadcastLog.push(entry);
        if (broadcastLog.length > MAX_LOG_SIZE) broadcastLog.splice(0, broadcastLog.length - MAX_LOG_SIZE);

        return {
          status: 'completed',
          sent,
          failed,
          skipped_no_phone: skipped,
          total_recipients: recipients.length,
          message: `📢 Broadcast complete: ${sent} sent, ${failed} failed, ${skipped} skipped (no phone)`,
        };
      },
    },

    // ── broadcast_history ──
    {
      name: 'broadcast_history',
      description: 'View recent broadcast send logs — shows who received what, when.',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Number of recent broadcasts to show (default: 10)',
          },
        },
      },
      riskLevel: 'low',
      execute: async (args) => {
        const limit = Math.min(Number(args.limit) || 10, 50);
        const recent = broadcastLog.slice(-limit).reverse();

        if (recent.length === 0) {
          return { message: 'No broadcast history yet.' };
        }

        return {
          total_broadcasts: broadcastLog.length,
          recent: recent.map(e => ({
            id: e.id,
            message: e.message,
            sent: e.sent,
            failed: e.failed,
            skipped: e.skipped,
            date: e.createdAt,
          })),
        };
      },
    },

    // ── autoreply_get ──
    {
      name: 'autoreply_get',
      description: 'Get the current WhatsApp auto-reply configuration (message, enabled, cooldown).',
      parameters: {
        type: 'object',
        properties: {},
      },
      riskLevel: 'low',
      execute: async (args) => {
        const userId = String(args._userId || 'default');
        try {
          const res = await fetch(`${WA_CONNECTOR_URL}/whatsapp/sessions/${userId}/auto-reply`, {
            headers: serviceHeaders,
            signal: AbortSignal.timeout(10_000),
          });
          if (res.ok) return await res.json();
          return { error: `Failed to get auto-reply config (${res.status})` };
        } catch (err) {
          return { error: `Connector unreachable: ${(err as Error).message}` };
        }
      },
    },

    // ── autoreply_set ──
    {
      name: 'autoreply_set',
      description:
        'Update WhatsApp auto-reply settings. Can enable/disable, change message, or adjust cooldown. ' +
        'Message supports {{owner}} placeholder (replaced with owner name).',
      parameters: {
        type: 'object',
        properties: {
          enabled: {
            type: 'boolean',
            description: 'Enable or disable auto-reply',
          },
          message: {
            type: 'string',
            description: 'Auto-reply message text. Use {{owner}} for owner name.',
          },
          cooldown_minutes: {
            type: 'number',
            description: 'Cooldown between auto-replies to same contact in minutes (min: 5)',
          },
          owner_name: {
            type: 'string',
            description: 'Owner name for {{owner}} placeholder',
          },
        },
      },
      riskLevel: 'medium',
      execute: async (args) => {
        const userId = String(args._userId || 'default');
        const body: Record<string, unknown> = {};
        if (typeof args.enabled === 'boolean') body.enabled = args.enabled;
        if (args.message) body.message = String(args.message);
        if (args.cooldown_minutes) body.cooldownMs = Math.max(Number(args.cooldown_minutes), 5) * 60 * 1000;
        if (args.owner_name) body.ownerName = String(args.owner_name);

        try {
          const res = await fetch(`${WA_CONNECTOR_URL}/whatsapp/sessions/${userId}/auto-reply`, {
            method: 'PUT',
            headers: serviceHeaders,
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(10_000),
          });
          if (res.ok) {
            const config = await res.json();
            return { status: 'updated', config };
          }
          return { error: `Failed to update auto-reply (${res.status})` };
        } catch (err) {
          return { error: `Connector unreachable: ${(err as Error).message}` };
        }
      },
    },
  ];
}
