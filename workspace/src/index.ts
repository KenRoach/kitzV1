import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import formbody from '@fastify/formbody';
import { randomUUID } from 'node:crypto';
import { callMcp, mcpConfigured } from './mcp.js';

export const health = { status: 'ok' };
const app = Fastify({ logger: true });
const gatewayUrl = process.env.GATEWAY_URL || 'http://localhost:4000';
const COOKIE_NAME = 'kitz_session';

const ELEVENLABS_AGENT_ID = process.env.ELEVENLABS_AGENT_ID || '';
const voiceWidget = ELEVENLABS_AGENT_ID
  ? `<script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async type="text/javascript"></script><elevenlabs-convai agent-id="${ELEVENLABS_AGENT_ID}"></elevenlabs-convai>`
  : '';

await app.register(cookie);
await app.register(formbody);

/* ── In-Memory Stores (MVP) ── */

interface Session { userId: string; email: string; name: string; token: string; orgId: string; }
const sessions = new Map<string, Session>(); // sessionId → session

interface Lead { id: string; name: string; phone: string; email: string; notes: string; createdAt: string; }
interface Order { id: string; customer: string; amount: number; description: string; status: string; createdAt: string; }
interface Task { id: string; title: string; status: string; createdAt: string; }
interface CheckoutLink { id: string; orderId: string; amount: number; url: string; createdAt: string; }

const userLeads = new Map<string, Lead[]>();
const userOrders = new Map<string, Order[]>();
const userTasks = new Map<string, Task[]>();
const userCheckoutLinks = new Map<string, CheckoutLink[]>();

/* ── Analytics ── */
type RouteStats = { count: number; errors: number; latencies: number[] };
const routeStats = new Map<string, RouteStats>();
const featureUsage = new Map<string, number>();
const feedbackTags = new Map<string, number>();
const funnel = { visitor: 0, signup: 0, firstAction: 0, confusingStepDropoff: 0 };
let authFailures = 0;

const trackUsage = (name: string): void => {
  featureUsage.set(name, (featureUsage.get(name) || 0) + 1);
};

app.addHook('onRequest', async (req) => {
  (req as any).__startMs = Date.now();
  funnel.visitor += 1;
});

app.addHook('onResponse', async (req, reply) => {
  const key = req.routeOptions.url || req.url;
  const existing = routeStats.get(key) || { count: 0, errors: 0, latencies: [] };
  const latency = Date.now() - Number((req as any).__startMs || Date.now());
  existing.count += 1;
  existing.latencies.push(latency);
  if (reply.statusCode >= 400) existing.errors += 1;
  if (existing.latencies.length > 200) existing.latencies = existing.latencies.slice(-200);
  routeStats.set(key, existing);
});

/* ── Session Helpers ── */

function getSession(req: any): Session | null {
  const sid = req.cookies?.[COOKIE_NAME];
  if (!sid) return null;
  return sessions.get(sid) || null;
}

function requireSession(req: any, reply: any): Session | null {
  const session = getSession(req);
  if (!session) {
    reply.redirect('/login');
    return null;
  }
  return session;
}

/* ── HTML Shell ── */

