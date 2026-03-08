/**
 * Workspace DB — Supabase REST persistence with in-memory fallback.
 *
 * Absorbed from workspace/src/db.ts into kitz_os (Phase 4).
 * mcpClient.ts now calls these functions directly instead of making HTTP
 * calls to the workspace service.
 */

import { randomUUID } from 'node:crypto';
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('workspace/db');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.WORKSPACE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.WORKSPACE_SUPABASE_SERVICE_KEY || '';

const hasDB = !!(SUPABASE_URL && SUPABASE_KEY);

if (hasDB) {
  log.info('Workspace DB: Supabase persistence enabled');
} else {
  log.info('Workspace DB: No Supabase config — using in-memory fallback');
}

// ── Supabase REST helpers ──

async function supaGet<T>(table: string, query: string): Promise<T[]> {
  if (!hasDB) return [];
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return [];
    return await res.json() as T[];
  } catch {
    return [];
  }
}

async function supaInsert<T>(table: string, row: T & object): Promise<T | null> {
  if (!hasDB) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(row),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => 'unknown');
      log.error(`INSERT ${table} failed`, { status: res.status, detail: errText.slice(0, 200) });
      return null;
    }
    const rows = await res.json() as T[];
    return rows[0] ?? null;
  } catch (err) {
    log.error(`INSERT ${table} error`, { error: (err as Error).message });
    return null;
  }
}

