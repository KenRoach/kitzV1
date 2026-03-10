/**
 * Payment Receiver Tools — Webhook processing + query via workspace MCP.
 *
 * 4 tools:
 *   - payments_processWebhook  (DIRECT_EXECUTE, high)  — normalize & persist incoming payment
 *   - payments_listTransactions (MCP-mapped, low)       — query transaction history
 *   - payments_getTransaction   (MCP-mapped, low)       — single transaction detail
 *   - payments_summary          (DIRECT_EXECUTE, low)   — aggregate revenue stats
 *
 * Receive-only policy: amount must be positive. No outbound payments.
 */

import { createSubsystemLogger } from 'kitz-schemas';
import { callWorkspaceMcp } from './mcpClient.js';
import type { ToolSchema } from './registry.js';

const log = createSubsystemLogger('paymentTools');

export function getAllPaymentTools(): ToolSchema[] {
  return [
    // ── 1. Process Webhook ──
    {
      name: 'payments_processWebhook',
      description:
        'Process an incoming payment webhook. Inserts payment transaction, optionally marks storefront paid. Idempotent — safe to call twice with same provider_transaction_id.',
      parameters: {
        type: 'object',
        properties: {
          provider: {
            type: 'string',
            enum: ['stripe', 'paypal', 'yappy', 'bac'],
            description: 'Payment provider',
          },
          provider_transaction_id: {
            type: 'string',
            description: 'Unique transaction ID from the provider (e.g., Stripe pi_xxx, Yappy reference)',
          },
          amount: {
            type: 'number',
            description: 'Payment amount in dollars (positive only — receive-only policy)',
          },
          currency: {
            type: 'string',
            description: 'ISO currency code (default: USD)',
          },
          status: {
            type: 'string',
            enum: ['pending', 'completed', 'failed', 'refunded'],
            description: 'Payment status',
          },
          storefront_id: {
            type: 'string',
            description: 'Optional storefront ID — if provided, triggers mark_storefront_paid on completion',
          },
          buyer_name: { type: 'string' },
          buyer_email: { type: 'string' },
          buyer_phone: { type: 'string' },
          metadata: {
            type: 'object',
            description: 'Raw provider webhook payload (stored for debugging)',
          },
        },
        required: ['provider', 'provider_transaction_id', 'amount', 'status'],
      },
      riskLevel: 'high',
      execute: async (args, traceId) => {
        // Enforce receive-only: amount must be positive
        const amount = Number(args.amount);
        if (!amount || amount <= 0) {
          return { error: 'Amount must be positive. Receive-only policy: agents can only receive money.' };
        }

        return callWorkspaceMcp(
          'process_payment_webhook',
          {
            provider: args.provider,
            provider_transaction_id: args.provider_transaction_id,
            amount,
            currency: args.currency || 'USD',
            status: args.status,
            storefront_id: args.storefront_id,
            buyer_name: args.buyer_name,
            buyer_email: args.buyer_email,
            buyer_phone: args.buyer_phone,
            metadata: args.metadata || {},
          },
          traceId,
        );
      },
    },

    // ── 2. List Transactions ──
    {
      name: 'payments_listTransactions',
      description:
        'List payment transactions with optional filters. Returns provider, amount, status, buyer, and linked storefront/order info.',
      parameters: {
        type: 'object',
        properties: {
          provider: {
            type: 'string',
            enum: ['stripe', 'paypal', 'yappy', 'bac'],
            description: 'Filter by provider',
          },
          status: {
            type: 'string',
            enum: ['pending', 'completed', 'failed', 'refunded'],
            description: 'Filter by status',
          },
          from_date: {
            type: 'string',
            description: 'ISO date — show transactions from this date',
          },
          to_date: {
            type: 'string',
            description: 'ISO date — show transactions up to this date',
          },
          limit: {
            type: 'number',
            description: 'Max results (default: 20)',
          },
        },
      },
      riskLevel: 'low',
      execute: async (args, traceId) => callWorkspaceMcp('list_payment_transactions', args, traceId),
    },

    // ── 3. Get Transaction ──
    {
      name: 'payments_getTransaction',
      description:
        'Get a single payment transaction by ID with full details including linked storefront, order, and contact.',
      parameters: {
        type: 'object',
        properties: {
          transaction_id: {
            type: 'string',
            description: 'Payment transaction UUID',
          },
        },
        required: ['transaction_id'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => callWorkspaceMcp('get_payment_transaction', args, traceId),
    },

    // ── 4. Payment Summary ──
    {
      name: 'payments_summary',
      description:
        "Get payment summary: total revenue, transaction count, breakdown by provider and status. Periods: today, week, month.",
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['today', 'week', 'month'],
            description: 'Time period for the summary (default: today)',
          },
        },
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const period = (args.period as string) || 'today';
        const now = new Date();
        let fromDate: string;

        switch (period) {
          case 'week': {
            const d = new Date(now);
            d.setDate(d.getDate() - 7);
            fromDate = d.toISOString();
            break;
          }
          case 'month': {
            const d = new Date(now);
            d.setMonth(d.getMonth() - 1);
            fromDate = d.toISOString();
            break;
          }
          default: {
            // today
            fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
          }
        }

        const txns = (await callWorkspaceMcp(
          'list_payment_transactions',
          { from_date: fromDate, to_date: now.toISOString(), limit: 500 },
          traceId,
        )) as Record<string, unknown>;

        if (txns?.error) return txns;

        const list: Array<Record<string, unknown>> = Array.isArray(txns)
          ? txns
          : ((txns?.transactions as Array<Record<string, unknown>>) || []);

        // Compute aggregates
        let totalRevenue = 0;
        const byProvider: Record<string, { count: number; total: number }> = {};
        const byStatus: Record<string, number> = {};

        for (const tx of list) {
          if (tx.status === 'completed') {
            totalRevenue += Number(tx.amount || 0);
          }

          const prov = String(tx.provider || 'unknown');
          if (!byProvider[prov]) byProvider[prov] = { count: 0, total: 0 };
          byProvider[prov].count++;
          if (tx.status === 'completed') byProvider[prov].total += Number(tx.amount || 0);

          const st = String(tx.status || 'unknown');
          byStatus[st] = (byStatus[st] || 0) + 1;
        }

        return {
          period,
          total_revenue: totalRevenue,
          transaction_count: list.length,
          by_provider: byProvider,
          by_status: byStatus,
          currency: 'USD',
          recent: list.slice(0, 5),
        };
      },
    },

    // ── 5. Create Stripe Checkout Link ──
    {
      name: 'payments_createCheckoutLink',
      description:
        'Create a Stripe Checkout payment link for a product or service. Returns a URL the customer can pay through.',
      parameters: {
        type: 'object',
        properties: {
          amount: { type: 'number', description: 'Amount in dollars (e.g., 50.00)' },
          currency: { type: 'string', description: 'ISO currency code (default: usd)' },
          description: { type: 'string', description: 'Product or service description' },
          customer_email: { type: 'string', description: 'Pre-fill customer email (optional)' },
          success_url: { type: 'string', description: 'Redirect URL after payment (optional)' },
        },
        required: ['amount', 'description'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const stripeKey = process.env.STRIPE_SECRET_KEY || '';
        if (!stripeKey) {
          return {
            error: 'Stripe not configured.',
            fix: 'Set STRIPE_SECRET_KEY in your environment variables.',
            source: 'advisory',
          };
        }

        const amount = Math.round(Number(args.amount) * 100); // Stripe uses cents
        if (!amount || amount <= 0) {
          return { error: 'Amount must be positive.' };
        }

        const currency = String(args.currency || 'usd').toLowerCase();
        const description = String(args.description || 'KITZ Payment');

        try {
          const body = new URLSearchParams();
          body.append('payment_method_types[]', 'card');
          body.append('line_items[0][price_data][currency]', currency);
          body.append('line_items[0][price_data][product_data][name]', description);
          body.append('line_items[0][price_data][unit_amount]', String(amount));
          body.append('line_items[0][quantity]', '1');
          body.append('mode', 'payment');
          const kitzDomain = process.env.KITZ_DOMAIN || 'https://workspace.kitz.services';
          body.append('success_url', String(args.success_url || `${kitzDomain}/payment-success`));
          body.append('cancel_url', `${kitzDomain}/payment-cancelled`);
          if (args.customer_email) {
            body.append('customer_email', String(args.customer_email));
          }

          const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${stripeKey}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString(),
            signal: AbortSignal.timeout(15_000),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown error');
            return { error: `Stripe error (${res.status}): ${errText.slice(0, 300)}` };
          }

          const session = await res.json() as { id: string; url: string };
          log.info('checkout_created', { sessionId: session.id, amount, currency, trace_id: traceId });

          return {
            success: true,
            checkout_url: session.url,
            session_id: session.id,
            amount: Number(args.amount),
            currency,
            description,
            source: 'stripe',
          };
        } catch (err) {
          if ((err as Error).name === 'AbortError') {
            return { error: 'Stripe request timed out.' };
          }
          return { error: `Stripe failed: ${(err as Error).message}` };
        }
      },
    },
  ];
}
