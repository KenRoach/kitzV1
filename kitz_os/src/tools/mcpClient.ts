/**
 * MCP Client — Routes workspace tool calls to local DB functions.
 *
 * Phase 4 consolidation: Instead of making HTTP calls to the workspace
 * service (port 3001), this module now calls the workspace DB functions
 * directly. Same Supabase connection, zero network hop.
 *
 * Falls back to JSON-RPC MCP call when WORKSPACE_MCP_URL is set and the
 * tool isn't handled locally.
 */

import { createSubsystemLogger } from 'kitz-schemas';
import {
  listLeads, createLead, updateLead, deleteLead,
  listOrders, createOrder, updateOrder, deleteOrder,
  listTasks, createTask, updateTask, deleteTask,
  listCheckoutLinks, createCheckoutLink, updateCheckoutLink, deleteCheckoutLink,
  listProducts, createProduct, updateProduct, deleteProduct,
  listPayments, createPayment, deletePayment,
  getDashboardMetrics,
} from '../workspace/db.js';

const log = createSubsystemLogger('mcpClient');

const WORKSPACE_MCP_URL = process.env.WORKSPACE_MCP_URL || '';
const WORKSPACE_MCP_KEY = process.env.WORKSPACE_MCP_KEY || '';
const GOD_MODE_USER_ID = process.env.GOD_MODE_USER_ID || '';

// ── Local workspace tool router ──

/**
 * Map MCP tool names → direct workspace DB calls.
 * Returns the result if handled, or null if the tool isn't a workspace tool.
 */
