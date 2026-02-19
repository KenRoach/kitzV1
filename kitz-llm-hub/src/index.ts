import Fastify from 'fastify';
import { randomUUID } from 'node:crypto';
import { routeTask, type TaskType } from './router.js';
import { redact } from './redaction.js';
import { openai_codex } from './providers/openai_codex.js';
import { google_gemini } from './providers/google_gemini.js';
import { perplexity } from './providers/perplexity.js';
import { lovable } from './providers/lovable.js';
import { claude_code } from './providers/claude_code.js';

export const health = { status: 'ok' };
const app = Fastify({ logger: true });

app.post('/complete', async (req: any) => {
  const traceId = String(req.headers['x-trace-id'] || randomUUID());
  const taskType = (req.body?.taskType || 'drafting') as TaskType;
  const prompt = redact(String(req.body?.prompt || ''));
  const provider = routeTask(taskType);

  const response = provider === 'perplexity'
    ? await perplexity(prompt)
    : provider === 'google/gemini'
      ? await google_gemini(prompt)
      : provider === 'lovable'
        ? await lovable(prompt)
        : provider === 'anthropic/claude-code'
          ? await claude_code(prompt)
          : await openai_codex(prompt);

  return { ...response, taskType, traceId };
});

app.get('/health', async () => health);
app.listen({ port: Number(process.env.PORT || 4010), host: '0.0.0.0' });
