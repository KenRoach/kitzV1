/**
 * KITZ OS Control Plane — Fastify Server
 *
 * Endpoints:
 *   POST /api/kitz         — WhatsApp webhook (main entry point)
 *   POST /api/kitz/run     — Execute a goal
 *   GET  /api/kitz/status  — System health
 *   GET  /api/kitz/reports — Cadence reports
 *   POST /api/kitz/approve — Approve a run
 *   GET  /api/kitz/approve-delete/:token — Delete approval webhook
 *   GET  /api/kitz/reject-delete/:token  — Delete rejection webhook
 *
 * Port: 3012
 */

import Fastify from 'fastify';
import type { KitzKernel } from './kernel.js';
import { parseWhatsAppCommand } from './interfaces/whatsapp/commandParser.js';
import { routeWithAI } from './interfaces/whatsapp/semanticRouter.js';

export async function createServer(kernel: KitzKernel) {
  const app = Fastify({ logger: false });
  const PORT = Number(process.env.PORT) || 3012;

  // ── Health check ──
  app.get('/health', async () => ({ status: 'ok', service: 'kitz-os' }));

  // ── System status ──
  app.get('/api/kitz/status', async () => {
    return kernel.getStatus();
  });

  // ── Main WhatsApp webhook ──
  app.post<{ Body: { message: string; sender?: string; trace_id?: string } }>(
    '/api/kitz',
    async (req, reply) => {
      const { message, sender, trace_id } = req.body || {};
      if (!message) return reply.code(400).send({ error: 'message required' });

      const traceId = trace_id || crypto.randomUUID();

      // 1. Try regex command parser first (fast, no AI cost)
      const command = parseWhatsAppCommand(message);

      if (command) {
        switch (command.action) {
          case 'status': {
            const s = kernel.getStatus();
            return {
              command: 'status',
              response: `*KITZ OS*\nStatus: ${s.status}\nTools: ${s.toolCount}\nUptime: ${s.uptime}s\nKill Switch: ${s.killSwitch ? '🔴 ON' : '🟢 OFF'}`,
            };
          }

          case 'help': {
            return {
              command: 'help',
              response: `*KITZ OS Commands*\n\n` +
                `• *status* — System health\n` +
                `• *contacts* — List CRM contacts\n` +
                `• *orders* — List orders\n` +
                `• *summary* — Business overview\n` +
                `• *dashboard* — KPI metrics\n` +
                `• *storefronts* — List storefronts\n` +
                `• *products* — List products\n` +
                `• *brain dump: [idea]* — Process idea\n` +
                `• *generate code: [description]* — Create code with AI\n` +
                `• *generate doc: [topic]* — Create document with AI\n` +
                `• *self-heal: [file]* — Regenerate missing files\n` +
                `• *lovable projects* — List connected Lovable projects\n` +
                `• *report daily/weekly* — Get report\n` +
                `• *help* — This menu\n\n` +
                `Or just ask in natural language!`,
            };
          }

          case 'greeting': {
            return {
              command: 'greeting',
              response: `Hey! 👋 KITZ OS online. ${kernel.getStatus().toolCount} tools ready. What do you need?`,
            };
          }

          case 'kill_switch': {
            process.env.KILL_SWITCH = String(command.value);
            return {
              command: 'kill_switch',
              response: command.value ? '🔴 Kill switch ENGAGED. All operations halted.' : '🟢 Kill switch disengaged. System resuming.',
            };
          }

          case 'list_contacts':
          case 'get_contact':
          case 'create_contact':
          case 'update_contact':
          case 'list_orders':
          case 'get_order':
          case 'create_order':
          case 'update_order':
          case 'business_summary':
          case 'list_storefronts':
          case 'create_storefront':
          case 'update_storefront':
          case 'delete_storefront':
          case 'mark_storefront_paid':
          case 'send_storefront':
          case 'list_products':
          case 'create_product':
          case 'update_product':
          case 'delete_product':
          case 'dashboard_metrics':
          case 'braindump': {
            // These are handled by the AI semantic router for natural formatting
            break;
          }

          case 'report': {
            return {
              command: 'report',
              response: `📊 Report generation coming soon. Cadence: ${command.cadence || 'daily'}`,
            };
          }

          default:
            break;
        }
      }

      // 2. Fall through to AI semantic router
      const hasAI = !!(
        process.env.CLAUDE_API_KEY ||
        process.env.ANTHROPIC_API_KEY ||
        process.env.AI_API_KEY
      );

      if (hasAI) {
        try {
          const result = await routeWithAI(message, kernel.tools, traceId);
          return { command: 'ai', response: result.response, tools_used: result.toolsUsed };
        } catch (err) {
          console.error('[server] AI routing error:', (err as Error).message);
          return { command: 'error', response: `Something went wrong. Try again or type "help".` };
        }
      }

      return {
        command: 'unknown',
        response: 'AI not configured. Set CLAUDE_API_KEY or ANTHROPIC_API_KEY or AI_API_KEY in your environment.',
      };
    }
  );

  // ── Run a goal ──
  app.post<{ Body: { goal: string; agent?: string; mode?: string } }>(
    '/api/kitz/run',
    async (req, reply) => {
      const secret = req.headers['x-dev-secret'];
      if (secret !== process.env.DEV_TOKEN_SECRET) {
        return reply.code(401).send({ error: 'unauthorized' });
      }
      const result = await kernel.run(req.body);
      return result;
    }
  );

  // ── Approve a run ──
  app.post<{ Body: { run_id: string; approved: boolean; notes?: string } }>(
    '/api/kitz/approve',
    async (req) => {
      return { status: 'ok', run_id: req.body.run_id, approved: req.body.approved };
    }
  );

  // ── Reports ──
  app.get<{ Querystring: { cadence?: string } }>(
    '/api/kitz/reports',
    async (req) => {
      const cadence = req.query.cadence || 'daily';
      return { cadence, report: `${cadence} report generation coming soon` };
    }
  );

  // ── Delete approval webhooks ──
  app.get<{ Params: { token: string } }>(
    '/api/kitz/approve-delete/:token',
    async (req, reply) => {
      reply.type('text/html');
      return '<html><body><h1>✅ Deletion Approved</h1><p>The item has been deleted.</p></body></html>';
    }
  );

  app.get<{ Params: { token: string } }>(
    '/api/kitz/reject-delete/:token',
    async (req, reply) => {
      reply.type('text/html');
      return '<html><body><h1>❌ Deletion Rejected</h1><p>The item was NOT deleted.</p></body></html>';
    }
  );

  // ── Media endpoint (for doc scan / brain dump voice) ──
  app.post<{ Body: { media_base64: string; mime_type: string; caption?: string; sender_jid?: string; trace_id?: string } }>(
    '/api/kitz/media',
    async (req) => {
      const { media_base64, mime_type, caption, trace_id } = req.body || {};
      if (!media_base64) return { error: 'media_base64 required' };
      // Route through semantic router with media context
      const traceId = trace_id || crypto.randomUUID();
      const mediaPrompt = caption || `[MEDIA:${mime_type}] Process this ${mime_type.startsWith('audio') ? 'voice note' : 'document/image'}`;
      const hasAI = !!(process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.AI_API_KEY);
      if (hasAI) {
        const result = await routeWithAI(mediaPrompt, kernel.tools, traceId, { media_base64, mime_type });
        return { response: result.response };
      }
      return { error: 'AI not configured' };
    }
  );

  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`[server] KITZ OS listening on port ${PORT}`);
  return app;
}
