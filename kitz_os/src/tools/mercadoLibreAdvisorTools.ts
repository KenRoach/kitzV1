/**
 * MercadoLibre Tools — Real API integration + advisory fallback.
 *
 * Tools:
 *   1. meli_listProducts   — List seller's products
 *   2. meli_getProduct      — Get product details
 *   3. meli_listOrders      — List recent orders
 *   4. meli_updateProduct   — Update product price/stock
 *   5. mercadolibre_advise  — Advisory: listings, pricing, ads, reputation (original)
 *
 * Requires: MELI_ACCESS_TOKEN, MELI_USER_ID
 */
import { createSubsystemLogger } from 'kitz-schemas';
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';

const log = createSubsystemLogger('mercadoLibreTools');
const SYS = 'Mercado Libre expert for LatAm sellers. Listings, pricing, ads, reputation. Spanish default. Respond with JSON.';

const MELI_API = 'https://api.mercadolibre.com';

function getMeliConfig() {
  return {
    token: process.env.MELI_ACCESS_TOKEN || '',
    userId: process.env.MELI_USER_ID || '',
    configured: !!(process.env.MELI_ACCESS_TOKEN && process.env.MELI_USER_ID),
  };
}

async function meliFetch<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const { token } = getMeliConfig();
  const res = await fetch(`${MELI_API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => 'unknown');
    throw new Error(`MercadoLibre ${res.status}: ${errText.slice(0, 200)}`);
  }
  return res.json() as T;
}

export function getAllMercadoLibreAdvisorTools(): ToolSchema[] {
  return [
    // ── 1. List Products ──
    {
      name: 'meli_listProducts',
      description: 'List your MercadoLibre products/listings.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Max items (default: 10)' },
          status: { type: 'string', enum: ['active', 'paused', 'closed'], description: 'Filter by status' },
        },
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const { userId, configured } = getMeliConfig();
        if (!configured) {
          return { error: 'MercadoLibre not configured.', fix: 'Set MELI_ACCESS_TOKEN and MELI_USER_ID in env.', source: 'advisory' };
        }
        try {
          const limit = Math.min(Number(args.limit) || 10, 50);
          const status = args.status ? `&status=${args.status}` : '';
          const data = await meliFetch<{ results: string[] }>(
            `/users/${userId}/items/search?limit=${limit}${status}`,
          );

          // Fetch item details for each ID
          const items = [];
          for (const itemId of data.results.slice(0, limit)) {
            try {
              const item = await meliFetch<Record<string, unknown>>(`/items/${itemId}`);
              items.push({
                id: item.id,
                title: item.title,
                price: item.price,
                currency: item.currency_id,
                status: item.status,
                available_quantity: item.available_quantity,
                sold_quantity: item.sold_quantity,
                permalink: item.permalink,
              });
            } catch {
              items.push({ id: itemId, error: 'Could not fetch details' });
            }
          }

          log.info('meli_listProducts', { count: items.length, trace_id: traceId });
          return { success: true, items, count: items.length, source: 'mercadolibre' };
        } catch (err) {
          return { error: `MercadoLibre failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 2. Get Product Details ──
    {
      name: 'meli_getProduct',
      description: 'Get detailed info about a MercadoLibre product/listing.',
      parameters: {
        type: 'object',
        properties: {
          item_id: { type: 'string', description: 'MercadoLibre item ID (e.g., MLA1234567890)' },
        },
        required: ['item_id'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const { configured } = getMeliConfig();
        if (!configured) {
          return { error: 'MercadoLibre not configured.', fix: 'Set MELI_ACCESS_TOKEN and MELI_USER_ID in env.' };
        }
        try {
          const item = await meliFetch<Record<string, unknown>>(`/items/${args.item_id}`);
          log.info('meli_getProduct', { itemId: args.item_id, trace_id: traceId });
          return {
            success: true,
            item: {
              id: item.id,
              title: item.title,
              price: item.price,
              currency: item.currency_id,
              status: item.status,
              condition: item.condition,
              available_quantity: item.available_quantity,
              sold_quantity: item.sold_quantity,
              category_id: item.category_id,
              listing_type_id: item.listing_type_id,
              permalink: item.permalink,
              thumbnail: item.thumbnail,
              pictures: (item.pictures as Array<{ url: string }> || []).map(p => p.url),
              shipping: item.shipping,
            },
            source: 'mercadolibre',
          };
        } catch (err) {
          return { error: `MercadoLibre failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 3. List Orders ──
    {
      name: 'meli_listOrders',
      description: 'List recent MercadoLibre orders.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Max orders (default: 10)' },
          status: { type: 'string', enum: ['paid', 'confirmed', 'cancelled'], description: 'Filter by order status' },
        },
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const { userId, configured } = getMeliConfig();
        if (!configured) {
          return { error: 'MercadoLibre not configured.', fix: 'Set MELI_ACCESS_TOKEN and MELI_USER_ID in env.' };
        }
        try {
          const limit = Math.min(Number(args.limit) || 10, 50);
          const statusFilter = args.status ? `&order.status=${args.status}` : '';
          const data = await meliFetch<{ results: Array<Record<string, unknown>> }>(
            `/orders/search?seller=${userId}&limit=${limit}${statusFilter}&sort=date_desc`,
          );

          const orders = data.results.map(o => ({
            id: o.id,
            status: o.status,
            date_created: o.date_created,
            total_amount: o.total_amount,
            currency: o.currency_id,
            buyer: o.buyer ? { nickname: (o.buyer as Record<string, unknown>).nickname } : null,
            items: (o.order_items as Array<Record<string, unknown>> || []).map(i => ({
              title: (i.item as Record<string, unknown>)?.title,
              quantity: i.quantity,
              unit_price: i.unit_price,
            })),
          }));

          log.info('meli_listOrders', { count: orders.length, trace_id: traceId });
          return { success: true, orders, count: orders.length, source: 'mercadolibre' };
        } catch (err) {
          return { error: `MercadoLibre orders failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 4. Update Product ──
    {
      name: 'meli_updateProduct',
      description: 'Update a MercadoLibre product price, stock, or status.',
      parameters: {
        type: 'object',
        properties: {
          item_id: { type: 'string', description: 'MercadoLibre item ID' },
          price: { type: 'number', description: 'New price' },
          available_quantity: { type: 'number', description: 'New stock quantity' },
          status: { type: 'string', enum: ['active', 'paused', 'closed'], description: 'New status' },
        },
        required: ['item_id'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const { configured } = getMeliConfig();
        if (!configured) {
          return { error: 'MercadoLibre not configured.', fix: 'Set MELI_ACCESS_TOKEN and MELI_USER_ID in env.' };
        }
        try {
          const body: Record<string, unknown> = {};
          if (args.price !== undefined) body.price = Number(args.price);
          if (args.available_quantity !== undefined) body.available_quantity = Number(args.available_quantity);
          if (args.status) body.status = String(args.status);

          if (Object.keys(body).length === 0) {
            return { error: 'Provide at least one field to update: price, available_quantity, or status' };
          }

          const result = await meliFetch<Record<string, unknown>>(`/items/${args.item_id}`, 'PUT', body);
          log.info('meli_updateProduct', { itemId: args.item_id, fields: Object.keys(body), trace_id: traceId });
          return { success: true, itemId: result.id, updated: Object.keys(body), source: 'mercadolibre' };
        } catch (err) {
          return { error: `MercadoLibre update failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 5. Advisory: Listings, Pricing, Ads, Reputation (original) ──
    {
      name: 'mercadolibre_advise',
      description: 'MercadoLibre listings optimization, pricing strategy, ads, reputation — advisory.',
      parameters: {
        type: 'object',
        properties: {
          product_category: { type: 'string', description: 'Product category' },
          country: { type: 'string', description: 'Country' },
          challenges: { type: 'string', description: 'Current challenges' },
        },
        required: ['product_category'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const raw = await callLLM(SYS, JSON.stringify(args));
        let p;
        try {
          const m = raw.match(/\{[\s\S]*\}/);
          p = m ? JSON.parse(m[0]) : { error: 'Parse failed' };
        } catch {
          p = { raw };
        }
        p.source = 'advisory';
        log.info('mercadolibre_advise', { trace_id: traceId });
        return p;
      },
    },
  ];
}