async function supaPatch<T>(table: string, id: string, updates: Record<string, unknown>): Promise<T | null> {
  if (!hasDB) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({ ...updates, updated_at: new Date().toISOString() }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const rows = await res.json() as T[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

async function supaDelete(table: string, id: string): Promise<boolean> {
  if (!hasDB) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      signal: AbortSignal.timeout(10_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── In-memory fallback stores ──

const memLeads = new Map<string, DbLead[]>();
const memOrders = new Map<string, DbOrder[]>();
const memTasks = new Map<string, DbTask[]>();
const memCheckoutLinks = new Map<string, DbCheckoutLink[]>();
const memProducts = new Map<string, DbProduct[]>();
const memPayments = new Map<string, DbPayment[]>();
const memCalendarEvents = new Map<string, DbCalendarEvent[]>();

// ── Types (DB row shapes with snake_case) ──

export interface DbLead {
  id: string; user_id: string; org_id?: string; name: string; phone: string; email: string;
  source: string; stage: string; value: number; tags: string[]; notes: string[];
  last_contact: string | null; created_at: string; updated_at: string;
}

export interface DbOrder {
  id: string; user_id: string; org_id?: string; lead_id: string | null; description: string;
  total: number; status: string; created_at: string; updated_at: string;
}

export interface DbTask {
  id: string; user_id: string; org_id?: string; title: string; done: boolean;
  created_at: string; updated_at: string;
}

export interface DbCheckoutLink {
  id: string; user_id: string; org_id?: string; slug: string; amount: number; label: string;
  product_id: string | null; active: boolean; created_at: string;
}

export interface DbProduct {
  id: string; user_id: string; org_id?: string; name: string; description: string;
  price: number; cost: number; sku: string; stock_qty: number;
  low_stock_threshold: number; category: string; image_url: string;
  is_active: boolean; created_at: string; updated_at: string;
}

export interface DbPayment {
  id: string; user_id: string; type: string; description: string;
  amount: number; status: string; method: string; date: string; created_at: string;
}

export interface DbCalendarEvent {
  id: string; user_id: string; org_id?: string; title: string; description: string;
  start_time: string; end_time: string; all_day: boolean; location: string;
  type: 'call' | 'meeting' | 'task' | 'follow-up' | 'reminder' | 'other';
  status: 'scheduled' | 'completed' | 'cancelled'; color: string; recurrence: string;
  source: 'manual' | 'google' | 'ai' | 'whatsapp'; google_event_id: string;
  created_at: string; updated_at: string;
}

// ── CRUD: Leads ──

export async function listLeads(userId: string): Promise<DbLead[]> {
  if (hasDB) {
    const rows = await supaGet<DbLead>('leads', `user_id=eq.${userId}&order=created_at.desc`);
    if (rows.length > 0) return rows;
  }
  return memLeads.get(userId) || [];
}

export async function createLead(userId: string, data: Partial<DbLead>): Promise<DbLead> {
  const now = new Date().toISOString();
  const lead: DbLead = {
    id: data.id || randomUUID(), user_id: userId,
    name: data.name || '', phone: data.phone || '', email: data.email || '',
    source: data.source || '', stage: data.stage || 'new', value: data.value || 0,
    tags: data.tags || [], notes: data.notes || [],
    last_contact: null, created_at: now, updated_at: now,
  };
  const dbRow = await supaInsert<DbLead>('leads', lead);
  if (dbRow) return dbRow;
  const arr = memLeads.get(userId) || [];
  arr.push(lead); memLeads.set(userId, arr);
  return lead;
}

export async function updateLead(userId: string, id: string, updates: Record<string, unknown>): Promise<DbLead | null> {
  if (hasDB) { const row = await supaPatch<DbLead>('leads', id, updates); if (row) return row; }
  const arr = memLeads.get(userId) || [];
  const lead = arr.find(l => l.id === id);
  if (!lead) return null;
  Object.assign(lead, updates, { updated_at: new Date().toISOString() });
  return lead;
}

export async function deleteLead(userId: string, id: string): Promise<boolean> {
  if (hasDB) { const ok = await supaDelete('leads', id); if (ok) return true; }
  const arr = memLeads.get(userId) || [];
  memLeads.set(userId, arr.filter(l => l.id !== id));
  return true;
}

// ── CRUD: Orders ──

export async function listOrders(userId: string): Promise<DbOrder[]> {
  if (hasDB) { const rows = await supaGet<DbOrder>('orders', `user_id=eq.${userId}&order=created_at.desc`); if (rows.length > 0) return rows; }
  return memOrders.get(userId) || [];
}

export async function createOrder(userId: string, data: Partial<DbOrder>): Promise<DbOrder> {
  const now = new Date().toISOString();
  const order: DbOrder = {
    id: randomUUID(), user_id: userId, lead_id: data.lead_id || null,
    description: data.description || '', total: data.total || 0,
    status: data.status || 'pending', created_at: now, updated_at: now,
  };
  const dbRow = await supaInsert<DbOrder>('orders', order);
  if (dbRow) return dbRow;
  const arr = memOrders.get(userId) || [];
  arr.push(order); memOrders.set(userId, arr);
  return order;
}

export async function updateOrder(userId: string, id: string, updates: Record<string, unknown>): Promise<DbOrder | null> {
  if (hasDB) { const row = await supaPatch<DbOrder>('orders', id, updates); if (row) return row; }
  const arr = memOrders.get(userId) || [];
  const order = arr.find(o => o.id === id);
  if (!order) return null;
  Object.assign(order, updates, { updated_at: new Date().toISOString() });
  return order;
}

export async function deleteOrder(userId: string, id: string): Promise<boolean> {
  if (hasDB) { const ok = await supaDelete('orders', id); if (ok) return true; }
  const arr = memOrders.get(userId) || [];
  memOrders.set(userId, arr.filter(o => o.id !== id));
  return true;
}

// ── CRUD: Tasks ──

export async function listTasks(userId: string): Promise<DbTask[]> {
  if (hasDB) { const rows = await supaGet<DbTask>('tasks', `user_id=eq.${userId}&order=created_at.desc`); if (rows.length > 0) return rows; }
  return memTasks.get(userId) || [];
}

export async function createTask(userId: string, title: string): Promise<DbTask> {
  const now = new Date().toISOString();
  const task: DbTask = { id: randomUUID(), user_id: userId, title, done: false, created_at: now, updated_at: now };
  const dbRow = await supaInsert<DbTask>('tasks', task);
  if (dbRow) return dbRow;
  const arr = memTasks.get(userId) || [];
  arr.push(task); memTasks.set(userId, arr);
  return task;
}

export async function updateTask(userId: string, id: string, updates: Record<string, unknown>): Promise<DbTask | null> {
  if (hasDB) { const row = await supaPatch<DbTask>('tasks', id, updates); if (row) return row; }
  const arr = memTasks.get(userId) || [];
  const task = arr.find(t => t.id === id);
  if (!task) return null;
  Object.assign(task, updates, { updated_at: new Date().toISOString() });
  return task;
}

export async function deleteTask(userId: string, id: string): Promise<boolean> {
  if (hasDB) { const ok = await supaDelete('tasks', id); if (ok) return true; }
  const arr = memTasks.get(userId) || [];
  memTasks.set(userId, arr.filter(t => t.id !== id));
  return true;
}

// ── CRUD: Checkout Links ──

export async function listCheckoutLinks(userId: string): Promise<DbCheckoutLink[]> {
  if (hasDB) { const rows = await supaGet<DbCheckoutLink>('checkout_links', `user_id=eq.${userId}&order=created_at.desc`); if (rows.length > 0) return rows; }
  return memCheckoutLinks.get(userId) || [];
}

export async function createCheckoutLink(userId: string, data: Partial<DbCheckoutLink>): Promise<DbCheckoutLink> {
  const link: DbCheckoutLink = {
    id: randomUUID(), user_id: userId,
    slug: data.slug || `pay-${Math.random().toString(36).slice(2, 8)}`,
    amount: data.amount || 0, label: data.label || '',
    product_id: data.product_id || null, active: true,
    created_at: new Date().toISOString(),
  };
  const dbRow = await supaInsert<DbCheckoutLink>('checkout_links', link);
  if (dbRow) return dbRow;
  const arr = memCheckoutLinks.get(userId) || [];
  arr.push(link); memCheckoutLinks.set(userId, arr);
  return link;
}

export async function updateCheckoutLink(userId: string, id: string, updates: Record<string, unknown>): Promise<DbCheckoutLink | null> {
  if (hasDB) { const row = await supaPatch<DbCheckoutLink>('checkout_links', id, updates); if (row) return row; }
  const arr = memCheckoutLinks.get(userId) || [];
  const link = arr.find(l => l.id === id);
  if (!link) return null;
  Object.assign(link, updates);
  return link;
}

export async function deleteCheckoutLink(userId: string, id: string): Promise<boolean> {
  if (hasDB) { const ok = await supaDelete('checkout_links', id); if (ok) return true; }
  const arr = memCheckoutLinks.get(userId) || [];
  memCheckoutLinks.set(userId, arr.filter(l => l.id !== id));
  return true;
}

// ── CRUD: Products ──

export async function listProducts(userId: string): Promise<DbProduct[]> {
  if (hasDB) { const rows = await supaGet<DbProduct>('products', `user_id=eq.${userId}&is_active=eq.true&order=created_at.desc`); if (rows.length > 0) return rows; }
  return (memProducts.get(userId) || []).filter(p => p.is_active);
}

export async function createProduct(userId: string, data: Partial<DbProduct>): Promise<DbProduct> {
  const now = new Date().toISOString();
  const product: DbProduct = {
    id: randomUUID(), user_id: userId, name: data.name || '', description: data.description || '',
    price: data.price || 0, cost: data.cost || 0, sku: data.sku || '',
    stock_qty: data.stock_qty || 0, low_stock_threshold: data.low_stock_threshold || 5,
    category: data.category || '', image_url: data.image_url || '',
    is_active: true, created_at: now, updated_at: now,
  };
  const dbRow = await supaInsert<DbProduct>('products', product);
  if (dbRow) return dbRow;
  const arr = memProducts.get(userId) || [];
  arr.push(product); memProducts.set(userId, arr);
  return product;
}

export async function updateProduct(userId: string, id: string, updates: Record<string, unknown>): Promise<DbProduct | null> {
  if (hasDB) { const row = await supaPatch<DbProduct>('products', id, updates); if (row) return row; }
  const arr = memProducts.get(userId) || [];
  const product = arr.find(p => p.id === id);
  if (!product) return null;
  Object.assign(product, updates, { updated_at: new Date().toISOString() });
  return product;
}

export async function deleteProduct(userId: string, id: string): Promise<boolean> {
  if (hasDB) { const row = await supaPatch<DbProduct>('products', id, { is_active: false }); if (row) return true; }
  const arr = memProducts.get(userId) || [];
  const product = arr.find(p => p.id === id);
  if (product) product.is_active = false;
  return true;
}

// ── CRUD: Payments ──

export async function listPayments(userId: string): Promise<DbPayment[]> {
  if (hasDB) { const rows = await supaGet<DbPayment>('payments', `user_id=eq.${userId}&order=date.desc`); if (rows.length > 0) return rows; }
  return memPayments.get(userId) || [];
}

export async function createPayment(userId: string, data: Partial<DbPayment>): Promise<DbPayment> {
  const payment: DbPayment = {
    id: randomUUID(), user_id: userId, type: data.type || 'incoming',
    description: data.description || '', amount: data.amount || 0,
    status: data.status || 'pending', method: data.method || 'manual',
    date: data.date || new Date().toISOString(), created_at: new Date().toISOString(),
  };
  const dbRow = await supaInsert<DbPayment>('payments', payment);
  if (dbRow) return dbRow;
  const arr = memPayments.get(userId) || [];
  arr.push(payment); memPayments.set(userId, arr);
  return payment;
}

export async function deletePayment(userId: string, id: string): Promise<boolean> {
  if (hasDB) { const ok = await supaDelete('payments', id); if (ok) return true; }
  const arr = memPayments.get(userId) || [];
  memPayments.set(userId, arr.filter(p => p.id !== id));
  return true;
}

// ── CRUD: Calendar Events ──

export async function listCalendarEvents(userId: string, from?: string, to?: string): Promise<DbCalendarEvent[]> {
  if (hasDB) {
    let query = `user_id=eq.${userId}&order=start_time.asc`;
    if (from) query += `&start_time=gte.${from}`;
    if (to) query += `&start_time=lte.${to}T23:59:59`;
    const rows = await supaGet<DbCalendarEvent>('calendar_events', query);
    if (rows.length > 0) return rows;
  }
  const all = memCalendarEvents.get(userId) || [];
  return all.filter(e => {
    if (from && e.start_time < from) return false;
    if (to && e.start_time > to + 'T23:59:59') return false;
    return true;
  }).sort((a, b) => a.start_time.localeCompare(b.start_time));
}

export async function createCalendarEvent(userId: string, data: Partial<DbCalendarEvent>): Promise<DbCalendarEvent> {
  const now = new Date().toISOString();
  const event: DbCalendarEvent = {
    id: data.id || randomUUID(), user_id: userId, title: data.title || '',
    description: data.description || '', start_time: data.start_time || now,
    end_time: data.end_time || new Date(Date.now() + 3600000).toISOString(),
    all_day: data.all_day || false, location: data.location || '',
    type: data.type || 'other', status: data.status || 'scheduled',
    color: data.color || '#A855F7', recurrence: data.recurrence || '',
    source: data.source || 'manual', google_event_id: data.google_event_id || '',
    created_at: now, updated_at: now,
  };
  const dbRow = await supaInsert<DbCalendarEvent>('calendar_events', event);
  if (dbRow) return dbRow;
  const arr = memCalendarEvents.get(userId) || [];
  arr.push(event); memCalendarEvents.set(userId, arr);
  return event;
}

export async function updateCalendarEvent(userId: string, id: string, updates: Record<string, unknown>): Promise<DbCalendarEvent | null> {
  if (hasDB) { const row = await supaPatch<DbCalendarEvent>('calendar_events', id, updates); if (row) return row; }
  const arr = memCalendarEvents.get(userId) || [];
  const event = arr.find(e => e.id === id);
  if (!event) return null;
  Object.assign(event, updates, { updated_at: new Date().toISOString() });
  return event;
}

export async function deleteCalendarEvent(userId: string, id: string): Promise<boolean> {
  if (hasDB) { const ok = await supaDelete('calendar_events', id); if (ok) return true; }
  const arr = memCalendarEvents.get(userId) || [];
  memCalendarEvents.set(userId, arr.filter(e => e.id !== id));
  return true;
}

// ── Dashboard Metrics ──

export interface DashboardMetrics {
  contacts_count: number; orders_count: number; orders_total_revenue: number;
  tasks_pending: number; tasks_completed: number; checkout_links_count: number;
  leads_count: number; products_count: number;
}

export async function getDashboardMetrics(userId: string): Promise<DashboardMetrics> {
  const [leads, orders, tasks, links, products] = await Promise.all([
    listLeads(userId), listOrders(userId), listTasks(userId),
    listCheckoutLinks(userId), listProducts(userId),
  ]);
  return {
    contacts_count: leads.length, orders_count: orders.length,
    orders_total_revenue: orders.reduce((sum, o) => sum + (o.total || 0), 0),
    tasks_pending: tasks.filter(t => !t.done).length,
    tasks_completed: tasks.filter(t => t.done).length,
    checkout_links_count: links.length, leads_count: leads.length,
    products_count: products.length,
  };
}

export { hasDB };
