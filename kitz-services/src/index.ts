import Fastify from 'fastify';

export const health = { status: 'ok' };
const app = Fastify({ logger: true });

app.get('/', async () => ({
  service: 'kitz-services',
  hub: 'marketing + free AI business content'
}));

app.get('/content/free-guides', async () => ({
  guides: [
    { slug: 'lead-follow-up-basics', title: 'Lead Follow-up Basics' },
    { slug: 'manual-first-ops-playbook', title: 'Manual-first Ops Playbook' }
  ]
}));

app.get('/content/templates', async () => ({
  templates: [
    { kind: 'whatsapp', name: 'check-in-reminder' },
    { kind: 'email', name: 'invoice-follow-up' }
  ]
}));

app.listen({ port: Number(process.env.PORT || 3010), host: '0.0.0.0' });
