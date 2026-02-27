/**
 * Workspace DB — Supabase REST persistence with in-memory fallback.
 *
 * When SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set, all CRUD operations
 * go to Supabase PostgreSQL. Otherwise, falls back to in-memory Maps (lost on restart).
 */

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.WORKSPACE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.WORKSPACE_SUPABASE_SERVICE_KEY || '';

const hasDB = !!(SUPABASE_URL && SUPABASE_KEY);

if (hasDB) {
  console.log('[workspace/db] Supabase persistence enabled');
} else {
  console.log('[workspace/db] No Supabase config — using in-memory fallback');
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
    if (!res.ok) return null;
    const rows = await res.json() as T[];
    return rows[0] ?? null;
  } catch {
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

// ── Types (DB row shapes with snake_case) ──

export interface DbLead {
  id: string; user_id: string; name: string; phone: string; email: string;
  source: string; stage: string; value: number; tags: string[]; notes: string[];
  last_contact: string | null; created_at: string; updated_at: string;
}

export interface DbOrder {
  id: string; user_id: string; lead_id: string | null; description: string;
  total: number; status: string; created_at: string; updated_at: string;
}

export interface DbTask {
  id: string; user_id: string; title: string; done: boolean;
  created_at: string; updated_at: string;
}

export interface DbCheckoutLink {
  id: string; user_id: string; slug: string; amount: number; label: string;
  product_id: string | null; active: boolean; created_at: string;
}

export interface DbProduct {
  id: string; user_id: string; name: string; description: string;
  price: number; cost: number; sku: string; stock_qty: number;
  low_stock_threshold: number; category: string; image_url: string;
  is_active: boolean; created_at: string; updated_at: string;
}

export interface DbPayment {
  id: string; user_id: string; type: string; description: string;
  amount: number; status: string; method: string; date: string; created_at: string;
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
    id: data.id || `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    user_id: userId,
    name: data.name || '',
    phone: data.phone || '',
    email: data.email || '',
    source: data.source || '',
    stage: data.stage || 'new',
    value: data.value || 0,
    tags: data.tags || [],
    notes: data.notes || [],
    last_contact: null,
    created_at: now,
    updated_at: now,
  };
  const dbRow = await supaInsert<DbLead>('leads', lead);
  if (dbRow) return dbRow;
  // Fallback to memory
  const arr = memLeads.get(userId) || [];
  arr.push(lead);
  memLeads.set(userId, arr);
  return lead;
}

export async function updateLead(userId: string, id: string, updates: Record<string, unknown>): Promise<DbLead | null> {
  if (hasDB) {
    const row = await supaPatch<DbLead>('leads', id, updates);
    if (row) return row;
  }
  // Fallback to memory
  const arr = memLeads.get(userId) || [];
  const lead = arr.find(l => l.id === id);
  if (!lead) return null;
  Object.assign(lead, updates, { updated_at: new Date().toISOString() });
  return lead;
}

export async function deleteLead(userId: string, id: string): Promise<boolean> {
  if (hasDB) {
    const ok = await supaDelete('leads', id);
    if (ok) return true;
  }
  const arr = memLeads.get(userId) || [];
  memLeads.set(userId, arr.filter(l => l.id !== id));
  return true;
}

// ── CRUD: Orders ──

export async function listOrders(userId: string): Promise<DbOrder[]> {
  if (hasDB) {
    const rows = await supaGet<DbOrder>('orders', `user_id=eq.${userId}&order=created_at.desc`);
    if (rows.length > 0) return rows;
  }
  return memOrders.get(userId) || [];
}

export async function createOrder(userId: string, data: Partial<DbOrder>): Promise<DbOrder> {
  const now = new Date().toISOString();
  const order: DbOrder = {
    id: `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    user_id: userId,
    lead_id: data.lead_id || null,
    description: data.description || '',
    total: data.total || 0,
    status: data.status || 'pending',
    created_at: now,
    updated_at: now,
  };
  const dbRow = await supaInsert<DbOrder>('orders', order);
  if (dbRow) return dbRow;
  const arr = memOrders.get(userId) || [];
  arr.push(order);
  memOrders.set(userId, arr);
  return order;
}

export async function updateOrder(userId: string, id: string, updates: Record<string, unknown>): Promise<DbOrder | null> {
  if (hasDB) {
    const row = await supaPatch<DbOrder>('orders', id, updates);
    if (row) return row;
  }
  const arr = memOrders.get(userId) || [];
  const order = arr.find(o => o.id === id);
  if (!order) return null;
  Object.assign(order, updates, { updated_at: new Date().toISOString() });
  return order;
}

// ── CRUD: Tasks ──

export async function listTasks(userId: string): Promise<DbTask[]> {
  if (hasDB) {
    const rows = await supaGet<DbTask>('tasks', `user_id=eq.${userId}&order=created_at.desc`);
    if (rows.length > 0) return rows;
  }
  return memTasks.get(userId) || [];
}