async function tryLocalRoute(
  toolName: string,
  args: Record<string, unknown>,
  userId: string,
): Promise<unknown | null> {
  switch (toolName) {
    // ── Contacts/Leads ──
    case 'list_contacts':
      return listLeads(userId);

    case 'get_contact': {
      const rows = await listLeads(userId);
      const contact = rows.find(r => r.id === args.contact_id);
      return contact || { error: 'Contact not found' };
    }

    case 'create_contact':
      return createLead(userId, {
        name: args.name as string || '',
        phone: args.phone as string || '',
        email: args.email as string || '',
        notes: args.notes ? [args.notes as string] : [],
      });

    case 'update_contact':
      if (!args.contact_id) return { error: 'contact_id required' };
      return updateLead(userId, args.contact_id as string, {
        ...(args.name !== undefined && { name: args.name }),
        ...(args.phone !== undefined && { phone: args.phone }),
        ...(args.email !== undefined && { email: args.email }),
        ...(args.status !== undefined && { stage: args.status }),
        ...(args.tags !== undefined && { tags: args.tags }),
        ...(args.source !== undefined && { source: args.source }),
        ...(args.value !== undefined && { value: args.value }),
      });

    // ── Orders ──
    case 'list_orders':
      return listOrders(userId);

    case 'get_order': {
      const orders = await listOrders(userId);
      const order = orders.find(o => o.id === args.order_id);
      return order || { error: 'Order not found' };
    }

    case 'create_order':
      return createOrder(userId, {
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
      return updateOrder(userId, args.order_id as string, orderUpdates);
    }

    case 'delete_order':
      if (!args.order_id) return { error: 'order_id required' };
      return deleteOrder(userId, args.order_id as string);

    // ── Tasks ──
    case 'list_tasks':
      return listTasks(userId);

    case 'create_task':
      return createTask(userId, args.title as string || args.description as string || '');

    case 'update_task': {
      if (!args.task_id) return { error: 'task_id required' };
      const taskUpdates: Record<string, unknown> = {};
      if (args.status === 'done' || args.done === true) taskUpdates.done = true;
      if (args.title) taskUpdates.title = args.title;
      return updateTask(userId, args.task_id as string, taskUpdates);
    }

    case 'delete_task':
      if (!args.task_id) return { error: 'task_id required' };
      return deleteTask(userId, args.task_id as string);

    // ── Checkout Links / Storefronts ──
    case 'list_storefronts':
      return listCheckoutLinks(userId);

    case 'create_storefront':
      return createCheckoutLink(userId, {
        label: args.title as string || '',
        amount: Number(args.price || args.amount || 0),
      });

    case 'update_storefront': {
      if (!args.storefront_id) return { error: 'storefront_id required' };
      const sfUpdates: Record<string, unknown> = {};
      if (args.title !== undefined) sfUpdates.label = args.title;
      if (args.description !== undefined) sfUpdates.label = args.description;
      if (args.price !== undefined) sfUpdates.amount = Number(args.price);
      return updateCheckoutLink(userId, args.storefront_id as string, sfUpdates);
    }

    case 'delete_storefront':
      if (!args.storefront_id) return { error: 'storefront_id required' };
      return deleteCheckoutLink(userId, args.storefront_id as string);

    case 'mark_storefront_paid': {
      if (!args.storefront_id) return { error: 'storefront_id required' };
      await updateCheckoutLink(userId, args.storefront_id as string, { active: false });
      const links = await listCheckoutLinks(userId);
      const link = links.find(l => l.id === args.storefront_id);
      if (link) {
        await createPayment(userId, {
          type: 'incoming',
          description: `Storefront payment: ${link.label || link.id}`,
          amount: Number(link.amount || 0),
          status: 'completed',
          method: 'storefront',
        });
      }
      return { ok: true, message: 'Storefront marked as paid', storefront_id: args.storefront_id };
    }

    case 'send_storefront':
      if (!args.storefront_id) return { error: 'storefront_id required' };
      return { ok: true, message: 'Storefront link ready to send (draft-first)', storefront_id: args.storefront_id };

    case 'delete_checkout_link':
      if (!args.link_id) return { error: 'link_id required' };
      return deleteCheckoutLink(userId, args.link_id as string);

    // ── Products ──
    case 'list_products':
      return listProducts(userId);

    case 'create_product':
      return createProduct(userId, {
        name: args.name as string || '',
        price: Number(args.price || 0),
        cost: Number(args.cost || 0),
        sku: args.sku as string || '',
        stock_qty: Number(args.stock_qty || 0),
        low_stock_threshold: Number(args.low_stock_threshold || 5),
        category: args.category as string || '',
        description: args.description as string || '',
        image_url: args.image_url as string || '',
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
      if (args.description !== undefined) updates.description = args.description;
      if (args.image_url !== undefined) updates.image_url = args.image_url;
      return updateProduct(userId, args.product_id as string, updates);
    }

    case 'delete_product':
      if (!args.product_id) return { error: 'product_id required' };
      return deleteProduct(userId, args.product_id as string);

    // ── Payments ──
    case 'list_payments':
      return listPayments(userId);

    case 'create_payment':
      return createPayment(userId, {
        type: args.type as string || 'incoming',
        description: args.description as string || '',
        amount: Number(args.amount || 0),
        status: args.status as string || 'pending',
        method: args.method as string || 'manual',
      });

    case 'delete_payment':
      if (!args.payment_id) return { error: 'payment_id required' };
      return deletePayment(userId, args.payment_id as string);

    // ── Business Summary (computed) ──
    case 'business_summary': {
      const [leads, orders, payments] = await Promise.all([
        listLeads(userId), listOrders(userId), listPayments(userId),
      ]);
      const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
      const completedPayments = payments.filter(p => p.status === 'completed');
      const collectedRevenue = completedPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      return {
        contacts: leads.length,
        orders: orders.length,
        total_revenue: totalRevenue,
        collected_revenue: collectedRevenue,
        pending_orders: orders.filter(o => o.status === 'pending').length,
      };
    }

    // ── Dashboard Metrics ──
    case 'dashboard_metrics':
      return getDashboardMetrics(userId);

    // ── Feedback ──
    case 'submit_feedback':
      return { ok: true, message: 'Feedback recorded', ...args };

    default:
      return null; // Not a workspace tool
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

  // ── Try local workspace DB first (zero network hop) ──
  try {
    const localResult = await tryLocalRoute(toolName, args, effectiveUserId);
    if (localResult !== null) {
      return localResult;
    }
  } catch (err) {
    log.error('Local route failed', { tool: toolName, detail: (err as Error).message, trace_id: traceId });
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
