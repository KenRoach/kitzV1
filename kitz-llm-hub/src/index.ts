
import Fastify from 'fastify';
import { routeTask } from './router.js';
import { redact } from './redaction.js';

export const health = { status: 'ok' };
const app = Fastify();

app.post('/complete', async (req: any) => {
  const taskType = (req.body?.taskType || 'drafting') as 'drafting'|'summarizing'|'search';
  const prompt = redact(String(req.body?.prompt || ''));
  const provider = routeTask(taskType);
  return { provider, text: 'stub response for ' + taskType, prompt };
});

app.listen({ port: Number(process.env.PORT || 4010), host: '0.0.0.0' });
