import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import formbody from '@fastify/formbody';
import { randomUUID, createHash, createHmac } from 'node:crypto';
import { createTraceId, type StandardError } from 'kitz-schemas';
import {
  listLeads as dbListLeads, createLead as dbCreateLead, updateLead as dbUpdateLead, deleteLead as dbDeleteLead,
  listOrders as dbListOrders, createOrder as dbCreateOrder, updateOrder as dbUpdateOrder,
  listTasks as dbListTasks, createTask as dbCreateTask, updateTask as dbUpdateTask,
  listCheckoutLinks as dbListCheckoutLinks, createCheckoutLink as dbCreateCheckoutLink,
  listProducts as dbListProducts, createProduct as dbCreateProduct, updateProduct as dbUpdateProduct, deleteProduct as dbDeleteProduct,
  listPayments as dbListPayments, createPayment as dbCreatePayment,
  hasDB,
  type DbLead, type DbOrder, type DbTask, type DbCheckoutLink, type DbProduct, type DbPayment,
} from './db.js';

const app = Fastify({ logger: true });
const gatewayUrl = process.env.GATEWAY_URL || 'http://localhost:4000';
const waConnectorUrl = process.env.WA_CONNECTOR_URL || 'http://localhost:3006';

/** Extract traceId from request header or generate one */
function getTraceId(req: any): string {
  return (req.headers?.['x-trace-id'] as string) || createTraceId();
}

/** Build StandardError response */
function buildStdError(code: string, message: string, traceId: string): StandardError {
  return { code, message, traceId };
}
const COOKIE_NAME = 'kitz_session';
const JWT_SECRET = process.env.JWT_SECRET || process.env.DEV_TOKEN_SECRET || '';
if (!JWT_SECRET) {
  app.log.fatal('JWT_SECRET or DEV_TOKEN_SECRET must be set. Refusing to start with no secret.');
  process.exit(1);
}

/* ── Inline Auth (no gateway round-trip) ── */

interface UserRecord { id: string; email: string; name: string; passwordHash: string; orgId: string; }
const registeredUsers = new Map<string, UserRecord>(); // email → user

function hashPw(pw: string): string { return createHash('sha256').update(pw).digest('hex'); }

function b64url(buf: Buffer): string { return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }

function mintJwt(userId: string, orgId: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const payload = b64url(Buffer.from(JSON.stringify({
    sub: userId, org_id: orgId,
    scopes: ['battery:read', 'payments:write', 'tools:invoke', 'events:write', 'notifications:write', 'messages:write'],
    iat: now, exp: now + 604800,
  })));
  const sig = b64url(createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest());
  return `${header}.${payload}.${sig}`;
}

const ELEVENLABS_AGENT_ID = process.env.ELEVENLABS_AGENT_ID || '';
const voiceWidget = ELEVENLABS_AGENT_ID
  ? `<script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async type="text/javascript"></script><elevenlabs-convai agent-id="${ELEVENLABS_AGENT_ID}"></elevenlabs-convai>`
  : '';

await app.register(cookie);
await app.register(formbody);

/* ── Auto-detect HTML responses and set correct Content-Type ── */
app.addHook('onSend', async (_req, reply, payload) => {
  if (typeof payload === 'string' && payload.trimStart().startsWith('<!DOCTYPE html>')) {
    reply.header('content-type', 'text/html; charset=utf-8');
  }
  return payload;
});

/* ── In-Memory Stores (MVP) ── */

interface Session { userId: string; email: string; name: string; token: string; orgId: string; }
const sessions = new Map<string, Session>(); // sessionId → session

interface Lead { id: string; name: string; phone: string; email: string; notes: string; createdAt: string; }
interface Order { id: string; customer: string; amount: number; description: string; status: string; createdAt: string; }
interface Task { id: string; title: string; status: string; createdAt: string; }
interface CheckoutLink { id: string; orderId: string; amount: number; url: string; createdAt: string; }
interface Product { id: string; name: string; description: string; price: number; cost: number; sku: string; stock_qty: number; low_stock_threshold: number; category: string; image_url: string; is_active: boolean; createdAt: string; updatedAt: string; }

interface Payment { id: string; type: 'incoming' | 'outgoing'; description: string; amount: number; status: 'completed' | 'pending' | 'failed'; date: string; method: string; }

/* ── DB → UI Shape Mappers ── */
function dbLeadToLead(d: DbLead): Lead { return { id: d.id, name: d.name, phone: d.phone, email: d.email, notes: d.notes?.join('\n') || '', createdAt: d.created_at }; }
function dbOrderToOrder(d: DbOrder): Order { return { id: d.id, customer: d.description, amount: d.total, description: d.description, status: d.status, createdAt: d.created_at }; }
function dbTaskToTask(d: DbTask): Task { return { id: d.id, title: d.title, status: d.done ? 'done' : 'todo', createdAt: d.created_at }; }
function dbCheckoutToLink(d: DbCheckoutLink): CheckoutLink { return { id: d.id, orderId: d.label, amount: d.amount, url: `https://workspace.kitz.services/pay/${d.slug}`, createdAt: d.created_at }; }
function dbProductToProduct(d: DbProduct): Product { return { id: d.id, name: d.name, description: d.description, price: d.price, cost: d.cost, sku: d.sku, stock_qty: d.stock_qty, low_stock_threshold: d.low_stock_threshold, category: d.category, image_url: d.image_url, is_active: d.is_active, createdAt: d.created_at, updatedAt: d.updated_at }; }
function dbPaymentToPayment(d: DbPayment): Payment { return { id: d.id, type: d.type as Payment['type'], description: d.description, amount: d.amount, status: d.status as Payment['status'], date: d.date, method: d.method }; }

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

const shell = (title: string, body: string, session: Session | null, script = '', extraHead = '') => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KITZ \u2014 ${title}</title>
  ${extraHead}
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
    <a href="/products" class="${title === 'Products' ? 'active' : ''}">Products</a>
    <a href="/whatsapp" class="${title === 'WhatsApp' ? 'active' : ''}">WhatsApp</a>
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

/* ── Branded Onboarding Page (/start) ── */