export async function createTask(userId: string, title: string): Promise<DbTask> {
  const now = new Date().toISOString();
  const task: DbTask = {
    id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    user_id: userId,
    title,
    done: false,
    created_at: now,
    updated_at: now,
  };
  const dbRow = await supaInsert<DbTask>('tasks', task);
  if (dbRow) return dbRow;
  const arr = memTasks.get(userId) || [];
  arr.push(task);
  memTasks.set(userId, arr);
  return task;
}

export async function updateTask(userId: string, id: string, updates: Record<string, unknown>): Promise<DbTask | null> {
  if (hasDB) {
    const row = await supaPatch<DbTask>('tasks', id, updates);
    if (row) return row;
  }
  const arr = memTasks.get(userId) || [];
  const task = arr.find(t => t.id === id);
  if (!task) return null;
  Object.assign(task, updates, { updated_at: new Date().toISOString() });
  return task;
}

// ── CRUD: Checkout Links ──

export async function listCheckoutLinks(userId: string): Promise<DbCheckoutLink[]> {
  if (hasDB) {
    const rows = await supaGet<DbCheckoutLink>('checkout_links', `user_id=eq.${userId}&order=created_at.desc`);
    if (rows.length > 0) return rows;
  }
  return memCheckoutLinks.get(userId) || [];
}

export async function createCheckoutLink(userId: string, data: Partial<DbCheckoutLink>): Promise<DbCheckoutLink> {
  const link: DbCheckoutLink = {
    id: `chk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    user_id: userId,
    slug: data.slug || `pay-${Math.random().toString(36).slice(2, 8)}`,
    amount: data.amount || 0,
    label: data.label || '',
    product_id: data.product_id || null,
    active: true,
    created_at: new Date().toISOString(),
  };
  const dbRow = await supaInsert<DbCheckoutLink>('checkout_links', link);
  if (dbRow) return dbRow;
  const arr = memCheckoutLinks.get(userId) || [];
  arr.push(link);
  memCheckoutLinks.set(userId, arr);
  return link;
}

// ── CRUD: Products ──

export async function listProducts(userId: string): Promise<DbProduct[]> {
  if (hasDB) {
    const rows = await supaGet<DbProduct>('products', `user_id=eq.${userId}&is_active=eq.true&order=created_at.desc`);
    if (rows.length > 0) return rows;
  }
  return (memProducts.get(userId) || []).filter(p => p.is_active);
}

export async function createProduct(userId: string, data: Partial<DbProduct>): Promise<DbProduct> {
  const now = new Date().toISOString();
  const product: DbProduct = {
    id: `prod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    user_id: userId,
    name: data.name || '',
    description: data.description || '',
    price: data.price || 0,
    cost: data.cost || 0,
    sku: data.sku || '',
    stock_qty: data.stock_qty || 0,
    low_stock_threshold: data.low_stock_threshold || 5,
    category: data.category || '',
    image_url: data.image_url || '',
    is_active: true,
    created_at: now,
    updated_at: now,
  };
  const dbRow = await supaInsert<DbProduct>('products', product);
  if (dbRow) return dbRow;
  const arr = memProducts.get(userId) || [];
  arr.push(product);
  memProducts.set(userId, arr);
  return product;
}

export async function updateProduct(userId: string, id: string, updates: Record<string, unknown>): Promise<DbProduct | null> {
  if (hasDB) {
    const row = await supaPatch<DbProduct>('products', id, updates);
    if (row) return row;
  }
  const arr = memProducts.get(userId) || [];
  const product = arr.find(p => p.id === id);
  if (!product) return null;
  Object.assign(product, updates, { updated_at: new Date().toISOString() });
  return product;
}

export async function deleteProduct(userId: string, id: string): Promise<boolean> {
  // Soft delete — set is_active = false
  if (hasDB) {
    const row = await supaPatch<DbProduct>('products', id, { is_active: false });
    if (row) return true;
  }
  const arr = memProducts.get(userId) || [];
  const product = arr.find(p => p.id === id);
  if (product) product.is_active = false;
  return true;
}

// ── CRUD: Payments ──

export async function listPayments(userId: string): Promise<DbPayment[]> {
  if (hasDB) {
    const rows = await supaGet<DbPayment>('payments', `user_id=eq.${userId}&order=date.desc`);
    if (rows.length > 0) return rows;
  }
  return memPayments.get(userId) || [];
}

export async function createPayment(userId: string, data: Partial<DbPayment>): Promise<DbPayment> {
  const payment: DbPayment = {
    id: `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    user_id: userId,
    type: data.type || 'incoming',
    description: data.description || '',
    amount: data.amount || 0,
    status: data.status || 'pending',
    method: data.method || 'manual',
    date: data.date || new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
  const dbRow = await supaInsert<DbPayment>('payments', payment);
  if (dbRow) return dbRow;
  const arr = memPayments.get(userId) || [];
  arr.push(payment);
  memPayments.set(userId, arr);
  return payment;
}

export { hasDB };
