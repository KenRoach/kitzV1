
import Fastify from 'fastify';

export const health = { status: 'ok' };
type Job = { idempotencyKey: string; channel: 'whatsapp' | 'email'; payload: unknown; attempts: number };
const app = Fastify();
const queue: Job[] = [];
const deadLetter: Job[] = [];
const seen = new Set<string>();

app.post('/enqueue', async (req: any, reply) => {
  const body = req.body as Omit<Job, 'attempts'>;
  if (seen.has(body.idempotencyKey)) return reply.code(202).send({ duplicate: true });
  seen.add(body.idempotencyKey);
  queue.push({ ...body, attempts: 0 });
  return { queued: true };
});

setInterval(() => {
  const job = queue.shift();
  if (!job) return;
  job.attempts += 1;
  const delivered = job.attempts > 1;
  if (!delivered && job.attempts < 3) queue.push(job);
  else if (!delivered) deadLetter.push(job);
}, 1000);

app.get('/dead-letter', async () => ({ deadLetter }));
app.listen({ port: Number(process.env.PORT || 3008), host: '0.0.0.0' });
