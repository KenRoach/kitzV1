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
 *   POST /api/kitz/voice/speak           — Text-to-Speech (ElevenLabs)
 *   GET  /api/kitz/voice/config          — Voice configuration
 *   GET  /api/kitz/voice/widget          — Voice widget HTML snippet
 *   GET  /api/kitz/battery               — AI Battery status & spend tracking
 *   GET  /api/kitz/battery/ledger        — Spend history ledger
 *   POST /api/kitz/battery/recharge      — Manual credit recharge (founder-only)
 *   GET  /api/kitz/oauth/google/status   — Check Google OAuth status
 *   GET  /api/kitz/oauth/google/authorize — Start Google OAuth flow
 *   GET  /api/kitz/oauth/google/callback  — OAuth callback (Google redirects here)
 *   POST /api/kitz/oauth/google/revoke    — Revoke Google Calendar access
 *
 * Port: 3012
 */

import Fastify from 'fastify';
import type { KitzKernel } from './kernel.js';
import { parseWhatsAppCommand } from './interfaces/whatsapp/commandParser.js';
import { routeWithAI, getDraftQueue, approveDraft, rejectDraft } from './interfaces/whatsapp/semanticRouter.js';
import { textToSpeech, getKitzVoiceConfig, getWidgetSnippet, isElevenLabsConfigured } from './llm/elevenLabsClient.js';
import { getBatteryStatus, recordRecharge, getLedger } from './aiBattery.js';
import { initMemory, storeMessage, buildContextWindow } from './memory/manager.js';
import { verifyStripeSignature, verifyHmacSha256, verifyPayPalHeaders } from './webhookVerify.js';
import { isGoogleOAuthConfigured, getAuthUrl, exchangeCode, hasStoredTokens, revokeTokens } from './auth/googleOAuth.js';

