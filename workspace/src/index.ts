import Fastify from 'fastify';
import { randomUUID } from 'node:crypto';

export const health = { status: 'ok' };
const app = Fastify({ logger: true });
const gatewayUrl = process.env.GATEWAY_URL || 'http://localhost:4000';

const ELEVENLABS_AGENT_ID = process.env.ELEVENLABS_AGENT_ID || '';
const voiceWidget = ELEVENLABS_AGENT_ID
  ? `<script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async type="text/javascript"></script><elevenlabs-convai agent-id="${ELEVENLABS_AGENT_ID}"></elevenlabs-convai>`
  : '';

const shell = (title: string, body: string, script = '') => `<!DOCTYPE html>
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
    .topbar .label {
      color: #555;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
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
    <div class="label">Workspace</div>
  </div>
  <nav>
    <a href="/leads" class="${title === 'Leads' ? 'active' : ''}">Leads</a>
    <a href="/orders" class="${title === 'Orders' ? 'active' : ''}">Orders</a>
    <a href="/tasks" class="${title === 'Tasks' ? 'active' : ''}">Tasks</a>
    <a href="/checkout-links" class="${title === 'Checkout Links' ? 'active' : ''}">Checkout</a>
    <a href="/ai-direction" class="${title === 'AI Direction' ? 'active' : ''}">AI</a>
  </nav>
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
  if (req.headers.authorization === 'invalid') authFailures += 1;
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

app.get('/leads', async () => {
  trackUsage('leads.view');
  return shell(
    'Leads',
    `<h1 class="page-title">Leads & Contacts</h1>
    <p class="page-desc">Track your leads and customers. Manual mode is always free.</p>
    <div class="stats-row">
      <div class="stat"><div class="stat-value">0</div><div class="stat-label">Total Leads</div></div>
      <div class="stat"><div class="stat-value">0</div><div class="stat-label">Active</div></div>
      <div class="stat"><div class="stat-value">0</div><div class="stat-label">This Week</div></div>
    </div>
    <div class="alert alert-info">Connect your WhatsApp to import contacts automatically.</div>
    <div class="card">
      <div class="card-header">
        <span class="card-title">Quick Add</span>
        <span class="card-badge badge-free">FREE</span>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Name</label><input id="lead-name" placeholder="Maria Garcia"/></div>
        <div class="form-group"><label class="form-label">Phone</label><input id="lead-phone" placeholder="+507 6000-0000"/></div>
      </div>
      <button class="btn btn-primary" id="signup-btn">Add Lead</button>
    </div>
    <div class="empty-state"><div class="icon">\uD83D\uDCCB</div>No leads yet. Add your first contact above.</div>`,
    `document.getElementById('signup-btn')?.addEventListener('click',function(){fetch('/api/funnel/signup',{method:'POST'});showToast('Lead added!');});`
  );
});

app.get('/orders', async () => {
  trackUsage('orders.view');
  return shell(
    'Orders',
    `<h1 class="page-title">Orders</h1>
    <p class="page-desc">Track open orders and update statuses with approval controls.</p>
    <div class="stats-row">
      <div class="stat"><div class="stat-value">0</div><div class="stat-label">Open</div></div>
      <div class="stat"><div class="stat-value">$0</div><div class="stat-label">Revenue</div></div>
      <div class="stat"><div class="stat-value">0</div><div class="stat-label">Completed</div></div>
    </div>
    <div class="card">
      <div class="card-header">
        <span class="card-title">New Order</span>
        <span class="card-badge badge-free">FREE</span>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Customer</label><input placeholder="Select contact"/></div>
        <div class="form-group"><label class="form-label">Amount</label><input type="number" placeholder="0.00"/></div>
      </div>
      <div class="form-group"><label class="form-label">Description</label><input placeholder="What are they ordering?"/></div>
      <button class="btn btn-primary">Create Order</button>
    </div>
    <div class="empty-state"><div class="icon">\uD83D\uDCE6</div>No orders yet. Create your first one above.</div>`
  );
});

app.get('/tasks', async () => {
  trackUsage('tasks.view');
  return shell(
    'Tasks',
    `<h1 class="page-title">Tasks</h1>
    <p class="page-desc">Create, assign, and close sales & ops tasks.</p>
    <div class="stats-row">
      <div class="stat"><div class="stat-value">0</div><div class="stat-label">To Do</div></div>
      <div class="stat"><div class="stat-value">0</div><div class="stat-label">In Progress</div></div>
      <div class="stat"><div class="stat-value">0</div><div class="stat-label">Done</div></div>
    </div>
    <div class="card">
      <div class="card-header">
        <span class="card-title">Quick Task</span>
        <span class="card-badge badge-free">FREE</span>
      </div>
      <div class="form-group"><label class="form-label">Task</label><input id="task-input" placeholder="Follow up with Maria about cake order"/></div>
      <button class="btn btn-primary" onclick="showToast('Task created!')">Add Task</button>
    </div>
    <div class="empty-state"><div class="icon">\u2705</div>No tasks yet. Add one above to get started.</div>
    <div style="margin-top:24px;text-align:center">
      <button class="btn btn-secondary btn-sm" id="confused">Something confusing? Let us know</button>
    </div>`,
    `document.getElementById('confused')?.addEventListener('click',function(){fetch('/api/funnel/confusing-step',{method:'POST'});showToast('Feedback sent - thanks!');});`
  );
});

app.get('/ai-direction', async () => {
  trackUsage('ai-direction.view');
  return shell(
    'AI Direction',
    `<h1 class="page-title">AI Direction</h1>
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
    <div class="alert alert-info">Manual mode is always free. AI costs 0.5\u20132 credits per task.</div>`,
    `fetch('/api/ai-battery').then(function(r){return r.json()}).then(function(d){
      var c=d.credits||0;
      document.getElementById('battery-credits').textContent=c;
      document.getElementById('battery-status').textContent=c>0?'Active':'Depleted';
      if(c>0){document.getElementById('run-ai').disabled=false;}
      else{document.getElementById('battery-warn').style.display='block';}
    }).catch(function(){
      document.getElementById('battery-credits').textContent='?';
      document.getElementById('battery-status').textContent='Offline';
    });`
  );
});

app.get('/checkout-links', async () => {
  trackUsage('checkout-links.view');
  return shell(
    'Checkout Links',
    `<h1 class="page-title">Checkout Links</h1>
    <p class="page-desc">Create mobile payment links. Share via WhatsApp or email (draft-only).</p>
    <div class="stats-row">
      <div class="stat"><div class="stat-value">0</div><div class="stat-label">Active Links</div></div>
      <div class="stat"><div class="stat-value">$0</div><div class="stat-label">Collected</div></div>
      <div class="stat"><div class="stat-value">0</div><div class="stat-label">Sent</div></div>
    </div>
    <div class="card">
      <div class="card-header">
        <span class="card-title">New Payment Link</span>
        <span class="card-badge badge-free">FREE</span>
      </div>
      <form id="checkout-form" method="post" action="/checkout-links/create">
        <div class="form-row">
          <div class="form-group"><label class="form-label">Order ID</label><input name="orderId" placeholder="ORD-001" required/></div>
          <div class="form-group"><label class="form-label">Amount (USD)</label><input name="amount" type="number" step="0.01" min="0.01" placeholder="25.00" required/></div>
        </div>
        <button class="btn btn-primary" type="submit">Create Payment Link</button>
      </form>
    </div>
    <div class="alert alert-info">Links are created as drafts. Share via WhatsApp or copy the URL.</div>
    <div class="empty-state"><div class="icon">\uD83D\uDCB3</div>No checkout links yet. Create one above.</div>`,
    `document.getElementById('checkout-form')?.addEventListener('submit',function(e){
      e.preventDefault();
      var fd=new FormData(this);
      fetch('/checkout-links/create',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({orderId:fd.get('orderId'),amount:fd.get('amount')})})
      .then(function(r){return r.json()})
      .then(function(d){if(d.mobileCheckoutLink){showToast('Link created! '+d.mobileCheckoutLink);}else{showToast('Created!','success');}})
      .catch(function(){showToast('Error creating link','error');});
      navigator.sendBeacon('/api/funnel/first-action');
    });`
  );
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

app.get('/api/ai-battery', async () => {
  trackUsage('ai-battery.check');
  const traceId = randomUUID();
  const response = await fetch(`${gatewayUrl}/ai-battery/balance`, {
    headers: {
      authorization: 'Bearer xyz-user-token',
      'x-org-id': 'demo-org',
      'x-trace-id': traceId,
      'x-scopes': 'battery:read'
    }
  });

  return response.json();
});

app.post('/checkout-links/create', async (req: any) => {
  trackUsage('checkout-links.create');
  funnel.firstAction += 1;
  const traceId = randomUUID();
  const payload = { orderId: req.body?.orderId || 'manual-order', amount: Number(req.body?.amount || 0), currency: 'USD' };

  const sessionResponse = await fetch(`${gatewayUrl}/payments/checkout-session`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer xyz-user-token',
      'x-org-id': 'demo-org',
      'x-trace-id': traceId,
      'x-scopes': 'payments:write'
    },
    body: JSON.stringify(payload)
  });

  const session = await sessionResponse.json();
  return { ...session, actions: ['copy-link', 'share-whatsapp-draft', 'share-email-draft'] };
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

if (process.env.NODE_ENV !== 'test') {
  app.listen({ port: Number(process.env.PORT || 3001), host: '0.0.0.0' });
}

export default app;