const shell = (title: string, body: string, session: Session | null, script = '') => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KITZ \u2014 ${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a;
      color: #fff;
      min-height: 100vh;
    }
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 24px;
      border-bottom: 1px solid #1a1a1a;
      position: sticky;
      top: 0;
      background: #0a0a0a;
      z-index: 50;
    }
    .topbar .logo {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -1px;
      background: linear-gradient(135deg, #00d4aa, #00b4d8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .topbar .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .topbar .user-name {
      color: #888;
      font-size: 13px;
    }
    .topbar .label {
      color: #555;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .topbar .btn-logout {
      color: #666;
      text-decoration: none;
      font-size: 12px;
      padding: 4px 10px;
      border: 1px solid #333;
      border-radius: 6px;
    }
    .topbar .btn-logout:hover { color: #ff6b6b; border-color: #ff6b6b44; }
    nav {
      display: flex;
      gap: 2px;
      padding: 8px 24px;
      border-bottom: 1px solid #111;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    nav a {
      color: #666;
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
      padding: 8px 14px;
      border-radius: 6px;
      white-space: nowrap;
      transition: all 0.15s;
    }
    nav a:hover { color: #ccc; background: #111; }
    nav a.active { color: #00d4aa; background: #00d4aa12; }
    .main {
      max-width: 720px;
      margin: 0 auto;
      padding: 32px 24px 80px;
    }
    .page-title {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .page-desc {
      color: #666;
      font-size: 14px;
      margin-bottom: 28px;
      line-height: 1.5;
    }
    .card {
      background: #111;
      border: 1px solid #1a1a1a;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
    }
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .card-title {
      font-size: 14px;
      font-weight: 600;
      color: #ccc;
    }
    .card-badge {
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 4px;
      font-weight: 600;
    }
    .badge-free { background: #00d4aa22; color: #00d4aa; }
    .badge-ai { background: #00b4d822; color: #00b4d8; }
    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #444;
      font-size: 14px;
    }
    .empty-state .icon { font-size: 32px; margin-bottom: 12px; opacity: 0.5; }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 8px;
      border: none;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-primary {
      background: #00d4aa;
      color: #000;
    }
    .btn-primary:hover { background: #00e8bb; }
    .btn-secondary {
      background: #1a1a1a;
      color: #ccc;
      border: 1px solid #222;
    }
    .btn-secondary:hover { background: #222; }
    .btn:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }
    .btn-sm { padding: 6px 12px; font-size: 12px; }
    .btn-danger { background: #ff6b6b22; color: #ff6b6b; border: 1px solid #ff6b6b33; }
    .btn-danger:hover { background: #ff6b6b33; }
    input, select, textarea {
      width: 100%;
      padding: 10px 14px;
      background: #0a0a0a;
      border: 1px solid #222;
      border-radius: 8px;
      color: #fff;
      font-size: 14px;
      font-family: inherit;
      transition: border-color 0.15s;
    }
    input:focus, select:focus, textarea:focus {
      outline: none;
      border-color: #00d4aa;
    }
    input::placeholder { color: #444; }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }
    .form-group { margin-bottom: 12px; }
    .form-label {
      display: block;
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
    }
    .stat {
      background: #111;
      border: 1px solid #1a1a1a;
      border-radius: 10px;
      padding: 16px;
      text-align: center;
    }
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #00d4aa;
    }
    .stat-label {
      font-size: 11px;
      color: #555;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 4px;
    }
    .alert {
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 13px;
      margin-bottom: 16px;
    }
    .alert-info { background: #00d4aa12; color: #00d4aa; border: 1px solid #00d4aa22; }
    .alert-warn { background: #ff6b6b12; color: #ff6b6b; border: 1px solid #ff6b6b22; }
    .list-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      border-bottom: 1px solid #1a1a1a;
    }
    .list-item:last-child { border-bottom: none; }
    .list-item-title { font-size: 14px; font-weight: 500; }
    .list-item-sub { font-size: 12px; color: #666; margin-top: 2px; }
    .list-item-badge {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
      background: #1a1a1a;
      color: #888;
    }
    .list-item-badge.open { background: #00d4aa22; color: #00d4aa; }
    .list-item-badge.done { background: #66666622; color: #666; }
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #111;
      border: 1px solid #222;
      border-radius: 10px;
      padding: 14px 20px;
      font-size: 14px;
      z-index: 100;
      display: none;
      animation: slideUp 0.3s ease;
    }
    .toast.show { display: block; }
    .toast.success { border-color: #00d4aa44; }
    .toast.error { border-color: #ff6b6b44; }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @media (max-width: 480px) {
      .form-row { grid-template-columns: 1fr; }
      .stats-row { grid-template-columns: 1fr 1fr; }
      .main { padding: 20px 16px 80px; }
    }
  </style>
</head>
<body>
  <div class="topbar">
    <div class="logo">KITZ</div>
    ${session
      ? `<div class="user-info"><span class="user-name">${session.name}</span><a href="/auth/logout" class="btn-logout">Log out</a></div>`
      : `<div class="label">Workspace</div>`
    }
  </div>
  ${session ? `<nav>
    <a href="/leads" class="${title === 'Leads' ? 'active' : ''}">Leads</a>
    <a href="/orders" class="${title === 'Orders' ? 'active' : ''}">Orders</a>
    <a href="/tasks" class="${title === 'Tasks' ? 'active' : ''}">Tasks</a>
    <a href="/checkout-links" class="${title === 'Checkout Links' ? 'active' : ''}">Checkout</a>
    <a href="/ai-direction" class="${title === 'AI Direction' ? 'active' : ''}">AI</a>
  </nav>` : ''}
  <div class="main">${body}</div>
  ${voiceWidget}
  <div class="toast" id="toast"></div>
  <script>
    function showToast(msg, type) {
      var t = document.getElementById('toast');
      t.textContent = msg;
      t.className = 'toast show ' + (type || 'success');
      setTimeout(function() { t.className = 'toast'; }, 3000);
    }
    ${script}
  </script>
</body>
</html>`;

/* ── Auth Pages ── */

const authPage = (title: string, formHtml: string, bottomLink: string) => shell(title, `
  <div style="max-width:380px;margin:60px auto 0">
    <h1 class="page-title" style="text-align:center;margin-bottom:4px">${title}</h1>
    <p class="page-desc" style="text-align:center">Your hustle deserves infrastructure.</p>
    <div class="card">${formHtml}</div>
    <p style="text-align:center;font-size:13px;color:#555;margin-top:16px">${bottomLink}</p>
  </div>
`, null);

app.get('/login', async (req: any) => {
  if (getSession(req)) return (req as any).server.redirect('/leads');
  const error = (req.query as any)?.error;
  return authPage('Log In', `
    ${error ? `<div class="alert alert-warn" style="margin-bottom:12px">${error === 'invalid' ? 'Invalid email or password' : 'Please log in'}</div>` : ''}
    <form method="POST" action="/auth/login">
      <div class="form-group"><label class="form-label">Email</label><input name="email" type="email" placeholder="you@example.com" required/></div>
      <div class="form-group"><label class="form-label">Password</label><input name="password" type="password" placeholder="Min 6 characters" required/></div>
      <button class="btn btn-primary" type="submit" style="width:100%;justify-content:center">Log In</button>
    </form>
  `, `Don't have an account? <a href="/register" style="color:#00d4aa">Sign up free</a>`);
});

app.get('/register', async (req: any) => {
  if (getSession(req)) return (req as any).server.redirect('/leads');
  const error = (req.query as any)?.error;
  return authPage('Sign Up', `
    ${error === 'exists' ? `<div class="alert alert-warn" style="margin-bottom:12px">That email is already registered. <a href="/login" style="color:#00d4aa">Log in instead?</a></div>` : ''}
    ${error === 'validation' ? `<div class="alert alert-warn" style="margin-bottom:12px">All fields are required. Password min 6 chars.</div>` : ''}
    <form method="POST" action="/auth/register">
      <div class="form-group"><label class="form-label">Name</label><input name="name" placeholder="Maria Garcia" required/></div>
      <div class="form-group"><label class="form-label">Email</label><input name="email" type="email" placeholder="you@example.com" required/></div>
      <div class="form-group"><label class="form-label">Password</label><input name="password" type="password" placeholder="Min 6 characters" minlength="6" required/></div>
      <button class="btn btn-primary" type="submit" style="width:100%;justify-content:center">Create Free Account</button>
    </form>
  `, `Already have an account? <a href="/login" style="color:#00d4aa">Log in</a>`);
});

app.post('/auth/register', async (req: any, reply: any) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password || password.length < 6) {
    return reply.redirect('/register?error=validation');
  }

  try {
    const res = await fetch(`${gatewayUrl}/auth/signup`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-trace-id': randomUUID() },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json() as any;
    if (!res.ok) {
      return reply.redirect(data.code === 'USER_EXISTS' ? '/register?error=exists' : '/register?error=validation');
    }

    const sessionId = randomUUID();
    sessions.set(sessionId, { userId: data.userId, email, name, token: data.token, orgId: data.orgId });
    funnel.signup += 1;

    reply.setCookie(COOKIE_NAME, sessionId, { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 604800 });
    return reply.redirect('/leads');
  } catch {
    return reply.redirect('/register?error=validation');
  }
});

app.post('/auth/login', async (req: any, reply: any) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return reply.redirect('/login?error=invalid');
  }

  try {
    const res = await fetch(`${gatewayUrl}/auth/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-trace-id': randomUUID() },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json() as any;
    if (!res.ok) {
      authFailures += 1;
      return reply.redirect('/login?error=invalid');
    }

    const sessionId = randomUUID();
    sessions.set(sessionId, { userId: data.userId, email, name: data.name, token: data.token, orgId: data.orgId });

    reply.setCookie(COOKIE_NAME, sessionId, { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 604800 });
    return reply.redirect('/leads');
  } catch {
    return reply.redirect('/login?error=invalid');
  }
});

app.get('/auth/logout', async (_req: any, reply: any) => {
  const sid = _req.cookies?.[COOKIE_NAME];
  if (sid) sessions.delete(sid);
  reply.clearCookie(COOKIE_NAME, { path: '/' });
  return reply.redirect('/login');
});

/* ── Home redirect ── */
app.get('/', async (req: any, reply: any) => {
  const session = getSession(req);
  return reply.redirect(session ? '/leads' : '/login');
});

/* ── Helper: make authenticated call to gateway ── */
async function gatewayFetch(session: Session, path: string, options: RequestInit = {}): Promise<any> {
  const res = await fetch(`${gatewayUrl}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${session.token}`,
      'x-org-id': session.orgId,
      'x-trace-id': randomUUID(),
      'x-scopes': 'battery:read,payments:write,tools:invoke',
      ...(options.headers || {}),
    },
  });
  return res.json();
}

/* ── Leads Page ── */

app.get('/leads', async (req: any, reply: any) => {
  const session = requireSession(req, reply);
  if (!session) return;
  trackUsage('leads.view');

  // Fetch from MCP (Supabase) with in-memory fallback
  let leads: Lead[] = userLeads.get(session.userId) || [];
  if (mcpConfigured) {
    const result = await callMcp('list_contacts', { limit: 100 }, session.userId) as any;
    if (result && !result.error && Array.isArray(result)) {
      leads = result.map((c: any) => ({
        id: c.id, name: c.name || '', phone: c.phone || '', email: c.email || '',
        notes: c.notes || '', createdAt: c.created_at || new Date().toISOString(),
      }));
    }
  }

  const thisWeek = leads.filter(l => Date.now() - new Date(l.createdAt).getTime() < 604800000).length;
  const active = leads.filter(l => !(l as any).status || (l as any).status !== 'inactive').length;

  const listHtml = leads.length
    ? leads.map(l => `<div class="list-item">
        <div><div class="list-item-title">${esc(l.name)}</div><div class="list-item-sub">${esc(l.phone || l.email || 'No contact info')}</div></div>
        <form method="POST" action="/leads/delete" style="margin:0"><input type="hidden" name="id" value="${l.id}"/><button class="btn btn-sm btn-danger" type="submit">Remove</button></form>
      </div>`).join('')
    : `<div class="empty-state"><div class="icon">\uD83D\uDCCB</div>No leads yet. Add your first contact above.</div>`;

  return shell('Leads', `
    <h1 class="page-title">Leads & Contacts</h1>
    <p class="page-desc">Track your leads and customers. Manual mode is always free.${mcpConfigured ? '' : ' <span style="color:#555">(offline mode)</span>'}</p>
    <div class="stats-row">
      <div class="stat"><div class="stat-value">${leads.length}</div><div class="stat-label">Total Leads</div></div>
      <div class="stat"><div class="stat-value">${active}</div><div class="stat-label">Active</div></div>
      <div class="stat"><div class="stat-value">${thisWeek}</div><div class="stat-label">This Week</div></div>
    </div>
    <div class="card">
      <div class="card-header">
        <span class="card-title">Quick Add</span>
        <span class="card-badge badge-free">FREE</span>
      </div>
      <form method="POST" action="/leads/add">
        <div class="form-row">
          <div class="form-group"><label class="form-label">Name</label><input name="name" placeholder="Maria Garcia" required/></div>
          <div class="form-group"><label class="form-label">Phone</label><input name="phone" placeholder="+507 6000-0000"/></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Email</label><input name="email" type="email" placeholder="maria@example.com"/></div>
          <div class="form-group"><label class="form-label">Notes</label><input name="notes" placeholder="Met at market"/></div>
        </div>
        <button class="btn btn-primary" type="submit">Add Lead</button>
      </form>
    </div>
    <div class="card" style="padding:0">${listHtml}</div>
  `, session);
});

app.post('/leads/add', async (req: any, reply: any) => {
  const session = requireSession(req, reply);
  if (!session) return;
  const { name, phone, email, notes } = req.body || {};
  if (!name) return reply.redirect('/leads');

  // Write to MCP (Supabase)
  if (mcpConfigured) {
    await callMcp('create_contact', { name, phone: phone || undefined, email: email || undefined, notes: notes || undefined, status: 'lead' }, session.userId);
  }
  // Also keep in-memory for instant reads
  const leads = userLeads.get(session.userId) || [];
  leads.push({ id: randomUUID(), name, phone: phone || '', email: email || '', notes: notes || '', createdAt: new Date().toISOString() });
  userLeads.set(session.userId, leads);
  funnel.firstAction += 1;
  return reply.redirect('/leads');
});

app.post('/leads/delete', async (req: any, reply: any) => {
  const session = requireSession(req, reply);
  if (!session) return;
  const { id } = req.body || {};
  // Mark inactive in MCP (no hard delete tool)
  if (mcpConfigured && id) {
    await callMcp('update_contact', { contact_id: id, status: 'inactive' }, session.userId);
  }
  const leads = userLeads.get(session.userId) || [];
  userLeads.set(session.userId, leads.filter(l => l.id !== id));
  return reply.redirect('/leads');
});

/* ── Orders Page ── */

app.get('/orders', async (req: any, reply: any) => {
  const session = requireSession(req, reply);
  if (!session) return;
  trackUsage('orders.view');

  // Fetch from MCP (Supabase) with in-memory fallback
  let orders: Order[] = userOrders.get(session.userId) || [];
  if (mcpConfigured) {
    const result = await callMcp('list_orders', { limit: 100 }, session.userId) as any;
    if (result && !result.error && Array.isArray(result)) {
      orders = result.map((o: any) => ({
        id: o.id, customer: o.contact_name || o.notes || 'Customer',
        amount: Number(o.total) || 0, description: o.notes || '',
        status: o.payment_status === 'completed' ? 'completed' : 'open',
        createdAt: o.created_at || new Date().toISOString(),
      }));
    }
  }

  const openOrders = orders.filter(o => o.status === 'open');
  const totalRevenue = orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.amount, 0);
  const completed = orders.filter(o => o.status === 'completed').length;

  const listHtml = orders.length
    ? orders.map(o => `<div class="list-item">
        <div>
          <div class="list-item-title">${esc(o.customer)} \u2014 $${o.amount.toFixed(2)}</div>
          <div class="list-item-sub">${esc(o.description)}</div>
        </div>
        <div style="display:flex;gap:6px;align-items:center">
          <span class="list-item-badge ${o.status === 'open' ? 'open' : 'done'}">${o.status}</span>
          ${o.status === 'open' ? `<form method="POST" action="/orders/complete" style="margin:0"><input type="hidden" name="id" value="${o.id}"/><button class="btn btn-sm btn-primary" type="submit">Complete</button></form>` : ''}
        </div>
      </div>`).join('')
    : `<div class="empty-state"><div class="icon">\uD83D\uDCE6</div>No orders yet. Create your first one above.</div>`;

  return shell('Orders', `
    <h1 class="page-title">Orders</h1>
    <p class="page-desc">Track open orders and update statuses with approval controls.</p>
    <div class="stats-row">
      <div class="stat"><div class="stat-value">${openOrders.length}</div><div class="stat-label">Open</div></div>
      <div class="stat"><div class="stat-value">$${totalRevenue.toFixed(2)}</div><div class="stat-label">Revenue</div></div>
      <div class="stat"><div class="stat-value">${completed}</div><div class="stat-label">Completed</div></div>
    </div>
    <div class="card">
      <div class="card-header">
        <span class="card-title">New Order</span>
        <span class="card-badge badge-free">FREE</span>
      </div>
      <form method="POST" action="/orders/add">
        <div class="form-row">
          <div class="form-group"><label class="form-label">Customer</label><input name="customer" placeholder="Maria Garcia" required/></div>
          <div class="form-group"><label class="form-label">Amount (USD)</label><input name="amount" type="number" step="0.01" min="0.01" placeholder="25.00" required/></div>
        </div>
        <div class="form-group"><label class="form-label">Description</label><input name="description" placeholder="What are they ordering?" required/></div>
        <button class="btn btn-primary" type="submit">Create Order</button>
      </form>
    </div>
    <div class="card" style="padding:0">${listHtml}</div>
  `, session);
});

app.post('/orders/add', async (req: any, reply: any) => {
  const session = requireSession(req, reply);
  if (!session) return;
  const { customer, amount, description } = req.body || {};
  if (!customer || !amount) return reply.redirect('/orders');

  // Write to MCP: create contact first (orders require contact_id), then order
  if (mcpConfigured) {
    // Find or create contact
    let contactId: string | null = null;
    const existing = await callMcp('list_contacts', { search: customer, limit: 1 }, session.userId) as any;
    if (existing && !existing.error && Array.isArray(existing) && existing.length > 0) {
      contactId = existing[0].id;
    } else {
      const created = await callMcp('create_contact', { name: customer, status: 'active' }, session.userId) as any;
      if (created && !created.error) contactId = created.id;
    }
    if (contactId) {
      await callMcp('create_order', { contact_id: contactId, total: Number(amount), notes: description || customer }, session.userId);
    }
  }
  // Also keep in-memory
  const orders = userOrders.get(session.userId) || [];
  orders.push({ id: randomUUID(), customer, amount: Number(amount), description: description || '', status: 'open', createdAt: new Date().toISOString() });
  userOrders.set(session.userId, orders);
  funnel.firstAction += 1;
  return reply.redirect('/orders');
});

app.post('/orders/complete', async (req: any, reply: any) => {
  const session = requireSession(req, reply);
  if (!session) return;
  const { id } = req.body || {};
  // Update in MCP
  if (mcpConfigured && id) {
    await callMcp('update_order', { order_id: id, payment_status: 'completed', fulfillment_status: 'delivered' }, session.userId);
  }
  const orders = userOrders.get(session.userId) || [];
  const order = orders.find(o => o.id === id);
  if (order) order.status = 'completed';
  return reply.redirect('/orders');
});

/* ── Tasks Page ── */

app.get('/tasks', async (req: any, reply: any) => {
  const session = requireSession(req, reply);
  if (!session) return;
  trackUsage('tasks.view');

  const tasks = userTasks.get(session.userId) || [];
  const todo = tasks.filter(t => t.status === 'todo').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const done = tasks.filter(t => t.status === 'done').length;

  const listHtml = tasks.length
    ? tasks.map(t => `<div class="list-item">
        <div>
          <div class="list-item-title" style="${t.status === 'done' ? 'text-decoration:line-through;color:#666' : ''}">${esc(t.title)}</div>
          <div class="list-item-sub">${new Date(t.createdAt).toLocaleDateString()}</div>
        </div>
        <div style="display:flex;gap:6px;align-items:center">
          <span class="list-item-badge ${t.status === 'done' ? 'done' : 'open'}">${t.status.replace('_', ' ')}</span>
          ${t.status !== 'done' ? `<form method="POST" action="/tasks/done" style="margin:0"><input type="hidden" name="id" value="${t.id}"/><button class="btn btn-sm btn-primary" type="submit">Done</button></form>` : ''}
        </div>
      </div>`).join('')
    : `<div class="empty-state"><div class="icon">\u2705</div>No tasks yet. Add one above to get started.</div>`;

  return shell('Tasks', `
    <h1 class="page-title">Tasks</h1>
    <p class="page-desc">Create, assign, and close sales & ops tasks.</p>
    <div class="stats-row">
      <div class="stat"><div class="stat-value">${todo}</div><div class="stat-label">To Do</div></div>
      <div class="stat"><div class="stat-value">${inProgress}</div><div class="stat-label">In Progress</div></div>
      <div class="stat"><div class="stat-value">${done}</div><div class="stat-label">Done</div></div>
    </div>
    <div class="card">
      <div class="card-header">
        <span class="card-title">Quick Task</span>
        <span class="card-badge badge-free">FREE</span>
      </div>
      <form method="POST" action="/tasks/add">
        <div class="form-group"><label class="form-label">Task</label><input name="title" placeholder="Follow up with Maria about cake order" required/></div>
        <button class="btn btn-primary" type="submit">Add Task</button>
      </form>
    </div>
    <div class="card" style="padding:0">${listHtml}</div>
    <div style="margin-top:24px;text-align:center">
      <button class="btn btn-secondary btn-sm" id="confused">Something confusing? Let us know</button>
    </div>
  `, session, `document.getElementById('confused')?.addEventListener('click',function(){fetch('/api/funnel/confusing-step',{method:'POST'});showToast('Feedback sent - thanks!');});`);
});

app.post('/tasks/add', async (req: any, reply: any) => {
  const session = requireSession(req, reply);
  if (!session) return;
  const { title } = req.body || {};
  if (!title) return reply.redirect('/tasks');

  const tasks = userTasks.get(session.userId) || [];
  tasks.push({ id: randomUUID(), title, status: 'todo', createdAt: new Date().toISOString() });
  userTasks.set(session.userId, tasks);
  funnel.firstAction += 1;
  return reply.redirect('/tasks');
});

app.post('/tasks/done', async (req: any, reply: any) => {
  const session = requireSession(req, reply);
  if (!session) return;
  const { id } = req.body || {};
  const tasks = userTasks.get(session.userId) || [];
  const task = tasks.find(t => t.id === id);
  if (task) task.status = 'done';
  return reply.redirect('/tasks');
});

/* ── Checkout Links Page ── */

app.get('/checkout-links', async (req: any, reply: any) => {
  const session = requireSession(req, reply);
  if (!session) return;
  trackUsage('checkout-links.view');

  // Fetch from MCP (Supabase storefronts) with in-memory fallback
  let links: CheckoutLink[] = userCheckoutLinks.get(session.userId) || [];
  if (mcpConfigured) {
    const result = await callMcp('list_storefronts', { limit: 100 }, session.userId) as any;
    if (result && !result.error && Array.isArray(result)) {
      links = result.map((s: any) => ({
        id: s.id, orderId: s.title || 'Payment',
        amount: Number(s.price || s.amount) || 0,
        url: s.short_url || `https://workspace.kitz.services/pay/${(s.id || '').slice(0, 8)}`,
        createdAt: s.created_at || new Date().toISOString(),
      }));
    }
  }

  const totalValue = links.reduce((sum, l) => sum + l.amount, 0);

  const listHtml = links.length
    ? links.map(l => `<div class="list-item">
        <div>
          <div class="list-item-title">${esc(l.orderId)} \u2014 $${l.amount.toFixed(2)}</div>
          <div class="list-item-sub">${esc(l.url)}</div>
        </div>
        <button class="btn btn-sm btn-secondary" onclick="navigator.clipboard.writeText('${l.url}');showToast('Link copied!')">Copy</button>
      </div>`).join('')
    : `<div class="empty-state"><div class="icon">\uD83D\uDCB3</div>No checkout links yet. Create one above.</div>`;

  return shell('Checkout Links', `
    <h1 class="page-title">Checkout Links</h1>
    <p class="page-desc">Create mobile payment links. Share via WhatsApp or copy the URL.</p>
    <div class="stats-row">
      <div class="stat"><div class="stat-value">${links.length}</div><div class="stat-label">Active Links</div></div>
      <div class="stat"><div class="stat-value">$${totalValue.toFixed(2)}</div><div class="stat-label">Total Value</div></div>
    </div>
    <div class="card">
      <div class="card-header">
        <span class="card-title">New Payment Link</span>
        <span class="card-badge badge-free">FREE</span>
      </div>
      <form method="POST" action="/checkout-links/create">
        <div class="form-row">
          <div class="form-group"><label class="form-label">Order / Label</label><input name="orderId" placeholder="Cake order #12" required/></div>
          <div class="form-group"><label class="form-label">Amount (USD)</label><input name="amount" type="number" step="0.01" min="0.01" placeholder="25.00" required/></div>
        </div>
        <button class="btn btn-primary" type="submit">Create Payment Link</button>
      </form>
    </div>
    <div class="alert alert-info">Links are created as drafts. Share via WhatsApp or copy the URL.</div>
    <div class="card" style="padding:0">${listHtml}</div>
  `, session);
});

app.post('/checkout-links/create', async (req: any, reply: any) => {
  const session = requireSession(req, reply);
  if (!session) return;
  const { orderId, amount } = req.body || {};
  if (!orderId || !amount) return reply.redirect('/checkout-links');

  trackUsage('checkout-links.create');
  funnel.firstAction += 1;

  let checkoutUrl = `https://workspace.kitz.services/pay/${randomUUID().slice(0, 8)}`;

  // Write to MCP (Supabase storefronts)
  if (mcpConfigured) {
    const result = await callMcp('create_storefront', { title: orderId, price: Number(amount) }, session.userId) as any;
    if (result && !result.error && result.short_url) checkoutUrl = result.short_url;
    else if (result && !result.error && result.id) checkoutUrl = `https://workspace.kitz.services/pay/${result.id.slice(0, 8)}`;
  }

  // Also keep in-memory
  const links = userCheckoutLinks.get(session.userId) || [];
  links.push({ id: randomUUID(), orderId, amount: Number(amount), url: checkoutUrl, createdAt: new Date().toISOString() });
  userCheckoutLinks.set(session.userId, links);

  return reply.redirect('/checkout-links');
});

/* ── AI Direction Page ── */

app.get('/ai-direction', async (req: any, reply: any) => {
  const session = requireSession(req, reply);
  if (!session) return;
  trackUsage('ai-direction.view');

  return shell('AI Direction', `
    <h1 class="page-title">AI Direction</h1>
    <p class="page-desc">Let KITZ AI run tasks for you. Consumes AI Battery credits.</p>
    <div class="stats-row">
      <div class="stat"><div class="stat-value" id="battery-credits">--</div><div class="stat-label">Credits Left</div></div>
      <div class="stat"><div class="stat-value" id="battery-status">--</div><div class="stat-label">Status</div></div>
    </div>
    <div class="card">
      <div class="card-header">
        <span class="card-title">AI Goal Runner</span>
        <span class="card-badge badge-ai">AI</span>
      </div>
      <div class="form-group"><label class="form-label">What should KITZ do?</label><input id="ai-goal" placeholder="Follow up with all leads who haven\\'t replied in 3 days"/></div>
      <div class="alert alert-warn" id="battery-warn" style="display:none">AI Battery depleted. Recharge or use manual mode.</div>
      <button class="btn btn-primary" id="run-ai" disabled>Run AI Plan</button>
    </div>
    <div class="alert alert-info">Manual mode is always free. AI costs 0.5\u20132 credits per task.</div>
  `, session, `fetch('/api/ai-battery').then(function(r){return r.json()}).then(function(d){
    var c=d.credits||0;
    document.getElementById('battery-credits').textContent=c;
    document.getElementById('battery-status').textContent=c>0?'Active':'Depleted';
    if(c>0){document.getElementById('run-ai').disabled=false;}
    else{document.getElementById('battery-warn').style.display='block';}
  }).catch(function(){
    document.getElementById('battery-credits').textContent='?';
    document.getElementById('battery-status').textContent='Offline';
  });`);
});

/* ── API Endpoints ── */

app.get('/api/ai-battery', async (req: any) => {
  const session = getSession(req);
  if (!session) return { credits: 0, status: 'unauthenticated' };
  trackUsage('ai-battery.check');
  try {
    return await gatewayFetch(session, '/ai-battery/balance');
  } catch {
    return { credits: 0, status: 'offline' };
  }
});

app.post('/api/funnel/signup', async () => {
  funnel.signup += 1;
  return { ok: true };
});

app.post('/api/funnel/first-action', async () => {
  funnel.firstAction += 1;
  return { ok: true };
});

app.post('/api/funnel/confusing-step', async () => {
  funnel.confusingStepDropoff += 1;
  return { ok: true };
});

app.post('/api/feedback/tag', async (req: any) => {
  const tag = String(req.body?.tag || 'uncategorized').trim().toLowerCase();
  feedbackTags.set(tag, (feedbackTags.get(tag) || 0) + 1);
  return { ok: true, tag, count: feedbackTags.get(tag) };
});

app.get('/api/ops/metrics', async () => {
  const routeMetrics = Array.from(routeStats.entries()).map(([route, stats]) => {
    const sorted = [...stats.latencies].sort((a, b) => a - b);
    const p95 = sorted.length ? sorted[Math.floor(sorted.length * 0.95) - 1] || sorted[sorted.length - 1] : 0;
    return { route, requests: stats.count, errorRate: stats.count ? Number((stats.errors / stats.count).toFixed(4)) : 0, p95LatencyMs: p95 };
  });

  const topFeatures = Array.from(featureUsage.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([feature, count]) => ({ feature, count }));
  const topFeedbackTags = Array.from(feedbackTags.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([tag, count]) => ({ tag, count }));

  return {
    generatedAt: new Date().toISOString(),
    p95LatencyByRoute: routeMetrics,
    errorRateByRoute: routeMetrics.map(({ route, errorRate }) => ({ route, errorRate })),
    authFailures,
    conversion: {
      visitorToSignup: funnel.visitor ? Number((funnel.signup / funnel.visitor).toFixed(4)) : 0,
      signupToFirstAction: funnel.signup ? Number((funnel.firstAction / funnel.signup).toFixed(4)) : 0,
      visitorToFirstAction: funnel.visitor ? Number((funnel.firstAction / funnel.visitor).toFixed(4)) : 0
    },
    featureUsageTop10: topFeatures,
    topFeedbackTags,
    confusingStepDropoff: funnel.confusingStepDropoff,
    manualModeAlwaysAvailable: true,
    aiModeGatedByCredits: true
  };
});

app.get('/health', async () => health);

/** Escape HTML to prevent XSS */
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

if (process.env.NODE_ENV !== 'test') {
  app.listen({ port: Number(process.env.PORT || 3001), host: '0.0.0.0' });
}

export default app;
