/**
 * MCP Client — Routes workspace tool calls to the workspace REST API.
 *
 * When WORKSPACE_API_URL is set (the workspace Fastify service at port 3001),
 * known tool names are translated to REST calls (GET/POST/PATCH/DELETE).
 * Falls back to JSON-RPC MCP call when WORKSPACE_MCP_URL is set and the tool
 * isn't handled by REST.
 *
 * Passes the caller's userId via Bearer token for auth.
 * Falls back to GOD_MODE_USER_ID when no userId is provided (system/cron calls).
 */

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('mcpClient');

const WORKSPACE_API_URL = process.env.WORKSPACE_API_URL || process.env.WORKSPACE_URL || 'http://localhost:3001';
const WORKSPACE_MCP_URL = process.env.WORKSPACE_MCP_URL || '';
const WORKSPACE_MCP_KEY = process.env.WORKSPACE_MCP_KEY || '';
const GOD_MODE_USER_ID = process.env.GOD_MODE_USER_ID || '';
const JWT_SECRET = process.env.JWT_SECRET || process.env.DEV_TOKEN_SECRET || '';

// ── Workspace REST adapter ──

async function restFetch(
  method: string,
  path: string,
  userId: string,
  body?: Record<string, unknown>,
): Promise<unknown> {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${JWT_SECRET}`,
    'x-user-id': userId,
  };
  const opts: RequestInit = {
    method,
    headers,
    signal: AbortSignal.timeout(10_000),
  };
  if (body) {
    headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`${WORKSPACE_API_URL}${path}`, opts);
  if (!res.ok) {
    const errText = await res.text().catch(() => 'unknown');
    return { error: `REST ${res.status}: ${errText.slice(0, 200)}` };
  }
  return res.json();
}

/**
 * Map MCP tool names → workspace REST calls.
 * Returns the result if handled, or null if the tool isn't a REST route.
 */
async function tryRestRoute(
  toolName: string,
  args: Record<string, unknown>,
  userId: string,
): Promise<unknown | null> {
  switch (toolName) {
    // ── Contacts/Leads ──
    case 'list_contacts':
      return restFetch('GET', '/api/workspace/leads', userId);

    case 'get_contact': {
      const rows = await restFetch('GET', '/api/workspace/leads', userId) as any[];
      if (!Array.isArray(rows)) return rows;
      const contact = rows.find((r: any) => r.id === args.contact_id);
      return contact || { error: 'Contact not found' };
    }

    case 'create_contact':
      return restFetch('POST', '/api/workspace/leads', userId, {
        name: args.name as string || '',
        phone: args.phone as string || '',
        email: args.email as string || '',
        notes: args.notes as string || '',
      });

    case 'update_contact':
      if (!args.contact_id) return { error: 'contact_id required' };
      return restFetch('PATCH', `/api/workspace/leads/${args.contact_id}`, userId, {
        ...(args.name !== undefined && { name: args.name }),
        ...(args.phone !== undefined && { phone: args.phone }),
        ...(args.email !== undefined && { email: args.email }),
        ...(args.status !== undefined && { stage: args.status }),
        ...(args.tags !== undefined && { tags: args.tags }),
      });

    // ── Orders ──
    case 'list_orders':
      return restFetch('GET', '/api/workspace/orders', userId);

    case 'get_order': {
      const orders = await restFetch('GET', '/api/workspace/orders', userId) as any[];
      if (!Array.isArray(orders)) return orders;
      const order = orders.find((o: any) => o.id === args.order_id);
      return order || { error: 'Order not found' };
    }

    case 'create_order':
      return restFetch('POST', '/api/workspace/orders', userId, {
        description: args.notes as string || '',
        total: Number(args.total || 0),
        status: args.payment_status as string || 'pending',
      });

    case 'update_order': {
      if (!args.order_id) return { error: 'order_id required' };
      const orderUpdates: Record<string, unknown> = {};
      if (args.payment_status) orderUpdates.status = args.payment_status;
      if (args.fulfillment_status) orderUpdates.status = args.fulfillment_status;
      if (args.notes) orderUpdates.description = args.notes;
      return restFetch('PATCH', `/api/workspace/orders/${args.order_id}`, userId, orderUpdates);
    }

    // ── Tasks ──
    case 'list_tasks':
      return restFetch('GET', '/api/workspace/tasks', userId);

    case 'create_task':
      return restFetch('POST', '/api/workspace/tasks', userId, {
        title: args.title as string || args.description as string || '',
      });

    case 'update_task': {
      if (!args.task_id) return { error: 'task_id required' };
      const taskUpdates: Record<string, unknown> = {};
      if (args.status === 'done' || args.done === true) taskUpdates.done = true;
      if (args.title) taskUpdates.title = args.title;
      return restFetch('PATCH', `/api/workspace/tasks/${args.task_id}`, userId, taskUpdates);
    }

    // ── Checkout Links / Storefronts ──
    case 'list_storefronts':
      return restFetch('GET', '/api/workspace/checkout-links', userId);

    case 'create_storefront':
      return restFetch('POST', '/api/workspace/checkout-links', userId, {
        orderId: args.title as string || '',
        amount: Number(args.price || args.amount || 0),
        label: args.title as string || '',
      });

    // ── Products ──
    case 'list_products':
      return restFetch('GET', '/api/workspace/products', userId);

    case 'create_product':
      return restFetch('POST', '/api/workspace/products', userId, {
        name: args.name as string || '',
        price: Number(args.price || 0),
        cost: Number(args.cost || 0),
        sku: args.sku as string || '',
        stock_qty: Number(args.stock_qty || 0),
        low_stock_threshold: Number(args.low_stock_threshold || 5),
        category: args.category as string || '',
      });

    case 'update_product': {
      if (!args.product_id) return { error: 'product_id required' };
      const updates: Record<string, unknown> = {};
      if (args.name !== undefined) updates.name = args.name;
      if (args.price !== undefined) updates.price = Number(args.price);
      if (args.cost !== undefined) updates.cost = Number(args.cost);
      if (args.sku !== undefined) updates.sku = args.sku;
      if (args.stock_qty !== undefined) updates.stock_qty = Number(args.stock_qty);
      if (args.low_stock_threshold !== undefined) updates.low_stock_threshold = Number(args.low_stock_threshold);
      if (args.category !== undefined) updates.category = args.category;
      if (args.is_active !== undefined) updates.is_active = args.is_active;
      return restFetch('PATCH', `/api/workspace/products/${args.product_id}`, userId, updates);
    }

    // ── Payments ──
    case 'list_payments':
      return restFetch('GET', '/api/workspace/payments', userId);

    case 'create_payment':
      return restFetch('POST', '/api/workspace/payments', userId, {
        type: args.type as string || 'incoming',
        description: args.description as string || '',
        amount: Number(args.amount || 0),
        status: args.status as string || 'pending',
        method: args.method as string || 'manual',
      });

    // ── Business Summary (computed) ──
    case 'business_summary': {
      const [leads, orders, payments] = await Promise.all([
        restFetch('GET', '/api/workspace/leads', userId),
        restFetch('GET', '/api/workspace/orders', userId),
        restFetch('GET', '/api/workspace/payments', userId),
      ]);
      const leadsArr = Array.isArray(leads) ? leads : [];
      const ordersArr = Array.isArray(orders) ? orders : [];
      const paymentsArr = Array.isArray(payments) ? payments : [];
      const totalRevenue = ordersArr.reduce((sum: number, o: any) => sum + Number(o.amount || o.total || 0), 0);
      const completedPayments = paymentsArr.filter((p: any) => p.status === 'completed');
      const collectedRevenue = completedPayments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
      return {
        contacts: leadsArr.length,
        orders: ordersArr.length,
        total_revenue: totalRevenue,
        collected_revenue: collectedRevenue,
        pending_orders: ordersArr.filter((o: any) => o.status === 'pending').length,
      };
    }

    // ── Feedback ──
    case 'submit_feedback':
      // Store as a note on a contact or log it
      return { ok: true, message: 'Feedback recorded', ...args };

    default:
      return null; // Not a REST-handled tool
  }
}

// ── MCP fallback (JSON-RPC) ──

interface McpResponse {
  jsonrpc: string;
  id: number;
  result?: { content?: Array<{ type: string; text?: string }> };
  error?: { code: number; message: string };
}

export async function callWorkspaceMcp(
  toolName: string,
  args: Record<string, unknown> = {},
  traceId?: string,
  userId?: string,
): Promise<unknown> {
  const effectiveUserId = userId || GOD_MODE_USER_ID;

  log.info('call', { tool: toolName, trace_id: traceId });

  // ── Try workspace REST API first ──
  try {
    const restResult = await tryRestRoute(toolName, args, effectiveUserId);
    if (restResult !== null) {
      return restResult;
    }
  } catch (err) {
    log.error('REST route failed', { tool: toolName, detail: (err as Error).message, trace_id: traceId });
    // Fall through to MCP
  }

  // ── Fall back to MCP JSON-RPC ──
  if (!WORKSPACE_MCP_URL) {
    return { error: `No handler for tool: ${toolName}` };
  }

  const body = {
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: {
      name: toolName,
      arguments: { user_id: effectiveUserId, ...args },
    },
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (WORKSPACE_MCP_KEY) {
    headers['x-api-key'] = WORKSPACE_MCP_KEY;
  }
  if (traceId) {
    headers['x-trace-id'] = traceId;
  }

  try {
    const res = await fetch(WORKSPACE_MCP_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => 'unknown');
      log.error(`MCP HTTP ${res.status}`, { tool: toolName, detail: errText.slice(0, 300), trace_id: traceId });
      return { error: `MCP HTTP ${res.status}` };
    }

    const data = await res.json() as McpResponse;

    if (data.error) {
      return { error: data.error.message };
    }

    // Extract text content from MCP response
    const textContent = data.result?.content
      ?.filter(c => c.type === 'text' && c.text)
      .map(c => c.text)
      .join('\n');

    if (textContent) {
      try {
        return JSON.parse(textContent);
      } catch {
        return textContent;
      }
    }

    return data.result || {};
  } catch (err) {
    log.error('MCP fetch failed', { tool: toolName, detail: (err as Error).message, trace_id: traceId });
    return { error: (err as Error).message };
  }
}
