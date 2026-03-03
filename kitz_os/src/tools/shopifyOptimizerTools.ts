/**
 * Shopify Tools — Real API integration + advisory fallback.
 *
 * Tools:
 *   1. shopify_listProducts   — List products from Shopify store
 *   2. shopify_getProduct     — Get product details
 *   3. shopify_createProduct  — Create a new product
 *   4. shopify_listOrders     — List recent orders
 *   5. shopify_optimize       — Advisory: store optimization tips (original)
 *
 * Requires: SHOPIFY_STORE_URL, SHOPIFY_ACCESS_TOKEN
 * Falls back to advisory mode if not configured.
 */
import { createSubsystemLogger } from 'kitz-schemas';
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';

const log = createSubsystemLogger('shopifyTools');

const SYS = 'Shopify optimization expert for LatAm SMBs. Store setup, conversion, SEO. Spanish default. Respond with JSON.';

function getShopifyConfig() {
  const storeUrl = process.env.SHOPIFY_STORE_URL || '';
  const token = process.env.SHOPIFY_ACCESS_TOKEN || '';
  return { storeUrl, token, configured: !!(storeUrl && token) };
}

async function shopifyFetch<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const { storeUrl, token } = getShopifyConfig();
  const url = `${storeUrl}/admin/api/2024-01${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => 'unknown');
    throw new Error(`Shopify ${res.status}: ${errText.slice(0, 200)}`);
  }
  return res.json() as T;
}

export function getAllShopifyOptimizerTools(): ToolSchema[] {
  return [
    // ── 1. List Products ──
    {
      name: 'shopify_listProducts',
      description: 'List products from Shopify store. Returns title, price, inventory, images.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Max products (default: 10)' },
          collection_id: { type: 'string', description: 'Filter by collection ID' },
        },
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const { configured } = getShopifyConfig();
        if (!configured) {
          return { error: 'Shopify not configured.', fix: 'Set SHOPIFY_STORE_URL and SHOPIFY_ACCESS_TOKEN in env.', source: 'advisory' };
        }
        try {
          const limit = Math.min(Number(args.limit) || 10, 50);
          const params = new URLSearchParams({ limit: String(limit) });
          if (args.collection_id) params.append('collection_id', String(args.collection_id));
          const data = await shopifyFetch<{ products: unknown[] }>(`/products.json?${params}`);
          log.info('shopify_listProducts', { count: data.products.length, trace_id: traceId });
          return { success: true, products: data.products, count: data.products.length, source: 'shopify' };
        } catch (err) {
          return { error: `Shopify failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 2. Get Product ──
    {
      name: 'shopify_getProduct',
      description: 'Get a single Shopify product by ID with full details.',
      parameters: {
        type: 'object',
        properties: { product_id: { type: 'string', description: 'Shopify product ID' } },
        required: ['product_id'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const { configured } = getShopifyConfig();
        if (!configured) return { error: 'Shopify not configured.', fix: 'Set SHOPIFY_STORE_URL and SHOPIFY_ACCESS_TOKEN.' };
        try {
          const data = await shopifyFetch<{ product: unknown }>(`/products/${args.product_id}.json`);
          log.info('shopify_getProduct', { id: args.product_id, trace_id: traceId });
          return { success: true, product: data.product, source: 'shopify' };
        } catch (err) {
          return { error: `Shopify failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 3. Create Product ──
    {
      name: 'shopify_createProduct',
      description: 'Create a new product on Shopify. Draft-first: created as draft status.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Product title' },
          body_html: { type: 'string', description: 'Product description (HTML)' },
          vendor: { type: 'string', description: 'Vendor name' },
          product_type: { type: 'string', description: 'Product type/category' },
          price: { type: 'string', description: 'Price (e.g., "29.99")' },
        },
        required: ['title'],
      },
      riskLevel: 'high',
      execute: async (args, traceId) => {
        const { configured } = getShopifyConfig();
        if (!configured) return { error: 'Shopify not configured.', fix: 'Set SHOPIFY_STORE_URL and SHOPIFY_ACCESS_TOKEN.' };
        try {
          const product: Record<string, unknown> = {
            title: args.title,
            body_html: args.body_html || '',
            vendor: args.vendor || '',
            product_type: args.product_type || '',
            status: 'draft', // draft-first
          };
          if (args.price) {
            product.variants = [{ price: String(args.price) }];
          }
          const data = await shopifyFetch<{ product: unknown }>('/products.json', 'POST', { product });
          log.info('shopify_createProduct', { title: args.title, trace_id: traceId });
          return { success: true, product: data.product, status: 'draft', source: 'shopify' };
        } catch (err) {
          return { error: `Shopify create failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 4. List Orders ──
    {
      name: 'shopify_listOrders',
      description: 'List recent orders from Shopify store.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Max orders (default: 10)' },
          status: { type: 'string', enum: ['open', 'closed', 'cancelled', 'any'], description: 'Order status filter' },
        },
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const { configured } = getShopifyConfig();
        if (!configured) return { error: 'Shopify not configured.', fix: 'Set SHOPIFY_STORE_URL and SHOPIFY_ACCESS_TOKEN.' };
        try {
          const limit = Math.min(Number(args.limit) || 10, 50);
          const status = String(args.status || 'any');
          const data = await shopifyFetch<{ orders: unknown[] }>(`/orders.json?limit=${limit}&status=${status}`);
          log.info('shopify_listOrders', { count: data.orders.length, trace_id: traceId });
          return { success: true, orders: data.orders, count: data.orders.length, source: 'shopify' };
        } catch (err) {
          return { error: `Shopify orders failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 5. Advisory: Optimization Tips (original stub, enhanced) ──
    {
      name: 'shopify_optimize',
      description: 'Get Shopify store optimization recommendations — theme, apps, conversion, SEO.',
      parameters: {
        type: 'object',
        properties: {
          store_name: { type: 'string', description: 'Store name' },
          industry: { type: 'string', description: 'Industry' },
          challenges: { type: 'string', description: 'Current challenges' },
        },
        required: ['store_name'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const raw = await callLLM(SYS, JSON.stringify(args));
        let p;
        try { const m = raw.match(/\{[\s\S]*\}/); p = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { p = { raw }; }
        p.source = 'advisory';
        log.info('shopify_optimize', { trace_id: traceId });
        return p;
      },
    },
  ];
}
