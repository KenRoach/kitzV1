import Fastify from 'fastify';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { runCompliancePipeline } from './compliance-agent/run.js';
import { readHistory, readLatest } from './compliance-agent/storage.js';
import { generateContent, type ContentRequest } from './content/generator.js';
import { listTemplates, getTemplateByName, upsertTemplate, renderTemplate, type ContentTemplate } from './content/templateStore.js';

export const health = { status: 'ok' };

const ELEVENLABS_AGENT_ID = process.env.ELEVENLABS_AGENT_ID || '';
const voiceWidget = ELEVENLABS_AGENT_ID
  ? `<script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async type="text/javascript"></script><elevenlabs-convai agent-id="${ELEVENLABS_AGENT_ID}"></elevenlabs-convai>`
  : '';

const complianceHtml = (countryMarkdown: string, latestAt: string): string => `<!doctype html>
<html>
  <body>
    <h1>Compliance</h1>
    <p>Last updated: ${latestAt}</p>
    <pre>${countryMarkdown.replace(/</g, '&lt;')}</pre>
    ${voiceWidget}
  </body>
</html>`;

export const createApp = () => {
  const app = Fastify({ logger: true });

  app.get('/', async () => ({
    service: 'kitz-services',
    hub: 'marketing + free AI business content'
  }));

  app.get('/content/free-guides', async () => ({
    guides: [
      { slug: 'lead-follow-up-basics', title: 'Lead Follow-up Basics' },
      { slug: 'manual-first-ops-playbook', title: 'Manual-first Ops Playbook' },
      { slug: 'whatsapp-sales-playbook', title: 'WhatsApp Sales Playbook' },
      { slug: 'pricing-strategy-101', title: 'Pricing Strategy 101' },
    ]
  }));

  // ── Content templates (CRUD) ──
  app.get('/content/templates', async (req: any) => {
    const orgId = String(req.headers['x-org-id'] || 'default');
    const kind = (req.query as { kind?: string }).kind;
    return { templates: await listTemplates(orgId, kind) };
  });

  app.get('/content/templates/:name', async (req: any, reply) => {
    const orgId = String(req.headers['x-org-id'] || 'default');
    const template = await getTemplateByName(orgId, req.params.name);
    if (!template) return reply.code(404).send({ error: 'Template not found' });
    return template;
  });

  app.post('/content/templates', async (req: any) => {
    const orgId = String(req.headers['x-org-id'] || 'default');
    const body = req.body as { kind: string; name: string; content: string; language?: string };
    const now = new Date().toISOString();
    const template: ContentTemplate = {
      id: `tpl_${Date.now()}_${randomUUID().slice(0, 8)}`,
      orgId,
      kind: body.kind as ContentTemplate['kind'],
      name: body.name,
      content: body.content,
      language: body.language || 'es',
      createdAt: now,
      updatedAt: now,
    };
    await upsertTemplate(template);
    return { ok: true, template };
  });

  app.post('/content/templates/:name/render', async (req: any, reply) => {
    const orgId = String(req.headers['x-org-id'] || 'default');
    const template = await getTemplateByName(orgId, req.params.name);
    if (!template) return reply.code(404).send({ error: 'Template not found' });
    const vars = (req.body as { vars?: Record<string, string> })?.vars || {};
    return { rendered: renderTemplate(template.content, vars) };
  });

  // ── Content generation (LLM-powered) ──
  app.post('/content/generate', async (req: any) => {
    const body = req.body as ContentRequest;
    const result = await generateContent(body);
    return result;
  });

  app.get('/compliance', async () => ({ page: '/compliance/panama', country: 'Panama' }));

  app.get('/compliance/panama', async () => {
    const countryPath = path.resolve(process.cwd(), 'content/compliance/Panama.md');
    const latest = await readLatest('Panama').catch(() => []);
    const markdown = await fs.readFile(countryPath, 'utf8').catch(() => '# Panama Compliance\n\nNo update yet.');
    return complianceHtml(markdown, latest.at(-1)?.detected_at || 'n/a');
  });

  app.get('/api/compliance/latest', async (req, reply) => {
    reply.header('cache-control', 'public, max-age=300');
    const query = req.query as { country?: string };
    if ((query.country || 'Panama') !== 'Panama') {
      return reply.code(400).send({ code: 'INVALID_COUNTRY', message: 'Only Panama is configured currently.' });
    }

    const updates = await readLatest('Panama');
    return { country: 'Panama', updates };
  });

  app.get('/api/compliance/history', async (req, reply) => {
    reply.header('cache-control', 'public, max-age=120');
    const query = req.query as { country?: string; limit?: string };
    if ((query.country || 'Panama') !== 'Panama') {
      return reply.code(400).send({ code: 'INVALID_COUNTRY', message: 'Only Panama is configured currently.' });
    }

    const limit = Number(query.limit || 50);
    const updates = await readHistory('Panama', Number.isFinite(limit) ? Math.min(limit, 200) : 50);
    return { country: 'Panama', updates };
  });

  app.post('/api/compliance/run', async (req, reply) => {
    const token = process.env.COMPLIANCE_RUN_TOKEN;
    const provided = String(req.headers['x-compliance-token'] || '');

    if (!token || provided !== token) {
      return reply.code(401).send({ code: 'UNAUTHORIZED', message: 'Invalid compliance token.' });
    }

    const traceId = randomUUID();
    const result = await runCompliancePipeline();
    return { ok: true, traceId, ...result };
  });

  return app;
};

const app = createApp();
if (process.env.NODE_ENV !== 'test') {
  app.listen({ port: Number(process.env.PORT || 3010), host: '0.0.0.0' });
}