const startPage = (formHtml: string, bottomLink: string, error = '') => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>workspace.kitz.services — Start</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0a0a0a;color:#fff;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px}
    .url-bar{display:inline-flex;align-items:center;gap:6px;background:#111;border:1px solid #1a1a1a;border-radius:20px;padding:6px 16px;margin-bottom:24px;font-size:13px;color:#555;font-family:'SF Mono',Monaco,'Cascadia Code',monospace}
    .url-bar .lock{color:#00d4aa;font-size:11px}
    .url-bar .domain{color:#999}
    .url-bar .path{color:#00d4aa;font-weight:600}
    .brand{text-align:center;margin-bottom:32px}
    .brand-logo{font-size:48px;font-weight:900;letter-spacing:-2px;background:linear-gradient(135deg,#00d4aa,#00b4d8);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    .brand-sub{font-size:14px;color:#555;margin-top:4px;letter-spacing:2px;text-transform:uppercase}
    .brand-tagline{font-size:16px;color:#888;margin-top:12px;line-height:1.5}
    .brand-tagline strong{color:#00d4aa}
    .card{background:#111;border:1px solid #1a1a1a;border-radius:16px;padding:28px;max-width:380px;width:100%}
    .wa-badge{display:inline-flex;align-items:center;gap:8px;background:#25d36622;color:#25d366;font-size:13px;font-weight:600;padding:6px 14px;border-radius:20px;margin-bottom:20px}
    .wa-badge svg{width:18px;height:18px;fill:#25d366}
    .form-group{margin-bottom:14px}
    .form-label{display:block;font-size:12px;color:#666;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px}
    input{width:100%;padding:12px 14px;background:#0a0a0a;border:1px solid #222;border-radius:10px;color:#fff;font-size:15px;font-family:inherit}
    input:focus{outline:none;border-color:#00d4aa}
    input::placeholder{color:#444}
    .btn{display:block;width:100%;padding:14px;border-radius:10px;border:none;font-size:15px;font-weight:700;cursor:pointer;text-align:center;transition:all 0.2s}
    .btn-primary{background:linear-gradient(135deg,#00d4aa,#00b4d8);color:#000}
    .btn-primary:hover{opacity:0.9;transform:translateY(-1px)}
    .bottom{text-align:center;font-size:13px;color:#555;margin-top:20px}
    .bottom a{color:#00d4aa;text-decoration:none}
    .alert{padding:10px 14px;border-radius:8px;font-size:13px;margin-bottom:14px;background:#ff6b6b12;color:#ff6b6b;border:1px solid #ff6b6b22}
    .steps{display:flex;gap:8px;margin-bottom:20px;justify-content:center}
    .step{font-size:11px;color:#444;padding:4px 10px;border-radius:12px;border:1px solid #1a1a1a}
    .step.active{color:#00d4aa;border-color:#00d4aa44;background:#00d4aa08}
    .footer{margin-top:32px;text-align:center;font-size:12px;color:#333}
    .footer a{color:#444;text-decoration:none}
    .footer a:hover{color:#00d4aa}
  </style>
</head>
<body>
  <div class="url-bar">
    <span class="lock">&#x1f512;</span>
    <span class="domain">workspace.kitz.services</span>
    <span class="path">/start</span>
  </div>
  <div class="brand">
    <div class="brand-logo">KITZ</div>
    <div class="brand-sub">workspace</div>
    <div class="brand-tagline">Your hustle deserves <strong>infrastructure</strong>.</div>
  </div>
  <div class="steps">
    <div class="step active">1. Sign Up</div>
    <div class="step">2. Connect WhatsApp</div>
    <div class="step">3. You're Live</div>
  </div>
  <div class="card">
    <div class="wa-badge">
      <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.61.609l4.458-1.495A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.24 0-4.31-.726-5.993-1.957l-.418-.312-2.647.887.887-2.647-.312-.418A9.935 9.935 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
      Connect via WhatsApp
    </div>
    ${error}
    ${formHtml}
  </div>
  <div class="bottom">${bottomLink}</div>
  <div class="footer">
    <a href="https://workspace.kitz.services">workspace.kitz.services</a> &mdash; Free for early testers. No credit card.
  </div>
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

/* ── /start — branded shareable onboarding link ── */

app.get('/start', async (req: any, reply: any) => {
  const session = getSession(req);
  if (session) return reply.redirect('/whatsapp');
  const error = (req.query as any)?.error;
  const errorHtml = error === 'exists'
    ? `<div class="alert">That email is already registered. <a href="/start?mode=login" style="color:#00d4aa">Log in instead</a></div>`
    : error === 'validation'
    ? `<div class="alert">All fields are required. Password min 6 chars.</div>`
    : error === 'invalid'
    ? `<div class="alert">Invalid email or password.</div>`
    : '';
  const mode = (req.query as any)?.mode;
  if (mode === 'login') {
    return startPage(`
      <form method="POST" action="/auth/start-login">
        <div class="form-group"><label class="form-label">Email</label><input name="email" type="email" placeholder="you@example.com" required autofocus/></div>
        <div class="form-group"><label class="form-label">Password</label><input name="password" type="password" placeholder="Your password" required/></div>
        <button class="btn btn-primary" type="submit">Log In & Connect</button>
      </form>
    `, `New here? <a href="/start">Create a free account</a>`, errorHtml);
  }
  return startPage(`
    <form method="POST" action="/auth/start-register">
      <div class="form-group"><label class="form-label">Your Name</label><input name="name" placeholder="Maria Garcia" required autofocus/></div>
      <div class="form-group"><label class="form-label">Email</label><input name="email" type="email" placeholder="you@example.com" required/></div>
      <div class="form-group"><label class="form-label">Password</label><input name="password" type="password" placeholder="Min 6 characters" minlength="6" required/></div>
      <button class="btn btn-primary" type="submit">Create Account & Connect WhatsApp</button>
    </form>
  `, `Already have an account? <a href="/start?mode=login">Log in</a>`, errorHtml);
});

/* /start auth handlers — redirect to /whatsapp instead of /leads */

app.post('/auth/start-register', async (req: any, reply: any) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password || password.length < 6) return reply.redirect('/start?error=validation');
  const key = email.toLowerCase();
  if (registeredUsers.has(key)) return reply.redirect('/start?error=exists');
  const userId = randomUUID();
  const orgId = randomUUID();
  registeredUsers.set(key, { id: userId, email: key, name, passwordHash: hashPw(password), orgId });
  const token = mintJwt(userId, orgId);
  const sessionId = randomUUID();
  sessions.set(sessionId, { userId, email: key, name, token, orgId });
  funnel.signup += 1;
  reply.setCookie(COOKIE_NAME, sessionId, { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 604800 });
  return reply.redirect('/whatsapp');
});

app.post('/auth/start-login', async (req: any, reply: any) => {
  const { email, password } = req.body || {};
  if (!email || !password) return reply.redirect('/start?mode=login&error=invalid');
  const user = registeredUsers.get(email.toLowerCase());
  if (!user || user.passwordHash !== hashPw(password)) {
    authFailures += 1;
    return reply.redirect('/start?mode=login&error=invalid');
  }
  const token = mintJwt(user.id, user.orgId);
  const sessionId = randomUUID();
  sessions.set(sessionId, { userId: user.id, email: user.email, name: user.name, token, orgId: user.orgId });
  reply.setCookie(COOKIE_NAME, sessionId, { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 604800 });
  return reply.redirect('/whatsapp');
});

/* ── Standard Auth Pages (existing) ── */

app.get('/login', async (req: any, reply: any) => {
  if (getSession(req)) return reply.redirect('/leads');
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

app.get('/register', async (req: any, reply: any) => {
  if (getSession(req)) return reply.redirect('/leads');
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

  const key = email.toLowerCase();

  // Register via gateway (persists to DB) — fallback to local if gateway unreachable
  let userId: string;
  let orgId: string;
  let token: string;
  try {
    const gwRes = await fetch(`${gatewayUrl}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: key, password, name }),
      signal: AbortSignal.timeout(5000),
    });
    if (gwRes.ok) {
      const data = await gwRes.json() as { token: string; userId: string; orgId: string };
      userId = data.userId;
      orgId = data.orgId;
      token = data.token;
    } else if (gwRes.status === 409) {
      return reply.redirect('/register?error=exists');
    } else {
      throw new Error(`Gateway ${gwRes.status}`);
    }
  } catch {
    // Gateway unreachable — fallback to local auth
    if (registeredUsers.has(key)) {
      return reply.redirect('/register?error=exists');
    }
    userId = randomUUID();
    orgId = randomUUID();
    token = mintJwt(userId, orgId);
  }

  registeredUsers.set(key, { id: userId, email: key, name, passwordHash: hashPw(password), orgId });
  const sessionId = randomUUID();
  sessions.set(sessionId, { userId, email: key, name, token, orgId });
  funnel.signup += 1;

  reply.setCookie(COOKIE_NAME, sessionId, { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 604800 });
  return reply.redirect('/leads');
});

app.post('/auth/login', async (req: any, reply: any) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return reply.redirect('/login?error=invalid');
  }

  const key = email.toLowerCase();

  // Authenticate via gateway (checks DB) — fallback to local if unreachable
  let userId: string;
  let orgId: string;
  let token: string;
  let userName: string = '';
  try {
    const gwRes = await fetch(`${gatewayUrl}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: key, password }),
      signal: AbortSignal.timeout(5000),
    });
    if (gwRes.ok) {
      const data = await gwRes.json() as { token: string; userId: string; orgId: string; name?: string };
      userId = data.userId;
      orgId = data.orgId;
      token = data.token;
      userName = data.name || '';
    } else {
      throw new Error(`Gateway ${gwRes.status}`);
    }
  } catch {
    // Gateway unreachable — fallback to local auth
    const user = registeredUsers.get(key);
    if (!user || user.passwordHash !== hashPw(password)) {
      authFailures += 1;
      return reply.redirect('/login?error=invalid');
    }
    userId = user.id;
    orgId = user.orgId;
    userName = user.name;
    token = mintJwt(userId, orgId);
  }

  registeredUsers.set(key, { id: userId, email: key, name: userName, passwordHash: hashPw(password), orgId });
  const sessionId = randomUUID();
  sessions.set(sessionId, { userId, email: key, name: userName, token, orgId });

  reply.setCookie(COOKIE_NAME, sessionId, { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 604800 });
  return reply.redirect('/leads');
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
  return reply.redirect(session ? '/leads' : '/start');
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

  // Fetch from Supabase (with in-memory fallback)
  const dbLeads = await dbListLeads(session.userId);
  let leads: Lead[] = dbLeads.map(dbLeadToLead);

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
    <p class="page-desc">Track your leads and customers. Manual mode is always free.${hasDB ? '' : ' <span style="color:#555">(local mode)</span>'}</p>
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

  await dbCreateLead(session.userId, { name, phone: phone || '', email: email || '', notes: notes ? [notes] : [] });
  funnel.firstAction += 1;
  return reply.redirect('/leads');
});

app.post('/leads/delete', async (req: any, reply: any) => {
  const session = requireSession(req, reply);
  if (!session) return;
  const { id } = req.body || {};
  if (id) await dbDeleteLead(session.userId, id);
  return reply.redirect('/leads');
});

/* ── Orders Page ── */

app.get('/orders', async (req: any, reply: any) => {
  const session = requireSession(req, reply);
  if (!session) return;
  trackUsage('orders.view');

  // Fetch from Supabase (with in-memory fallback)
  const dbOrds = await dbListOrders(session.userId);
  let orders: Order[] = dbOrds.map(dbOrderToOrder);

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

  await dbCreateOrder(session.userId, { description: description || customer, total: Number(amount), status: 'pending' });
  funnel.firstAction += 1;
  return reply.redirect('/orders');
});

app.post('/orders/complete', async (req: any, reply: any) => {
  const session = requireSession(req, reply);
  if (!session) return;
  const { id } = req.body || {};
  if (id) await dbUpdateOrder(session.userId, id, { status: 'delivered' });
  return reply.redirect('/orders');
});

/* ── Tasks Page ── */

app.get('/tasks', async (req: any, reply: any) => {
  const session = requireSession(req, reply);
  if (!session) return;
  trackUsage('tasks.view');

  // Fetch from Supabase (with in-memory fallback)
  const dbTks = await dbListTasks(session.userId);
  let tasks: Task[] = dbTks.map(dbTaskToTask);
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
    <p class="page-desc">Create, assign, and close sales & ops tasks.${hasDB ? '' : ' <span style="color:#555">(local mode)</span>'}</p>
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

  await dbCreateTask(session.userId, title);
  funnel.firstAction += 1;
  return reply.redirect('/tasks');
});

app.post('/tasks/done', async (req: any, reply: any) => {
  const session = requireSession(req, reply);
  if (!session) return;
  const { id } = req.body || {};
  if (id) await dbUpdateTask(session.userId, id, { done: true });
  return reply.redirect('/tasks');
});

/* ── Checkout Links Page ── */

app.get('/checkout-links', async (req: any, reply: any) => {
  const session = requireSession(req, reply);
  if (!session) return;
  trackUsage('checkout-links.view');

  // Fetch from MCP (Supabase storefronts) with in-memory fallback
  // Fetch from Supabase (with in-memory fallback)
  const dbLinks = await dbListCheckoutLinks(session.userId);
  let links: CheckoutLink[] = dbLinks.map(dbCheckoutToLink);

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

  await dbCreateCheckoutLink(session.userId, { label: orderId, amount: Number(amount) });

  return reply.redirect('/checkout-links');
});

/* ── Products Page ── */

app.get('/products', async (req: any, reply: any) => {
  const session = requireSession(req, reply);
  if (!session) return;
  trackUsage('products.view');

  // Fetch from Supabase (with in-memory fallback)
  const dbProds = await dbListProducts(session.userId);
  let products: Product[] = dbProds.map(dbProductToProduct);

  const activeProducts = products.filter(p => p.is_active).length;
  const lowStock = products.filter(p => p.is_active && p.stock_qty <= p.low_stock_threshold && p.stock_qty > 0).length;
  const outOfStock = products.filter(p => p.is_active && p.stock_qty === 0).length;

  const listHtml = products.length
    ? products.map(p => {
        const stockColor = !p.is_active ? '#666' : p.stock_qty === 0 ? '#ff6b6b' : p.stock_qty <= p.low_stock_threshold ? '#ffb347' : '#00d4aa';
        return `<div class="list-item">
        <div>
          <div class="list-item-title" style="${!p.is_active ? 'color:#666' : ''}">${esc(p.name)}${!p.is_active ? ' <span class="list-item-badge done">Inactive</span>' : ''}${p.sku ? ` <span style="color:#555;font-size:12px">SKU: ${esc(p.sku)}</span>` : ''}</div>
          <div class="list-item-sub">$${p.price.toFixed(2)}${p.cost ? ` / Cost: $${p.cost.toFixed(2)}` : ''}${p.category ? ` &middot; ${esc(p.category)}` : ''} &middot; <span style="color:${stockColor}">Stock: ${p.stock_qty}</span></div>
        </div>
        <form method="POST" action="/products/delete" style="margin:0"><input type="hidden" name="id" value="${p.id}"/><button class="btn btn-sm btn-danger" type="submit">Remove</button></form>
      </div>`;
      }).join('')
    : `<div class="empty-state"><div class="icon">\uD83D\uDCE6</div>No products yet. Add your first product above.</div>`;

  return shell('Products', `
    <h1 class="page-title">Products</h1>
    <p class="page-desc">Manage your product catalog and inventory.${hasDB ? '' : ' <span style="color:#555">(local mode)</span>'}</p>
    <div class="stats-row">
      <div class="stat"><div class="stat-value">${activeProducts}</div><div class="stat-label">Active Products</div></div>
      <div class="stat"><div class="stat-value" style="color:${lowStock > 0 ? '#ffb347' : '#00d4aa'}">${lowStock}</div><div class="stat-label">Low Stock</div></div>
      <div class="stat"><div class="stat-value" style="color:${outOfStock > 0 ? '#ff6b6b' : '#00d4aa'}">${outOfStock}</div><div class="stat-label">Out of Stock</div></div>
    </div>
    <div class="card">
      <div class="card-header">
        <span class="card-title">Add Product</span>
        <span class="card-badge badge-free">FREE</span>
      </div>
      <form method="POST" action="/products/add">
        <div class="form-row">
          <div class="form-group"><label class="form-label">Name</label><input name="name" placeholder="Product name" required/></div>
          <div class="form-group"><label class="form-label">SKU</label><input name="sku" placeholder="SKU-001"/></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Price (USD)</label><input name="price" type="number" step="0.01" min="0.01" placeholder="25.00" required/></div>
          <div class="form-group"><label class="form-label">Cost (USD)</label><input name="cost" type="number" step="0.01" min="0" placeholder="10.00"/></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Category</label><input name="category" placeholder="e.g. Cakes, Clothing"/></div>
          <div class="form-group"><label class="form-label">Stock Qty</label><input name="stock_qty" type="number" min="0" placeholder="0" value="0"/></div>
        </div>
        <div class="form-group"><label class="form-label">Low Stock Threshold</label><input name="low_stock_threshold" type="number" min="0" placeholder="5" value="5" style="max-width:200px"/></div>
        <button class="btn btn-primary" type="submit">Add Product</button>
      </form>
    </div>
    <div class="card" style="padding:0">${listHtml}</div>
  `, session);
});

app.post('/products/add', async (req: any, reply: any) => {
  const session = requireSession(req, reply);
  if (!session) return;
  const { name, sku, price, cost, category, stock_qty, low_stock_threshold } = req.body || {};
  if (!name || !price) return reply.redirect('/products');

  await dbCreateProduct(session.userId, {
    name, sku: sku || '', price: Number(price), cost: Number(cost) || 0,
    category: category || '', stock_qty: Number(stock_qty) || 0,
    low_stock_threshold: Number(low_stock_threshold) || 5,
  });
  funnel.firstAction += 1;
  return reply.redirect('/products');
});

app.post('/products/update', async (req: any, reply: any) => {
  const session = requireSession(req, reply);
  if (!session) return;
  const { id, ...fields } = req.body || {};
  if (!id) return reply.redirect('/products');

  const updates: Record<string, unknown> = {};
  if (fields.name) updates.name = fields.name;
  if (fields.sku) updates.sku = fields.sku;
  if (fields.price) updates.price = Number(fields.price);
  if (fields.cost) updates.cost = Number(fields.cost);
  if (fields.category) updates.category = fields.category;
  if (fields.stock_qty !== undefined) updates.stock_qty = Number(fields.stock_qty);
  if (fields.low_stock_threshold !== undefined) updates.low_stock_threshold = Number(fields.low_stock_threshold);
  if (fields.is_active !== undefined) updates.is_active = fields.is_active === 'true';
  await dbUpdateProduct(session.userId, id, updates);
  return reply.redirect('/products');
});

app.post('/products/delete', async (req: any, reply: any) => {
  const session = requireSession(req, reply);
  if (!session) return;
  const { id } = req.body || {};
  if (id) await dbDeleteProduct(session.userId, id);
  return reply.redirect('/products');
});

/* ── WhatsApp Page ── */

app.get('/whatsapp', async (req: any, reply: any) => {
  const session = requireSession(req, reply);
  if (!session) return;
  trackUsage('whatsapp.view');

  // Check current connection status from the connector
  let waStatus: { isConnected: boolean; phoneNumber: string | null } = { isConnected: false, phoneNumber: null };
  try {
    const res = await fetch(`${waConnectorUrl}/whatsapp/sessions/${session.userId}/status`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json() as any;
      if (!data.error) {
        waStatus = { isConnected: !!data.isConnected, phoneNumber: data.phoneNumber || null };
      }
    }
  } catch {}

  return shell('WhatsApp', `
    <h1 class="page-title">WhatsApp</h1>
    <p class="page-desc">Connect your WhatsApp to KITZ. Messages to yourself become AI-powered commands.</p>

    <div class="stats-row">
      <div class="stat">
        <div class="stat-value" style="color:${waStatus.isConnected ? '#00d4aa' : '#ff6b6b'}" id="wa-status-dot">${waStatus.isConnected ? 'Connected' : 'Offline'}</div>
        <div class="stat-label">Status</div>
      </div>
      <div class="stat">
        <div class="stat-value" id="wa-phone">${waStatus.phoneNumber ? '+' + waStatus.phoneNumber : '--'}</div>
        <div class="stat-label">Phone</div>
      </div>
    </div>

    <div id="connected-view" style="display:${waStatus.isConnected ? 'block' : 'none'}">
      <div class="card">
        <div class="card-header">
          <span class="card-title">WhatsApp Connected</span>
          <span class="card-badge" style="background:#00d4aa22;color:#00d4aa">LIVE</span>
        </div>
        <p style="color:#888;font-size:14px;line-height:1.6;margin-bottom:16px;">
          Your WhatsApp is connected to KITZ. Open WhatsApp and send a message to yourself (your own chat) to interact with your AI business assistant.
        </p>
        <p style="color:#666;font-size:13px;">Try sending: <strong style="color:#ccc">"show my leads"</strong> or <strong style="color:#ccc">"create order for Maria $25"</strong></p>
      </div>
      <button class="btn btn-secondary btn-sm" id="btn-reconnect" style="margin-top:12px">Reconnect / New QR</button>
    </div>

    <div id="scan-view" style="display:${waStatus.isConnected ? 'none' : 'block'}">
      <div class="card" style="text-align:center">
        <div class="card-header" style="justify-content:center">
          <span class="card-title">Scan QR Code</span>
        </div>
        <div id="qr-wrapper" style="position:relative;display:inline-block;margin:16px 0">
          <svg id="countdown-ring" width="292" height="292" viewBox="0 0 292 292" style="position:absolute;top:-6px;left:-6px;pointer-events:none;display:none;">
            <circle fill="none" stroke-width="4" stroke="#222" cx="146" cy="146" r="143"/>
            <circle fill="none" stroke-width="4" stroke="#00d4aa" stroke-linecap="round" id="ring-progress" cx="146" cy="146" r="143"
              stroke-dasharray="898.5" stroke-dashoffset="0" transform="rotate(-90 146 146)"/>
          </svg>
          <div id="qr-container" style="background:#fff;border-radius:16px;padding:24px;display:inline-block;min-width:280px;min-height:280px;">
            <div id="spinner" style="width:48px;height:48px;border:3px solid #333;border-top-color:#00d4aa;border-radius:50%;animation:spin 0.8s linear infinite;margin:100px auto;"></div>
            <canvas id="qr-canvas"></canvas>
          </div>
        </div>
        <div id="qr-status" style="font-size:16px;color:#00d4aa;margin-bottom:4px;min-height:24px;">Connecting...</div>
        <div id="countdown-text" style="font-size:13px;color:#555;margin-bottom:16px;min-height:20px;font-variant-numeric:tabular-nums;"></div>
        <div style="color:#666;font-size:13px;line-height:1.6;text-align:left;max-width:320px;margin:0 auto;">
          <strong style="color:#aaa">1.</strong> Open WhatsApp on your phone<br>
          <strong style="color:#aaa">2.</strong> Go to Settings &rarr; Linked Devices<br>
          <strong style="color:#aaa">3.</strong> Tap "Link a Device"<br>
          <strong style="color:#aaa">4.</strong> Point your camera at this QR code
        </div>
      </div>
    </div>

    <div class="alert alert-info" style="margin-top:16px;">
      KITZ uses the self-chat model: only messages you send to yourself trigger AI. All other chats stay private.
    </div>
  `, session, `
    var scanView = document.getElementById('scan-view');
    var connView = document.getElementById('connected-view');
    var qrStatus = document.getElementById('qr-status');
    var spinner = document.getElementById('spinner');
    var canvas = document.getElementById('qr-canvas');
    var ring = document.getElementById('countdown-ring');
    var ringProgress = document.getElementById('ring-progress');
    var countdownText = document.getElementById('countdown-text');
    var statusDot = document.getElementById('wa-status-dot');
    var phoneEl = document.getElementById('wa-phone');
    var evtSource = null;
    var countdownInterval = null;
    var QR_LIFETIME = 60;
    var CIRCUMFERENCE = 898.5;
    var secondsLeft = QR_LIFETIME;

    function startCountdown() {
      secondsLeft = QR_LIFETIME;
      ring.style.display = 'block';
      ringProgress.style.strokeDashoffset = '0';
      updateCountdown();
      if (countdownInterval) clearInterval(countdownInterval);
      countdownInterval = setInterval(function() {
        secondsLeft--;
        if (secondsLeft <= 0) {
          clearInterval(countdownInterval);
          countdownText.textContent = 'New QR loading...';
          ringProgress.style.strokeDashoffset = CIRCUMFERENCE;
          return;
        }
        updateCountdown();
      }, 1000);
    }

    function updateCountdown() {
      var pct = 1 - (secondsLeft / QR_LIFETIME);
      ringProgress.style.strokeDashoffset = (pct * CIRCUMFERENCE).toFixed(1);
      if (secondsLeft > 10) {
        countdownText.textContent = secondsLeft + 's remaining';
        ringProgress.style.stroke = '#00d4aa';
      } else {
        countdownText.textContent = secondsLeft + 's — scan now!';
        ringProgress.style.stroke = '#ff6b6b';
      }
    }

    function startSSE() {
      if (evtSource) { evtSource.close(); }
      scanView.style.display = 'block';
      connView.style.display = 'none';
      spinner.style.display = 'block';
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      qrStatus.textContent = 'Connecting...';
      qrStatus.style.color = '#00d4aa';

      evtSource = new EventSource('/whatsapp/proxy-connect');

      evtSource.addEventListener('qr', function(e) {
        spinner.style.display = 'none';
        qrStatus.textContent = 'Scan with WhatsApp';
        qrStatus.style.color = '#00d4aa';
        QRCode.toCanvas(canvas, e.data, { width: 256, margin: 0, color: { dark: '#000', light: '#fff' } });
        startCountdown();
      });

      evtSource.addEventListener('connected', function(e) {
        if (countdownInterval) clearInterval(countdownInterval);
        var data = JSON.parse(e.data);
        scanView.style.display = 'none';
        connView.style.display = 'block';
        statusDot.textContent = 'Connected';
        statusDot.style.color = '#00d4aa';
        phoneEl.textContent = '+' + (data.phone || 'Connected');
        evtSource.close();
        showToast('WhatsApp connected!');
      });

      evtSource.addEventListener('error', function() {
        qrStatus.textContent = 'Connection error — retrying...';
        qrStatus.style.color = '#ff6b6b';
      });

      evtSource.addEventListener('logged_out', function() {
        qrStatus.textContent = 'Session expired — click Reconnect';
        qrStatus.style.color = '#ff6b6b';
      });

      evtSource.onerror = function() {
        qrStatus.textContent = 'Server disconnected — click Reconnect';
        qrStatus.style.color = '#ff6b6b';
      };
    }

    // Start SSE only if not already connected
    if (!${waStatus.isConnected}) {
      startSSE();
    }

    document.getElementById('btn-reconnect')?.addEventListener('click', function() {
      startSSE();
    });
  `, '<script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js" async><\/script>');
});

// ── WhatsApp SSE proxy — forwards QR stream from connector with workspace userId ──
app.get('/whatsapp/proxy-connect', async (req: any, reply: any) => {
  const session = getSession(req);
  if (!session) return reply.code(401).send({ error: 'Not authenticated' });

  const upstreamUrl = `${waConnectorUrl}/whatsapp/connect?userId=${session.userId}`;
  app.log.info({ upstreamUrl }, 'SSE proxy connecting');

  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: { Accept: 'text/event-stream' },
      signal: AbortSignal.timeout(120_000),
    });

    if (!upstream.ok || !upstream.body) {
      app.log.error({ status: upstream.status, statusText: upstream.statusText }, 'SSE proxy upstream failed');
      reply.raw.write(`event: error\ndata: ${JSON.stringify({ error: 'WhatsApp connector unavailable (' + upstream.status + ')' })}\n\n`);
      reply.raw.end();
      return;
    }

    const reader = (upstream.body as any).getReader();
    const decoder = new TextDecoder();

    const pump = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          reply.raw.write(decoder.decode(value, { stream: true }));
        }
      } catch {}
      reply.raw.end();
    };

    pump();

    req.raw.on('close', () => {
      try { reader.cancel(); } catch {}
    });
  } catch (err) {
    app.log.error({ error: (err as Error).message, waConnectorUrl }, 'SSE proxy error');
    reply.raw.write(`event: error\ndata: ${JSON.stringify({ error: 'Cannot reach WhatsApp connector at ' + waConnectorUrl })}\n\n`);
    reply.raw.end();
  }
});

// ── SSE proxy for React SPA (/api/whatsapp/* routes) ──
// The React SPA uses /api/whatsapp/whatsapp/connect — proxy to the connector
app.get('/api/whatsapp/whatsapp/connect', async (req: any, reply: any) => {
  const userId = (req.query as any).userId || randomUUID();
  const upstreamUrl = `${waConnectorUrl}/whatsapp/connect?userId=${encodeURIComponent(userId)}`;
  app.log.info({ upstreamUrl }, 'React SPA SSE proxy connecting');

  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  try {
    const upstream = await fetch(upstreamUrl, {
      signal: AbortSignal.timeout(120_000),
    });

    if (!upstream.ok || !upstream.body) {
      reply.raw.write('event: error\ndata: {"error":"WhatsApp connector unavailable"}\n\n');
      reply.raw.end();
      return;
    }

    const reader = (upstream.body as any).getReader();
    const decoder = new TextDecoder();

    const pump = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          reply.raw.write(decoder.decode(value, { stream: true }));
        }
      } catch {}
      reply.raw.end();
    };

    req.raw.on('close', () => {
      try { reader.cancel(); } catch {}
    });

    pump().catch(() => reply.raw.end());
  } catch {
    reply.raw.write('event: error\ndata: {"error":"Could not reach WhatsApp connector"}\n\n');
    reply.raw.end();
  }
});

app.delete('/api/whatsapp/whatsapp/sessions/:userId', async (req: any) => {
  try {
    const res = await fetch(`${waConnectorUrl}/whatsapp/sessions/${encodeURIComponent(req.params.userId)}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(10_000),
    });
    return await res.json();
  } catch {
    return { error: 'WhatsApp connector unavailable' };
  }
});

// ── WhatsApp status API ──
app.get('/api/whatsapp/status', async (req: any) => {
  const session = getSession(req);
  if (!session) return { error: 'Not authenticated' };
  try {
    const res = await fetch(`${waConnectorUrl}/whatsapp/sessions/${session.userId}/status`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return { isConnected: false, phoneNumber: null };
    return await res.json();
  } catch {
    return { isConnected: false, phoneNumber: null, error: 'connector_offline' };
  }
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
    var limit=d.dailyLimit||5;
    var depleted=d.depleted||false;
    document.getElementById('battery-credits').textContent=c+'/'+limit;
    document.getElementById('battery-status').textContent=depleted?'Depleted':(d.status==='kitz_os_offline'?'Offline':'Active');
    if(!depleted&&c>0){document.getElementById('run-ai').disabled=false;}
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

/* ── JSON REST API for UI (Bearer token auth) ── */

/** Extract userId from Bearer JWT, service header, or cookie session */
function getApiUser(req: any): { userId: string; orgId: string } | null {
  // Try service-to-service auth (kitz_os → workspace): x-user-id header with JWT_SECRET as Bearer
  const serviceUserId = req.headers?.['x-user-id'] as string | undefined;
  const authHeader = req.headers?.authorization as string | undefined;
  if (serviceUserId && authHeader) {
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    if (token === JWT_SECRET) {
      return { userId: serviceUserId, orgId: '' };
    }
  }
  // Try Bearer JWT token (UI sends this)
  if (authHeader) {
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        // Verify signature
        const sigCheck = b64url(createHmac('sha256', JWT_SECRET).update(`${parts[0]}.${parts[1]}`).digest());
        if (sigCheck === parts[2]) {
          const payload = JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
          if (payload.sub && payload.exp && payload.exp > Math.floor(Date.now() / 1000)) {
            return { userId: payload.sub, orgId: payload.org_id || '' };
          }
        }
      }
    } catch { /* fall through to cookie */ }
  }
  // Fall back to cookie session
  const session = getSession(req);
  if (session) return { userId: session.userId, orgId: session.orgId };
  return null;
}

/** Middleware: require API auth (Bearer or cookie) */
function requireApiAuth(req: any, reply: any): { userId: string; orgId: string } | null {
  const user = getApiUser(req);
  if (!user) {
    const traceId = getTraceId(req);
    reply.code(401).send(buildStdError('AUTH_REQUIRED', 'Bearer token or session cookie required', traceId));
    return null;
  }
  return user;
}

/* ── Leads / CRM ── */

app.get('/api/workspace/leads', async (req: any, reply: any) => {
  const user = requireApiAuth(req, reply);
  if (!user) return;
  const rows = await dbListLeads(user.userId);
  return rows.map(dbLeadToLead);
});

app.post('/api/workspace/leads', async (req: any, reply: any) => {
  const user = requireApiAuth(req, reply);
  if (!user) return;
  const body = req.body || {};
  const row = await dbCreateLead(user.userId, {
    name: body.name || '', phone: body.phone || '', email: body.email || '',
    notes: body.notes ? [body.notes] : [],
  });
  trackUsage('api.leads.create');
  return dbLeadToLead(row);
});

app.patch('/api/workspace/leads/:id', async (req: any, reply: any) => {
  const user = requireApiAuth(req, reply);
  if (!user) return;
  const body = req.body || {};
  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.phone !== undefined) updates.phone = body.phone;
  if (body.email !== undefined) updates.email = body.email;
  if (body.stage !== undefined) updates.stage = body.stage;
  const row = await dbUpdateLead(user.userId, req.params.id, updates);
  if (!row) return reply.code(404).send({ error: 'NOT_FOUND' });
  return dbLeadToLead(row);
});

app.delete('/api/workspace/leads/:id', async (req: any, reply: any) => {
  const user = requireApiAuth(req, reply);
  if (!user) return;
  await dbDeleteLead(user.userId, req.params.id);
  return { deleted: true };
});

app.post('/api/workspace/leads/:id/notes', async (req: any, reply: any) => {
  const user = requireApiAuth(req, reply);
  if (!user) return;
  const note = (req.body || {}).note || '';
  // Append note to existing notes array
  const rows = await dbListLeads(user.userId);
  const existing = rows.find(l => l.id === req.params.id);
  if (!existing) return reply.code(404).send({ error: 'NOT_FOUND' });
  const updatedNotes = [...(existing.notes || []), note];
  await dbUpdateLead(user.userId, req.params.id, { notes: updatedNotes });
  return { ok: true };
});

/* ── Orders ── */

app.get('/api/workspace/orders', async (req: any, reply: any) => {
  const user = requireApiAuth(req, reply);
  if (!user) return;
  const rows = await dbListOrders(user.userId);
  return rows.map(dbOrderToOrder);
});

app.post('/api/workspace/orders', async (req: any, reply: any) => {
  const user = requireApiAuth(req, reply);
  if (!user) return;
  const body = req.body || {};
  const row = await dbCreateOrder(user.userId, {
    description: body.description || body.customer || '',
    total: Number(body.total || body.amount || 0),
    status: body.status || 'pending',
  });
  trackUsage('api.orders.create');
  return dbOrderToOrder(row);
});

app.patch('/api/workspace/orders/:id', async (req: any, reply: any) => {
  const user = requireApiAuth(req, reply);
  if (!user) return;
  const body = req.body || {};
  const updates: Record<string, unknown> = {};
  if (body.status !== undefined) updates.status = body.status;
  if (body.description !== undefined) updates.description = body.description;
  if (body.total !== undefined) updates.total = Number(body.total);
  const row = await dbUpdateOrder(user.userId, req.params.id, updates);
  if (!row) return reply.code(404).send({ error: 'NOT_FOUND' });
  return dbOrderToOrder(row);
});

/* ── Tasks ── */

app.get('/api/workspace/tasks', async (req: any, reply: any) => {
  const user = requireApiAuth(req, reply);
  if (!user) return;
  const rows = await dbListTasks(user.userId);
  return rows.map(dbTaskToTask);
});

app.post('/api/workspace/tasks', async (req: any, reply: any) => {
  const user = requireApiAuth(req, reply);
  if (!user) return;
  const body = req.body || {};
  const row = await dbCreateTask(user.userId, body.title || '');
  trackUsage('api.tasks.create');
  return dbTaskToTask(row);
});

app.patch('/api/workspace/tasks/:id', async (req: any, reply: any) => {
  const user = requireApiAuth(req, reply);
  if (!user) return;
  const body = req.body || {};
  const updates: Record<string, unknown> = {};
  if (body.done !== undefined) updates.done = body.done;
  if (body.title !== undefined) updates.title = body.title;
  const row = await dbUpdateTask(user.userId, req.params.id, updates);
  if (!row) return reply.code(404).send({ error: 'NOT_FOUND' });
  return dbTaskToTask(row);
});

/* ── Checkout Links ── */

app.get('/api/workspace/checkout-links', async (req: any, reply: any) => {
  const user = requireApiAuth(req, reply);
  if (!user) return;
  const rows = await dbListCheckoutLinks(user.userId);
  return rows.map(dbCheckoutToLink);
});

app.post('/api/workspace/checkout-links', async (req: any, reply: any) => {
  const user = requireApiAuth(req, reply);
  if (!user) return;
  const body = req.body || {};
  const row = await dbCreateCheckoutLink(user.userId, {
    label: body.orderId || body.label || '', amount: Number(body.amount || 0),
  });
  trackUsage('api.checkout.create');
  return dbCheckoutToLink(row);
});

/* ── Products / Inventory ── */

app.get('/api/workspace/products', async (req: any, reply: any) => {
  const user = requireApiAuth(req, reply);
  if (!user) return;
  const rows = await dbListProducts(user.userId);
  return rows.map(dbProductToProduct);
});

app.post('/api/workspace/products', async (req: any, reply: any) => {
  const user = requireApiAuth(req, reply);
  if (!user) return;
  const body = req.body || {};
  const row = await dbCreateProduct(user.userId, {
    name: body.name || '', description: body.description || '',
    price: Number(body.price || 0), cost: Number(body.cost || 0),
    sku: body.sku || '', stock_qty: Number(body.stock_qty || 0),
    low_stock_threshold: Number(body.low_stock_threshold || 5),
    category: body.category || '', image_url: body.image_url || '',
  });
  trackUsage('api.products.create');
  return dbProductToProduct(row);
});

app.patch('/api/workspace/products/:id', async (req: any, reply: any) => {
  const user = requireApiAuth(req, reply);
  if (!user) return;
  const body = req.body || {};
  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.description !== undefined) updates.description = body.description;
  if (body.price !== undefined) updates.price = Number(body.price);
  if (body.cost !== undefined) updates.cost = Number(body.cost);
  if (body.sku !== undefined) updates.sku = body.sku;
  if (body.stock_qty !== undefined) updates.stock_qty = Number(body.stock_qty);
  if (body.low_stock_threshold !== undefined) updates.low_stock_threshold = Number(body.low_stock_threshold);
  if (body.category !== undefined) updates.category = body.category;
  if (body.image_url !== undefined) updates.image_url = body.image_url;
  if (body.is_active !== undefined) updates.is_active = body.is_active;
  const row = await dbUpdateProduct(user.userId, req.params.id, updates);
  if (!row) return reply.code(404).send({ error: 'NOT_FOUND' });
  return dbProductToProduct(row);
});

app.delete('/api/workspace/products/:id', async (req: any, reply: any) => {
  const user = requireApiAuth(req, reply);
  if (!user) return;
  await dbDeleteProduct(user.userId, req.params.id);
  return { deleted: true };
});

/* ── Payments API ── */

app.get('/api/workspace/payments', async (req: any, reply: any) => {
  const user = requireApiAuth(req, reply);
  if (!user) return;
  const rows = await dbListPayments(user.userId);
  return rows.map(dbPaymentToPayment);
});

app.post('/api/workspace/payments', async (req: any, reply: any) => {
  const user = requireApiAuth(req, reply);
  if (!user) return;
  const { type, description, amount, status, method } = req.body || {};
  if (!description || !amount) return reply.code(400).send({ error: 'MISSING_FIELDS' });
  const row = await dbCreatePayment(user.userId, {
    type: type || 'incoming', description, amount: Number(amount),
    status: status || 'pending', method: method || 'manual',
  });
  return reply.code(201).send(dbPaymentToPayment(row));
});

app.get('/health', async () => {
  const checks: Record<string, string> = { workspace: 'ok' };
  // Check Supabase connectivity
  if (hasDB) {
    try {
      const leads = await dbListLeads('__health_check__');
      checks.database = Array.isArray(leads) ? 'ok' : 'degraded';
    } catch { checks.database = 'unreachable'; }
  } else {
    checks.database = 'in-memory';
  }
  const allOk = Object.values(checks).every(v => v === 'ok' || v === 'in-memory');
  return { status: allOk ? 'ok' : 'degraded', checks };
});

/* ── 404 catch-all — redirect unknown routes to /start ── */
app.setNotFoundHandler(async (_req: any, reply: any) => {
  return reply.redirect('/start');
});

/** Escape HTML to prevent XSS */
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

if (process.env.NODE_ENV !== 'test') {
  app.listen({ port: Number(process.env.PORT || 3001), host: '0.0.0.0' }).catch((err) => {
    app.log.fatal({ err }, 'workspace failed to start');
    process.exit(1);
  });
}

export default app;
