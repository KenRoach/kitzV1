import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import formbody from '@fastify/formbody';
import { randomUUID, createHash, createHmac } from 'node:crypto';
import { callMcp, mcpConfigured } from './mcp.js';

export const health = { status: 'ok' };
const app = Fastify({ logger: true });
const gatewayUrl = process.env.GATEWAY_URL || 'http://localhost:4000';
const waConnectorUrl = process.env.WA_CONNECTOR_URL || 'http://localhost:3006';
const COOKIE_NAME = 'kitz_session';
const JWT_SECRET = process.env.JWT_SECRET || process.env.DEV_TOKEN_SECRET || 'kitz-dev-secret';

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
  <title>KITZ OS — Connect WhatsApp</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0a0a0a;color:#fff;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px}
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
  </style>
</head>
<body>
  <div class="brand">
    <div class="brand-logo">KITZ OS</div>
    <div class="brand-sub">Business Operating System</div>
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
  <div class="footer">Free for early testers. No credit card.</div>
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

  const key = email.toLowerCase();
  if (registeredUsers.has(key)) {
    return reply.redirect('/register?error=exists');
  }

  const userId = randomUUID();
  const orgId = randomUUID();
  registeredUsers.set(key, { id: userId, email: key, name, passwordHash: hashPw(password), orgId });

  const token = mintJwt(userId, orgId);
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

  const user = registeredUsers.get(email.toLowerCase());
  if (!user || user.passwordHash !== hashPw(password)) {
    authFailures += 1;
    return reply.redirect('/login?error=invalid');
  }

  const token = mintJwt(user.id, user.orgId);
  const sessionId = randomUUID();
  sessions.set(sessionId, { userId: user.id, email: user.email, name: user.name, token, orgId: user.orgId });

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

  // Fetch from MCP (Supabase) with in-memory fallback
  let tasks: Task[] = userTasks.get(session.userId) || [];
  if (mcpConfigured) {
    const result = await callMcp('list_tasks', { limit: 100 }, session.userId) as any;
    if (result && !result.error && Array.isArray(result)) {
      tasks = result.map((t: any) => ({
        id: t.id,
        title: t.title || t.description || '',
        status: t.status || 'todo',
        createdAt: t.created_at || new Date().toISOString(),
      }));
    }
  }
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
    <p class="page-desc">Create, assign, and close sales & ops tasks.${mcpConfigured ? '' : ' <span style="color:#555">(offline mode)</span>'}</p>
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

  // Write to MCP (Supabase)
  if (mcpConfigured) {
    await callMcp('create_task', { title, status: 'todo' }, session.userId);
  }
  // Also keep in-memory for instant reads
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
  // Update in MCP
  if (mcpConfigured && id) {
    await callMcp('update_task', { task_id: id, status: 'done' }, session.userId);
  }
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

  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  try {
    const upstream = await fetch(`${waConnectorUrl}/whatsapp/connect?userId=${session.userId}`, {
      headers: { Accept: 'text/event-stream' },
      signal: AbortSignal.timeout(120_000),
    });

    if (!upstream.ok || !upstream.body) {
      reply.raw.write(`event: error\ndata: ${JSON.stringify({ error: 'WhatsApp connector unavailable' })}\n\n`);
      reply.raw.end();
      return;
    }

    const reader = upstream.body.getReader();
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
  } catch {
    reply.raw.write(`event: error\ndata: ${JSON.stringify({ error: 'Cannot reach WhatsApp connector' })}\n\n`);
    reply.raw.end();
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

app.get('/health', async () => health);

/** Escape HTML to prevent XSS */
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

if (process.env.NODE_ENV !== 'test') {
  app.listen({ port: Number(process.env.PORT || 3001), host: '0.0.0.0' });
}

export default app;