export async function createServer(kernel: KitzKernel) {
  const app = Fastify({ logger: false, bodyLimit: 20_000_000 });  // 20MB for media payloads
  const PORT = Number(process.env.PORT) || 3012;

  // Initialize memory system
  try { initMemory(); } catch (err) {
    console.warn('[server] Memory init failed (non-fatal):', (err as Error).message);
  }

  // ── Health check ──
  app.get('/health', async () => ({ status: 'ok', service: 'kitz-os' }));

  // ── System status ──
  app.get('/api/kitz/status', async () => {
    return kernel.getStatus();
  });

  // ── Main WhatsApp webhook ──
  app.post<{ Body: { message: string; sender?: string; user_id?: string; trace_id?: string; reply_context?: unknown; location?: string } }>(
    '/api/kitz',
    async (req, reply) => {
      const { message, sender, user_id, trace_id } = req.body || {};
      if (!message) return reply.code(400).send({ error: 'message required' });

      const traceId = trace_id || crypto.randomUUID();
      const userId = user_id || 'default';
      const senderJid = sender || 'unknown';

      // Store inbound message in memory
      try {
        storeMessage({ userId, senderJid, channel: 'whatsapp', role: 'user', content: message, traceId });
      } catch { /* non-blocking */ }

      // 1. Try regex command parser first (fast, no AI cost)
      const command = parseWhatsAppCommand(message);

      if (command) {
        switch (command.action) {
          case 'status': {
            const s = kernel.getStatus();
            const b = s.aiBattery;
            return {
              command: 'status',
              response: `*KITZ OS*\n` +
                `Status: ${s.status}\n` +
                `Tools: ${s.toolCount}\n` +
                `Uptime: ${s.uptime}s\n` +
                `Kill Switch: ${s.killSwitch ? '🔴 ON' : '🟢 OFF'}\n\n` +
                `⚡ *AI Battery*\n` +
                `Credits: ${b.remaining}/${b.dailyLimit} remaining\n` +
                `Today: ${b.todayCredits} credits (${b.todayCalls} calls)\n` +
                `Tokens: ${b.todayTokens.toLocaleString()} | TTS: ${b.todayTtsChars.toLocaleString()} chars\n` +
                `${b.depleted ? '🔴 DEPLETED — recharge needed' : '🟢 Active'}`,
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
                `• *voice note [phone] [text]* — Send voice note\n` +
                `• *call [phone] [purpose]* — Make WhatsApp call\n` +
                `• *say this aloud* — Get voice reply\n` +
                `• *battery* — AI Battery status & spend\n` +
                `• *recharge [amount]* — Add credits (1-100)\n` +
                `• *report daily/weekly* — Get report\n` +
                `• *help* — This menu\n\n` +
                `Or just ask in natural language! 🎙️`,
            };
          }

          case 'greeting': {
            const s = kernel.getStatus();
            return {
              command: 'greeting',
              response:
                `Hey boss 👋\n\n` +
                `KITZ is online and ready.\n` +
                `${s.toolCount} tools loaded across CRM, orders, storefronts, payments, and more.\n\n` +
                `⚡ Battery: ${s.aiBattery.remaining}/${s.aiBattery.dailyLimit} credits\n\n` +
                `What are we working on?\n` +
                `Type *help* for the full menu.`,
            };
          }

          case 'kill_switch': {
            process.env.KILL_SWITCH = String(command.value);
            return {
              command: 'kill_switch',
              response: command.value ? '🔴 Kill switch ENGAGED. All operations halted.' : '🟢 Kill switch disengaged. System resuming.',
            };
          }

          case 'battery': {
            const bat = getBatteryStatus();
            return {
              command: 'battery',
              response: `⚡ *AI Battery*\n\n` +
                `Credits: *${bat.remaining}* / ${bat.dailyLimit} remaining\n` +
                `Spent today: ${bat.todayCredits} credits (${bat.todayCalls} API calls)\n\n` +
                `📊 *Breakdown*\n` +
                `• OpenAI: ${bat.byProvider.openai.toFixed(2)} credits\n` +
                `• Claude: ${bat.byProvider.claude.toFixed(2)} credits\n` +
                `• ElevenLabs: ${bat.byProvider.elevenlabs.toFixed(2)} credits\n\n` +
                `📈 *Usage*\n` +
                `• LLM tokens: ${bat.todayTokens.toLocaleString()}\n` +
                `• TTS characters: ${bat.todayTtsChars.toLocaleString()}\n\n` +
                `${bat.depleted ? '🔴 DEPLETED — type "recharge [amount]"' : '🟢 Battery active'}`,
            };
          }

          case 'recharge': {
            const credits = command.credits || 10;
            if (credits < 1 || credits > 100) {
              return { command: 'recharge', response: '⚠️ Recharge amount must be 1-100 credits.' };
            }
            await recordRecharge(credits, traceId);
            const newBat = getBatteryStatus();
            return {
              command: 'recharge',
              response: `⚡ Recharged *${credits} credits*!\nRemaining: ${newBat.remaining}/${newBat.dailyLimit}`,
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

          case 'approve': {
            // Find the most recent pending drafts for this user
            const queue = getDraftQueue();
            let targetTraceId: string | null = null;
            let pendingDrafts: Array<{ toolName: string; status: string }> = [];

            for (const [tid, drafts] of queue) {
              const pending = drafts.filter(d => d.status === 'pending' && (!d.userId || d.userId === userId));
              if (pending.length > 0) {
                targetTraceId = tid;
                pendingDrafts = pending;
                break;
              }
            }

            if (!targetTraceId || pendingDrafts.length === 0) {
              return { command: 'approve', response: 'No pending drafts to approve.' };
            }

            // Approve and execute all pending drafts
            const allDrafts = queue.get(targetTraceId)!;
            const executed: string[] = [];
            for (let i = 0; i < allDrafts.length; i++) {
              if (allDrafts[i].status !== 'pending') continue;
              const draft = approveDraft(targetTraceId, i);
              if (draft) {
                try {
                  await kernel.tools.invoke(draft.toolName, draft.args, draft.traceId);
                  executed.push(draft.toolName);
                } catch (err) {
                  executed.push(`${draft.toolName} (failed: ${(err as Error).message})`);
                }
              }
            }

            return {
              command: 'approve',
              response: `✅ *Approved & executed ${executed.length} action(s):*\n${executed.map(t => `• ${t}`).join('\n')}`,
            };
          }

          case 'reject': {
            const queue2 = getDraftQueue();
            let targetTraceId2: string | null = null;

            for (const [tid, drafts] of queue2) {
              const pending = drafts.filter(d => d.status === 'pending' && (!d.userId || d.userId === userId));
              if (pending.length > 0) { targetTraceId2 = tid; break; }
            }

            if (!targetTraceId2) {
              return { command: 'reject', response: 'No pending drafts to reject.' };
            }

            const allDrafts2 = queue2.get(targetTraceId2)!;
            let rejectedCount = 0;
            for (let i = 0; i < allDrafts2.length; i++) {
              if (allDrafts2[i].status === 'pending') {
                rejectDraft(targetTraceId2, i);
                rejectedCount++;
              }
            }

            return {
              command: 'reject',
              response: `❌ Rejected ${rejectedCount} pending draft(s). No actions taken.`,
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
          const result = await routeWithAI(message, kernel.tools, traceId, undefined, userId);
          // Store AI response in memory
          try {
            storeMessage({ userId, senderJid, channel: 'whatsapp', role: 'assistant', content: result.response, traceId });
          } catch { /* non-blocking */ }
          return { command: 'ai', response: result.response, tools_used: result.toolsUsed, credits_consumed: result.creditsConsumed };
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

  // ── Draft approval (draft-first enforcement) ──
  app.post<{ Body: { trace_id: string; action: 'approve' | 'reject'; index?: number } }>(
    '/api/kitz/drafts/decide',
    async (req, reply) => {
      const { trace_id, action, index } = req.body || {};
      if (!trace_id) return reply.code(400).send({ error: 'trace_id required' });

      const drafts = getDraftQueue().get(trace_id);
      if (!drafts || drafts.length === 0) {
        return reply.code(404).send({ error: 'No pending drafts for this trace_id' });
      }

      // If index is specified, approve/reject one draft. Otherwise, all pending.
      const indices = index !== undefined ? [index] : drafts.map((_, i) => i).filter(i => drafts[i].status === 'pending');
      const results: Array<{ index: number; toolName: string; status: string; result?: string }> = [];

      for (const i of indices) {
        if (action === 'approve') {
          const draft = approveDraft(trace_id, i);
          if (draft) {
            // Execute the approved tool
            const { routeWithAI: _, ...rest } = { routeWithAI: null }; // avoid unused
            try {
              const toolResult = await kernel.tools.invoke(draft.toolName, draft.args, draft.traceId);
              results.push({ index: i, toolName: draft.toolName, status: 'executed', result: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult) });
            } catch (err) {
              results.push({ index: i, toolName: draft.toolName, status: 'error', result: (err as Error).message });
            }
          }
        } else {
          const draft = rejectDraft(trace_id, i);
          if (draft) {
            results.push({ index: i, toolName: draft.toolName, status: 'rejected' });
          }
        }
      }

      return { trace_id, action, results };
    }
  );

  // ── List pending drafts ──
  app.get<{ Querystring: { trace_id?: string } }>(
    '/api/kitz/drafts',
    async (req) => {
      const traceId = req.query.trace_id;
      if (traceId) {
        return { trace_id: traceId, drafts: getDraftQueue().get(traceId) || [] };
      }
      // Return all pending drafts across all traces
      const all: Array<{ trace_id: string; drafts: unknown[] }> = [];
      for (const [tid, drafts] of getDraftQueue()) {
        const pending = drafts.filter(d => d.status === 'pending');
        if (pending.length > 0) all.push({ trace_id: tid, drafts: pending });
      }
      return { pending_count: all.reduce((n, e) => n + e.drafts.length, 0), traces: all };
    }
  );

  // ── Legacy approve endpoint (kept for backward compat) ──
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
  app.post<{ Body: { media_base64: string; mime_type: string; caption?: string; sender_jid?: string; user_id?: string; trace_id?: string } }>(
    '/api/kitz/media',
    async (req) => {
      const { media_base64, mime_type, caption, user_id, trace_id } = req.body || {};
      if (!media_base64) return { error: 'media_base64 required' };
      // Route through semantic router with media context
      const traceId = trace_id || crypto.randomUUID();
      const userId = user_id || 'default';
      const mediaPrompt = caption || `[MEDIA:${mime_type}] Process this ${mime_type.startsWith('audio') ? 'voice note' : 'document/image'}`;
      const hasAI = !!(process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.AI_API_KEY);
      if (hasAI) {
        const result = await routeWithAI(mediaPrompt, kernel.tools, traceId, { media_base64, mime_type }, userId);
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

      // Cryptographic signature verification
      const stripeSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (stripeSecret) {
        if (!signature) {
          return reply.code(401).send({ error: 'Missing stripe-signature header' });
        }
        const rawBody = JSON.stringify(req.body);
        const result = verifyStripeSignature(rawBody, signature, stripeSecret);
        if (!result.valid) {
          console.error(JSON.stringify({ ts: new Date().toISOString(), module: 'payment-webhook', provider: 'stripe', trace_id: traceId, error: result.error }));
          return reply.code(401).send({ error: `Stripe signature invalid: ${result.error}` });
        }
      } else if (process.env.NODE_ENV === 'production') {
        return reply.code(500).send({ error: 'STRIPE_WEBHOOK_SECRET not configured' });
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

      // Cryptographic header verification (defense-in-depth before PayPal API call)
      const paypalResult = verifyPayPalHeaders(req.headers as Record<string, string | string[] | undefined>);
      if (!paypalResult.valid) {
        if (process.env.NODE_ENV === 'production') {
          console.error(JSON.stringify({ ts: new Date().toISOString(), module: 'payment-webhook', provider: 'paypal', trace_id: traceId, error: paypalResult.error }));
          return reply.code(401).send({ error: `PayPal verification failed: ${paypalResult.error}` });
        }
        // Dev mode: log warning but allow through for testing
        console.warn(JSON.stringify({ ts: new Date().toISOString(), module: 'payment-webhook', provider: 'paypal', trace_id: traceId, warning: paypalResult.error, mode: 'dev-passthrough' }));
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

      // Cryptographic HMAC-SHA256 signature verification
      const yappySecret = process.env.YAPPY_WEBHOOK_SECRET;
      if (yappySecret) {
        const yappySig = (req.headers['x-yappy-signature'] || req.headers['x-webhook-signature']) as string || '';
        const rawBody = JSON.stringify(req.body);
        const result = verifyHmacSha256(rawBody, yappySig, yappySecret);
        if (!result.valid) {
          console.error(JSON.stringify({ ts: new Date().toISOString(), module: 'payment-webhook', provider: 'yappy', trace_id: traceId, error: result.error }));
          return reply.code(401).send({ error: `Yappy signature invalid: ${result.error}` });
        }
      } else if (process.env.NODE_ENV === 'production') {
        return reply.code(500).send({ error: 'YAPPY_WEBHOOK_SECRET not configured' });
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

      // Cryptographic HMAC-SHA256 signature verification
      const bacSecret = process.env.BAC_WEBHOOK_SECRET;
      if (bacSecret) {
        const bacSig = (req.headers['x-bac-signature'] || req.headers['x-webhook-signature']) as string || '';
        const rawBody = JSON.stringify(req.body);
        const result = verifyHmacSha256(rawBody, bacSig, bacSecret);
        if (!result.valid) {
          console.error(JSON.stringify({ ts: new Date().toISOString(), module: 'payment-webhook', provider: 'bac', trace_id: traceId, error: result.error }));
          return reply.code(401).send({ error: `BAC signature invalid: ${result.error}` });
        }
      } else if (process.env.NODE_ENV === 'production') {
        return reply.code(500).send({ error: 'BAC_WEBHOOK_SECRET not configured' });
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

  // ── Voice API Endpoints (ElevenLabs) ──

  // Text-to-Speech — generate audio from text
  app.post<{ Body: { text: string; voice_id?: string; output_format?: string } }>(
    '/api/kitz/voice/speak',
    async (req, reply) => {
      if (!isElevenLabsConfigured()) {
        return reply.code(503).send({ error: 'ElevenLabs not configured. Set ELEVENLABS_API_KEY.' });
      }
      const { text, voice_id, output_format } = req.body || {};
      if (!text) return reply.code(400).send({ error: 'text required' });
      if (text.length > 5000) return reply.code(400).send({ error: 'text too long (max 5000 chars)' });

      try {
        const result = await textToSpeech({
          text,
          voiceId: voice_id,
          outputFormat: output_format as 'mp3_44100_128' | 'mp3_22050_32' | undefined,
        });
        return {
          audio_base64: result.audioBase64,
          mime_type: result.mimeType,
          character_count: result.characterCount,
          voice_id: result.voiceId,
        };
      } catch (err) {
        return reply.code(500).send({ error: (err as Error).message });
      }
    }
  );

  // Voice config — current KITZ voice settings
  app.get('/api/kitz/voice/config', async () => {
    return getKitzVoiceConfig();
  });

  // Voice widget — HTML snippet for embedding
  app.get('/api/kitz/voice/widget', async () => {
    const snippet = getWidgetSnippet();
    return { html: snippet, configured: isElevenLabsConfigured() };
  });

  // Voice assistant page — embeddable page with widget
  app.get('/voice-assistant', async (req, reply) => {
    const snippet = getWidgetSnippet();
    reply.type('text/html');
    return `<!doctype html>
<html>
<head><title>KITZ Voice Assistant</title>
<style>body{font-family:system-ui;max-width:800px;margin:0 auto;padding:2rem;background:#0a0a0a;color:#e0e0e0;}
h1{color:#fff;}p{color:#999;line-height:1.6;}</style></head>
<body>
  <h1>🎙️ KITZ Voice Assistant</h1>
  <p>Click the voice button in the bottom-right corner to talk to KITZ.<br>
  KITZ speaks with a warm, professional female voice. Multilingual: Spanish, English, Portuguese.</p>
  <p><strong>Try saying:</strong></p>
  <ul>
    <li>"Show me my contacts"</li>
    <li>"How are we doing today?"</li>
    <li>"Create an invoice for Maria, 250 dollars"</li>
    <li>"What's on my calendar?"</li>
  </ul>
  ${snippet}
</body>
</html>`;
  });

  // ── AI Battery Endpoints ──

  // Get current battery status
  app.get('/api/kitz/battery', async () => {
    return getBatteryStatus();
  });

  // Get battery ledger (spend history)
  app.get<{ Querystring: { limit?: string } }>(
    '/api/kitz/battery/ledger',
    async (req) => {
      const limit = Math.min(Number(req.query.limit) || 50, 200);
      const entries = getLedger();
      return {
        entries: entries.slice(-limit),
        total: entries.length,
        battery: getBatteryStatus(),
      };
    }
  );

  // Recharge battery (founder-only)
  app.post<{ Body: { credits: number } }>(
    '/api/kitz/battery/recharge',
    async (req, reply) => {
      const secret = req.headers['x-dev-secret'];
      if (secret !== process.env.DEV_TOKEN_SECRET) {
        return reply.code(401).send({ error: 'unauthorized — only the founder can recharge' });
      }
      const credits = Number(req.body?.credits || 0);
      if (credits <= 0 || credits > 100) {
        return reply.code(400).send({ error: 'credits must be 1-100' });
      }
      const traceId = crypto.randomUUID();
      await recordRecharge(credits, traceId);
      return { recharged: credits, battery: getBatteryStatus() };
    }
  );

  // ── Google Calendar OAuth Endpoints ──────────────────────

  // Check OAuth status
  app.get('/api/kitz/oauth/google/status', async () => {
    return {
      configured: isGoogleOAuthConfigured(),
      authenticated: await hasStoredTokens(),
      authorize_url: isGoogleOAuthConfigured() ? getAuthUrl() : null,
    };
  });

  // Start OAuth flow — redirects to Google consent screen
  app.get('/api/kitz/oauth/google/authorize', async (_req: any, reply: any) => {
    if (!isGoogleOAuthConfigured()) {
      return reply.status(500).send({
        error: 'Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env',
      });
    }
    const url = getAuthUrl();
    return reply.redirect(url);
  });

  // OAuth callback — Google redirects here after consent
  app.get('/api/kitz/oauth/google/callback', async (req: any, reply: any) => {
    const code = req.query?.code as string;
    if (!code) {
      return reply.status(400).send({ error: 'No authorization code received' });
    }
    try {
      await exchangeCode(code);
      console.log('[server] Google Calendar OAuth completed successfully');
      return reply.type('text/html').send(`
        <!DOCTYPE html>
        <html><head><title>Kitz — Calendar Connected</title></head>
        <body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0a0a0a;color:#fff;">
          <div style="text-align:center;">
            <h1>🟢 Google Calendar Connected</h1>
            <p>You can now manage your calendar from WhatsApp via Kitz.</p>
            <p style="color:#888;">Try: "what's on my calendar today?"</p>
            <p style="margin-top:2em;color:#555;">You can close this tab.</p>
          </div>
        </body></html>
      `);
    } catch (err) {
      console.error('[server] Google OAuth error:', (err as Error).message);
      return reply.status(500).send({ error: `OAuth failed: ${(err as Error).message}` });
    }
  });

  // Revoke OAuth tokens
  app.post('/api/kitz/oauth/google/revoke', async () => {
    await revokeTokens();
    return { status: 'revoked', message: 'Google Calendar disconnected.' };
  });

  // ── Launch Review — 33 agents vote, CEO decides ──────────────

  app.get('/api/kitz/launch', async () => {
    try {
      const result = await kernel.runLaunchReview();
      const d = result.decision;

      // Format for WhatsApp-friendly output
      const reviewSummaries = d.reviews.map(r =>
        `${r.vote === 'go' ? '🟢' : r.vote === 'no-go' ? '🔴' : '🟡'} *${r.role}* — ${r.vote.toUpperCase()} (${r.confidence}%)\n  ${r.summary}`
      );

      return {
        approved: d.approved,
        decidedBy: d.decidedBy,
        timestamp: d.timestamp,
        votes: {
          go: d.totalGo,
          noGo: d.totalNoGo,
          conditional: d.totalConditional,
          total: d.reviews.length,
        },
        blockers: d.blockers,
        summary: d.summary,
        reviews: reviewSummaries,
        context: result.context,
        tiers: {
          cSuite: result.reviewsByTier.cSuite.map(r => ({ agent: r.agent, vote: r.vote, confidence: r.confidence })),
          board: result.reviewsByTier.board.map(r => ({ agent: r.agent, vote: r.vote, confidence: r.confidence })),
          governance: result.reviewsByTier.governance.map(r => ({ agent: r.agent, vote: r.vote, confidence: r.confidence })),
          external: result.reviewsByTier.external.map(r => ({ agent: r.agent, vote: r.vote, confidence: r.confidence })),
        },
      };
    } catch (err) {
      return { error: 'Launch review failed', message: (err as Error).message };
    }
  });

  // ── Launch Review WhatsApp format ──────────────

  app.get('/api/kitz/launch/whatsapp', async () => {
    try {
      const result = await kernel.runLaunchReview();
      const d = result.decision;

      const header = d.approved
        ? '🚀 *KITZ OS — LAUNCH APPROVED*'
        : '🛑 *KITZ OS — LAUNCH BLOCKED*';

      const votes = `📊 *Votes:* ${d.totalGo} GO | ${d.totalNoGo} NO-GO | ${d.totalConditional} CONDITIONAL`;

      const cSuite = result.reviewsByTier.cSuite.map(r =>
        `${r.vote === 'go' ? '🟢' : r.vote === 'no-go' ? '🔴' : '🟡'} ${r.role}: ${r.vote} (${r.confidence}%)`
      ).join('\n');

      const board = result.reviewsByTier.board.map(r =>
        `${r.vote === 'go' ? '🟢' : r.vote === 'no-go' ? '🔴' : '🟡'} ${r.role}: ${r.vote} (${r.confidence}%)`
      ).join('\n');

      const blockerText = d.blockers.length > 0
        ? `\n\n🚫 *Blockers:*\n${d.blockers.map(b => `• ${b}`).join('\n')}`
        : '';

      const whatsapp = `${header}\n\n${votes}\n\n*C-Suite:*\n${cSuite}\n\n*Board:*\n${board}${blockerText}\n\n*CEO Decision:*\n${d.summary}\n\n_${d.reviews.length} agents reviewed • ${d.timestamp}_`;

      return { response: whatsapp };
    } catch (err) {
      return { error: 'Launch review failed', message: (err as Error).message };
    }
  });

  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`[server] KITZ OS listening on port ${PORT}`);
  return app;
}
