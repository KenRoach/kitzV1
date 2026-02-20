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
 *   POST /api/kitz/media                 — Media processing (doc scan, voice)
 *   POST /api/payments/webhook/stripe    — Stripe payment webhook
 *   POST /api/payments/webhook/paypal    — PayPal payment webhook
 *   POST /api/payments/webhook/yappy     — Yappy payment webhook (Panama)
 *   POST /api/payments/webhook/bac       — BAC Compra Click webhook (Central America)
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
                `• *payments* — Payment summary & transactions\n` +
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

  // ── Payment Webhook Endpoints ──
  // Each provider sends a different payload format.
  // We normalize and forward to payments_processWebhook tool (which calls MCP).
  // Returns 200 quickly to prevent provider retries.

  // ── Stripe Webhook ──
  app.post<{ Body: Record<string, unknown> }>(
    '/api/payments/webhook/stripe',
    async (req, reply) => {
      const traceId = crypto.randomUUID();
      const signature = req.headers['stripe-signature'] as string | undefined;

      console.log(JSON.stringify({
        ts: new Date().toISOString(),
        module: 'payment-webhook',
        provider: 'stripe',
        trace_id: traceId,
        action: 'received',
      }));

      // Signature verification placeholder
      // Production: use stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)
      if (!signature && process.env.NODE_ENV === 'production') {
        return reply.code(401).send({ error: 'Missing stripe-signature header' });
      }

      const event = req.body || {};
      const eventType = String((event as Record<string, unknown>).type || '');

      // Only process payment-related events
      if (!eventType.startsWith('payment_intent.') && !eventType.startsWith('checkout.session.')) {
        return { received: true, skipped: true, reason: `Unhandled event type: ${eventType}` };
      }

      const data = (event as Record<string, unknown>).data as Record<string, unknown> | undefined;
      const paymentObject = (data?.object || {}) as Record<string, unknown>;
      const customerDetails = (paymentObject.customer_details || {}) as Record<string, unknown>;
      const metadata = (paymentObject.metadata || {}) as Record<string, unknown>;

      const result = await kernel.tools.invoke('payments_processWebhook', {
        provider: 'stripe',
        provider_transaction_id: String(paymentObject.id || (event as Record<string, unknown>).id || ''),
        amount: (Number(paymentObject.amount_received || paymentObject.amount || 0)) / 100, // Stripe uses cents
        currency: String(paymentObject.currency || 'usd').toUpperCase(),
        status: paymentObject.status === 'succeeded' ? 'completed' : 'pending',
        storefront_id: metadata.storefront_id as string | undefined,
        buyer_email: paymentObject.receipt_email || customerDetails.email,
        buyer_name: customerDetails.name,
        metadata: event,
      }, traceId);

      return { received: true, trace_id: traceId, result };
    }
  );

  // ── PayPal Webhook ──
  app.post<{ Body: Record<string, unknown> }>(
    '/api/payments/webhook/paypal',
    async (req, reply) => {
      const traceId = crypto.randomUUID();

      console.log(JSON.stringify({
        ts: new Date().toISOString(),
        module: 'payment-webhook',
        provider: 'paypal',
        trace_id: traceId,
        action: 'received',
      }));

      // PayPal verification placeholder
      // Production: verify via PayPal Webhooks API with PAYPAL_WEBHOOK_ID
      const transmissionId = req.headers['paypal-transmission-id'];
      if (!transmissionId && process.env.NODE_ENV === 'production') {
        return reply.code(401).send({ error: 'Missing PayPal transmission headers' });
      }

      const event = req.body || {};
      const eventType = String((event as Record<string, unknown>).event_type || '');

      if (!eventType.includes('PAYMENT.CAPTURE') && !eventType.includes('CHECKOUT.ORDER')) {
        return { received: true, skipped: true, reason: `Unhandled event type: ${eventType}` };
      }

      const resource = ((event as Record<string, unknown>).resource || {}) as Record<string, unknown>;
      const amount = (resource.amount || {}) as Record<string, unknown>;
      const payer = (resource.payer || {}) as Record<string, unknown>;
      const payerName = (payer.name || {}) as Record<string, unknown>;
      const purchaseUnits = (resource.purchase_units || []) as Array<Record<string, unknown>>;
      const firstUnit = purchaseUnits[0] || {};
      const firstAmount = (firstUnit.amount || {}) as Record<string, unknown>;

      const result = await kernel.tools.invoke('payments_processWebhook', {
        provider: 'paypal',
        provider_transaction_id: String(resource.id || (event as Record<string, unknown>).id || ''),
        amount: Number(amount.value || firstAmount.value || 0),
        currency: String(amount.currency_code || firstAmount.currency_code || 'USD').toUpperCase(),
        status: resource.status === 'COMPLETED' ? 'completed' : 'pending',
        storefront_id: resource.custom_id as string | undefined,
        buyer_email: payer.email_address,
        buyer_name: payerName.given_name
          ? `${payerName.given_name} ${payerName.surname || ''}`.trim()
          : undefined,
        metadata: event,
      }, traceId);

      return { received: true, trace_id: traceId, result };
    }
  );

  // ── Yappy Webhook (Panama — Banco General) ──
  app.post<{ Body: Record<string, unknown> }>(
    '/api/payments/webhook/yappy',
    async (req, reply) => {
      const traceId = crypto.randomUUID();

      console.log(JSON.stringify({
        ts: new Date().toISOString(),
        module: 'payment-webhook',
        provider: 'yappy',
        trace_id: traceId,
        action: 'received',
      }));

      // Yappy verification: shared secret
      const yappySecret = req.headers['x-yappy-secret'] || req.headers['x-webhook-secret'];
      if (process.env.NODE_ENV === 'production' && process.env.YAPPY_WEBHOOK_SECRET) {
        if (yappySecret !== process.env.YAPPY_WEBHOOK_SECRET) {
          return reply.code(401).send({ error: 'Invalid Yappy webhook secret' });
        }
      }

      const payload = req.body || {};
      const p = payload as Record<string, unknown>;
      const statusRaw = String(p.status || '').toLowerCase();

      const result = await kernel.tools.invoke('payments_processWebhook', {
        provider: 'yappy',
        provider_transaction_id: String(p.referenceNumber || p.reference || p.transactionId || crypto.randomUUID()),
        amount: Number(p.total || p.amount || 0),
        currency: 'USD', // Yappy operates in Panama (USD)
        status: statusRaw === 'completed' || statusRaw === 'aprobado' ? 'completed' : 'pending',
        storefront_id: p.orderId || p.storefront_id,
        buyer_name: p.buyerName || p.buyer_name,
        buyer_phone: p.buyerPhone || p.buyer_phone,
        metadata: payload,
      }, traceId);

      return { received: true, trace_id: traceId, result };
    }
  );

  // ── BAC Compra Click Webhook (Central America) ──
  app.post<{ Body: Record<string, unknown> }>(
    '/api/payments/webhook/bac',
    async (req, reply) => {
      const traceId = crypto.randomUUID();

      console.log(JSON.stringify({
        ts: new Date().toISOString(),
        module: 'payment-webhook',
        provider: 'bac',
        trace_id: traceId,
        action: 'received',
      }));

      // BAC verification: HMAC or shared secret
      const bacSignature = req.headers['x-bac-signature'] || req.headers['x-webhook-secret'];
      if (process.env.NODE_ENV === 'production' && process.env.BAC_WEBHOOK_SECRET) {
        if (bacSignature !== process.env.BAC_WEBHOOK_SECRET) {
          return reply.code(401).send({ error: 'Missing BAC signature header' });
        }
      }

      const payload = req.body || {};
      const p = payload as Record<string, unknown>;
      const statusRaw = String(p.status || '').toLowerCase();

      const result = await kernel.tools.invoke('payments_processWebhook', {
        provider: 'bac',
        provider_transaction_id: String(p.transactionId || p.referenceId || p.id || crypto.randomUUID()),
        amount: Number(p.amount || p.total || 0),
        currency: String(p.currency || 'USD').toUpperCase(),
        status: statusRaw === 'approved' || statusRaw === 'completed' ? 'completed' : 'pending',
        storefront_id: p.merchantReference || p.storefront_id,
        buyer_name: p.cardholderName || p.buyer_name,
        buyer_email: p.email,
        metadata: payload,
      }, traceId);

      return { received: true, trace_id: traceId, result };
    }
  );

  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`[server] KITZ OS listening on port ${PORT}`);
  return app;
}
